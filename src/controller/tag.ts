import { Middleware } from "@nestsoft/koa-extended";

import { TagOps } from "../repo";

export const getTagHistory: Middleware = async (ctx, next?) => {
    const currentOwner = ctx.session.company.companyId;
    const usedTags = await TagOps.getTagHistory(currentOwner);
    ctx.body = { code: 0, data: usedTags, msg: "ok" };
};
