import { getUploadConfig, download, upload, getUrl } from "@nestsoft/oss";
import * as fs from "fs";
import Config from "../config";
export const getOssUploadConfig = async (type: string, owner: number, name: string, option?: {}) => {
    const date = new Date().getTime();
    const key = `${type}/${owner}/${date}/${name}`;
    const oss = await getUploadConfig(Config.get("resourceOSS"), key, option);
    return { oss, key };
};
export const ossDownload = async (key: string, file: string | fs.WriteStream) => {
    return await download(Config.get("resourceOSS"), key, file);
};
export const ossUpload = async (key: string, file: string | Buffer | fs.ReadStream, option?: { acl?: string }) => {
    return await upload(Config.get("resourceOSS"), key, file, option);
};
export const ossDownloadUrl = async (key: string) => {
    return await getUrl(Config.get("resourceOSS"), key);
};
