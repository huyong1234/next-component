import { Model, DataTypes, Op } from "sequelize";
import Models from "./sequelizeBridge";
import { Catalog } from "./listNormCatalog";

export interface IGetNormItemOptions {
    owner: number;
    id?: number;
    ids?: number[];
    search?: string;
    catalogId?: number;
    catalogIds?: number[];
    libId?: number;
    page?: number;
    pageSize?: number;
    category?: string;
}

export class NormItem extends Model {
    public static async getItems(options: IGetNormItemOptions) {
        let conditions: any = {};
        conditions.owner = options.owner;
        if (options.search !== undefined) {
            conditions = {
                [Op.or]: [
                    { code: { [Op.like]: `%${options.search}%` } },
                    { name: { [Op.like]: `%${options.search}%` } },
                ],
            };
        }
        if (options.ids !== undefined) {
            conditions.id = options.ids;
        } else if (options.id !== undefined) {
            conditions.id = options.id;
        }

        if (options.catalogIds !== undefined) {
            conditions.catalogId = options.catalogIds;
        } else if (options.catalogId !== undefined) {
            conditions.catalogId = options.catalogId;
        }

        // if (options.category !== undefined) {
        //     conditions.category = options.category;
        // }

        let includeCatalog: any;
        if (options.libId !== undefined) {
            includeCatalog = {
                model: Catalog,
                where: { libId: options.libId },
                attributes: [],
            };
        }
        const include = [];
        if (includeCatalog !== undefined) {
            include.push(includeCatalog);
        }
        // const { page = 1, pageSize = 10 } = options;
        let result;
        if (options.page !== undefined && options.pageSize !== undefined) {
            result = await NormItem.findAndCountAll({
                order: [["updatedAt", "DESC"]],
                include: include,
                where: conditions,
                raw: true,
                offset: (options.page - 1) * options.pageSize,
                limit: options.pageSize,
                distinct: true,
            });
        } else {
            result = await NormItem.findAndCountAll({
                order: [["updatedAt", "DESC"]],
                include: include,
                where: conditions,
                raw: true,
                distinct: true,
            });
        }

        return result;
    }
    public static async deleteItems(id: number): Promise<number> {
        return await NormItem.destroy({ where: { id: id } });
    }
    public id?: number;
    public code?: string;
    public name?: string;
    public unit?: string;
    public loss?: number;
    public price?: {
        sell: {
            labor?: number, machine?: number, stuffMain?: number, stuffAttached?: number
        };
        cost:
        {
            labor?: number, machine?: number, stuffMain?: number, stuffAttached?: number
        },

    };
    public featureDesc?: string;
    public feature?: object[];
    public jobs?: string;
    public status?: string;
    public owner?: number;
    public catalogId?: number;
    public libId?: number;
}

NormItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "定额项目ID",
        },
        code: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "定额项目编号",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "定额项目名称",
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "单位",
        },
        loss: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: "损耗",
        },
        price: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: `销售价/成本价:
                    {
                        sell: {labor: 1, machine: 2, stuffMain: 3, stuffAttached: 4},
                        cost: {labor: 1, machine: 2, stuffMain: 3, stuffAttached: 4}
                    }`,
        },
        featureDesc: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "定额项目特征描述",
        },
        feature: {
            type: DataTypes.ARRAY(DataTypes.JSONB),
            allowNull: true,
            comment: "定额项目特征参数",
        },
        jobs: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "工作内容",
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
        catalogId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "目录ID",
        },
        libId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "库ID",
        },
    },
    {
        tableName: "list_norm_item",
        paranoid: true,
        comment: "定额项目",
        sequelize: Models,
    }
);
