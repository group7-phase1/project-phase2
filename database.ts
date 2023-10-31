import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: 5432,
    // Add other connection configurations if necessary
});

export async function insertUploadedFile(userID: number, packageName: string, version: string, packageFamilyID: number, zipFileName: string): Promise<boolean> {
    try {
        const query = `
            INSERT INTO packages(package_family_id, package_name, user_id, version, zipped_file)
            VALUES($1, $2, $3, $4, $5)
            RETURNING package_id;
        `;
        const values = [packageFamilyID, packageName, userID, version, zipFileName];
        const result = await pool.query(query, values);
        return !!result.rowCount;
    } catch (error) {
        console.error('Error inserting into database:', error);
        return false;
    }
}

export async function getPackageFamilyID(packageFamilyName: string): Promise<number | null> {
    try {
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

export async function getPackageFamilies(userID: number): Promise<string []> {
    try {
        const query = `
            SELECT package_family_name, package_family_id FROM package_family WHERE user_id = $1;
        `;
        const values = [userID];
        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error retrieving package families:', error);
        return [];
    }
}

export async function getPackagesFromPackageFamily(packageFamilyID: number): Promise<string []> {
    try {
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

export async function closeConnection(): Promise<void> {
    await pool.end();
}

export async function insertUser(username: string): Promise<number | null> {
    try {
        const query = `
            INSERT INTO users(name)
            VALUES($1)
            RETURNING id;
        `;
        const values = [username];
        const result = await pool.query(query, values);
        if (result.rowCount > 0) {
            return result.rows[0].id;  // Return the newly created user's ID
        }
        return null;
    } catch (error) {
        console.error('Error inserting user into database:', error);
        return null;
    }
}

export async function getUserIdByUsername(username: string): Promise<number | null> {
    try {
        const query = `
            SELECT id FROM users WHERE name = $1 LIMIT 1;
        `;
        const values = [username];
        const result = await pool.query(query, values);
        if (result.rowCount > 0) {
            return result.rows[0].id;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user ID:', error);
        return null;
    }
}
