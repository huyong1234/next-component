/**
 * README:
 * build: tsc --lib es7 init/attribute.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/attribute.js
 */

import { Attribute } from "../output/model";

const attrs = [
    {
        name: "长",
        parameterName: "long",
        parameterGroup: "截面属性",
        parameterType: "number",
        attributeMask: 6,
        controlShape: "box",
        valueRange: { min: 10, max: 100 },
        fixed: false,
        comment: "Just for test long attribute",
    },
    {
        name: "宽",
        parameterName: "kuan",
        parameterGroup: "截面属性",
        parameterType: "number",
        attributeMask: 12,
        controlShape: "box",
        valueRange: { options: [10, 100] },
        fixed: false,
        comment: "Just for test width attribute",
    },
    {
        name: "高",
        parameterName: "height",
        parameterGroup: "截面属性",
        parameterType: "number",
        attributeMask: 22,
        controlShape: "box",
        valueRange: { min: 10, max: 100 },
        fixed: false,
        comment: "Just for test height attribute",
    },
];

const todo = async () => {
    await Attribute.sync({ force: false });
    // await AttributeVersion.bulkCreate(attrs);
    for (const attr of attrs) {
        await Attribute.create(attr);
    }
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
