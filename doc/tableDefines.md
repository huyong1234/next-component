# 清单定额和匹配规则 #

## 页面 ##

### 构件属性列表 ###

- id (id: number)
- 名称 (name: string)
- 变量名 (parameterName: string)
- 数据类型 (parameterType: string)
- 属性Mask (attributeMask: number)
- 取值范围 (valueRange: json)
<!-- - 客户端版本要求 (minimalClientVersion: number[]) -->
- 锁定 (isLock: boolean)
- 描述 (comment: string)

### 构件类型列表 ###

- id (id: number)
- 类名 (name: string)
- 类ID `对应客户端中的一个类的ID` (clientClassId number)
<!-- - 可用构件属性 (parameterId: uuid[]) -->
<!-- - 客户端版本要求 (minimalClientVersion: number[]) -->


### 属性版本 ###
- id (id: number)
- 构建类型ID (componentId: number)
- 属性ID (attributeId: number)
- 序号 (order: number)
- 版本号 (version: number)
- 锁定属性版本 (locked: boolean)

### 属性版本 ###
- id (id: number)
- 版本号 (version: number)

### 构件类型管理 ###

- id (id: uuid)
- 构件类型管理层级目录 (labelTree: json)
- 企业Id (companyId: number)
- 状态 (status: string)

### 匹配规则 ###

###### 所有可匹配到的规则，都会生效，规则先后顺序无影响 ######

* id (id: uuid)
* 构件类型id (classId: UUID)
* 规则 (rule: json)
* 结果 (result: string)
* 企业Id (companyId: number)
* 状态 (status: string) 
* 定额Id (listNormId: uuid[])
* 备注 (comment: string)

### 清单定额 ###

###### 清单和定额都采用或者直接价格的方式，都用相同的数据格式来存储 ###### 

###### 如果类型为清单，关联项目为定额；如类型为定额，关联项目为价格；如类型为价格，关联项目为商品（商品定义见构件库）

* id (id: uuid)
* 父条目id (parentId: uuid)
* 名称 (name: string)
* 编码 (code: string)
* 类型 (type: string)
  * 清单
  * 定额
  * 价格
* 项目 (category: string)
  * 主材
  * 辅材
  * 人工
  * 机械
  * 其他
* 单位 (unit: string)
* 损耗 (loss: number)
* 成本 (cost: number)
* 售价 (price: number)
* 搜索条件 (attr: json)
* 企业Id (companyId: number)
* 备注 (comment: string)
* 状态 (status: string)

