import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class SynonymTag extends Model {
    public tag?: string;
    public index?: number;
}

SynonymTag.init(
    {
        tag: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true,
            comment: "tag名称",
        },
        index: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "synonym tag index",
        },
    },
    {
        tableName: "component_synonym_tag",
        paranoid: true,
        comment: "标签库",
        sequelize: Models,
    }
);
