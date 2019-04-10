import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class Tag extends Model {
    public id?: number;
    public parentId?: number;
    public tag?: string;
}

Tag.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID",
        },
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "父ID",
        },
        tag: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: "标签",
        },
    },
    {
        tableName: "component_tag",
        paranoid: true,
        comment: "标签库",
        sequelize: Models,
    }
);
