#! /usr/bin/env node

'use strict'

var split = require('split2')
var Parse = require('fast-json-parse')
var chalk = require('chalk')

var levels = {
  default: 'USERLVL',
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN',
  30: 'INFO',
  20: 'DEBUG',
  10: 'TRACE'
}

var standardKeys = [
  'pid',
  'hostname',
  'name',
  'level',
  'msg',
  'time',
  'v'
]

function withSpaces (value) {
  var lines = value.split('\n')
  for (var i = 1; i < lines.length; i++) {
    lines[i] = '    ' + lines[i]
  }
  return lines.join('\n')
}

function filter (value) {
  var keys = Object.keys(value)
  var result = ''

  for (var i = 0; i < keys.length; i++) {
    if (standardKeys.indexOf(keys[i]) < 0) {
      result += '    ' + keys[i] + ': ' + withSpaces(JSON.stringify(value[keys[i]], null, 2)) + '\n'
    }
  }

  return result
}

function isPinoLine (line) {
  return line &&
    line.hasOwnProperty('hostname') &&
    line.hasOwnProperty('pid') &&
    (line.hasOwnProperty('v') && line.v === 1)
}

function pretty (opts) {
  var timeTransOnly = opts && opts.timeTransOnly
  var formatter = opts && opts.formatter
  var levelFirst = opts && opts.levelFirst
  var dateFormatter = opts && opts.dateFormatter

  var stream = split(mapLine)
  var ctx
  var levelColors

  var pipe = stream.pipe

  stream.pipe = function (dest, opts) {
    ctx = new chalk.constructor({
      enabled: !!(chalk.supportsColor && dest.isTTY)
    })

    levelColors = {
      default: ctx.white,
      60: ctx.bgRed,
      50: ctx.red,
      40: ctx.yellow,
      30: ctx.green,
      20: ctx.blue,
      10: ctx.grey
    }

    pipe.call(stream, dest, opts)
  }

  return stream

  function mapLine (line) {
    var parsed = new Parse(line)
    var value = parsed.value

    if (parsed.err || !isPinoLine(value)) {
      // pass through
      return line + '\n'
    }

    if (formatter) {
      return opts.formatter(parsed.value) + '\n'
    }

    if (timeTransOnly) {
      if (timeTransOnly === 'local') {
        value.time = asLocaleDate(value.time)
      } else {
        value.time = asISODate(value.time)
      }
      return JSON.stringify(value) + '\n'
    }

    line = (levelFirst)
        ? asColoredLevel(value) + ' [' + formatDate(value.time) + ']'
        : '[' + formatDate(value.time) + '] ' + asColoredLevel(value)

    if (value.name) {
      line += ' ('
      line += value.name

      if (opts.pidAndHostname) {
        line += '/' + value.pid + ' on ' + value.hostname
      }

      line += ')'
    }

    line += ': '

    if (value.msg) {
      if (opts.sameLevelColorMessage) {
        line += levelColors[value.level](value.msg)
      } else {
        line += ctx.cyan(value.msg)
      }
    }
    line += '\n'
    if (value.type === 'Error') {
      line += '    ' + withSpaces(value.stack) + '\n'
    } else {
      line += filter(value)
    }
    return line
  }

  function asColoredLevel (value) {
    if (levelColors.hasOwnProperty(value.level)) {
      return levelColors[value.level](levels[value.level])
    } else {
      return levelColors.default(levels.default)
    }
  }

  function formatDate (time) {
    if (!dateFormatter) {
      return time
    }

    return dateFormatter === 'local' ? asLocaleDate(time) : asISODate(time)
  }
}

module.exports = pretty

if (require.main === module) {
  if (arg('-h') || arg('--help')) {
    usage().pipe(process.stdout)
  } else if (arg('-v') || arg('--version')) {
    console.log(require('./package.json').version)
  } else {
    process.stdin.pipe(pretty({
      timeTransOnly: arg('-t'),
      levelFirst: arg('-l')
    })).pipe(process.stdout)
  }
}

function usage () {
  return require('fs')
    .createReadStream(require('path').join(__dirname, 'usage.txt'))
}

function arg (s) {
  return !!~process.argv.indexOf(s)
}

function formatDate (fmt, date) {
  date = date || new Date()
  var o = {
    '(y+)': date.getFullYear(),
    '(M+)': date.getMonth() + 1, // 月份
    '(d+)': date.getDate(), // 日
    '(h+)': date.getHours(), // 小时
    '(m+)': date.getMinutes(), // 分
    '(s+)': date.getSeconds(), // 秒
    '(q+)': Math.floor((date.getMonth() + 3) / 3), // 季度
    '(S+)': date.getMilliseconds() // 毫秒
  }

  for (var k in o) {
    if (new RegExp(k).test(fmt)) {
      fmt = fmt.replace(RegExp.$1, ('00' + o[k]).substr(-RegExp.$1.length))
    }
  }
  return fmt
}

function asISODate (time) {
  return new Date(time).toISOString()
}

function asLocaleDate (time) {
  return formatDate('yyyy/MM/dd hh:mm:ss:SSS', new Date(time))
}
