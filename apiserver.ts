import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';  // Add this import at the top
import { upload } from './upload';
import { getPackageFamilyID, getPackageFamilyName, getPackageFamilies, getPackagesFromPackageFamily, getPackageDetailsFromPackageFamily, insertUploadedFile, createPackageFamily, getUserIdByCognitoID, deleteUser, clearPackages } from './database';
import { getFamilyID, deleteAllNameVersionsAG, getNameAG, getRatesAG, getPackageFamilyIDAG, getPackageFamilyNameAG, getPackageFamiliesAG, getPackagesFromPackageFamilyAG, getPackageDetailsFromPackageFamilyAG, insertUploadedFileAG, createPackageFamilyAG, getUserIdByCognitoIDAG, deleteUserAG, clearPackagesAG, clearSinglePackageAG, packageRegexAG, getPackageID } from './autograderdatabase';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { register, login, decodeToken } from './user_auth';
import { indexPack, version } from 'isomorphic-git';
import { Credentials } from '@aws-sdk/types';
import * as fs from 'fs';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from './logging_cfg';


const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

const archiver = require('archiver');
// * CONFIGURATION
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('/home/ec2-user/react-frontend/build'));
// app.use(express.static("/Users/mateusz/Desktop/ECE_461/phase2/project-phase2-frontend-mateusz/build"));
app.use(express.json());
const storage = multer.memoryStorage();
const multerUpload = multer({ storage: storage });

// use logger to log all requests
logger.info("Starting server");




// * API ENDPOINTS THESE ARE FINISHED
app.post('/api_login', async (req: Request, res: Response) => {
    try {
        console.log("inside try")
        const authResult = await login(req.body.username, req.body.password);
        if (authResult) {
            res.send({ success: true, message: 'User logged in successfully', token: authResult.IdToken });
        } else {
            res.status(401).send({ success: false, message: 'Authentication failed' });
        }
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send({ success: false, message: error.message });
        }
        else {
            res.status(500).send({ success: false, message: "Error logging in" });
        }
    }
});

app.post('/api_register', async (req: Request, res: Response) => {
    console.log("api_reigster");
    try {
        await register(req.body.username, req.body.password, req.body.admin);
        res.send({ success: true, message: 'User registered successfully' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send({ success: false, message: error.message });
        }
        else {
            res.status(500).send({ success: false, message: "Error registering user" });
        }

    }
});

// CATCH ALL PACKAGE FAMILIES FOR THE USER
app.post('/api_get_package_families', async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).send({ success: false, message: 'No token provided' });
        }
        const decoded = jwt.decode(token);
        if (!decoded || typeof decoded === 'string') {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }
        const sub = decoded.sub;
        if (!sub || typeof sub !== 'string') {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }
        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }

        const packageFamilies = await getPackageFamilies(userID.toString());
        res.send({ success: true, message: 'Package families retrieved successfully', packageFamilies: packageFamilies });
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);

// CREATE A NEW PACKAGE FAMILY AND UPLOAD FIRST PACKAGE
app.post('/api_create', multerUpload.single('zipFile'), async (req: Request, res: Response) => {
    try {
        console.log("api_create");
        if (!req.file) {
            return res.status(400).send({ success: false, message: 'No file uploaded.' });
        }
        console.log("creating a new package family");
        const zipFileBuffer = req.file.buffer;
        const zipFileName = req.body.zipFileName;
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).send({ success: false, message: 'No token provided' });
        }
        // console.log("Token", token);
        const sub = decodeToken(token);
        if (!sub) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }
        const packageFamilyName = req.body.packageFamilyName;
        const packageFamilyID = await createPackageFamily(userID.toString(), packageFamilyName);
        const version = req.body.version;
        const secret = req.body.secret;

        if (!packageFamilyID) {
            res.send({ success: false, message: 'Invalid package family name' });
            return;
        }
        const nameID = ""
        const result = await upload(zipFileBuffer, zipFileName, userID.toString(), packageFamilyID, version, nameID);

        if (result) {
            res.send({ success: true, message: 'File uploaded successfully' });
        } else {
            res.send({ success: false, message: 'File failed to upload' });
        }
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
});

