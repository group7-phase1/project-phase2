// import pgPromise = require('pg-promise');
// // Create an RDS database client using pg-promise
// const pgp = pgPromise();
// const db = pgp({
//   user: 'ece461',
//   password: 'ece461group!',
//   host: 'ece461database.cb1yc4n1pcpo.us-east-2.rds.amazonaws.com',
//   port: 5432,
//   database: 'ece461database',
//   ssl: true, // Enable SSL for secure connections
// });
// const fileName = 'example.zip';
// // Insert the file name into the database
// db.none('INSERT INTO file_names (name) VALUES($1)', [fileName])
//   .then(() => {
//     console.log('File name inserted successfully.');
//   })
//   .catch((error) => {
//     console.error('Error inserting file name:', error);
//   });
var Pool = require('pg').Pool;
// Configure the PostgreSQL connection
var pool = new Pool({
    user: 'ece461',
    host: 'ece461database.cb1yc4n1pcpo.us-east-2.rds.amazonaws.com',
    database: 'ece461database',
    password: 'ece461group',
    port: 5432, // PostgreSQL default port
});
// Attempt to connect to the database
pool.connect()
    .then(function () {
    console.log('Connected to the PostgreSQL database');
    // Perform database operations here
    // Example query:
    pool.query('SELECT * FROM your_table', function (err, res) {
        if (err) {
            console.error('Error executing query:', err);
        }
        else {
            console.log('Query result:', res.rows);
        }
        // Don't forget to release the client when done
        pool.end();
    });
})
    .catch(function (err) {
    console.error('Error connecting to the database:', err);
});
