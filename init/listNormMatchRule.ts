/**
 * README:
 * build: tsc --lib es7 init/listNormMatchRule.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me"
 * CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/listNormMatchRule.js
 */

import { MatchRule } from "../output/model";

const attrs = [
    {
        classId: 1,
        matchRule: { "op.mul": ["long", "width", "area"] },
        listNorm: [1, 2],
        comment: "Just for test 1",
        status: "active",
        owner: 9999,
        libId: 1,
    },
    {
        classId: 2,
        matchRule: { "op.mul": ["long", "width", "area"] },
        listNorm: [2, 3],
        comment: "Just for test 2",
        status: "active",
        owner: 9999,
        libId: 1,
    },
    {
        classId: 3,
        matchRule: { "op.mul": ["long", "width", "area"] },
        listNorm: [3, 4],
        comment: "Just for test 3",
        status: "active",
        owner: 9999,
        libId: 1,
    },
    {
        classId: 4,
        matchRule: { "op.mul": ["long", "width", "area"] },
        listNorm: [4, 5],
        comment: "Just for test 4",
        status: "active",
        owner: 9999,
        libId: 1,
    },

    // +++++++++++++++++++++++++++++++++++++++++++++++++
    {
        classId: 5,
        matchRule: { "op.mul": ["long", "width", "area"] },
        listNorm: [1, 2],
        comment: "Just for test 1",
        status: "active",
        owner: 9999,
        libId: 2,
    },
    {
        classId: 6,
        matchRule: { "op.mul": ["long", "width", "area"] },
        listNorm: [2, 3],
        comment: "Just for test 2",
        status: "active",
        owner: 9999,
        libId: 2,
    },
    {
        classId: 7,
        matchRule: { "op.mul": ["long", "width", "area"] },
        listNorm: [3, 4],
        comment: "Just for test 3",
        status: "active",
        owner: 9999,
        libId: 2,
    },
    {
        classId: 8,
        matchRule: { "op.mul": ["long", "width", "area"] },
        listNorm: [4, 5],
        comment: "Just for test 4",
        status: "active",
        owner: 9999,
        libId: 2,
    },
];

const todo = async () => {
    await MatchRule.sync({ force: false });
    await MatchRule.bulkCreate(attrs);
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
