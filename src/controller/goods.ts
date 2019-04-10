// import { pick as Pick } from "lodash";
// import * as Joi from "joi";
// import validate from "../utils/validate";
// import { Version, GoodsGroup, IGoodsGroupOptions, IUpdateGroupOptions } from "../model";
// import { Middleware } from "@nestsoft/koa-extended";

// import { ClassAttrVersion, GoodsComponent, IAddGoodsOptions, IGoodsAttrOptions } from "../repo";

// const getGoodsSchema = {
//     goodsId: Joi.number(),
//     goodsIds: Joi.array().items(Joi.number()),
//     owner: Joi.number(),
// };

// export const getGoods: Middleware = async (ctx, next?) => {
//     const query = <{ goodsId?: number, goodsIds?: number[], owner: number }>ctx.request.query;
//     const err = validate(query, getGoodsSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     query.owner = ctx.session.company.companyId;
//     const goods = await GoodsComponent.getGoods(query);
//     ctx.body = { code: 0, data: goods, msg: "ok" };
// };

// const putGoodsAttrSchema = {
//     goodsId: Joi.number().required(),
//     attr: Joi.array().items(Joi.object().keys({
//         attributeId: Joi.number(),
//         name: Joi.string().required(),
//         value: [Joi.string(), Joi.number()],
//     })).required(),
//     owner: Joi.number(),
// };

// interface IGoodsAttribute {
//     attributeId?: number;
//     name: string;
//     value: string | number;
// }

// export const putGoodsAttribute: Middleware = async (ctx, next?) => {
//     const body = <{ goodsId: number, attr: IGoodsAttribute[], owner: number }>ctx.request.body;
//     const err = validate(body, putGoodsAttrSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     body.owner = ctx.session.company.companyId;
//     const goods = await GoodsComponent.getGoods({ owner: body.owner, goodsId: body.goodsId });
//     if (goods.length !== 1) {
//         ctx.body = { code: 1001, msg: "error goods id" };
//         return;
//     }
//     const cmpt = goods[0].get("Component");
//     // 如果商品有“构件”，则取得构件所有属性
//     let goodsAttr;
//     if (Object.prototype.toString.call(cmpt) !== "[object Null]") {
//         const classIds = cmpt.get("classIds");
//         goodsAttr = await ClassAttrVersion.getClassAttributes({ classVersionIds: classIds });
//     }

//     const attrToPut = <IGoodsAttrOptions>{};

//     // 把“商品”属性与“构件”属性分开
//     if (goodsAttr !== undefined) {
//         attrToPut.goodsId = body.goodsId;
//         attrToPut.componentId = cmpt.get("cid");
//         attrToPut.goodsAttrs = {};
//         attrToPut.componentAttrs = {};
//         for (const inputAttr of body.attr) {
//             if (inputAttr.attributeId === undefined) {
//                 attrToPut.goodsAttrs[inputAttr.name] = inputAttr.value;
//             } else {
//                 for (const attr of goodsAttr) {
//                     if ((inputAttr.attributeId === attr.attributeId)
//                         && attr.attributeTypes!.includes("商品")) {
//                         attrToPut.goodsAttrs[inputAttr.name] = inputAttr.value;
//                     } else {
//                         attrToPut.componentAttrs[inputAttr.name] = inputAttr.value;
//                     }
//                 }
//             }
//         }
//     } else {
//         attrToPut.goodsId = body.goodsId;
//         for (const inputAttr of body.attr) {
//             if (attrToPut.goodsAttrs === undefined) {
//                 attrToPut.goodsAttrs = {};
//             }
//             attrToPut.goodsAttrs[inputAttr.name] = inputAttr.value;
//         }
//     }
//     // end of body.attr

//     try {
//         const goodsId = await GoodsComponent.putGoodsAttribute(attrToPut);
//         ctx.body = { code: 0, msg: "ok" };
//     } catch (error) {
//         ctx.throw(error);
//     }
//     ctx.body = { code: 0, msg: "ok" };
// };

// const addGoodsSchema = {
//     code: Joi.string().required(),
//     name: Joi.string().required(),
//     groupIds: Joi.array().items(Joi.number()),
//     classIds: Joi.array().items(Joi.number()),
//     tags: Joi.array().items(Joi.string()),
//     pictures: Joi.object().keys({
//         cadModel: Joi.string(),
//         maxModel: Joi.string(),
//         texture: Joi.string(),
//         threeView: Joi.string(),
//         nodeDiagram: Joi.string(),
//     }),
// };

