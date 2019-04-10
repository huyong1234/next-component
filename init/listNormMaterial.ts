/**
 * README:
 * build: tsc --lib es7 init/listNormMaterial.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me"
 * CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/listNormMaterial.js
 */

import { MaterialItem } from "../output/model";

const attrs = [
    {
        code: "material-1",
        name: "人材机项目1",
        preview: ["/minio/material/preview"],
        category: "labor",
        provider: "a",
        pattern: "型号",
        format: "规格",
        brand: "品牌",
        series: "系列",
        unit: "km",
        loss: 0.1,
        price: {
            sell: 1,
            cost: 2,
        },
        comment: "备注",
        status: "active",
        owner: 9999,
        catalogId: 11,
    },
    {
        code: "material-2",
        name: "人材机项目2",
        preview: ["/minio/material/preview"],
        category: "stuff",
        provider: "a",
        pattern: "型号",
        format: "规格",
        brand: "品牌",
        series: "系列",
        unit: "km",
        loss: 0.1,
        price: {
            sell: 1,
            cost: 2,
        },
        comment: "备注",
        status: "active",
        owner: 9999,
        catalogId: 12,
    },
    {
        code: "material-3",
        name: "人材机项目3",
        preview: ["/minio/material/preview"],
        category: "machine",
        provider: "a",
        pattern: "型号",
        format: "规格",
        brand: "品牌",
        series: "系列",
        unit: "km",
        loss: 0.1,
        price: {
            sell: 1,
            cost: 2,
        },
        comment: "备注",
        status: "active",
        owner: 9999,
        catalogId: 13,
    },
    {
        code: "material-4",
        name: "人材机项目4",
        preview: ["/minio/material/preview"],
        category: "labor",
        provider: "a",
        pattern: "型号",
        format: "规格",
        brand: "品牌",
        series: "系列",
        unit: "km",
        loss: 0.1,
        price: {
            sell: 1,
            cost: 2,
        },
        comment: "备注",
        status: "active",
        owner: 9999,
        catalogId: 14,
    },
    {
        code: "material-5",
        name: "人材机项目5",
        preview: ["/minio/material/preview"],
        category: "stuff",
        provider: "a",
        pattern: "型号",
        format: "规格",
        brand: "品牌",
        series: "系列",
        unit: "km",
        loss: 0.1,
        price: {
            sell: 1,
            cost: 2,
        },
        comment: "备注",
        status: "active",
        owner: 9999,
        catalogId: 15,
    },
];

const todo = async () => {
    await MaterialItem.sync({ force: false });
    await MaterialItem.bulkCreate(attrs);
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
