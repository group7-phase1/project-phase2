import {
    CognitoIdentityProvider,
    AdminInitiateAuthCommandOutput,
    AuthFlowType
} from "@aws-sdk/client-cognito-identity-provider";
import * as dotenv from "dotenv";
import { insertUser } from './database';
import { MessageActionType } from "@aws-sdk/client-cognito-identity-provider";
import jwt from 'jsonwebtoken';
import { logger } from "./logging_cfg";
dotenv.config();

export async function register(username: string, password: string, admin: boolean) {
    const cognito = new CognitoIdentityProvider({
        region: 'us-east-2',
        credentials: {
            accessKeyId: process.env.COGNITO_ACCESS_KEY as string,
            secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY as string,
        },
    });
    const createUserParams = {
        UserPoolId: process.env.USER_POOL_ID as string,
        Username: username,
        UserAttributes: [
            // Include other required attributes here
            // Example:
            // { Name: 'email', Value: 'user_email' },
            // { Name: 'email_verified', Value: 'true' },
        ],
        MessageAction: MessageActionType.SUPPRESS, // Optional: Use if you don't want to send an email
    };

    try {
        const createUserResponse = await cognito.adminCreateUser(createUserParams);

        // console.log("createUserResponse: ", createUserResponse)
        console.log("username: ", username)

        const setPasswordParams = {
            UserPoolId: process.env.USER_POOL_ID as string,
            Username: username,
            Password: password,
            Permanent: true,
        };
        const setPasswordResponse = await cognito.adminSetUserPassword(setPasswordParams);

        if (!setPasswordResponse) {
            throw new Error('Failed to set user password');
        }

        const attributes = createUserResponse.User?.Attributes;
        if (!attributes) {
            throw new Error('Failed to retrieve user attributes');
        }
        const subAttribute = attributes.find(attribute => attribute.Name === 'sub');
        const userIDfromCognito = subAttribute ? subAttribute.Value : null;
        if (!userIDfromCognito) {
            throw new Error('Failed to retrieve user ID from Cognito');
        }

        console.log("userIDfromCognito: ", userIDfromCognito)
        console.log("admin: ", admin)
        console.log("username: ", username)

        const userId = await insertUser(username, admin, userIDfromCognito);

        if (!userId) {
            throw new Error('Failed to insert user into the database.');
        }
        logger.log('User created successfully: ', createUserResponse);
        return { success: true, message: 'User registered successfully' };
    } catch (err) {
        console.log(err);
        logger.error('Error creating user: ', err);
        throw err;
    }
}

export async function login(username: string, password: string) {
    logger.info('login()');
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
        logger.info('Attempting to log in user: ', username);
        const data: AdminInitiateAuthCommandOutput = await cognito.adminInitiateAuth(params);
        if (data && data.AuthenticationResult) {
            logger.info('User logged in successfully: ', username);
            return data.AuthenticationResult; // Return the authentication result which contains tokens
        } else {
            logger.error('Authentication failed');
            throw new Error('Authentication failed');
        }
    } catch (err) {
        logger.error('Error logging in: ', err);
        throw err;
    }
}

export function decodeToken(token: string) {
    if (!token) {
        return null;
    }
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string') {
        return null;
    }
    const userIDString = decoded.sub;
    if (!userIDString || typeof userIDString !== 'string') {
        return null;
    }
    // convert the userID to a number
    return userIDString;
}