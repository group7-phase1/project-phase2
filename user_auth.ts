import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import * as dotenv from "dotenv";
import { logger } from './logging_cfg';
import * as readline from 'readline';

dotenv.config();


const cognito = new CognitoIdentityProvider({
    region: 'us-east-2',
    credentials: {
        accessKeyId: process.env.COGNITO_ACCESS_KEY as string, 
        secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY as string,
    },
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter username: ', (username: string) => {
    rl.question('Enter password: ', async (password: string) => {
        const params = {
            UserPoolId: process.env.USER_POOL_ID as string,
            Username: username,
            TemporaryPassword: password,
        };

        try {
            const data = await cognito.adminCreateUser(params);
            console.log(data);
            logger.log('User created successfully: ', data);
        } catch (err) {
            console.log(err);
            logger.error('Error creating user: ', err);
        }

        rl.close();
    });
});
