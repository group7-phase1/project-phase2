import { uploadFile } from "./storage";
import * as readline from 'readline';
import { checkAuthentication } from "./authState";
import { insertUploadedFile, getUserIdByCognitoID} from "./database";

export async function upload(fileBuffer: Buffer, zipFileName: string, userID: string, packageFamilyID: number, version: string ): Promise<boolean> {
    try {
        if (!zipFileName.endsWith('.zip')) {
            console.log('File must be a .zip');
            return false;
        }
        const result = await uploadFile(fileBuffer, zipFileName);
        
        if (result) {
            const packageName = zipFileName.replace('.zip', '')
            if (!userID) {
                console.error('Failed to retrieve user ID from database.');
                return false;
            }
            const dbResult = await insertUploadedFile(userID, packageName, version, packageFamilyID, zipFileName);
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


