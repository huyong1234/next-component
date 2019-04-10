/**
 * README:
 * build: tsc --lib es7 init/classGroup.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/classGroup.js
 */
import { Op } from "sequelize";
import { ClassGroup, ClassVersion, ClientClass } from "../output/model";
import { isNull } from "util";

// ClassGroup.hasMany(ClassGroup, { foreignKey: "parentId", as: "subs" });
// ClassGroup.hasMany(ClassVersion, { foreignKey: "groupId", as: "items" });
// ClassVersion.belongsTo(ClientClass, { foreignKey: "clientClassId" });

const groups = [
    {
        // id: 1,
        name: "户型",
        // parentId: 0,
        order: "1",
        version: 1,
        clientClassId: 1,
    },
    {
        // id: 2,
        name: "硬装",
        // parentId: 0,
        order: "11",
        version: 1,
        clientClassId: 1,
    },
    {
        // id: 3,
        name: "软装",
        // parentId: 0,
        order: "111",
        version: 1,
        clientClassId: 1,
    },
    {
        // id: 4,
        name: "水电暖",
        // parentId: 0,
        order: "1111",
        version: 1,
        clientClassId: 1,
    },
    {
        // id: 5,
        name: "安消防",
        // parentId: 0,
        order: "11111",
        version: 1,
        clientClassId: 1,
    },
    {
        // id: 6,
        name: "多义构件",
        // parentId: 0,
        order: "111111",
        version: 1,
        clientClassId: 1,
    },
];

const todo = async () => {
    await ClassGroup.sync({ force: false });
    await ClassVersion.sync({ force: false });
    await ClientClass.sync({ force: false });
    // await ClassGroup.bulkCreate(groups);
    for (const group of groups) {
        await ClassGroup.create(group);
    }
    // const result = await ClassGroup.findAll(
    //     {
    //         include: [
    //             {
    //                 model: ClassGroup,
    //                 as: "subs",
    //                 include: [{
    //                     model: ClassVersion,
    //                     as: "items",
    //                     attributes: ["clientClassId"],
    //                     include: [{
    //                         model: ClientClass,
    //                         attributes: ["name", "classId"],
    //                     }],
    //                 }],
    //                 attributes: ["name", "parentId", "order", "version"],
    //             },
    //             {
    //                 model: ClassVersion,
    //                 as: "items",
    //                 attributes: ["clientClassId"],
    //                 include: [{
    //                     model: ClientClass,
    //                     attributes: ["name", "classId"],
    //                 }],
    //             },
    //         ],
    //         where: { parentId: null },
    //         attributes: ["name", "parentId", "order", "version"],
    //         order: [["order", "DESC"]],
    //         // raw: true,
    //     }
    // );
    // console.log(JSON.stringify(result)); // tslint:disable-line:no-console
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
