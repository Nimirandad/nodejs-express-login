// Modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Enviroment variable module
require('dotenv').config();

// Variables
const PORT = process.env.PORT;
const app = express();
const db = process.env.MONGODB_URL

// Schema
const User = require('./models/user');
const { auth } = require('./middlewares/authentication');

// Body parser and Cookie parser config
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Database connection
mongoose.Promise = global.Promise;
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err) => {
    if (err) console.log(err);
    console.log('Database connected');
});

// Running App
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});

/* App's Routes */
// Testing route
app.get('/', (req, res) => {
    res.status(200).json({ message: "Hello World" });
});

// Sign up User
app.post('/api/signup', (req, res) => {
    const newUser = new User(req.body);

    User.findOne({ email: newUser.email }, (err, user) => {
        if (user) return res.status(400).json({ auth: false, message: "email already exists" });

        newUser.save((err, doc) => {
            if (err) {
                console.log(err);
                return res.status(400).json({ success: false });
            }
            res.status(200).json({
                succes: true,
                user: doc
            });
        });
    });
});

// Login User
app.post('/api/login', (req, res) => {
    const token = req.cookies.auth;
    User.findByToken(token, (err, user) => {
        if (err) return res(err);
        if (user) return res.status(400).json({
            error: true,
            message: "You are already logged in"
        });

        else {
            User.findOne({ 'email': req.body.email }, function (err, user) {
                if (!user) return res.status(401).send({ isAuth: false, message: "Auth failed, email not found" });

                user.comparePassword(req.body.password, (err, isMatch) => {
                    if (!isMatch) return res.status(401).send({ isAuth: false, message: "Password doesn't match" });

                    user.generateToken((err, user) => {
                        if (err) return res.status(401).send(err);
                        res.cookie('auth', user.token).json({
                            isAuth: true,
                            id: user._id,
                            email: user.email,
                            token: user.token
                        });
                    });
                });
            });
        }
    });
});

// Logout User
app.get('/api/logout', auth, (req, res) => {
    req.user.deleteToken(req.token, (err, user) => {
        if (err) return res.status(400).send(err);

        res.status(200).send({ success: true });
    });
});

// Get all users
app.get('/api/users', auth, (req, res) => {
    User.find((err, users) => {
        if (err) return res.status(400).send(err);

        res.json(users);
    });
});