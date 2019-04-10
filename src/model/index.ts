import Models from "./sequelizeBridge";
import { Attribute } from "./attribute";
import { AttributeMask } from "./attributeMask";
import { ClientClass } from "./clientClass";
import { ClassGroup } from "./classGroup";
import { ClassVersion } from "./classVersion";
import { AttributeVersion } from "./attributeVersion";
import { Version } from "./version";
import { ClientSoftVersion } from "./clientSoftVersion";

// import { GoodsGroup } from "./goodsGroup";
// import { Goods } from "./goods";
// import { GoodsGroupMap } from "./goodsGroupMap";
import { ComponentGroup } from "./componentGroup";
import { Component } from "./component";
import { ComponentGroupMap } from "./componentGroupMap";
import { ComponentModelMap } from "./componentModelMap";
import { CadModel } from "./cadModel";
import { MaxModel } from "./maxModel";
import { Textrue } from "./texture";

import { SynonymTag } from "./synonymTag";
import { SynonymTagMap } from "./synonymTagMap";
import { Tag } from "./tag";
import { TagHistory } from "./tagHistory";

import { Approval } from "./componentApproval";

import { ListItem } from "./listItem";
import { CalculateRule } from "./listNormCalculateRule";
import { Catalog } from "./listNormCatalog";
import { NormItem } from "./listNormItem";
import { Library } from "./listNormLibrary";
import { MatchRule } from "./listNormMatchRule";
import { MaterialItem } from "./listNormMaterialItem";
import { ListNormMap } from "./listNormMap";
import { NormMaterialMap } from "./listNormMaterialMap";
import { TextureGroup } from "./textureGroup";
import { ComponentGroupModelMap } from "./componentGroupModelMap";
import { RenderMap } from "./renderMap";
import { MaxModelInfo } from "./maxModelInfo";
import { ClientTask } from "./listNormClientTask";



// Associations
ClassVersion.belongsTo(ClientClass, { foreignKey: "clientClassId" });

AttributeVersion.belongsTo(Attribute, { foreignKey: "attributeId" });

ClassGroup.hasMany(ClassVersion, { foreignKey: "groupId", as: "items" });
ClassVersion.belongsTo(ClassGroup, { foreignKey: "groupId" });

ClassVersion.hasMany(AttributeVersion, { foreignKey: "classVersionId" });

Version.hasMany(ClientSoftVersion, { foreignKey: "version", as: "ClientVersions" });

// GoodsGroup.hasMany(GoodsGroup, { foreignKey: "parentId" });

// GoodsGroup.belongsToMany(Goods, { through: GoodsGroupMap, foreignKey: "groupId" });
// Goods.belongsToMany(GoodsGroup, { through: GoodsGroupMap, foreignKey: "goodsId" });

// Goods.belongsTo(Component, { foreignKey: "componentId" });
// Component.hasMany(Goods, { foreignKey: "componentId" });

// component
ComponentGroup.hasMany(ComponentGroup, { foreignKey: "parentId" });
ComponentGroup.belongsToMany(Component, { through: ComponentGroupMap, foreignKey: "groupId" });
Component.belongsToMany(ComponentGroup, { through: ComponentGroupMap, foreignKey: "componentId" });
// cad
Component.belongsToMany(CadModel, { through: ComponentModelMap, foreignKey: "componentId" });
CadModel.belongsToMany(Component, { through: ComponentModelMap, foreignKey: "viewId" });
// max
Component.belongsToMany(MaxModel, { through: ComponentModelMap, foreignKey: "componentId" });
MaxModel.belongsToMany(Component, { through: ComponentModelMap, foreignKey: "viewId" });
// texture
Component.belongsToMany(Textrue, { through: ComponentModelMap, foreignKey: "componentId" });
Textrue.belongsToMany(Component, { through: ComponentModelMap, foreignKey: "viewId" });

Component.hasMany(ComponentModelMap, { foreignKey: "componentId" });

Component.hasMany(Approval, { foreignKey: "componentId" });
Approval.belongsTo(Component, { foreignKey: "componentId" });


