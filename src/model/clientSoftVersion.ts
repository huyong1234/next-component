import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class ClientSoftVersion extends Model {
    public clientVersion?: string;
    public version?: number;
}

ClientSoftVersion.init(
    {
        clientVersion: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true,
            comment: "client soft version",
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "system class attribute version",
        },
    },
    {
        tableName: "component_client_version",
        timestamps: true,
        comment: "版本号",
        sequelize: Models,
    }
);
