import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";
import { ClassVersion, ClientClass } from ".";


export interface IgetCalcItem {
    classVersionId?: number;
    itemId?: number;
    version?: number;
}

export class CalcItem extends Model {

    // 获取计算项目
    public static async getCalcItem(option: IgetCalcItem) {
        const searchWhere = <IgetCalcItem>{};
        // 填充墙的typeid
        const defaultTypeId = 95;
        if (option.classVersionId !== undefined) {
            searchWhere.classVersionId = option.classVersionId;
            // 对查找墙的计算项目做特殊处理————转化为查找填充墙的计算项目
            const classVersion = await ClassVersion.findById(option.classVersionId);
            if (classVersion !== null) {
                // 获取typeId
                const clientClass = await ClientClass.findById(classVersion.clientClassId);
                if (clientClass !== null && clientClass.typeId === 1) {
                    const newClientClass = await ClientClass.findAll({
                        where: {
                            typeId: defaultTypeId,
                        },
                    });
                    if (newClientClass.length > 0) {
                        const newClassVersion = await ClassVersion.findAll({
                            where: {
                                version: classVersion.version!,
                                clientClassId: newClientClass[0].id!,
                            },
                        });
                        // 将填充墙的classVersionId赋给墙
                        if (newClassVersion.length > 0) {
                            searchWhere.classVersionId = newClassVersion[0].id;
                        }
                    }
                }
            }
        }
        if (option.itemId !== undefined) {
            searchWhere.itemId = option.itemId;
        }
        if (option.version !== undefined) {
            searchWhere.version = option.version;
        }
        try {
            const result = await CalcItem.findAll({
                where: <any>searchWhere,
                raw: true,
            });
            const resultMap: { [index: string]: CalcItem & { units: Set<string> } } = {};
            // 循环，将相同计算项目的单位合并到一个数组中
            for (const iterator of result) {
                if (iterator.name !== undefined) {
                    if (resultMap[iterator.name] === undefined) {
                        resultMap[iterator.name] = Object.assign({}, iterator, { units: new Set<string>() });
                    }
                    // resultMap[iterator.name] || (resultMap[iterator.name] = Object.assign({}, iterator, { units: new Set<string>() }));
                    resultMap[iterator.name!].units.add(iterator.unit!);
                }

            }
            const resultObject = Object.values(resultMap);
            for (const iterator of resultObject) {
                iterator.unit = <any>Array.from(iterator.units);
                delete iterator.units;
            }
            return resultObject;
        } catch (error) {
            throw error;
        }
    }

    public id?: number;
    public classVersionId?: number;
    public name?: string;
    public itemId?: number;
    public unit?: string;
    public feature?: string[];
    public sub?: number[];
    public add?: number[];
    public comment?: string;
    public version?: number;

}

CalcItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "清单项目ID",
        },
        classVersionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "class version id",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "计算项名称",
        },
        itemId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "计算项标号",
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "单位",
        },
        feature: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            comment: "计算项特征",
        },
        sub: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true,
            comment: "扣减项",
        },
        add: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true,
            comment: "增加项",
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "备注",
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "分类属性版本号",
        },
    },
    {
        tableName: "list_norm_calc_item",
        paranoid: true,
        comment: "计算项",
        sequelize: Models,
    }
);
