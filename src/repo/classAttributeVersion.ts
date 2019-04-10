import { assign as Assign, pick as Pick, omit as Omit } from "lodash";
import { Models, ClassGroup, ClientClass, ClassVersion, AttributeMask, Attribute, AttributeVersion, Version } from "../model";

export interface IExtendsAttributeVersion extends AttributeVersion {
    Attribute: {
        name: string;
        parameterName: string;
        comment: string;
    };
}

export const getClassAttributes = async (options: { classVersionId?: number, classVersionIds?: number[] }) => {
    let classVersionId: number | number[] = -1;
    if (options.classVersionIds !== undefined) {
        classVersionId = options.classVersionIds;
    } else if (options.classVersionId !== undefined) {
        classVersionId = options.classVersionId;
    }
    const attributes = await AttributeVersion.findAll(
        {
            include: [{ model: Attribute, attributes: ["name", "parameterName", "comment"] }],
            where: { classVersionId: classVersionId },
        }
    );
    const attrMaskList = await AttributeMask.getAttributeMask();
    const result: IExtendsAttributeVersion[] = [];
    for (const attr of attributes) {
        const attributeTypes = [];
        const attributeMask: number = attr.get("attributeMask");
        for (const attrMaskObj of attrMaskList) {
            const msk: number = attrMaskObj.mask!;
            if (attributeMask & msk) { // tslint:disable-line:no-bitwise
                attributeTypes.push(attrMaskObj.type);
            }
        }
        const tmp: IExtendsAttributeVersion = <IExtendsAttributeVersion>{};
        result.push(Assign(tmp, Omit(attr.get(), "attributeMask"), { attributeTypes: attributeTypes }));
    }
    return result;
};


export interface IGetClassVersion {
    id?: number;
    ids?: number[];
    version?: number;
}

export const getClassVersion = async (options?: IGetClassVersion) => {
    let conditions: { id?: number | number[], version?: number } = {};
    if (options) {
        conditions = Pick(options, ["id", "version"]);
        if (options.ids) {
            conditions.id = options.ids;
        }
    }
    const result = await ClassVersion.findAll(
        {
            include: [{ model: ClientClass, attributes: ["name"] }],
            attributes: ["id", "groupId", "order", "version"],
            where: <any>conditions,
            // raw: true,
        }
    );
    return result;
};

export const getClassTree = async (version: number) => {
    const result = await ClassGroup.findAll({
        include: [{
            model: ClassVersion,
            as: "items",
            attributes: ["id", "order"],
            include: [{
                model: ClientClass,
                attributes: ["name"],
            }],
        }],
        where: { parentId: null, version: version },
        attributes: ["id", "name", "parentId", "order", "version"],
        order: [["order", "ASC"]],
    });
    return result;
};

export interface IClientClass {
    name: string;
    classId: number;
    groupId: number;
    order: number;
    version: number;
}

export const addClientClass = async (options: IClientClass) => {
    const transaction = await Models.transaction();
    try {
        // 创建“类”
        const cliClass = await ClientClass.create({ name: options.name, classId: options.classId }, { transaction });

        // 创建“类版本”
        await ClassVersion.create(
            {
                clientClassId: cliClass.get("id"),
                groupId: options.groupId,
                order: options.order,
                version: options.version,
            },
            {
                transaction,
            }
        );
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

// let transaction;
// try {
//     // get transaction
//     transaction = await sequelize.transaction();
//     // step 1
//     await Model.destroy({ where: { id }, transaction });
//     // step 2
//     await Model.create({}, { transaction });
//     // commit
//     await transaction.commit();
// } catch (err) {
//     // Rollback transaction if any errors were encountered
//     await transaction.rollback();
// }

export interface INewVersion {
    newVersion: number;
    publishedVersion: number;
    comment: string;
}

export const newVersion = async (options: INewVersion) => {
    const transaction = await Models.transaction();
    try {
        // 创建新的版本号
        await Version.create(
            { version: options.newVersion, published: false, comment: options.comment, baseVersion: options.publishedVersion },
            { transaction }
        );

        // 获取已发布版本的数据
        const classGroups = await ClassGroup.findAll(
            {
                include: [{
                    model: ClassVersion,
                    as: "items",
                    attributes: ["clientClassId", "order"],
                    include: [{
                        model: AttributeVersion,
                        attributes: [
                            "attributeId", "order", "parameterGroup", "parameterType", "attributeMask", "controlShape", "valueRange", "fixed",
                        ],
                    }],
                }],
                attributes: [
                    "name",
                    // "parentId", // 目前设计没有用到parentId, 所以都是null
                    "order",
                ],
                where: { version: options.publishedVersion, parentId: null },
                // raw: true,
            }
        );

        // 遍历“类分组”
        for (const classGroup of classGroups) {
            // 创建新版本的“类分组”
            const newVersionGroup = await ClassGroup.create(
                {
                    name: classGroup.get("name"),
                    order: classGroup.get("order"),
                    version: options.newVersion,
                },
                {
                    transaction,
                }
            );

            const classVersions = classGroup.get("items");
            // 遍历“publishedVersion”版本当前分组下的类（class）
            for (const classVersion of classVersions) {
                // 创建新版本的“类”
                const newVersionClass = await ClassVersion.create(
                    {
                        clientClassId: classVersion.get("clientClassId"),
                        groupId: newVersionGroup.get("id"), // 挂载到新版本的“分组”下
                        order: classVersion.get("order"),
                        version: options.newVersion,
                    },
                    {
                        transaction,
                    }
                );
                const attrVersions = classVersion.get("AttributeVersions");
                const newVersionAttrs = [];
                for (const attrVersion of attrVersions) {
                    newVersionAttrs.push({
                        classVersionId: newVersionClass.get("id"),
                        attributeId: attrVersion.get("attributeId"),
                        order: attrVersion.get("order"),
                        parameterGroup: attrVersion.get("parameterGroup"),
                        parameterType: attrVersion.get("parameterType"),
                        attributeMask: attrVersion.get("attributeMask"),
                        controlShape: attrVersion.get("controlShape"),
                        valueRange: attrVersion.get("valueRange"),
                        fixed: attrVersion.get("fixed"),
                        version: options.newVersion,
                    });
                }
                await AttributeVersion.bulkCreate(newVersionAttrs, { transaction });
            }
        }
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};
