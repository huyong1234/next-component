import * as Joi from "joi";
import validate from "../utils/validate";
import { Version } from "../model";
import { Middleware } from "@nestsoft/koa-extended";

import { ClassAttrVersion, INewVersion } from "../repo";

const getVersionSchema = {
    version: Joi.number(),
    versions: Joi.array().items(Joi.string()),
    published: Joi.boolean(),
    clientVersion: Joi.number(),
    clientVersions: Joi.array().items(Joi.string()),
};
export const getVersion: Middleware = async (ctx, next?) => {
    const err = validate(ctx.request.query, getVersionSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    try {
        const result = await Version.getVersion(ctx.request.query);
        ctx.body = { code: 0, data: result, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const addVersionSchema = {
    newVersion: Joi.number().required(),
    publishedVersion: Joi.number().required(),
    comment: Joi.string(),
};

export const addVersion: Middleware = async (ctx, next?) => {
    const err = validate(ctx.request.body!, addVersionSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const body: INewVersion = <INewVersion>ctx.request.body;
    const result = await Version.getVersion({ versions: [body.newVersion, body.publishedVersion] });
    if ((result[0].get("version") === body.publishedVersion) && (result[0].get("published") === true)) {
        try {
            await ClassAttrVersion.newVersion(body);
            ctx.body = { code: 0, msg: "ok" };
        } catch (error) {
            ctx.throw(error);
        }
    } else {
        ctx.body = { code: 1000, msg: "error version numbers." };
    }
    // if (result.length === 0) {
    //     ctx.body = { code: 1000, msg: "published version not found." };
    // } else if (result.length === 2) {
    //     ctx.body = { code: 1000, msg: "new version exits." };
    // } else if (result[0].get("version") !== body.publishedVersion) {
    //     ctx.body = { code: 1000, msg: "error version numbers." };
    // } else {
    //     try {
    //         await ClassAttrVersion.newVersion(body);
    //         ctx.body = { code: 0, msg: "ok" };
    //     } catch (error) {
    //         ctx.throw(error);
    //     }
    // }
};