// UPDATE EXISTING PACKAGE IN PACKAGE FAMILY WITH NEW VERSION
// TODO: FINISH THIS
app.post('/api_update_packages', multerUpload.single('zipFile'), async (req: Request, res: Response) => {
    console.log("update function");
    try {
        const zipFile = (req as any).file;
        const zipFileName = req.body.zipFileName;
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).send({ success: false, message: 'No token provided' });
        }
        // console.log("Token", token);
        const sub = decodeToken(token);
        if (!sub) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }
        console.log("Cognito userID", userID);
        console.log(zipFileName);
        const packageFamilyID = req.body.packageFamilyID;
        console.log(packageFamilyID);
        const version = req.body.version;
        console.log(version);
        if (packageFamilyID) {
            console.log(packageFamilyID);
            const nameID = ""
            const result = await upload(zipFile.buffer, zipFileName, userID.toString(), packageFamilyID, version, nameID);
            console.log(result);
            if (result) {
                console.log(result);
                res.send({ success: true, message: 'File updated successfully' });
            } else {
                console.log(result);
                res.send({ success: false, message: 'File updated to upload' });
            }
        } else {
            res.send({ success: false, message: 'Invalid package family name' });
            return;
        }


    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
});

// CATCH ALL PACKAGES IN PACKAGE FAMILY
// TODO: FINISH THIS
app.post('/api_get_packages', async (req: Request, res: Response) => {
    try {
        const packageFamilyID = req.body.data.packageFamilyID;
        const packages = await getPackagesFromPackageFamily(packageFamilyID);
        res.send({ success: true, message: 'Packages retrieved successfully', packages: packages });


    }
    catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);

app.post('/api_get_package_details', async (req: Request, res: Response) => {
    try {
        const packageFamilyID = req.body.data.packageFamilyID;
        const packages = await getPackageDetailsFromPackageFamily(packageFamilyID);
        res.send({ success: true, message: 'Package Details retrieved successfully', packages: packages });

    }
    catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);

app.post('/api_get_package_family_name', async (req: Request, res: Response) => {
    try {
        const packageFamilyID = req.body.data.packageFamilyID;
        const packages = await getPackageFamilyName(packageFamilyID);
        res.send({ success: true, message: 'Package Details retrieved successfully', packages: packages });

    }
    catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);

app.post('/api_reset', async (req: Request, res: Response) => {
    try {
        console.log("inside try")
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).send({ success: false, message: 'No token provided' });
        }
        const sub = decodeToken(token);
        if (!sub) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }
        console.log("Cognito userID", userID);

        const result = await deleteUser(userID.toString());
        if (result) {
            res.send({ success: true, message: 'User deleted successfully' });
        } else {
            res.send({ success: false, message: 'User failed to delete' });
        }
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);

app.post('/api_delete_package_byName', async (req: Request, res: Response) => {
    try {
        const packageFamilyName = req.body.data.familyName;
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).send({ success: false, message: 'No token provided' });
        }
        const sub = decodeToken(token);
        if (!sub) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }
        console.log("Cognito userID", userID);
        const packages = await deleteAllNameVersionsAG(userID.toString(), packageFamilyName);
        res.send({ success: true, message: 'Package Details retrieved successfully', packages: packages });

    }
    catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);
app.post('/api_clear_packages', async (req: Request, res: Response) => {
    try {
        console.log("inside try")
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).send({ success: false, message: 'No token provided' });
        }
        const sub = decodeToken(token);
        if (!sub) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }
        console.log("Cognito userID", userID);

        const result = await clearPackages(userID.toString());
        if (result) {
            res.send({ success: true, message: 'Packages deleted successfully' });
        } else {
            res.send({ success: false, message: 'Packages failed to delete' });
        }
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);

