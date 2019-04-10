import { Models } from "../model";
import chalk from "chalk";
const resetDB = async () => {
    console.log(chalk.yellow("waiting..."));// tslint:disable-line:no-console
    await Models.sync({ force: true });
    // dataBase reset should be adjusted accroding to your need
    //await Models.sync({ force: false });
    // let task = await Task.create({
    //     userId: 'ba27ae77-9f7c-4703-8602-c09df14a2ce1',
    // });
    // let resource = await Resource.create({});
    // let resource = await ClientResource.create({
    //     id: 'ba27ae77-9f7c-4703-8602-c09df14a2ce1'
    // });
};
resetDB()
    .then(() => {
        console.log(chalk.cyan("finished"));// tslint:disable-line:no-console
        process.exit();
    })
    .catch((e) => {
        console.log(chalk.red(e));// tslint:disable-line:no-console
    });
