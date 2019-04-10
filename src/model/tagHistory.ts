import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class TagHistory extends Model {
    public owner?: number;
    public tags?: string[];
}

TagHistory.init(
    {
        owner: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            comment: "所属者ID",
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            comment: "企业用过的标签",
        },
    },
    {
        tableName: "component_tag_history",
        paranoid: true,
        comment: "标签库",
        sequelize: Models,
    }
);
