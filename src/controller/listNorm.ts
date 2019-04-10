import {
    assign as Assign,
    pick as Pick,
    omit as Omit,
    merge as Merge
} from "lodash";
import * as Joi from "joi";
import validate from "../utils/validate";
import { Middleware } from "@nestsoft/koa-extended";

import {
    Library, Catalog, ListItem, NormItem, MaterialItem, MatchRule,
    CalculateRule, ImportTask, MatchMap, CalcItem,
    IAddMatchRule, IUpdateMatchRule, IgetCalcItem,
    IAdddCatalogOptions, IUpdateCatalog,
    IGetLibraryOptions, IAddLibraryOptions, IUpdateLibOptions,
    IAddCalculateRule, IUpdateCalculateRule,
    IAddMaterialItem, IUpdateMaterialOptions, IGetCatalogOptions, ListNormMap, NormMaterialMap
} from "../model";

import {
    ListNormOps,
    IGetMatchRuleOptions, IGetCalculateRule,
    IAddListWithNorm, IAddNormWithMaterial, IAddLibImportTask,
    IUpdateListItemOptions, IUpdateNormItem
} from "../repo";

import * as MyExcel from "../utils/excelTemplate";
import { getOssUploadConfig, ossDownloadUrl } from "../utils";
import Config from "../config";
import { Op } from "sequelize";

