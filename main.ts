import { URLFileHandler } from "./fileio";
import { logger } from './logging_cfg';
import * as dotenv from 'dotenv';

dotenv.config();

// check for valid git token
// check for valid log level
logger.log('info', 'Starting program');
logger.log('debug', 'Reading from file: ' + process.argv[2]);

URLFileHandler(process.argv[2]);