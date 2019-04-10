// import * as Koa from "koa";
// import * as Joi from "joi";
// import validate from "../utils/validate";
// import { Rule, IRuleOptions } from "../model";
// import { Middleware } from "@nestsoft/koa-extended";

// const addRuleSchema = {
//     classId: Joi.string().required(),
//     rule: Joi.object().required(),
//     result: Joi.string().required(),
//     companyId: Joi.number().required(),
//     status: Joi.string(),
//     listNormId: Joi.array().items(Joi.string()).required(),
//     comment: Joi.string(),
// };

// export const addRule: Middleware = async (ctx, next?) => {
//     const err = validate(ctx.request.body!, addRuleSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     await Rule.addRule(<IRuleOptions>ctx.request.body);
//     ctx.body = { code: 0, msg: "ok" };
// };
