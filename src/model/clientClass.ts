import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export interface IClientClassOptions {
    name: string;
    typeId: number;
}

export class ClientClass extends Model {
    public static async addClientClass(options: IClientClassOptions) {
        await ClientClass.create(options);
    }

    public static async delClientClass(options: { id?: number, name?: string }) {
        await ClientClass.destroy({ where: <any>options });
    }

    public id?: number;
    public name?: string;
    public typeId?: number;
    public bigClass?: boolean;
}

ClientClass.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID",
        },
        name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            comment: "class名称",
        },
        typeId: {
            type: DataTypes.INTEGER,
            unique: "client_class_type",
            allowNull: false,
            comment: "客户端软件类的ID",
        },
        bigClass: {
            type: DataTypes.BOOLEAN,
            unique: "client_class_type",
            defaultValue: false,
            allowNull: false,
            comment: "客户端软件类的ID",
        },
    },
    {
        tableName: "component_class",
        paranoid: true,
        comment: "构件类型",
        sequelize: Models,
    }
);
