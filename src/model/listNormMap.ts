import { Model, DataTypes, Op } from "sequelize";
import Models from "./sequelizeBridge";

export class ListNormMap extends Model {
    public static async getListNormMap(ids: number[]) {
        const listNormMap = await ListNormMap.findAll({
            where: {
                normId: {
                    [Op.in]: ids,
                },
            },
        });
        return listNormMap;
    }
    public listId?: number;
    public normId?: number;
    public quantity?: number;
}


ListNormMap.init(
    {
        listId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            comment: "清单项目ID",
        },
        normId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            comment: "定额项目ID",
        },
        quantity: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 1,
            comment: "定额项目占比",
        },
    },
    {
        tableName: "list_norm_map",
        comment: "清单定额项目映射关系",
        sequelize: Models,
    }
);
