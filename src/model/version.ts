import { pick as Pick } from "lodash";
import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";
import { ClientSoftVersion } from "./clientSoftVersion";

export interface IGetVersionOptions {
    version?: number;
    versions?: number[];
    published?: boolean;
    clientVersion?: number;
    clientVersions?: number[];
}

export class Version extends Model {
    public static async getVersion(options?: IGetVersionOptions) {
        const conditions: { version?: number | number[], published?: boolean } = Pick(options, ["version", "published"]);
        const includeObj: { [index: string]: any } = { model: ClientSoftVersion, as: "ClientVersions", attributes: ["clientVersion"] };
        if (options !== undefined) {
            if (options.versions !== undefined) {
                conditions.version = options.versions;
            }
            if (options.clientVersion !== undefined) {
                includeObj.where = { clientVersion: options.clientVersion };
            } else if (options.clientVersions !== undefined) {
                includeObj.where = { clientVersion: options.clientVersions };
            }
        }
        const result = await Version.findAll(
            {
                include: [includeObj],
                where: <any>conditions,
                attributes: ["version", "published", "comment"],
                order: [["version", "DESC"]],
                // raw: true,
            }
        );
        return result;
    }

    public version?: number;
    public published?: boolean;
    public comment?: string;
    public baseVersion?: number;
}

Version.init(
    {
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "分类属性版本号",
        },
        published: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: "锁定属性版本",
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "备注",
        },
        baseVersion: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "基础分类属性版本号",
        },
    },
    {
        tableName: "component_version",
        timestamps: true,
        comment: "版本号",
        sequelize: Models,
    }
);
