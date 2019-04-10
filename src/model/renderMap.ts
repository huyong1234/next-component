import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class RenderMap extends Model {
    public id?: string;
    public taskId?: string;
    public renderStatus?: string;
    public progress?: number;
    public relateId?: string;
}

RenderMap.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID",
        },
        taskId: {
            type: DataTypes.STRING,
            comment: "渲染Id",
        },
        renderStatus: {
            type: DataTypes.STRING,
            comment: "材质名",
        },
        progress: {
            type: DataTypes.INTEGER,
            comment: "进度",
        },
        relateId: {
            type: DataTypes.STRING,
            comment: "关联材质或模型的id",
        },
    },
    {
        tableName: "component_render_map",
        paranoid: true,
        comment: "渲染map",
        sequelize: Models,
    }
);
