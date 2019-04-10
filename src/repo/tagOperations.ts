import { Transaction } from "sequelize";
import { SynonymTag, SynonymTagMap, Tag, TagHistory } from "../model";

export const getTagHistory = async (owner: number) => {
    const usedTags = await TagHistory.findOne({
        where: { owner: owner },
        attributes: ["tags"],
        raw: true,
    });
    return usedTags ? usedTags.tags : null;
};

export interface INewTag {
    owner?: number;
    goodsId?: number;
    componentId?: number;
    tags: string[];
}

export const addNewTag = async (options: INewTag, transaction: Transaction) => {
    try {
        const exitedSynonymTags = await SynonymTag.findAll({
            where: { tag: options.tags },
            attributes: ["tag", "index"],
            order: [["tag", "ASC"]],
            raw: true,
        });
        const indexToBind: number[] = [];
        const tagMapObjs = [];
        // 截去标签库中已有的标签(exitedSynonymTags)，剩下的就是新标签
        const newTags = options.tags.concat();
        for (const est of exitedSynonymTags) {
            newTags.splice(newTags.indexOf(est.tag!), 1);
        }
        for (const t of exitedSynonymTags) {
            // 去除已经合并的同义词标签的index
            if (indexToBind.indexOf(t.index!) === -1) {
                indexToBind.push(t.index!);
                if (options.goodsId !== undefined) {
                    tagMapObjs.push({
                        goodsComponentId: options.goodsId,
                        unitType: "goods",
                        synonymTagIndex: t.index,
                    });
                }
                if (options.componentId !== undefined) {
                    tagMapObjs.push({
                        goodsComponentId: options.componentId,
                        unitType: "component",
                        synonymTagIndex: t.index,
                    });
                }
            }
        }

        const tagObjs = [];
        for (const tagStr of newTags) {
            tagObjs.push({ tag: tagStr });
        }

        // 向“标签库”中，写入“新标签”
        await Tag.bulkCreate(tagObjs, { transaction });
        const nts = await Tag.findAll({ where: { tag: newTags }, transaction: transaction });
        const synonymTagObjs = [];
        for (const nt of nts) {
            const idx = nt.get("id");
            if (options.goodsId !== undefined) {
                tagMapObjs.push(
                    {
                        goodsComponentId: options.goodsId,
                        unitType: "goods",
                        synonymTagIndex: idx,
                    }
                );
            }
            if (options.componentId !== undefined) {
                tagMapObjs.push(
                    {
                        goodsComponentId: options.componentId,
                        unitType: "component",
                        synonymTagIndex: idx,
                    }
                );
            }
            synonymTagObjs.push({ tag: nt.get("tag"), index: idx });
        }
        await SynonymTag.bulkCreate(synonymTagObjs, { transaction });
        await SynonymTagMap.bulkCreate(tagMapObjs, { transaction });

        // 更新owner tag history
        // 在共享构件到公共库时，将不会传入owner，因为这些tags不是“nestsoft”主动写入的
        if (options.owner !== undefined) {
            const usedTags = await getTagHistory(options.owner);
            if (usedTags === null) {
                await TagHistory.create(
                    { owner: options.owner, tags: options.tags },
                    { transaction }
                );
            } else {
                let tagsToUpdate = options.tags.filter((t) => {
                    const used = usedTags!.includes(t);
                    return !used;
                });
                tagsToUpdate = usedTags!.concat(tagsToUpdate);
                await TagHistory.update(
                    {
                        // tags: Sequelize.fn("array_cat", Sequelize.col("tags"), newTags),
                        tags: tagsToUpdate,
                    },
                    {
                        where: { owner: options.owner },
                        transaction: transaction,
                    }
                );
            }
        }
        // commit
        // await transaction.commit();
    } catch (ex) {
        // Rollback transaction if any errors were encountered
        // await transaction.rollback();
        throw ex;
    }
};
