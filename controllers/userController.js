import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';


const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET);
}

// route for user login
const loginUser = async (req,res) => {
    try {
        const {email, password} = req.body;
        const user = await userModel.findOne({email});

        if (!user) {
            return res.json({success: false, message: "User not found"});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = createToken(user._id);
            res.status(200).json({success: true, message: "User logged in successfully", token});
        } else {
            res.json({success: false, message: "Invalid credentials"});
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: error.message});
        
    }


}

// route for user register
const registerUser = async (req,res) => {
    try {
        const {name, email, password} = req.body;

        // check if user already exists or not
        const exists = await userModel.findOne({email});
        if (exists) {
            return res.json({success: false, message: "User already exists"});
        }

        // validate email format 
        if (!validator.isEmail(email)) {
            return res.json({success: false, message: "Invalid email format"});
        }

        if (password.length < 8) {
            return res.json({success: false, message: "Please enter a password of atleast 8 characters"});
        }

        // hash user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create new user
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });
        const user = await newUser.save();

        const token = createToken(user._id);
        res.status(200).json({success: true, message: "User registered successfully", token});

    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: error.message});
    }
}

// route for admin register
const adminLogin = async (req,res) => {

try {
    const {email, password} = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(email+password, process.env.JWT_SECRET);
        res.status(200).json({success: true, token});
    } else {
        res.json({success: false, message: "Invalid credentials"});
    }
} catch (error) {
    console.error(error);
    res.status(500).json({success: false, message: error.message});
}

}


export {loginUser, registerUser, adminLogin}