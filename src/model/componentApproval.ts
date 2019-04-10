import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

/* 状态改变：
          ---> rejected
  pending
          ---> active
*/

export class Approval extends Model {
    public id?: number;
    public opinion?: string;
    public sharing?: boolean;
    public approver?: string;
    public status?: string;
    public componentId?: number;
}

Approval.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID",
        },
        opinion: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "审批意见",
        },
        sharing: {
            type: DataTypes.BOOLEAN,
            // defaultValue: false,
            allowNull: false,
            comment: "共享至公共库",
        },
        approver: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "审批人",
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "pending",
            allowNull: false,
            comment: "状态",
        },
        componentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "被审核构件id",
        },
    },
    {
        tableName: "component_approval",
        paranoid: true,
        comment: "审批表",
        sequelize: Models,
    }
);
