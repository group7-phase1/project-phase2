import * as AWS from 'aws-sdk';
import * as pgPromise from 'pg-promise';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: 'COGNITO_ACCESS_KEY',
  secretAccessKey: 'COGNITO_SECRET_ACCESS_KEY',
  region: 'REGION',
});

// Create an RDS database client using pg-promise
const pgp = pgPromise();
const db = pgp({
  user: 'ece461team',
  password: 'ece461group!',
  host: 'ece461-phase2.cb1yc4n1pcpo.us-east-2.rds.amazonaws.com',
  port: 5432,
  database: 'ece461-phase2',
});

// File name to insert
const fileName = 'example.txt';

// Insert the file name into the database
db.none('INSERT INTO file_names (name) VALUES($1)', [fileName])
  .then(() => {
    console.log('File name inserted successfully.');
  })
  .catch((error) => {
    console.error('Error inserting file name:', error);
  });
