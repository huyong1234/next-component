import { pick as Pick } from "lodash";
import { Model, DataTypes, Sequelize } from "sequelize";
import Models from "./sequelizeBridge";
import { MatchMap } from "./listNormMatchMap";
import { Library } from "./listNormLibrary";
export interface IRule {
    op: string;
    para: RuleParameter;
}
export type RuleParameter = (number | string | boolean | IRule | number[] | string[] | boolean[] | IRule[])[];

export interface IAddMatchRule {
    classId: number;
    matchRuleDesc?: object[];
    matchRule?: IRule;
    comment?: string;
    status: string;
    owner: number;
    libId: number;
}
export interface IAddMatchMap {
    matchId: number;
    relationLib: number;

}

export interface ImatchListNorm {
    itemId: number;
    calculateRule?: object;
}

export interface IUpdateMatchRule {
    matchRuleId: number;
    matchRuleDesc: object[];
    matchRule?: object;
    comment?: string;
    relationLib: number;
    libraryLib: number;
    listNorm?: ImatchListNorm[];

}


export class MatchRule extends Model {
    public static async copyMatchRule(options: {
        owner: number; srcLibId: number; destLibId: number; srcLibType: string;
        destLibType: string; doNotCover?: boolean
    }) {
        const transaction = await Models.transaction();
        try {
            const attributes: any = ["classId", "matchRuleDesc", "matchRule", "comment",
                [Sequelize.literal("'active'"), "status"], "owner"];
            // 获取被复制匹配规则库下的所有匹配规则
            const srcMatchRules = await MatchRule.findAll({
                attributes,
                where: { owner: options.owner, libId: options.srcLibId },
                raw: true,
            });
            if (srcMatchRules.length === 0) {
                throw new Error("there is not any match rule to copy.");
            }
            if (options.doNotCover !== true) {
                // 默认删除已有的匹配规则
                await MatchRule.destroy({ where: { owner: options.owner, libId: options.destLibId }, transaction: transaction });
                // 获取要删除的匹配规则的id
                const matchId = await MatchRule.getMatchRuleId({ owner: options.owner,libId: options.destLibId });
                // 默认删除已有的匹配规则关联表相关信息
                await MatchMap.deleteMatchMapById(matchId,transaction);
            }
            for (const matchRule of srcMatchRules) {
                matchRule.libId = options.destLibId;
            }
            await MatchRule.bulkCreate(srcMatchRules);
            // 如果当前匹配规则库的关联库与被复制的匹配规则关联库id不同，则不需要复制关系表
            const srcLibrary = await Library.findById(options.srcLibId);
            const desLibrary = await Library.findById(options.destLibId);
            if (srcLibrary!.relationLib === desLibrary!.relationLib) {
                const srcMatchRulesId = await MatchRule.findAll({
                    where: { owner: options.owner, libId: options.srcLibId },
                    raw: true,
                });
                const destMatchRule = await MatchRule.findAll({
                    where: { owner: options.owner, libId: options.destLibId },
                    raw: true,
                });
                // 获取复制后的匹配规则库下的所有匹配规则
                const library = await Library.findById(options.srcLibId);
                const ids = await this.getMatchRuleId({ owner: options.owner, libId: options.srcLibId });
                // 获取被复制匹配规则库下所有的关联item
                if (library !== undefined && library !== null && ids.length > 0) {
                    const srcMatchMap = await MatchMap.getMatchId(library.relationLib!, ids);
                    // 复制后新建的matchid和原来的matchid的对应关系
                    const matchIdMap: Map<number, number> = new Map();
                    for (let index = 0; index < srcMatchRulesId.length; index++) {
                        matchIdMap.set(srcMatchRulesId[index].id!, destMatchRule[index].id!);

                    }
                // 复制生成新的匹配规则关联表数据
                    const desMatchMap = [];
                    if (srcMatchMap.length > 0) {
                        for (const iterator of srcMatchMap) {
                            if (iterator.matchId !== undefined && iterator.matchId !== null) {
                                const matchRule = {
                                    matchId: matchIdMap.get(iterator.matchId),
                                    itemId: iterator.itemId,
                                    relationLib: iterator.relationLib,
                                    calculateRule: iterator.calculateRule,
                                };
                                desMatchMap.push(matchRule);
                            }

                        }
                        await MatchMap.bulkCreate(desMatchMap);
                    }

                }
            }
            // commit
            await transaction.commit();
        } catch (ex) {
            // Rollback transaction if any errors were encountered
            await transaction.rollback();
            throw ex;
        }
    }

    public static async deleteMatchRule(options: { owner: number; libId: number; id?: number | number[] }) {
        await MatchRule.destroy({ where: <any>options });
    }

    // 获取该匹配规则库下所有的匹配规则id
    public static async getMatchRuleId(options: { owner: number, libId: number }) {
        const result = await MatchRule.findAll({
            where: options,
            raw: true,
        });
        const ids = [];
        if (result.length > 0) {
            for (const iterator of result) {
                ids.push(iterator.id!);
            }
        }
        return ids;

    }

    public static async updateMatchRule(options: IUpdateMatchRule) {
        const toUpdate: {
            matchRuleDesc?: object[]; matchRule?: object, comment?: string
        } = Pick(options, ["matchRuleDesc", "matchRule", "comment"]);
        if (!Object.keys(toUpdate).length) {
            throw new Error("There is nothing to update");
        }
        await MatchRule.update(toUpdate, { where: { id: options.matchRuleId } });
    }

    public static async addMatchRule(options: IAddMatchRule) {
        options.status = "active";
        const result = await MatchRule.create(options);
        return result.get("id");
    }
    public id?: number;
    public classId?: number;
    public matchRuleDesc?: object[];
    public matchRule?: IRule;
    public comment?: string;
    public status?: string;
    public owner?: number;
    public libId?: number;
}

MatchRule.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "匹配规则ID",
        },
        classId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "类版本ID",
        },
        matchRuleDesc: {
            type: DataTypes.ARRAY(DataTypes.JSONB),
            allowNull: true,
            comment: "匹配规则",
        },
        matchRule: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: "匹配规则",
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "备注",
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "active",
            allowNull: false,
            comment: "状态",
        },
        owner: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "所属ID",
        },
        libId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "库ID",
        },
    },
    {
        tableName: "list_norm_match",
        paranoid: true,
        comment: "匹配规则",
        sequelize: Models,
    }
);
