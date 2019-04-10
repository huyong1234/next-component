/**
 * README:
 * build: tsc --lib es7 init/listItem.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/listItem.js
 */

import { ListItem } from "../output/model";

const attrs = [
    {
        code: "list-1",
        name: "清单项目1",
        unit: "km",
        featureDesc: "{长}",
        feature: [{ name: "长", parameterName: "long" }],
        jobs: "Just for test",
        status: "active",
        owner: 9999,
        catalogId: 1,
    },
    {
        code: "list-2",
        name: "清单项目2",
        unit: "km",
        featureDesc: "{宽}",
        feature: [{ name: "宽", parameterName: "width" }],
        jobs: "Just for test",
        status: "active",
        owner: 9999,
        catalogId: 2,
    },
    {
        code: "list-3",
        name: "清单项目3",
        unit: "km",
        featureDesc: "高",
        feature: [{ name: "高", parameterName: "heigh" }],
        jobs: "Just for test",
        status: "active",
        owner: 9999,
        catalogId: 3,
    },
    {
        code: "list-4",
        name: "清单项目4",
        unit: "个",
        featureDesc: "{数量}",
        feature: [{ name: "数量", parameterName: "amount" }],
        jobs: "Just for test",
        status: "active",
        owner: 9999,
        catalogId: 4,
    },
    {
        code: "list-5",
        name: "清单项目5",
        unit: "kg",
        featureDesc: "{重量}",
        feature: [{ name: "重量", parameterName: "weight" }],
        jobs: "Just for test",
        status: "active",
        owner: 9999,
        catalogId: 5,
    },
];

const todo = async () => {
    await ListItem.sync({ force: false });
    await ListItem.bulkCreate(attrs);
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
