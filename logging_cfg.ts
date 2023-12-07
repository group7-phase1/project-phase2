import { createLogger, transports, format, Logger } from "winston";
import * as dotenv from 'dotenv';

dotenv.config();

// select log level
let logLevel: string = 'info'; // Default to 'info' or another appropriate default
let logSilent: boolean = true;
if(process.env.LOG_LEVEL === '1') {
    logLevel = 'info';
    logSilent = false;
} else if(process.env.LOG_LEVEL === '2') {
    logLevel = 'debug';
    logSilent = false;
}

export const logger: Logger = createLogger({
    level: logLevel,
    silent: logSilent,
    transports: [
        new transports.File({ filename: process.env.LOG_FILE || 'default.log' })
    ],
    format: format.combine(
        format.timestamp(),
        format.printf((info) => {
            let message = `[${info.timestamp}] ${info.level}: ${info.message}`;
            if (info[Symbol.for('splat') as any]) {
                message += ` ${info[Symbol.for('splat') as any].map((arg: any) => JSON.stringify(arg, null, 2)).join(' ')}`;
            }
            return message;
        }),
    ),
});
