import { pick as Pick } from "lodash";
import { Model, DataTypes, Sequelize } from "sequelize";
import Models from "./sequelizeBridge";

export interface IAddCalculateRule {
    name: string;
    classId: number;
    matchRuleDesc?: object[];
    matchRule?: object;
    calculateRuleDesc?: object[];
    calculateRule?: object;
    unit?: string;
    comment?: string;
    status: string;
    owner: number;
    libId: number;
}

export interface IUpdateCalculateRule {
    calculateRuleId: number;
    name: string;
    matchRuleDesc?: object[];
    matchRule?: object;
    calculateRuleDesc?: object[];
    calculateRule?: object;
    unit?: string;
    comment?: string;
}

export class CalculateRule extends Model {
    public static async copyCalculateRule(options: {
        owner: number; srcLibId: number; destLibId: number; doNotCover?: boolean
    }) {
        const transaction = await Models.transaction();
        try {
            const srcRules = await CalculateRule.findAll({
                attributes: [
                    "name", "classId", "matchRuleDesc", "matchRule", "calculateRuleDesc", "calculateRule", "unit",
                    "comment", [Sequelize.literal("'active'"), "status"], "owner",
                ],
                where: { owner: options.owner, libId: options.srcLibId },
                raw: true,
            });
            if (srcRules.length === 0) {
                throw new Error("there is not any match rule to copy.");
            }
            // 默认删除已有的匹配规则
            if (options.doNotCover !== true) {
                await CalculateRule.destroy({
                    where: {
                        owner: options.owner, libId: options.destLibId,
                    },
                    transaction: transaction,
                });
            }
            for (const rule of srcRules) {
                rule.libId = options.destLibId;
            }
            await CalculateRule.bulkCreate(srcRules);
            // commit
            await transaction.commit();
        } catch (ex) {
            // Rollback transaction if any errors were encountered
            await transaction.rollback();
            throw ex;
        }
    }

    public static async deleteCalculateRule(options: { owner: number; libId: number; id?: number | number[] }) {
        await CalculateRule.destroy({ where: <any>options });
    }

    public static async updateCalculateRule(options: IUpdateCalculateRule) {
        const toUpdate: {
            name: string;
            matchRuleDesc?: object[]; matchRule?: object;
            calculateRuleDesc?: object[]; calculateRule?: object;
            unit?: string; comment?: string;
        } = Pick(options, ["name", "matchRuleDesc", "matchRule", "calculateRuleDesc", "calculateRule", "unit", "comment"]);
        if (!Object.keys(toUpdate).length) {
            throw new Error("There is nothing to update");
        }
        await CalculateRule.update(toUpdate, { where: { id: options.calculateRuleId } });
    }

    public static async addCalculateRule(options: IAddCalculateRule) {
        await CalculateRule.create(options);
    }

    public id?: number;
    public name?: string;
    public classId?: number;
    public matchRuleDesc?: object[];
    public matchRule?: object;
    public calculateRuleDesc?: object[];
    public calculateRule?: object;
    public unit?: string;
    public comment?: string;
    public status?: string;
    public owner?: number;
    public libId?: number;
}

CalculateRule.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "匹配规则ID",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "计算规则名称",
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
        calculateRuleDesc: {
            type: DataTypes.ARRAY(DataTypes.JSONB),
            allowNull: true,
            comment: "匹配规则",
        },
        calculateRule: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: "匹配规则",
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "单位",
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "备注",
        },
        owner: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "所属ID",
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "active",
            allowNull: false,
            comment: "状态",
        },
        libId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "库ID",
        },
    },
    {
        tableName: "list_norm_calculate",
        paranoid: true,
        comment: "匹配规则",
        sequelize: Models,
    }
);
