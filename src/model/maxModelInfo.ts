import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";
export class MaxModelInfo extends Model {
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

MaxModelInfo.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            comment: "渲染模型UUID",
        },
        targetId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true,
            comment: "指向的web或max模型id",
        },
        type: {
            type: DataTypes.ENUM("web", "max"),
            // defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            comment: "指向的web或max模型类型",
        },
    },
    {
        tableName: "component_max_model_info",
        paranoid: true,
        comment: "构件max模型间关联关系",
        sequelize: Models,
    }
);
