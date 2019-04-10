import { assign as Assign, pick as Pick, omit as Omit } from "lodash";
import * as Joi from "joi";
import validate from "../utils/validate";
import { Version, ComponentGroup, Component, IComponentGroupOptions, IUpdateComponentGroupOptions } from "../model";
import {
    ClassAttrVersion, ComponentOps, IAddComponentOptions,
    IApproveOptions, IComponentAttrOptions, IFilterComponentOptions
} from "../repo";
import { Middleware } from "@nestsoft/koa-extended";
import { getOssUploadConfig } from "../utils";

const componentIdSchema = {
    componentIds: Joi.array().items(Joi.number().required()).required(),
};
export const deprecateComponent: Middleware = async (ctx, next?) => {
    const body = <{ componentIds: number[] }>ctx.request.body;
    const err = validate(body, componentIdSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const components = await ComponentOps.getComponent({
        owner: currentOwner, componentIds: body.componentIds, status: "active",
    });
    if (components.length !== body.componentIds.length) {
        ctx.body = { code: 1001, msg: "Please check these components are active" };
        return;
    }
    try {
        await Component.updateComponent({ id: body.componentIds, status: "deprecated" });
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};


export const getApprover: Middleware = async (ctx, next?) => {
    const result = await ComponentOps.getApprover(ctx.session.company.companyId, "abc");
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const approveComponentSchema = {
    componentIds: Joi.array().items(Joi.number().required()).required(),
    opinion: Joi.string().required(),
    status: Joi.any().valid(["rejected", "active"]).required(),
    owner: Joi.number(),
};

export const approveComponent: Middleware = async (ctx, next?) => {
    const body = <IApproveOptions>ctx.request.body;
    const err = validate(body, approveComponentSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    body.owner = ctx.session.company.companyId;
    body.approver = "nestsoft";
    const result = await ComponentOps.getComponentWithModel({
        owner: body.owner,
        id: body.componentIds,
        // 只有pending状态，才能被审批
        status: "pending",
        attrNotNull: true,
    });
    if (result.length !== body.componentIds.length) {
        ctx.body = {
            code: 1001,
            msg: `Please check component's status is pending`,
        };
        return;
    }
    try {
        await ComponentOps.approveComponent(body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const publishComponentSchema = {
    componentIds: Joi.array().items(Joi.number().required()).required(),
    sharing: Joi.boolean(),
    owner: Joi.number(),
};
export const publishComponent: Middleware = async (ctx, next?) => {
    const body = <{
        componentIds: number[];
        sharing?: boolean;
        owner?: number;
    }>ctx.request.body;
    const err = validate(body, publishComponentSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    body.owner = ctx.session.company.companyId;
    const result = await ComponentOps.getComponentWithModel({
        owner: <any>body.owner,
        id: body.componentIds,
        // 只有以下三种状态的component，才能提交“上架”请求
        status: ["creating", "rejected", "deprecated"],
        attrNotNull: true,
    });
    // ctx.body = { code: 0, data: result, msg: "ok" };
    if (result.length !== body.componentIds.length) {
        ctx.body = {
            code: 1001,
            msg: `Please check components exist or not, or their attribute is null, or their status are ["creating", "rejected", "deprecated"]`,
        };
        return;
    }
    let hasModel = true;
    for (const cmpnt of result) {
        const models = cmpnt.get("ComponentModelMaps");
        if (models.length === 0) {
            hasModel = false;
            break;
        }
    }
    if (!hasModel) {
        ctx.body = { code: 1001, msg: `Please check components have models` };
        return;
    }
    try {
        let sharing = false;
        if (body.sharing === true) {
            sharing = body.sharing;
        }
        await ComponentOps.addApproval({
            componentIds: body.componentIds,
            sharing: sharing,
        });
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const filterComponentSchema = {
    search: Joi.string(),
    componentId: Joi.number(),
    componentIds: Joi.array().items(Joi.number()),
    groupId: Joi.number(),
    groupIds: Joi.array().items(Joi.number()),
    status: [Joi.string(), Joi.array().items(Joi.string())],
    classId: Joi.number(),
    classIds: Joi.array().items(Joi.number()),
    beginTime: Joi.date(),
    endTime: Joi.date(),
    tag: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    author: Joi.string(),
    begin: Joi.date(),
    end: Joi.date(),
    approver: Joi.string(),
    origin: Joi.number(),
    owner: Joi.number(),
};

export interface IExtendsComponentGroup extends ComponentGroup {
    count: number;
}

export const countComponentInGroup: Middleware = async (ctx, next?) => {
    const query = <IFilterComponentOptions>ctx.request.query;
    const err = validate(query, filterComponentSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    query.owner = ctx.session.company.companyId;
    const countMap = await ComponentOps.countComponentInGroup(query);
    const groups = await ComponentGroup.getComponentGroup(query);

    const result = [];
    for (const g of groups) {
        const tmp: IExtendsComponentGroup = <IExtendsComponentGroup>{};
        Assign(tmp, g, { count: 0 });
        for (const c of countMap) {
            if (tmp.id === c.id) {
                try {
                    tmp.count = parseInt(<any>c.count, 10);
                } catch (ex) {
                    console.error("[countComponentInGroup] parseInt error."); // tslint:disable-line:no-console
                }

                break;
            }
        }
        result.push(tmp);
    }
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const putComponentAttrSchema = {
    componentId: Joi.number().required(),
    attr: Joi.array().items(Joi.object().keys({
        attributeId: Joi.number(),
        name: Joi.string(),
        value: [Joi.string(), Joi.number()],
    }).xor("attributeId", "name")).required(),
    owner: Joi.number(),
};

interface IComponentAttribute {
    attributeId?: number;
    name?: string;
    value: string | number;
}

export const putComponentAttribute: Middleware = async (ctx, next?) => {
    const body = <{ componentId: number, attr: IComponentAttribute[], owner: number }>ctx.request.body;
    const err = validate(body, putComponentAttrSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    body.owner = ctx.session.company.companyId;
    const component = await ComponentOps.getComponent({ owner: body.owner, componentId: body.componentId });
    if (component.length !== 1) {
        ctx.body = { code: 1001, msg: "error component id" };
        return;
    }
    const classIds = component[0].get("classIds");
    const componentAttr = await ClassAttrVersion.getClassAttributes({ classVersionIds: classIds });
    const attrToPut = <IComponentAttrOptions>{};
    attrToPut.componentId = component[0].get("id");
    attrToPut.componentAttrs = {};
    // 传入的属性值校验，以后细化
    for (const inputAttr of body.attr) {
        if (inputAttr.attributeId === undefined && inputAttr.name !== undefined) {
            attrToPut.componentAttrs[inputAttr.name] = inputAttr.value;
        } else {
            for (const attr of componentAttr) {
                if (inputAttr.attributeId === attr.attributeId
                    && attrToPut.componentAttrs[attr.Attribute.parameterName] === undefined) {
                    attrToPut.componentAttrs[attr.Attribute.parameterName] = inputAttr.value;
                }
            }
        }
    }
    try {
        await ComponentOps.putComponentAttribute(attrToPut);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

export const getComponent: Middleware = async (ctx, next?) => {
    const query = <IFilterComponentOptions>ctx.request.query;
    const err = validate(query, filterComponentSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    query.owner = ctx.session.company.companyId;
    const component = await ComponentOps.getComponent(query);
    ctx.body = { code: 0, data: component, msg: "ok" };
};

const addComponentSchema = {
    code: Joi.string().required(),
    name: Joi.string().required(),
    preview: Joi.array().items(Joi.string().required()).required(),
    groupIds: Joi.array().items(Joi.number()).required(),
    classIds: Joi.array().items(Joi.number()).required(),
    tags: Joi.array().items(Joi.string()),
    models: Joi.object().keys({
        cadModel: Joi.string(),
        maxModel: Joi.string(),
        texture: Joi.string(),
        threeView: Joi.string(),
        nodeDiagram: Joi.string(),
    }),
};

export const addComponent: Middleware = async (ctx, next?) => {
    const body = <IAddComponentOptions>ctx.request.body;
    const err = validate(body, addComponentSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    body.owner = ctx.session.company.companyId;
    body.origin = body.owner;
    body.author = "abc";
    body.status = "creating";
    try {
        const componentId = await ComponentOps.addComponent(body);
        ctx.body = { code: 0, data: { componentId }, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const componentGroupIdSchema = {
    componentGroupId: Joi.number().required(),
};

export const deleteComponentGroup: Middleware = async (ctx, next?) => {
    const body: { componentGroupId: number } = <any>ctx.request.body;
    const err = validate(body, componentGroupIdSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const groups = await ComponentGroup.getComponentGroupTree(currentOwner, body.componentGroupId);
    if (groups.length !== 1) {
        ctx.body = { code: 1001, msg: "error component group id" };
        return;
    }

    const toDeleteGroupIds = [];
    for (const g1 of groups) {
        toDeleteGroupIds.push(g1.get("id"));
        const subGroups = g1.get("ComponentGroups");
        if (subGroups.length) {
            for (const g2 of subGroups) {
                toDeleteGroupIds.push(g2.get("id"));
                const ssubGroups = g2.get("ComponentGroups");
                if (ssubGroups.length) {
                    for (const g3 of ssubGroups) {
                        toDeleteGroupIds.push(g3.get("id"));
                    }
                }
            }
        }
    }
    try {
        await ComponentGroup.deleteComponentGroup(toDeleteGroupIds);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const updateComponentGroupSchema = {
    componentGroupId: Joi.number().required(),
    name: Joi.string(),
    order: Joi.string(),
    parentId: [null, Joi.number()],
};

export const updateComponentGroup: Middleware = async (ctx, next?) => {
    const body = <{
        componentGroupId: number;
        name?: string;
        order?: string;
        parentId?: null | number;
    }>ctx.request.body;
    const err = validate(body, updateComponentGroupSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const componentGroupIds: number[] = [body.componentGroupId];
    if (typeof body.parentId === "number") {
        componentGroupIds.push(body.parentId);
    }
    const componentGroup = await ComponentGroup.getComponentGroup({ ids: componentGroupIds, owner: currentOwner });
    if (componentGroup.length !== componentGroupIds.length) {
        ctx.body = { code: 1001, msg: "error component group id or parentId" };
        return;
    }
    const data: IUpdateComponentGroupOptions = { id: body.componentGroupId };
    Assign(data, Omit(body, "componentGroupId"));
    if (Object.keys(data).length === 1) {
        ctx.body = { code: 1001, msg: "There is nothing to update" };
        return;
    }
    try {
        await ComponentGroup.updateComponentGroup(data);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const componentGroupIdsSchema = {
    componentGroupId: Joi.number(),
    componentGroupIds: Joi.array().items(Joi.number()),
};

export const getBindedClasses: Middleware = async (ctx, next?) => {
    const query: { componentGroupId?: number, componentGroupIds?: number[] } = <any>ctx.request.query;
    const err = validate(query, componentGroupIdsSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    let ids: number[] = [];
    if (query.componentGroupId !== undefined) {
        ids = ids.concat(query.componentGroupId);
    } else if (query.componentGroupIds !== undefined) {
        ids = ids.concat(query.componentGroupIds);
    }
    const componentGroup = await ComponentGroup.getComponentGroup({ ids: ids, owner: currentOwner });
    if (componentGroup.length !== ids.length) {
        ctx.body = { code: 1001, msg: "error component group id" };
        return;
    }
    let classIds: number[] = [];
    for (const cg of componentGroup) {
        classIds = classIds.concat(cg.classIds!);
    }
    const result = await ClassAttrVersion.getClassVersion({ ids: Array.from(new Set(classIds)) });
    ctx.body = { code: 0, data: result, msg: "ok" };
};


const deleteBindedClassesSchema = {
    componentGroupId: Joi.number().required(),
    toDeleteClassId: Joi.number().required(),
};

export const deleteBindedClasses: Middleware = async (ctx, next?) => {
    const body: { componentGroupId: number, toDeleteClassId: number } = <any>ctx.request.body;
    const err = validate(body, deleteBindedClassesSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const componentGroup = await ComponentGroup.getComponentGroup({ id: body.componentGroupId, owner: currentOwner });
    if (componentGroup.length !== 1) {
        ctx.body = { code: 1001, msg: "error component group id" };
        return;
    }
    try {
        await ComponentGroup.deleteBindedClasses(body.componentGroupId, body.toDeleteClassId);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const updateBindedClassesSchema = {
    componentGroupId: Joi.number().required(),
    classIds: Joi.array().items(Joi.number().required()).required(),
};
export const updateBindedClasses: Middleware = async (ctx, next?) => {
    const body: { componentGroupId: number, classIds: number[] } = <any>ctx.request.body;
    const err = validate(body, updateBindedClassesSchema);
    if (err) {
        ctx.body = err;
        return;
    }

    const versions = await Version.getVersion({ published: true });
    const lastestVersion = versions[0].get("version");
    const classes = await ClassAttrVersion.getClassVersion({ version: lastestVersion, ids: body.classIds });
    if (classes.length !== body.classIds.length) {
        ctx.body = { code: 1001, msg: "error class ids" };
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const componentGroup = await ComponentGroup.getComponentGroup({ id: body.componentGroupId, owner: currentOwner });
    if (componentGroup.length !== 1) {
        ctx.body = { code: 1001, msg: "error component group id" };
        return;
    }
    try {
        await ComponentGroup.updateComponentGroup({ id: body.componentGroupId, classIds: body.classIds });
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

export const getComponentGroupTree: Middleware = async (ctx, next?) => {
    const owner = ctx.session.company.companyId;
    const result = await ComponentGroup.getComponentGroupTree(owner);
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const addComponentGroupSchema = {
    name: Joi.string().required(),
    parentId: Joi.number(),
    order: Joi.string().required(),
    owner: Joi.number(),
};

export const addComponentGroup: Middleware = async (ctx, next?) => {
    const err = validate(ctx.request.body!, addComponentGroupSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const options = <IComponentGroupOptions>(Pick(ctx.request.body, ["name", "parentId", "order"]));
    options.owner = ctx.session.company.companyId;
    if (options.parentId !== undefined) {
        const parentGroup = await ComponentGroup.getComponentGroup({ owner: options.owner, id: options.parentId });
        if (parentGroup.length) {
            options.classIds = parentGroup[0].classIds!;
        }
    } else {
        options.classIds = [];
    }
    if (options.classIds === undefined) {
        ctx.body = { code: 1001, msg: "error parent id" };
        return;
    }
    try {
        await ComponentGroup.addComponentGroup(options);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const getComponentGroupSchema = {
    id: Joi.number(),
    parentId: Joi.number(),
    owner: Joi.number(),
};
export const getComponentGroup: Middleware = async (ctx, next?) => {
    const err = validate(ctx.request.query, getComponentGroupSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    ctx.request.query.owner = ctx.session.company.companyId;
    const result = await ComponentGroup.getComponentGroup(ctx.request.query);
    ctx.body = { code: 0, data: result, msg: "ok" };
};
const uploadSchema = {
    name: Joi.string().required(),
};
export const uploadPreview: Middleware = async (ctx, next?) => {
    const body = <{ name: string }>ctx.request.query;
    const err = validate(body, uploadSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    try {
        const owner = ctx.session.company.companyId; //从session里面取
        const { name } = body;
        const data = await getOssUploadConfig("preview", owner, name);
        ctx.body = {
            data,
            code: 0,
            msg: "success",
        };
    } catch (error) {
        ctx.throw(error);
    }
};
