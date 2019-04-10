import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class Textrue extends Model {
    public id?: string;
    public type?: string;
    public name?: string;
    public attr?: {};
    public file?: string;
    public preview?: string[];
    public owner?: number;
    public author?: string;
    public status?: string;
    public path?: string;
}

Textrue.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true,
            comment: "材质UUID",
        },
        type: {
            type: DataTypes.STRING,
            comment: "材质类型",
        },
        name: {
            type: DataTypes.STRING,
            comment: "材质名",
        },
        attr: {
            type: DataTypes.JSONB,
            comment: "材质属性",
        },
        file: {
            type: DataTypes.JSONB,//数据结构{"url":"http://OSSxxxx"}
            comment: "材质文件",
        },
        preview: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            comment: "预览图",
        },
        owner: {
            type: DataTypes.INTEGER,
            comment: "所属ID",
        },
        author: {
            type: DataTypes.STRING,
            comment: "上传人的账户名字",
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "creating",
            comment: "材质状态",
        },
        path: {
            type: DataTypes.STRING,
            comment: "标签的位置",
        },
    },
    {
        tableName: "component_texture",
        paranoid: true,
        comment: "构件材质库",
        sequelize: Models,
    }
);
