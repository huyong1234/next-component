import * as Path from "path";
import * as Excel from "exceljs";
import { Transaction } from "sequelize";
import { Middleware } from "@nestsoft/koa-extended";
import {
    Models, Library, Catalog,
    ListItem, NormItem, ListNormMap, NormMaterialMap,
    ImportTask,
    MaterialItem
} from "../model";
import { ListNormOps } from "../repo";
import Config from "../config";
import * as readMeTpl from "./excelReadmeTpl";
import { ossDownload, ossUpload, isExist, simpleDelFile } from "../utils";
import * as lodash from "lodash";
const units = Config.get("unit");


const getCatalogs = async (owner: number, libId: number, catalogs: string[]) => {
    const catalogTree = await Catalog.getCatalogTree({ owner, libId });
    for (const ctlg of catalogTree) {
        const name = ctlg.get("name");
        if (!catalogs.includes(name)) {
            catalogs.push(name);
        }
        const subCatalogs = ctlg.get("Catalogs");
        for (const subCatalog of subCatalogs) {
            const subName = name + "/" + subCatalog.get("name");
            if (!catalogs.includes(subName)) {
                catalogs.push(subName);
            }
            const ssubCatalogs = subCatalog.get("Catalogs");
            for (const ssubCatalog of ssubCatalogs) {
                const ssubName = subName + "/" + ssubCatalog.get("name");
                if (!catalogs.includes(ssubName)) {
                    catalogs.push(ssubName);
                }
            }
        }
    }
};

const getCatalogsMap = async (owner: number, libId: number, catalogs: Map<string, number>) => {
    const catalogTree = await Catalog.getCatalogTree({ owner, libId });
    for (const ctlg of catalogTree) {
        const name = ctlg.get("name");
        if (!catalogs.has(name)) {
            catalogs.set(name, ctlg.get("id"));
        }
        const subCatalogs = ctlg.get("Catalogs");
        for (const subCatalog of subCatalogs) {
            const subName = name + "/" + subCatalog.get("name");
            if (!catalogs.has(subName)) {
                catalogs.set(subName, subCatalog.get("id"));
            }
            const ssubCatalogs = subCatalog.get("Catalogs");
            for (const ssubCatalog of ssubCatalogs) {
                const ssubName = subName + "/" + ssubCatalog.get("name");
                if (!catalogs.has(ssubName)) {
                    catalogs.set(ssubName, ssubCatalog.get("id"));
                }
            }
        }
    }
};

const addReadme = async (wb: any, tplType: string) => {
    let readmeStr = "";
    if (tplType === "list") {
        readmeStr = readMeTpl.list;
    } else if (tplType === "norm") {
        readmeStr = readMeTpl.norm;
    } else if (tplType === "material") {
        readmeStr = readMeTpl.material;
    } else if (tplType === "artificial") {
        readmeStr = readMeTpl.artificial;
    } else {
        readmeStr = readMeTpl.mechanical;
    }

    const readmeSheet = wb.addWorksheet("填写说明");
    readmeSheet.mergeCells("A1:G29");
    readmeSheet.getCell("A1").alignment = { vertical: "top", horizontal: "justify" };
    readmeSheet.getCell("A1").value = readmeStr;
};

export const downloadListTpl: Middleware = async (ctx, next?) => {
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: ctx.res,
        useStyles: true,
        useSharedStrings: true,
    });
    workbook.views = [
        {
            x: 0, y: 0, width: 10000, height: 20000,
            firstSheet: 0, activeTab: 1, visibility: "visible",
        },
    ];
    const itemSheet = workbook.addWorksheet("项目");
    await addReadme(workbook, "list");
    // const readmeSheet = workbook.addWorksheet("填写说明");
    const db = "数据库_勿修改";
    const databaseSheet = workbook.addWorksheet(db);
    (<any>databaseSheet).state = "hidden";
    itemSheet.columns = [
        { header: "清单项", width: 30 },    // A所属章节
        { header: "清单项", width: 15 },    // B项目编码
        { header: "清单项", width: 15 },    // C项目名称
        { header: "清单项", width: 10 },    // D单位
        { header: "清单项", width: 15 },    // E综合销售单价
        { header: "清单项", width: 15 },    // F综合成本单价
        { header: "清单项", width: 30 },    // G项目特征
        { header: "清单项", width: 30 },    // H工作内容
        { header: "定额组成", width: 35 },  //I所属定额库
        { header: "定额组成", width: 15 },  //J项目编码
        { header: "定额组成", width: 10 },  // K组成数量
    ];
    itemSheet.addRow(["所属章节", "项目编码", "项目名称", "单位", "综合销售单价", "综合成本单价", "项目特征", "工作内容", "所属定额库", "项目编码", "组成数量"]);
    itemSheet.mergeCells("A1:H1");
    itemSheet.mergeCells("I1:K1");
    const headerRow = itemSheet.getRow(1);
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.font = { bold: true, size: 12 };
    const tagRow = itemSheet.getRow(2);
    tagRow.alignment = { vertical: "middle", horizontal: "center" };
    tagRow.eachCell((cell, colNumber) => {
        if (colNumber <= 4) {
            cell.font = { bold: true, size: 11, color: { argb: "FFFF0000" } };
        } else {
            cell.font = { bold: true, size: 11 };
        }
    });
    const catalogs: string[] = [];
    await getCatalogs(ctx.request.query.owner, ctx.request.query.libId, catalogs);

    const { rows } = await Library.getLibrary({ owner: ctx.request.query.owner, type: "norm", status: "active" });
    const codeSet = await ListNormOps.getCodeSet("norm", ctx.request.query.owner);
    const normItems = new Map<string, string[]>();
    for (const lib of rows) {
        const normLibStr = `${lib.name}_${lib.region}_${lib.version}`;
        // normLibStrs.push(`${lib.name}_${lib.region}_${lib.version}`);
        for (const cs of codeSet) {
            if (lib.id === cs.id) {
                normItems.set(normLibStr, cs.codeSet.split(","));
            }
        }
        if (!normItems.has(normLibStr)) {
            normItems.set(normLibStr, []);
        }
    }
    const normLibStrs = Array.from(normItems.keys());
    const catalogCol = "A";
    const normLibCol = "B";
    (<any>databaseSheet.getColumn(catalogCol)).values = catalogs;
    (<any>databaseSheet.getColumn(normLibCol)).values = normLibStrs;
    let index: number = normLibCol.codePointAt(0)!;
    normItems.forEach((codes, normLibStr) => {
        index += 1;
        const col = databaseSheet.getColumn(String.fromCodePoint(index));
        (<any>col).values = codes;
        col.eachCell((cell, colNumber) => {
            cell.addName(normLibStr);
        });
    });
    databaseSheet.commit();

    // 渲染下拉框
    for (let row = 3; row < 5000; row++) {
        // 渲染"所属章节"下拉框
        if (catalogs.length > 0) {
            itemSheet.getCell(row, 1).dataValidation = {
                type: "list",
                formulae: [`=${db}!$${catalogCol}$1:$${catalogCol}$${catalogs.length}`],
            };
        }
        if (normLibStrs.length > 0) {
            itemSheet.getCell(row, 9).dataValidation = {
                type: "list",
                formulae: [`=${db}!$${normLibCol}$1:$${normLibCol}$${normLibStrs.length}`],
            };
            itemSheet.getCell(row, 10).dataValidation = {
                type: "list",
                formulae: [`=INDIRECT(I${row})`],
            };
        }
        itemSheet.getCell(row, 4).dataValidation = {
            type: "list",
            formulae: [`"${units}"`],
        };
    }
    itemSheet.commit();
    workbook.commit();
};

