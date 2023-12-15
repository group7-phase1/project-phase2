import { Pool } from 'pg';
import dotenv from 'dotenv';
import { GenerateCalculations } from './calculations';
import { module} from './fileio';
import { logger } from './logging_cfg';

console.log(process.env.DB_HOST)
dotenv.config();
console.log(process.env.DB_HOST)

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: 5432,
    // Add other connection configurations if necessary
});

export async function deleteUser(userID: string): Promise<boolean> {
    const client = await pool.connect();
    try {
        console.log('Deleting user and related data from database...');
        await client.query('BEGIN');
        const deletePackagesQuery = 'DELETE FROM packages WHERE package_family_id IN (SELECT package_family_id FROM package_family WHERE user_id = $1)';
        const deletePackageFamilyQuery = 'DELETE FROM package_family WHERE user_id = $1';
        const deleteUserQuery = 'DELETE FROM users WHERE id = $1';

        await client.query(deletePackagesQuery, [userID]);
        await client.query(deletePackageFamilyQuery, [userID]);
        await client.query(deleteUserQuery, [userID]);
        
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting user and related data from database:', error);
        return false;
    } finally {
        client.release();
    }
}

export async function clearPackages(userID: string): Promise<boolean> {
    const client = await pool.connect();
    try {
        logger.info('Clearing packages from database...');
        console.log('Deleting user and related data from database...');
        await client.query('BEGIN');
        const deletePackagesQuery = 'DELETE FROM packages WHERE package_family_id IN (SELECT package_family_id FROM package_family WHERE user_id = $1)';
        const deletePackageFamilyQuery = 'DELETE FROM package_family WHERE user_id = $1';

        await client.query(deletePackagesQuery, [userID]);
        await client.query(deletePackageFamilyQuery, [userID]);
        await client.query('COMMIT');
        logger.info('Packages cleared from database.');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error deleting user and related data from database:', error);
        console.error('Error deleting user and related data from database:', error);
        return false;
    } finally {
        client.release();
    }
}

export async function updateFamilyScores(packageFamilyID: string, scores: module): Promise<boolean> {
    try {
        console.log('------------------------------------');
        console.log('Updating family scores...');
        console.log(scores);
        const query = `
            UPDATE package_family
            SET bus_factor_score = $1, correctness_score = $2, ramp_up_score = $3, responsive_maintainer_score = $4, license_score = $5, net_score = $6, dependency_pinning_score = $7, code_review_coverage_score = $8
            WHERE package_family_id = $9;
        `;
        const values = [scores.BUS_FACTOR_SCORE, scores.CORRECTNESS_SCORE, scores.RAMP_UP_SCORE, scores.RESPONSIVE_MAINTAINER_SCORE, scores.LICENSE_SCORE, scores.NET_SCORE, scores.DEPENDENCY_PINNING_SCORE, scores.CODE_REVIEW_COVERAGE_SCORE, packageFamilyID];

        const result = await pool.query(query, values);
        if (result.rowCount > 0) {
            return true;
        } else {
            return false;
        }

    } catch (error) {
        console.error('Error updating family scores:', error);
        return false;
    }
}

export async function insertUploadedFile(userID: string, packageName: string, version: string, packageFamilyID: number, zipFileName: string, gitHubLink: string, nameID: string): Promise<boolean> {
//export async function insertUploadedFile(userID: string, packageName: string, version: string, packageFamilyID: number, zipFileName: string): Promise<boolean> {
    try {
        const currModule: module = {
            URL: gitHubLink,
            BUS_FACTOR_SCORE: 0,
            CORRECTNESS_SCORE: 0,
            RAMP_UP_SCORE: 0,
            RESPONSIVE_MAINTAINER_SCORE: 0,
            LICENSE_SCORE: 0,
            NET_SCORE: 0,
            DEPENDENCY_PINNING_SCORE: 0,
            CODE_REVIEW_COVERAGE_SCORE: 0,
        };
        console.log("------------------------------------");
        console.log('Inserting into database...');
        logger.info('Inserting into database...');
        await GenerateCalculations(currModule, false);
        let netScore = 0
        for (const key in currModule) {
            if (currModule.hasOwnProperty(key)) {
                netScore += (currModule as any)[key];
            //   if ((currModule as any)[key] < 0.1) {
            //     logger.error(`Score for ${key} is below 0.5`);
            //     return false;
            //   }
            }
        }
        netScore = netScore / 8;

        if (netScore < 0.1) {
            logger.error(`Net Score is below 0.5`);
            return false;
        }

        currModule.NET_SCORE = netScore;

        console.log("------------------------------------");
        console.log("After GenerateCalculations");
        console.log(currModule);
        // logger.info(currModule);
        const resultScores = updateFamilyScores(packageFamilyID.toString(), currModule);
        if (!resultScores) {
            console.error('Failed to update family scores.');
            return false;
        }
        // console.log(pool);
        const query = `
            INSERT INTO packages(package_family_id, package_name, user_id, version, zipped_file, name_id)
            VALUES($1, $2, $3, $4, $5, $6)
        `;
        const values = [packageFamilyID, packageName, userID, version, zipFileName, nameID];
        const result = await pool.query(query, values);
        // console.log(result);
        logger.info(result);
        if (result.rowCount > 0) {
            return true;
        } else {
            return false;
        }
        
    } catch (error) {
        console.error('Error inserting into database:', error);
        logger.error('Error inserting into database:', error);
        return false;
    }
}

