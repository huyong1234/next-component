import { Middleware } from "@nestsoft/koa-extended";
import { getUrl } from "@nestsoft/oss";
import * as Joi from "joi";
import validate from "../utils/validate";
import { Op } from "sequelize";
import Config from "../config";
import {
    MaxModel, IMaxModelQuery, ComponentGroup
} from "../model";

const getResultModel = (models: MaxModel[]) => {
    const list = models.map((model) => {
        return new Promise(async (ok, fail) => {
            try {
                const newPreview: string[] = [];
                if (Array.isArray(model.preview) && model.preview.length > 0) {
                    for (const img of model.preview) {
                        const newImg = await getUrl(Config.get("resultOSS"), img);
                        newPreview.push(newImg);
                    }
                }
                const result = {
                    id: model.id,
                    name: model.name,
                    status: model.status,
                    type: model.type,
                    preview: newPreview,
                };
                ok(result);
            } catch (e) {
                fail(e);
            }
        });
    });
    return Promise.all(list);
};
const getTags = (tags: ComponentGroup[], defaultTags: number[], result: number[] = defaultTags): number[] => {
    const selectedTags: number[] = <number[]>tags.reduce(
        (arr, currentValue) => {
            const isTrue = defaultTags.some(item => item === currentValue.parentId);
            if (isTrue) {
                return [...arr, currentValue.id!];
            }
            return arr;
        },
        <string[]>[]);
    const _result = result.concat(selectedTags);
    if (selectedTags.length === 0) {
        return _result;
    }
    return getTags(tags, selectedTags, _result);
};
const selectlistSchema = {
    name: Joi.string().allow("").description("模型名称"),
    tag: Joi.string().regex(/\d/).allow("").description("tagid"),
    owner: Joi.string().valid(["0", "1"]).description("所属ID"),
    pagesize: Joi.string().regex(/\d/).allow("").description("每页个数"),
    page: Joi.string().regex(/\d/).allow("").description("第几页"),
    id: Joi.string().guid().allow("").description("默认模型id"),
};
export const getSelectList: Middleware = async (ctx, next) => {
    const err = validate(ctx.query, selectlistSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    const { name, tag, owner, pagesize, page, id } = <{ name: string; tag: string; owner: string; pagesize: string; page: string; id: string }>ctx.query;
    const pageIndex = page ? parseInt(page, 10) : 1;
    const pageSize = pagesize ? parseInt(pagesize, 10) : 60;
    const opt: IMaxModelQuery = {
        where: {
            type: "render",
            status: "modelActive",
        },
    };
    if (name) {
        opt.where!.name = {
            $ilike: "%" + name.trim() + "%",
        };
    }
    if (!owner || parseInt(owner, 10) === 0) {
        opt.where!.owner = -2;//公共库
    } else {
        throw new Error("todo:owner");
        //todo:企业库
        // opt.where!.owner = -1000;
        // opt.where!.owner = ctx.session.epid;
    }
    //todo: tags
    let selectedTags: number[];
    if (tag) {
        const tags = await ComponentGroup.findAll();
        selectedTags = getTags(tags, [parseInt(tag, 10)]);
        opt.include = [{
            model: ComponentGroup,
            attributes: ["id", "name", "createdAt"],
            as: "tags",
            where: {
                id: {
                    [Op.in]: selectedTags,
                },
            },
        }];
    }
    //
    let defaultModel: MaxModel | null = null;
    let defaultId: string | undefined;
    //存在默认id，并且id有效时，应在第一页列表第一行显示该数据；
    if (id) {
        defaultModel = await MaxModel.get({ where: { ...opt.where!, id } });
    }

    const count = await MaxModel.count({ where: opt.where, include: opt.include });

    if (defaultModel) {
        opt.where!.id = { [Op.ne]: defaultModel.id! };
        defaultId = defaultModel.id!;
        //当存在默认数据的情况下并且pageIndex!=1，offset往前查一位
        opt.offset = pageIndex !== 1 ? (pageIndex - 1) * pageSize - 1 : (pageIndex - 1) * pageSize;
        //当存在默认数据的情况下并且pageIndex==1，pageSize少查一位
        opt.limit = pageIndex === 1 ? pageSize - 1 : pageSize;
    }
    const models = await MaxModel.getSelectList(opt);
    if (defaultModel) {
        models.unshift(defaultModel);
    }
    const list = await getResultModel(models);
    return ctx.body = {
        code: 0,
        data: {
            count,
            defaultId,
            list,
        },
    };
};