export const downloadNormTpl: Middleware = async (ctx, next?) => {
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: ctx.res,
        useStyles: true,
        useSharedStrings: true,
    });
    workbook.views = [
        {
            x: 0, y: 0, width: 10000, height: 20000,
            firstSheet: 0, activeTab: 1, visibility: "visible",
        },
    ];
    const itemSheet = workbook.addWorksheet("项目");
    await addReadme(workbook, "norm");
    const db = "数据库_勿修改";
    const databaseSheet = workbook.addWorksheet(db);
    (<any>databaseSheet).state = "hidden";
    itemSheet.columns = [
        { header: "定额项", width: 30 },    // A 所属章节
        { header: "定额项", width: 15 },    // B 项目编码
        { header: "定额项", width: 15 },    // C 项目名称
        { header: "定额项", width: 10 },    // D 单位
        { header: "定额项", width: 10 },    // E 损耗
        { header: "定额项", width: 10 },    // F 主材售价
        { header: "定额项", width: 15 },    // G 主材成本价
        { header: "定额项", width: 10 },    // H 辅材售价
        { header: "定额项", width: 15 },    // I 辅材成本价
        { header: "定额项", width: 10 },    // G 人工售价
        { header: "定额项", width: 15 },    // K 人工成本价
        { header: "定额项", width: 10 },    // L 机械售价
        { header: "定额项", width: 15 },    // M 机械成本价
        { header: "定额项", width: 30 },    // N 项目特征
        { header: "定额项", width: 30 },    // O 工作内容
        { header: "人材机组成", width: 35 },  // P 所属人材机库
        { header: "人材机组成", width: 15 },  // Q 编码
        { header: "人材机组成", width: 10 },  // R 组成数量
        { header: "人材机组成", width: 10 },  // S 损耗
    ];
    itemSheet.addRow([
        "所属章节", "项目编码", "项目名称", "单位",
        "损耗（%）", "主材售价", "主材成本价", "辅材售价", "辅材成本价", "人工售价", "人工成本价", "机械售价", "机械成本价",
        "项目特征", "工作内容", "所属人材机库", "编码", "组成数量", "损耗（%）"]);
    itemSheet.mergeCells("A1:O1");
    itemSheet.mergeCells("P1:S1");
    const headerRow = itemSheet.getRow(1);
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.font = { bold: true, size: 12 };
    const tagRow = itemSheet.getRow(2);
    tagRow.alignment = { vertical: "middle", horizontal: "center" };
    tagRow.eachCell((cell, colNumber) => {
        if (colNumber <= 4) {
            cell.font = { bold: true, size: 11, color: { argb: "FFFF0000" } };
        } else {
            cell.font = { bold: true, size: 11 };
        }
    });

    const catalogs: string[] = [];
    await getCatalogs(ctx.request.query.owner, ctx.request.query.libId, catalogs);

    const { rows } = await Library.getLibrary({ owner: ctx.request.query.owner, type: "material", status: "active" });
    const codeSet = await ListNormOps.getCodeSet("material", ctx.request.query.owner);

    const materialItems = new Map<string, string[]>();
    for (const lib of rows) {
        const materialLibStr = `${lib.name}_${lib.region}`;
        // normLibStrs.push(`${lib.name}_${lib.region}_${lib.version}`);
        for (const cs of codeSet) {
            if (lib.id === cs.id) {
                materialItems.set(materialLibStr, cs.codeSet.split(","));
            }
        }
        if (!materialItems.has(materialLibStr)) {
            materialItems.set(materialLibStr, []);
        }
    }

    const materialLibStrs = Array.from(materialItems.keys());
    const catalogCol = "A";
    const materialLibCol = "B";
    (<any>databaseSheet.getColumn(catalogCol)).values = catalogs;
    (<any>databaseSheet.getColumn(materialLibCol)).values = materialLibStrs;
    let index: number = materialLibCol.codePointAt(0)!;
    materialItems.forEach((codes, normLibStr) => {
        index += 1;
        const col = databaseSheet.getColumn(String.fromCodePoint(index));
        (<any>col).values = codes;
        col.eachCell((cell, colNumber) => {
            cell.addName(normLibStr);
        });
    });
    databaseSheet.commit();

    // 渲染下拉框
    for (let row = 3; row < 5000; row++) {
        // 渲染"所属章节"下拉框
        if (catalogs.length > 0) {
            itemSheet.getCell(row, 1).dataValidation = {
                type: "list",
                formulae: [`=${db}!$${catalogCol}$1:$${catalogCol}$${catalogs.length}`],
            };
        }
        if (materialLibStrs.length > 0) {
            itemSheet.getCell(row, 16).dataValidation = {
                type: "list",
                formulae: [`=${db}!$${materialLibCol}$1:$${materialLibCol}$${materialLibStrs.length}`],
            };
            itemSheet.getCell(row, 17).dataValidation = {
                type: "list",
                formulae: [`=INDIRECT(P${row})`],
            };
        }
        itemSheet.getCell(row, 4).dataValidation = {
            type: "list",
            formulae: [`"${units}"`],
        };
    }
    itemSheet.commit();
    workbook.commit();
};

