import express, { Request, Response } from 'express';
import path from 'path';  // Add this import at the top

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets (React app) from the build directory
// Place this before your API routes to ensure they aren't overridden by the catch-all handler
app.use(express.static('/home/ec2-user/react-frontend/build'));

// Use this middleware to parse JSON in request body
app.use(express.json());

// Define your API routes

app.post('/api_login', async (req: Request, res: Response) => {
    try {
        // Your login logic here
        // Use `req.body.username` and `req.body.password` to get the submitted username and password
        res.send({ success: true, message: 'User logged in successfully' });
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
});

// 
app.post('/api_upload', async (req: Request, res: Response) => {
    try {
        res.send({ success: true, message: 'File uploaded successfully' });
    } catch (error) {
        res.status(500).send({ success: false, message: error });
    }
});

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

app.post('/api_get_packages', async (req: Request, res: Response) => {
    // return multiple packages with netscore, package name, package id, package description
    
    try{
        
        const packages = [
            {
                id: 1,
                name: "package1",
                description: "package1 description",
                netscore: 0.5
            },
            {
                id: 2,
                name: "package2",
                description: "package2 description",
                netscore: 0.6
            },
            {
                id: 3,
                name: "package3",
                description: "package3 description",
                netscore: 0.7
            }
        ]
        res.send({ success: true, message: 'Packages retrieved successfully', packages: packages });

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
    console.log(`Server is running on http://localhost:${PORT}`);
});
