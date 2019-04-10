import * as NormCalc from "@nestsoft/norm-calculator";
import * as path from "path";
import { ClientTask } from "../model";
import {
    ossDownload, ossUpload,
    getCompNormDatas, simpleDelFile,
    getRoomNormDatas
} from "./index";

export const handException = async (err: Error, taskId: number) => {
    // tslint:disable-next-line:no-console
    console.log(">>>>>>>>> ERROR:", err);
    try {
        await ClientTask.updateClientTask({ status: "failed", errorMsg: err.message }, { id: taskId });
    } catch (error) {
        // tslint:disable-next-line:no-console
        console.log(error);
    }
};

export async function doNormCalculate(taskId: number) {
    let calcConn;
    let ysbjConn;
    let dbToCalculate;
    let dbToProduce;
    try {
        const tasks = await ClientTask.findClientTaskById(taskId);
        if (tasks.length < 1) {
            throw new Error(`Can not find the task: ${taskId}`);
        }
        const task = tasks[0];
        if (task!.status !== "processing") {
            throw new Error(`The task: ${taskId} status is ${task!.status}`);
        }
        let normCalcType: number = 0;
        if (task.params !== undefined && task.params.normCalcType !== undefined) {
            normCalcType = task.params.normCalcType;
        }

        dbToCalculate = path.join(__dirname, "../../db/", task!.fileUrl!.replace(/\//g, "_"));
        await ossDownload(task.fileUrl!, dbToCalculate);
        calcConn = NormCalc.createConnection(dbToCalculate);
        const compQuantities = await NormCalc.getCompQuantities(calcConn);

        // 获取清单定额结果: @params: task, compQuantities
        // const compNormDatas = await getCompNormDatas(task, compQuantities);
        const { compNormDatas, softMatDatas } = await getCompNormDatas(task, compQuantities);

        // 处理“套内面积”
        const totalArea = await NormCalc.getTotalArea(calcConn);
        // 套内面积定额数据
        const roomNormDatas = await getRoomNormDatas(task);
        const roomData = { totalArea, roomNormDatas };

        // 复制空DB 并连接
        const resultUrl = `db/${task.owner}/${new Date().getTime()}/lb_ysbj.d`;
        dbToProduce = path.join(__dirname, "../../db/", resultUrl.replace(/\//g, "_"));
        await NormCalc.copyDb(dbToProduce);
        ysbjConn = NormCalc.createConnection(dbToProduce);

        // 插入数据库: @params: ysbjConn, {}[]
        await NormCalc.insertData(normCalcType, ysbjConn, compNormDatas, softMatDatas, roomData);

        await doAfterSuccess(taskId, resultUrl, dbToProduce);
        await doCleanJobs(calcConn, ysbjConn, dbToCalculate, dbToProduce);
    } catch (error) {
        await handException(error, taskId);
        await doCleanJobs(calcConn, ysbjConn, dbToCalculate, dbToProduce);
    }
}

async function doAfterSuccess(taskId: number, resultUrl: string, dbToProduce: string) {
    //上传dbToProduce到oss
    await ossUpload(resultUrl, dbToProduce);

    // 更新数据库
    await ClientTask.updateClientTask({ status: "succeed", resultUrl: resultUrl }, { id: taskId });
}

async function doCleanJobs(calcConn: any, ysbjConn: any, dbToCalculate: string | undefined, dbToProduce: string | undefined) {
    //关闭连接
    if (calcConn !== undefined) {
        await NormCalc.destroyConnection(calcConn);
    }
    if (ysbjConn !== undefined) {
        await NormCalc.destroyConnection(ysbjConn);
    }
    //删除本地文件
    if (dbToCalculate !== undefined) {
        await simpleDelFile(dbToCalculate);
    }
    if (dbToProduce !== undefined) {
        await simpleDelFile(dbToProduce);
    }
}

