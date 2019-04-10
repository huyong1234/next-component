import * as Joi from "joi";
import validate from "../utils/validate";
import { AttributeMask, Attribute, IAttributeOptions } from "../model";
import { Middleware } from "@nestsoft/koa-extended";

const _attrGroups = Attribute.getAttributeGroup();

export const listAttributeType: Middleware = async (ctx, next?) => {
    const result = await AttributeMask.getAttributeType();
    ctx.body = { code: 0, data: result, msg: "ok" };
};

export const listAttributeGroup: Middleware = (ctx, next?) => {
    // const result = Attribute.getAttributeGroup();
    ctx.body = { code: 0, data: _attrGroups, msg: "ok" };
};

const addAttrSchema = {
    name: Joi.string().required(),
    parameterName: Joi.string().required(),
    parameterGroup: Joi.any().valid(_attrGroups).required(),
    // parameterGroup: Joi.string().required(),
    parameterType: Joi.string().required(),
    attributeTypes: Joi.array().items(Joi.string()).required(),
    controlShape: Joi.string().required(),
    valueRange: Joi.object().keys({
        min: Joi.number(),
        max: Joi.number(),
        options: Joi.array(),
        customize: Joi.boolean(),
    }).and("min", "max").xor("options", "min"),
    fixed: Joi.boolean().required(),
    comment: Joi.string().required(),
};

export const addAttribute: Middleware = async (ctx, next?) => {
    const err = validate(ctx.request.body!, addAttrSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    try {
        await Attribute.addAttribute(<IAttributeOptions>ctx.request.body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const getAttrSchema = {
    parameterGroup: Joi.string(),
    attributeTypes: Joi.array().items(Joi.string()),
    parameterType: Joi.string(),
    name: Joi.string(),
    asc: Joi.any().valid(["name", "parameterGroup", "parameterType"]),
    desc: Joi.any().valid(["name", "parameterGroup", "parameterType"]),
    pageIndex: Joi.number(),
    pageSize: Joi.number(),
};
export const getAttribute: Middleware = async (ctx, next) => {
    let err;
    if (ctx.request.query) {
        err = validate(ctx.request.query, getAttrSchema);
    }
    if (err) {
        ctx.body = err;
        return;
    }
    const result = await Attribute.getAttribute(ctx.request.query);
    ctx.body = { code: 0, data: result, msg: "ok" };
};
