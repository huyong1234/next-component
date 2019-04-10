import { pick as Pick } from "lodash";
import { Model, DataTypes, Op } from "sequelize";
import Models from "./sequelizeBridge";
import { Catalog } from "./listNormCatalog";

export interface IGetMaterialItemOptions {
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
    provider?: string;
}

export interface IAddMaterialItem {
    code: string;
    name: string;
    preview?: string[];
    category: string;
    provider: string;
    pattern?: string;
    format?: string;
    brand?: string;
    series?: string;
    unit: string;
    loss?: number;
    price: object;
    comment?: string;
    componentId?: number;
    catalogId: number;
    libId: number;
    status: string;
    owner: number;
}

export interface IUpdateMaterialOptions {
    materialId: number;
    code?: string;
    name?: string;
    preview?: string[];
    category?: string;
    provider?: string;
    pattern?: string;
    format?: string;
    brand?: string;
    series?: string;
    unit?: string;
    loss?: number;
    price?: { sell: number; cost: number; };
    comment?: string;
    catalogId?: number;
    libId: number;
}

export class MaterialItem extends Model {
    public static async updateMaterialItem(options: IUpdateMaterialOptions) {
        const toUpdate: {
            code?: string;
            name?: string;
            preview?: string[];
            category?: string;
            provider?: string;
            pattern?: string;
            format?: string;
            brand?: string;
            series?: string;
            unit?: string;
            loss?: number;
            price?: { sell: number; cost: number; };
            comment?: string;
            catalogId?: number;
        } = Pick(options, [
            "code", "name", "preview", "category", "provider", "pattern",
            "format", "brand", "series", "unit", "loss", "price", "comment", "catalogId"]);
        if (!Object.keys(toUpdate).length) {
            throw new Error("There is nothing to update");
        }
        await MaterialItem.update(toUpdate, { where: { id: options.materialId } });
    }

    public static async addMaterialItem(options: IAddMaterialItem) {
        await MaterialItem.create(options);
    }

    public static async getItems(options: IGetMaterialItemOptions) {
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
            if (options.category === "材料") {
                conditions.category = ["主材", "辅材", "家电", "软装"];
            }
        }
        if (options.provider !== undefined) {
            conditions.provider = options.provider;
        }
        const include = [];
        if (options.libId !== undefined) {
            conditions.libId = options.libId;
            if (options.catalogId !== undefined || options.catalogIds !== undefined) {
                include.push({
                    model: Catalog,
                    where: { libId: options.libId },
                    attributes: [],
                });
            }
        }

        const { page = 1, pageSize = 10 } = options;
        const result = await MaterialItem.findAndCountAll({
            include: include,
            where: conditions,
            order: [["updatedAt", "DESC"]],
            raw: true,
            offset: (page - 1) * pageSize,
            limit: pageSize,
            distinct: true,
        });
        return result;
    }

    public static async getMaterialItem(owner: number, libId: number) {
        const result = await MaterialItem.findAll({
            where: {
                owner: owner,
                libId: libId,
            },
            order: [["updatedAt", "DESC"]],
        });
        return result;
    }

    public static async deleteItems(id: number): Promise<number> {
        return await MaterialItem.destroy({ where: { id: id } });
    }

    public id?: number;
    public code?: string;
    public name?: string;
    public preview?: string[];
    public category?: string;
    public provider?: string;
    public pattern?: string;
    public format?: string;
    public brand?: string;
    public series?: string;
    public unit?: string;
    public loss?: number;
    public price?: object;
    public comment?: string;
    public componentId?: number;
    public catalogId?: number;
    public libId?: number;
    public status?: string;
    public owner?: number;
}

MaterialItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "项目ID",
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "项目编号",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "项目名称",
        },
        preview: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            comment: "预览图",
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "项目类型: 人工 | 机械 | 主材 | 辅材 | 家电 | 软装",
        },
        provider: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "供应方：a(甲方) | b(乙方)",
        },
        pattern: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "型号",
        },
        format: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "规格",
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "品牌",
        },
        series: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "系列",
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "单位",
        },
        loss: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: "损耗",
        },
        price: {
            type: DataTypes.JSONB,
            allowNull: false,
            comment: `销售价/成本价:
                    {
                        sell: 1,
                        cost: 2
                    }`,
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "备注",
        },
        componentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "构件ID",
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
    },
    {
        tableName: "list_norm_material_item",
        paranoid: true,
        comment: "人材机项目",
        sequelize: Models,
    }
);
