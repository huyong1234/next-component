import { pick as Pick } from "lodash";
import { Model, DataTypes, Sequelize } from "sequelize";
import Models from "./sequelizeBridge";

export interface IComponentGroupOptions {
    name: string;
    parentId?: number;
    order: string;
    // 新增构件分组，classIds为[]空数组
    classIds: number[];
    owner: number;
}

export interface IUpdateComponentGroupOptions {
    id: number;
    name?: string;
    classIds?: number[];
    order?: string;
    parentId?: number;
}

export class ComponentGroup extends Model {
    public static async deleteComponentGroup(ids: number[]) {
        await ComponentGroup.destroy({ where: { id: ids } });
    }

    public static async deleteBindedClasses(id: number, toDeleteClassId: number) {
        await ComponentGroup.update(
            {
                classIds: Sequelize.fn("array_remove", Sequelize.col("classIds"), toDeleteClassId),
            },
            { where: { id: id } });
    }

    public static async updateComponentGroup(options: IUpdateComponentGroupOptions) {
        const toUpdate: {
            name?: string; classIds?: number[]; order?: string; parentId?: number;
        } = Pick(options, ["name", "classIds", "order", "parentId"]);
        if (!Object.keys(toUpdate).length) {
            throw new Error("There is nothing to update");
        }
        await ComponentGroup.update(toUpdate, { where: { id: options.id } });
    }

    // get component group tree
    public static async getComponentGroupTree(owner: number, id?: number) {
        const attrs = ["id", "name", "parentId", "order", "classIds", "owner"];
        const conditions: {
            owner: number;
            parentId?: null | number;
            id?: number;
        } = { owner: owner };
        if (id !== undefined) {
            conditions.id = id;
        } else {
            conditions.parentId = null;
        }
        const result = await ComponentGroup.findAll(
            {
                where: <any>conditions,
                attributes: attrs,
                include: [{
                    model: ComponentGroup,
                    attributes: attrs,
                    include: [{
                        model: ComponentGroup,
                        attributes: attrs,
                    }],
                }],
                order: [["order", "ASC"], [ComponentGroup, "order", "ASC"], [ComponentGroup, ComponentGroup, "order", "ASC"]],
            }
        );
        return result;
    }
    // create component group
    public static async addComponentGroup(options: IComponentGroupOptions) {
        await ComponentGroup.create(options);
    }

    public static async getComponentGroup(options: {
        id?: number;
        ids?: number[];
        parentId?: number;
        owner: number;
    }) {
        const conditions: {
            owner?: number, id?: number | number[], parentId?: number
        } = Pick(options, ["id", "parentId", "owner"]);

        if (options.ids) {
            conditions.id = options.ids;
        }
        const result = await ComponentGroup.findAll(
            {
                where: <any>conditions,
                attributes: ["id", "name", "parentId", "order", "classIds", "owner"],
                order: [["parentId", "ASC"], ["order", "ASC"]],
                raw: true,
            }
        );
        return result;
    }

    public id?: number;
    public name?: string;
    public parentId?: number;
    public order?: string;
    public classIds?: number[];
    public owner?: number;
}

ComponentGroup.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            comment: "节点ID",
        },
        name: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: false,
            comment: "构件分组名称",
        },
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "父节点ID",
        },
        order: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "序号",
        },
        classIds: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: false,
            comment: "clientClass ID集合",
        },
        owner: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "企业ID",
        },
    },
    {
        tableName: "component_group",
        paranoid: false,
        comment: "企业构件分组",
        sequelize: Models,
    }
);