// AUTOGRADER API CALLS
//Packages list WORKS
app.post('/packages', async (req: Request, res: Response) => {
    logger.info("post packages");
    try {
        logger.info("body", req.body);
        logger.info("headers", req.headers);
        const token = req.headers.authorization?.split(' ')[1];
        logger.info("token", token);
        const offset = req.headers.offset;
        if (req.headers.offset == null) {
            const offset = 1;
        }
        if (!token) {
            logger.info("400 { success: false, message: 'No token provided' }");
            return res.status(400).send({ message: 'No token provided' });
        }
        const decoded = jwt.decode(token);
        logger.info("decoded", decoded);
        if (!decoded || typeof decoded === 'string') {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(400).send({ message: 'Invalid token' });
        }
        const sub = decoded.sub;
        logger.info("sub", sub);
        if (!sub || typeof sub !== 'string') {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(400).send({ message: 'Invalid token' });
        }
        const userID = await getUserIdByCognitoID(sub);
        logger.info("userID", userID);
        if (!userID) {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(400).send({ message: 'Invalid token' });
        }

        const packageFamilies = await getPackageFamiliesAG(userID.toString());

        logger.info("200 { success: true, message: 'Package families retrieved successfully', packageFamilies: packageFamilies }");
        res.status(200).send(packageFamilies);
    } catch (error) {
        logger.info("400 { success: false, message: error }");
        res.status(400).send({ message: error });
    }
}
);