// 匹配/计算规则
ClassVersion.hasMany(MatchRule, { foreignKey: "classId" });
MatchRule.belongsTo(ClassVersion, { foreignKey: "classId" });
// 匹配、清单项目
// MatchRule.belongsToMany(ListItem, { through: MatchMap, foreignKey: "matchId" });
// ListItem.belongsToMany(MatchRule, { through: MatchMap, foreignKey: "itemId" });
// 匹配、定额项目
// MatchRule.belongsToMany(NormItem, { through: MatchMap, foreignKey: "matchId" });
// NormItem.belongsToMany(MatchRule, { through: MatchMap, foreignKey: "itemId" });

ClassVersion.hasMany(CalculateRule, { foreignKey: "classId" });
CalculateRule.belongsTo(ClassVersion, { foreignKey: "classId" });

// 清单定额目录
Library.hasMany(Catalog, { foreignKey: "libId" });
Catalog.belongsTo(Library, { foreignKey: "libId" });
Catalog.hasMany(Catalog, { foreignKey: "parentId" });
Library.belongsTo(Library, { foreignKey: "relationLib", as: "RelationLib" });
// 计算库
Library.hasMany(CalculateRule, { foreignKey: "libId" });
CalculateRule.belongsTo(Library, { foreignKey: "libId" });
// 清单定额项目
Catalog.hasMany(ListItem, { foreignKey: "catalogId", constraints: false });
ListItem.belongsTo(Catalog, { foreignKey: "catalogId", constraints: false });
Catalog.hasMany(NormItem, { foreignKey: "catalogId", constraints: false });
NormItem.belongsTo(Catalog, { foreignKey: "catalogId", constraints: false });
Catalog.hasMany(MaterialItem, { foreignKey: "catalogId", constraints: false });
MaterialItem.belongsTo(Catalog, { foreignKey: "catalogId", constraints: false });
// 清单挂定额
ListItem.belongsToMany(NormItem, { through: ListNormMap, foreignKey: "listId" });
NormItem.belongsToMany(ListItem, { through: ListNormMap, foreignKey: "normId" });
// 定额挂人材机
NormItem.belongsToMany(MaterialItem, { through: NormMaterialMap, foreignKey: "normId" });
MaterialItem.belongsToMany(NormItem, { through: NormMaterialMap, foreignKey: "materialId" });

//模型和构件分组关联信息
MaxModel.belongsToMany(ComponentGroup, { as: "tags", through: ComponentGroupModelMap, foreignKey: "modelId", otherKey: "groupId" });
ComponentGroup.belongsToMany(MaxModel, { as: "models", through: ComponentGroupModelMap, foreignKey: "groupId", otherKey: "modelId" });

export {
  Models, Attribute, AttributeMask, ClientClass,
  ClassGroup, ClassVersion, AttributeVersion, Version, ClientSoftVersion,
  // GoodsGroup, Goods, GoodsGroupMap,
  ComponentGroup, Component, ComponentGroupMap, ComponentModelMap,
  CadModel, MaxModel, Textrue,
  SynonymTag, SynonymTagMap, Tag, TagHistory,
  Approval,
  ListItem, CalculateRule, Catalog, NormItem, Library, MatchRule, MaterialItem,
  ListNormMap, NormMaterialMap,
  TextureGroup, ComponentGroupModelMap, RenderMap, MaxModelInfo, ClientTask
};

export * from "./sequelizeBridge";
export * from "./attribute";
export * from "./attributeMask";
export * from "./clientClass";
export * from "./classGroup";
export * from "./classVersion";
export * from "./attributeVersion";
export * from "./version";
export * from "./clientSoftVersion";

// export * from "./goodsGroup";
// export * from "./goods";
// export * from "./goodsGroupMap";
export * from "./componentGroup";
export * from "./component";
export * from "./componentGroupMap";
export * from "./componentModelMap";
export * from "./cadModel";
export * from "./maxModel";
export * from "./texture";

export * from "./synonymTag";
export * from "./synonymTagMap";
export * from "./tag";
export * from "./tagHistory";

export * from "./componentApproval";


export * from "./listItem";
export * from "./listNormCalcItem";
export * from "./listNormCalculateRule";
export * from "./listNormCatalog";
export * from "./listNormItem";
export * from "./listNormLibrary";
export * from "./listNormMatchRule";
export * from "./listNormMatchMap";
export * from "./listNormMaterialItem";
export * from "./listNormMap";
export * from "./listNormMaterialMap";
export * from "./listNormImportTask";
export * from "./textureGroup";
export * from "./listNormClientTask";
