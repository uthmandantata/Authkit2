import asyncHandler from "express-async-handler"
import User from "../../models/auth/user.models.js";
import generatedToken from "../../helpers/generateToken.js";
import bcrypt from "bcrypt";




export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // validation
    if (!name || !email || !password) {
        //400 Bad Request
        res.status(400).json({ message: "All fields are required" });
    }

    // check password length
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at 6 characters" });
    }

    // check if user already exists
    const userExists = await User.findOne({ email })

    console.log(userExists)

    if (userExists) {
        //400 Bad Request
        res.status(400).json({ message: "User already exists" });
    }

    // creat new user
    const user = await User.create({
        name,
        email,
        password,
    });

    // generate token with user Id
    const token = generatedToken(user._id)

    // send back the user data and token in the response to the client
    res.cookie("token", token, {
        path: '/',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: true,
        secure: true,
    })

    if (user) {
        const { _id, name, email, role, photo, bio, isVerified } = user;

        // 201 created
        res.status(201).json({
            _id,
            name,
            email,
            role,
            photo,
            bio,
            isVerified,
            token
        });
    } else {
        res.status(400).json({ mesage: "Invalid user data" })
    }

});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
        //400 Bad Request
        res.status(400).json({ message: "All fields are required" });
    }
    // check if user already exists
    const userExists = await User.findOne({ email })

    if (!userExists) {
        //400 Bad Request
        res.status(400).json({ message: "User does not exists, sign up!" });
    }

    // check if the password matches the hashed password in the database
    const isMatch = await bcrypt.compare(password, userExists.password);

    if (!userExists) {
        //400 Bad Request
        res.status(400).json({ message: "Invalid Credentials!" });
    }

    // generate token with user id
    const token = generatedToken(userExists._id);

    if (userExists && isMatch) {
        const { _id, name, email, role, photo, bio, isVerified } = userExists;

        // set the token in the code
        res.cookie("token", token, {
            path: '/',
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: true,
            secure: true,
        });

        // send back the user and token in the response to the client
        res.status(200).json({
            _id,
            name,
            email,
            role,
            photo,
            bio,
            isVerified,
            token
        });
    } else {
        res.status(400).json({ message: "Invalid email or password" })
    }
});

export const logoutsUser = asyncHandler(async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "User logged out" })
});


// get user
export const getUser = asyncHandler(async (req, res) => {
    // get user details from the token -----> exclude password
    const user = await User.findById(req.user._id).select("-password")
    if (user) {
        res.status(200).json(user)
    } else {
        // 404 not found
        res.status(404).json({ message: "ddddddUser not found!" })
    }
});

// update user
export const updateUser = asyncHandler(async (req, res) => {
    // get user details from the token -----> exclude password
    const user = await User.findById(req.user._id)
    if (user) {
        // user properties to update
        const { name, bio, photo } = req.body;

        // update user properties
        user.name = req.body.name || user.name
        user.bio = req.body.bio || user.bio
        user.photo = req.body.photo || user.photo

        const updated = await user.save()

        res.status(200).json({
            _id: updated._id,
            name: updated.name,
            email: updated.email,
            role: updated.role,
            photo: updated.photo,
            bio: updated.bio,
            isVerified: updated.isVerified,
        })
    } else {
        // 404 not found
        res.status(404).json({ message: "Could not update user" })
    }
});