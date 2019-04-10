import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class AttributeVersion extends Model {
    public id?: number;
    public classVersionId?: number;
    public attributeId?: number;
    public order?: string;
    public parameterType?: string;
    public attributeMask?: number;
    public attributeTypes?: string[];
    public controlShape?: number;
    public valueRange?: object;
    public fixed?: boolean;
    public version?: number;
}

AttributeVersion.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID",
        },
        classVersionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "外键classVersionId",
        },
        attributeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "属性ID",
        },
        order: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "序号",
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
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "分类属性版本号",
        },
    },
    {
        tableName: "component_attribute_version",
        timestamps: false,
        paranoid: false,
        comment: "分类属性版本",
        sequelize: Models,
    }
);
