import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: 5432,
    // Add other connection configurations if necessary
});

export async function insertUploadedFile(userID: number, zipFileName: string): Promise<boolean> {
    try {
        const query = `
            INSERT INTO packages(user_id, zip_filename)
            VALUES($1, $2)
            RETURNING package_id;
        `;
        const values = [userID, zipFileName];
        const result = await pool.query(query, values);
        return !!result.rowCount;
    } catch (error) {
        console.error('Error inserting into database:', error);
        return false;
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
