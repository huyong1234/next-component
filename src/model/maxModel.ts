import { Model, DataTypes, Order, IncludeOptions, WhereAttributeHash } from "sequelize";
import Models from "./sequelizeBridge";
export interface IMaxModelQuery {
    offset?: number;
    limit?: number;
    attributes?: string[];
    order?: Order;
    raw?: boolean;
    include?: IncludeOptions[];
    where?: WhereAttributeHash;
}
export enum modelType {
    max = "max",
    render = "render",
    web = "web",
}
export class MaxModel extends Model {
    public static defaultOpt = {
        raw: false,
        attributes: ["id", "name", "preview", "status", "type", "createdAt"],
        order: <Order>[["createdAt", "DESC"]],
    };
    public static async getList(opt: IMaxModelQuery) {
        const rawOpt = opt.raw !== undefined ? opt.raw : this.defaultOpt.raw;
        const attributesOpt = opt.attributes !== undefined ? opt.attributes : this.defaultOpt.attributes;
        const orderOpt = opt.order !== undefined ? opt.order : this.defaultOpt.order;
        return this.findAll({
            where: opt.where,
            raw: rawOpt,
            attributes: attributesOpt,
            order: orderOpt,
            offset: opt.offset,
            limit: opt.limit,
        });
    }
    public static async getSelectList(opt: IMaxModelQuery) {
        const rawOpt = opt.raw !== undefined ? opt.raw : this.defaultOpt.raw;
        const attributesOpt = opt.attributes !== undefined ? opt.attributes : this.defaultOpt.attributes;
        const orderOpt = opt.order !== undefined ? opt.order : this.defaultOpt.order;
        const includeOpt = opt.include !== undefined ? opt.include : [];
        return this.findAll({
            where: opt.where,
            raw: rawOpt,
            include: includeOpt,
            attributes: attributesOpt,
            order: orderOpt,
            offset: opt.offset,
            limit: opt.limit,
        });
    }
    public static async get(opt: IMaxModelQuery) {
        const rawOpt = opt.raw !== undefined ? opt.raw : this.defaultOpt.raw;
        const attributesOpt = opt.attributes !== undefined ? opt.attributes : this.defaultOpt.attributes;
        const includeOpt = opt.include !== undefined ? opt.include : [];
        return this.findOne({
            where: opt.where,
            include: includeOpt,
            raw: rawOpt,
            attributes: attributesOpt,
        });
    }
    public id?: string;
    public type?: string;
    public name?: string;
    public attr?: object;
    public preview?: string[];
    public file?: string;
    public owner?: number;
    public author?: string;
    public status?: string;
}

MaxModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true,
            comment: "模型UUID",
        },
        type: {
            type: DataTypes.ENUM(...Object.keys(modelType)),
            allowNull: false,
            comment: "模型类型",
        },
        name: {
            type: DataTypes.STRING,
            comment: "模型名",
        },
        attr: {
            type: DataTypes.JSONB,
            comment: "模型属性",
        },
        file: {
            type: DataTypes.JSONB,//数据结构{"url":"http://OSSxxxx"}
            comment: "模型文件",
        },
        preview: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            comment: "预览图",
        },
        owner: {
            type: DataTypes.INTEGER,
            comment: "所属ID",
        },
        author: {
            type: DataTypes.STRING,
            comment: "上传人的账户名字",
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "creating",
            comment: "模型状态",
        },
    },
    {
        tableName: "component_max_model",
        paranoid: true,
        comment: "构件max模型库",
        sequelize: Models,
    }
);

/*
*status :
    uploadCreating
    parseWaiting
    parsing
    failed
    renderCreating
    renderWaiting
    renderWaitingParts
    renderPreparing
    rendering
    renderFailed
    renderCanceled
    modelAuditing
    modelActive
    modelInvalid
    modelDelete
*/