export async function getPackageFamilyID(packageFamilyName: string): Promise<number | null> {
    try {
        // console.log(pool);
        const query = `
            SELECT package_family_id FROM package_family WHERE package_family_name = $1;
        `;
        const values = [packageFamilyName];
        const result = await pool.query(query, values);
        if (result.rows.length > 0) {
            return result.rows[0].package_family_id;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error retrieving package family ID:', error);
        return null;
    }
}

export async function createPackageFamily(userID: string, packageFamilyName: string): Promise<number | null> {
    try {
        // console.log(pool);
        const query = `
            INSERT INTO package_family(user_id, package_family_name)
            VALUES($1, $2)
            RETURNING package_family_id;
        `;
        const values = [userID, packageFamilyName];
        const result = await pool.query(query, values);
        if (result.rowCount > 0) {
            return result.rows[0].package_family_id;
        } else {
            console.error('Error creating package family.');
            return null;
        }
    }
    catch (error) {
        console.error('Error inserting package family into database:', error);
        return null;
    }
}

export async function getPackageFamilies(userID: string): Promise<string []> {
    try {
        // console.log(pool);
        const query = `
            SELECT package_family_name, package_family_id, ramp_up_score, bus_factor_score, correctness_score, responsive_maintainer_score, license_score, net_score, dependency_pinning_score, code_review_coverage_score FROM package_family WHERE user_id = $1;
        `;
        const values = [userID];
        const result = await pool.query(query, values);
        console.log(result.rows);
        return result.rows;
    } catch (error) {
        console.error('Error retrieving package families:', error);
        return [];
    }
}

export async function getPackagesFromPackageFamily(packageFamilyID: number): Promise<string []> {
    try {
        // console.log(pool);
        const query = `
            SELECT package_name FROM packages WHERE package_family_id = $1;
        `;
        const values = [packageFamilyID];
        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error retrieving packages:', error);
        return [];
    }
}

export async function getPackageDetailsFromPackageFamily(packageFamilyID: number): Promise<string []> {
    try {
        // console.log(pool);
        const query = `
            SELECT package_name, version, zipped_file FROM packages WHERE package_family_id = $1;
        `;
        const values = [packageFamilyID];
        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error retrieving packages:', error);
        return [];
    }
}
export async function getPackageFamilyName(packageFamilyID: number): Promise<string []> {
    try {
        // console.log(pool);
        const query = `
        SELECT package_family_name FROM package_family WHERE package_family_id = $1;
        `;
        const values = [packageFamilyID];
        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error retrieving packages:', error);
        return [];
    }
}

export async function closeConnection(): Promise<void> {
    await pool.end();
}

export async function insertUser(username: string, admin: boolean, userIDfromCognito: string): Promise<number | null> {
    try {
        // console.log(pool);
        console.log('Inserting user into database...');
        const query = `
            INSERT INTO users(name, is_admin, cognito_id)
            VALUES($1,$2,$3)
            RETURNING id;
        `;

        const values = [username, admin, userIDfromCognito];
        const result = await pool.query(query, values);
        console.log(result)
        console.log(result.rowCount)
        if (result.rowCount > 0) {
            console.log(result.rows[0].id)
            return result.rows[0].id;  // Return the newly created user's ID
        }
        return null;
    } catch (error) {

        console.error('Error inserting user into database:', error);
        throw error;
        // return null;
    }
}

export async function getUserIdByCognitoID(cognitoID: string): Promise<number | null> {
    try {
        const query = `
            SELECT id FROM users WHERE cognito_id = $1 LIMIT 1;
        `;
        const values = [cognitoID];
        const result = await pool.query(query, values);
        if (result.rowCount > 0) {
            return result.rows[0].id;
        }
        return null;
    }
    catch (error) {
        console.error('Error fetching user ID:', error);
        return null;
    }
}

// export async function deleteUser(username: string, password: string): Promise<boolean> {
//     try {
//         // Validate the username and password
//         //const user = await validateUser(username, password);

//         if (1) {
//             // If the user exists and the password is correct, proceed with deletion
//             const query = `
//                 DELETE FROM users
//                 WHERE name = $1;
//             `;
//             console.log(username);
//             const values = [username];
//             const result = await pool.query(query, values);
//             console.log(result);
//             return true; // User deleted successfully
//         } else {
//             return false; // Invalid username or password
//         }
//     } catch (error) {
//         console.error('Error deleting user from database:', error);
//         return false;
//     }
// }

export async function validateUser(username: string, password: string): Promise<boolean> {
    const query = `
        SELECT * FROM users
        WHERE name = $1
    `;
    const values = [username]; // Note that this does not hash the password
    const result = await pool.query(query, values);
// TODO: NEED TO CHECK FOR PASSWORD
    if (result.rowCount > 0) {
        return true; // Username and password are valid
    }

    return false; // Username or password is invalid
}

// export async function deleteUser(username: string, password: string): Promise<boolean> {
//     try {
//         // Validate the username and password
//         const user = await validateUser(username, password);

//         if (user) {
//             // If the user exists and the password is correct, proceed with deletion
//             const query = `
//                 DELETE FROM users
//                 WHERE username = $1;
//             `;
//             const values = [username];
//             await pool.query(query, values);
//             return true; // User deleted successfully
//         } else {
//             return false; // Invalid username or password
//         }
//     } catch (error) {
//         console.error('Error deleting user from database:', error);
//         return false;
//     }
// }


