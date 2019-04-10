import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class SynonymTagMap extends Model {
    public id?: number;
    public goodsComponentId?: number;
    public unitType?: string;
    public synonymTagIndex?: number;

}

SynonymTagMap.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID",
        },
        goodsComponentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "外键:商品、构建ID",
        },
        unitType: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "部件类型: goods or component",
        },
        synonymTagIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "同义词ID",
        },
    },
    {
        tableName: "component_synonym_tag_map",
        paranoid: true,
        comment: "标签库",
        sequelize: Models,
    }
);
