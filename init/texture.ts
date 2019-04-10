/**
 * README:
 * build: tsc --lib es7 init/texture.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/texture.js
 */

import { Textrue } from "../output/model";

const attrs = [
    {
        id: "c48cd433-d8fc-471f-bbe4-2b414d8430f0",
        type: "材质",
        name: "白色瓷砖",
        attr: { long: 4, width: 5 },
        file: { url: "http://www.wahaha.com/file/c48cd433-d8fc-471f-bbe4-2b414d8430f0" },
        preview: ["http://www.wahaha.com/preview/c48cd433-d8fc-471f-bbe4-2b414d8430f0"],
        owner: 9999,
        author: "abc",
        status: "creating",
    },
    {
        id: "c48cd433-d8fc-471f-bbe4-2b414d8430f1",
        type: "材质1",
        name: "白色瓷砖1",
        attr: { long: 4, width: 5 },
        file: { url: "http://www.wahaha.com/file/c48cd433-d8fc-471f-bbe4-2b414d8430f0" },
        preview: ["http://www.wahaha.com/preview/c48cd433-d8fc-471f-bbe4-2b414d8430f0"],
        owner: 9999,
        author: "abc",
        status: "reviewed",
    },
    {
        id: "c48cd433-d8fc-471f-bbe4-2b414d8430f2",
        type: "材质2",
        name: "白色瓷砖2",
        attr: { long: 4, width: 5 },
        file: { url: "http://www.wahaha.com/file/c48cd433-d8fc-471f-bbe4-2b414d8430f0" },
        preview: ["http://www.wahaha.com/preview/c48cd433-d8fc-471f-bbe4-2b414d8430f0"],
        owner: 9999,
        author: "abc",
        status: "published",
    },
];

const todo = async () => {
    await Textrue.sync({ force: false });
    // await AttributeVersion.bulkCreate(attrs);
    for (const attr of attrs) {
        await Textrue.create(attr);
    }
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
