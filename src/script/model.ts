import { Model, DataTypes, Sequelize } from "sequelize";
const DB: any = {
    host: "db.xingfuli.me",
    port: 5432,
    username: "test_user",
    password: "test_user_P4SSW0RD",
    database: "remiz_render_db_dev",
    dialect: "postgres",
    timezone: "Asia/Shanghai",
    typeValidation: true,
    logging: () => { },// tslint:disable-line:no-empty
};
export const Models = new Sequelize(DB);// tslint:disable-line:variable-name

export class OldTextrue extends Model {
    public id?: string;
    public name?: string;
    public attribute?: {
        property: string;
    };
    public images?: string[];
    public preview?: string[];
    public info?: {};
    public status?: string;
    public owner?: number;
    public author?: string;
    public renderStatus?: string;
    public fileSize?: number;

    public materialUUID?: string;
}

OldTextrue.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true,
            comment: "材质UUID",
        },
        name: {
            type: DataTypes.STRING,
            comment: "材质名",
        },
        attribute: {
            type: DataTypes.JSONB,
            comment: "材质属性",
        },
        images: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            comment: "图片",
        },
        preview: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            comment: "预览图",
        },
        info: {
            type: DataTypes.JSONB,
            comment: "扩展属性",
        },
        status: {
            type: DataTypes.STRING,
            comment: "状态",
        },
        renderStatus: {
            type: DataTypes.STRING,
            comment: "渲染状态",
        },
        fileSize: {
            type: DataTypes.INTEGER,
            defaultValue: 0,//单位byte
            comment: "上传文件大小",
        },
        owner: {
            type: DataTypes.STRING,
            comment: "所属ID",
        },
        taskId: {
            type: DataTypes.UUID,
            comment: "渲染taskId",
        },
        author: {
            type: DataTypes.STRING,
            comment: "上传人的账户名字",
        },
        materialUUID: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            comment: "materialUUID",
        },
    },
    {
        tableName: "render_texture",
        paranoid: true,
        comment: "用户提交的渲染任务对应工程",
        sequelize: Models,
    }
);
export class OldTag extends Model { // tslint:disable-line:max-classes-per-file
    public id?: number;
    public name?: string;
    public type?: string;
    public status?: string;
}
OldTag.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            unique: "unique_tags",
            comment: "标签名",
        },
        type: {
            type: DataTypes.STRING,
            unique: "unique_tags",
            comment: "标签类别",
        },
        status: {
            type: DataTypes.STRING,
            comment: "标签状态",
        },
    },
    {
        tableName: "render_tags",
        paranoid: true,
        comment: "用户提交的渲染任务对应工程",
        sequelize: Models,
    }
);
export class OldTagTextureInfo extends Model { // tslint:disable-line:max-classes-per-file
    public id?: number;
    public config?: {

    };
    public preview?: string[];
    public parentsId?: number[];
    public idArr?: number[];
    public materialJson?: {};
}
OldTagTextureInfo.init(
    {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: "tree id",
        },
        config: {
            type: DataTypes.JSONB,
            comment: "标签材质渲染vrmat内容",
        },
        preview: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            comment: "预览展示图片",
        },
        parentsId: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            comment: "对应tags表的父级标签ID",
        },
        idArr: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            comment: "对应tags表的标签ID",
        },
        materialJson: {
            type: DataTypes.JSON,
            comment: "材质的JSON",
        },
    },
    {
        tableName: "texture_type_info",
        paranoid: true,
        comment: "材质标签以及对应表",
        sequelize: Models,
    }
);


export class OldTagSystemId extends Model {// tslint:disable-line:max-classes-per-file
    public id?: number;
    public sysId?: number;
    public idArr?: number[];
    public parentsId?: number[];
    public viewType?: string;
    public tagName?: string;
    public tagId?: number;
}
OldTagSystemId.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sysId: {
            type: DataTypes.INTEGER,
            unique: true,
            comment: "客户端传递过来的sysID",
        },
        idArr: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            comment: "对应tag表标签的id",
        },
        parentsId: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            comment: "对应tag表标的父级id",
        },
        viewType: {
            type: DataTypes.STRING,
            comment: "模型标签默认视角",
        },
        tagName: {
            type: DataTypes.STRING,
            comment: "对应标签名",
        },
        tagId: {
            type: DataTypes.INTEGER,
            comment: "对应标签ID",
        },
    },
    {
        tableName: "system_id_info",
        comment: "系统标签以及对应表",
        sequelize: Models,
    }
);
enum ModelStatus {
    creating = "creating",
    active = "active",
    invalid = "invalid",
    auditing = "auditing",
    delete = "delete",
}
enum ParseStatus {
    waiting = "waiting",
    preparing = "preparing",
    rendering = "rendering",
    done = "done",
    failed = "failed",
}
enum MaxAxisPosition {
    top = "top",
    down = "down",
    normal = "normal",
}
export class OldModel extends Model {// tslint:disable-line:max-classes-per-file
    public id?: string;
    public name?: string;
    public attribute?: {
        size?: number[];
    };
    public file?: {
        url?: string;
    };
    public preview?: string[];
    public info?: {
        tag: number[]
    };
    public status?: ModelStatus;
    public renderStatus?: string;
    public owner?: string;
    public fileSize?: number;
    public taskId?: string;
    public author?: string;
    public webJson?: {};
    public direction?: string;
    public parseStatus?: ParseStatus;
    public maxFilePath?: string;
    public maxAxisPosition?: MaxAxisPosition;
    public dwgPath?: string;


}

OldModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true,
            comment: "模型UUID",
        },
        name: {
            type: DataTypes.STRING,
            comment: "模型名",
        },
        attribute: {
            type: DataTypes.JSONB,
            comment: "模型属性",
        },
        file: {
            type: DataTypes.JSONB,//数据结构{"url":"http://OSSxxxx"}
            comment: "模型文件",
        },
        preview: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            comment: "预览图",
        },
        info: {
            type: DataTypes.JSONB,
            comment: "扩展属性",
        },
        status: {
            type: DataTypes.ENUM(...Object.keys(ModelStatus)),
            defaultValue: "creating",
            comment: "模型状态",
        },
        renderStatus: {
            type: DataTypes.STRING,
            comment: "渲染状态",
        },
        owner: {
            type: DataTypes.STRING,
            comment: "所属ID",
        },
        fileSize: {
            type: DataTypes.INTEGER,
            defaultValue: 0,//单位byte
            comment: "上传文件大小",
        },
        taskId: {
            type: DataTypes.UUID,
            comment: "渲染taskId",
        },
        author: {
            type: DataTypes.STRING,
            comment: "上传人的账户名字",
        },
        webJson: {
            type: DataTypes.JSONB,
            comment: "webJson数据",
        },
        direction: {
            type: DataTypes.STRING,
            comment: "镜头方向",
        },
        parseStatus: {
            type: DataTypes.ENUM(...Object.keys(ParseStatus)),
            comment: "解析max状态",
        },
        maxFilePath: {
            type: DataTypes.STRING,
            comment: "max文件路径",
        },
        maxAxisPosition: {
            type: DataTypes.ENUM(...Object.keys(MaxAxisPosition)),
        },
        dwgPath: {
            type: DataTypes.STRING,
            comment: "dwg文件路径",
        },
        // type: {
        //     type: DataTypes.ENUM("model", "cabinet"),
        //     comment: "模型类型",
        //     defaultValue: "model",
        // },
    },
    {
        tableName: "render_model",
        paranoid: true,
        comment: "用户提交的渲染任务对应工程",
        sequelize: Models,
    }
);
