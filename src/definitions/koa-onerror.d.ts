declare module "koa-onerror" {
  namespace onerror {
    export interface Options {
      text?: Function,
      json?: Function,
      html?: Function,
      redirect?: string,
      template?: string,
      accepts?: Function,
    }
  }
  function onerror(app: any, options?: onerror.Options): void;

  export = onerror;
}