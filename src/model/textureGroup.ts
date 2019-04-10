import { Model, DataTypes } from "sequelize";
import Models from "./sequelizeBridge";

export class TextureGroup extends Model {
    public id?: number;
    public name?: string;
    public parentId?: number;
    public status?: string;
    public order?: string;
    public config?: {
        matFile?: string,
        textureName?: string[],
        matName?: string,
        previewName?: string,
        textureFile?: string
    };
    public preview?: string[];
    public materialJson?: {};
}

TextureGroup.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "标签名",
        },
        order: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "顺序",
        },
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "父组ID",
        },
        config: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: "关联的文件",
        },
        preview: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            comment: "预览图",
        },
        materialJson: {
            type: DataTypes.JSON,
            comment: "材质的JSON",
        },
        status: {
            type: DataTypes.STRING,
            comment: "状态",
        },
    },
    {
        tableName: "component_texture_group",
        paranoid: true,
        comment: "材质类型分组",
        sequelize: Models,
    }
);
