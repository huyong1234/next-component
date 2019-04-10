import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class ClassVersion extends Model {
    public id?: number;
    public clientClassId?: number;
    public groupId?: number;
    public order?: string;
    public version?: number;
}

ClassVersion.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID",
        },
        clientClassId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "类ID",
        },
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "外键：class group id",
        },
        order: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "序号",
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "分类属性版本号",
        },
    },
    {
        tableName: "component_class_version",
        paranoid: true,
        comment: "构件类型版本",
        sequelize: Models,
    }
);
