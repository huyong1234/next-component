import { pick as Pick, omit as Omit, assign as Assign } from "lodash";
import { Op, Transaction } from "sequelize";
import {
    Models, ClassVersion, ClientClass, ClassGroup,
    Library, ListItem, NormItem, MatchMap, IaddMatchMap,
    MaterialItem, CalculateRule, MatchRule, IcalculateRule,
    ListNormMap, NormMaterialMap, Catalog,
    ImportTask, IUpdateMatchRule, ImatchListNorm, Attribute, Version
} from "../model";

export const getAddedNormItems = async (listId: number, owner: number) => {
    const sqlQuery = `
        select d."name" as "libraryName", b.*, a."normId", a."quantity"
        from ${ListNormMap.tableName} as a
        inner join ${NormItem.tableName} as b on b."id" = a."normId"
        inner join ${Catalog.tableName} as c on c."id" = b."catalogId"
        inner join ${Library.tableName} as d on d."id" = c."libId"
        where a."listId"=:listId and b."owner"=:owner
        `;
    const replacements = { listId, owner };
    const result = await Models.query(
        sqlQuery,
        {
            replacements: replacements,
            type: (<any>Models).QueryTypes.SELECT,
        }
    );
    return result;
};

export const getAddedMaterialItems = async (normId: number, owner: number) => {
    const sqlQuery = `
        select
        d."name" as "libraryName",
        b."id", b."code", b."name", b."category", b."provider", b."pattern",
        b."format", b."brand", b."series", b."unit", b."price", b."comment",
        b."componentId", a."materialId", a."quantity", a."loss"
        from ${NormMaterialMap.tableName} as a
        inner join ${MaterialItem.tableName} as b on b."id" = a."materialId"
        inner join ${Catalog.tableName} as c on c."id" = b."catalogId"
        inner join ${Library.tableName} as d on d."id" = c."libId"
        where a."normId"=:normId and b."owner"=:owner
        `;
    const replacements = { normId, owner };
    const result = await Models.query(
        sqlQuery,
        {
            replacements: replacements,
            type: (<any>Models).QueryTypes.SELECT,
        }
    );
    return result;
};

const deleteListNormMap = async (listIds: number | number[], transaction: Transaction) => {
    try {
        await ListNormMap.destroy({ where: { listId: listIds }, transaction: transaction });
        // commit
        // await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        // await transaction.rollback();
        throw ex;
    }
};

const deleteNormMaterialMap = async (normIds: number | number[], transaction: Transaction) => {
    try {
        await NormMaterialMap.destroy({ where: { normId: normIds }, transaction: transaction });
        // commit
        // await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        // await transaction.rollback();
        throw ex;
    }
};

