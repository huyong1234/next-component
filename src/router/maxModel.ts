import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import { MaxModel } from "../controller";

const router = new Router();

router
    .use(bodyParser({
        extendTypes: {
            json: ["application/json"],
        },
        jsonLimit: "100kb",
    }))
    .prefix("/maxmodel")
    .get("/select", MaxModel.getSelectList);

export default router;
