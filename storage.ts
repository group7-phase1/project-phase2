import express from 'express';
import * as aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import * as path from 'path';

const app = express();
const port = 3000;

// Configure AWS SDK
aws.config.update({
  accessKeyId: 'COGNITO_ACCESS_KEY',
  secretAccessKey: 'COGNITO_SECRET_ACCESS_KEY',
  region: 'REGION',
});

const s3 = new aws.S3();

// Create an S3 bucket for package storage
const bucketName = 'ece461team';

// Configure Multer to upload files to S3
const upload = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    acl: 'private-read', // or 'private' for private access
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueFilename = Date.now() + ext;
      cb(null, uniqueFilename);
    },
  }),
});

// Set up a POST endpoint for package uploads
app.post('/upload', upload.single('package'), (req, res) => {
  res.status(200).send('Package uploaded successfully.');
});

// ...

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
