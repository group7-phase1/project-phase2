import { uploadFile } from "./storage";
import * as readline from 'readline';
import { checkAuthentication } from "./authState";
import { insertUploadedFile, getUserIdByUsername } from "./database";
async function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise<string>((resolve) => 
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        })
    );
}

async function upload() {
    try {
        // if (checkAuthentication() === false) {
        //     console.log('You must be logged in to upload a file. Use "./run login" command to log in.');
        //     return false;
        // }
        // Ask user for file path in terminal
        const filePath = await askQuestion('Enter file path: ');
        const fileName = filePath.split('/').pop() as string;
        // check if file is .zip
        if (!fileName.endsWith('.zip')) {
            console.log('File must be a .zip');
            return false;
        }
        const result = await uploadFile(filePath, fileName);
        
        if (result) {

            const userID = await getUserIdByUsername('romanczug')
            if (userID === null) {
                console.error('Failed to fetch user ID.');
                return false;
            }
            const dbResult = await insertUploadedFile(userID, fileName);
            if (!dbResult) {
                console.error('Failed to update database with uploaded file.');
                return false;
            }
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('An error occurred:', error);
        return false;
    }
}

if (require.main === module) {
    upload();
}


