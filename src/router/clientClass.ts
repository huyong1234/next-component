import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import { ClientClass } from "../controller";

const router = new Router();

router
    .use(bodyParser({
        extendTypes: {
            json: ["application/json"],
        },
        jsonLimit: "100kb",
    }))
    .get("getClassAttributes", "/class/attributes", ClientClass.getClassAttributes)
    .get("getClassTree", "/class/tree", ClientClass.getClassTree)
    .post("addClientClass", "/class", ClientClass.addClientClass)
    .post("addClassGroup", "/class/group", ClientClass.addClassGroup);

export default router;
