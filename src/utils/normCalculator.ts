
import { run } from "@nestsoft/rule-engine";
import * as NormCalc from "@nestsoft/norm-calculator";
import { ClientTask } from "../model";
import {
    getLastestVersion,
    getCompMap, getNormInfo, getMatchRuleWithItems,
    IMatchRuleItem, IListInfo, getListInfo, getMaterialInfo
} from "../repo";

export async function getRoomNormDatas(task: ClientTask) {

    const { params, owner } = task;
    const { matchId, normId, materialId } = params!;

    const theLastestVersion: number = await getLastestVersion();
    const compTypeClassIdMap = await getCompMap(theLastestVersion, "套内面积");
    if (compTypeClassIdMap.size !== 1) {
        throw new Error("'套内面积'类型错误");
    }
    const roomClassVersionId = Array.from(compTypeClassIdMap.values())[0];
    const roomMatchWithItems = await getMatchRuleWithItems(matchId, owner!, roomClassVersionId);
    if (roomMatchWithItems.length <= 0) {
        return null;
    }
    const itemIds = new Set<number>();
    for (const item of roomMatchWithItems[0].items) {
        itemIds.add(item.itemId);
    }
    if (itemIds.size <= 0) {
        return null;
    }
    const normMaterialMap = await getNormInfo(Array.from(itemIds), normId, materialId, owner!);
    return Array.from(normMaterialMap.values());
}

export async function getCompNormDatas(task: ClientTask, compQuantities: NormCalc.ICompResultData[]) {
    const theLastestVersion: number = await getLastestVersion();
    // const compFeaturesMap = await getCompFeaturesMap(compQuantities, theLastestVersion);
    // 获取构建id和feature，构建id和材料编号 的对应关系
    const { compFeaturesMap, compMatNumberMap } = await getCompFeaturesMap(compQuantities);
    // 构建id和套匹配规则获取的项目的对应关系
    const compMatchRuleMap = await getMatchedRuleWithItems(task, compFeaturesMap, theLastestVersion);
    // 获取主材、辅材、家电、软装的量
    const { compResultsMap, compSoftMatMap } = getCompResultsMap(compQuantities, compMatchRuleMap, compMatNumberMap);

    const { params, owner } = task;
    const { calculateType, listId, normId, materialId } = params!;

    let compNormResultsMap = compResultsMap;
    if (calculateType === "list" && listId !== undefined) {
        const listIds = getItemIds(compResultsMap);
        const listNormMap = await getListInfo(listIds, listId, normId, owner!);
        compNormResultsMap = transList2Norm(compResultsMap, listNormMap);
    }
    // 获取匹配规则套出的清单定额id
    const normIds = getItemIds(compNormResultsMap);
    // 定额对应的人材机关系
    const normMaterialMap = await getNormInfo(normIds, normId, materialId, owner!);
    // 获取材料编码数组
    const matNumbers = Array.from(compMatNumberMap.values());
    // 获取人材机相关信息
    const materialInfoMap = await getMaterialInfo(matNumbers, materialId, owner!);

    const compNormDatas = { compNormResultsMap, normMaterialMap };//定额的价格map, 定额对应的人材机
    const softMatDatas = { compSoftMatMap, materialInfoMap }; //家电软装的map , 人材机map

    // return { compNormResultsMap, normMaterialMap };
    return { compNormDatas, softMatDatas };
}



function getItemIds(compResultsMap: Map<string, NormCalc.ICompResult[][]>) {
    const itemIds = new Set<number>();
    for (const compResultsArr of compResultsMap) {
        const compResults = compResultsArr[1];
        if (compResults === undefined || compResults.length === 0) {
            continue;
        }

        for (const rets of compResults) {
            for (const ret of rets) {
                itemIds.add(ret.itemId);
            }
        }
    }
    return Array.from(itemIds);
}

const isDigital = (str: string) => {
    const re = /^(-?\d+)(\.\d+)?$/;
    return re.test(str);
};

