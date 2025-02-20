import asyncHandler from "express-async-handler"
import User from "../../models/auth/user.models.js";
import generatedToken from "../../helpers/generateToken.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Token from "../../models/auth/token.models.js";
import crypto from "node:crypto"
import hashToken from "../../helpers/hashToken.js";
import sendEmail from "../../helpers/sendEmail.js";




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

// userLoginStatus
export const userLoginStatus = asyncHandler(async (req, res) => {
    // get user details from the token -----> exclude password
    const token = req.cookies.token
    if (!token) {
        // 401 Unauthorized
        res.status(401).json({ message: "Not authorized, please login!" })
    }

    // verify the token
    const decode = jwt.verify(token, process.env.JWT_SECRET)
    if (decode) {
        res.status(200).json(true)
    } else {
        res.status(401).json(false)
    }
});



// email verification
export const verifyEmail = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id)
    if (!user) {
        res.status(403).json({ message: "Not Verified" })
    }

    // check if user is already verified
    if (user.isVerified) {
        res.status(400).json({ message: "User already Verified" })
    }

    let token = await Token.findOne({ userId: user._id })

    // if token exists --> delete the token
    if (token) {
        await token.deleteOne()
    }

    // create a verification token using the user id -->  
    const verificationToken = crypto.randomBytes(64).toString("hex") + user._id;

    // hash the verification token
    const hashedToken = await hashToken(verificationToken)

    await new Token({
        userId: user._id,
        verificationToken: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 2000, // 24 hours
    }).save();

    // verification link
    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`

    // send email
    const subject = " Email Verification - AuthKit";
    const send_to = user.email;
    const reply_to = "noreply@gmail.com";
    const template = "emailVerification";
    const send_from = process.env.USER_EMAIL;
    const name = user.name;
    const link = verificationLink;

    try {
        await sendEmail(subject, send_to, reply_to, template, send_from, name, link)
        return res.json({ message: "Email sent" })
    } catch (error) {
        console.log("Error sending email: ", error);
        return res.status(500).json({ message: "Email could not be sent" })
    }
});




export const verifyUser = asyncHandler(async (req, res, next) => {
    const { verificationToken } = req.params;

    if (!verificationToken) {
        return res.status(400).json({ message: "Invalid verification token" });
    }
    // hash the verification token --> because it was hashed before saving 
    const hashedToken = hashToken(verificationToken);
    // find user with the verification token
    const userToken = await Token.findOne({
        verificationToken: hashedToken,

        // check if the has not expired
        expiresAt: { $gt: Date.now() },
    });

    if (!userToken) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    // find user with the user id in the token
    const user = await User.findById(userToken.userId);

    if (user.isVerified) {
        // 400 Bad Request
        return res.status(400).json({ message: "User is already verified" });
    }

    // update user to verified
    user.isVerified = true;
    await user.save();
    res.status(200).json({ message: "User verified" })
})

// forgot password
export const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    // check if user exists
    const user = await User.findOne({ email });

    if (!user) {
        // 404 Not Found
        return res.status(404).json({ message: "User not found" });
    }

    // see if reset token exists
    let token = await Token.findOne({ userId: user._id });

    // if token exisits ---> delete the token
    if (token) {
        await token.deleteOne();
    }

    // create a reset token using the user id ---> expires in 1 hour
    const passwordResetToken = crypto.randomBytes(64).toString('hex') + user._id;

    // hash the reset token
    const hashedToken = hashToken(passwordResetToken);

    await Token({
        userId: user._id,
        passwordResetToken: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    }).save();

    // reset link
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${passwordResetToken}`;

    // send email to user
    const subject = "Password Reset - AuthKit";
    const send_to = user.email;
    const reply_to = "noreply@gmail.com";
    const template = "forgotPassword";
    const send_from = process.env.USER_EMAIL;
    const name = user.name;
    const link = resetLink;

    try {
        await sendEmail(subject, send_to, reply_to, template, send_from, name, link)
        return res.json({ message: "Email sent" })
    } catch (error) {
        console.log("Error sending email: ", error);
        return res.status(500).json({ message: "Email could not be sent" })
    }
});