/**
 * README:
 * build: tsc --lib es7 init/attributeVersion.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me"\
 * CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/attributeVersion.js
 */

import { AttributeVersion } from "../output/model";

const attrs = [
    {
        classVersionId: 1,
        attributeId: 1,
        order: "1",
        parameterGroup: "截面属性",
        parameterType: "number",
        attributeMask: 10,
        controlShape: "box",
        valueRange: { min: 10, max: 100 },
        fixed: false,
        version: 1,
    },
    {
        classVersionId: 1,
        attributeId: 2,
        order: "11",
        parameterGroup: "截面属性",
        parameterType: "number",
        attributeMask: 12,
        controlShape: "box",
        valueRange: { options: [10, 100] },
        fixed: false,
        version: 1,
    },
    {
        classVersionId: 2,
        attributeId: 2,
        order: "1",
        parameterGroup: "截面属性",
        parameterType: "number",
        attributeMask: 12,
        controlShape: "box",
        valueRange: { min: 10, max: 100 },
        fixed: false,
        version: 1,
    },
];

const todo = async () => {
    await AttributeVersion.sync({ force: false });
    // await AttributeVersion.bulkCreate(attrs);
    for (const attr of attrs) {
        await AttributeVersion.create(attr);
    }
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
