/**
 * README:
 * build: tsc --lib es7 init/listNormLibrary.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/listNormLibrary.js
 */

import { Library } from "../output/model";

const attrs = [
    {
        // id: 1
        name: "清单库1",
        type: "list",
        region: "上海",
        version: 1.0,
        comment: "Just for test.",
        status: "active",
        owner: 9999,
    },
    {
        // id: 2
        name: "定额库1",
        type: "norm",
        region: "上海",
        version: 1.0,
        comment: "Just for test.",
        status: "active",
        owner: 9999,
    },
    {
        // id: 3
        name: "计算库1",
        type: "calculate",
        region: "上海",
        version: 1.0,
        comment: "Just for test.",
        status: "active",
        owner: 9999,
    },
    {
        // id: 4
        name: "定额库2",
        type: "norm",
        region: "北京",
        version: 1.0,
        comment: "Just for test.",
        status: "active",
        owner: 9999,
    },
    {
        // id: 5
        name: "定额库2",
        type: "norm",
        region: "上海",
        version: 1.0,
        comment: "Just for test.",
        status: "active",
        owner: 9999,
    },
    {
        // id: 6
        name: "定额库3",
        type: "norm",
        region: "深圳",
        version: 1.0,
        comment: "Just for test.",
        status: "active",
        owner: 9999,
    },
    {
        // id: 7
        name: "人材机库1",
        type: "material",
        region: "苏州",
        version: 1.0,
        comment: "Just for test.",
        status: "active",
        owner: 9999,
    },
    {
        // id: 8
        name: "清单库1-1",
        type: "list",
        region: "上海",
        version: 2.0,
        baseLibrary: 1,
        comment: "Just for test.",
        status: "active",
        owner: 9999,
    },
];

const todo = async () => {
    await Library.sync({ force: false });
    await Library.bulkCreate(attrs);
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
