import * as dotenv from 'dotenv';
import { logger } from './logging_cfg'

const readline = require('readline');
const AWS = require('aws-sdk');

const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter username: ', (username:string) => {
    rl.question('Enter password: ', (password:string) => {
        const params = {
        UserPoolId: process.env.USER_POOL_ID,
        Username: username,
        TemporaryPassword: password,

        };

        cognito.adminCreateUser(params, (err, data) => {
        if (err) {
            logger.error('Error creating user: ', err);
        } else {
            logger.log('User created successfully: ', data);
        }

        rl.close();
        });
    });
});
