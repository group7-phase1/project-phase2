import { uploadFile } from "./storage";
import * as readline from 'readline';
import { checkAuthentication } from "./authState";
import { insertUploadedFile, getUserIdByUsername } from "./database";

export async function upload(zipFilePath: string, zipFileName: string, userID: number, packageFamilyID: number): Promise<boolean> {
    try {
        if (!zipFileName.endsWith('.zip')) {
            console.log('File must be a .zip');
            return false;
        }
        const result = await uploadFile(zipFilePath, zipFileName);
        
        if (result) {
            const [packageName, version] = zipFileName.replace('.zip', '').split('_');
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


