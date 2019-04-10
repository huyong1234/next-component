import { Sequelize } from "sequelize";
import Config from "../config";

const Models = new Sequelize(Config.get("DB"));// tslint:disable-line:variable-name

export default Models;
