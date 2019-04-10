import { Model, DataTypes, Sequelize } from "sequelize";
import Models from "./sequelizeBridge";

export class AttributeMask extends Model {
    // 根据属性名称计算AttributeMask
    public static async calculateAttrMask(attributeTypes: string | string[]) {
        // let types: string[] = [];
        // types = types.concat(attributeTypes);
        // const result = await AttributeMask.sum("mask", { where: { type: types } });
        const conditions: { type?: string | string[] } = {};
        if (attributeTypes) {
            conditions.type = attributeTypes;
        }
        const result = await AttributeMask.sum("mask", { where: <any>conditions });
        return result;
    }

    /**
     * 根据msk获取属性类型列表，如果不传入msk，则获取所有
     * @param msk?: number(属性类型掩码)
     */
    public static async getAttributeMask(msk?: number) {
        let result;
        if (msk !== undefined) {
            result = await AttributeMask.findAll({
                where: Sequelize.where(Sequelize.literal(`mask & ${msk}`), "!=", "0"),
                attributes: ["type", "mask"],
                raw: true,
            });
        } else {
            result = await AttributeMask.findAll({ attributes: ["type", "mask"], raw: true });
        }
        return result;
    }

    /**
     * 根据msk获取“属性类型名称”（type）
     * @param msk ?: number
     */
    public static async getAttributeType(msk?: number) {
        const attributeTypes: string[] = [];
        const attrMaskList = await AttributeMask.getAttributeMask(msk);
        attrMaskList.forEach((element) => {
            attributeTypes.push(element.type!);
        });
        return attributeTypes;
    }

    public id?: number;
    public type?: string;
    public mask?: number;
}

AttributeMask.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "构件属性类型ID",
        },
        type: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            comment: "构件属性类型描述",
        },
        mask: {
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: false,
            comment: "构件属性类型掩码",
        },
    },
    {
        tableName: "component_attribute_mask",
        paranoid: true,
        comment: "构件属性类型",
        sequelize: Models,
    }
);
