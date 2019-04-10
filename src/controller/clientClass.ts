import * as Joi from "joi";
import validate from "../utils/validate";
import { ClassGroup, Version, AttributeVersion } from "../model";
import { Middleware } from "@nestsoft/koa-extended";
import { ClassAttrVersion, IClientClass } from "../repo";

const getClassAttributesSchema = {
    classVersionId: Joi.number(),
    classVersionIds: Joi.array().items(Joi.number()),
    specific: Joi.boolean(), // 去除重复属性
};

export const getClassAttributes: Middleware = async (ctx, next?) => {
    const query: { classVersionId?: number, classVersionIds?: number[], specific: boolean } = <any>ctx.request.query;
    const err = validate(query, getClassAttributesSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const result = await ClassAttrVersion.getClassAttributes(query);
    if (query.specific) {
        const data: {
            attributes: AttributeVersion[],
            specificIds?: { [index: number]: string }
        } = { attributes: [] };
        const specificIds: { [index: number]: string } = {};
        for (const attr of result) {
            if (attr.attributeId !== undefined) {
                if (specificIds[attr.attributeId] !== undefined) {
                    if (specificIds[attr.attributeId] === "specific") {
                        specificIds[attr.attributeId] = "common";
                    }
                    continue;
                }
                specificIds[attr.attributeId] = "specific";
                data.attributes.push(attr);
            }
        }
        data.specificIds = specificIds;
        ctx.body = { code: 0, data: data, msg: "ok" };
    } else {
        ctx.body = { code: 0, data: result, msg: "ok" };
    }
};

export const getClassTree: Middleware = async (ctx, next?) => {
    const versions = await Version.getVersion({ published: true });
    let result;
    if (versions.length > 0) {
        const lastestVersion = versions[0].get("version");
        result = await ClassAttrVersion.getClassTree(lastestVersion);
    } else {
        ctx.throw("Version is null");
    }
    ctx.body = { code: 0, data: result, msg: "ok" };

};

const addClientClassSchema = {
    name: Joi.string().required(),
    classId: Joi.number().required(),
    groupId: Joi.number().required(),
    order: Joi.string().required(),
    version: Joi.number().required(),
};

export const addClientClass: Middleware = async (ctx, next?) => {
    const err = validate(ctx.request.body!, addClientClassSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const clsGroup = await ClassGroup.getClassGroup({
        id: (<any>ctx.request.body).groupId,
        version: (<any>ctx.request.body).version,
    });
    if (clsGroup.length !== 1) {
        ctx.body = { code: 1001, msg: "error group id" };
        return;
    }
    try {
        await ClassAttrVersion.addClientClass(<IClientClass>ctx.request.body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const addClassGroupSchema = {
    name: Joi.string().required(),
    parentId: [null, Joi.number()],
    order: Joi.string().required(),
    version: Joi.number().required(),
};

export const addClassGroup: Middleware = async (ctx, next?) => {
    const err = validate(ctx.request.body!, addClassGroupSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    try {
        // 因为目前设计只有两个层级，所以创建父分类
        await ClassGroup.addClassGroup(<any>ctx.request.body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};