async function getCompFeaturesMap(compQuantities: NormCalc.ICompResultData[]) {
    // 构建id和特征的对应关系
    const compFeaturesMap = new Map<string, { [key: string]: string | number }[]>();
    // 构建id和材料编码的对应关系
    const compMatNumberMap = new Map<string, string>();
    for (const iterator of compQuantities) {
        const { compType, strCompGUID, vecCalcItemResult } = iterator;
        let compTypeId: number | null;
        try {
            compTypeId = parseInt(compType, 10);
        } catch (error) {
            compTypeId = null;
        }

        for (const calcItemResult of vecCalcItemResult) {
            const { vecCompFeatures } = calcItemResult;
            if (compTypeId !== null && vecCompFeatures !== undefined && vecCompFeatures.length > 0) {
                const features: { [key: string]: string | number } = {};

                for (const featureObj of vecCompFeatures) {
                    if (isDigital(featureObj.strValue!)) {
                        features[featureObj.strKey] = parseFloat(featureObj.strValue!);
                    } else {
                        features[featureObj.strKey] = featureObj.strValue!;
                    }
                }
                features.compType = compTypeId;
                // 如果feature中含有材料编号，则在compMatNumberMap中添加对应关系
                if (features.MatNumber !== undefined && !compMatNumberMap.has(strCompGUID)) {
                    compMatNumberMap.set(strCompGUID, `${features.MatNumber}`);
                }
                // 设置构建id和feature的关系
                if (compFeaturesMap.has(strCompGUID)) {
                    const featureArr = compFeaturesMap.get(strCompGUID);
                    featureArr!.push(features);
                } else {
                    compFeaturesMap.set(strCompGUID, [features]);
                }
            }
        }
    }
    return { compFeaturesMap, compMatNumberMap };
}

// async function getCompFeaturesMap_BAK(
//     compQuantities: NormCalc.ICompResultData[],
//     theLastestVersion: number
// ) {
//     const compFeaturesMap = new Map<string, { [key: string]: string | number }[]>();
//     const compMatNumberMap = new Map<string, string>();
//     const clsAttrMap = await getClassAttributeMap(theLastestVersion);
//     const attrAllMap = await getAttributeMap();
//     for (const iterator of compQuantities) {
//         const { compType, strCompGUID, vecCalcItemResult } = iterator;
//         let compTypeId: number | null;
//         try {
//             compTypeId = parseInt(compType, 10);
//         } catch (error) {
//             compTypeId = null;
//         }

//         for (const calcItemResult of vecCalcItemResult) {
//             const { vecCompFeatures } = calcItemResult;
//             if (compTypeId !== null && vecCompFeatures !== undefined && vecCompFeatures.length > 0) {
//                 if (!clsAttrMap.has(compTypeId)) {
//                     // throw new Error(`compType error: ${compTypeId}.`);
//                     console.log(`compType error: ${compTypeId}.`); // tslint:disable-line:no-console
//                     // vecCalcItemResult 中所有 calcItemResult 的都是同一个compTypeId
//                     break;
//                 }
//                 const attrMap = clsAttrMap.get(compTypeId)!;
//                 const features: { [key: string]: string | number } = {};

//                 for (const featureObj of vecCompFeatures) {
//                     if (attrMap.has(featureObj.strKey)) {
//                         features[attrMap.get(featureObj.strKey)!] = featureObj.strValue!;
//                     } else if (attrAllMap.has(featureObj.strKey)) {
//                         features[attrAllMap.get(featureObj.strKey)!] = featureObj.strValue!;
//                     } else {
//                         console.log(`Not found ${featureObj.strKey} in comp type: ${compTypeId}`); // tslint:disable-line:no-console
//                     }
//                 }
//                 features.compType = compTypeId;

//                 if (features.MatNumber !== undefined && !compMatNumberMap.has(strCompGUID)) {
//                     compMatNumberMap.set(strCompGUID, `${features.MatNumber}`);
//                 }

//                 if (compFeaturesMap.has(strCompGUID)) {
//                     const featureArr = compFeaturesMap.get(strCompGUID);
//                     featureArr!.push(features);
//                 } else {
//                     compFeaturesMap.set(strCompGUID, [features]);
//                 }
//             }
//         }
//     }
//     // return compFeaturesMap;
//     return { compFeaturesMap, compMatNumberMap };
// }

