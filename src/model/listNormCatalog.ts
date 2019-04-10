import { pick as Pick } from "lodash";
import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export interface IGetCatalogOptions {
    owner: number;
    libId: number;
    id?: number;
    ids?: number[];
    type?: string;
}

export interface IAdddCatalogOptions {
    name: string;
    parentId?: number;
    order: string;
    comment?: string;
    owner: number;
    libId: number;
    type?: string;
}

export interface IUpdateCatalog {
    id: number;
    name?: string;
    order?: string;
    parentId?: null | number;
    comment?: string;
    type?: string;
}

export class Catalog extends Model {
    public static async deleteCatalog(owner: number, ids: number[]) {
        await Catalog.destroy({ where: { owner: owner, id: ids } });
    }

    public static async updateCatalog(options: IUpdateCatalog) {
        const toUpdate: {
            name?: string; order?: string; parentId?: null | number;
        } = Pick(options, ["name", "order", "parentId", "comment", "type"]);
        if (!Object.keys(toUpdate).length) {
            throw new Error("There is nothing to update");
        }
        await Catalog.update(toUpdate, { where: { id: options.id } });
    }

    public static async getCatalog(options: IGetCatalogOptions) {
        const conditions: any = Pick(options, ["owner", "libId", "id", "type"]);
        if (options.ids !== undefined) {
            conditions.id = options.ids;
        }
        const result = await Catalog.findAll({
            where: conditions,
            raw: true,
            order: [["parentId", "ASC"], ["order", "ASC"]],
        });
        return result;
    }

    public static async getCatalogTree(options: IGetCatalogOptions) {
        const conditions: {
            owner: number;
            libId: number;
            id?: number;
            parentId?: null | number;
        } = Pick(options, ["owner", "libId", "type"]);
        if (options.id !== undefined) {
            conditions.id = options.id;
        } else {
            conditions.parentId = null;
        }
        const result = await Catalog.findAll({
            include: [{
                model: Catalog,
                include: [{
                    model: Catalog,
                }],
            }],
            where: <any>conditions,
            order: [["order", "ASC"], [Catalog, "order", "ASC"], [Catalog, Catalog, "order", "ASC"]],
        });
        return result;
    }

    public static async addCatalog(options: IAdddCatalogOptions) {
        await Catalog.create(options);
    }

    public id?: number;
    public name?: string;
    public parentId?: number;
    public order?: string;
    public type?: string;
    public comment?: string;
    public owner?: number;
    public libId?: number;
}

Catalog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "章节ID",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "章节名称",
        },
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "父节点ID",
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "类型描述",
        },
        order: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "序号",
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
        libId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "库ID",
        },
    },
    {
        tableName: "list_norm_catalog",
        paranoid: true,
        comment: "清单定额库目录",
        sequelize: Models,
    }
);
