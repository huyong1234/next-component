import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import { Tag } from "../controller";

const router = new Router();

router
    .use(bodyParser({
        extendTypes: {
            json: ["application/json"],
        },
        jsonLimit: "100kb",
    }))
    .get("getTagHistory", "/tag/history", Tag.getTagHistory);

export default router;
