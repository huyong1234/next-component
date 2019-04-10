import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import { Attribute } from "../controller";

const router = new Router();

router
    .use(bodyParser({
        extendTypes: {
            json: ["application/json"],
        },
        jsonLimit: "100kb",
    }))
    .get("getAttributeType", "/attribute/type", Attribute.listAttributeType)
    .get("getAttributeGroup", "/attribute/group", Attribute.listAttributeGroup)
    .post("addAttribute", "/attribute", Attribute.addAttribute)
    .get("getAttribute", "/attribute", Attribute.getAttribute);

export default router;
