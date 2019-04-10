import { Model, DataTypes, Transaction, Op } from "sequelize";
import Models from "./sequelizeBridge";


export interface IcalculateRule {
    addAmount?: number;
    calcItem?: number;
    attribute?: {
        id?: number,
        name?: string
        parameterName?: string;
    };
    amount: number;
    unit: string;
    projectName?: string;
    rule?: string;
    type: string; // ["actual","min","fixMultiple","addMultiple"]
    //["实际值"，"最小值","固定量的倍数","增加的倍数"]
}
export interface IaddMatchMap {
    matchId: number;
    itemId: number;
    relationLib: number;
    calculateRule: IcalculateRule;
}

export interface IdeleteMatchMap {
    matchId: number;
    itemId: number[];
    relationLib: number;
}


export class MatchMap extends Model {
    //查询------获取matchMap
    public static async getMatchMap(id: number, relationLibId: number, itemId: number) {
        const result = await MatchMap.findAll({
            where: {
                matchId: id,
                relationLib: relationLibId,
                itemId: itemId,
            },
        });
        return result;
    }
    // 查询------获取itemid
    public static async getListNormMatch(id: number, relationLibId: number) {
        // 获取itemid
        const result = await MatchMap.findAll({
            where: {
                matchId: id,
                relationLib: relationLibId,
            },
        });
        return result;

    }

    // 查询------获取matchId
    public static async getMatchId(relationLibId: number, matchIds?: number[]) {
        const option: { relationLib: number, matchId?: {} } = {
            relationLib: relationLibId,
        };
        if (matchIds) {
            option.matchId = {
                [Op.in]: matchIds,
            };
        }
        // 获取itemid
        const result = await MatchMap.findAll({
            where: <any>option,
        });
        return result;

    }

    // 新增
    public static async addMatchMap(option: IaddMatchMap, transaction: Transaction) {
        await MatchMap.create(option, { transaction: transaction });
    }

    // 批量添加
    public static async addSomeMatchMap(option: IaddMatchMap[], transaction: Transaction) {
        await MatchMap.bulkCreate(option, { transaction });
    }

    // 更新计算规则
    public static async updateMatchMap(option: IaddMatchMap, transaction: Transaction) {
        await MatchMap.update(option, {
            where: {
                matchId: option.matchId,
                itemId: option.itemId,
                relationLib: option.relationLib,
            },
            transaction: transaction,
        });
    }


    // 删除计算规则
    public static async deleteMatchMap(option: IdeleteMatchMap, transaction: Transaction) {
        await MatchMap.destroy({
            where: {
                matchId: option.matchId,
                itemId: {
                    // Op.in 做批量删除操作
                    [Op.in]: option.itemId,
                },
                relationLib: option.relationLib,
            },
            transaction: transaction,
        });
    }
    // 根据matchId删除匹配规则
    public static async deleteMatchMapById(matchId: number[], transaction: Transaction) {
        await MatchMap.destroy({
            where: {
                matchId: {
                    [Op.in]: matchId,

                },
            },
        });
    }

    public id?: number;
    public matchId?: number;
    public itemId?: number;
    public relationLib?: number;
    public calculateRule?: IcalculateRule;
}

MatchMap.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID",
        },
        matchId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // primaryKey: true,
            comment: "匹配规则ID",
        },
        itemId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // primaryKey: true,
            comment: "项目ID",
        },
        relationLib: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // primaryKey: true,
            comment: "关联库ID",
        },
        calculateRule: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: "计算规则",
        },
    },
    {
        tableName: "list_norm_match_map",
        comment: "匹配规则与清单定额对应表",
        sequelize: Models,
    }
);
