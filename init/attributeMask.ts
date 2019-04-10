/**
 * README:
 * build: tsc --lib es7 init/attributeMask.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/attributeMask.js
 */

import { AttributeMask } from "../output/model";

const masks = [
    {
        type: "布置",
        mask: 1,
    },
    {
        type: "造价",
        mask: 2,
    },
    {
        type: "施工",
        mask: 4,
    },
    {
        type: "销售",
        mask: 8,
    },
    {
        type: "运维",
        mask: 16,
    },
    {
        type: "商品",
        mask: 32,
    },
];

const todo = async () => {
    await AttributeMask.sync({ force: false });
    // for (const msk of masks) {
    //     await AttributeMask.create(msk);
    // }
    const result = await AttributeMask.bulkCreate(masks);
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
