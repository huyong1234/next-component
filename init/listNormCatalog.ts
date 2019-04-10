/**
 * README:
 * build: tsc --lib es7 init/listNormCatalog.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/listNormCatalog.js
 */

import { Catalog } from "../output/model";

const attrs = [
    {
        // id : 1
        name: "清单 1章",
        parentId: null,
        order: "1",
        comment: "Just for test",
        owner: 9999,
        libId: 1,
    },
    {
        // id : 2
        name: "清单 2章",
        parentId: null,
        order: "11",
        comment: "Just for test",
        owner: 9999,
        libId: 1,
    },
    {
        // id : 3
        name: "清单 1.1节",
        parentId: 1,
        order: "1",
        comment: "Just for test",
        owner: 9999,
        libId: 1,
    },
    {
        // id : 4
        name: "清单 1.2节",
        parentId: 1,
        order: "11",
        comment: "Just for test",
        owner: 9999,
        libId: 1,
    },
    {
        // id : 5
        name: "清单 2.1节",
        parentId: 2,
        order: "1",
        comment: "Just for test",
        owner: 9999,
        libId: 1,
    },

    //+++++++++++++++++++++++++++++++++++++++++++
    {
        // id : 6
        name: "定额 1章",
        parentId: null,
        order: "1",
        comment: "Just for test",
        owner: 9999,
        libId: 2,
    },
    {
        // id : 7
        name: "定额 2章",
        parentId: null,
        order: "11",
        comment: "Just for test",
        owner: 9999,
        libId: 2,
    },
    {
        // id : 8
        name: "定额 1.1节",
        parentId: 6,
        order: "1",
        comment: "Just for test",
        owner: 9999,
        libId: 2,
    },
    {
        // id : 9
        name: "定额 1.2节",
        parentId: 6,
        order: "11",
        comment: "Just for test",
        owner: 9999,
        libId: 2,
    },
    {
        // id : 10
        name: "定额 2.1节",
        parentId: 7,
        order: "1",
        comment: "Just for test",
        owner: 9999,
        libId: 2,
    },

    //+++++++++++++++++++++++++++++++++++++++++++
    {
        // id : 11
        name: "人材机 1章",
        parentId: null,
        order: "1",
        comment: "Just for test",
        owner: 9999,
        libId: 7,
    },
    {
        // id : 12
        name: "人材机 2章",
        parentId: null,
        order: "11",
        comment: "Just for test",
        owner: 9999,
        libId: 7,
    },
    {
        // id : 13
        name: "人材机 1.1节",
        parentId: 11,
        order: "1",
        comment: "Just for test",
        owner: 9999,
        libId: 7,
    },
    {
        // id : 14
        name: "人材机 1.2节",
        parentId: 11,
        order: "11",
        comment: "Just for test",
        owner: 9999,
        libId: 7,
    },
    {
        // id : 15
        name: "人材机 2.1节",
        parentId: 12,
        order: "1",
        comment: "Just for test",
        owner: 9999,
        libId: 7,
    },
];

const todo = async () => {
    await Catalog.sync({ force: false });
    await Catalog.bulkCreate(attrs);
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
