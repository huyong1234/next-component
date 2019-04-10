import * as Router from "koa-router";
import * as compose from "koa-compose";

import Attribute from "./attribute";
import ClientClass from "./clientClass";
import Version from "./version";

// import Goods from "./goods";
import Component from "./component";
import Tag from "./tag";
// import Rule from "./rule";
import ListNorm from "./listNorm";
import CilentDock from "./clientDock";
import MaxModel from "./maxModel";

const routers = new Router().use(
    Attribute.routes(),
    ClientClass.routes(),
    Version.routes(),
    // Goods.routes(),
    Component.routes(),
    Tag.routes(),
    CilentDock.routes(),
    ListNorm.routes(),
    MaxModel.routes()
);
export default compose([routers.routes(), routers.allowedMethods()]);
export {
    Attribute, ClientClass, Version, Component, routers, Tag,
    ListNorm, MaxModel,CilentDock
};
