import { Model, DataTypes, Transaction } from "sequelize";
import Models from "./sequelizeBridge";

export interface IAddClientTask {
    owner: number;
    fileUrl?: string;
    status?: string;
    order?: number;
}
export interface IFindClientTask {
    owner: number;
    status?: string | {
        [x: string]: string[];
    };
    id?: number;
}

export interface IUpdateClientTask {
    resultUrl?: string;
    order?: number;
    errorMsg?: string;
    status?: string;
    calculateType?: string;
    listId?: number;
    normId?: number;
    materialId?: number;
    matchId?: number;
    normCalcType?: number;
}

export interface IinsertParams {
    resultUrl?: string;
    order?: number;
    errorMsg?: string;
    status?: string;
    params?: {
        normCalcType?: number;
        calculateType?: string;
        listId?: number;
        normId?: number;
        materialId?: number;
        matchId?: number
    };
}

export class ClientTask extends Model {
    // 添加
    public static async addClientTask(options: IAddClientTask) {
        options.status = "creating";
        const result = await ClientTask.create(options);
        return result.get("id");
    }

    // 查询全部任务信息
    public static async findAllClientTask(options: IFindClientTask, attributes?: string[]) {
        return await ClientTask.findAll({
            attributes,
            where: <any>options,
            order: [["updatedAt", "DESC"]],
        });
    }

    // 根据id查询任务信息
    public static async findClientTaskById(taskId: number, owner?: number, raw?: boolean) {
        const options: { id: number, owner?: number } = { id: taskId };
        if (owner !== undefined) {
            options.owner = owner;
        }
        return await ClientTask.findAll({ raw, where: <any>options });
    }

    // 根据id查询任务信息 加上事务锁
    public static async clientTaskById(taskId: number, owner: number, transaction: Transaction) {
        const clientTask = await Models.query(
            `select * from ${ClientTask.tableName} where id=:id and owner=:owner for update nowait`,
            {
                replacements: { id: taskId, owner: owner },
                type: (<any>Models).QueryTypes.SELECT,
                transaction: transaction,
            }
        );
        return clientTask;
    }

    // 更新
    public static async updateClientTask(option: IUpdateClientTask, where: {}, transaction?: Transaction) {
        const item = <IinsertParams>{};
        if (option.resultUrl !== undefined) {
            item.resultUrl = option.resultUrl;
        }
        if (option.order !== undefined) {
            item.order = option.order;
        }
        if (option.errorMsg !== undefined) {
            item.errorMsg = option.errorMsg;
        }
        if (option.status !== undefined) {
            item.status = option.status;
        }
        if (option.calculateType !== undefined) {
            if (option.listId !== undefined) {
                item.params = {
                    calculateType: option.calculateType,
                    listId: option.listId,
                    normId: option.normId,
                    materialId: option.materialId,
                    matchId: option.matchId,
                    normCalcType: option.normCalcType,
                };
            } else {
                item.params = {
                    calculateType: option.calculateType,
                    normId: option.normId,
                    materialId: option.materialId,
                    matchId: option.matchId,
                    normCalcType: option.normCalcType,
                };
            }

        }
        await ClientTask.update(item, { where, transaction });
    }

    public id?: number;
    public fileUrl?: string;
    public resultUrl?: string;
    public order?: number;
    public errorMsg?: string;
    public status?: string;
    public params?: {
        calculateType: string; listId?: number;
        normId: number; materialId: number;
        matchId: number; normCalcType: number;
    };
    public owner?: number;
}

ClientTask.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "任务ID",
        },
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "上传oss url",
        },
        resultUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "下载oss url",
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
            comment: "任务状态:creating | processing | failed | succeed",
        },
        params: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: "相关任务信息",
        },
        owner: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "所属ID",
        },
    },
    {
        tableName: "list_norm_client_dock",
        paranoid: true,
        comment: "客户对接任务表",
        sequelize: Models,
    }
);