const getAddedNormSchema = {
    listId: Joi.number().required(),
};
export const getAddedNorm: Middleware = async (ctx, next?) => {
    const query: { listId: number } = ctx.request.query;
    const err = validate(query, getAddedNormSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const result = await ListNormOps.getAddedNormItems(query.listId, currentOwner);
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const getAddedMaterialSchema = {
    normId: Joi.number().required(),
};
export const getAddedMaterial: Middleware = async (ctx, next?) => {
    const query: { normId: number } = ctx.request.query;
    const err = validate(query, getAddedMaterialSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const result = await ListNormOps.getAddedMaterialItems(query.normId, currentOwner);
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const materialItemSchema = {
    code: Joi.string().required(),
    name: Joi.string().required(),
    preview: Joi.array().items(Joi.string()),
    category: Joi.any().valid(["人工", "机械", "主材", "辅材", "家电", "软装"]).required(),
    provider: Joi.any().valid(["甲供", "乙供"]).required(),
    pattern: Joi.string(),
    format: Joi.string(),
    brand: Joi.string(),
    series: Joi.string(),
    unit: Joi.string().required(),
    loss: Joi.number(),
    price: Joi.object().keys({
        sell: Joi.number(),
        cost: Joi.number(),
    }),
    comment: Joi.string(),
    componentId: Joi.number(),
    catalogId: Joi.number(),
    libId: Joi.number().required(),
};

export const addMaterialItem: Middleware = async (ctx, next?) => {
    const body = <{
        code: string;
        name: string;
        preview?: string[];
        category: string;
        provider: string;
        pattern?: string;
        format?: string;
        brand?: string;
        series?: string;
        unit: string;
        loss?: number;
        price?: { sell?: number, cost?: number };
        comment?: string;
        componentId: number;
        catalogId?: number;
        libId: number;
    }>ctx.request.body;
    const err = validate(body, materialItemSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const defaultPrice = {
        sell: 0,
        cost: 0,
    };
    Merge(defaultPrice, body.price);
    body.price = defaultPrice;
    const currentOwner = ctx.session.company.companyId;
    const { rows } = await Library.getLibrary({
        owner: currentOwner,
        id: body.libId,
    });
    if (rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id" };
        return;
    }
    if (body.catalogId !== undefined) {
        const ctlg = await Catalog.getCatalog({
            owner: currentOwner,
            libId: body.libId,
            id: body.catalogId,
        });
        if (ctlg.length !== 1) {
            ctx.body = { code: 1001, msg: "error catalog id." };
            return;
        }
    }
    const data = <IAddMaterialItem>{};
    Assign(data, Pick(body, ["code", "name", "category", "provider", "preview",
        "pattern", "format", "brand", "series",
        "unit", "loss", "price", "comment", "componentId", "catalogId", "libId"]));
    data.status = "active";
    data.owner = currentOwner;
    // 调用checkOnlyMaterialItem方法，进行唯一性判断
    const params = {
        libId: body.libId,
    };
    const result = await checkOnlyMaterialItem(params, body.code);
    if (result) {
        try {
            await MaterialItem.addMaterialItem(data);
            ctx.body = { code: 0, msg: "ok" };
        } catch (error) {
            ctx.throw(error);
        }
    } else {
        ctx.throw("The code already exists.");
    }

};

// 人材机库唯一性判断
async function checkOnlyMaterialItem(params: { libId: number }, code: string) {
    // 联合查询list_norm_catalog表和list_norm_material_item表
    const materialItemList = await MaterialItem.getItems(<any>params);
    // 循环materialItemList获取code（项目编号）
    const codeList = [];
    for (const materialItem of materialItemList.rows) {
        codeList.push(materialItem.code);
    }
    // 判断code是否存在于codeList中
    if (codeList.includes(code)) {
        return false;
    }
    return true;

}


const updateMaterialSchema = {
    materialId: Joi.number().required(),
    code: Joi.string(),
    name: Joi.string(),
    preview: Joi.array().items(Joi.string()),
    category: Joi.any().valid(["人工", "机械", "主材", "辅材", "家电", "软装"]),
    provider: Joi.any().valid(["甲供", "乙供"]),
    pattern: Joi.string(),
    format: Joi.string(),
    brand: Joi.string(),
    series: Joi.string(),
    unit: Joi.string(),
    loss: Joi.number(),
    price: Joi.object().keys({
        sell: Joi.number(),
        cost: Joi.number(),
    }),
    comment: Joi.string(),
    componentId: Joi.number(),
    catalogId: Joi.number(),
    libId: Joi.number().required(),
};
export const updateMaterialItem: Middleware = async (ctx, next?) => {
    const body = <IUpdateMaterialOptions>ctx.request.body;
    const err = validate(body, updateMaterialSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const defaultPrice = {
        sell: 0,
        cost: 0,
    };
    Merge(defaultPrice, body.price);
    body.price = defaultPrice;
    const currentOwner = ctx.session.company.companyId;
    const materials = await MaterialItem.getItems({ owner: currentOwner, libId: body.libId, id: body.materialId });
    if (materials.rows === undefined || materials.rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id or material id" };
        return;
    }
    const { rows } = await Library.getLibrary({
        owner: currentOwner,
        id: body.libId,
    });
    if (rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id" };
        return;
    }
    if (body.catalogId !== undefined) {
        const ctlg = await Catalog.getCatalog({
            owner: currentOwner,
            libId: body.libId,
            id: body.catalogId,
        });
        if (ctlg.length !== 1) {
            ctx.body = { code: 1001, msg: "error library id or catalog id." };
            return;
        }
    }
    try {
        await MaterialItem.updateMaterialItem(body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const deleteMaterialItemSchema = {
    libId: Joi.number().required(),
    materialId: Joi.number().required(),
};

export const deleteMaterialItem: Middleware = async (ctx, next?) => {
    const body = <{ libId: number; materialId: number; }>ctx.request.body;
    const err = validate(body, deleteMaterialItemSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const result = await MaterialItem.getItems({ owner: currentOwner, libId: body.libId, id: body.materialId });
    if (result.rows === undefined || result.rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id or material id" };
        return;
    }
    try {
        await MaterialItem.deleteItems(body.materialId);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const addNormItemSchema = {
    code: Joi.string().required(),
    name: Joi.string().required(),
    unit: Joi.string().required(),
    loss: Joi.number(),
    price: Joi.object().keys({
        sell: Joi.object().keys({
            labor: Joi.number(),
            machine: Joi.number(),
            stuffMain: Joi.number(),
            stuffAttached: Joi.number(),
        }),
        cost: Joi.object().keys({
            labor: Joi.number(),
            machine: Joi.number(),
            stuffMain: Joi.number(),
            stuffAttached: Joi.number(),
        }),
    }),
    featureDesc: Joi.string(),
    feature: Joi.array().items(Joi.object().keys({
        name: Joi.string().required(),
        parameterName: Joi.string().required(),
    })),
    jobs: Joi.string(),
    catalogId: Joi.number().required(),
    libId: Joi.number().required(),
    addedMaterial: Joi.array().items(Joi.object().keys({
        materialId: Joi.number().required(),
        quantity: Joi.number().required(),
        loss: Joi.number(),
    })),
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

export const addNormItem: Middleware = async (ctx, next?) => {
    const body = <{
        code: string;
        name: string;
        unit: string;
        loss?: number;
        price?: Iprice;
        featureDesc?: string;
        feature?: object[];
        jobs?: string;
        catalogId: number;
        libId: number;
        addedMaterial?: {
            materialId: number;
            quantity: number;
            loss?: number;
        }[];
    }>ctx.request.body;
    const err = validate(body, addNormItemSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const defaultPrice = {
        sell: {
            labor: 0,
            machine: 0,
            stuffMain: 0,
            stuffAttached: 0,
        },
        cost: {
            labor: 0,
            machine: 0,
            stuffMain: 0,
            stuffAttached: 0,
        },
    };
    Merge(defaultPrice, body.price);
    body.price = defaultPrice;
    const currentOwner = ctx.session.company.companyId;
    const ctlg = await Catalog.getCatalog({
        owner: currentOwner,
        libId: body.libId,
        id: body.catalogId,
    });
    if (ctlg.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id or catalog id." };
        return;
    }
    if (body.addedMaterial !== undefined) {
        const materialIds: number[] = [];
        for (const m of body.addedMaterial) {
            materialIds.push(m.materialId);
        }
        const materialRules = (await MaterialItem.getItems({ owner: currentOwner, ids: materialIds })).rows;
        if (materialRules.length !== materialIds.length) {
            ctx.body = { code: 1001, msg: "error material id." };
            return;
        }
    }
    const data = <IAddNormWithMaterial>{};
    Assign(data, Pick(body, ["code", "name", "unit", "loss", "price",
        "featureDesc", "feature", "jobs", "catalogId", "libId", "addedMaterial"]));
    data.status = "active";
    data.owner = currentOwner;
    // 调用checkOnlyNormItem方法，进行唯一性判断
    const params = {
        libId: body.libId,
    };
    const result = await checkOnlyNormItem(params, body.code);
    if (result) {
        try {
            await ListNormOps.addNormWithMaterial(data);
            ctx.body = { code: 0, msg: "ok" };
        } catch (error) {
            ctx.throw(error);
        }
    } else {
        ctx.throw("The code already exists.");
    }

};

// 定额库唯一性判断
async function checkOnlyNormItem(params: { libId: number }, code: string) {
    const normItemList = await NormItem.getItems(<any>params);
    // 循环materialItemList获取code（项目编号）
    const codeList = [];
    for (const normItem of normItemList.rows) {
        codeList.push(normItem.code);
    }
    // 判断code是否存在于codeList中
    if (codeList.includes(code)) {
        return false;
    }
    return true;
}

const updateNormItemSchema = {
    normId: Joi.number().required(),
    code: Joi.string(),
    name: Joi.string(),
    unit: Joi.string(),
    loss: Joi.number(),
    price: Joi.object().keys({
        sell: Joi.object().keys({
            labor: Joi.number(),
            machine: Joi.number(),
            stuffMain: Joi.number(),
            stuffAttached: Joi.number(),
        }),
        cost: Joi.object().keys({
            labor: Joi.number(),
            machine: Joi.number(),
            stuffMain: Joi.number(),
            stuffAttached: Joi.number(),
        }),
    }),
    featureDesc: Joi.string(),
    feature: Joi.array().items(Joi.object().keys({
        name: Joi.string().required(),
        parameterName: Joi.string().required(),
    })),
    jobs: Joi.string(),
    catalogId: Joi.number(),
    libId: Joi.number().required(),
    addedMaterial: Joi.array().items(Joi.object().keys({
        materialId: Joi.number().required(),
        quantity: Joi.number().required(),
        loss: Joi.number(),
    })),
};

export const updateNormItem: Middleware = async (ctx, next?) => {
    let body = <IUpdateNormItem>ctx.request.body;
    const err = validate(body, updateNormItemSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    // ==============================================================================
    // 这一块做了特殊处理，前端和后端做了错误的约定，已修改的字段没有全部传给后端，所以后端默认给没有传过来的字段都赋值为空字符串
    const defaultNormItem = {
        normId: 0,
        code: "",
        name: "",
        unit: "",
        loss: 0,
        price: {
            sell: {
                labor: 0,
                machine: 0,
                stuffMain: 0,
                stuffAttached: 0,
            },
            cost: {
                labor: 0,
                machine: 0,
                stuffMain: 0,
                stuffAttached: 0,
            },
        },
        featureDesc: "",
        feature: [],
        jobs: "",
        catalogId: 0,
        libId: 0,
        addedMaterial: [],
    };
    Merge(defaultNormItem, body);
    body = defaultNormItem;
    // =================================================================================================
    const currentOwner = ctx.session.company.companyId;
    const lists = await NormItem.getItems({ owner: currentOwner, libId: body.libId, id: body.normId });
    if (lists.rows === undefined || lists.rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id or norm id" };
        return;
    }
    if (body.catalogId !== undefined) {
        const ctlg = await Catalog.getCatalog({
            owner: currentOwner,
            libId: body.libId,
            id: body.catalogId,
        });
        if (ctlg.length !== 1) {
            ctx.body = { code: 1001, msg: "error library id or catalog id." };
            return;
        }
    }
    if (body.addedMaterial !== undefined) {
        const materialIds: number[] = [];
        for (const m of body.addedMaterial) {
            materialIds.push(m.materialId);
        }
        const materialRules = (await MaterialItem.getItems({ owner: currentOwner, ids: materialIds })).rows;
        if (materialRules.length !== materialIds.length) {
            ctx.body = { code: 1001, msg: "error material id." };
            return;
        }
    }
    try {
        await ListNormOps.updateNormItem(body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const deleteNormItemSchema = {
    libId: Joi.number().required(),
    normId: Joi.number().required(),
};
export const deleteNormItem: Middleware = async (ctx, next?) => {
    const body = <{ libId: number; normId: number; }>ctx.request.body;
    const err = validate(body, deleteNormItemSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const result = await NormItem.getItems({ owner: currentOwner, libId: body.libId, id: body.normId });
    if (result.rows === undefined || result.rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id or norm id" };
        return;
    }
    try {
        await ListNormOps.deleteNormItem(body.normId);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const addListItemSchema = {
    code: Joi.string().required(),
    name: Joi.string().required(),
    unit: Joi.string().required(),
    price: Joi.object().keys({
        sell: Joi.number(),
        cost: Joi.number(),
    }),
    featureDesc: Joi.string(),
    feature: Joi.array().items(Joi.object().keys({
        name: Joi.string().required(),
        parameterName: Joi.string().required(),
    })),
    jobs: Joi.string(),
    catalogId: Joi.number().required(),
    libId: Joi.number().required(),
    addedNorm: Joi.array().items(Joi.object().keys({
        normId: Joi.number().required(),
        quantity: Joi.number().required(),
    })),
};

export const addListItem: Middleware = async (ctx, next?) => {
    const body = <{
        code: string;
        name: string;
        unit: string;
        price?: { sell?: number, cost?: number };
        featureDesc?: string;
        feature?: object[];
        jobs?: string;
        catalogId: number;
        libId: number;
        addedNorm?: { normId: number; quantity: number }[];
    }>ctx.request.body;
    const err = validate(body, addListItemSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const defaultPrice = {
        sell: 0,
        cost: 0,
    };
    Merge(defaultPrice, body.price);
    body.price = defaultPrice;
    const currentOwner = ctx.session.company.companyId;
    const ctlg = await Catalog.getCatalog({
        owner: currentOwner,
        libId: body.libId,
        id: body.catalogId,
    });
    if (ctlg.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id or catalog id." };
        return;
    }
    if (body.addedNorm !== undefined) {
        const normIds: number[] = [];
        for (const n of body.addedNorm) {
            normIds.push(n.normId);
        }
        const normRules = (await NormItem.getItems({ owner: currentOwner, ids: normIds })).rows;
        if (normRules.length !== normIds.length) {
            ctx.body = { code: 1001, msg: "error norm id." };
            return;
        }
    }

    const data = <IAddListWithNorm>{};
    Assign(data, Pick(body, ["code", "name", "unit", "price", "featureDesc", "feature",
        "jobs", "catalogId", "libId", "addedNorm"]));
    data.status = "active";
    data.owner = currentOwner;
    // 调用checkOnlyListItem方法，进行唯一性判断
    const params = {
        libId: body.libId,
    };
    const result = await checkOnlyListItem(params, body.code);
    if (result) {
        try {
            await ListNormOps.addListWithNorm(data);
            ctx.body = { code: 0, msg: "ok" };
        } catch (error) {
            ctx.throw(error);
        }
    } else {
        ctx.throw("The code already exists.");
    }


};

// 清单库唯一性判断
async function checkOnlyListItem(params: { libId: number }, code: string) {
    // 联合查询list_norm_catalog表和list_norm_material_item表
    const listItemList = await ListItem.getItems(<any>params);
    // 循环materialItemList获取code（项目编号）
    const codeList = [];
    for (const normItem of listItemList.rows) {
        codeList.push(normItem.code);
    }
    // 判断code是否存在于codeList中
    if (codeList.includes(code)) {
        return false;
    }
    return true;
}

const updateListItemSchema = {
    listId: Joi.number().required(),
    code: Joi.string(),
    name: Joi.string(),
    unit: Joi.string(),
    price: Joi.object().keys({
        sell: Joi.number(),
        cost: Joi.number(),
    }),
    featureDesc: Joi.string(),
    feature: Joi.array().items(Joi.object().keys({
        name: Joi.string().required(),
        parameterName: Joi.string().required(),
    })),
    jobs: Joi.string(),
    catalogId: Joi.number(),
    libId: Joi.number().required(),
    addedNorm: Joi.array().items(Joi.object().keys({
        normId: Joi.number().required(),
        quantity: Joi.number().required(),
    })),
};

export const updateListItem: Middleware = async (ctx, next?) => {
    const body = <IUpdateListItemOptions>ctx.request.body;
    const err = validate(body, updateListItemSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const defaultPrice = {
        sell: 0,
        cost: 0,
    };
    Merge(defaultPrice, body.price);
    body.price = defaultPrice;
    const currentOwner = ctx.session.company.companyId;
    const lists = await ListItem.getItems({ owner: currentOwner, libId: body.libId, id: body.listId });
    if (lists.rows === undefined || lists.rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id or list id" };
        return;
    }
    if (body.catalogId !== undefined) {
        const ctlg = await Catalog.getCatalog({
            owner: currentOwner,
            libId: body.libId,
            id: body.catalogId,
        });
        if (ctlg.length !== 1) {
            ctx.body = { code: 1001, msg: "error library id or catalog id." };
            return;
        }
    }
    if (body.addedNorm !== undefined) {
        const normIds: number[] = [];
        for (const n of body.addedNorm) {
            normIds.push(n.normId);
        }
        const normRules = (await NormItem.getItems({ owner: currentOwner, ids: normIds })).rows;
        if (normRules.length !== normIds.length) {
            ctx.body = { code: 1001, msg: "error norm id." };
            return;
        }
    }

    try {
        await ListNormOps.updateListItem(body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const deleteListItemSchema = {
    libId: Joi.number().required(),
    listId: Joi.number().required(),
};

export const deleteListItem: Middleware = async (ctx, next?) => {
    const body = <{ libId: number; listId: number; }>ctx.request.body;
    const err = validate(body, deleteListItemSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const result = await ListItem.getItems({ owner: currentOwner, libId: body.libId, id: body.listId });
    if (result.rows === undefined || result.rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id or list id" };
        return;
    }
    try {
        await ListNormOps.deleteListItem(body.listId);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const copyCalculateRuleSchema = {
    srcLibId: Joi.number().required(),
    destLibId: Joi.number().required(),
    doNotCover: Joi.boolean(),
};

export const copyCalculateRule: Middleware = async (ctx, next?) => {
    const body = <{ srcLibId: number; destLibId: number; doNotCover?: boolean }>ctx.request.body;
    const err = validate(body, copyCalculateRuleSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const { rows } = await Library.getLibrary({
        owner: currentOwner,
        id: [body.srcLibId, body.destLibId],
        type: "calculate",
    });
    if (rows.length !== 2) {
        ctx.body = { code: 1001, msg: "invalid library id" };
        return;
    }

    try {
        await CalculateRule.copyCalculateRule({
            owner: currentOwner,
            srcLibId: body.srcLibId,
            destLibId: body.destLibId,
            doNotCover: body.doNotCover,
        });
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const deleteCalculateRuleSchema = {
    libId: Joi.number().required(),
    calculateRuleId: Joi.number(),
    calculateRuleIds: Joi.array().items(Joi.number().required()),
};

export const deleteCalculateRule: Middleware = async (ctx, next?) => {
    const body = <{ libId: number; calculateRuleId?: number, calculateRuleIds?: number[] }>ctx.request.body;
    const err = validate(body, deleteCalculateRuleSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const params: {
        owner: number; libId: number; id?: number | number[]
    } = { owner: currentOwner, libId: body.libId };
    if (body.calculateRuleId !== undefined) {
        params.id = body.calculateRuleId;
    } else if (body.calculateRuleIds !== undefined) {
        params.id = body.calculateRuleIds;
    } else {
        ctx.body = { code: 1001, msg: "nothing to delete" };
        return;
    }

    try {
        await CalculateRule.deleteCalculateRule(params);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const updateCalculateRuleSchema = {
    calculateRuleId: Joi.number().required(),
    name: Joi.string(),
    matchRuleDesc: Joi.array().items(Joi.object().keys({
        op: Joi.string(),
        parameterName: Joi.string(),
        result: [Joi.string(), Joi.number()],
    })),
    matchRule: Joi.object(),
    calculateRuleDesc: Joi.array().items(Joi.object().keys({
        op: Joi.string(),
        parameterName: Joi.string(),
        result: [Joi.string(), Joi.number()],
    })),
    calculateRule: Joi.object().keys({
        addAmount: Joi.number(),
        amount: Joi.number(),
        calcItem: Joi.number(),
        attribute: Joi.object().keys({
            id: Joi.number(),
            name: Joi.string(),
            parameterName: Joi.string(),
        }),
        unit: Joi.string(),
        projectName: Joi.string(),
        rule: Joi.string(),
        type: Joi.string(),
    }),
    unit: Joi.string(),
    comment: Joi.string(),
};

export const updateCalculateRule: Middleware = async (ctx, next?) => {
    const body = <IUpdateCalculateRule>ctx.request.body;
    const err = validate(body, updateCalculateRuleSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const result = await ListNormOps.getCalculateRule({ owner: currentOwner, id: body.calculateRuleId });
    if (result.length !== 1) {
        ctx.body = { code: 1001, msg: "error calculate rule id." };
        return;
    }
    try {
        await CalculateRule.updateCalculateRule(body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const addCalculateRuleSchema = {
    name: Joi.string(),
    classId: Joi.number().required(),
    matchRuleDesc: Joi.array().items(Joi.object().keys({
        op: Joi.string(),
        parameterName: Joi.string(),
        result: [Joi.string(), Joi.number()],
    })),
    matchRule: Joi.object(),
    calculateRuleDesc: Joi.array().items(Joi.object().keys({
        op: Joi.string(),
        parameterName: Joi.string(),
        result: [Joi.string(), Joi.number()],
    })),
    calculateRule: Joi.object().keys({
        addAmount: Joi.number(),
        amount: Joi.number(),
        calcItem: Joi.number(),
        attribute: Joi.object().keys({
            id: Joi.number(),
            name: Joi.string(),
            parameterName: Joi.string(),
        }),
        unit: Joi.string(),
        projectName: Joi.string(),
        rule: Joi.string(),
        type: Joi.string(),
    }),
    unit: Joi.string(),
    comment: Joi.string(),
    libId: Joi.number().required(),
};

export const addCalculateRule: Middleware = async (ctx, next?) => {
    const body = <IAddCalculateRule>ctx.request.body;
    const err = validate(body, addCalculateRuleSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    body.owner = ctx.session.company.companyId;
    body.status = "active";
    const { rows } = await Library.getLibrary({ owner: body.owner, id: body.libId });
    if (rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id." };
        return;
    }
    try {
        await CalculateRule.addCalculateRule(body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const getCalculateRuleSchema = {
    calculateRuleId: Joi.number(),
    search: Joi.string(),
    classId: Joi.number(),
    libId: Joi.number().required(),
};

export const getCalculateRule: Middleware = async (ctx, next?) => {
    const query: {
        calculateRuleId?: number;
        search?: string;
        classId?: number;
        libId: number;
    } = ctx.request.query;
    const err = validate(query, getCalculateRuleSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const params = <IGetCalculateRule>{};
    if (query.calculateRuleId !== undefined) {
        params.id = query.calculateRuleId;
    }
    if (query.search !== undefined) {
        params.name = query.search;
    }
    if (query.classId !== undefined) {
        params.classId = query.classId;
    }
    params.libId = query.libId;
    params.owner = ctx.session.company.companyId;
    const result = await ListNormOps.getCalculateRule(params);
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const getItemsSchema = {
    search: Joi.string(),
    catalogId: Joi.number(),
    catalogIds: Joi.array().items(Joi.number()),
    libId: Joi.number(),
    libType: Joi.any().valid(["list", "norm", "material"]).required(),
    page: Joi.number(),
    pageSize: Joi.number(),
    id: Joi.number(),
    category: Joi.any().valid(["人工", "机械", "材料", "主材", "辅材", "家电", "软装"]),
    provider: Joi.any().valid(["甲供", "乙供"]),
};

export const getItems: Middleware = async (ctx, next?) => {
    const query: any = ctx.request.query;
    const err = validate(query, getItemsSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    query.owner = ctx.session.company.companyId;
    let _model;
    if (query.libType === "list") {
        _model = ListItem;
    } else if (query.libType === "norm") {
        _model = NormItem;
    } else if (query.libType === "material") {
        _model = MaterialItem;
    }

    if (_model !== undefined) {
        const result = await _model.getItems(query);
        ctx.body = { code: 0, data: { list: result.rows, count: result.count, host: Config.get("resourceOSS.url") }, msg: "ok" };
    } else {
        ctx.body = { code: 1001, msg: "error library type" };
    }
};

// const deleteItemsSchema = {
//     id: Joi.number(),
//     libType: Joi.any().valid(["list", "norm", "material"]).required(),
// };

// export const deleteItems: Middleware = async (ctx, next?) => {
//     try {
//         const { params } = ctx;
//         const err = validate(params, deleteItemsSchema);
//         if (err) {
//             ctx.body = err;
//             return;
//         }
//         let _model;
//         if (params.libType === "list") {
//             _model = ListItem;
//         } else if (params.libType === "norm") {
//             _model = NormItem;
//         } else if (params.libType === "material") {
//             _model = MaterialItem;
//         }
//         if (_model !== undefined) {
//             const items = await _model.deleteItems(params.id);
//             if (items > 0) {
//                 ctx.body = { code: 0, msg: "ok" };
//             } else {
//                 ctx.body = { code: 0, msg: "no this item" };
//             }
//         } else {
//             ctx.body = { code: 1001, msg: "error library type" };
//         }
//     } catch (error) {
//         ctx.throw(error);
//     }
// };

const updateCatalogSchema = {
    catalogId: Joi.number().required(),
    libId: Joi.number().required(),
    name: Joi.string(),
    order: Joi.string(),
    parentId: [null, Joi.number()],
    comment: ["", Joi.string()],
    type: Joi.string(),
};

export const deleteCalalog: Middleware = async (ctx, next?) => {
    const body = <{ catalogId: number, libId: number }>ctx.request.body;
    const err = validate(body, updateCatalogSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const ctlg = await Catalog.getCatalogTree({
        owner: currentOwner,
        libId: body.libId,
        id: body.catalogId,
    });
    if (ctlg.length !== 1) {
        ctx.body = { code: 1001, msg: "error catalog id or library id." };
        return;
    }
    const toDeleteGroupIds = [];
    for (const g1 of ctlg) {
        toDeleteGroupIds.push(g1.get("id"));
        const subGroups = g1.get("Catalogs");
        if (subGroups.length) {
            for (const g2 of subGroups) {
                toDeleteGroupIds.push(g2.get("id"));
                const ssubGroups = g2.get("Catalogs");
                if (ssubGroups.length) {
                    for (const g3 of ssubGroups) {
                        toDeleteGroupIds.push(g3.get("id"));
                    }
                }
            }
        }
    }
    try {
        await Catalog.deleteCatalog(currentOwner, toDeleteGroupIds);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

export const updateCatalog: Middleware = async (ctx, next?) => {
    const body = <{
        catalogId: number;
        libId: number;
        name?: string;
        order?: string;
        parentId?: null | number;
        comment?: string;
        type?: string;
    }>ctx.request.body;
    const err = validate(body, updateCatalogSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const catalogIds: number[] = [body.catalogId];
    if (typeof body.parentId === "number") {
        catalogIds.push(body.parentId);
    }
    const ctlgs = await Catalog.getCatalog({
        owner: currentOwner,
        libId: body.libId,
        ids: catalogIds,
    });
    if (ctlgs.length !== catalogIds.length) {
        ctx.body = { code: 1001, msg: "error id, parentId, or libId" };
        return;
    }
    const data: IUpdateCatalog = { id: body.catalogId };
    Assign(data, Omit(body, "catalogId", "libId"));
    if (Object.keys(data).length === 1) {
        ctx.body = { code: 1001, msg: "There is nothing to update" };
        return;
    }
    try {
        await Catalog.updateCatalog(data);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const addCatalogSchema = {
    name: Joi.string().required(),
    parentId: Joi.number(),
    order: Joi.string().required(),
    comment: ["", Joi.string()],
    libId: Joi.number().required(),
    type: Joi.string(),
};

export const addCatalog: Middleware = async (ctx, next?) => {
    const body = <IAdddCatalogOptions>ctx.request.body;
    const err = validate(body, addCatalogSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    body.owner = ctx.session.company.companyId;
    const { rows } = await Library.getLibrary({ owner: body.owner, id: body.libId });

    if (rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id." };
        return;
    }
    if (rows[0].type === "material") {
        if (body.type === undefined) {
            ctx.body = { code: 1001, msg: "type is required" };
            return;
        }
    }
    if (body.parentId !== undefined) {
        const ctlg = await Catalog.getCatalog({
            owner: body.owner, libId: body.libId, id: body.parentId,
        });
        if (ctlg.length !== 1) {
            ctx.body = { code: 1001, msg: "error parent id." };
            return;
        }
    }
    try {
        await Catalog.addCatalog(body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};


const libraryIdSchema = {
    libId: Joi.number().required(),
    tree: Joi.any().valid(["tree"]),
    type: Joi.string(),
};

export const getCatalog: Middleware = async (ctx, next?) => {
    const query: { libId: number; tree?: string, type?: string } = ctx.request.query;
    const err = validate(query, libraryIdSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    let result;
    const param: IGetCatalogOptions = { owner: currentOwner, libId: query.libId };
    if (query.type !== undefined) {
        param.type = query.type;
    }
    if (query.tree === "tree") {
        result = await Catalog.getCatalogTree(param);
    } else {
        result = await Catalog.getCatalog(param);
    }
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const upgradeLibrarySchema = {
    srcLibId: Joi.number().required(),
    name: Joi.string().required(),
    comment: Joi.string(),
    status: Joi.any().valid(["active", "unactive"]),
};

export const upgradeLibrary: Middleware = async (ctx, next?) => {
    const body = <{
        srcLibId: number;
        name: string;
        comment?: string;
        status?: string;
    }>ctx.request.body;
    const err = validate(body, upgradeLibrarySchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const seriesLibs = await Library.getSeriesLibrary(currentOwner, body.srcLibId);
    if (seriesLibs.length === 0) {
        ctx.body = { code: 1001, msg: "error library id." };
        return;
    }
    const lastSeriesLib = seriesLibs[0];
    const data = <IAddLibraryOptions>Pick(body, ["name", "comment", "status"]);
    data.owner = currentOwner;
    data.type = lastSeriesLib.type!;
    data.region = lastSeriesLib.region!;
    data.version = lastSeriesLib.version! + 1;
    if (lastSeriesLib.baseLibrary === undefined || lastSeriesLib.baseLibrary === null) {
        data.baseLibrary = body.srcLibId;
    } else {
        data.baseLibrary = lastSeriesLib.baseLibrary;
    }
    try {
        await Library.addLibrary(data);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const updateLibrarySchema = {
    relationLib: Joi.number(),
    libId: Joi.number().required(),
    name: Joi.string(),
    region: Joi.string(),
    comment: Joi.string(),
    status: Joi.any().valid(["active", "unactive"]),
};

export const updateLibrary: Middleware = async (ctx, next?) => {
    const body = <{
        libId: number;
        relationLib?: number;
        name?: string;
        region?: string;
        comment?: string;
        status?: string;
    }>ctx.request.body;
    const err = validate(body, updateLibrarySchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const { rows } = await Library.getLibrary({ owner: currentOwner, id: body.libId });
    const libs = rows;
    if (libs.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id" };
        return;
    }

    if (body.region !== undefined && libs[0].baseLibrary !== undefined && libs[0].baseLibrary !== null) {
        ctx.body = { code: 1001, msg: "change region at the base library, please" };
        return;
    }
    const data: IUpdateLibOptions = {
        owner: currentOwner, id: libs[0].id, type: libs[0].type,
    };
    Assign(data, Pick(body, ["name", "region", "comment", "status", "relationLib"]));
    try {
        await Library.updateLibrary(data);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const deleteLibrarySchema = {
    libId: Joi.number().required(),
};

export const deleteLibrary: Middleware = async (ctx, next?) => {
    const body = <{ libId: number; }>ctx.request.body;
    const err = validate(body, deleteLibrarySchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const { rows } = await Library.getLibrary({ owner: currentOwner, id: body.libId });
    if (rows.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id." };
        return;
    }
    // 根据库类型判断是否被关联，如果被关联则无法删除
    switch (rows[0].type) {
        case "list":
            // 如果是清单库，只需要判断该库是否与匹配规则库关联，若没有关联，则可以直接删除
            const library = await Library.getLibrary({ owner: currentOwner, relationLib: rows[0].id });
            if (library.rows.length > 0) {
                ctx.throw("库被引用，无法删除");
            } else {
                try {
                    await ListNormOps.deleteLibrary(rows[0]);
                    ctx.body = { code: 0, msg: "ok" };
                } catch (error) {
                    ctx.throw(error);
                }
            }
            break;
        case "norm":
            // 首先判断是否与匹配规则库关联
            const normLibrary = await Library.getLibrary({ owner: currentOwner, relationLib: rows[0].id });
            if (normLibrary.rows.length > 0) {
                ctx.throw("库被引用，无法删除");
            } else {
                // 再判断是否与清单库关联
                // 获取改定额库下面的定额项目
                const normItem = await NormItem.getItems({ owner: currentOwner, libId: rows[0].id });
                const normItemIdList = [];
                for (const iterator of normItem.rows) {
                    normItemIdList.push(iterator.id!);
                }
                if (normItemIdList.length === 0) {
                    try {
                        await ListNormOps.deleteLibrary(rows[0]);
                        ctx.body = { code: 0, msg: "ok" };
                    } catch (error) {
                        ctx.throw(error);
                    }
                } else {
                    // 判断normItemIdList中的id是否存在于list_norm_map表中，如果存在，则证明存在关联关系，则改定额库无法删除
                    const listNormMap = await ListNormMap.getListNormMap(normItemIdList);
                    if (Array.isArray(listNormMap) && listNormMap.length > 0) {
                        ctx.throw("库被引用，无法删除");
                    } else {
                        try {
                            await ListNormOps.deleteLibrary(rows[0]);
                            ctx.body = { code: 0, msg: "ok" };
                        } catch (error) {
                            ctx.throw(error);
                        }
                    }
                }
            }

            break;
        case "material":
            // 获取该人材机库下面的人材机项目
            const materialItem = await MaterialItem.getMaterialItem(currentOwner, rows[0].id!);
            const materialIdList = [];
            for (const iterator of materialItem) {
                materialIdList.push(iterator.id!);
            }
            if (materialIdList.length === 0) {
                try {
                    await ListNormOps.deleteLibrary(rows[0]);
                    ctx.body = { code: 0, msg: "ok" };
                } catch (error) {
                    ctx.throw(error);
                }
            } else {
                // 判断materialIdList中的id是否存在于list_norm_material_map表中，如果存在，则证明存在关联关系，则该人材机库无法删除
                const normMaterialMap = await NormMaterialMap.getNormMaterialMap(materialIdList);
                if (Array.isArray(normMaterialMap) && normMaterialMap.length > 0) {
                    ctx.throw("库被引用，无法删除");
                } else {
                    try {
                        await ListNormOps.deleteLibrary(rows[0]);
                        ctx.body = { code: 0, msg: "ok" };
                    } catch (error) {
                        ctx.throw(error);
                    }
                }
            }
            break;


        default:
            break;
    }
};
export const deleteMatchLibrary: Middleware = async (ctx, next?) => {
    const body = <{ libId: number; }>ctx.request.body;
    const err = validate(body, deleteLibrarySchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const libs = await Library.getMatchLibrary({ owner: currentOwner, id: body.libId });
    if (libs.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id." };
        return;
    }
    try {
        await ListNormOps.deleteMatchLibrary(libs[0]);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};
const addLibrarySchema = {
    relationLib: Joi.number(),
    name: Joi.string().required(),
    type: Joi.any().valid(["calculate", "match", "list", "norm", "material"]), // calculate,match唯一性判断只根据name进行判断
    region: Joi.string(),
    comment: Joi.string(),
    status: Joi.any().valid(["active", "unactive"]),
};

export const addLibrary: Middleware = async (ctx, next?) => {
    const body = <IAddLibraryOptions>ctx.request.body;
    const err = validate(body, addLibrarySchema);
    if (err) {
        ctx.body = err;
        return;
    }
    if (body.region === undefined || body.region === null) {
        body.region = "无地域";
    }
    body.owner = ctx.session.company.companyId;
    if (body.status === undefined) {
        body.status = "active";
    }
    // 如果type的值为：calculate,match，唯一性判断只根据name进行判断
    if (body.type === "calculate" || body.type === "match") {
        const searchWhere = {
            name: body.name,
            owner: body.owner,
        };
        const { rows } = await Library.getLibrary(<any>searchWhere);
        if (rows.length === 0) {
            try {
                await Library.addLibrary(body);
                ctx.body = { code: 0, msg: "ok" };
            } catch (error) {
                ctx.throw(error);
            }
        } else {
            ctx.throw("Name already exists! ");
        }
    } else {
        // 查询条件
        const searchWhere: { name: string; owner: number; region?: string; version?: number, } = {
            name: body.name,
            version: 1,
            owner: body.owner,
            region: body.region,

        };
        if (body.version !== undefined) {
            searchWhere.version = body.version;
        }
        const { rows } = await Library.getLibrary(<any>searchWhere);
        if (rows.length === 0) {
            try {
                await Library.addLibrary(body);
                ctx.body = { code: 0, msg: "ok" };
            } catch (error) {
                ctx.throw(error);
            }
        } else {
            ctx.throw("Name already exists! ");
        }
    }
};



export const getLibRegion: Middleware = async (ctx, next?) => {
    const currentOwner = ctx.session.company.companyId;
    const result = await Library.getLibRegion(currentOwner);
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const getSeriesLibSchema = {
    libId: Joi.number().required(),
};

export const getSeriesLibrary: Middleware = async (ctx, next?) => {
    const query: { libId: number } = ctx.request.query;
    const err = validate(query, getSeriesLibSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const result = await Library.getSeriesLibrary(currentOwner, query.libId);
    ctx.body = { code: 0, data: result, msg: "ok" };
};
export const getMatchLibrary: Middleware = async (ctx, next?) => {
    const query = {
        type: "match",
        owner: ctx.session.company.companyId,
    };
    const result = await Library.getMatchLibrary(query);
    ctx.body = { code: 0, data: result, msg: "ok" };
};
// 根据清单或者定额库id获取匹配规则库
export const getMatchByRelationId: Middleware = async (ctx, next?) => {
    const id = ctx.request.query.id;
    const result = await Library.getMatchByRelationId(id);
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const getLibrarySchema = {
    libId: Joi.number(),
    search: Joi.string(),
    region: Joi.string(),
    type: Joi.any().valid(["list", "norm", "calculate", "material"]),
    types: Joi.array().items(Joi.any().valid(["list", "norm", "calculate", "material"])),
    status: Joi.any().valid(["active", "unactive"]),
    page: Joi.number(),
    pageSize: Joi.number(),
};

export const getLibrary: Middleware = async (ctx, next?) => {
    const query: {
        libId?: number;
        search?: string;
        region?: string;
        type?: string;
        types?: string[];
        status?: string;
        page?: number
        pageSize?: number
    } = ctx.request.query;
    const err = validate(query, getLibrarySchema);
    if (err) {
        ctx.body = err;
        return;
    }

    const params = <IGetLibraryOptions>{};
    if (query.types !== undefined) {
        params.type = query.types;
    } else if (query.type !== undefined) {
        params.type = query.type;
    }
    if (query.libId !== undefined) {
        params.id = query.libId;
    }
    if (params.type === undefined && params.id === undefined) {
        ctx.body = { code: 1000, msg: "Can not get any library 'type' inforemation" };
        return;
    }
    if (query.search !== undefined) {
        params.name = query.search;
    }
    if (query.region !== undefined) {
        params.region = query.region;
    }
    if (query.status !== undefined) {
        params.status = query.status;
    }
    if (query.page !== undefined) {
        params.page = query.page;
    }
    if (query.pageSize !== undefined) {
        params.pageSize = query.pageSize;
    }
    params.owner = ctx.session.company.companyId;
    const { rows, count } = await Library.getLibrary(params);
    ctx.body = {
        code: 0, data: {
            count,
            list: rows,
        },
        msg: "ok",
    };
};

const getNormByListId = {
    id: Joi.number().required(),
};
// 根据清单库id查询定额库id
export const getNormList: Middleware = async (ctx, next?) => {
    const query: {
        id: number;
    } = ctx.request.query;
    const err = validate(query, getNormByListId);
    if (err) {
        ctx.body = err;
        return;
    }
    const result = await Library.getLibraryByListId(query.id);
    ctx.body = { code: 0, data: result, msg: "ok" };
};

// 根据定额库id查询人材机库id
export const getMaterailList: Middleware = async (ctx, next?) => {
    const query: {
        id: number;
    } = ctx.request.query;
    const err = validate(query, getNormByListId);
    if (err) {
        ctx.body = err;
        return;
    }
    const result = await Library.getMaterialByNormId(query.id);
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const copyMatchRuleSchema = {
    srcLibId: Joi.number().required(),
    destLibId: Joi.number().required(),
    srcLibType: Joi.string().required(),
    destLibType: Joi.string().required(),
    doNotCover: Joi.boolean(),
};

export const copyMatchRule: Middleware = async (ctx, next?) => {
    const body = <{
        srcLibId: number;
        destLibId: number;
        doNotCover?: boolean;
        srcLibType: string,
        destLibType: string,
    }>ctx.request.body;
    const err = validate(body, copyMatchRuleSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const { rows } = await Library.getLibrary({
        owner: currentOwner,
        id: [body.srcLibId, body.destLibId],
        type: ["match"],
    });
    if (rows.length !== 2) {
        ctx.body = { code: 1001, msg: "invalid library id" };
        return;
    }

    try {
        await MatchRule.copyMatchRule({
            owner: currentOwner,
            //被复制的
            srcLibId: body.srcLibId,
            destLibId: body.destLibId,
            // 默认是否被覆盖
            doNotCover: body.doNotCover,
            srcLibType: body.srcLibType,
            destLibType: body.destLibType,
        });
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const deleteMatchRuleSchema = {
    libId: Joi.number().required(),
    matchRuleId: Joi.number(),
    matchRuleIds: Joi.array().items(Joi.number().required()),
};

export const deleteMatchRule: Middleware = async (ctx, next?) => {
    const body = <{ libId: number; matchRuleId?: number, matchRuleIds?: number[] }>ctx.request.body;
    const err = validate(body, deleteMatchRuleSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const params: {
        owner: number; libId: number; id?: number | number[]
    } = { owner: currentOwner, libId: body.libId };
    if (body.matchRuleId !== undefined) {
        params.id = body.matchRuleId;
    } else if (body.matchRuleIds !== undefined) {
        params.id = body.matchRuleIds;
    } else {
        ctx.body = { code: 1001, msg: "nothing to delete" };
        return;
    }

    try {
        await MatchRule.deleteMatchRule(params);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};


const updateMatchRuleSchema = {
    matchRuleId: Joi.number().required(),
    matchRuleDesc: Joi.array().items(Joi.object().keys({
        op: Joi.string(),
        parameterName: Joi.string(),
        result: [Joi.string(), Joi.number()],
        name: Joi.string(),
    })),
    matchRule: Joi.object(),
    listNorm: Joi.array().items(Joi.object().keys({
        itemId: Joi.number(),
        calculateRule: Joi.object().keys({
            addAmount: Joi.number(),
            amount: Joi.number(),
            calcItem: Joi.number(),
            attribute: Joi.object().keys({
                id: Joi.number(),
                name: Joi.string(),
                parameterName: Joi.string(),
            }),
            unit: Joi.string(),
            units: Joi.array(),
            projectName: Joi.string(),
            rule: Joi.string(),
            type: Joi.string(),
        }),
    })),
    comment: Joi.string(),
    relationLib: Joi.number().required(),
    libraryLib: Joi.number().required(),
};

export const updateMatchRule: Middleware = async (ctx, next?) => {
    const body = <IUpdateMatchRule>ctx.request.body;
    const err = validate(body, updateMatchRuleSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    // const currentOwner = 793;
    const result = await ListNormOps.getMatchRule({ owner: currentOwner, id: body.matchRuleId });
    if (result.count !== 1) {
        ctx.body = { code: 1001, msg: "error match rule id." };
        return;
    }
    try {
        await ListNormOps.updateMatch(body);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        throw error;
    }

};

// const updateMatchMapSchema = {
//     matchId: Joi.number().required(),
//     itemId: Joi.number().required(),
//     relationLib: Joi.number().required(),
//     calculateRule: Joi.object(),
// };

const addMatchRuleSchema = {
    classId: Joi.number().required(),
    matchRuleDesc: Joi.array().items(Joi.object().keys({
        op: Joi.string(),
        parameterName: Joi.string(),
        result: [Joi.string(), Joi.number()],
    })),
    matchRule: Joi.object(),
    listNorm: Joi.array().items(Joi.number()),
    comment: Joi.string(),
    libId: Joi.number().required(),
};

export const addMatchRule: Middleware = async (ctx, next?) => {
    const body = <IAddMatchRule>ctx.request.body;
    const err = validate(body, addMatchRuleSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    body.owner = ctx.session.company.companyId;
    // body.status = "active";
    const { rows } = await Library.getLibrary({ owner: body.owner, id: body.libId });
    const lib = rows;
    if (lib.length !== 1) {
        ctx.body = { code: 1001, msg: "error library id." };
        return;
    }

    try {
        const matchRuleId = await MatchRule.addMatchRule(body);
        ctx.body = { code: 0, data: { matchRuleId }, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const getCalcItemParams = {
    classVersionId: Joi.number(),
    itemId: Joi.number(),
    version: Joi.number(),
};
// 查找计算项目
export const getCalcItem: Middleware = async (ctx, next?) => {
    const options = <IgetCalcItem>ctx.request.query;
    const err = validate(options, getCalcItemParams);
    if (err) {
        ctx.body = err;
        return;
    }
    const result = await CalcItem.getCalcItem(options);
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const calcInfo = {
    classVersionId: Joi.number().required(),
    itemIds: Joi.number().required() || Joi.array().required(),
};
//根据id查找计算项目
export const getCalcInfo: Middleware = async (ctx, next?) => {
    const err = validate(ctx.request.query, calcInfo);
    if (err) {
        ctx.body = err;
        return;
    }
    const { classVersionId } = ctx.request.query;
    let { itemIds } = ctx.request.query;
    if (Array.isArray(itemIds)) {
        itemIds = [itemIds];
    }
    const ids = itemIds.map((id: string) => parseInt(id, 10));
    const classId = parseInt(classVersionId, 10);
    const result = await CalcItem.findAll({
        attributes: ["itemId", "name", "unit"],
        where: {
            classVersionId: classId,
            itemId: {
                [Op.in]: ids,
            },
        },
        raw: true,
    });
    ctx.body = { code: 0, data: result, msg: "ok" };
};

const getMatchRuleSchema = {
    search: Joi.string(),
    matchRuleId: Joi.number(),
    classId: Joi.any(),
    libId: Joi.number().required(),
    relationLib: Joi.number(),
    libType: Joi.string(),
    relationLibType: Joi.any().valid(["list", "norm"]).required(),
    page: Joi.number(),
    pageSize: Joi.number(),
};


export const getMatchRule: Middleware = async (ctx, next?) => {
    const query = <{
        matchRuleId?: number;
        classId?: number[] | number;
        libId: number;
        relationLib: number;
        relationLibType: string;
        search?: string;
        libType?: string;
        page?: number;
        pageSize?: number;
    }>ctx.request.query;
    const err = validate(query, getMatchRuleSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    // const currentOwner = 793;
    const matchRuleQuery = <IGetMatchRuleOptions>{};
    Assign(matchRuleQuery, Pick(query, ["classId", "libId", "page", "pageSize"]));
    matchRuleQuery.owner = currentOwner;
    if (query.matchRuleId !== undefined) {
        matchRuleQuery.id = query.matchRuleId;
    }
    const dataToResponse = [];
    let items = [];
    const { rows, count } = await ListNormOps.getMatchRule(matchRuleQuery);
    if (count === 0) {
        ctx.body = { code: 0, data: { list: rows, count: count }, msg: "ok" };
        return;
    }
    // 根据relationLibType查询对应的项目表
    let libraryModel;
    if (query.relationLibType === "list") {
        libraryModel = ListItem;
    } else {
        libraryModel = NormItem;
    }
    const ids = rows.map(matchItem => matchItem.id!);
    // 查询匹配规则关联表——list_norm_match_map
    const item = await MatchMap.getMatchId(query.relationLib, ids);
    // 根据库类型，查询相关项目具体信息
    const listNormItems = (await libraryModel.getItems({
        owner: currentOwner,
    })).rows;
    if (query.search === undefined || query.search === null) {
        for (let index = 0; index < rows.length; index++) {
            // 查询MatchMap表，获取itemId
            const matchItem = item.filter(i => i.matchId === rows[index].id);
            // 根据itemId查询具体的项目信息
            for (const matchMap of matchItem) {
                const listNormitem = (<{ libId: number, id: number }[]>listNormItems)
                    .find(item2 => item2.libId === matchMap.relationLib && item2.id === matchMap.itemId);
                if (listNormitem) {
                    const itemresult = {
                        item: listNormitem,
                        calculateRule: matchMap.calculateRule,
                    };
                    items.push(itemresult);
                }
            }
            dataToResponse[index] = {
                matchRule: rows[index],
                item: items,
            };
            items = [];
        }
        ctx.body = { code: 0, data: { count: count, list: dataToResponse }, msg: "ok" };
    }
    if (query.search !== undefined) {
        const listNormItem = (await libraryModel.getItems({
            owner: currentOwner,
            libId: query.relationLib,
            search: query.search,
        })).rows;
        if (listNormItem.length === 0) {
            ctx.body = { code: 0, data: { count: 0, list: listNormItem }, msg: "ok" };
            return;
        }
        for (const match of rows) {
            const resultItem = [];
            for (const listnormitem of listNormItem) {
                const matchItem = item.filter(itemMap => itemMap.matchId === match.id && itemMap.itemId === listnormitem.id!);
                if (matchItem.length > 0) {
                    for (const iterator of matchItem) {
                        const itemresult = {
                            item: listnormitem,
                            calculateRule: iterator.calculateRule,
                        };
                        resultItem.push(itemresult);
                    }
                    if (resultItem.length > 0) {

                        dataToResponse.push({
                            matchRule: match,
                            item: resultItem,
                        });
                    }
                }
            }

        }
        ctx.body = { code: 0, data: { count: dataToResponse.length, list: dataToResponse }, msg: "ok" };
    }

};

const downloadTemplateSchema = {
    libType: Joi.any().valid(["list", "norm", "material"]).required(),
    libId: Joi.number(),
    materialType: Joi.number().valid(["1", "2", "3"]),// 1代表材料库，2代表人工库，3代表机械库
};

export const downloadTemplate: Middleware = async (ctx, next?) => {
    const query = <{ libType: string; libId?: number; owner: number; materialType?: string }>ctx.request.query;
    const err = validate(query, downloadTemplateSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    query.owner = ctx.session.company.companyId;
    let fileName = "";
    let todownload: Middleware;
    if (query.libType === "list") {
        fileName = "清单项目库";
        todownload = MyExcel.downloadListTpl;
    } else if (query.libType === "norm") {
        fileName = "定额项目库";
        todownload = MyExcel.downloadNormTpl;
    } else if (query.libType === "material" && query.materialType !== undefined) {
        if (query.materialType === "1") {
            fileName = "材料项目库";
            todownload = MyExcel.downloadMaterialTpl;
        } else if (query.materialType === "2") {
            fileName = "人工项目库";
            todownload = MyExcel.downloadArtificialTpl;
        } else if (query.materialType === "3") {
            fileName = "机械项目库";
            todownload = MyExcel.downloadMechanicalTpl;
        } else {
            ctx.body = { code: 1001, msg: "error materialType " };
            return;
        }
    } else {
        ctx.body = { code: 1001, msg: "error library type" };
        return;
    }

    if (query.libId !== undefined) {
        const { rows } = await Library.getLibrary({ owner: query.owner, id: query.libId });
        const lib = rows;
        if (lib.length !== 1) {
            ctx.body = { code: 1001, msg: "error library id." };
            return;
        }
        if (lib[0].type !== query.libType) {
            ctx.body = { code: 1001, msg: "error library type." };
            return;
        }
        let region = "无地域";
        if (lib[0].region !== undefined && lib[0].region !== null) {
            region = lib[0].region;
        }
        fileName += `_${lib[0].name}_${region}_${lib[0].version}.xlsx`;
    } else {
        fileName += "_库名称_无地域_版本号.xlsx";
    }

    ctx.respond = false;
    ctx.res.writeHead(200, {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Transfer-Encoding": "chunked",
        "Set-Cookie": "fileDownload=true; path=/",
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    todownload(ctx, next);
};
const uploadSchema = {
    name: Joi.string().required(),
};
export const uploadPreview: Middleware = async (ctx, next?) => {
    const body = <{ name: string }>ctx.request.query;
    const err = validate(body, uploadSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    try {
        const owner = ctx.session.company.companyId; //从session里面取
        const { name } = body;
        const data = await getOssUploadConfig("preview", owner, name);
        ctx.body = {
            data,
            code: 0,
            msg: "success",
        };
    } catch (error) {
        ctx.throw(error);
    }
};

const uploadTemplateSchema = {
    fileName: Joi.string().required(),
};

export const uploadTemplate: Middleware = async (ctx, next?) => {
    const query = <{ fileName: string }>ctx.request.query;
    const err = validate(query, uploadTemplateSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    // filename = "清单项目库_清单库1_上海_1.xlsx";
    const currentOwner = ctx.session.company.companyId;
    // const currentOwner = -2;
    const fileName = query.fileName.split(".xlsx")[0];
    const [type, name, region, version] = fileName.split("_");
    let libType;
    let fileType;
    if (type === "清单项目库") {
        libType = "list";
        fileType = "list";
    } else if (type === "定额项目库") {
        libType = "norm";
        fileType = "norm";
    } else if (type === "人工项目库" || type === "材料项目库" || type === "机械项目库") {
        libType = "material";
        fileType = "material";
        if (type === "人工项目库") {
            fileType = "artificial";
        }
        if (type === "机械项目库") {
            fileType = "mechanical";
        }
    } else {
        ctx.body = { code: 1001, msg: "error filename: library type." };
        return;
    }
    if (name === undefined) {
        ctx.body = { code: 1001, msg: "error filename: name." };
        return;
    }
    let taskRegion = "无地域";
    let taskVersion: number = 1;
    if (region !== undefined) {
        taskRegion = region;
    }
    if (version !== undefined) {
        try {
            taskVersion = parseFloat(version);
            if (isNaN(taskVersion)) {
                throw new Error("error filename: version is NaN.");
            }
        } catch (ex) {
            throw new Error("error filename: version.");
        }
    }

    const taskName = `${name},${taskRegion},${taskVersion}`;

    const data: IAddLibImportTask = {
        fileType,
        owner: currentOwner,
        type: libType,
        name: name,
        region: taskRegion,
        version: taskVersion,
        taskName: taskName,
        fileUri: "",
    };
    const { rows } = await Library.getLibrary(data);
    const libs = rows;
    if (libs.length > 1) {
        ctx.body = { code: 1001, msg: "there are two library are the same." };
        return;
    }
    const { oss, key } = await getOssUploadConfig(fileType, currentOwner, query.fileName);
    try {
        let taskId = 0;
        // 如果清单定额库不存在，则创建该库
        if (libs.length === 0) {
            data.fileUri = key;
            taskId = await ListNormOps.addLibImportTask(data);
        } else {
            taskId = await ImportTask.addImportTask({
                fileType,
                owner: currentOwner,
                name: taskName,
                libId: libs[0].id!,
                fileUri: key,
            });
        }

        ctx.body = { code: 0, data: { taskId, oss, key }, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};

const taskIdSchema = {
    taskId: Joi.number().required(),
};

export const updateImportTask: Middleware = async (ctx, next?) => {
    const body = <{ taskId: number }>ctx.request.body;
    const err = validate(body, taskIdSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const params: { owner: number; id: number } = { owner: currentOwner, id: body.taskId };
    const tasks = await ImportTask.findAllTask(params);
    if (tasks.length !== 1) {
        ctx.body = { code: 1001, msg: "error task id." };
        return;
    }
    try {
        await ImportTask.updateImportTask({ status: "waiting" }, { id: body.taskId });
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};


export const deleteImportTask: Middleware = async (ctx, next?) => {
    try {
        const { params } = ctx;
        const err = validate(params, taskIdSchema);
        if (err) {
            ctx.body = err;
            return;
        }
        const items = await ImportTask.deleteItems(params.taskId);
        if (items > 0) {
            ctx.body = { code: 0, msg: "ok" };
        } else {
            ctx.body = { code: 0, msg: "no this task" };
        }
    } catch (error) {
        ctx.throw(error);
    }
};


export const getImportTaskMsg: Middleware = async (ctx, next?) => {
    const query = <{ taskId: number }>ctx.request.query;
    const err = validate(query, taskIdSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const currentOwner = ctx.session.company.companyId;
    const params: { owner: number; id: number; status: string; } = { owner: currentOwner, id: query.taskId, status: "failed" };
    const result = await ImportTask.findAllTask(params);
    if (result.length === 1) {
        if (result[0].get("errorMsg") !== "Not Found") {
            const url = await ossDownloadUrl(result[0].get("errorMsg"));
            ctx.body = { code: 0, data: { url }, msg: "ok" };
        } else {
            ctx.body = { code: 0, data: { url: "Not Found" }, msg: "ok" };
        }
    } else {
        ctx.body = { code: 1001, msg: "There is not the failed task." };
    }
};

const getImportTasksSchema = {
    libId: Joi.number(),
};
export const getImportTasks: Middleware = async (ctx, next?) => {
    const query = <{ libId?: number }>ctx.request.query;
    const err = validate(query, getImportTasksSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    try {
        // query.owner = ctx.session.company.companyId;
        const currentOwner = ctx.session.company.companyId;
        const where: {
            owner: number;
            libId?: number,
            status: {
                [x: string]: string[];
            },
        } = {
            owner: currentOwner,
            status: {
                [Op.in]: ["waiting", "failed", "succeed"],
            },
        };
        if (query.libId !== undefined) {
            where.libId = query.libId;
        }
        const data = await ImportTask.findAllTask(where);
        ctx.body = {
            data,
            code: 0,
            msg: "success",
        };
    } catch (error) {
        ctx.throw(error);
    }
};

export const doImportTask: Middleware = async (ctx, next?) => {
    try {
        await MyExcel.imporItems(ctx.query.taskId);
        ctx.body = { code: 0, msg: "ok" };
    } catch (error) {
        ctx.throw(error);
    }
};
