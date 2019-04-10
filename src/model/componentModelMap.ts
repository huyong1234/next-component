import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class ComponentModelMap extends Model {
    public componentId?: number;
    public viewId?: string;
    public viewType?: string;
}

ComponentModelMap.init(
    {
        componentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            comment: "构件ID",
        },
        viewId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            comment: "模型、材质或视图ID",
        },
        viewType: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "模型、材质或视图类型",
        },
    },
    {
        tableName: "component_model_map",
        comment: "构件与模型或材质映射关系",
        sequelize: Models,
    }
);
