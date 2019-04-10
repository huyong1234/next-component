import { pick as Pick } from "lodash";
import { Model, DataTypes, Op, Sequelize } from "sequelize";
import Models from "./sequelizeBridge";
import { ListNormMap } from "./listNormMap";
import { ListItem, NormItem, NormMaterialMap, MaterialItem } from ".";

export interface IGetLibraryOptions {
    owner: number;
    region?: string;
    name?: string;
    id?: number | number[];
    relationLib?: number;
    type?: string | string[];
    status?: string;
    version?: number;
    baseLibrary?: number;
    page?: number;
    pageSize?: number;
}

export interface IAddLibraryOptions {
    name: string;
    type: string; // "calculate", "match", "list", "norm", "material"
    region?: string;
    version?: number;
    baseLibrary?: number;
    comment?: string;
    status?: string;
    owner: number;
}

export interface IUpdateLibOptions {
    owner: number;
    type?: string;
    id?: number | number[];
    name?: string;
    region?: string;
    comment?: string;
    status?: string;
}

export class Library extends Model {
    public static async updateLibrary(options: IUpdateLibOptions) {
        const toUpdate: {
            name?: string; region?: string; comment?: string; status?: string;
        } = Pick(options, ["name", "region", "comment", "status", "relationLib"]);

        if (!Object.keys(toUpdate).length) {
            throw new Error("There is nothing to update");
        }
        if (options.region !== undefined && (options.type === "list" || options.type === "norm")) {
            const transaction = await Models.transaction();
            try {
                await Library.update(toUpdate, {
                    where: { owner: options.owner, id: options.id! },
                    transaction: transaction,
                });

                await Library.update({ region: options.region }, {
                    where: { owner: options.owner, baseLibrary: options.id! },
                    transaction: transaction,
                });
                // commit
                await transaction.commit();
            } catch (ex) {
                // Rollback transaction if any errors were encountered
                await transaction.rollback();
                throw ex;
            }
        } else {
            await Library.update(toUpdate, { where: { owner: options.owner, id: options.id! } });
        }
    }

    public static async getLibRegion(owner: number) {
        const result = await Library.findAll({
            where: { owner: owner, region: { [Op.not]: null } },
            attributes: [[Sequelize.fn("distinct", Sequelize.col("region")), "region"]],
            raw: true,
        });
        return result;
    }

    public static async getSeriesLibrary(owner: number, id: number) {
        const { rows } = await Library.getLibrary({ owner, id });
        const libs = rows;
        let baselibId = 0;
        if (typeof libs[0].baseLibrary === "number") {
            baselibId = libs[0].baseLibrary!;
        } else {
            baselibId = libs[0].id!;
        }
        const result = await Library.findAll({
            where: { owner: owner, [Op.or]: [{ id: baselibId }, { baseLibrary: baselibId }] },
            order: [["version", "DESC"]],
            raw: true,
        });
        return result;
    }

    public static async getMatchLibrary(options: IGetLibraryOptions): Promise<{ RelationLib?: { type: string } } & Library[]> {
        const result = await Library.findAll({
            attributes: ["id", "name", "type", "owner", "relationLib"],
            where: <any>options,
            include: [{
                model: Library,
                as: "RelationLib",
                attributes: ["id", "name", "type", "region", "version", "status"],
            }],
            order: [["updatedAt", "DESC"]],
        });

        return result;
    }
    // 根据清单库id或者定额库id查询匹配规则库
    public static async getMatchByRelationId(id: number) {
        // const matchMap = await MatchMap.findAll({
        //     where: {
        //         relationLib: id,
        //     },
        // });
        // // 计算规则集合
        // const matchIdList = [];
        // for (const iterator of matchMap) {
        //     matchIdList.push(iterator.matchId);
        // }
        // // 去重
        // const matchList = [...new Set(matchIdList)];
        // const match = await MatchRule.findAll({
        //     where: {
        //         id: {
        //             [Op.in]: <any>matchList,
        //         },
        //     },
        // });
        // // 匹配规则库集合
        // const libraryId = [];
        // for (const iterator of match) {
        //     libraryId.push(iterator.libId);
        // }
        // const idList = [...new Set(libraryId)];
        // const matchLibrary = await Library.findAll({
        //     where: {
        //         id: {
        //             [Op.in]: <any>idList,
        //         },
        //     },
        // });
        const matchLibrary = await Library.findAll({
            where: {
                relationLib: id,
            },
        });
        return matchLibrary;
    }

    public static async getLibrary(options: IGetLibraryOptions) {
        const conditions: any = Pick(options, ["owner", "id", "type", "region", "version", "status", "baseLibrary", "relationLib"]);
        if (options.name !== undefined) {
            conditions.name = { [Op.like]: `%${options.name}%` };
        }
        const { page = 1, pageSize = 10 } = options;
        const result = await Library.findAndCountAll({
            where: <any>conditions,
            raw: true,
            order: [["updatedAt", "DESC"]],
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });
        return result;
    }

    // 根据清单库id查询定额库id
    public static async getLibraryByListId(id: number) {
        const result = await Models.query(
            // tslint:disable-next-line:max-line-length
            `select distinct(c."libId") from ${ListNormMap.tableName} as a inner join ${ListItem.tableName} as b on a."listId" = b."id" and b."libId" = :id inner join ${NormItem.tableName} as c on a."normId" = c."id";`,
            {
                replacements: { id: id },
                type: (<any>Models).QueryTypes.SELECT,
            }
        );
        const list = [];
        if (result.length > 0) {
            for (const iterator of result) {
                list.push(iterator.libId);
            }
            const normList = await Library.findAll({
                where: {
                    id: {
                        [Op.in]: list,
                    },
                },
            }
            );
            return normList;
        }
        return result;
    }


    // 根据定额库id查询人材机库id
    public static async getMaterialByNormId(id: number) {
        const queryStr = `
            select distinct a."libId" from ${MaterialItem.tableName} a
            inner join ${NormMaterialMap.tableName} b on a."id" = b."materialId"
            inner join ${NormItem.tableName} c on b."normId" = c."id" and c."libId" = :normLibId
        `;
        const result = await Models.query(
            queryStr,
            {
                replacements: { normLibId: id },
                type: (<any>Models).QueryTypes.SELECT,
            }
        );

        if (result.length <= 0) {
            return result;
        }

        const materialLibIds = [];
        for (const iterator of result) {
            materialLibIds.push(iterator.libId);
        }
        const libs = await Library.findAll({
            where: {
                id: {
                    [Op.in]: materialLibIds,
                },
            },
        }
        );
        return libs;
    }

    public static async addLibrary(options: IAddLibraryOptions) {
        if (options.version === undefined) {
            options.version = 1;
        }
        await Library.create(options);
    }

    public id?: number;
    public name?: string;
    public type?: string; // "list", "norm", "calculate", "material"
    public region?: string;
    public version?: number;
    public comment?: string;
    public baseLibrary?: number;
    public relationLib?: number;
    public status?: string;
    public owner?: number;
}

Library.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "库ID",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "库名称",
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "库类型",
        },
        region: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "地域信息",
        },
        version: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: "库版本",
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "备注",
        },
        baseLibrary: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "基础库ID",
        },
        relationLib: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "关联库ID",
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
        tableName: "list_norm_library",
        paranoid: true,
        comment: "清单定额库信息",
        sequelize: Models,
    }
);
