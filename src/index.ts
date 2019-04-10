import * as http from "http";
import * as path from "path";
import * as Koa from "koa";
import * as onerror from "koa-onerror";
import * as net from "net";
import Chalk from "chalk";
import RedisStore from "@nestsoft/redis-session";
import * as cors from "koa2-cors";

import * as util from "util";
import * as fs from "fs";
const fsMkdir = util.promisify(fs.mkdir);

import Config from "./config";
import { Models } from "./model";

import Router from "./router";

// const simCors: Middleware = async (ctx, next) => {
//     let whiteHosts = Config.get("whiteHosts");
//     if (whiteHosts === undefined) {
//         whiteHosts = [];
//     }
//     let originHost = "127.0.0.1";
//     if (ctx.header.origin) {
//         originHost = ctx.header.origin.slice(7);
//     }
//     whiteHosts.forEach((whiteHost: string) => {
//         if (whiteHost.indexOf(originHost) !== -1) {
//             ctx.set("Access-Control-Allow-Origin", `http://${originHost}`);
//             ctx.set("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
//             ctx.set("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
//             ctx.set("Access-Control-Allow-Credentials", "true");
//         }
//     });
//     if (ctx.method.toLowerCase() === "options") {
//         ctx.status = 200;
//     } else {
//         await next();
//     }
// };

(async () => {
    const app = new Koa();
    const port = process.env.SERVER_PORT;
    onerror(app, {
        accepts() {
            return "json";
        },
        json(err: any, ctx: any) {
            ctx.status = 200;
            ctx.body = { code: 1001, msg: err.message };
        },
    });
    app.use(RedisStore({
        redis: Config.get("redis"),
        key: Config.get("session").key,
        maxAge: Config.get("session").maxAge,
        domain: Config.get("session").domain,
    }));
    // app.use(simCors);

    // 获取 cors origin
    let corsOrigins = Config.get("corsOrigins");
    if (corsOrigins === undefined) {
        corsOrigins = Config.get("whiteHosts");
    }

    app.use(cors({
        origin: (ctx) => {
            const origin = ctx.header.origin;
            if (corsOrigins === undefined || corsOrigins.indexOf(origin) === -1) {
                return false;
            }
            return origin;
        },
        // exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        maxAge: 5,
        credentials: true,
        allowMethods: ["GET", "PUT", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS"],
        allowHeaders: ["Content-Type", "Content-Length", " Authorization", " Accept", "X-Requested-With"],
    }));
    app.use(Router);

    await Models.sync({ force: false });

    const excelsPath = path.join(__dirname, "../excels/");
    if (!fs.existsSync(excelsPath)) {
        await fsMkdir(excelsPath);
    }

    const dbPath = path.join(__dirname, "../db/");
    if (!fs.existsSync(dbPath)) {
        await fsMkdir(dbPath);
    }

    // start server
    const server = http.createServer(app.callback());
    server.listen(port !== undefined ? port : 3000, (err: Error) => {
        if (err !== undefined) {
            throw err;
        }
        const addr = <net.AddressInfo>server.address();
        console.log(Chalk.green(`[Nestsoft] Server bound at ${addr.address} ${addr.port}`)); // tslint:disable-line:no-console
    });
})();
