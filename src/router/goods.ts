// import * as Router from "koa-router";
// import * as bodyParser from "koa-bodyparser";
// import { Goods } from "../controller";

// const router = new Router();

// router
//     .use(bodyParser({
//         extendTypes: {
//             json: ["application/json"],
//         },
//         jsonLimit: "100kb",
//     }))
//     // 商品相关
//     .get("getGoods", "/goods", Goods.getGoods)
//     .put("putGoodsAttribute", "/goods/attribute", Goods.putGoodsAttribute)
//     .post("addGoods", "/goods", Goods.addGoods)
//     // 构件分组相关
//     .post("deleteGoodsGroup", "/goods/group/delete", Goods.deleteGoodsGroup)
//     .post("moveGoodsGroup", "/goods/group/move", Goods.moveGoodsGroup)
//     .post("renameGoodsGroup", "/goods/group/rename", Goods.renameGoodsGroup)
//     .get("getBindedClasses", "/goods/group/classes", Goods.getBindedClasses)
//     .post("deleteBindedClasses", "/goods/group/classes/delete", Goods.deleteBindedClasses)
//     .post("updateBindedClasses", "/goods/group/classes", Goods.updateBindedClasses)
//     .get("getGoodsGroupTree", "/goods/group/tree", Goods.getGoodsGroupTree)
//     .post("addGoodsGroup", "/goods/group", Goods.addGoodsGroup)
//     .get("getGoodsGroup", "/goods/group", Goods.getGoodsGroup);

// export default router;
