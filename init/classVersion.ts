/**
 * README:
 * build: tsc --lib es7 init/classVersion.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/classVersion.js
 */

import { ClassVersion, ClientClass, AttributeVersion } from "../output/model";

// ClassVersion.hasMany(AttributeVersion, { foreignKey: "classVersionId" });
// ClassVersion.belongsTo(ClientClass, { foreignKey: "clientClassId" });

const classes = [
    {
        clientClassId: 1,
        groupId: 1,
        order: "1",
        version: 1,
    },
    {
        clientClassId: 2,
        groupId: 1,
        order: "11",
        version: 1,
    },
    {
        clientClassId: 3,
        groupId: 1,
        order: "111",
        version: 1,
    },
    {
        clientClassId: 4,
        groupId: 1,
        order: "1111",
        version: 1,
    },
    {
        clientClassId: 5,
        groupId: 1,
        order: "11111",
        version: 1,
    },
    {
        clientClassId: 6,
        groupId: 1,
        order: "111111",
        version: 1,
    },
    {
        clientClassId: 7,
        groupId: 1,
        order: "1111111",
        version: 1,
    },
    {
        clientClassId: 8,
        groupId: 1,
        order: "11111111",
        version: 1,
    },
    {
        clientClassId: 9,
        groupId: 1,
        order: "111111111",
        version: 1,
    },
];

const todo = async () => {
    await ClassVersion.sync({ force: false });
    await ClientClass.sync({ force: false });
    await AttributeVersion.sync({ force: false });

    // await ClassVersion.bulkCreate(classes);
    for (const cls of classes) {
        await ClassVersion.create(cls);
    }

    // const result = await ClassVersion.findAll(
    //     {
    //         include: [
    //             {
    //                 model: ClientClass,
    //             },
    //             {
    //                 model: AttributeVersion,
    //             },
    //         ],
    //     }
    // );
    // console.log(JSON.stringify(result)); //tslint:disable-line: no-console
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
