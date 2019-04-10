import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class CadModel extends Model {
    public id?: string;
    public type?: string;
    public name?: string;
    public attr?: object;
    public preview?: string[];
    public file?: string;
    public owner?: number;
    public author?: string;
    public status?: string;
}

CadModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true,
            comment: "模型UUID",
        },
        type: {
            type: DataTypes.STRING,
            comment: "模型类型",
        },
        name: {
            type: DataTypes.STRING,
            comment: "模型名",
        },
        attr: {
            type: DataTypes.JSONB,
            comment: "模型属性",
        },
        file: {
            type: DataTypes.JSONB,//数据结构{"url":"http://OSSxxxx"}
            comment: "模型文件",
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
            comment: "模型状态",
        },
    },
    {
        tableName: "component_cad_model",
        paranoid: true,
        comment: "构件cad模型库",
        sequelize: Models,
    }
);
