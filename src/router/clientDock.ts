import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import { clientDock } from "../controller";
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
    .get("getUrlAndId", "/list/norm/oss", clientDock.getUrlAndId)
    .post("postTaskParams", "/list/norm/calculate", clientDock.calculate)
    .get("getClientTask", "/list/norm/clientTask", clientDock.getClientTask);

export default router;
