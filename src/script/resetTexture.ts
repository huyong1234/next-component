// import { Textrue, TextureGroup } from "../model";
// import { OldTextrue, OldTag } from "./model";
// import Chalk from "chalk";
// const resetTags = async () => {
//     console.log(Chalk.yellow("resetTags start!"));// tslint:disable-line:no-console
//     try {
//         const project = await OldTag.findAll();
//         const data = project.map((item) => {
//             return {
//                 id: item.id,
//                 name: item.name,
//                 status: item.status,
//             };
//         });
//         const a = await Textrue.bulkCreate(data);
//     } catch (error) {
//         console.log("resetTags error===>:", error);// tslint:disable-line:no-console
//     }
// };
// const result = async () => {
//     console.log(Chalk.yellow("waiting..."));// tslint:disable-line:no-console
//     await Textrue.sync({ force: false });
//     await TextureGroup.sync({ force: false });
//     try {
//         let offset = 0;
//         do {
//             const project = await OldTextrue.findAll({ offset, limit: 100 });
//             offset = offset + project.length;
//             if (project.length === 0) {
//                 break;
//             }
//             const data = project.map((item) => {
//                 let type;
//                 if (item.attribute && item.attribute.property) {
//                     type = item.attribute.property;
//                 }
//                 const file: { src?: string } = {};
//                 if (item.images && item.images.length) {
//                     file.src = item.images[0];
//                 }
//                 return {
//                     type,
//                     file,
//                     id: item.id,
//                     name: item.name,
//                     attr: item.attribute,
//                     preview: item.preview,
//                     owner: item.owner,
//                     author: item.author,
//                     status: item.status,
//                 };
//             });
//             const a = await Textrue.bulkCreate(data);
//         } while (true);
//     } catch (error) {
//         console.log(111, error);// tslint:disable-line:no-console
//     }
// };
// result()
//     .then(() => {
//         console.log(Chalk.cyan("finished"));// tslint:disable-line:no-console
//         process.exit();
//     })
//     .catch((e) => {
//         console.log(Chalk.red(e));// tslint:disable-line:no-console
//     });
