const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes'); // Ensure this path is correct
const { connectToSocket } = require('./controllers/socketManager'); // Ensure this path is correct

const app = express();
const server = http.createServer(app);
const io = connectToSocket(server);

// CORS setup
const corsOptions = {
    origin: 'http://localhost:3001', // frontend URL 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Enable if using cookies or authentication
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); // Apply CORS middleware with options

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: '40kb' }));
app.use(express.urlencoded({ limit: '40kb', extended: true }));

// API routes for user-related operations
app.use('/api/v1/users', userRoutes);

// MongoDB connection
const start = async () => {
    try {
        const connectionDb = await mongoose.connect('mongodb://127.0.0.1:27017/VidyCall', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

        server.listen(app.get('port'), () => {
            console.log(`LISTENING ON PORT ${app.get('port')}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
};

// Start the server and connect to the database
app.set('port', process.env.PORT || 3000);
start();