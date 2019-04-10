/**
 * README:
 * build: tsc --lib es7 init/listNormItem.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/listNormItem.js
 */

import { NormItem } from "../output/model";

const attrs = [
    {
        code: "norm-1",
        name: "定额项目1",
        unit: "km",
        loss: 0.1,
        price: {
            sell: { labor: 1, stuff: 2, machine: 3 },
            cost: { labor: 1, stuff: 2, machine: 3 },
        },
        featureDesc: "{长}",
        feature: [{ name: "长", parameterName: "long" }],
        jobs: "Just for test",
        status: "active",
        owner: 9999,
        catalogId: 6,
    },
    {
        code: "norm-2",
        name: "定额项目2",
        unit: "km",
        loss: 0.1,
        price: {
            sell: { labor: 1, stuff: 2, machine: 3 },
            cost: { labor: 1, stuff: 2, machine: 3 },
        },
        featureDesc: "{宽}",
        feature: [{ name: "宽", parameterName: "width" }],
        jobs: "Just for test",
        status: "active",
        owner: 9999,
        catalogId: 7,
    },
    {
        code: "norm-3",
        name: "定额项目3",
        unit: "km",
        loss: 0.1,
        price: {
            sell: { labor: 1, stuff: 2, machine: 3 },
            cost: { labor: 1, stuff: 2, machine: 3 },
        },
        featureDesc: "高",
        feature: [{ name: "高", parameterName: "heigh" }],
        jobs: "Just for test",
        status: "active",
        owner: 9999,
        catalogId: 8,
    },
    {
        code: "norm-4",
        name: "定额项目4",
        unit: "km",
        loss: 0.1,
        price: {
            sell: { labor: 1, stuff: 2, machine: 3 },
            cost: { labor: 1, stuff: 2, machine: 3 },
        },
        featureDesc: "{数量}",
        feature: [{ name: "数量", parameterName: "amount" }],
        jobs: "Just for test",
        status: "active",
        owner: 9999,
        catalogId: 9,
    },
    {
        code: "norm-5",
        name: "定额项目5",
        unit: "km",
        loss: 0.1,
        price: {
            sell: { labor: 1, stuff: 2, machine: 3 },
            cost: { labor: 1, stuff: 2, machine: 3 },
        },
        featureDesc: "{重量}",
        feature: [{ name: "重量", parameterName: "weight" }],
        jobs: "Just for test",
        status: "active",
        owner: 9999,
        catalogId: 10,
    },
];

const todo = async () => {
    await NormItem.sync({ force: false });
    await NormItem.bulkCreate(attrs);
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
