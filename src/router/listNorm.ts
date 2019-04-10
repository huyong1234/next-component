import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import { ListNorm } from "../controller";
import { checkUser } from "../middleware";
import { checkPermission } from "../middleware/checkPermission";

const router = new Router();

router
    .use(bodyParser({
        extendTypes: {
            json: ["application/json"],
        },
        jsonLimit: "100kb",
    }))
    .use(checkUser)
    .use(checkPermission)
    .get("uploadTemplate", "/list/norm/template/upload", ListNorm.uploadTemplate)
    .get("downloadTemplate", "/list/norm/template/download", ListNorm.downloadTemplate)
    .get("getListNormMap", "/list/norm/map", ListNorm.getAddedNorm)
    .get("getNormMaterialMap", "/list/norm/material/map", ListNorm.getAddedMaterial)
    .post("addMaterialItem", "/material/item", ListNorm.addMaterialItem)
    .put("updateMaterialItem", "/material/item", ListNorm.updateMaterialItem)
    .delete("deleteMaterialItem", "/material/item", ListNorm.deleteMaterialItem)
    .post("addNormItem", "/norm/item", ListNorm.addNormItem)
    .delete("deleteNormItem", "/norm/item", ListNorm.deleteNormItem)
    .put("updateNormItem", "/norm/item", ListNorm.updateNormItem)
    .post("addListItem", "/list/item", ListNorm.addListItem)
    .delete("deleteListItem", "/list/item", ListNorm.deleteListItem)
    .put("updateListItem", "/list/item", ListNorm.updateListItem)
    .post("copyCalculateRule", "/list/norm/calculate/rule/copy", ListNorm.copyCalculateRule)
    .delete("deleteCalculateRule", "/list/norm/calculate/rule", ListNorm.deleteCalculateRule)
    .put("updateCalculateRule", "/list/norm/calculate/rule", ListNorm.updateCalculateRule)
    .post("addCalculateRule", "/list/norm/calculate/rule", ListNorm.addCalculateRule)
    .get("getCalculateRule", "/list/norm/calculate/rule", ListNorm.getCalculateRule)
    .post("copyMatchRule", "/list/norm/match/rule/copy", ListNorm.copyMatchRule)
    .delete("deleteMatchRule", "/list/norm/match/rule", ListNorm.deleteMatchRule)
    .put("updateMatchRule", "/list/norm/match/rule", ListNorm.updateMatchRule)
    .post("addMatchRule", "/list/norm/match/rule", ListNorm.addMatchRule)
    .get("getMatchRule", "/list/norm/match/rule", ListNorm.getMatchRule)
    // 查找计算项目
    .get("getCalcItem", "/list/norm/match/item", ListNorm.getCalcItem)
    .get("getCalcIfno", "/list/norm/calculate", ListNorm.getCalcInfo)
    .get("getItems", "/list/norm/item", ListNorm.getItems)
    .delete("deleteCalalog", "/list/norm/library/catalog", ListNorm.deleteCalalog)
    .put("updateCatalog", "/list/norm/library/catalog", ListNorm.updateCatalog)
    .post("postCatalog", "/list/norm/library/catalog", ListNorm.addCatalog)
    .get("getCatalog", "/list/norm/library/catalog", ListNorm.getCatalog)
    .post("upgradeLibrary", "/list/norm/library/upgrade", ListNorm.upgradeLibrary)
    .put("updateLibrary", "/list/norm/library", ListNorm.updateLibrary)
    .delete("deleteLibrary", "/list/norm/library", ListNorm.deleteLibrary)
    .delete("deleteMatchLibrary", "/list/norm/match/library", ListNorm.deleteMatchLibrary)
    .post("postLibrary", "/list/norm/library", ListNorm.addLibrary)
    .get("getLibRegion", "/list/norm/library/region", ListNorm.getLibRegion)
    .get("getSeriesLibrary", "/list/norm/library/series", ListNorm.getSeriesLibrary)
    .get("getLibrary", "/list/norm/library", ListNorm.getLibrary)
    // 根据清单库id获取定额库id
    .get("getNormLibrary", "/list/norm/normlibrary", ListNorm.getNormList)
    // 根据定额库id查询人材机库id
    .get("getMaterailLibrary", "/list/norm/materiallibrary", ListNorm.getMaterailList)
    // 根据清单或者定额库id获取匹配规则库
    .get("getMatchLibraryById", "/list/norm/matchlibrary", ListNorm.getMatchByRelationId)
    .get("getMatchLibrary", "/list/norm/match/library", ListNorm.getMatchLibrary)
    .get("uploadPreview", "/list/norm/preview/upload", ListNorm.uploadPreview)
    .put("updateImportTask", "/list/norm/task", ListNorm.updateImportTask)
    .delete("deleteImportTask", "/list/norm/task/:taskId", ListNorm.deleteImportTask)
    .get("getImportTasks", "/list/norm/task", ListNorm.getImportTasks)
    .get("getImportTaskMsg", "/list/norm/task/message", ListNorm.getImportTaskMsg)
    .get("doImportTask", "/list/norm/task/import", ListNorm.doImportTask);

export default router;