// export const addGoods: Middleware = async (ctx, next?) => {
//     const body = <IAddGoodsOptions>ctx.request.body;
//     const err = validate(body, addGoodsSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     body.owner = ctx.session.company.companyId;
//     body.author = "abc";
//     body.status = "creating";
//     try {
//         const goodsId = await GoodsComponent.addGoods(body);
//         ctx.body = { code: 0, data: { goodsId }, msg: "ok" };
//     } catch (error) {
//         ctx.throw(error);
//     }
// };

// const goodsGroupIdSchema = {
//     goodsGroupId: Joi.number().required(),
// };

// export const deleteGoodsGroup: Middleware = async (ctx, next?) => {
//     const body: { goodsGroupId: number } = <any>ctx.request.body;
//     const err = validate(body, goodsGroupIdSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     const currentOwner = ctx.session.company.companyId;
//     const groups = await GoodsGroup.getGoodsGroupTree(currentOwner, body.goodsGroupId);
//     if (groups.length !== 1) {
//         ctx.body = { code: 1001, msg: "error goods group id" };
//         return;
//     }

//     const toDeleteGroupIds = [];
//     for (const g1 of groups) {
//         toDeleteGroupIds.push(g1.get("id"));
//         const subGroups = g1.get("GoodsGroups");
//         if (subGroups.length) {
//             for (const g2 of subGroups) {
//                 toDeleteGroupIds.push(g2.get("id"));
//                 const ssubGroups = g2.get("GoodsGroups");
//                 if (ssubGroups.length) {
//                     for (const g3 of ssubGroups) {
//                         toDeleteGroupIds.push(g3.get("id"));
//                     }
//                 }
//             }
//         }
//     }
//     try {
//         await GoodsGroup.deleteGoodsGroup(toDeleteGroupIds);
//         ctx.body = { code: 0, msg: "ok" };
//     } catch (error) {
//         ctx.throw(error);
//     }
// };

// const moveGoodsGroupSchema = {
//     goodsGroupId: Joi.number().required(),
//     order: Joi.string().required(),
//     parentId: [null, Joi.number()],
// };

// // const moveGoodsGroupSchema = {
// //     goodsGroupId: Joi.number().required(),
// //     order: Joi.string().required(),
// //     parentId: Joi.number(),
// //     neighbor: Joi.array().items(Joi.string().required()).required(),
// // };

// export const moveGoodsGroup: Middleware = async (ctx, next?) => {
//     const body: { goodsGroupId: number, order: string, parentId?: number } = <any>ctx.request.body;
//     // const body: { goodsGroupId: number, order: string, parentId?: number, neighbor: string[] } = <any>ctx.request.body;
//     const err = validate(body, moveGoodsGroupSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     const currentOwner = ctx.session.company.companyId;

//     const groupIds = [body.goodsGroupId];
//     if (body.parentId !== undefined) {
//         groupIds.push(body.parentId);
//     }
//     const goodsGroup = await GoodsGroup.getGoodsGroup({ ids: groupIds, owner: currentOwner });
//     if (goodsGroup.length !== groupIds.length) {
//         ctx.body = { code: 1001, msg: "error goods group id or parent id" };
//         return;
//     }
//     // data.order = getOrder(body.neighbor[0], body.neighbor[1]);
//     const data: IUpdateGroupOptions = {
//         id: body.goodsGroupId, order: body.order,
//     };
//     if ((body.parentId !== undefined) || (Object.prototype.toString.call(body.parentId) === "[object Null]")) {
//         data.parentId = body.parentId;
//     }
//     try {
//         await GoodsGroup.updateGoodsGroup(data);
//         ctx.body = { code: 0, msg: "ok" };
//     } catch (error) {
//         ctx.throw(error);
//     }
// };

// const deleteBindedClassesSchema = {
//     goodsGroupId: Joi.number().required(),
//     toDeleteClassId: Joi.number().required(),
// };

// export const deleteBindedClasses: Middleware = async (ctx, next?) => {
//     const body: { goodsGroupId: number, toDeleteClassId: number } = <any>ctx.request.body;
//     const err = validate(body, deleteBindedClassesSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     const currentOwner = ctx.session.company.companyId;
//     const goodsGroup = await GoodsGroup.getGoodsGroup({ id: body.goodsGroupId, owner: currentOwner });
//     if (goodsGroup.length !== 1) {
//         ctx.body = { code: 1001, msg: "error goods group id" };
//         return;
//     }
//     try {
//         await GoodsGroup.deleteBindedClasses(body.goodsGroupId, body.toDeleteClassId);
//         ctx.body = { code: 0, msg: "ok" };
//     } catch (error) {
//         ctx.throw(error);
//     }
// };

