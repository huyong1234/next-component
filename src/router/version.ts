import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import { Version } from "../controller";

const router = new Router();

router
    .use(bodyParser({
        extendTypes: {
            json: ["application/json"],
        },
        jsonLimit: "100kb",
    }))
    .get("getVersion", "/version", Version.getVersion)
    .post("addVersion", "/version", Version.addVersion);


export default router;
