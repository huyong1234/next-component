import { pick as Pick } from "lodash";
import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export interface IClassGroup {
    name: string;
    parentId?: number;
    order: string;
    version: number;
}

export interface IGetClassGroup {
    id?: number;
    ids?: number[];
    name?: string;
    version?: number;
}
export class ClassGroup extends Model {
    public static async getClassGroup(options?: IGetClassGroup) {
        let conditions: { id?: number | number[], name?: string, version?: number } = {};
        if (options) {
            conditions = Pick(options, ["id", "name", "version"]);
            if (options.ids) {
                conditions.id = options.ids;
            }
        }
        const result = await ClassGroup.findAll(
            {
                where: <any>conditions,
                raw: true,
            }
        );
        return result;
    }

    public static async addClassGroup(options: IClassGroup) {
        await ClassGroup.create(options);
    }
    public id?: number;
    public clientClassId?: number;
    public name?: string;
    public parentId?: number;
    public order?: string;
    public version?: number;
}

ClassGroup.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID",
        },
        clientClassId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "类ID",
        },
        name: {
            type: DataTypes.STRING,
            unique: "version_group_name",
            allowNull: false,
            comment: "组名",
        },
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "父组ID",
        },
        order: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "序号",
        },
        version: {
            type: DataTypes.INTEGER,
            unique: "version_group_name",
            allowNull: false,
            comment: "分类属性版本号",
        },
    },
    {
        tableName: "component_class_group",
        paranoid: true,
        comment: "构件类型分组",
        sequelize: Models,
    }
);
