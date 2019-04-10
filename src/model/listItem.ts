import { Model, DataTypes, Op } from "sequelize";
import Models from "./sequelizeBridge";
import { Catalog } from "./listNormCatalog";

export interface IGetListItemOptions {
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

export class ListItem extends Model {
    public static async getItems(options: IGetListItemOptions) {
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
        if (options.category !== undefined) {
            conditions.category = options.category;
        }

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
        let result;
        // const { page = 1, pageSize = 10 } = options;
        if (options.page !== undefined && options.pageSize !== undefined) {
            result = await ListItem.findAndCountAll({
                include: include,
                where: conditions,
                order: [["updatedAt", "DESC"]],
                raw: true,
                offset: (options.page - 1) * options.pageSize,
                limit: options.pageSize,
                distinct: true,
            });
        } else {
            result = await ListItem.findAndCountAll({
                include: include,
                where: conditions,
                order: [["updatedAt", "DESC"]],
                raw: true,
                distinct: true,
            });
        }
        return result;
    }

    public static async deleteItems(id: number): Promise<number> {
        return await ListItem.destroy({ where: { id: id } });
    }

    public id?: number;
    public code?: string;
    public name?: string;
    public unit?: string;
    public price?: {
        sell?: number,
        cost?: number
    };
    public featureDesc?: string;
    public feature?: object[];
    public jobs?: string;
    public status?: string;
    public owner?: number;
    public catalogId?: number;
    public libId?: number;
}

ListItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "清单项目ID",
        },
        code: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "清单项目编号",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "清单项目名称",
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "单位",
        },
        price: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: `综合销售价/成本价:
                    {
                        sell: 1,
                        cost: 2
                    }`,
        },
        featureDesc: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "清单项目特征描述",
        },
        feature: {
            type: DataTypes.ARRAY(DataTypes.JSONB),
            allowNull: true,
            comment: "清单项目特征参数",
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
        tableName: "list_item",
        paranoid: true,
        comment: "清单项目",
        sequelize: Models,
    }
);
