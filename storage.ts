import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Credentials } from "@aws-sdk/types";
import * as fs from 'fs';

export async function uploadFile(fileBuffer: Buffer, keyName: string): Promise<boolean> {
  const credentials: Credentials = {
    accessKeyId: process.env.COGNITO_ACCESS_KEY!,
    secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY!,
  };

  const client = new S3Client({
    region: 'us-east-2',
    credentials
  });

  const bucketName = 'ece461team';

  // Setting up S3 upload parameters
  const params = {
    Bucket: bucketName,
    Key: keyName,
    Body: fileBuffer  // Directly use the buffer
  };

  try {
    const result = await client.send(new PutObjectCommand(params));
    console.log(`File uploaded successfully. ETag: ${result.ETag}`);
    return true;
  } catch (err) {
    console.error("Error uploading the file:", err);
    return false;
  }
}
