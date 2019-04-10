import { Model, DataTypes,Op } from "sequelize";
import Models from "./sequelizeBridge";

export class NormMaterialMap extends Model {
    public static async getNormMaterialMap(ids: number[]) {
        const normMaterialMap = await NormMaterialMap.findAll({
            where: {
                materialId : {
                    [Op.in]: ids,
                },
            },
        });
        return normMaterialMap;
    }
    public normId?: number;
    public materialId?: number;
    public quantity?: number;
    public loss?: number;
}

NormMaterialMap.init(
    {
        normId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            comment: "定额项目ID",
        },
        materialId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            comment: "材料项目ID",
        },
        quantity: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 1,
            comment: "材料项目占比",
        },
        loss: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: "材料损耗",
        },
    },
    {
        tableName: "list_norm_material_map",
        comment: "定额项目与人材机项目映射关系",
        sequelize: Models,
    }
);
