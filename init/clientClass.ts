/**
 * README:
 * build: tsc --lib es7 init/clientClass.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/clientClass.js
 */

import { ClientClass } from "../output/model";

const clientClasses = [
    {
        // id: 1,
        name: "墙",
        typeId: 111,
        bigClass: false,
    },
    {
        // id: 2,
        name: "柱",
        typeId: 222,
        bigClass: false,
    },
    {
        // id: 3,
        name: "梁",
        typeId: 333,
        bigClass: false,
    },
    {
        // id: 4,
        name: "地梁",
        typeId: 444,
        bigClass: false,
    },
    {
        // id: 5,
        name: "板",
        typeId: 555,
        bigClass: false,
    },
    {
        // id: 6,
        name: "墙洞",
        typeId: 666,
        bigClass: false,
    },
    {
        // id: 7,
        name: "门扇",
        typeId: 777,
        bigClass: false,
    },
    {
        // id: 8,
        name: "套装门",
        typeId: 888,
        bigClass: false,
    },
    {
        // id: 9,
        name: "门套基层",
        typeId: 999,
        bigClass: false,
    },
];

const todo = async () => {
    await ClientClass.sync({ force: false });
    // await ClientClass.bulkCreate(clientClasses);
    for (const clientClass of clientClasses) {
        await ClientClass.create(clientClass);
    }
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