export const deleteNormItem = async (id: number) => {
    const transaction = await Models.transaction();
    try {
        await deleteNormMaterialMap(id, transaction);
        await NormItem.destroy({ where: { id } });
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

export const deleteListItem = async (id: number) => {
    const transaction = await Models.transaction();
    try {
        await deleteListNormMap(id, transaction);
        await ListItem.destroy({ where: { id } });
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

const deleteItems = async (libId: number, libType: string, transaction: Transaction) => {
    try {
        let _model;
        if (libType === "list") {
            _model = ListItem;
            // tableName = ListItem.tableName;
        } else if (libType === "norm") {
            _model = NormItem;
            // tableName = NormItem.tableName;
        } else if (libType === "material") {
            _model = MaterialItem;
            // 对人材机表中catalogId为null的做特殊删除处理
            await MaterialItem.destroy({
                where: {
                    libId: libId,
                    catalogId: null,
                },
            });
            // tableName = MaterialItem.tableName;
        } else {
            throw new Error("error library type.");
        }
        const sqlQuery = `select a."id" from ${_model.tableName} as a
                            inner join ${Catalog.tableName} as b on b."id" = a."catalogId"
                            inner join ${Library.tableName} as c on c."id" = b."libId"
                            where c."id"=:libId`;
        const replacements = { libId };
        const items = await Models.query(
            sqlQuery,
            {
                replacements: replacements,
                type: (<any>Models).QueryTypes.SELECT,
                transaction: transaction,
            }
        );
        const toDelItemIds: number[] = [];
        for (const item of items) {
            toDelItemIds.push(item.id);
        }
        if (libType === "list") {
            await deleteListNormMap(toDelItemIds, transaction);
        } else if (libType === "norm") {
            await deleteNormMaterialMap(toDelItemIds, transaction);
        }
        await _model.destroy({ where: { id: toDelItemIds } });
        // commit
        // await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        // await transaction.rollback();
        throw ex;
    }
};

export const deleteLibrary = async (lib: Library) => {
    const transaction = await Models.transaction();
    try {
        if (lib.type === "list" || lib.type === "norm" || lib.type === "material") {
            await deleteItems(lib.id!, lib.type!, transaction);
            await Catalog.destroy({ transaction, where: { libId: lib.id! } });
            if (lib.type !== "material") {
                await MatchRule.destroy({ transaction, where: { libId: lib.id! } });
            }
        } else {
            await CalculateRule.destroy({ transaction, where: { libId: lib.id! } });
        }
        await Library.destroy({ transaction, where: { id: lib.id! } });
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};
export const deleteMatchLibrary = async (lib: { RelationLib?: { type: string } } & Library) => {
    const transaction = await Models.transaction();
    try {
        await MatchRule.destroy({ transaction, where: { libId: lib.id! } });
        await Library.destroy({ transaction, where: { id: lib.id! } });
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

export interface IAddLibImportTask {
    owner: number;
    type: string; // "list", "norm", "calculate", "material"
    name: string;
    region?: string;
    version?: number;
    taskName: string;
    fileUri: string;
    fileType?: string;
}

export const getLibCodeToIdMap = async (options: {
    type: string; owner: number; codes?: string[]; libNames?: string[]; libRegions?: string[]; libVersions?: string[];
}) => {
    let itemTableName: string = "";
    if (options.type === "norm") {
        itemTableName = NormItem.tableName;
    } else if (options.type === "material") {
        itemTableName = MaterialItem.tableName;
    } else {
        throw new Error("Error: option type must be one of ['norm', 'material']");
    }
    // let sqlQuery = `select a.id as "normId", concat(c.name, '_', c.region, '_', c.version, '_', a.code) as "libAndCode"
    //                 from ${itemTableName} as a
    //                 inner join ${Catalog.tableName} as b on a."catalogId" = b.id
    //                 inner join ${Library.tableName} as c on b."libId" = c.id
    //                 where a."owner"=:owner and a."deletedAt" ISNULL
    //                 `;
    let sqlQuery = `select a.id as "normId", concat(b.name, '_', b.region, '_', b.version, '_', a.code) as "libAndCode"
                    from ${itemTableName} as a
                    inner join ${Library.tableName} as b on a."libId" = b.id
                    where a."owner"=:owner and a."deletedAt" ISNULL
                    `;
    const replacements: any = { owner: options.owner };
    if (options.codes !== undefined) {
        sqlQuery += ` and a.code in (:codes)`;
        replacements.codes = options.codes;
    }
    if (options.libNames !== undefined) {
        sqlQuery += ` and b.name in (:libNames)`;
        replacements.libNames = options.libNames;
    }
    if (options.libRegions !== undefined) {
        sqlQuery += ` and b.region in (:libRegions)`;
        replacements.libRegions = options.libRegions;
    }
    if (options.libVersions !== undefined) {
        sqlQuery += ` and b.version in (:libVersions)`;
        replacements.libVersions = options.libVersions;
    }
    const result: { normId: number; libAndCode: string; }[] = await Models.query(
        sqlQuery,
        {
            replacements: replacements,
            type: (<any>Models).QueryTypes.SELECT,
        }
    );
    const libCodeToIdMap = new Map<string, number>();
    for (const rst of result) {
        if (!libCodeToIdMap.has(rst.libAndCode)) {
            libCodeToIdMap.set(rst.libAndCode, rst.normId);
        }
    }
    return libCodeToIdMap;
};

export const addLibImportTask = async (options: IAddLibImportTask) => {
    const transaction = await Models.transaction();
    try {
        // options.status = "active";
        const lib = await Library.create(
            {
                owner: options.owner,
                type: options.type,
                name: options.name,
                region: options.region,
                version: options.version,
                status: "active",
            },
            { transaction }
        );
        const libId = lib.get("id");
        const result = await ImportTask.create(
            {
                owner: options.owner,
                name: options.taskName,
                libId: libId,
                fileUri: options.fileUri,
                status: "creating",
                fileType: options.fileType,
            },
            { transaction }
        );
        const taskId = result.get("id");
        // commit
        await transaction.commit();
        return taskId;
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

export const getCodeSet = async (type: string, owner: number, libId?: number) => {
    let tableA: string = "";
    if (type === "norm") {
        tableA = NormItem.tableName;
    } else if (type === "material") {
        tableA = MaterialItem.tableName;
    } else {
        throw new Error("get error type in getCodeSet function.");
    }
    let sqlQuery
        =
        `select b."libId" as id, array_to_string(array_agg(a.code),',') as "codeSet"
        from ${tableA} as a
        inner join ${Catalog.tableName} as b on a."catalogId" = b.id
        where a.owner=:owner`;
    const replacements: any = { owner: owner };
    if (libId !== undefined) {
        sqlQuery += ` and b."libId"=:libId`;
        replacements.libId = libId;
    }
    sqlQuery += ` group by b."libId";`;
    const result: { id: number; codeSet: string; }[] = await Models.query(
        sqlQuery,
        {
            replacements: replacements,
            type: (<any>Models).QueryTypes.SELECT,
        }
    );
    return result;

};


export interface IGetCalculateRule {
    owner: number;
    id?: number;
    libId?: number;
    name?: string;
    classId?: number;
}

export const getCalculateRule = async (options: IGetCalculateRule) => {
    const conditions: {
        owner: number;
        classId?: number;
        libId?: number;
        id?: number;
        name?: any
    } = Pick(options, ["owner", "classId", "libId", "id"]);
    if (options.name !== undefined) {
        conditions.name = { [Op.like]: `%${options.name}%` };
    }
    const result = await CalculateRule.findAll({
        include: [{
            model: ClassVersion,
            attributes: [["id", "classId"]],
            include: [
                {
                    model: ClientClass,
                    attributes: [["name", "className"]],
                },
                {
                    model: ClassGroup,
                    attributes: [["name", "classGroupName"]],
                },
            ],
        }],
        where: <any>conditions,
        // raw: true,
    });
    return result;
};


export interface IAddNormWithMaterial {
    code: string;
    name: string;
    unit: string;
    loss?: number;
    price?: object;
    featureDesc?: string;
    feature?: string[];
    jobs?: string;
    status: string;
    owner: number;
    catalogId: number;
    libId: number;
    addedMaterial?: {
        materialId: number;
        quantity: number;
        loss?: number;
    }[];
}

export const addNormWithMaterial = async (options: IAddNormWithMaterial) => {
    if (options.addedMaterial === undefined) {
        await NormItem.create(options);
        return;
    }
    const transaction = await Models.transaction();
    try {
        const ni = await NormItem.create(Omit(options, ["addedMaterial"]), { transaction });
        const normId = ni.get("id");
        const normMaterialLink: {
            normId: number;
            materialId: number;
            quantity: number;
            loss?: number;
        }[] = [];
        for (const ad of options.addedMaterial) {
            normMaterialLink.push(Assign({}, ad, { normId }));
        }
        await NormMaterialMap.bulkCreate(normMaterialLink, { transaction });
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};
interface Iprice {
    sell?: {
        labor?: number;
        machine?: number;
        stuffMain?: number;
        stuffAttached?: number;
    };
    cost?: {
        labor?: number;
        machine?: number;
        stuffMain?: number;
        stuffAttached?: number;
    };
}
export interface IUpdateNormItem {
    normId: number;
    code?: string;
    name?: string;
    unit?: string;
    loss?: number;
    price?: Iprice;
    featureDesc?: string;
    feature?: object[];
    jobs?: string;
    catalogId?: number;
    libId: number;
    addedMaterial?: {
        materialId: number;
        quantity: number;
        loss?: number;
        price?: object
    }[];
}

const updateNormMaterialMap = async (
    normId: number,
    transaction: Transaction,
    addedMaterial?: {
        materialId: number;
        quantity: number;
        loss?: number;
    }[]
) => {
    try {
        await deleteNormMaterialMap(normId, transaction);
        const normMaterialLink: {
            normId: number;
            materialId: number;
            quantity: number;
            loss?: number;
        }[] = [];
        if (addedMaterial) {
            for (const ad of addedMaterial) {
                normMaterialLink.push(Assign({}, ad, { normId }));
            }
            await NormMaterialMap.bulkCreate(normMaterialLink, { transaction });
        }

    } catch (error) {
        throw error;
    }
};

export const updateNormItem = async (options: IUpdateNormItem) => {
    const transaction = await Models.transaction();
    try {
        const toUpdate: {
            code?: string;
            name?: string;
            unit?: string;
            loss?: number;
            price?: object;
            featureDesc?: string;
            feature?: object[];
            jobs?: string;
            catalogId?: number;
        } = Pick(options, ["code", "name", "unit", "loss", "price", "featureDesc", "feature", "jobs", "catalogId"]);
        if (!Object.keys(toUpdate).length) {
            throw new Error("There is nothing to update");
        }
        await NormItem.update(toUpdate, { where: { id: options.normId }, transaction: transaction });
        await updateNormMaterialMap(options.normId, transaction, options.addedMaterial);
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

export interface IAddListWithNorm {
    code: string;
    name: string;
    unit: string;
    featureDesc?: string;
    feature?: string[];
    jobs?: string;
    status: string;
    owner: number;
    libId: number;
    catalogId: number;
    addedNorm?: { normId: number; quantity: number }[];
}

export const addListWithNorm = async (options: IAddListWithNorm) => {
    if (options.addedNorm === undefined) {
        await ListItem.create(options);
        return;
    }

    const transaction = await Models.transaction();
    try {
        const li = await ListItem.create(Omit(options, ["addedNorm"]), { transaction });
        const listId = li.get("id");
        const listNormLink: {
            listId: number;
            normId: number;
            quantity: number;
        }[] = [];
        for (const ad of options.addedNorm) {
            listNormLink.push(Assign({}, ad, { listId }));
        }
        await ListNormMap.bulkCreate(listNormLink, { transaction });
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

export interface IUpdateListItemOptions {
    listId: number;
    code?: string;
    name?: string;
    unit?: string;
    price?: { sell?: number, cost?: number };
    featureDesc?: string;
    feature?: object[];
    jobs?: string;
    catalogId?: number;
    libId: number;
    addedNorm?: { normId: number; quantity: number }[];
}

const updateListNormMap = async (listId: number, addedNorm: { normId: number; quantity: number }[], transaction: Transaction) => {
    try {
        await deleteListNormMap(listId, transaction);
        const listNormLink: {
            listId: number;
            normId: number;
            quantity: number;
        }[] = [];
        for (const ad of addedNorm) {
            listNormLink.push(Assign({}, ad, { listId }));
        }
        await ListNormMap.bulkCreate(listNormLink, { transaction });
    } catch (error) {
        throw error;
    }
};
export const updateListItem = async (options: IUpdateListItemOptions) => {
    const transaction = await Models.transaction();
    try {
        const toUpdate: {
            code?: string,
            name?: string,
            unit?: string,
            price?: object,
            featureDesc?: string,
            feature?: object[],
            jobs?: string,
            catalogId?: number
        } = Pick(options, ["code", "name", "unit", "price", "featureDesc", "feature", "jobs", "catalogId"]);
        if (!Object.keys(toUpdate).length) {
            throw new Error("There is nothing to update");
        }
        await ListItem.update(toUpdate, { where: { id: options.listId }, transaction: transaction });
        if (options.addedNorm !== undefined) {
            await updateListNormMap(options.listId, options.addedNorm, transaction);
        }
        // commit
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await transaction.rollback();
        throw ex;
    }
};

export interface IGetMatchRuleOptions {
    owner: number;
    id?: number;
    classId?: [];
    libId?: number;
    page?: number;
    pageSize?: number;
}

export const getMatchRule = async (options: IGetMatchRuleOptions) => {
    const conditions: {
        owner: number;
        id?: number;
        classId?: number[] | number;
        libId?: number;
    } = Pick(options, ["owner", "id", "classId", "libId"]);
    const { page = 1, pageSize = 10 } = options;
    if (options.classId !== undefined && options.classId instanceof Array && options.classId.length > 0) {
        options.classId = <any>{
            [Op.in]: options.classId,
        };
    }
    const data = await MatchRule.findAndCountAll({
        where: <any>conditions,
        order: [["updatedAt", "DESC"]],
        include: [{
            model: ClassVersion,
            attributes: [["id", "classId"]],
            include: [
                {
                    model: ClientClass,
                    attributes: [["name", "className"]],
                },
                {
                    model: ClassGroup,
                    attributes: [["name", "classGroupName"]],
                },
            ],
        }],
        offset: (page - 1) * pageSize,
        limit: pageSize,
        distinct: true,
    });
    return data;
};
// 匹配规则的更新
export const updateMatch = async (options: IUpdateMatchRule) => {
    const transaction = await Models.transaction();
    try {
        const conditions: {
            matchRuleId: number;
            matchRuleDesc: object[];
            matchRule?: object;
            comment?: string;
            relationLib: number;
            libraryLib: number;
            listNorm?: ImatchListNorm[];
        } = Pick(options, ["matchRuleId", "matchRuleDesc", "matchRule", "comment", "relationLib", "libraryLib", "listNorm"]);
        const toUpdate = {
            matchRuleDesc: conditions.matchRuleDesc,
            matchRule: conditions.matchRule,
            comment: conditions.comment,
        };
        // 跟新matchRule表
        await MatchRule.update(toUpdate, { where: { id: conditions.matchRuleId }, transaction: transaction });
        // 查询数据库获取当前匹配规则和清单定额库的项目
        const listNormItem = await MatchMap.getListNormMatch(conditions.matchRuleId, conditions.libraryLib);
        // 数据库已经保存的项目id集合
        const itemList = [];
        for (const iterator of listNormItem) {
            itemList.push(iterator.itemId);
        }
        // 如果listNorm数组为空，检查当前条件下，数据库是否有值，若有值，执行删除操作
        if (!conditions.listNorm) {
            const params = {
                matchId: conditions.matchRuleId,
                itemId: itemList,
                relationLib: conditions.libraryLib,
            };
            await MatchMap.deleteMatchMap(<any>params, transaction);
        }
        if (conditions.listNorm) {
            const matchListNorm = conditions.listNorm;
            // 表单传过来的项目id集合
            const listNormItems = [];
            // listNormItems和itemList的差集
            const needDeleteList = [];
            for (const iterator of matchListNorm) {
                listNormItems.push(iterator.itemId);
            }
            for (const iterator of itemList) {
                // 如果不包含则执行删除
                if (!listNormItems.includes(<any>iterator)) {
                    needDeleteList.push(iterator);
                }
            }
            const deleteParams = {
                matchId: conditions.matchRuleId,
                itemId: needDeleteList,
                relationLib: conditions.libraryLib,
            };
            await MatchMap.deleteMatchMap(<any>deleteParams, transaction);
            // 做批量添加的集合
            const addMatchMapList = [];
            // 做更新操作的集合
            const updateMatchMapList = [];
            // 遍历匹配规则下的项目
            for (const iterator of matchListNorm) {
                // 判断MatchMap中是否存在该项目，若不存在则添加，若存在则修改
                if (!itemList.includes(iterator.itemId)) {
                    const params = <IaddMatchMap>{
                        matchId: conditions.matchRuleId,
                        itemId: iterator.itemId,
                        relationLib: conditions.libraryLib,
                        calculateRule: iterator.calculateRule,

                    };
                    addMatchMapList.push(params);
                } else {
                    updateMatchMapList.push(iterator.itemId);
                    const parms = <IaddMatchMap>{
                        matchId: conditions.matchRuleId,
                        itemId: iterator.itemId,
                        relationLib: conditions.libraryLib,
                        calculateRule: iterator.calculateRule,
                    };
                    addMatchMapList.push(parms);
                }
            }
            // 如果updateMatchMapList有值，先删除再添加，从而实现跟新操作
            if (updateMatchMapList.length > 0) {
                const needdeleteParams = {
                    matchId: conditions.matchRuleId,
                    itemId: updateMatchMapList,
                    relationLib: conditions.libraryLib,
                };
                await MatchMap.deleteMatchMap(<any>needdeleteParams, transaction);
            }
            // 如果addMatchMapList集合不为空，则要做批量添加操作
            if (addMatchMapList.length > 0) {
                await MatchMap.addSomeMatchMap(addMatchMapList, transaction);
            }

        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

};

export interface IMatchRuleItem {
    itemId: number;
    relationLib: number;
    calculateRule: IcalculateRule;
}
export interface IMatchRuleWithItems {
    id: number;
    classId: number;
    matchRule: any;
    items: IMatchRuleItem[];
}

export async function getMatchRuleWithItems(libId: number, owner: number, classVersionId?: number) {
    let sqlQuery = `
    select
        a."id", a."classId", a."matchRule", b."itemId", b."relationLib", b."calculateRule"
    from ${MatchRule.tableName} a
        inner join ${MatchMap.tableName} b on a."id" = b."matchId"
    where a."libId"=:libId and a."owner"=:owner and a."deletedAt" ISNULL
    `;
    const replacements: { libId: number, owner: number, classVersionId?: number } = { libId, owner };

    if (classVersionId !== undefined) {
        sqlQuery += ` and a."classId" = :classVersionId`;
        replacements.classVersionId = classVersionId;
    }

    const result = await Models.query(
        sqlQuery,
        {
            type: (<any>Models).QueryTypes.SELECT,
            replacements: replacements,
        }
    );

    const data = new Map<number, IMatchRuleWithItems>();

    for (const ret of result) {
        // if (ret.itemId !== null) {
        if (!data.has(ret.id)) {
            data.set(ret.id, {
                id: ret.id,
                classId: ret.classId,
                matchRule: ret.matchRule,
                items: [],
            });
        }
        const tmp = data.get(ret.id)!;
        tmp.items.push({ itemId: ret.itemId, relationLib: ret.relationLib, calculateRule: ret.calculateRule });
        // }
    }
    return Array.from(data.values());
}

export const getLastestVersion = async () => {
    const sqlStr = `select * from ${Version.tableName} where "published" = true order by version DESC limit 1;`;
    const result = await Models.query(
        sqlStr,
        {
            type: (<any>Models).QueryTypes.SELECT,
        }
    );
    if (result.length <= 0) {
        throw new Error("Get not version information.");
    }
    return result[0].version;
};
export const getClassAttributeMap = async (theLastestVersion: number) => {
    const sqlStr = `
        select c."version", a."name" as "className", a."typeId" as "compType",d."name" as "attrName", d."parameterName"
        from "component_class" as a
        inner join "component_class_version" as b on a."id" = b."clientClassId" and b."version" = :version
        inner join "component_attribute_version" as c on b."id" = c."classVersionId"
        inner join "component_attribute" as d on c."attributeId" = d."id"
    `;
    const result = await Models.query(
        sqlStr,
        {
            replacements: { version: theLastestVersion },
            type: (<any>Models).QueryTypes.SELECT,
        }
    );
    if (result.length <= 0) {
        throw new Error("Get not class attribute information.");
    }
    const clsAttrMap = new Map<number, Map<string, string>>();
    for (const clsAttr of result) {
        const compType = clsAttr.compType;
        if (!clsAttrMap.has(compType)) {
            clsAttrMap.set(compType, new Map<string, string>());
        }
        const attrMap = clsAttrMap.get(compType)!;
        attrMap.set(clsAttr.attrName, clsAttr.parameterName);
    }
    return clsAttrMap;
};

export const getAttributeMap = async () => {
    const sqlStr = `
        select "name", "parameterName" from ${Attribute.tableName};
    `;
    const result = await Models.query(
        sqlStr,
        {
            type: (<any>Models).QueryTypes.SELECT,
        }
    );
    if (result.length <= 0) {
        throw new Error("Get not attribute information.");
    }
    const attrMap = new Map<string, string>();
    for (const attr of result) {
        if (!attrMap.has(attr.name)) {
            attrMap.set(attr.name, attr.parameterName);
        }
    }
    return attrMap;
};
export const getCompMap = async (theLastestVersion: number, className?: string) => {
    let sqlStr = `
        select
            a."id", a."name", a."typeId" as "compType", b."id" as "classVersionId", b."clientClassId"
        from "component_class" as a
            inner join "component_class_version" as b on a."id" = b."clientClassId"
        where b."version" = :version
    `;

    const replacements: { version: number; className?: string } = { version: theLastestVersion };
    if (className !== undefined) {
        sqlStr += ` and a."name" = :className`;
        replacements.className = className;
    }

    const result = await Models.query(
        sqlStr,
        {
            replacements: replacements,
            type: (<any>Models).QueryTypes.SELECT,
        }
    );
    if (result.length <= 0) {
        throw new Error("Get not attribute information.");
    }
    const compMap = new Map<number, number>();
    for (const comp of result) {
        if (!compMap.has(comp.compType)) {
            compMap.set(comp.compType, comp.classVersionId);
        }
    }
    return compMap;
};

export interface IMaterialInfo extends MaterialItem {
    quantity?: number;
}

export interface INormInfo extends NormItem {
    catalogName?: string;
    materials?: IMaterialInfo[];
}

export const getNormInfo = async (normIds: number[], normLibId: number, materialLibId: number, owner: number) => {
    const sqlStr = `
        select d."name" as "catalogName", a.*,
        b."quantity" as "Material.quantity",
        c."id" as "Material.id", c."code" as "Material.code", c."name" as "Material.name", c."preview" as "Material.preview",
        c."category" as "Material.category",c."provider" as "Material.provider", c."pattern" as "Material.pattern",
        c."format" as "Material.format", c."brand" as "Material.brand",c."series" as "Material.series", c."unit" as "Material.unit",
        c."loss" as "Material.loss", c."price" as "Material.price", c."comment" as "Material.comment",c."componentId" as "Material.componentId",
        c."catalogId" as "Material.catalogId", c."libId" as "Material.libId", c."status" as "Material.status", c."owner" as "Material.owner"
        from ${NormItem.tableName} a
        left join ${NormMaterialMap.tableName} b on a."id" = b."normId"
        left join ${MaterialItem.tableName} c on b."materialId" = c."id" and c."libId"=:materialLibId
        left join ${Catalog.tableName} d on a."catalogId" = d."id"
        where a.id in (:ids) and a."libId"=:normLibId and a."owner"=:owner;
    `;
    const ids = normIds.concat(-1);// -1是干嘛？
    const result = await Models.query(
        sqlStr,
        {
            replacements: { ids, normLibId, materialLibId, owner },
            type: (<any>Models).QueryTypes.SELECT,
            nest: true,
        }
    );
    const data = new Map<number, INormInfo>();
    for (const ret of result) {
        if (!data.has(ret.id)) {
            const normInfo: INormInfo = <any>Pick(ret, [
                "catalogName", "id", "code", "name", "unit", "loss", "price",
                "featureDesc", "feature", "jobs", "status", "owner", "catalogId", "libId",
            ]);
            normInfo.materials = [];

            data.set(ret.id, normInfo);
        }
        const tmp = data.get(ret.id)!.materials;
        tmp!.push(ret.Material);
    }
    return data;
};

export interface INormQuantity {
    normId: number;
    normLibId: number;
    quantity: number;
}

export interface IListInfo extends ListItem {
    normQuantity?: INormQuantity[];
}

export async function getListInfo(listIds: number[], listLibId: number, normLibId: number, owner: number) {
    const sqlStr = `
        select a.*, b."normId", b."quantity"
        from ${ListItem.tableName} a
        left join ${ListNormMap.tableName} b on a."id" = b."listId"
        left join ${NormItem.tableName} c on b."normId" = c."id"
        where a.id in (:ids) and a."libId"=:listLibId and a."owner"=:owner and c."libId"=:normLibId;
    `;
    const ids = listIds.concat(-1);
    const result = await Models.query(
        sqlStr,
        {
            replacements: { ids, listLibId, normLibId, owner },
            type: (<any>Models).QueryTypes.SELECT,
        }
    );

    const data = new Map<number, IListInfo>();
    for (const ret of result) {
        if (!data.has(ret.id)) {
            const listInfo: IListInfo = <any>Pick(ret, [
                "id", "code", "name", "unit", "price", "featureDesc", "feature",
                "jobs", "status", "owner", "catalogId", "libId",
            ]);
            listInfo.normQuantity = [];
            data.set(ret.id, listInfo);
        }
        const tmp = data.get(ret.id)!.normQuantity;
        tmp!.push({
            normId: ret.normId,
            quantity: ret.quantity,
            normLibId: normLibId,
        });
    }
    return data;
}


export async function getMaterialInfo(matNumbers: string[], materialLibId: number, owner: number) {
    const sqlStr = `
        select * from ${MaterialItem.tableName}
        where "code" in (:codes) and "libId"=:materialLibId and "owner"=:owner;
    `;
    const codes = matNumbers.concat("GetNoCode");
    const result = await Models.query(
        sqlStr,
        {
            replacements: { codes, materialLibId, owner },
            type: (<any>Models).QueryTypes.SELECT,
        }
    );
    const data = new Map<string, MaterialItem>();
    for (const ret of result) {
        data.set(ret.code, ret);
    }
    return data;
}
