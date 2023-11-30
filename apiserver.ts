import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';  // Add this import at the top
import { upload } from './upload';
import { getPackageFamilyID, getPackageFamilyName, getPackageFamilies, getPackagesFromPackageFamily, getPackageDetailsFromPackageFamily, insertUploadedFile, createPackageFamily, getUserIdByCognitoID, deleteUser, clearPackages } from './database';
import { getPackageFamilyIDAG, getPackageFamilyNameAG, getPackageFamiliesAG, getPackagesFromPackageFamilyAG, getPackageDetailsFromPackageFamilyAG, insertUploadedFileAG, createPackageFamilyAG, getUserIdByCognitoIDAG, deleteUserAG, clearPackagesAG } from './autograderdatabase';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { register, login, decodeToken } from './user_auth';
import { version } from 'isomorphic-git';

// * CONFIGURATION
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('/Users/mahamgodil/Desktop/ece-461/project-phase2-frontend-maham/build'));
app.use(express.json());
const storage = multer.memoryStorage();
const multerUpload = multer({ storage: storage });




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
        console.log("Cognito userID", userID);
        const packageFamilyName = req.body.packageFamilyName;
        console.log("Package Family Name", packageFamilyName);
        const packageFamilyID = await createPackageFamily(userID.toString(), packageFamilyName);
        console.log("packageFamilyID", packageFamilyID);
        const version = req.body.version;
        console.log("Version", version);
        const secret = req.body.secret;
        console.log("Secret", secret);

        if (!packageFamilyID) {
            res.send({ success: false, message: 'Invalid package family name' });
            return;
        }

        const result = await upload(zipFileBuffer, zipFileName, userID.toString(), packageFamilyID, version);

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
            const result = await upload(zipFile.buffer, zipFileName, userID.toString(), packageFamilyID, version);
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
// app.post('/api_reset', async (req: Request, res: Response) => {
//     try {

//         const username = req.body.username;
//         const password = req.body.password;
//         const packages = await deleteUser(username, password);
//         res.send({ success: true, message: 'Account Deleted Successfully', packages: packages });



//     }
//     catch (error) {
//         res.status(500).send({ success: false, message: error });
//     }
// }
// );

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
//Packages list
app.post('/packages', async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const offset = req.headers.offset;
        if(req.headers.offset == null) {
            const offset = 1;
        }
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

        const packageFamilies = await getPackageFamiliesAG(userID.toString());
        res.send({ packageFamilies });
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);

//Deletes all packages of the user
app.post('/reset', async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(400).send({ success: false, message: 'No token provided' });
        }
        const sub = decodeToken(token);
        if (!sub) {
            return res.status(400).send({ success: false, message: 'Invalid token' });
        }

        const userID = await getUserIdByCognitoID(sub);
        if (!userID) {
            return res.status(401).send({ success: false, message: 'Invalid token' });
        }

        const result = await clearPackages(userID.toString());
        if (result) {
            res.status(200).send({ success: true, message: 'Packages deleted successfully' });
        } else {
            res.status(500).send({ success: false, message: 'Packages failed to delete' });
        }
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);

// Catch all handler to serve index.html for any request that doesn't match an API route
// This should come after your API routes

// * SERVE FRONTEND

app.get('*', (req, res) => {
    const indexPath = path.resolve(__dirname, '/Users/mahamgodil/Desktop/ece-461/project-phase2-frontend-maham/build/index.html');
    res.sendFile(indexPath);
});

// Start the server
app.listen(PORT, () => {
    console.log(process.env.DB_HOST)
    console.log(`Server is running on http://localhost:${PORT}`);
});

