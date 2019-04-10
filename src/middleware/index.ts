import config from "../config";
import { Middleware, IExtendedContext } from "@nestsoft/koa-extended";
import * as compose from "koa-compose";
import * as Boom from "boom";
import * as jwt from "koa-jwt";

//token判断
const checkToken: Middleware = async (ctx, next) => {
    if (ctx.query.token) {
        ctx.request.header.authorization = `Bearer ${ctx.query.token}`;
    }
    if (ctx.request.header.authorization) {
        return await jwt({ secret: config.get("JWTSecret"), key: "jwtData" })(ctx, next);
    }
    return await next();

};

//用户权限判断中间件
const checkCompanyUserMiddleware: Middleware = async (ctx, next) => {
    if (ctx.state.jwtData) {
        ctx.session = { ...ctx.session, ...ctx.state.jwtData };
    }
    if ((config.get("Global.ApiKey") !== undefined && ctx.request.header["x-apikey"] === config.get("Global").ApiKey) || (ctx.session && ctx.session.company)) {
        await next();
    } else {
        ctx.throw(Boom.notFound("not found 404"));
    }
};

export const checkUser: Middleware = compose<IExtendedContext>([checkToken, checkCompanyUserMiddleware]);


