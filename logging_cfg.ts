import { createLogger, transports, format } from "winston";
import * as dotenv from 'dotenv';

dotenv.config();

// select log level
let logLevel: string = '';
let logSilent: boolean = true;
if(process.env.LOG_LEVEL == '1') {
    logLevel = 'info';
    logSilent = false;
} else if(process.env.LOG_LEVEL == '2') {
    logLevel = 'debug';
    logSilent = false;
}

// set up logger
// use log level from env variable
// use log directory from env variable
export const logger = createLogger({
    level: logLevel,
    silent: logSilent,
    transports: [ new transports.File({filename: process.env.LOG_FILE}) ],
    format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp}) => {
            return `[${timestamp}] ${level}: ${message}`;
        }),
    ),
});