export const downloadMaterialTpl: Middleware = async (ctx, next?) => {
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: ctx.res,
        useStyles: true,
        useSharedStrings: true,
    });
    workbook.views = [
        {
            x: 0, y: 0, width: 10000, height: 20000,
            firstSheet: 0, activeTab: 1, visibility: "visible",
        },
    ];
    const itemSheet = workbook.addWorksheet("项目");
    await addReadme(workbook, "material");
    const db = "数据库_勿修改";
    const databaseSheet = workbook.addWorksheet(db);
    (<any>databaseSheet).state = "hidden";
    itemSheet.columns = [
        { header: "材料信息", width: 15 },    // A 编码
        { header: "材料信息", width: 15 },    // B 名称
        { header: "材料信息", width: 10 },    // C 特征1
        { header: "材料信息", width: 10 },    // D 特征2
        { header: "材料信息", width: 30 },    // E 分类
        { header: "材料信息", width: 10 },    // F 单位
        { header: "材料信息", width: 10 },    // G 损耗
        { header: "材料信息", width: 10 },    // H 型号
        { header: "材料信息", width: 10 },    // I 规格
        { header: "材料信息", width: 10 },    // J 品牌
        { header: "材料信息", width: 10 },    // K 系列
        { header: "材料信息", width: 10 },    // L 销售价
        { header: "材料信息", width: 10 },    // M 成本价
        { header: "材料信息", width: 30 },    // N 备注
    ];
    itemSheet.addRow(["编码", "名称", "特征1", "特征2", "分类",
        "单位", "损耗（%）", "型号", "规格", "品牌", "系列", "销售价", "成本价", "备注"]);
    itemSheet.mergeCells("A1:N1");
    const headerRow = itemSheet.getRow(1);
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.font = { bold: true, size: 12 };
    const tagRow = itemSheet.getRow(2);
    tagRow.alignment = { vertical: "middle", horizontal: "center" };
    tagRow.eachCell((cell, colNumber) => {
        if (colNumber <= 3 || colNumber === 6 || colNumber === 12) {
            cell.font = { bold: true, size: 11, color: { argb: "FFFF0000" } };
        } else {
            cell.font = { bold: true, size: 11 };
        }
    });

    const catalogs: string[] = [];
    await getCatalogs(ctx.request.query.owner, ctx.request.query.libId, catalogs);

    const catalogCol = "A";
    (<any>databaseSheet.getColumn(catalogCol)).values = catalogs;
    databaseSheet.commit();

    // 渲染下拉框
    for (let row = 3; row < 5000; row++) {
        itemSheet.getCell(row, 3).dataValidation = {
            type: "list",
            formulae: [`"主材,辅材,软装,家电"`],
        };
        itemSheet.getCell(row, 4).dataValidation = {
            type: "list",
            formulae: [`"甲供,乙供"`],
        };
        // 渲染"分类"下拉框
        if (catalogs.length > 0) {
            itemSheet.getCell(row, 5).dataValidation = {
                type: "list",
                formulae: [`=${db}!$${catalogCol}$1:$${catalogCol}$${catalogs.length}`],
            };
        }
        itemSheet.getCell(row, 6).dataValidation = {
            type: "list",
            formulae: [`"${units}"`],
        };
    }
    itemSheet.commit();
    workbook.commit();
};
export const downloadArtificialTpl: Middleware = async (ctx, next?) => {
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: ctx.res,
        useStyles: true,
        useSharedStrings: true,
    });
    workbook.views = [
        {
            x: 0, y: 0, width: 10000, height: 20000,
            firstSheet: 0, activeTab: 1, visibility: "visible",
        },
    ];
    const itemSheet = workbook.addWorksheet("项目");
    await addReadme(workbook, "artificial");
    const db = "数据库_勿修改";
    const databaseSheet = workbook.addWorksheet(db);
    (<any>databaseSheet).state = "hidden";
    itemSheet.columns = [
        { header: "人工信息", width: 15 },    // A 编码
        { header: "人工信息", width: 15 },    // B 名称
        { header: "人工信息", width: 10 },    // C 特征
        { header: "人工信息", width: 30 },    // D 分类
        { header: "人工信息", width: 10 },    // E 单位
        { header: "人工信息", width: 10 },    // F 销售价
        { header: "人工信息", width: 10 },    // G 成本价
        { header: "人工信息", width: 30 },    // H 备注
    ];
    itemSheet.addRow(["编码", "名称", "特征", "分类", "单位", "销售价", "成本价", "备注"]);
    itemSheet.mergeCells("A1:H1");
    const headerRow = itemSheet.getRow(1);
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.font = { bold: true, size: 12 };
    const tagRow = itemSheet.getRow(2);
    tagRow.alignment = { vertical: "middle", horizontal: "center" };
    tagRow.eachCell((cell, colNumber) => {
        if (colNumber <= 2 || colNumber === 5 || colNumber === 6) {
            cell.font = { bold: true, size: 11, color: { argb: "FFFF0000" } };
        } else {
            cell.font = { bold: true, size: 11 };
        }
    });

    const catalogs: string[] = [];
    await getCatalogs(ctx.request.query.owner, ctx.request.query.libId, catalogs);

    const catalogCol = "A";
    (<any>databaseSheet.getColumn(catalogCol)).values = catalogs;
    databaseSheet.commit();

    // 渲染下拉框
    for (let row = 3; row < 5000; row++) {
        itemSheet.getCell(row, 3).dataValidation = {
            type: "list",
            formulae: [`"甲供,乙供"`],
        };
        // 渲染"分类"下拉框
        if (catalogs.length > 0) {
            itemSheet.getCell(row, 4).dataValidation = {
                type: "list",
                formulae: [`=${db}!$${catalogCol}$1:$${catalogCol}$${catalogs.length}`],
            };
        }
        itemSheet.getCell(row, 5).dataValidation = {
            type: "list",
            formulae: [`${units}`],
        };
    }
    itemSheet.commit();
    workbook.commit();
};
export const downloadMechanicalTpl: Middleware = async (ctx, next?) => {
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: ctx.res,
        useStyles: true,
        useSharedStrings: true,
    });
    workbook.views = [
        {
            x: 0, y: 0, width: 10000, height: 20000,
            firstSheet: 0, activeTab: 1, visibility: "visible",
        },
    ];
    const itemSheet = workbook.addWorksheet("项目");
    await addReadme(workbook, "mechanical");
    const db = "数据库_勿修改";
    const databaseSheet = workbook.addWorksheet(db);
    (<any>databaseSheet).state = "hidden";
    itemSheet.columns = [
        { header: "机械信息", width: 15 },    // A 编码
        { header: "机械信息", width: 15 },    // B 名称
        { header: "机械信息", width: 10 },    // C 特征
        { header: "机械信息", width: 30 },    // D 分类
        { header: "机械信息", width: 10 },    // E 单位
        { header: "材料信息", width: 10 },    // F 型号
        { header: "材料信息", width: 10 },    // G 规格
        { header: "机械信息", width: 10 },    // H 销售价
        { header: "机械信息", width: 10 },    // I 成本价
        { header: "机械信息", width: 30 },    // J 备注
    ];
    itemSheet.addRow(["编码", "名称", "特征", "分类", "单位", "型号", "规格", "销售价", "成本价", "备注"]);
    itemSheet.mergeCells("A1:J1");
    const headerRow = itemSheet.getRow(1);
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.font = { bold: true, size: 12 };
    const tagRow = itemSheet.getRow(2);
    tagRow.alignment = { vertical: "middle", horizontal: "center" };
    tagRow.eachCell((cell, colNumber) => {
        if (colNumber <= 2 || colNumber === 5 || colNumber === 8) {
            cell.font = { bold: true, size: 11, color: { argb: "FFFF0000" } };
        } else {
            cell.font = { bold: true, size: 11 };
        }
    });

    const catalogs: string[] = [];
    await getCatalogs(ctx.request.query.owner, ctx.request.query.libId, catalogs);

    const catalogCol = "A";
    (<any>databaseSheet.getColumn(catalogCol)).values = catalogs;
    databaseSheet.commit();

    // 渲染下拉框
    for (let row = 3; row < 5000; row++) {
        itemSheet.getCell(row, 3).dataValidation = {
            type: "list",
            formulae: [`"甲供,乙供"`],
        };
        // 渲染"分类"下拉框
        if (catalogs.length > 0) {
            itemSheet.getCell(row, 4).dataValidation = {
                type: "list",
                formulae: [`=${db}!$${catalogCol}$1:$${catalogCol}$${catalogs.length}`],
            };
        }
        itemSheet.getCell(row, 5).dataValidation = {
            type: "list",
            formulae: [`${units}`],
        };
    }
    itemSheet.commit();
    workbook.commit();
};

