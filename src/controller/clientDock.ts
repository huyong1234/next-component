import { Middleware } from "@nestsoft/koa-extended";
import * as Joi from "joi";
import validate from "../utils/validate";
import { getOssUploadConfig, doNormCalculate } from "../utils";
import { ClientTask, IUpdateClientTask, Models } from "../model";
import { ossDownloadUrl } from "../utils/oss";


const addClientTaskSchema = {
    fileName: Joi.string().required(),
};
// 获取上传oss url 接口
export const getUrlAndId: Middleware = async (ctx, next?) => {
    const query = <{ fileName: string }>ctx.request.query;
    const name = query.fileName;
    const err = validate(query, addClientTaskSchema);
    if (err) {
        ctx.body = err;
        return;
    }
    // 获取用户id
    const owner = ctx.session.company.companyId;
    // const owner = -2;
    const type = "db";
    try {
        // 获取oss上传相关参数
        const item = await getOssUploadConfig(type, owner, name);
        const oss = item.oss;
        // 新建task任务,并后去taskId
        const taskId = await ClientTask.addClientTask({ owner: owner, fileUrl: item.key, status: "creating" });
        ctx.body = { code: 0, data: { taskId, oss }, msg: "OK" };
    } catch (error) {
        ctx.body = error;
    }

};

const updateClientTask = {
    calculateType: Joi.any().valid(["list", "norm"]).required(),
    listId: Joi.number(),
    normId: Joi.number().required(),
    materialId: Joi.number(),
    matchId: Joi.number().required(),
    normCalcType: Joi.any().valid([0, 1]), // rx: 1, bz: 0
};

// 客户端对接页，表单提交接口
export const calculate: Middleware = async (ctx, next?) => {
    // 获取表单提交数据
    const body = <IUpdateClientTask>ctx.request.body;
    const err = validate(body, updateClientTask);
    if (err) {
        ctx.body = err;
        return;
    }

    body.status = "processing";
    body.normCalcType = body.normCalcType === 1 ? 1 : 0;
    // 获取taskId
    const taskId = ctx.query.taskId;
    const owner = ctx.session.company.companyId;
    // const owner = -2;
    const transaction = await Models.transaction();
    try {

        const tasks = await ClientTask.clientTaskById(taskId, owner, transaction);
        if (tasks.length > 0) {
            const task = tasks[0];
            if (task.status === "creating") {
                await ClientTask.updateClientTask(body, { id: taskId }, transaction);
                await transaction.commit();
                // 调用计算函数，进行结果计算
                doNormCalculate(taskId);
                ctx.body = { code: 0, msg: "OK " };
            } else {
                throw new Error(`[status error]: the task: ${taskId} status is ${task.status}`);
            }
        } else {
            throw new Error("task is not exit");
        }
    } catch (error) {
        await transaction.rollback();
        ctx.throw(error);
    }
};

// 获取任务信息接口
export const getClientTask: Middleware = async (ctx, next?) => {
    const taskId = ctx.query.taskId;
    const owner = ctx.session.company.companyId;
    // const owner = 793;
    try {
        const clientTask = await ClientTask.findClientTaskById(taskId, owner, true);
        if (clientTask.length === 1) {
            let downloadUrl;
            if (clientTask[0].status === "succeed") {
                downloadUrl = await ossDownloadUrl(clientTask[0].resultUrl!);
            }
            ctx.body = { code: 0, data: { ...clientTask[0], downloadUrl }, msg: "OK" };
        } else {
            ctx.body = { code: 1, msg: `error taskId ${taskId}` };
        }
    } catch (error) {
        ctx.body = error;
    }

};
