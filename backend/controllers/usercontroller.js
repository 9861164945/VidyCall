const httpStatus = require('http-status');
const { User } = require('../models/usermodel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Meeting } = require('../models/meetingmodel');

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please Provide Username and Password" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            const token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or Password" });
        }
    } catch (e) {
        console.error('Error during login:', e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    console.log('Register Request:', { name, username, password });

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('User already exists:', username);
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            password: hashedPassword
        });

        await newUser.save();

        console.log('User Registered:', username);
        return res.status(httpStatus.CREATED).json({ message: "User Registered" });
    } catch (e) {
        console.error('Error during registration:', e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    console.log('Get User History Request:', { token });

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const meetings = await Meeting.find({ user_id: user.username });
        return res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        console.error('Error fetching user history:', e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    console.log('Add to History Request:', { token, meeting_code });

    try {
        const user = await User.findOne({ token });
        if (!user) {
            console.log('User not found:', token);
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();

        console.log('Meeting Added:', meeting_code);
        return res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        console.error('Error adding to history:', e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

module.exports = { login, register, getUserHistory, addToHistory };
