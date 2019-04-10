import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class ComponentGroupModelMap extends Model {
    public componentId?: number;
    public viewId?: string;
    public viewType?: string;
}

ComponentGroupModelMap.init(
    {
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            comment: "构件分组ID",
        },
        modelId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            comment: "模型ID",
        },
    },
    {
        tableName: "component_group_model_map",
        comment: "构件分组与模型映射关系",
        sequelize: Models,
    }
);
