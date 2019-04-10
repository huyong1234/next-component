import { assign as Assign, omit as Omit } from "lodash";
import { Model, DataTypes, Sequelize, Op } from "sequelize";
import Models from "./sequelizeBridge";
import { AttributeMask } from "./attributeMask";

export interface IAttributeOptions {
    name: string;
    parameterName: string;
    parameterType: string;
    // attributeTypes: 前台传过来的“类型名称”
    attributeTypes: string[];
    attributeMask?: number;
    controlShape?: string;
    valueRange: object;
    fixed: boolean;
    comment: string;
}

export interface IGetAttributeOptions {
    attributeTypes?: string[];
    parameterType?: string;
    name?: string;
    asc?: string;
    desc?: string;
    pageIndex?: number;
    pageSize?: number;
}

export class Attribute extends Model {
    public static getAttributeGroup() {
        const attributeGroups = [
            "截面属性",
            "标高属性",
            "材质属性",
            "施工属性",
            "图形属性",
            "效果属性",
        ];
        return attributeGroups;
    }

    public static async addAttribute(options: IAttributeOptions) {
        const attributeMask = await AttributeMask.calculateAttrMask(options.attributeTypes);
        if (!attributeMask) {
            throw new Error("Error attribute types.");
        }
        // delete options.attributeTypes;
        // options.attributeMask = attributeMask;
        await Attribute.create(Assign({}, Omit(options, "attributeTypes"), { attributeMask: attributeMask }));
    }

    public static async getAttribute(options: IGetAttributeOptions) {
        const conditions: {
            attributeMask?: any;
            parameterType?: string;
            name?: any;
        } = {};
        let pageIndex = 0;
        let pageSize = 10;
        let orderBy = [["id", "DESC"]];
        if (options.asc !== undefined) {
            orderBy = [[options.asc, "ASC"]];
        } else if (options.desc !== undefined) {
            orderBy = [[options.desc, "DESC"]];
        }
        if (options.name !== undefined) {
            conditions.name = { [Op.like]: `%${options.name}%` };
        }
        if (options.attributeTypes !== undefined) {
            const msk = await AttributeMask.calculateAttrMask(options.attributeTypes);
            conditions.attributeMask = Sequelize.where(Sequelize.literal(`"attributeMask" & ${msk}`), "!=", "0");
        }
        if (options.parameterType !== undefined) {
            conditions.parameterType = options.parameterType;
        }
        if (options.pageIndex !== undefined) {
            pageIndex = options.pageIndex;
        }
        if (options.pageSize !== undefined) {
            pageSize = options.pageSize;
        }
        const attributes = await Attribute.findAndCountAll({
            attributes: ["name", "parameterName", "parameterType", "attributeMask", "valueRange", "fixed", "comment"],
            where: <any>conditions,
            offset: pageIndex, limit: pageSize,
            order: <any>orderBy,
            raw: true,
        });
        const attrMaskList = await AttributeMask.getAttributeMask();

        // 构造返回结果
        const result: { count: number, rows: any[] } = { count: 0, rows: [] };
        result.count = attributes.count;
        for (const attrObj of attributes.rows) {
            const attributeTypes = [];
            const attributeMask: number = attrObj.attributeMask!;
            for (const attrMaskObj of attrMaskList) {
                const msk: number = attrMaskObj.mask!;
                if (attributeMask & msk) { // tslint:disable-line:no-bitwise
                    attributeTypes.push(attrMaskObj.type);
                }
            }
            result.rows.push(Assign({}, Omit(attrObj, "attributeMask"), { attributeTypes: attributeTypes }));
        }

        return result;
    }

    public id?: number;
    public name?: string;
    public parameterName?: string;
    public userName?: string;
    public unit?: string;
    public parameterType?: string;
    public attributeMask?: number;
    public controlShape?: string;
    public valueRange?: object;
    public fixed?: boolean;
    public comment?: string;
}

Attribute.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "构件属性ID",
        },
        name: {
            type: DataTypes.STRING,
            // unique: true,
            unique: "attr_parameter_name", // 定义（name, parameterName）唯一
            allowNull: false,
            comment: "构件属性名称",
        },
        parameterName: {
            type: DataTypes.STRING,
            // unique: true,
            unique: "attr_parameter_name",
            allowNull: false,
            comment: "构件属性name",
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "UserVar",
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "单位",
        },
        parameterType: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "数据类型: number | string",
        },
        attributeMask: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "属性类型掩码",
        },
        controlShape: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "控件类型",
        },
        valueRange: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: "示例：{min: 100, max: 200, options: [number | string], customize: boolean} || null",
        },
        fixed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: "是否是只读属性",
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "备注",
        },
    },
    {
        tableName: "component_attribute",
        paranoid: true,
        comment: "构件属性",
        sequelize: Models,
    }
);
