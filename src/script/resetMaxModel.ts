// // tslint:disable:no-console
// import { OldModel, OldTagSystemId } from "./model";

// import { ComponentGroup, Models, MaxModel, ComponentGroupModelMap, RenderMap, MaxModelInfo } from "../model";
// import Chalk from "chalk";
// import { Transaction } from "sequelize";
// interface IItems {
//     name?: string;
//     id?: number;
//     items?: IItems[];
//     image?: string;
//     viewType?: string;
//     parentsId?: number[];
// }
// const splitArray = (data: IItems[]) => {
//     const topArray: IItems[] = [];
//     const othersArray: IItems[] = [];
//     data.forEach((item) => {
//         if (item.parentsId && item.parentsId.length > 0) {
//             othersArray.push(item);
//         } else {
//             topArray.push(item);
//         }
//     });
//     return topArray.map((item) => {
//         item.items = arrayToJson(othersArray, item.id);
//         return item;
//     });
// };
// const arrayToJson = (tags: IItems[], parentId?: number) => {
//     const json: IItems[] = [];
//     let temp;
//     let obj: IItems;
//     tags.forEach((item) => {
//         item.parentsId!.forEach((id) => {
//             if (id === parentId) {
//                 obj = { id: item.id, name: item.name, image: item.image, viewType: item.viewType };
//                 temp = arrayToJson(tags, item.id);
//                 if (temp.length > 0) {
//                     obj.items = temp;
//                 }
//                 json.push(obj);
//             }
//         });
//     });
//     return uniqueArray(json);
// };
// const uniqueArray = (arr: IItems[]) => {
//     const res: IItems[] = [];
//     const json: { [key: string]: boolean } = {};
//     arr.forEach((item) => {
//         if (!json[item.name!]) {
//             res.push(item);
//             json[item.name!] = true;
//         }
//     });
//     return res;
// };
// const createComponentGroup = async (
//     tags: IItems[],
//     transaction: Transaction,
//     map: { [key: string]: { id: number, oldPid: number | undefined }[] },
//     pid?: number,
//     oldPid?: number
// ) => {
//     for (const tag of tags) {
//         const component = await ComponentGroup.create(
//             {
//                 name: tag.name,
//                 parentId: pid,
//                 order: "1",
//                 classIds: [],
//                 owner: -2,
//             },
//             {
//                 transaction,
//             }
//         );
//         if (map[tag.id!] !== undefined) {
//             map[tag.id!] = [{
//                 id: component.id!,
//                 oldPid: oldPid,
//             }];
//         } else {
//             map[tag.id!].push({
//                 id: component.id!,
//                 oldPid: oldPid,
//             });
//         }
//         if (tag.items && tag.items.length > 0) {
//             await createComponentGroup(tag.items, transaction, map, component.id, tag.id);
//         }
//     }
// };
// // const getTree = async (tags: ComponentGroup[]): Promise<IItems[]> => {
// //     const map: any = {};
// //     const data: IItems[] = [];
// //     for (const item of tags) {
// //         if (!map[item.id!]) {
// //             map[item.id!] = { id: item.id, name: item.name, items: [] };
// //         } else {
// //             map[item.id!].name = item.name;
// //         }
// //         if (item.parentId === null) {
// //             data.push(map[item.id!]);
// //             continue;
// //         }
// //         if (!map[item.parentId!]) {
// //             map[item.parentId!] = { id: item.parentId, items: [map[item.id!]], name: "" };
// //         } else {
// //             map[item.parentId!].items.push(map[item.id!]);
// //         }
// //     }
// //     return data;
// // };
// const getLastTags = (tree: IItems[], result: number[] = []) => {
//     for (const item of tree) {
//         if (item.items && item.items.length > 0) {
//             getLastTags(item.items, result);
//         } else {
//             result.push(item.id!);
//         }
//     }
//     return result;
// };
// (async () => {
//     console.log(Chalk.green("waiting..."));
//     // const models = await OldModel.findAll({});
//     // tslint:disable-next-line:no-console
//     const tags = await OldTagSystemId.findAll({
//         attributes: ["tagName", "viewType", "parentsId", "tagId", "createdAt"],
//         raw: true,
//     });
//     const tagInfo = tags.map((item) => {
//         const tag: { id?: number, name?: string, image?: string, parentsId?: number[], viewType?: string } = {};
//         tag.id = item.tagId;
//         tag.name = item.tagName;
//         tag.parentsId = item.parentsId;
//         tag.viewType = item.viewType;
//         return tag;
//     });
//     const transaction = await Models.transaction();
//     const tagMap: { [key: string]: { id: number, oldPid: number | undefined }[] } = {};
//     try {
//         const tree = splitArray(tagInfo);
//         const lastTags = getLastTags(tree);
//         console.log(Chalk.green("set tags"));
//         await createComponentGroup(tree, transaction, tagMap);
//         const models = await OldModel.findAll({});
//         /*
//         tag 没处理
//         componentGroup没存默认渲染视角
//         dwgpath没处理
//         */
//         const modelList = [];
//         const newTag = [];
//         const renderInfo = [];
//         for (const model of models) {
//             //
//             let status: string;
//             switch (model.status) {
//                 case "active":
//                     status = "modelActive";
//                     break;
//                 case "invalid":
//                     status = "modelInvalid";
//                     break;
//                 case "auditing":
//                     status = "modelAuditing";
//                     break;
//                 case "creating":
//                 default:
//                     switch (model.renderStatus) {
//                         case "waiting":
//                             status = "renderWaiting";
//                             break;
//                         case "preparing":
//                             status = "renderPreparing";
//                             break;
//                         case "rendering":
//                             status = "rendering";
//                             break;
//                         case "done":
//                             status = "modelAuditing";
//                             break;
//                         case "failed":
//                             status = "renderFailed";
//                             break;
//                         case "canceled":
//                             status = "renderCanceled";
//                             break;
//                         case "creating":
//                             status = "renderCreating";
//                             break;
//                         case "waitingParts":
//                             status = "renderWaitingParts";
//                             break;
//                         default:
//                             switch (model.parseStatus) {
//                                 case "waiting":
//                                     status = "parseWaiting";
//                                     break;
//                                 case "preparing":
//                                     status = "parseWaiting";
//                                     break;
//                                 case "rendering":
//                                     status = "parsing";
//                                     break;
//                                 case "done":
//                                     status = "renderCreating";
//                                     break;
//                                 case "failed":
//                                     status = "parseFailed";
//                                     break;
//                                 default:
//                                     status = "uploadCreating";
//                                     break;
//                             }
//                             break;
//                     }
//                     break;
//             }
//             const modelTags = model.info!.tag;
//             // tslint:disable-next-line:no-unused-expression
//             const _lastTags = modelTags.filter((tag) => {
//                 return lastTags.includes(tag);
//             });
//             newTag.push({
//                 last: _lastTags,
//                 all: modelTags,
//             });
//             //max model
//             modelList.push({
//                 name: model.name,
//                 type: "max",
//                 attr: {
//                     // size:
//                     fileSize: model.fileSize,
//                     //webjson:
//                     //direction:
//                 },
//                 file: {
//                     url: model.maxFilePath,
//                 },
//                 // preview: [],
//                 owner: model.owner,
//                 author: model.author,
//                 status: status,
//             });
//             //render model
//             modelList.push({
//                 name: model.name,
//                 type: "render",
//                 attr: {
//                     size: model.attribute && model.attribute.size ? model.attribute.size : null,
//                     // fileSize:
//                     //webjson:
//                     axisposition: model.maxAxisPosition,
//                     direction: model.direction,
//                 },
//                 file: {
//                     url: model.file && model.file.url ? model.file.url : null,
//                 },
//                 preview: model.preview,
//                 owner: model.owner,
//                 author: model.author,
//                 status: status,
//             });
//             renderInfo.push({
//                 taskId: model.taskId,
//                 renderStatus: model.renderStatus,
//             });
//             //web model
//             modelList.push({
//                 name: model.name,
//                 type: "web",
//                 attr: {
//                     // size: model.attribute && model.attribute.size ? model.attribute.size : null,
//                     // fileSize:

//                     webjson: model.webJson,
//                     // direction: model.direction,
//                 },
//                 file: {
//                     // url: model.file && model.file.url ? model.file.url : null,
//                 },
//                 // preview: model.preview,
//                 owner: model.owner,
//                 author: model.author,
//                 status: status,
//             });
//         }
//         console.log(Chalk.green("set models"));
//         const newModels = await MaxModel.bulkCreate(modelList, { transaction, individualHooks: true });
//         const modelGroupMap = [];
//         for (let i = 0; i < newTag.length; i++) {
//             const _tags = newTag[i];
//             const modelIndex = i * 3;
//             for (let j = modelIndex; j < modelIndex + 3; j++) {
//                 for (const _tag of _tags.last) {
//                     const groupIdInfo = tagMap[_tag];
//                     if (groupIdInfo.length === 1) {
//                         modelGroupMap.push({
//                             groupId: groupIdInfo[0].id,
//                             modelId: newModels[j].id,
//                         });
//                     } else {
//                         for (const item of groupIdInfo) {
//                             if (_tags.all.includes(item.oldPid!)) {
//                                 modelGroupMap.push({
//                                     groupId: item.id,
//                                     modelId: newModels[j].id,
//                                 });
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//         console.log(Chalk.green("set model group map"));
//         await ComponentGroupModelMap.bulkCreate(modelGroupMap, { transaction });
//         console.log(Chalk.green("set render map"));
//         const info = renderInfo.map((value, index) => {
//             const result: { taskId?: string; relateId?: string; renderStatus?: string } = { ...value };
//             const modelIndex = index * 3 + 1;
//             result.relateId = newModels[modelIndex].id;
//             return result;
//         });
//         await RenderMap.bulkCreate(info, { transaction });
//         console.log(Chalk.green("set model info"));
//         const modelInfo = [];
//         for (let i = 0; i < newModels.length; i += 3) {
//             modelInfo.push({
//                 id: newModels[i + 1].id,
//                 targetId: newModels[i].id,
//                 type: "max",
//             });
//             modelInfo.push({
//                 id: newModels[i + 1].id,
//                 targetId: newModels[i + 2].id,
//                 type: "web",
//             });
//         }
//         await MaxModelInfo.bulkCreate(modelInfo, { transaction });
//         await transaction.commit();
//         console.log(Chalk.green("finish..."));
//         process.exit();
//     } catch (e) {
//         console.log(Chalk.red(e.message));
//         console.log(Chalk.red("clearing data"));
//         transaction.rollback();
//         process.exit();
//     }
// })();