//Deletes all packages of the user WORKS
app.delete('/reset', async (req: Request, res: Response) => {
    try {
        logger.info("delete reset");
        logger.info("body", req.body);
        logger.info("headers", req.headers);
        const token = (req.headers['x-authorization'] as string)?.split(' ')[1];
        if (!token) {
            logger.info("400 { success: false, message: 'No token provided' }");
            return res.status(400).send({ message: 'No token provided' });
        }
        const sub = decodeToken(token);
        logger.info("sub", sub);
        if (!sub) {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(400).send({ message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        logger.info("userID", userID);
        if (!userID) {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(401).send({ message: 'Invalid token' });
        }

        const result = await clearPackages(userID.toString());
        logger.info("result", result);
        if (result) {
            logger.info("200 { success: true, message: 'registry is reset' }");
            res.status(200).send();
        } else {
            logger.info("400 { success: false, message: 'registry is not reset' }");
            res.status(400).send({ message: 'registry is not reset' });
        }
    } catch (error) {
        logger.info("400 { success: false, message: error }");
        res.status(400).send({ message: error });
    }
}
);

//get package details WORKS
app.get('/package/:id', async (req: Request, res: Response) => {
    try {
        logger.info("get package/:id");
        logger.info("body", req.body);
        logger.info("headers", req.headers);
        const packageID = await getPackageID(req.params.id)
        const token = req.headers.authorization?.split(' ')[1];
        const offset = req.headers.offset;
        if (req.headers.offset == null) {
            const offset = 1;
        }
        if (!token) {
            logger.info("400 { success: false, message: 'No token provided' }");
            return res.status(401).send({ message: 'No token provided' });
        }
        const decoded = jwt.decode(token);
        if (!decoded || typeof decoded === 'string') {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(401).send({ message: 'Invalid token' });
        }
        const sub = decoded.sub;
        if (!sub || typeof sub !== 'string') {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(401).send({ message: 'Invalid token' });
        }
        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(401).send({ message: 'Invalid token' });
        }
        if (packageID != null) {
            const packages = await getPackageDetailsFromPackageFamilyAG(packageID, userID.toString());
            logger.info("packages", packages);

            const credentials: Credentials = {
                accessKeyId: process.env.COGNITO_ACCESS_KEY!,
                secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY!,
            };

            const client = new S3Client({
                region: 'us-east-2',
                credentials
            });

            const bucketName = 'ece461team';
            const command = new GetObjectCommand({ Bucket: bucketName, Key: packages.data.Content })

            const { Body } = await client.send(command);

            if (!packages) {
                logger.info("404 { success: false, message: 'Package does not exist' }");
                return res.status(404).send({ message: 'Package does not exist' });
            }
            logger.info("200 { success: true, message: 'Package details retrieved successfully', packages: packages }");
            res.status(200).send({ packages });
        }
        else {
            logger.info("packageID is null");

        }
    }
    catch (error) {
        logger.info("500 { success: false, message: error }");
        res.status(500).send({ message: error });
    }
});

//Update package
app.put('/package/:id', multerUpload.single('zipFile'), async (req: Request, res: Response) => {
    try {
        logger.info("put package/:id");
        logger.info("body", req.body);
        logger.info("headers", req.headers);
        const token = (req.headers['x-authorization'] as string)?.split(' ')[1];
        if (!token) {
            logger.info("401 { success: false, message: 'No token provided' }");
            return res.status(401).send({ message: 'No token provided' });
        }
        const sub = decodeToken(token);
        logger.info("sub", sub);
        if (!sub) {
            logger.info("401 { success: false, message: 'Invalid token' }");
            return res.status(401).send({ message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        logger.info("userID", userID);
        if (!userID) {
            logger.info("401 { success: false, message: 'Invalid token' }");
            return res.status(401).send({ message: 'Invalid token' });
        }
        if (!req.body.data.Content) {
            const gitHubLink: string = req.body.data.URL;
            console.log("gitHubLink", gitHubLink);
            const dir: string = '/tmp/test';
            const url: string = gitHubLink;
            const branch: string = 'master';
            const filepath: string = '/tmp/test.zip';
            const githubToken: string | undefined = process.env.GITHUB_TOKEN;

            try {
                // Clone the repository
                await git.clone({
                    fs,
                    http,
                    dir,
                    url,
                    ref: branch,
                    singleBranch: true,
                    depth: 1,
                    onAuth: () => ({ username: githubToken }),
                });

                // Create a zip file of the cloned repository
                const output = fs.createWriteStream(filepath);
                const archive = archiver('zip', { zlib: { level: 9 } });

                output.on('close', async function () {
                    console.log(archive.pointer() + ' total bytes');
                    console.log('Archiver has been finalized and the output file descriptor has closed.');

                    // Read the zip file into a buffer
                    const zipFileBuffer: Buffer = fs.readFileSync(filepath);

                    // Rest of your upload logic
                    const zipFileName: string = "test.zip";
                    const name: string = req.body.metadata.Name;
                    const version: string = req.body.metadata.Version;
                    const nameID: string = req.body.metadata.ID;
                    console.log("nameID", nameID);

                    const familyID = await getFamilyID(nameID);
                    console.log("familyID", familyID);

                    if (familyID != null) {
                        const result = await upload(zipFileBuffer, zipFileName, userID.toString(), familyID, version, nameID, gitHubLink);
                        console.log("result", result);
                        if (result) {
                            logger.info("200 { success: true, message: 'Version is updated' }");
                            res.status(200).send({ message: 'Version is updated' });
                        } else {
                            logger.info("400 { success: false, message: 'Package does not exist' }");
                            res.status(400).send({ message: 'Package does not exist' });
                        }
                    }
                });

                archive.on('error', function (err: Error) {
                    throw err;
                });

                archive.pipe(output);
                archive.directory(dir, false);
                archive.finalize();
            } catch (error) {
                console.error("Error occurred:", error);
                res.status(500).send({ message: 'Internal Server Error' });
            }
        }
        const file = req.body.data.Content;
        const zipFile = Buffer.from(file, 'base64');
        const zipFileName = "test.zip"
        const name = req.body.metadata.Name;
        const version = req.body.metadata.Version;
        const nameID = req.body.metadata.ID;
        console.log("nameID", nameID);
        const familyID = await getFamilyID(nameID);
        console.log("familyID", familyID);
        if (familyID != null) {
            const result = await upload(zipFile, zipFileName, userID.toString(), familyID, version, nameID);
            console.log("result", result);
            if (result) {
                logger.info("200 { success: true, message: 'Version is updated' }");
                res.status(200).send({ message: 'Version is updated' });
            } else {
                logger.info("400 { success: false, message: 'Package does not exist' }");
                res.status(400).send({ message: 'Package does not exist' });
            }
        }


    } catch (error) {
        logger.info("400 { success: false, message: error }");
        res.status(400).send({ message: "There is missing field(s)" });
    }
});

//Delete this version of the package 
app.delete('/package/:id', async (req: Request, res: Response) => {
    try {
        logger.info("delete package/:id");
        logger.info("body", req.body);
        logger.info("headers", req.headers);
        const token = (req.headers['x-authorization'] as string)?.split(' ')[1];
        if (!token) {
            logger.info("400 { success: false, message: 'No token provided' }");
            return res.status(400).send({ message: 'No token provided' });
        }
        const sub = decodeToken(token);
        if (!sub) {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(400).send({ message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(400).send({ message: 'Invalid token' });
        }

        const result = await clearSinglePackageAG(req.params.id);
        if (result) {
            logger.info("200 { success: true, message: 'Package deleted successfully' }");
            res.status(200).send({ message: 'Package deleted successfully' });
        } else {
            logger.info("400 { success: false, message: 'Package does not exist' }");
            res.status(404).send({ message: 'Package does not exist' });
        }
    } catch (error) {
        logger.info("400 { success: false, message: error }");
        res.status(400).send({ message: "There are missing fields" });
    }
}
);

const cloneAndZipRepository = async (gitHubLink: string, filepath: string) => {
    const dir: string = '/tmp/test';
    const url: string = gitHubLink;
    const branch: string = 'master';

    const githubToken: string | undefined = process.env.GITHUB_TOKEN;

    try {
        // Clone the repository
        await git.clone({
            fs,
            http,
            dir,
            url,
            ref: branch,
            singleBranch: true,
            depth: 1,
            onAuth: () => ({ username: githubToken }),
        });

        // Create a zip file of the cloned repository
        const output = fs.createWriteStream(filepath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', async function () {
            console.log(archive.pointer() + ' total bytes');
            console.log('Archiver has been finalized and the output file descriptor has closed.');
        });

        archive.on('error', function (err: Error) {
            throw err;
        });

        archive.pipe(output);
        archive.directory(dir, false);
        archive.finalize();
    } catch (error) {
        console.error("Error occurred:", error);
    }
}


// /package Upload package
app.post('/package', async (req: Request, res: Response) => {
    try {
        logger.info("post package");
        logger.info("body", req.body);
        logger.info("headers", req.headers);
        const token = (req.headers['x-authorization'] as string)?.split(' ')[1];
        if (!token) {
            logger.info("400 { success: false, message: 'No token provided' }");
            return res.status(400).send({ message: 'No token provided' });
        }
        // console.log("Token", token);
        const sub = decodeToken(token);
        logger.info("sub", sub);
        if (!sub) {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(400).send({ message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        logger.info("userID", userID);
        if (!userID) {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(400).send({ message: 'Invalid token' });
        }
        const packageFamilyName = req.body.metadata["Name"]
        const packageFamilyID = await createPackageFamily(userID.toString(), packageFamilyName);
        console.log("packageFamilyID", packageFamilyID);
        logger.info("packageFamilyID", packageFamilyID);
        const version = "1.0";

        if (!packageFamilyID) {
            logger.info("409 { success: false, message: 'Package exists already.' }");
            // res.status(409).send({ message: 'Package exists already.' });
            return res.status(409).send({ message: 'Package exists already.' });
        }
        const nameID = req.body.metadata["ID"]
        const content = req.body.data.Content;

        if (!content) {
            if (!req.body.data.URL) {
                logger.info("400 { success: false, message: 'No file uploaded.' }");
                return res.status(400).send({ message: 'No file uploaded.' });
            }

            const gitHubLink: string = req.body.data.URL;

            // check if github link is not npm link
            if (gitHubLink.includes("npmjs.com/")){

                logger.info("400 { success: false, message: 'No file uploaded.' }");
                return res.status(400).send({ message: 'No file uploaded.' });


                
            }
            console.log("gitHubLink", gitHubLink);
            const dir: string = '/tmp/test';
            const url: string = gitHubLink;
            const branch: string = 'master';
            const filepath: string = '/tmp/test.zip';

            await cloneAndZipRepository(gitHubLink, filepath);

            // Read the zip file into a buffer
            const zipFileBuffer: Buffer = fs.readFileSync(filepath);

            // Rest of your upload logic
            const zipFileName: string = "test.zip";
            const name: string = req.body.metadata.Name;
            const version: string = req.body.metadata.Version;
            const nameID: string = req.body.metadata.ID;
            console.log("nameID", nameID);

            // const familyID = await getFamilyID(nameID); 
            // console.log("familyID", familyID);
            // const familyID = await createPackageFamilyAG(userID.toString(), packageFamilyName);
            const familyID = packageFamilyID

            if (familyID != null) {
                const result = await upload(zipFileBuffer, zipFileName, userID.toString(), familyID, version, nameID, gitHubLink);
                console.log("result", result);
                if (result) {
                    logger.info("200 { success: true, message: 'Version is updated' }");
                    return res.status(200).send({ message: 'Version is updated' });
                } else {
                    logger.info("400 { success: false, message: 'Package does not exist' }");
                    return res.status(400).send({ message: 'Package does not exist' });
                }
            }



        }


        if (!content) {
            if (!req.body.data.URL) {
                logger.info("400 { success: false, message: 'No file uploaded.' }");
                return res.status(400).send({ message: 'No file uploaded.' });
            }
        }

        console.log("creating a new package family");
        logger.info("creating a new package family");
        const binaryString = Buffer.from(content, 'base64').toString('binary');

        const zipFileBuffer = Buffer.from(content, 'base64');
        const zipFileName = "exceptions.zip";


        const result = await upload(zipFileBuffer, zipFileName, userID.toString(), packageFamilyID, version, nameID);

        if (result) {
            logger.info("200 { success: true, message: 'File uploaded successfully' }");
            return res.send({ message: 'File uploaded successfully' });
        } else {
            logger.info("424 { success: false, message: 'Package is not uploaded due to disqualified rating.' }");
            return res.status(424).send({ message: 'Package is not uploaded due to disqualified rating.' });
        }
    } catch (error) {
        logger.info("400 { success: false, message: error }");
        return res.status(400).send({ message: error });
    }
});

//Get Rates Function
app.get('/package/:id/rate', async (req: Request, res: Response) => {
    try {
        logger.info("get package/:id/rate");
        logger.info("req", req);
        logger.info("body", req.body);
        logger.info("headers", req.headers);
        const packageId = await getPackageID(req.params.id)
        console.log("PACKAGEID", packageId);
        logger.info("PACKAGEID", packageId);
        const token = (req.headers['x-authorization'] as string)?.split(' ')[1];
        if (!token) {
            logger.info("400 { success: false, message: 'No token provided' }");
            return res.status(400).send({ message: 'No token provided' });
        }
        // console.log("Token", token);
        const sub = decodeToken(token);
        logger.info("sub", sub);
        if (!sub) {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(400).send({ message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        logger.info("userID", userID);
        if (!userID) {
            logger.info("400 { success: false, message: 'Invalid token' }");
            return res.status(400).send({ message: 'Invalid token' });
        }
        if (packageId != null) {
            const packageFamilyID = await getRatesAG(userID.toString(), packageId);

            if (!packageFamilyID) {
                logger.info("400 { success: false, message: 'Invalid package family name' }");
                res.status(400).send({ message: 'Invalid package family name' });
                return;
            }
            console.log(packageFamilyID);
            logger.info("200 { success: true, message: 'Package family ID retrieved successfully', packageFamilyID: packageFamilyID }");
            return res.status(200).send(packageFamilyID);
        }


    } catch (error) {
        logger.info("500 { success: false, message: error }");
        res.status(500).send({ message: error });
    }
});

// {
//     "User": {
//       "name": "ece30861defaultadminuser",
//       "isAdmin": true
//     },
//     "Secret": {
//       "password": "correcthorsebatterystaple123(!__+@**(A'\"`;DROP TABLE packages;"
//     }
//   }

app.put('/authenticate', async (req, res) => {
    // const { username, password } = req.body;
    if (!req.body.User || !req.body.Secret) {
        logger.info("400 { success: false, message: 'There is missing field(s) in the AuthenticationRequest or it is formed improperly.' }");
        return res.status(400).send({
            message: 'There is missing field(s) in the AuthenticationRequest or it is formed improperly.'
        });
    }
    if (!req.body.User.name || !req.body.Secret.password || !req.body.User.isAdmin) {
        logger.info("400 { success: false, message: 'There is missing field(s) in the AuthenticationRequest or it is formed improperly.' }");
        return res.status(400).send({
            message: 'There is missing field(s) in the AuthenticationRequest or it is formed improperly.'
        });
    }
    const username = req.body.User.name;
    const password = req.body.Secret.password;
    const isAdmin = req.body.User.isAdmin;

    try {
        logger.info("put authenticate");
        logger.info("body", req.body);
        logger.info("headers", req.headers);

        // const token = "bearer eyJraWQiOiJkWUwxS1VuXC9iMVBRRTRxQ1RZMEk1TmNKbjNoZGwyOFRXS2NiVXRrdXd1UT0iLCJhbGciOiJSUzI1NiJ9.eyJvcmlnaW5fanRpIjoiOTBlMDFhNTctODZjMy00MmRjLWFkYTMtMjI0MmFkZGExYzdlIiwic3ViIjoiZjcyOGU0YzktYzk3ZC00ZmY0LTg0NWMtZGQzNmZmYjBiYjg4IiwiYXVkIjoiM283djVmajU1MXN1ZmQzMW5odW4yOWtvcDAiLCJldmVudF9pZCI6IjdhMmEyZGE5LTc0MmEtNDhlNS1hZjY5LTk1NDZhZTI2MWI0MiIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzAyNTgyNjk2LCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0yLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMl83SkdHWEJ5aGwiLCJjb2duaXRvOnVzZXJuYW1lIjoibWF0ZXVzejUwIiwiZXhwIjoxNzAyNTg2Mjk2LCJpYXQiOjE3MDI1ODI2OTYsImp0aSI6IjU0MTc3YmQzLTk4MDktNGUyNC1iOTk0LTA2M2QxYWVmNGYwYiJ9.n8PclSFsTpqH3bSeFj_bAPeuiMvrcSWO-hoWktpUzF27dJSQa524N8eja25Oz9FgkUUUjcw3JHZ8cB5UcSA3_yMWDpHSuLFsr23lAEancoqj-Cbtm59M6F_I0BfgMrLmMxfcTW0FkBUxAgvenqRFPa0fMzWh5wGW0-dIxRJk4louaIQlGElbpZQX3LUF9oPZ5aIKrABngJozczubmUYD08TDSKr-dmBSKzzFTxZNUAKquWDzDtTXWbWu-HMmyS2iEue1pAEY0tWwJ4j6E3zCVwwke2J84gCIJ4eWDmn_MTVXN19Jhzf8FDuo0REcc3Het3Jxae5XysjdEnyJR0c-uQ";

        // return res.send(token);


        if (!username || !password || !isAdmin) {
            logger.info("400 { success: false, message: 'There is missing field(s) in the AuthenticationRequest or it is formed improperly.' }");
            return res.status(400).send({
                message: 'There is missing field(s) in the AuthenticationRequest or it is formed improperly.'
            });
        }
        const authResult = await login(username, password);


        if (authResult) {
            logger.info("200 { success: true, message: 'User logged in successfully', token: authResult.IdToken }");
            // return token as JSON
            const token = authResult.IdToken;
            // create response and add json in header
            res.setHeader('Content-Type', 'application/json');
            return res.send("bearer " + token);

        } else {
            logger.info("401 { success: false, message: 'The user or password is invalid.' }");
            return res.status(401).send({
                message: 'The user or password is invalid.'
            });
        }
    } catch (error) {
        try {
            const signUpResult = await register(username, password, isAdmin);
            if (!signUpResult) {
                logger.info("400 { success: false, message: 'The user already exists.' }");
                throw new Error('The user already exists.');
            }
            console.log("register complete");
            logger.info("register complete");
            const authResult = await login(username, password);
            if (authResult) {
                logger.info("200 { success: true, message: 'User logged in successfully', token: authResult.IdToken }");
                // return token as JSON
                const token = authResult.IdToken;
                // create response and add json in header
                res.setHeader('Content-Type', 'application/json');
                return res.send("bearer " + token);

            }
        } catch (error) {
            logger.info("500 { success: false, message: error }");
            // Respond with a 500 status code for any other errors
            return res.status(500).send({
                message: 'This system does not support authentication.'
            });
        }
    }
});

app.get('/package/byName/:name', async (req: Request, res: Response) => {
    try {

        const packageName = req.params.name // Retrieve the package ID from the URL parameter
        const token = (req.headers['x-authorization'] as string)?.split(' ')[1];
        if (!token) {
            return res.status(400).send({ message: 'No token provided' });
        }
        // console.log("Token", token);
        const sub = decodeToken(token);
        if (!sub) {
            return res.status(400).send({ message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            return res.status(400).send({ message: 'Invalid token' });
        }
        const packageHistory = await getNameAG(userID.toString(), packageName);

        if (!packageHistory) {
            res.status(400).send({ message: 'Invalid' });
            return;
        }
        console.log(packageHistory);
        return res.status(200).send(packageHistory);

    } catch (error) {
        res.status(500).send({ message: error });
    }
});

// Delete all packages with this name
app.delete('/package/byName/:name', async (req: Request, res: Response) => {
    try {
        const packageName = req.params.name // Retrieve the package ID from the URL parameter
        console.log(packageName);
        const token = (req.headers['x-authorization'] as string)?.split(' ')[1];
        if (!token) {
            return res.status(400).send({ message: 'No token provided' });
        }
        // console.log("Token", token);
        const sub = decodeToken(token);
        if (!sub) {
            return res.status(400).send({ message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            return res.status(400).send({ message: 'Invalid token' });
        }
        const result = await deleteAllNameVersionsAG(userID.toString(), packageName);
        if (result) {
            res.status(200).send({ message: 'Package is deleted' });
            return;
        }
        if (!result) {
            res.status(400).send({ message: 'Invalid' });
            return;
        }

    } catch (error) {
        res.status(500).send({ message: error });
    }
});
// Search for a package using regular expression over package names and READMEs
app.post('/package/byRegEx', async (req: Request, res: Response) => {
    try {
        const regex = req.body.RegEx;

        const token = (req.headers['x-authorization'] as string)?.split(' ')[1];
        if (!token) {
            return res.status(400).send({ message: 'No token provided' });
        }
        // console.log("Token", token);
        const sub = decodeToken(token);
        if (!sub) {
            return res.status(400).send({ message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            return res.status(400).send({ message: 'Invalid token' });
        }
        const packages = await packageRegexAG(userID.toString(), regex);

        if (packages.length === 0) {
            return res.status(404).send({ message: 'No packages found' });
        }

        return res.status(200).send(packages);

    } catch (error) {
        res.status(500).send({ message: error });
    }
});


// Catch all handler to serve index.html for any request that doesn't match an API route
// This should come after your API routes

// * SERVE FRONTEND

app.get('*', (req, res) => {
    const indexPath = path.resolve(__dirname, '/home/ec2-user/react-frontend/build/index.html');
    // const indexPath = path.resolve(__dirname, "/Users/mateusz/Desktop/ECE_461/phase2/project-phase2-frontend-mateusz/build/index.html");
    res.sendFile(indexPath);
});

// Start the server
app.listen(PORT, () => {
    console.log(process.env.DB_HOST)
    console.log(`Server is running on http://localhost:${PORT}`);
});

