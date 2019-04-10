import { Model, DataTypes, Transaction } from "sequelize";
import Models from "./sequelizeBridge";

export interface IAddImportTask {
    owner: number;
    libId: number;
    name: string;
    fileUri: string;
    status?: string;
    order?: number;
    fileType?: string;
}
export interface IFindImportTask {
    owner: number;
    libId?: number;
    status?: string | {
        [x: string]: string[];
    };
    id?: number;
}

export class ImportTask extends Model {
    public static async addImportTask(options: IAddImportTask) {
        options.status = "creating";
        const result = await ImportTask.create(options);
        return result.get("id");
    }
    public static async findAllTask(options: IFindImportTask, attributes?: string[]) {
        return await ImportTask.findAll({
            attributes,
            where: <any>options,
            order: [
                ["updatedAt", "DESC"],
            ],
        });
    }
    public static async updateImportTask(option: { status?: string; errorMsg?: string }, where: {}, transaction?: Transaction) {
        await ImportTask.update(option, { where, transaction });
    }

    public static async deleteItems(id: number): Promise<number> {
        return await ImportTask.destroy({ where: { id: id } });
    }

    public id?: number;
    public name?: string;
    public fileUri?: string;
    public fileType?: string;
    public order?: number;
    public errorMsg?: string;
    public status?: string;
    public libId?: number;
    public owner?: number;
}

ImportTask.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "任务ID",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "任务名",
        },
        fileUri: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "exsel文件oss uri",
        },
        fileType: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "清单、定额、材料、人工、机械",
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "任务优先级",
        },
        errorMsg: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "error信息oss uri",
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "任务状态:creating | waiting | processing | failed | succeed",
        },
        libId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "关联库id",
        },
        owner: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "所属ID",
        },
    },
    {
        tableName: "list_norm_import",
        paranoid: true,
        comment: "清单定额项目导入任务列表",
        sequelize: Models,
    }
);
