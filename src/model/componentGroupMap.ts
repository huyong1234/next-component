import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class ComponentGroupMap extends Model {
    public groupId?: number;
    public componentId?: number;
}

ComponentGroupMap.init(
    {
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            comment: "构件分组ID",
        },
        componentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            comment: "构件ID",
        },
    },
    {
        tableName: "component_group_map",
        comment: "构件与构件分类挂载关系",
        sequelize: Models,
    }
);