async function getMatchedRuleWithItems(
    task: ClientTask,
    compFeaturesMap: Map<string, { [key: string]: string | number }[]>,
    theLastestVersion: number
) {
    const { owner, params } = task;
    const { matchId } = params!;
    // 获取匹配规则，以及匹配规则关联的项目
    const matchRuleWithItems = await getMatchRuleWithItems(matchId, owner!);
    // 获取构建类型id和构建类型版本id的对应关系
    const compTypeClassIdMap = await getCompMap(theLastestVersion);
    const compMatchRuleMap = new Map<string, IMatchRuleItem[][]>();
    // 填充墙的typeid
    const defaultTypeId = 95;
    // 墙的typeid
    const wallId = 1;
    for (const [strCompGUID, compFeatures] of compFeaturesMap) {
        const compMatchedItems: IMatchRuleItem[][] = [];
        for (const compFeature of compFeatures) {
            let compType = compFeature.compType;
            // 填充墙用墙的匹配规则
            if (compType === defaultTypeId) {
                compType = wallId;
            }
            // 获取当前构建类型的版本号
            const curClassId = compTypeClassIdMap.get(parseInt(<string>compType, 10));
            if (curClassId === undefined) {
                console.log(`Can not get class version id of ${compType}`); // tslint:disable-line:no-console
                continue;
            }
            const matchedItems: IMatchRuleItem[] = [];
            for (const matchRuleWithItem of matchRuleWithItems) {
                if (matchRuleWithItem.classId !== curClassId) {
                    continue;
                }
                const rule = matchRuleWithItem.matchRule;
                try {
                    const matchRuleItems = matchRuleWithItem.items;
                    if (rule === undefined || rule === null) {
                        matchedItems.push(...matchRuleItems);
                        // break;
                    } else {
                        // 套匹配规则，获取匹配的清单或者定额项目
                        const match = run(compFeature, rule);
                        if (match) {
                            matchedItems.push(...matchRuleItems);
                            // break;
                        }
                    }
                } catch (error) {
                    // console.log("====>rule", JSON.stringify(rule));
                    // console.log("====>features", JSON.stringify(features));
                    throw new Error(`matchError:${error}`);
                }
            }
            compMatchedItems.push(matchedItems);
        }
        // 构建id和套匹配规则获取的项目的对应关系
        compMatchRuleMap.set(strCompGUID, compMatchedItems);
    }
    return compMatchRuleMap;
}


