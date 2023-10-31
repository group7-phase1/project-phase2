import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';  // Add this import at the top
import { upload } from './upload';
import { getPackageFamilyID, getPackageFamilies, getPackagesFromPackageFamily } from './database';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// app.use(express.static('/home/ec2-user/react-frontend/build'));
app.use(express.json());

const storage = multer.memoryStorage();
const multerUpload = multer({ storage: storage });

app.post('/api_login', async (req: Request, res: Response) => {
    try {
        // Your login logic here
        // Use `req.body.username` and `req.body.password` to get the submitted username and password
        res.send({ success: true, message: 'User logged in successfully' });
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
});

/**
 * Function to upload a zip file to the server
 * @param {Buffer} zipFile - The zip file to be uploaded
 * @param {string} zipFileName - The name of the zip file
 * @param {string} userID - The ID of the user
 * @param {string} packageFamilyID - The package family ID
 * @returns {boolean} - Whether the file was uploaded successfully
 */
app.post('/api_upload', multerUpload.single('zipFile'), async (req: Request, res: Response) => {
    try {
        const zipFile = (req as any).file;
        const zipFileName = req.body.zipFileName;
        const userID = req.body.userID;
        const packageFamilyID = req.body.packageFamilyID;
        const result = await upload(zipFile.buffer, zipFileName, userID, packageFamilyID);

        if (result) {
            res.send({ success: true, message: 'File uploaded successfully' });
        } else {
            res.send({ success: false, message: 'File failed to upload' });
        }
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
});

/**
 * API endpoint to upload a zip file
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {Buffer} zipFile - The zip file to be uploaded
 * @param {string} zipFileName - The name of the zip file
 * @param {string} userID - The ID of the user
 * @param {string} packageFamilyName - The name of the package family
 * @returns {Object} - An object containing the success status and message
 */
app.post('/api_create', multerUpload.single('zipFile'), async (req: Request, res: Response) => {
    try {
        const zipFile = (req as any).file;
        const zipFileName = req.body.zipFileName;
        const userID = req.body.userID;
        const packageFamilyName = req.body.packageFamilyName;
        const packageFamilyID = await getPackageFamilyID(packageFamilyName);

        if (!packageFamilyID) {
            res.send({ success: false, message: 'Invalid package family name' });
            return;
        }

        const result = await upload(zipFile.buffer, zipFileName, userID, packageFamilyID);

        if (result) {
            res.send({ success: true, message: 'File uploaded successfully' });
        } else {
            res.send({ success: false, message: 'File failed to upload' });
        }
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
});

/**
 * API endpoint to get package families for a user
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @returns {Object} - Object containing success status, message and package families
 */
app.post('/api_get_package_families', async (req: Request, res: Response) => {
    try {
        const userID = req.body.userID;
        const packageFamilies = await getPackageFamilies(userID);
        res.send({ success: true, message: 'Package families retrieved successfully', packageFamilies: packageFamilies });
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);

/**
 * API endpoint to get packages from a package family
 * @route POST /api_get_packages
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} - Response object containing success status and packages
 */
app.post('/api_get_packages', async (req: Request, res: Response) => {
    try {
        const packageFamilyID = req.body.packageFamilyID;
        const packages = await getPackagesFromPackageFamily(packageFamilyID);
        res.send({ success: true, message: 'Packages retrieved successfully', packages: packages });


    }
    catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}
);


app.post('/api_register', async (req: Request, res: Response) => {
    try {
        // Your register logic here
        // Use `req.body.username` and `req.body.password` to get the submitted username and password
        res.send({ success: true, message: 'User registered successfully' });

    }
    catch (error) {
        res.status(500).send({ success: false, message: error });
    }
}

);

// app.post("/register")

// Catch all handler to serve index.html for any request that doesn't match an API route
// This should come after your API routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/home/ec2-user/react-frontend/build', 'index.html'));
});


// Start the server
app.listen(PORT, () => {
    console.log(process.env.DB_HOST)
    console.log(`Server is running on http://localhost:${PORT}`);
});



