/**
 * README:
 * build: tsc --lib es7 init/goodsGroup.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/goodsGroup.js
 */
// import { GoodsGroup } from "../output/model";

// const groups = [
//     {
//         // id: 1,
//         name: "硬装",
//         // parentId: 0,
//         order: "1",
//         owner: 9999,
//         classIds: [],
//     },
//     {
//         // id: 2,
//         name: "家具",
//         // parentId: 0,
//         order: "11",
//         owner: 9999,
//         classIds: [],
//     },
//     {
//         // id: 3,
//         name: "灯饰",
//         // parentId: 0,
//         order: "111",
//         owner: 9999,
//         classIds: [],
//     },
//     // =========================
//     {
//         // id: 4,
//         name: "地面",
//         parentId: 1,
//         order: "1",
//         owner: 9999,
//         classIds: [],
//     },
//     {
//         // id: 5,
//         name: "墙面",
//         parentId: 1,
//         order: "11",
//         owner: 9999,
//         classIds: [],
//     },
//     // =========================
//     {
//         // id: 6,
//         name: "地砖",
//         parentId: 4,
//         order: "1",
//         owner: 9999,
//         classIds: [],
//     },
//     {
//         // id: 7,
//         name: "木地板",
//         parentId: 4,
//         order: "11",
//         owner: 9999,
//         classIds: [],
//     },
//     // =========================
//     {
//         // id: 8,
//         name: "墙砖",
//         parentId: 5,
//         order: "1",
//         owner: 9999,
//         classIds: [],
//     },
//     {
//         // id: 9,
//         name: "墙纸",
//         parentId: 5,
//         order: "11",
//         owner: 9999,
//         classIds: [],
//     },
//     {
//         // id: 10,
//         name: "墙漆",
//         parentId: 5,
//         order: "111",
//         owner: 9999,
//         classIds: [],
//     },
//     // =========================
//     {
//         // id: 11,
//         name: "沙发",
//         parentId: 2,
//         order: "1",
//         owner: 9999,
//         classIds: [],
//     },
//     // =========================
//     {
//         // id: 12,
//         name: "双人沙发",
//         parentId: 11,
//         order: "1",
//         owner: 9999,
//         classIds: [],
//     },
//     // =========================
//     {
//         // id: 13,
//         name: "吊灯",
//         parentId: 3,
//         order: "1",
//         owner: 9999,
//         classIds: [],
//     },
//     {
//         // id: 14,
//         name: "吸顶灯",
//         parentId: 3,
//         order: "11",
//         owner: 9999,
//         classIds: [],
//     },
//     // =========================
//     {
//         // id: 15,
//         name: "新分类",
//         order: "1111",
//         owner: 9999,
//         classIds: [],
//     },
// ];

// const todo = async () => {
//     await GoodsGroup.sync({ force: false });
//     for (const group of groups) {
//         await GoodsGroup.create(group);
//     }
//     console.log("wahaha"); // tslint:disable-line:no-console
// };

// if (require.main === module) {
//     todo();
// }
// export default todo;