// export const getBindedClasses: Middleware = async (ctx, next?) => {
//     const query: { goodsGroupId: number } = <any>ctx.request.query;
//     const err = validate(query, goodsGroupIdSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     const currentOwner = ctx.session.company.companyId;
//     const goodsGroup = await GoodsGroup.getGoodsGroup({ id: query.goodsGroupId, owner: currentOwner });
//     if (goodsGroup.length !== 1) {
//         ctx.body = { code: 1001, msg: "error goods group id" };
//         return;
//     }
//     const result = await ClassAttrVersion.getClassVersion({ ids: goodsGroup[0].classIds });
//     ctx.body = { code: 0, data: result, msg: "ok" };
// };

// const renameGoodsGroupSchema = {
//     goodsGroupId: Joi.number().required(),
//     groupName: Joi.string().required(),
// };

// export const renameGoodsGroup: Middleware = async (ctx, next?) => {
//     const body: { goodsGroupId: number, groupName: string } = <any>ctx.request.body;
//     const err = validate(body, renameGoodsGroupSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     const currentOwner = ctx.session.company.companyId;
//     const goodsGroup = await GoodsGroup.getGoodsGroup({ id: body.goodsGroupId, owner: currentOwner });
//     if (goodsGroup.length !== 1) {
//         ctx.body = { code: 1001, msg: "error goods group id" };
//         return;
//     }
//     try {
//         await GoodsGroup.updateGoodsGroup({ id: body.goodsGroupId, name: body.groupName });
//         ctx.body = { code: 0, msg: "ok" };
//     } catch (error) {
//         ctx.throw(error);
//     }
// };


// const updateBindedClassesSchema = {
//     goodsGroupId: Joi.number().required(),
//     classIds: Joi.array().items(Joi.number().required()).required(),
// };
// export const updateBindedClasses: Middleware = async (ctx, next?) => {
//     const body: { goodsGroupId: number, classIds: number[] } = <any>ctx.request.body;
//     const err = validate(body, updateBindedClassesSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }

//     const versions = await Version.getVersion({ published: true });
//     const lastestVersion = versions[0].get("version");
//     const classes = await ClassAttrVersion.getClassVersion({ version: lastestVersion, ids: body.classIds });
//     if (classes.length !== body.classIds.length) {
//         ctx.body = { code: 1001, msg: "error class ids" };
//         return;
//     }
//     const currentOwner = ctx.session.company.companyId;
//     const goodsGroup = await GoodsGroup.getGoodsGroup({ id: body.goodsGroupId, owner: currentOwner });
//     if (goodsGroup.length !== 1) {
//         ctx.body = { code: 1001, msg: "error goods group id" };
//         return;
//     }
//     try {
//         await GoodsGroup.updateGoodsGroup({ id: body.goodsGroupId, classIds: body.classIds });
//         ctx.body = { code: 0, msg: "ok" };
//     } catch (error) {
//         ctx.throw(error);
//     }
// };


// export const getGoodsGroupTree: Middleware = async (ctx, next?) => {
//     const owner = ctx.session.company.companyId;
//     const result = await GoodsGroup.getGoodsGroupTree(owner);
//     ctx.body = { code: 0, data: result, msg: "ok" };
// };

// const addGoodsGroupSchema = {
//     name: Joi.string().required(),
//     parentId: Joi.number(),
//     order: Joi.string().required(),
//     owner: Joi.number(),
// };

// export const addGoodsGroup: Middleware = async (ctx, next?) => {
//     const err = validate(ctx.request.body!, addGoodsGroupSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     const options = <IGoodsGroupOptions>(Pick(ctx.request.body, ["name", "parentId", "order"]));
//     options.owner = ctx.session.company.companyId;
//     if (options.parentId !== undefined) {
//         const parentGroup = await GoodsGroup.getGoodsGroup({ owner: options.owner, id: options.parentId });
//         if (parentGroup.length) {
//             options.classIds = parentGroup[0].classIds!;
//         }
//     } else {
//         options.classIds = [];
//     }
//     if (options.classIds === undefined) {
//         ctx.body = { code: 1001, msg: "error parent id" };
//         return;
//     }
//     try {
//         await GoodsGroup.addGoodsGroup(options);
//         ctx.body = { code: 0, msg: "ok" };
//     } catch (error) {
//         ctx.throw(error);
//     }
// };

// const getGoodsGroupSchema = {
//     id: Joi.number(),
//     parentId: Joi.number(),
//     owner: Joi.number(),
// };
// export const getGoodsGroup: Middleware = async (ctx, next?) => {
//     const err = validate(ctx.request.query, getGoodsGroupSchema);
//     if (err) {
//         ctx.body = err;
//         return;
//     }
//     ctx.request.query.owner = ctx.session.company.companyId;
//     const result = await GoodsGroup.getGoodsGroup(ctx.request.query);
//     ctx.body = { code: 0, data: result, msg: "ok" };
// };
