import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import * as dotenv from "dotenv";
import { logger } from './logging_cfg';
import * as readline from 'readline';
import { insertUser } from './database';
const fs = require('fs');
dotenv.config();
import { setAuthenticationState, checkAuthentication, getUsername } from './authState';

function login() {
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
        
                const userId = await insertUser(params.Username);
                if (!userId) {
                    console.error('Failed to insert user into the database.');
                    return;
                }
        
                setAuthenticationState(true, params.Username);
                logger.log('User created successfully: ', data);
            } catch (err) {
                console.log(err);
                logger.error('Error creating user: ', err);
            }
    
            rl.close();
        });
    });
    
}

function logout() {
    setAuthenticationState(false, '');
    console.log('User logged out');
}

if (require.main === module) {
    const command = process.argv[2];
    if (command === 'login') {
      login();
    } else if (command === 'logout') {
      logout();
    } else {
      console.log('Invalid command. Use "login" or "logout".');
    }
  }

  
  
  
  