import { 
    CognitoIdentityProvider, 
    AdminInitiateAuthCommandOutput, 
    AuthFlowType 
  } from "@aws-sdk/client-cognito-identity-provider";

import * as dotenv from "dotenv";
import { logger } from './logging_cfg';
import { insertUser } from './database';

dotenv.config();

export async function login(username: string, password: string) {
    const cognito = new CognitoIdentityProvider({
        region: 'us-east-2',
        credentials: {
            accessKeyId: process.env.COGNITO_ACCESS_KEY as string,
            secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY as string,
        },
    });

    const params = {
        AuthFlow: 'ADMIN_NO_SRP_AUTH' as AuthFlowType,  
        UserPoolId: process.env.USER_POOL_ID as string,
        ClientId: process.env.CLIENT_ID as string, 
        AuthParameters: {
            'USERNAME': username,
            'PASSWORD': password,
        }
    };

    try {
        const data: AdminInitiateAuthCommandOutput = await cognito.adminInitiateAuth(params);
        
        if (data && data.AuthenticationResult) {
            logger.log('User logged in successfully: ', data.AuthenticationResult);
            return data.AuthenticationResult; // Return the authentication result which contains tokens
        } else {
            throw new Error('Authentication failed');
        }
    } catch (err) {
        console.log(err);
        logger.error('Error logging in: ', err);
        throw err;
    }
}



export async function register(username: string, password: string, admin: boolean) {
    const cognito = new CognitoIdentityProvider({
        region: 'us-east-2',
        credentials: {
            accessKeyId: process.env.COGNITO_ACCESS_KEY as string,
            secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY as string,
        },
    });
    const params = {
        UserPoolId: process.env.USER_POOL_ID as string,
        Username: username,
        TemporaryPassword: password,
        Admin: admin
    };

    try {
        console.log("cognito try");
        const data = await cognito.adminCreateUser(params);
        console.log("cognito data");
        console.log(data);

        const userId = await insertUser(params.Username, params.Admin);
        console.log("userId ", userId)
        if (!userId) {
            throw new Error('Failed to insert user into the database.');
        }

        logger.log('User created successfully: ', data);
        return { success: true, message: 'User registered successfully' };
    } catch (err) {
        console.log(err);
        logger.error('Error creating user: ', err);
        throw err;
    }
}


// export function logout() {
//     console.log('User logged out');
// }
