import * as util from "util";
import * as fs from "fs";
const promisifyUnlink = util.promisify(fs.unlink);

export const isExist = (vaule?: string | number | {}) => {
    let result = false;
    if (vaule !== undefined && vaule !== null) {
        result = true;
    }
    return result;
};


export const simpleDelFile = async (filePath: string) => {
    if (filePath === "/" || filePath === "." || filePath === "./" || filePath === ".." || filePath === "../") {
        return;
    }
    if (fs.existsSync(filePath)) {
        await promisifyUnlink(filePath);
    }
};
