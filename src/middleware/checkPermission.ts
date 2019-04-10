import { Middleware } from "@nestsoft/koa-extended";
// check user permission
// const checkList: {[index: string]: string | string[]} = {
//     "/attribute/type": ["30001001", "30001002"],
// };
const permissionMap: Map<string, string[]> = new Map([
    // 库信息相关权限
    ["GET:/list/norm/library", ["30003001", "30003002", "30003003", "30003004", "30003005"]],
    ["POST:/list/norm/library", ["30003002"]],
    ["PUT:/list/norm/library", ["30003003"]],
    ["DELETE:/list/norm/library", ["30003004"]],
    ["POST:/list/norm/library/upgrade", ["30003005"]],
    // 匹配规则相关权限
    ["GET:/list/norm/calculate/rule", ["30004001", "30004002", "30004003", "30004004", "30004005"]],
    ["POST:/list/norm/calculate/rule", ["30004002"]],
    ["PUT:/list/norm/calculate/rule", ["30004003"]],
    ["DELETE:/list/norm/calculate/rule", ["30004004"]],
    ["POST:/list/norm/calculate/copy", ["30004005"]],
    // 清单库相关权限
    ["GET:/list/norm/item", ["30005001", "30005002", "30005003", "30005004", "30005005"]],
    ["POST:/list/item", ["30005002"]],
    ["PUT:/list/item", ["30005003"]],
    ["DELETE:/list/item", ["30005004"]],
    ["GET:/list/norm/template/upload", ["30005005"]],
    // 定额库相关权限
    ["GET:/list/norm/item", ["30006001", "30006002", "30006003", "30006004", "30006005"]],
    ["POST:/norm/item", ["30006002"]],
    ["PUT:/norm/item", ["30006003"]],
    ["DELETE:/norm/item", ["30006004"]],
    ["GET:/list/norm/template/upload", ["30006005"]],
    // 人材机库相关权限
    ["GET:/list/norm/item", ["30007001", "30007002", "30007003", "30007004", "30007005"]],
    ["POST:/material/item", ["30007002"]],
    ["PUT:/material/item", ["30007003"]],
    ["DELETE:/material/item", ["30007004"]],
    ["GET:/list/norm/template/upload", ["30007005"]],
]);
export const checkPermission: Middleware = async (ctx, next?) => {
    const { companyId } = ctx.session.company;
    let flag = true;
    if (companyId === -2) {
        await next();
    } else {
        const permission = ctx.session.permission;
        if (permission !== undefined && permission !== null) {
            const checkPermissionList = permission.split(";");
            // 获取请求方式和url
            const methodUrl = `${ctx.method}:${ctx.path}`;
            const neededPermission = permissionMap.has(methodUrl) ? permissionMap.get(methodUrl)! : [];
            if (neededPermission.length > 0) {
                // 获取交集
                const intersection = neededPermission.filter(v => checkPermissionList.includes(v));
                if (intersection.length === 0) {
                    flag = false;
                }
            }
        }
        if (flag) {
            await next();
        } else {
            ctx.throw("no permission");
        }
    }
    // 获取session中的权限码
};

