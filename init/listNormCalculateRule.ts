/**
 * README:
 * build: tsc --lib es7 init/listNormCalculateRule.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me"
 * CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/listNormCalculateRule.js
 */

import { CalculateRule } from "../output/model";

const attrs = [
    {
        name: "计算规则1",
        classId: 1,
        matchRule: { "op.mul": ["long", "width", "area"] },
        calculateRule: { "op.mul": ["long", "width", "area"] },
        unit: "km",
        comment: "Just for test 1",
        status: "active",
        owner: 9999,
        libId: 3,
    },
    {
        name: "计算规则2",
        classId: 2,
        matchRule: { "op.mul": ["long", "width", "area"] },
        calculateRule: { "op.mul": ["long", "width", "area"] },
        unit: "km",
        comment: "Just for test 2",
        status: "active",
        owner: 9999,
        libId: 3,
    },
    {
        name: "计算规则3",
        classId: 3,
        matchRule: { "op.mul": ["long", "width", "area"] },
        calculateRule: { "op.mul": ["long", "width", "area"] },
        unit: "km",
        comment: "Just for test 3",
        status: "active",
        owner: 9999,
        libId: 3,
    },
    {
        name: "计算规则4",
        classId: 4,
        matchRule: { "op.mul": ["long", "width", "area"] },
        calculateRule: { "op.mul": ["long", "width", "area"] },
        unit: "km",
        comment: "Just for test 4",
        status: "active",
        owner: 9999,
        libId: 3,
    },
];

const todo = async () => {
    await CalculateRule.sync({ force: false });
    await CalculateRule.bulkCreate(attrs);
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
