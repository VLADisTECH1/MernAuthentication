// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const secretKey = 'IMSOSICKOFTHIS';
require('dotenv').config();

const app = express();
const PORT = 6969; 

// Middleware
app.use(cors());
app.use(express.json());

// Load environment variables
const mongoDataBase = process.env.DATABASE;

// Connect to MongoDB Atlas
mongoose
    .connect(mongoDataBase, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Connected to MongoDB Atlas');
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB Atlas', error);
    });

// Mongoose Schema
const userObject = new mongoose.Schema({
    username: String,
    role: String,
    password: String,
    salt: String,
});

const User = mongoose.model('User', userObject);

// Routes
// Generate Salt to return to client
app.post('/auth/salt', async (req, res) => {
    try {
        const { username } = req.body;

        // Generate a unique salt
        const salt = generateSalt();

        // Send the salt back to the client
        res.status(200).json({ salt });


    } catch (error) {
        console.error('Error generating salt', error);
        res.status(500).json({ error: 'An error occurred while generating salt' });
    }
});

// Add user to server
app.post('/auth/users', async (req, res) => {
    try {
        const { username, role, password, salt } = req.body;

        // Create a new user
        const newUser = new User({
            username,
            role,
            password,
            salt,
        });

        // Save the user to the database
        await newUser.save();

        res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user', error);
        res.status(500).json({ error: 'An error occurred while registering user' });
    }
});

//LOGIN
app.post('/auth/ULogin', async (req, res) => {
    try {
        const { username } = req.body;

        //findOne searches throught the Database for a username
        const user = await User.findOne({ username });
        console.log("Getting username" + {username});

        if (!user) {
            //No user in the database
            console.log("USER IS NOT IN THE DATABASE")
            return res.status(401).json({ error: 'USER IS NOT IN THE DATABASE' });
        }

        //Salt send to Client App
        const userSalt = user.salt;
        res.status(200).json({ userSalt });;


    } catch (error) {
        console.error('Error during username login', error);
        res.status(500).json({ error: 'An error occurred during username login' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        //Search for existing username
        const user = await User.findOne({ username });

        if (!user) {
            //No user found
            return res.status(401).json({ error: 'Invalid username' });
        }


        // Compare the hashed passwords
        if (password !== user.password) {
            // Passwords don't match
            return res.status(401).json({ error: 'Invalid password' });
        }

        // At this point, the login was successful
        // Generate a session token or JWT and send it back to the client
        const token = generateToken(username); // Implement your token generation logic

        res.cookie('sessionToken', token, { httpOnly: true }); // Set the token in a secure HTTP-only cookie

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error during login', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

app.post('/auth/user-role', async (req, res) => {
    try {
        const { username } = req.body;

        // Find the user in the collection based on the provided username
        const user = await User.findOne({ username });

        if (!user) {
            // User not found
            return res.status(401).json({ error: 'Invalid username' });
        }

        // Send the user's role back to the client
        const userRole = user.role;
        res.status(200).json({ role: userRole });
    } catch (error) {
        console.error('Error during user role retrieval', error);
        res.status(500).json({ error: 'An error occurred during user role retrieval' });
    }
});



// Utility function for generating salt
function generateSalt() {
    const saltLength = 16; // Adjust the length of the salt to your preference

    // Generate a random salt using a cryptographically secure PRNG
    const salt = crypto.randomBytes(saltLength).toString('hex');

    return salt;
}

// Tokens
function generateToken(payload) {
    // Generate a token with the provided payload and secret key
    const token = jwt.sign({username: payload}, secretKey, { expiresIn: '1h' });
    return token;
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
