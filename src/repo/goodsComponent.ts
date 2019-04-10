// import { pick as Pick } from "lodash";
// import {
//     Models, Goods, GoodsGroupMap, Component, ComponentModelMap
// } from "../model";

// import * as TagOps from "./tagOperations";

// export interface IGoodsAttrOptions {
//     goodsId?: number;
//     componentId?: number;
//     goodsAttrs?: { [index: string]: number | string };
//     componentAttrs?: { [index: string]: number | string };
// }

// export const putGoodsAttribute = async (options: IGoodsAttrOptions) => {
//     const transaction = await Models.transaction();
//     try {
//         if ((options.goodsId !== undefined) && (options.goodsAttrs !== undefined)) {
//             await Goods.update(
//                 { attr: options.goodsAttrs },
//                 { where: { id: options.goodsId }, transaction: transaction }
//             );
//         }
//         if ((options.componentId !== undefined) && (options.componentAttrs !== undefined)) {
//             await Component.update(
//                 { attr: options.componentAttrs },
//                 { where: { id: options.componentId }, transaction: transaction }
//             );
//         }
//         // commit
//         await transaction.commit();
//     } catch (ex) {
//         // Rollback transaction if any errors were encountered
//         await transaction.rollback();
//         throw ex;
//     }
// };


// export const getGoods = async (options: {
//     owner: number, goodsId?: number, goodsIds?: number[]
// }) => {
//     const conditions = <{ owner: number, id: number | number[] }>{};
//     conditions.owner = options.owner;
//     if (options.goodsIds !== undefined) {
//         conditions.id = options.goodsIds;
//     } else if (options.goodsId !== undefined) {
//         conditions.id = options.goodsId;
//     }

//     const result = await Goods.findAll({
//         attributes: ["code", "name", "author", "status", "createdAt", "updatedAt"],
//         include: [{
//             model: Component,
//             attributes: [["id", "cid"], "classIds"],
//         }],
//         where: conditions,
//     });
//     return result;
// };


// export interface IAddGoodsOptions {
//     code: string;
//     name: string;
//     groupIds: number[];
//     classIds: number[];
//     tags?: string[];
//     pictures?: {
//         cadModel: string;
//         maxModel: string;
//         texture: string;
//         threeView: string;
//         nodeDiagram: string;
//         [index: string]: string;
//     };
//     owner: number;
//     author: string;
//     status: string;
// }

// export const addGoods = async (options: IAddGoodsOptions) => {
//     const transaction = await Models.transaction();
//     try {
//         // 创建“构件”
//         const componentToCreate = Pick(options, [
//             "name", "classIds", "tags", "owner", "author", "status",
//         ]);
//         const component = await Component.create(componentToCreate, { transaction });
//         const componentId = component.get("id");
//         // 创建“商品”
//         const goodsToCreate: {
//             code: string;
//             name: string;
//             tags?: string[];
//             owner: number;
//             author: string;
//             status: string;
//             componentId?: number;
//         } = Pick(options, [
//             "code", "name", "tags", "owner", "author", "status",
//         ]);
//         goodsToCreate.componentId = componentId;
//         // 创建goods,并且绑定goods与component
//         const goods = await Goods.create(goodsToCreate, { transaction });
//         const goodsId = goods.get("id");
//         // 没有必要多访问一次数据库
//         // await (<any>goods).setComponent(component, { transaction });

//         // 挂载goods到goodsGroup
//         const ggMap = [];
//         for (const gid of options.groupIds) {
//             ggMap.push({ groupId: gid, goodsId: goodsId });
//         }
//         await GoodsGroupMap.bulkCreate(ggMap, { transaction });
//         // const goodsGroups = await GoodsGroup.findAll({ transaction, where: { id: options.groupIds } });
//         // await (<any>goods).setGoodsGroups(goodsGroups, { transaction });

//         // 绑定component与model
//         const cmMap = [];
//         if (options.pictures) {
//             for (const key in options.pictures) {
//                 if (options.pictures[key]) {
//                     cmMap.push({ componentId: componentId, viewId: options.pictures[key], viewType: key });
//                 }
//             }
//         }
//         await ComponentModelMap.bulkCreate(cmMap, { transaction });

//         // 标签相关
//         if (options.tags && options.tags.length) {
//             await TagOps.addNewTag({
//                 owner: options.owner,
//                 goodsId: goodsId,
//                 componentId: componentId,
//                 tags: options.tags,
//                 transaction: transaction,
//             });
//         }
//         // commit
//         await transaction.commit();

//         // return
//         return goodsId;
//     } catch (ex) {
//         // Rollback transaction if any errors were encountered
//         await transaction.rollback();
//         throw ex;
//     }
// };
