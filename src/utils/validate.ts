import * as Joi from "joi";

export default function (data: { [index: string]: any }, schemas: { [index: string]: any }): object | void {
    const result = Joi.validate(data, Joi.object(schemas));
    if (result.error !== null) {
        const msg: string[] = [];
        for (const err of result.error.details) {
            msg.push(`key: ${err.path[0]}, msg: ${err.message}`);
        }
        return { code: 1000, msg: msg.join("; ") };
    }
}