const errorHandler = async (errorMsg: string[][], task: any) => {
    const workbook = new Excel.Workbook();
    const errorMsgSheet = workbook.addWorksheet("错误信息");
    for (const iterator of errorMsg) {
        const tagRow = errorMsgSheet.addRow(iterator);
        tagRow.eachCell((cell, colNumber) => {
            if (colNumber === 1) {
                cell.font = { bold: true, size: 11, color: { argb: "FFFF0000" } };
            }
        });
    }
    const ossObjectKey = `error/${task.fileUri}`;
    const filePath = Path.join(__dirname, "../../excels", ossObjectKey.replace(/\//g, "_"));
    await workbook.xlsx.writeFile(filePath);
    await ossUpload(ossObjectKey, filePath, { acl: "public-read" });
    await simpleDelFile(filePath);
    // await ImportTask.update({ state: "failed", errorMsg: ossObjectKey }, { where: { id: task.id }, transaction: transaction });
};

const toImportCatalogs = async (catalogs: string[], owner: number, libId: number, transaction: Transaction, catalogType: string) => {
    const catalogsMap = new Map<string, number>();
    await getCatalogsMap(owner, libId, catalogsMap);
    const catalogsToImport: Set<string> = new Set<string>();
    for (const ctlg of catalogs) {
        if (!catalogsMap.has(ctlg)) {
            catalogsToImport.add(ctlg);
        }
    }

    // ======================= 一层章节 ================
    const rootCatalogs: any[] = [];
    const rootCatalogNames: string[] = [];
    for (const ctlg of catalogsToImport) {
        if (ctlg.indexOf("/") === -1) {
            // “新加章” 下挂载了项目
            rootCatalogNames.push(ctlg);
            rootCatalogs.push({ name: ctlg, owner: owner, libId: libId, type: catalogType });
        } else {
            // [ 新 | 旧 ]章/新加节
            const unkownCatalog = ctlg.split("/")[0];
            if (!catalogsMap.has(unkownCatalog) && !rootCatalogNames.includes(unkownCatalog)) {
                rootCatalogNames.push(unkownCatalog);
                rootCatalogs.push({ name: unkownCatalog, owner: owner, libId: libId, type: catalogType });
            }
        }
    }

    if (rootCatalogNames.length > 0) {
        for (const ctlg of rootCatalogNames) {
            catalogsToImport.delete(ctlg);
        }
        await Catalog.bulkCreate(rootCatalogs, { transaction });
        const newRootCatalogs = await Catalog.findAll({
            attributes: ["id", "name"],
            where: { name: rootCatalogNames, owner: owner, libId: libId },
            raw: true,
            transaction: transaction,
        });
        for (const ctlg of newRootCatalogs) {
            catalogsMap.set(ctlg.name!, ctlg.id!);
        }
    }

    // ======================= 二层章节 ================
    const subCatalogs: any[] = [];
    const subCatalogNames: string[] = [];
    const twoLayersCatalogs: string[] = [];
    for (const ctlg of catalogsToImport) {
        const catalogNameArr = ctlg.split("/");
        if (catalogNameArr.length === 2) {
            twoLayersCatalogs.push(ctlg);
            if (!subCatalogNames.includes(catalogNameArr[1])) {
                subCatalogNames.push(catalogNameArr[1]);
                subCatalogs.push({
                    name: catalogNameArr[1],
                    owner: owner,
                    libId: libId,
                    parentId: catalogsMap.get(catalogNameArr[0]),
                    type: catalogType,
                });
            }
        } else {
            // catalogNameArr.length === 3
            const unkownTwoCatalog = `${catalogNameArr[0]}/${catalogNameArr[1]}`;
            if (!catalogsMap.has(unkownTwoCatalog) && !subCatalogNames.includes(catalogNameArr[1])) {
                // 如果第二层章节名称一样，则前两层章节名称组合一定一样
                // if (!twoLayersCatalogs.includes(unkownTwoCatalog)) {
                //     twoLayersCatalogs.push();
                // }
                twoLayersCatalogs.push(unkownTwoCatalog);
                subCatalogNames.push(catalogNameArr[1]);
                subCatalogs.push({
                    name: catalogNameArr[1],
                    owner: owner,
                    libId: libId,
                    parentId: catalogsMap.get(catalogNameArr[0]),
                    type: catalogType,
                });
            }
        }
    }

    if (subCatalogNames.length > 0) {
        for (const ctlg of twoLayersCatalogs) {
            catalogsToImport.delete(ctlg);
        }
        await Catalog.bulkCreate(subCatalogs, { transaction });
        const newSubCatalogs = await Catalog.findAll({
            attributes: ["id", "name"],
            where: { name: subCatalogNames, owner: owner, libId: libId },
            raw: true,
            transaction: transaction,
        });
        for (const ctlg of newSubCatalogs) {
            for (const twoLayersCatalog of twoLayersCatalogs) {
                if (twoLayersCatalog.includes(ctlg.name!)) {
                    catalogsMap.set(twoLayersCatalog, ctlg.id!);
                }
            }
        }
    }
    // ======================= 三层章节 ================
    const ssubCatalogs: any[] = [];
    const ssubCatalogNames: string[] = [];
    // const threeLayersCatalogs: string[] = [];
    // 最多三层章节
    for (const ctlg of catalogsToImport) {
        const secondSlashIndex = ctlg.indexOf("/", ctlg.indexOf("/") + 1);
        const parentLayerCatalog = ctlg.substring(0, secondSlashIndex);
        const ssubCatalogName = ctlg.substring(secondSlashIndex + 1);
        ssubCatalogNames.push(ssubCatalogName);
        ssubCatalogs.push({
            name: ssubCatalogName,
            owner: owner,
            libId: libId,
            parentId: catalogsMap.get(parentLayerCatalog),
            type: catalogType,
        });
    }
    if (ssubCatalogNames.length > 0) {
        await Catalog.bulkCreate(ssubCatalogs, { transaction });
        const newSSubCatalogs = await Catalog.findAll({
            attributes: ["id", "name"],
            where: { name: ssubCatalogNames, owner: owner, libId: libId },
            raw: true,
            transaction: transaction,
        });
        for (const ctlg of newSSubCatalogs) {
            for (const threeLayersCatalog of catalogsToImport) {
                if (threeLayersCatalog.includes(ctlg.name!)) {
                    catalogsMap.set(threeLayersCatalog, ctlg.id!);
                }
            }
        }
    }
    return catalogsMap;
};

// const isTheSameObj = (oneObj: { [index: string]: string | number | undefined }, otherObj: { [index: string]: string | number | undefined }) => {
//     let flag = true;
//     if (oneObj === otherObj) {
//         return flag;
//     }
//     for (const key in oneObj) {
//         if (oneObj[key] !== otherObj[key]) {
//             flag = false;
//             break;
//         }
//     }
//     return flag;
// };

const toImportListItems = async (filePath: string, task: any, transaction: Transaction) => {
    const workbook = new Excel.Workbook();

    // just for test
    // const testFilePath = Path.join(__dirname, "../../excels", "test_清单项目库_清单库1_上海_1.1.xlsx");
    // await workbook.xlsx.readFile(testFilePath);

    await workbook.xlsx.readFile(filePath);
    const items = workbook.getWorksheet("项目");

    items.getColumn("A").key = "ctlg";
    items.getColumn("B").key = "code";
    items.getColumn("C").key = "name";
    items.getColumn("D").key = "unit";
    items.getColumn("E").key = "sell";
    items.getColumn("F").key = "cost";
    items.getColumn("G").key = "featureDesc";
    items.getColumn("H").key = "jobs";
    items.getColumn("I").key = "normLibrary";
    items.getColumn("J").key = "normCode";
    items.getColumn("K").key = "quantity";

    const catalogs = new Set<string>();//章节目录
    const normLibNames = new Set<string>();//定额名字
    const normLibRegions = new Set<string>();//定额地区
    const normLibVersions = new Set<string>();//定额版本
    const normCodes = new Set<string>();//定额编码
    items.eachRow((row, rowNumber) => {
        if (rowNumber < 3) return;
        const ctlg = getCellString(row, "ctlg");
        if (isExist(ctlg)) {
            catalogs.add(ctlg);
        }
        const normLibrary = row.getCell("normLibrary").value;
        if (typeof normLibrary === "string") {
            const normLibInfoArr = normLibrary.split("_");
            if (normLibInfoArr.length === 3) {
                normLibNames.add(normLibInfoArr[0]);
                normLibRegions.add(normLibInfoArr[1]);
                normLibVersions.add(normLibInfoArr[2]);
            }
        }
        const normCode = getCellString(row, "normCode");
        if (isExist(normCode)) {
            normCodes.add(normCode);
        }
    });
    try {
        const catalogsMap = await toImportCatalogs(Array.from(catalogs), task.owner, task.libId, transaction, "清单");
        let normLibCodeToIdMap = new Map<string, number>();
        if (normCodes.size && normLibNames.size && normLibRegions.size && normLibVersions.size) {
            normLibCodeToIdMap = await ListNormOps.getLibCodeToIdMap({
                type: "norm",
                owner: task.owner,
                codes: Array.from(normCodes),
                libNames: Array.from(normLibNames),
                libRegions: Array.from(normLibRegions),
                libVersions: Array.from(normLibVersions),
            });
        }
        let lastData: string[] = [];
        const invalidData: string[][] = [];
        const codes = new Set<string>();//用来判断编码是否唯一的标识
        const listItemsToImport: any[] = [];
        const listCodeToItemsMap = new Map<string, any[]>();
        let lastRow: any;
        let allRightLastRow: boolean = true;
        items.eachRow((row, rowNumber) => {
            if (rowNumber < 3) {
                return;
            }
            const catalog = getCellString(row, "ctlg");
            const code = getCellString(row, "code");
            const name = getCellString(row, "name");
            const unit = getCellString(row, "unit");
            const sell = getCellString(row, "sell");
            const cost = getCellString(row, "cost");
            const featureDesc = getCellString(row, "featureDesc");
            const jobs = getCellString(row, "jobs");
            const normLibrary = getCellString(row, "normLibrary");
            const normCode = getCellString(row, "normCode");
            const quantity = getCellString(row, "quantity");
            const catalogId = catalogsMap.get(catalog);

            const currentRow = {
                code, name, unit, featureDesc, jobs, catalogId,
                owner: task.owner, price: { sell, cost }, libId: task.libId,
            };
            // 清单项目编码相同在认为是同一条清单项目
            // 如果不是第一条清单项目数据，并且“当前行”与“上一行”清单项目数据不同，则首先处理“上一行”数据
            if (isExist(lastRow) && (currentRow.code !== lastRow.code)) {
                if (allRightLastRow) {
                    listItemsToImport.push(lastRow);
                } else {
                    if (listCodeToItemsMap.has(lastRow.code)) {
                        listCodeToItemsMap.delete(lastRow.code);
                    }
                }
                // 处理完上一条清单项目数据，则设置allRightLastRow为初始状态
                allRightLastRow = true;
            }
            const currentArr = [catalog, code, name, unit, sell, cost, featureDesc, jobs,
                normLibrary, normCode, quantity];
            let currentListOk = true;
            let currentNormOK = true;
            if (!isExist(catalogId) || !isExist(code) || !isExist(name) || !isExist(unit)) {
                currentListOk = false;
                const errorRow = errorData(`第${rowNumber}行缺少必填的信息`, currentArr);
                invalidData.push(errorRow);
            }
            const currentStr = currentArr.filter((item, i) => i < 8);
            if (codes.has(code)) {
                if (lodash.difference(currentStr, lastData).length) {
                    const errorRow = errorData(`第${rowNumber}行编码重复`, currentArr);
                    invalidData.push(errorRow);
                }
            } else {
                codes.add(code);
            }
            lastData = [...currentStr];
            if (currentListOk) {
                if (!isExist(normLibrary) && !isExist(normCode) && !isExist(quantity)) {
                    // 如果当前清单项目没有定额组成，则不做任何操作
                } else if (!isExist(normLibrary) || !isExist(normCode) || !isExist(quantity)) {
                    // 定额组成缺少必要参数，则标记当前清单项不可用
                    currentNormOK = false;
                    const errorRow = errorData(`第${rowNumber}行所属定额库相关的信息缺少`, currentArr);
                    invalidData.push(errorRow);
                } else {
                    const normLibCode = `${normLibrary}_${normCode}`;
                    if (normLibCodeToIdMap.has(normLibCode)) {
                        // 因为“当前行”与“上一行”清单项目不同，会初始化allRightLastRow=true
                        // 所以这里不会影响新的清单项目
                        if (allRightLastRow) {
                            const normId = normLibCodeToIdMap.get(normLibCode);
                            if (!listCodeToItemsMap.has(code)) {
                                listCodeToItemsMap.set(code, []);
                            }
                            const arr = listCodeToItemsMap.get(code);
                            arr!.push({ normId: normId, quantity: quantity });
                        }
                    } else {
                        // 在normLibCodeToIdMap中找不到相应的定额id，则标记当前清单项不可用
                        currentNormOK = false;
                        const errorRow = errorData(`第${rowNumber}行所属定额库不存在`, currentArr);
                        invalidData.push(errorRow);
                    }
                }
            }
            lastRow = currentRow;
            // 如果一条清单项目，或其某一个定额组成不正确，则该清单项目及其所有定额组成都不会被导入
            if (allRightLastRow) {
                if (!currentListOk || !currentNormOK) {
                    allRightLastRow = false;
                }
            }
        });
        // 处理最后一条清单项目数据
        if (allRightLastRow) {
            listItemsToImport.push(lastRow);
        } else {

            if (listCodeToItemsMap.has(lastRow.code)) {

                listCodeToItemsMap.delete(lastRow.code);
            }
        }

        if (invalidData.length > 0) {
            // 如果存在无效数据
            await errorHandler(invalidData, task);
            throw new Error("Handled invalid data error");
        }
        await ListItem.bulkCreate(listItemsToImport, { transaction });
        const lists = await ListItem.findAll({
            attributes: ["id", "code"],
            where: { code: Array.from(listCodeToItemsMap.keys()), owner: task.owner, catalogId: Array.from(catalogsMap.values()) },
            raw: true,
            transaction: transaction,
        });

        const toImportListNormMap: any[] = [];
        for (const list of lists) {
            const listId = list.id!;
            const listCode = list.code!;
            if (listCodeToItemsMap.has(listCode)) {
                const addedNormItems = listCodeToItemsMap.get(listCode);
                for (const anItem of addedNormItems!) {
                    anItem.listId = listId;
                    toImportListNormMap.push(anItem);
                }
            }
        }
        await ListNormMap.bulkCreate(toImportListNormMap, { transaction: transaction });
    } catch (ex) {
        if (ex.message !== "Handled invalid data error") {
            await errorHandler([["Internel error"]], task);
            throw new Error("Internel error");
        } else {
            throw ex;
        }
    }
};

const toImportNormItems = async (filePath: string, task: any, transaction: Transaction) => {
    const workbook = new Excel.Workbook();

    await workbook.xlsx.readFile(filePath);
    const items = workbook.getWorksheet("项目");

    items.getColumn("A").key = "ctlg";
    items.getColumn("B").key = "code";
    items.getColumn("C").key = "name";
    items.getColumn("D").key = "unit";
    items.getColumn("E").key = "loss";
    items.getColumn("F").key = "stuffMainSell";
    items.getColumn("G").key = "stuffMainCost";
    items.getColumn("H").key = "stuffAttachedSell";
    items.getColumn("I").key = "stuffAttachedCost";
    items.getColumn("J").key = "laborSell";
    items.getColumn("K").key = "laborCost";
    items.getColumn("L").key = "machineSell";
    items.getColumn("M").key = "machineCost";
    items.getColumn("N").key = "featureDesc";
    items.getColumn("O").key = "jobs";
    items.getColumn("P").key = "materialLib";
    items.getColumn("Q").key = "materialCode";
    items.getColumn("R").key = "quantity";
    items.getColumn("S").key = "materialLoss";

    const catalogs = new Set<string>();
    const materialLibNames = new Set<string>();
    const materialLibRegions = new Set<string>();
    const materialLibVersions = new Set<string>();
    const materialCodes = new Set<string>();

    items.eachRow((row, rowNumber) => {
        if (rowNumber < 3) return;
        const ctlg = getCellString(row, "ctlg");
        if (isExist(ctlg)) {
            catalogs.add(ctlg);
        }
        const materialLib = row.getCell("materialLib").value;
        if (typeof materialLib === "string") {
            const materialLibInfo = materialLib.split("_");
            if (materialLibInfo.length === 2) {
                materialLibNames.add(materialLibInfo[0]);
                materialLibRegions.add(materialLibInfo[1]);
                materialLibVersions.add("1");
            }
        }
        const materialCode = getCellString(row, "materialCode");
        if (isExist(materialCode)) {
            materialCodes.add(materialCode);
        }
    });
    try {
        const catalogsMap = await toImportCatalogs(Array.from(catalogs), task.owner, task.libId, transaction, "定额");
        let materialLibCodeToIdMap = new Map<string, number>();
        if (materialCodes.size && materialLibNames.size && materialLibRegions.size && materialLibVersions.size) {
            materialLibCodeToIdMap = await ListNormOps.getLibCodeToIdMap({
                type: "material",
                owner: task.owner,
                codes: Array.from(materialCodes),
                libNames: Array.from(materialLibNames),
                libRegions: Array.from(materialLibRegions),
                libVersions: Array.from(materialLibVersions),
            });
        }
        let lastData: string[] = [];
        const invalidData: string[][] = [];
        const codes = new Set<string>();//用来判断编码是否唯一的标识
        const normItemsToImport: any[] = [];
        const normCodeToItemsMap = new Map<string, any[]>();
        let lastRow: any;
        let allRightLastRow: boolean = true;
        items.eachRow((row, rowNumber) => {
            if (rowNumber < 3) return;
            const catalog = getCellString(row, "ctlg");
            const code = getCellString(row, "code");
            const name = getCellString(row, "name");
            const unit = getCellString(row, "unit");
            const loss = getCellString(row, "loss");
            const stuffMainSell = getCellString(row, "stuffMainSell");
            const stuffMainCost = getCellString(row, "stuffMainCost");
            const stuffAttachedSell = getCellString(row, "stuffAttachedSell");
            const stuffAttachedCost = getCellString(row, "stuffAttachedCost");
            const laborSell = getCellString(row, "laborSell");
            const laborCost = getCellString(row, "laborCost");
            const machineSell = getCellString(row, "machineSell");
            const machineCost = getCellString(row, "machineCost");
            const featureDesc = getCellString(row, "featureDesc");
            const jobs = getCellString(row, "jobs");
            const materialLib = getCellString(row, "materialLib");
            const materialCode = getCellString(row, "materialCode");
            const quantity = getCellString(row, "quantity");
            const materialLoss = getCellString(row, "materialLoss");
            const catalogId = catalogsMap.get(catalog);
            const libId = task.libId;
            const currentRow = {
                code, name, unit, loss, libId,
                featureDesc, jobs, catalogId,
                // laborSell, laborCost, stuffSell, stuffCost, machineSell, machineCost,
                price: {
                    sell: { stuffMain: stuffMainSell, stuffAttached: stuffAttachedSell, labor: laborSell, machine: machineSell },
                    cost: { stuffMain: stuffMainCost, stuffAttached: stuffAttachedCost, labor: laborCost, machine: machineCost },
                },
                owner: task.owner,
            };

            if (isExist(lastRow) && (currentRow.code !== lastRow.code)) {
                if (allRightLastRow) {
                    normItemsToImport.push(lastRow);
                } else {
                    if (normCodeToItemsMap.has(lastRow.code)) {
                        normCodeToItemsMap.delete(lastRow.code);
                    }
                }
                allRightLastRow = true;
            }
            const currentArr = [catalog, code, name, unit, loss, stuffMainSell, stuffMainCost, stuffAttachedSell, stuffAttachedCost, laborSell,
                laborCost, machineSell, machineCost, featureDesc, jobs, materialLib, materialCode, quantity, materialLoss,
            ];
            let currentNormOk = true;
            let currentMaterialOK = true;
            if (!isExist(catalogId) || !isExist(code) || !isExist(name) || !isExist(unit)) {
                currentNormOk = false;
                const errorRow = errorData(`第${rowNumber}行缺少必填的信息`, currentArr);
                invalidData.push(errorRow);
            }
            const currentStr = currentArr.filter((item, i) => i < 15);
            if (codes.has(code)) {
                if (lodash.difference(currentStr, lastData).length) {
                    const errorRow = errorData(`第${rowNumber}行编码重复`, currentArr);
                    invalidData.push(errorRow);
                }
            } else {
                codes.add(code);
            }
            lastData = [...currentStr];

            if (currentNormOk) {
                if (!isExist(materialLib) && !isExist(materialCode) && !isExist(quantity) && !isExist(materialLoss)) {
                    // 没有人材机组成
                } else if (!isExist(materialLib) || !isExist(materialCode) || !isExist(quantity)) {
                    currentMaterialOK = false;
                    const errorRow = errorData(`第${rowNumber}行所属人材机库相关的信息缺少`, currentArr);
                    invalidData.push(errorRow);
                } else {
                    const materialLibCode = `${materialLib}_1_${materialCode}`;
                    if (materialLibCodeToIdMap.size && materialLibCodeToIdMap.has(materialLibCode)) {
                        if (allRightLastRow) {
                            const materialId = materialLibCodeToIdMap.get(materialLibCode);
                            if (!normCodeToItemsMap.has(code)) {
                                normCodeToItemsMap.set(code, []);
                            }
                            const arr = normCodeToItemsMap.get(code);
                            arr!.push({ materialId: materialId, quantity: quantity, loss: materialLoss });
                        }
                    } else {
                        currentMaterialOK = false;
                        const errorRow = errorData(`第${rowNumber}行所属人材机库信息不存在`, currentArr);
                        invalidData.push(errorRow);
                    }
                }
            }
            lastRow = currentRow;
            if (allRightLastRow) {
                if (!currentNormOk || !currentMaterialOK) {
                    allRightLastRow = false;
                }
            }
        });

        // 处理最后一条清单项目数据
        if (allRightLastRow) {
            normItemsToImport.push(lastRow);
        } else {
            if (normCodeToItemsMap.has(lastRow.code)) {
                normCodeToItemsMap.delete(lastRow.code);
            }
        }
        if (invalidData.length > 0) {
            // 如果存在无效数据
            await errorHandler(invalidData, task);
            throw new Error("Handled invalid data error");
        }
        await NormItem.bulkCreate(normItemsToImport, { transaction });
        const norms = await NormItem.findAll({
            attributes: ["id", "code"],
            where: { code: Array.from(normCodeToItemsMap.keys()), owner: task.owner, catalogId: Array.from(catalogsMap.values()) },
            raw: true,
            transaction: transaction,
        });

        const toImportNormMaterialMap: any[] = [];
        for (const norm of norms) {
            const normId = norm.id!;
            const normCode = norm.code!;
            if (normCodeToItemsMap.has(normCode)) {
                const addedMaterialItems = normCodeToItemsMap.get(normCode);
                for (const amItem of addedMaterialItems!) {
                    amItem.normId = normId;
                    toImportNormMaterialMap.push(amItem);
                }
            }
        }
        await NormMaterialMap.bulkCreate(toImportNormMaterialMap, { transaction });
    } catch (ex) {
        if (ex.message !== "Handled invalid data error") {
            await errorHandler([["Internel error"]], task);
            throw new Error("Internel error");
        } else {
            throw ex;
        }
    }
};

const toImportMertialItems = async (filePath: string, task: any, transaction: Transaction) => {
    const workbook = new Excel.Workbook();

    await workbook.xlsx.readFile(filePath);
    const items = workbook.getWorksheet("项目");

    items.getColumn("A").key = "code";
    items.getColumn("B").key = "name";
    items.getColumn("C").key = "category";
    items.getColumn("D").key = "provider";
    items.getColumn("E").key = "ctlg";
    items.getColumn("F").key = "unit";
    items.getColumn("G").key = "loss";
    items.getColumn("H").key = "pattern";
    items.getColumn("I").key = "format";
    items.getColumn("J").key = "brand";
    items.getColumn("K").key = "series";
    items.getColumn("L").key = "sell";
    items.getColumn("M").key = "cost";
    items.getColumn("N").key = "comment";

    const catalogs = new Set<string>();

    items.eachRow((row, rowNumber) => {
        if (rowNumber < 3) return;
        const ctlg = getCellString(row, "ctlg");
        if (isExist(ctlg)) {
            catalogs.add(ctlg);
        }
    });

    try {
        const catalogsMap = await toImportCatalogs(Array.from(catalogs), task.owner, task.libId, transaction, "材料");
        const invalidData: string[][] = [];
        const materialItemsToImport: any[] = [];
        const codes = new Set<string>();//用来判断编码是否唯一的标识

        items.eachRow((row, rowNumber) => {
            if (rowNumber < 3) return;
            const code = getCellString(row, "code");
            const name = getCellString(row, "name");
            const category = getCellString(row, "category");
            let provider = getCellString(row, "provider");
            const catalog = getCellString(row, "ctlg");
            const unit = getCellString(row, "unit");
            const loss = getCellString(row, "loss");
            const pattern = getCellString(row, "pattern");
            const format = getCellString(row, "format");
            const brand = getCellString(row, "brand");
            const series = getCellString(row, "series");
            const sell = getCellString(row, "sell");
            const cost = getCellString(row, "cost");
            const comment = getCellString(row, "comment");

            const catalogId = catalogsMap.get(catalog);
            const currentArr = [code, name, category, provider,
                catalog, unit, loss, pattern, format, brand, series, sell, cost, comment,
            ];
            if (!isExist(catalogId) && isExist(catalog)) {
                const errorRow = errorData(`第${rowNumber}分类有问题`, currentArr);
                invalidData.push(errorRow);
                return;
            }
            if (!isExist(code) || !isExist(name) || !isExist(unit) || !isExist(category) || !isExist(sell)) {
                const errorRow = errorData(`第${rowNumber}行缺少必填的信息`, currentArr);
                invalidData.push(errorRow);
                return;
            }
            if (isExist(provider)) {
                if (provider !== "甲供" && provider !== "乙供") {
                    const errorRow = errorData(`第${rowNumber}行特征2选择错误`, currentArr);
                    invalidData.push(errorRow);
                    return;
                }
            } else {
                provider = "乙供";
            }
            if (codes.has(code)) {
                const errorRow = errorData(`第${rowNumber}行编码重复`, currentArr);
                invalidData.push(errorRow);
            } else {
                codes.add(code);
            }
            const currentRow = {
                code, name, category, provider, unit, loss,
                pattern, format, brand, series, comment, catalogId,
                price: { sell, cost },
                owner: task.owner, libId: task.libId,
            };
            materialItemsToImport.push(currentRow);
        });

        if (invalidData.length > 0) {
            // 如果存在无效数据
            await errorHandler(invalidData, task);
            throw new Error("Handled invalid data error");
        }
        await MaterialItem.bulkCreate(materialItemsToImport, { transaction });
    } catch (ex) {
        if (ex.message !== "Handled invalid data error") {
            await errorHandler([["Internel error"]], task);
            throw new Error("Internel error");
        } else {
            throw ex;
        }
    }
};
const toImportArtificialItems = async (filePath: string, task: any, transaction: Transaction) => {
    const workbook = new Excel.Workbook();

    await workbook.xlsx.readFile(filePath);
    const items = workbook.getWorksheet("项目");

    items.getColumn("A").key = "code";
    items.getColumn("B").key = "name";
    items.getColumn("C").key = "provider";
    items.getColumn("D").key = "ctlg";
    items.getColumn("E").key = "unit";
    items.getColumn("F").key = "sell";
    items.getColumn("G").key = "cost";
    items.getColumn("H").key = "comment";

    const catalogs = new Set<string>();

    items.eachRow((row, rowNumber) => {
        if (rowNumber < 3) return;
        const ctlg = getCellString(row, "ctlg");
        if (isExist(ctlg)) {
            catalogs.add(ctlg);
        }
    });

    try {
        const catalogsMap = await toImportCatalogs(Array.from(catalogs), task.owner, task.libId, transaction, "人工");
        const invalidData: string[][] = [];
        const materialItemsToImport: any[] = [];
        const codes = new Set<string>();//
        items.eachRow((row, rowNumber) => {
            if (rowNumber < 3) return;
            const code = getCellString(row, "code");
            const name = getCellString(row, "name");
            let provider = getCellString(row, "provider");
            const catalog = getCellString(row, "ctlg");
            const unit = getCellString(row, "unit");
            const sell = getCellString(row, "sell");
            const cost = getCellString(row, "cost");
            const comment = getCellString(row, "comment");

            const catalogId = catalogsMap.get(catalog);
            const currentArr = [code, name, provider,
                catalog, unit, sell, cost, comment,
            ];
            if (!isExist(catalogId) && isExist(catalog)) {
                const errorRow = errorData(`第${rowNumber}分类有问题`, currentArr);
                invalidData.push(errorRow);
                return;
            }
            if (!isExist(code) || !isExist(name) || !isExist(unit) || !isExist(sell)) {
                const errorRow = errorData(`第${rowNumber}行缺少必填的信息`, currentArr);
                invalidData.push(errorRow);
            }
            if (isExist(provider)) {
                if (provider !== "甲供" && provider !== "乙供") {
                    const errorRow = errorData(`第${rowNumber}行特征2选择错误`, currentArr);
                    invalidData.push(errorRow);
                    return;
                }
            } else {
                provider = "乙供";
            }
            if (codes.has(code)) {
                const errorRow = [`第${rowNumber}行编码重复`];
                invalidData.push(errorRow);
            } else {
                codes.add(code);
            }
            const currentRow = {
                code, name, provider, unit, comment, catalogId, price: { sell, cost },
                owner: task.owner, libId: task.libId, category: "人工",
            };
            materialItemsToImport.push(currentRow);
        });

        if (invalidData.length > 0) {
            // 如果存在无效数据
            await errorHandler(invalidData, task);
            throw new Error("Handled invalid data error");
        }
        await MaterialItem.bulkCreate(materialItemsToImport, { transaction });
    } catch (ex) {
        if (ex.message !== "Handled invalid data error") {
            await errorHandler([["Internel error"]], task);
            throw new Error("Internel error");
        } else {
            throw ex;
        }
    }
};
const toImportMechanicalItems = async (filePath: string, task: any, transaction: Transaction) => {
    const workbook = new Excel.Workbook();

    await workbook.xlsx.readFile(filePath);
    const items = workbook.getWorksheet("项目");

    items.getColumn("A").key = "code";
    items.getColumn("B").key = "name";
    items.getColumn("C").key = "provider";
    items.getColumn("D").key = "ctlg";
    items.getColumn("E").key = "unit";
    items.getColumn("F").key = "pattern";
    items.getColumn("G").key = "format";
    items.getColumn("H").key = "sell";
    items.getColumn("I").key = "cost";
    items.getColumn("J").key = "comment";

    const catalogs = new Set<string>();

    items.eachRow((row, rowNumber) => {
        if (rowNumber < 3) return;
        const ctlg = getCellString(row, "ctlg");
        if (isExist(ctlg)) {
            catalogs.add(ctlg);
        }
    });

    try {
        const catalogsMap = await toImportCatalogs(Array.from(catalogs), task.owner, task.libId, transaction, "机械");
        const invalidData: string[][] = [];
        const materialItemsToImport: any[] = [];
        const codes = new Set<string>();//
        items.eachRow((row, rowNumber) => {
            if (rowNumber < 3) return;

            const code = getCellString(row, "code");
            const name = getCellString(row, "name");
            let provider = getCellString(row, "provider");
            const catalog = getCellString(row, "ctlg");
            const unit = getCellString(row, "unit");
            const pattern = getCellString(row, "pattern");
            const format = getCellString(row, "format");
            const sell = getCellString(row, "sell");
            const cost = getCellString(row, "cost");
            const comment = getCellString(row, "comment");

            const catalogId = catalogsMap.get(catalog);
            const currentArr = [code, name, provider,
                catalog, unit, pattern, format, sell, cost, comment,
            ];
            if (!isExist(catalogId) && isExist(catalog)) {
                const errorRow = errorData(`第${rowNumber}分类有问题`, currentArr);
                invalidData.push(errorRow);
                return;
            }
            if (!isExist(code) || !isExist(name) || !isExist(unit) || !isExist(sell)) {
                const errorRow = errorData(`第${rowNumber}行缺少必填的信息`, currentArr);
                invalidData.push(errorRow);
                return;
            }
            if (isExist(provider)) {
                if (provider !== "甲供" && provider !== "乙供") {
                    const errorRow = errorData(`第${rowNumber}行特征2选择错误`, currentArr);
                    invalidData.push(errorRow);
                    return;
                }
            } else {
                provider = "乙供";
            }
            if (codes.has(code)) {
                const errorRow = errorData(`第${rowNumber}行编码重复`, currentArr);
                invalidData.push(errorRow);
            } else {
                codes.add(code);
            }
            const currentRow = {
                code, name, provider, unit, comment, catalogId, pattern, format, price: { sell, cost },
                owner: task.owner, libId: task.libId, category: "机械",
            };
            materialItemsToImport.push(currentRow);
        });

        if (invalidData.length > 0) {
            // 如果存在无效数据
            await errorHandler(invalidData, task);
            throw new Error("Handled invalid data error");
        }
        await MaterialItem.bulkCreate(materialItemsToImport, { transaction });
    } catch (ex) {
        if (ex.message !== "Handled invalid data error") {
            await errorHandler([["Internel error"]], task);
            throw new Error("Internel error");
        } else {
            throw ex;
        }
    }
};


export const imporItems = async (taskId: number) => {
    const transaction = await Models.transaction();
    let task = <{ status: string; fileUri: string; name: string; fileType: string, libId: number }>{};
    let fileToImport = "";
    try {
        // 锁定任务
        const tasks = await Models.query(
            `select * from ${ImportTask.tableName} where id=:id for update nowait`,
            {
                replacements: { id: taskId },
                type: (<any>Models).QueryTypes.SELECT,
                transaction: transaction,
            }
        );
        if (tasks.length !== 1) {
            throw new Error("Can not find the task");
        }
        task = tasks[0];
        if (task.status !== "waiting") {
            const errorMsg = `The '${task.name}' task's status is ${task.status}`;
            await errorHandler([[errorMsg]], task);
            throw new Error(errorMsg);
        }
        fileToImport = Path.join(__dirname, "../../excels", task.fileUri.replace(/\//g, "_"));
        await ossDownload(task.fileUri, fileToImport);
        if (task.fileType === "list") {
            await toImportListItems(fileToImport, task, transaction);
        } else if (task.fileType === "norm") {
            await toImportNormItems(fileToImport, task, transaction);
        } else if (task.fileType === "material") {
            await toImportMertialItems(fileToImport, task, transaction);
        } else if (task.fileType === "artificial") {
            await toImportArtificialItems(fileToImport, task, transaction);
        } else if (task.fileType === "mechanical") {
            await toImportMechanicalItems(fileToImport, task, transaction);
        } else {
            const errorMsg = `The '${task.name}' task's filename is error`;
            await errorHandler([[errorMsg]], task);
            throw new Error(errorMsg);
        }

        // commit
        await simpleDelFile(fileToImport);
        await ImportTask.updateImportTask({ status: "succeed" }, { id: taskId }, transaction);
        await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        await simpleDelFile(fileToImport);
        await transaction.rollback();
        if (task !== undefined) {
            let errorMsg = ex.message;
            if (errorMsg !== "Not Found") {
                errorMsg = `error/${task.fileUri}`;
            }
            await ImportTask.updateImportTask({ status: "failed", errorMsg: errorMsg }, { id: taskId });
        }
        throw ex;
    }
};
const getCellString = (row: Excel.Row, key: string) => {
    let value = row.getCell(key).value;
    if (value !== null && typeof value !== "string") {
        try {
            value = row.getCell(key).text;
        } catch (error) {
            value = "";
        }
    }
    return <string>value;
};
const errorData = (errorInfo: string, arr: string[]) => {
    const errorRow = [errorInfo];
    for (const iterator of arr) {
        errorRow.push(iterator);
    }
    return errorRow;
};

