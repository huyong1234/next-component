import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import { Component } from "../controller";

const router = new Router();

router
    .use(bodyParser({
        extendTypes: {
            json: ["application/json"],
        },
        jsonLimit: "100kb",
    }))
    // 构件相关
    .get("uploadPreview", "/component/preview", Component.uploadPreview)
    .get("getApprover", "/component/approver", Component.getApprover)
    .put("deprecateComponent", "/component/deprecate", Component.deprecateComponent)
    .put("approveComponent", "/component/approve", Component.approveComponent)
    .post("publishComponent", "/component/publishing", Component.publishComponent)
    .get("countComponentInGroup", "/component/group/count", Component.countComponentInGroup)
    .get("getComponent", "/component", Component.getComponent)
    .put("putComponentAttribute", "/component/attribute", Component.putComponentAttribute)
    .post("addComponent", "/component", Component.addComponent)
    // 构件分组相关
    .delete("deleteComponentGroup", "/component/group", Component.deleteComponentGroup)
    // updateBindedClasses 与 updateComponentGroup 不合并，因为updateBindedClasses要绑定最新版本的class
    // rename or move
    .put("updateComponentGroup", "/component/group", Component.updateComponentGroup)
    .get("getBindedClasses", "/component/group/classes", Component.getBindedClasses)
    .delete("deleteBindedClasses", "/component/group/classes", Component.deleteBindedClasses)
    .put("updateBindedClasses", "/component/group/classes", Component.updateBindedClasses)
    .get("getComponentGroupTree", "/component/group/tree", Component.getComponentGroupTree)
    .post("addComponentGroup", "/component/group", Component.addComponentGroup)
    .get("getComponentGroup", "/component/group", Component.getComponentGroup);

export default router;
