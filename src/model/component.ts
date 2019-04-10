import { pick as Pick } from "lodash";
import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

/*状态改变：
                          ______________________
                         |                      |
                         |      ---> rejected -->
creating -> created  -> pending
                         |      ---> active ---> deprecated --->
                         |_ __ __ __ __ __ __ __ __ __ __ __ _ _ _|

sharing#componentId 短暂存在（共享阶段）
*/

export interface IComponentUpdate {
    id: number | number[];
    status?: string;
}

export class Component extends Model {
    public static async updateComponent(options: IComponentUpdate) {
        const toUpdate = Pick(options, ["status"]);
        await Component.update(toUpdate, { where: { id: options.id } });
    }

    public id?: number;
    public code?: string;
    public name?: string;
    public preview?: string[];
    public classIds?: number[];
    public attr?: object;
    public tags?: string[];
    public owner?: number;
    public author?: string;
    public origin?: number;
    public status?: string;
}

Component.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "构件ID",
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: false,
            comment: "构件编码",
        },
        name: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: false,
            comment: "构件名称",
        },
        preview: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            comment: "预览图",
        },
        classIds: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            unique: false,
            allowNull: false,
            comment: "版本类ID集合",
        },
        attr: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: "构件属性取值",
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            comment: "标签集合",
        },
        owner: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "所属ID",
        },
        author: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "上传人的账户名字",
        },
        origin: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "分享企业id",
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "creating",
            allowNull: false,
            comment: "构件状态",
        },
    },
    {
        tableName: "component",
        paranoid: true,
        comment: "构件",
        sequelize: Models,
    }
);
