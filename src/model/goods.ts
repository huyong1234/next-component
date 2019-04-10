// import { Model, DataTypes } from "sequelize";
// import Models from "./sequelizeBridge";

// export class Goods extends Model {
//     public id?: number;
//     public code?: string;
//     public name?: string;
//     public attr?: object;
//     public tags?: string[];
//     public preview?: string[];
//     public owner?: number;
//     public author?: string;
//     public status?: string;
//     public componentId?: number;
// }

// Goods.init(
//     {
//         id: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             unique: true,
//             primaryKey: true,
//             autoIncrement: true,
//             comment: "商品ID",
//         },
//         code: {
//             type: DataTypes.STRING,
//             allowNull: false,
//             unique: false,
//             comment: "商品编码",
//         },
//         name: {
//             type: DataTypes.STRING,
//             allowNull: false,
//             unique: false,
//             comment: "商品名称",
//         },
//         attr: {
//             type: DataTypes.JSONB,
//             allowNull: true,
//             comment: "商品属性取值",
//         },
//         tags: {
//             type: DataTypes.ARRAY(DataTypes.STRING),
//             allowNull: true,
//             comment: "标签集合",
//         },
//         preview: {
//             type: DataTypes.ARRAY(DataTypes.STRING),
//             allowNull: true,
//             comment: "预览图",
//         },
//         owner: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             comment: "所属ID",
//         },
//         author: {
//             type: DataTypes.STRING,
//             allowNull: false,
//             comment: "上传人的账户名字",
//         },
//         status: {
//             type: DataTypes.STRING,
//             allowNull: false,
//             comment: "模型状态",
//         },
//         componentId: {
//             type: DataTypes.INTEGER,
//             allowNull: true,
//             comment: "构件ID",
//         },
//     },
//     {
//         tableName: "component_goods",
//         paranoid: true,
//         comment: "商品",
//         sequelize: Models,
//     }
// );
