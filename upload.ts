import { uploadFile } from "./storage";
import * as readline from 'readline';
import { checkAuthentication } from "./authState";
import { insertUploadedFile, getUserIdByCognitoID} from "./database";
import { unzipFile, fileExists, extractGitHubLink } from "./metric2utils";
import fs from 'fs-extra';

export async function upload(fileBuffer: Buffer, zipFileName: string, userID: string, packageFamilyID: number, version: string ): Promise<boolean> {
    try {
        if (!zipFileName.endsWith('.zip')) {
            console.log('File must be a .zip');
            return false;
        }

        // Unzip the file
        const directory = await unzipFile(fileBuffer);

        console.log('Unzipped to:', directory);

        // Check for package.json

        const packageJsonPath = `${directory}/${zipFileName.replace('.zip', '')}/package.json`;
        console.log('packageJsonPath:', packageJsonPath);
        if (!await fileExists(packageJsonPath)) {
            console.error('package.json not found.');
            return false;
        }

        // Read and parse package.json
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        
        // Extract GitHub link
        const gitHubLink = extractGitHubLink(packageJson);
        if (!gitHubLink) {
            console.error('GitHub link not found in package.json');
            return false;
        }

        console.log('GitHub link:', gitHubLink);

        const result = await uploadFile(fileBuffer, zipFileName);
        
        if (result) {
            const packageName = zipFileName.replace('.zip', '')
            if (!userID) {
                console.error('Failed to retrieve user ID from database.');
                return false;
            }
            const dbResult = await insertUploadedFile(userID, packageName, version, packageFamilyID, zipFileName, gitHubLink);
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


