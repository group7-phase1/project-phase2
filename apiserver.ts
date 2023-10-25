import express, { Request, Response } from 'express';
import path from 'path';  // Add this import at the top

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets (React app) from the build directory
// Place this before your API routes to ensure they aren't overridden by the catch-all handler
app.use(express.static(path.join(__dirname, '../my-react-app/build')));

// Use this middleware to parse JSON in request body
app.use(express.json());

// Define your API routes

app.post('/login', async (req: Request, res: Response) => {
    try {
        // Your login logic here
        // Use `req.body.username` and `req.body.password` to get the submitted username and password
        res.send({ success: true, message: 'User logged in successfully' });
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
});

app.post('/upload', async (req: Request, res: Response) => {
    try {
        // Your upload logic here
        res.send({ success: true, message: 'File uploaded successfully' });
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
});

// Catch all handler to serve index.html for any request that doesn't match an API route
// This should come after your API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/home/ec2-user/react-frontend/build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
