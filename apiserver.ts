import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

