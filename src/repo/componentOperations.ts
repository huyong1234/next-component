import { pick as Pick } from "lodash";
import { Sequelize, Op, Transaction } from "sequelize";
import {
    Models, Approval, ComponentGroup,
    Component, ComponentGroupMap, ComponentModelMap,
    SynonymTagMap
} from "../model";
import * as TagOps from "./tagOperations";
import Config from "../config";

export const getApprover = async (owner: number, author: string) => {
    const result = await Approval.findAll({
        include: [{
            attributes: [],
            model: Component,
            where: { owner: owner, author: author },
        }],
        attributes: [[Sequelize.fn("distinct", Sequelize.col("approver")), "approver"]],
        raw: true,
    });
    return result;
};

export interface IApproveOptions {
    componentIds: number[];
    approver: string;
    opinion: boolean;
    status: string;
    owner: number;
}

export const approveComponent = async (options: IApproveOptions) => {
    const transaction = await Models.transaction();
    try {
        // 锁定构件
        const components = await Models.query(
            `select * from ${Component.tableName} where id in (:ids) and status='pending' for update nowait`,
            {
                replacements: { ids: options.componentIds },
                type: (<any>Models).QueryTypes.SELECT,
                transaction: transaction,
            }
        );
        if (components.length !== options.componentIds.length) {
            throw new Error("Some components status are changed.");
        }
        // 锁定审批单
        const approvals = await Models.query(
            `select * from ${Approval.tableName} where "componentId" in (:ids) and status='pending' for update nowait`,
            {
                replacements: { ids: options.componentIds },
                type: (<any>Models).QueryTypes.SELECT,
                transaction: transaction,
            }
        );
        if (approvals.length !== options.componentIds.length) {
            throw new Error("Some approval status are changed.");
        }

        if ((options.status !== "rejected") && (options.status !== "active")) {
            throw new Error("status should be 'rejected' or 'active'.");
        }
        const approvalIds = [];
        const sharingComponentIds = [];
        for (const a of approvals) {
            approvalIds.push(a.id);
            if (a.sharing === true) {
                sharingComponentIds.push(a.componentId);
            }
        }
        // 更新“构件”和“审批单”的状态
        await Approval.update({ status: options.status }, {
            where: { id: approvalIds },
            transaction: transaction,
        });
        await Component.update({ status: options.status }, {
            where: { id: options.componentIds },
            transaction: transaction,
        });
        // 如果拒绝("rejected")，则不检查“是否共享至公共库”

        if (options.status === "rejected") {
            await transaction.commit();
            return;
        }

        if (sharingComponentIds.length !== 0) {
            const toSharingComponent: Component[] = [];
            for (const scid of sharingComponentIds) {
                for (const cmpnt of components) {
                    if (scid === cmpnt.id) {
                        toSharingComponent.push(cmpnt);
                    }
                }
            }
            await sharingComponent(toSharingComponent, transaction);
        }

        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

export const sharingComponent = async (components: Component[], transaction: Transaction) => {
    try {
        const componentToCreate = [];
        for (const cmpnt of components) {
            const tmp: any = Pick(cmpnt, [
                "code", "name", "preview", "classIds", "attr", "tags", "origin",
            ]);
            tmp.owner = 1;
            tmp.author = "nestsoft";
            tmp.status = "sharing#" + cmpnt.id;
            componentToCreate.push(tmp);
        }
        // 创建“构件”
        await Component.bulkCreate(componentToCreate, { transaction: transaction });
        const newComponents = await Component.findAll({
            where: { status: { [Op.like]: "sharing#%" } },
            transaction: transaction,
        });

        const oldIdToNewId: { [index: string]: number } = {};
        for (const nc of newComponents) {
            const newId = nc.get("id");
            let oldId = nc.get("status");
            oldId = oldId.slice(oldId.indexOf("#") + 1);
            oldIdToNewId[oldId] = newId;
        }
        // 创建“审批单”
        await toAddApproval({ componentIds: Object.values(oldIdToNewId), sharing: false }, transaction);

        const cmpntModelMap = await ComponentModelMap.findAll({
            where: { componentId: Object.keys(oldIdToNewId) },
            transaction: transaction,
        });
        const newModelMap = [];
        for (const cmms of cmpntModelMap) {
            newModelMap.push({
                componentId: oldIdToNewId[cmms.get("componentId")],
                viewId: cmms.get("viewId"),
                viewType: cmms.get("viewType"),
            });
        }
        // 创建“构件”与model之间关联关系
        await ComponentModelMap.bulkCreate(newModelMap, { transaction: transaction });

        const tagMap = await SynonymTagMap.findAll({
            where: { goodsComponentId: Object.keys(oldIdToNewId) },
            transaction: transaction,
        });
        const newTagMap = [];
        for (const tm of tagMap) {
            newTagMap.push({
                goodsComponentId: oldIdToNewId[tm.get("goodsComponentId")],
                unitType: tm.get("unitType"),
                synonymTagIndex: tm.get("synonymTagIndex"),
            });
        }
        // 创建“构件”与"同义标签索引"之间关联关系
        await SynonymTagMap.bulkCreate(newTagMap, { transaction: transaction });
    } catch (ex) {
        throw ex;
    }
};


export const addApproval = async (options: {
    componentIds: number[];
    sharing: boolean;
}) => {
    const transaction = await Models.transaction();
    try {
        await toAddApproval(options, transaction);
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

export const toAddApproval = async (options: { componentIds: number[]; sharing: boolean; }, transaction: Transaction) => {
    const approvalToAdd = [];
    for (const componentId of options.componentIds) {
        approvalToAdd.push({ sharing: options.sharing, status: "pending", componentId: componentId });
    }

    try {
        await Approval.bulkCreate(approvalToAdd, { transaction: transaction });
        await Component.update({ status: "pending" }, {
            where: { id: options.componentIds },
            transaction: transaction,
        });

        // commit
        // await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        // await transaction.rollback();
        throw ex;
    }
};

export const getComponentWithModel = async (options: {
    owner: number;
    id?: number | number[];
    status?: string | string[];
    attrNotNull?: boolean;
}) => {
    const conditions: any = Pick(options, ["owner", "id", "status"]);
    if (options.attrNotNull === true) {
        conditions.attr = { [Op.not]: null };
    }
    const result = await Component.findAll({
        include: [{
            model: ComponentModelMap,
        }],
        where: <any>conditions,
    });
    return result;
};

export interface IFilterComponentOptions {
    search?: string;
    componentId?: number;
    componentIds?: number[];
    groupId?: number;
    groupIds?: number[];
    status?: string | string[];
    classId?: number;
    classIds?: number[];
    beginTime?: string;
    endTime?: string;
    tag?: string;
    tags?: string[];
    author?: string[];
    begin?: string;
    end?: string;
    approver?: string;
    owner: number;
    origin?: number;
}

export const countComponentInGroup = async (options: IFilterComponentOptions) => {
    const cmpntGroupMapTable = ComponentGroupMap.tableName;
    const componentTable = Component.tableName;
    let sqlQuery
        =
        `select a."groupId" as id, count(b.id) as count
        from ${cmpntGroupMapTable} as a
        inner join ${componentTable} as b on a."componentId" = b.id
        where b.owner=:owner`;
    const replacements: any = { owner: options.owner };
    if (options.search !== undefined) {
        sqlQuery += ` and (b.code like :code or b.name like :name)`;
        replacements.code = "%" + options.search + "%";
        replacements.name = "%" + options.search + "%";
    }
    if (options.componentIds !== undefined) {
        sqlQuery += ` and b.id in (:ids)`;
        replacements.ids = options.componentIds;
    } else if (options.componentId !== undefined) {
        sqlQuery += ` and b.id=:id`;
        replacements.id = options.componentId;
    }
    if (options.status !== undefined) {
        if (Object.prototype.toString.call(options.status) === "[object Array]") {
            sqlQuery += ` and b.status in (:status)`;
        } else if (Object.prototype.toString.call(options.status) === "[object String]") {
            sqlQuery += ` and b.status=:status`;
        }
        replacements.status = options.status;
    }
    if (options.classIds !== undefined) {
        sqlQuery += ` and b."classIds" @> ARRAY[:classIds]::INTEGER[]`;
        replacements.classIds = options.classIds;
    } else if (options.classId !== undefined) {
        sqlQuery += ` and b."classIds" @> ARRAY[:classId]::INTEGER[]`;
        replacements.classId = options.classId;
    }
    if (options.beginTime !== undefined && options.endTime !== undefined) {
        const beginTime = new Date(parseInt(options.beginTime, 10)).toJSON();
        const endTime = new Date(parseInt(options.endTime, 10));
        endTime.setDate(endTime.getDate() + 1);
        sqlQuery += ` and b."createdAt" >=TIMESTAMP WITHOUT TIME ZONE :beginTime
         and b."createdAt" < TIMESTAMP WITHOUT TIME ZONE :endTime`;
        replacements.beginTime = beginTime;
        replacements.endTime = endTime.toJSON();
    } else if (options.beginTime !== undefined) {
        const beginTime = new Date(parseInt(options.beginTime, 10)).toJSON();
        sqlQuery += ` and b."createdAt" >=TIMESTAMP WITHOUT TIME ZONE :beginTime`;
        replacements.beginTime = beginTime;
    } else if (options.endTime !== undefined) {
        const endTime = new Date(parseInt(options.endTime, 10));
        endTime.setDate(endTime.getDate() + 1);
        sqlQuery += ` and b."createdAt" < TIMESTAMP WITHOUT TIME ZONE :endTime`;
        replacements.endTime = endTime.toJSON();
    }
    if (options.tags !== undefined) {
        sqlQuery += ` and b."tags" @> ARRAY[:tags]::VARCHAR(255)[]`;
        replacements.tags = options.tags;
    } else if (options.tag !== undefined) {
        sqlQuery += ` and b."tags" @> ARRAY[:tag]::VARCHAR(255)[]`;
        replacements.tag = options.tag;
    }
    sqlQuery += ` group by a."groupId" order by a."groupId"`;
    const result: { id: number; count: number; }[] = await Models.query(
        sqlQuery,
        {
            replacements: replacements,
            type: (<any>Models).QueryTypes.SELECT,
        }
    );
    return result;
};

export interface IComponentAttrOptions {
    componentId: number;
    componentAttrs: { [index: string]: number | string };
}
export const putComponentAttribute = async (options: IComponentAttrOptions) => {
    await Component.update(
        { attr: options.componentAttrs },
        { where: { id: options.componentId } }
    );
};

export const getComponent = async (options: IFilterComponentOptions) => {
    let conditions: any = {};
    if (options.search !== undefined) {
        conditions = {
            [Op.or]: [
                { code: { [Op.like]: `%${options.search}%` } },
                { name: { [Op.like]: `%${options.search}%` } },
            ],
        };
    }

    if (options.componentIds !== undefined) {
        conditions.id = options.componentIds;
    } else if (options.componentId !== undefined) {
        conditions.id = options.componentId;
    }

    if (options.author !== undefined) {
        conditions.author = options.author;
    }
    if (options.origin !== undefined) {
        conditions.origin = options.origin;
    }
    if (options.classIds !== undefined) {
        conditions.classIds = { [Op.contains]: options.classIds };
    } else if (options.classId !== undefined) {
        conditions.classIds = { [Op.contains]: [options.classId] };
    }

    if (options.beginTime !== undefined && options.endTime !== undefined) {
        const beginTime = new Date(parseInt(options.beginTime, 10)).toJSON();
        const endTime = new Date(parseInt(options.endTime, 10));
        endTime.setDate(endTime.getDate() + 1);
        conditions.createdAt = Sequelize.and(
            Sequelize.where(Sequelize.col(`"Component"."createdAt"`), ">=", Sequelize.literal(`TIMESTAMP WITHOUT TIME ZONE '${beginTime}'`)),
            Sequelize.where(Sequelize.col(`"Component"."createdAt"`), "<", Sequelize.literal(`TIMESTAMP WITHOUT TIME ZONE '${endTime.toJSON()}'`))
        );
    } else if (options.beginTime !== undefined) {
        const beginTime = new Date(parseInt(options.beginTime, 10)).toJSON();
        conditions.createdAt = Sequelize.where(
            Sequelize.col(`"Component"."createdAt"`),
            ">=",
            // Sequelize.literal(`TIMESTAMP WITH TIME ZONE '${beginTime}' AT TIME ZONE 'Asia/Shanghai'`));
            Sequelize.literal(`TIMESTAMP WITHOUT TIME ZONE '${beginTime}'`));
    } else if (options.endTime !== undefined) {
        const endTime = new Date(parseInt(options.endTime, 10));
        endTime.setDate(endTime.getDate() + 1);
        conditions.createdAt = Sequelize.where(
            Sequelize.col(`"Component"."createdAt"`),
            "<",
            // Sequelize.literal(`TIMESTAMP WITH TIME ZONE '${endTime.toJSON()}' AT TIME ZONE 'Asia/Shanghai'`));
            Sequelize.literal(`TIMESTAMP WITHOUT TIME ZONE '${endTime.toJSON()}'`));
    }

    if (options.tags !== undefined) {
        conditions.tags = { [Op.contains]: options.tags };
    } else if (options.tag !== undefined) {
        conditions.tags = { [Op.contains]: [options.tag] };
    }

    const includeComponentGroup: any = {
        attributes: [["id", "groupId"]],
        model: ComponentGroup,
        // where: { id: options.groupId },
        through: { attributes: [] },
    };
    if (options.groupId !== undefined) {
        includeComponentGroup.where = { id: options.groupId };
    } else if (options.groupIds !== undefined) {
        includeComponentGroup.where = { id: options.groupIds };
    }

    const includeApproval: any = { model: Approval, where: {}, required: false };
    if (options.begin !== undefined && options.end !== undefined) {
        includeApproval.required = true;
        const begin = new Date(parseInt(options.begin, 10)).toJSON();
        const end = new Date(parseInt(options.end, 10));
        end.setDate(end.getDate() + 1);
        Object.assign(includeApproval.where, {
            createdAt: Sequelize.and(
                Sequelize.where(Sequelize.col(`"Approvals"."createdAt"`), ">=", Sequelize.literal(`TIMESTAMP WITHOUT TIME ZONE '${begin}'`)),
                Sequelize.where(Sequelize.col(`"Approvals"."createdAt"`), "<", Sequelize.literal(`TIMESTAMP WITHOUT TIME ZONE '${end.toJSON()}'`))
            ),
        });
    } else if (options.begin !== undefined) {
        includeApproval.required = true;
        const begin = new Date(parseInt(options.begin, 10)).toJSON();
        Object.assign(includeApproval.where, {
            createdAt: Sequelize.where(Sequelize.col(`"Approvals"."createdAt"`), ">=", Sequelize.literal(`TIMESTAMP WITHOUT TIME ZONE '${begin}'`)),
        });
    } else if (options.end !== undefined) {
        includeApproval.required = true;
        const end = new Date(parseInt(options.end, 10));
        end.setDate(end.getDate() + 1);
        Object.assign(includeApproval.where, {
            createdAt: Sequelize.where(Sequelize.col(`"Approvals"."createdAt"`), "<", Sequelize.literal(`TIMESTAMP WITHOUT TIME ZONE '${end.toJSON()}'`)),
        });
    }

    if (options.approver !== undefined) {
        includeApproval.required = true;
        Object.assign(includeApproval.where, { approver: options.approver });
    }
    if (options.status !== undefined) {
        conditions.status = options.status;
        Object.assign(includeApproval.where, { status: options.status });
    }

    const include: any = [includeApproval];
    if (includeComponentGroup !== undefined) {
        include.push(includeComponentGroup);
    }
    conditions.owner = options.owner;
    const prefix = Config.get("resultOSS.url");
    const result = await Component.findAll({
        attributes: ["id", "code", "name", "classIds", "attr", "tags", "owner", "author", "origin", "status", "createdAt", "updatedAt",
            [Sequelize.fn("array_prepend", prefix, Sequelize.col("preview")), "preview"]],
        include: include,
        where: conditions,
        order: [["createdAt", "DESC"]],
    });
    return result;
};

export interface IAddComponentOptions {
    code: string;
    name: string;
    groupIds?: number[];
    classIds: number[];
    preview: string[];
    tags?: string[];
    models?: {
        cadModel: string;
        maxModel: string;
        texture: string;
        threeView: string;
        nodeDiagram: string;
        [index: string]: string;
    };
    owner: number;
    origin: number;
    author: string;
    status: string;
}

export const addComponent = async (options: IAddComponentOptions) => {
    const transaction = await Models.transaction();
    try {
        const componentId = await toAddComponent(options, transaction);
        // commit
        await transaction.commit();
        return componentId;
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

export const toAddComponent = async (options: IAddComponentOptions, transaction: Transaction) => {
    try {
        // 创建“构件”
        const componentToCreate = Pick(options, [
            "code", "name", "preview", "classIds", "tags", "owner", "origin", "author", "status",
        ]);
        const component = await Component.create(componentToCreate, { transaction });
        const componentId = component.get("id");

        // 挂载component到component group
        if (options.groupIds !== undefined) {
            const cgMap = [];
            for (const gid of options.groupIds) {
                cgMap.push({ groupId: gid, componentId: componentId });
            }
            await ComponentGroupMap.bulkCreate(cgMap, { transaction });
        }

        // 绑定component与model
        const cmMap = [];
        if (options.models) {
            for (const key in options.models) {
                if (options.models[key]) {
                    cmMap.push({ componentId: componentId, viewId: options.models[key], viewType: key });
                }
            }
        }
        await ComponentModelMap.bulkCreate(cmMap, { transaction });

        // 标签相关
        if (options.tags && options.tags.length) {
            await TagOps.addNewTag(
                {
                    owner: options.owner,
                    componentId: componentId,
                    tags: options.tags,
                },
                transaction
            );
        }
        // commit
        // await transaction.commit();

        // return
        return componentId;
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        // await transaction.rollback();
        throw ex;
    }
};
