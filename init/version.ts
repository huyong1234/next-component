/**
 * README:
 * build: tsc --lib es7 init/version.ts
 * run: SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/version.js
 */

import { Version, ClientSoftVersion } from "../output/model";
import { Sequelize } from "sequelize";
import { exist } from "joi";
const todo = async () => {
    await Version.sync({ force: false });
    await ClientSoftVersion.sync({ force: false });

    await Version.create({ published: true, comment: "just for test", baseVersion: 0 });

    const softVersion = await ClientSoftVersion.create({ clientVersion: "5.0.0", version: 1 });
    console.log("wahaha"); // tslint:disable-line:no-console
};

if (require.main === module) {
    todo();
}
export default todo;