function getCompResultsMap(
    compResultData: NormCalc.ICompResultData[],
    matchRuleItem: Map<string, IMatchRuleItem[][]>,
    compMatNumberMap: Map<string, string>
) {
    // 基础报价
    const compResultsMap: Map<string, NormCalc.ICompResult[][]> = new Map();
    // 家电软装
    const compSoftMatMap: Map<string, NormCalc.ICompSoftMat[]> = new Map();

    for (const iterator of compResultData) {
        const guid = iterator.strCompGUID;
        const floorIndex = iterator.floorIndex;
        const compType = iterator.compType;
        // 获取改构建id对应的匹配规则，以及匹配规则对应的清单定额项目
        const matchRuleItemArrays = matchRuleItem.get(guid)!;
        if (matchRuleItemArrays === undefined || matchRuleItemArrays === null) {
            continue;
        }
        const vecCalcItemResult = iterator.vecCalcItemResult;
        const resultList: NormCalc.ICompResult[][] = [];
        for (let index = 0; index < vecCalcItemResult.length; index++) {
            const features = vecCalcItemResult[index].vecCompFeatures;
            const strUnit = vecCalcItemResult[index].strUnit;
            // 获取计算结果-----自身结果
            const selfResult = vecCalcItemResult[index].compSelfData.dResult;
            // 获取计算结果-----增加结果
            const zjResultList = vecCalcItemResult[index].vecCompZJData;
            let zjResult = 0;
            for (const i of zjResultList) {
                zjResult += i.dResult;
            }
            // 获取计算结果-----扣减结果
            const kjResultList = vecCalcItemResult[index].vecCompKJData;
            let kjResult = 0;
            for (const o of kjResultList) {
                kjResult += o.dResult;
            }
            // 获取计算结果-----最终结果
            const calcResult = selfResult + zjResult - kjResult;

            // 获取 家电或软装 工程量
            if (compMatNumberMap.has(guid)) {
                if (!compSoftMatMap.has(guid)) {
                    compSoftMatMap.set(guid, []);
                }
                const tmp = compSoftMatMap.get(guid)!;
                // 获取家电软装的相关数据
                tmp.push({
                    matNumber: compMatNumberMap.get(guid)!,
                    data: calcResult,
                    unit: strUnit,
                    floorIndex: floorIndex,
                    compType: compType,
                    features: features,
                });
            }

            //
            const matchRuleItemArr = matchRuleItemArrays[index];
            // 最终结算结果
            let lastResult = 0;
            const matchList: NormCalc.ICompResult[] = [];
            if (matchRuleItemArr !== undefined) {
                for (const matchItem of matchRuleItemArr) {
                    let calcItemInMatchRule: number = -1;
                    let calcItemInCompResult: number = -2;
                    try {
                        calcItemInMatchRule = parseInt(`${matchItem.calculateRule.calcItem}`, 10);
                        calcItemInCompResult = parseInt(`${vecCalcItemResult[index].ruleData}`, 10);
                    } catch (error) {
                        //
                    }
                    if (Object.prototype.toString.call(matchItem) !== "[object Object]"
                        || matchItem.calculateRule === undefined
                        || matchItem.calculateRule === null) {
                        continue;
                    }
                    // 如果按增加倍数计算，则最终结果根据属性值进行计算
                    if (matchItem.calculateRule.type === "addMultiple") {
                        // 根据属性的默认值计算
                        const name = matchItem.calculateRule.attribute!.parameterName;
                        const feature = features.find(item => item.strKey === name);
                        if (feature !== undefined) {
                            const value = Number(feature.strValue);
                            lastResult = Math.ceil(calcResult * (value - matchItem.calculateRule.amount) / matchItem.calculateRule.addAmount!);
                        }
                        const result = <NormCalc.ICompResult>{
                            compResult: lastResult,
                            itemId: matchItem.itemId,
                            calcItem: vecCalcItemResult[index].ruleData,
                            unit: vecCalcItemResult[index].strUnit,
                            floorIndex: floorIndex,
                            compType: compType,
                            features: features,
                        };
                        matchList.push(result);

                    } else {
                        // 如果不是按增加倍数计算，则最终结果根据计算项目的工程量计算
                        // 如果calcItem和ruleData这两个计算项一样，才进行计算
                        if (calcItemInMatchRule === calcItemInCompResult) {
                            // 根据三种计算类型进行算量
                            switch (matchItem.calculateRule.type) {
                                case "actual":
                                    lastResult = calcResult * matchItem.calculateRule.amount;
                                    break;
                                case "min":
                                    if (calcResult < matchItem.calculateRule.amount) {
                                        lastResult = matchItem.calculateRule.amount;
                                    } else {
                                        lastResult = calcResult;
                                    }
                                    break;
                                case "fixMultiple":
                                    lastResult = Math.ceil(calcResult / matchItem.calculateRule.amount) * matchItem.calculateRule.amount;
                                    break;
                                default:
                                    break;
                            }
                            const result = <NormCalc.ICompResult>{
                                compResult: lastResult,
                                itemId: matchItem.itemId,
                                calcItem: vecCalcItemResult[index].ruleData,
                                unit: vecCalcItemResult[index].strUnit,
                                floorIndex: floorIndex,
                                compType: compType,
                                features: features,
                            };
                            matchList.push(result);
                        }
                    }
                }
            }
            resultList.push(matchList);
        }
        compResultsMap.set(guid, resultList);
    }
    return { compResultsMap, compSoftMatMap };
}

function transList2Norm(compResultsMap: Map<string, NormCalc.ICompResult[][]>, listNormMap: Map<number, IListInfo>) {
    const compNormResultsMap: Map<string, NormCalc.ICompResult[][]> = new Map();
    for (const [key, val] of compResultsMap) {
        const resultList: NormCalc.ICompResult[][] = [];
        for (const iterator of val) {
            const matchList: NormCalc.ICompResult[] = [];
            for (const itera of iterator) {
                const itemId = itera.itemId;
                const listItem = listNormMap.get(itemId);
                if (listItem) {
                    const normQuantity = listItem.normQuantity;
                    for (const norm of normQuantity!) {
                        const quantity = norm.quantity;
                        const resultObject = <NormCalc.ICompResult>{
                            compResult: itera.compResult * quantity!,
                            itemId: norm.normId,
                            calcItem: itera.calcItem,
                            unit: itera.unit,
                            floorIndex: itera.floorIndex,
                            compType: itera.compType,
                            features: itera.features,
                        };
                        matchList.push(resultObject);
                    }
                }
            }
            resultList.push(matchList);
        }
        compNormResultsMap.set(key, resultList);
    }
    return compNormResultsMap;
}
