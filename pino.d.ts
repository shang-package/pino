declare module "pino" {
  interface logger {
    fatal(a:any, b?:any, c?:any, d?:any, e?:any, f?:any, g?:any, h?:any, i?:any, j?:any, k?:any) : void;
    error(a:any, b?:any, c?:any, d?:any, e?:any, f?:any, g?:any, h?:any, i?:any, j?:any, k?:any) : void;
    warn(a:any, b?:any, c?:any, d?:any, e?:any, f?:any, g?:any, h?:any, i?:any, j?:any, k?:any) : void;
    info(a:any, b?:any, c?:any, d?:any, e?:any, f?:any, g?:any, h?:any, i?:any, j?:any, k?:any) : void;
    debug(a:any, b?:any, c?:any, d?:any, e?:any, f?:any, g?:any, h?:any, i?:any, j?:any, k?:any) : void;
    trace(a:any, b?:any, c?:any, d?:any, e?:any, f?:any, g?:any, h?:any, i?:any, j?:any, k?:any) : void;
  }

  function pino(): logger;

  export = pino;
}