import asyncHandler from "express-async-handler"
import jwt from "jsonwebtoken";
import User from "../models/auth/user.models.js";

export const protect = asyncHandler(async (req, res, next) => {
    try {
        // check if user is logged in
        const token = req.cookies.token;

        if (!token) {
            // 401 Unauthorized
            res.status(401).json({ message: "Not authorized, please login!" })
        }

        // verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // get user details from the token
        const user = await User.findById(decoded.id).select("-password")

        // check if user exists
        if (!user) {
            res.status(404).json({ message: "User not found!" })
        }

        // set user details in the request object
        req.user = user;

        next();
    } catch (error) {
        // 401 Unauthorized
        res.status(401).json({ message: "Not authorized, please login!" })
    }
});


// admin middleware
export const adminMiddleware = asyncHandler(async (req, res, next) => {
    try {
        if (req.user && req.user.role === "admin") {
            // if user is admin, move to the next middleware/controller
            next();
            return;
        }
        // if not user is admin, move to the next middleware/controller
        res.status(403).json({ message: "You are not authorized | Only Admin" })

        // next();
    } catch (error) {
        // 401 Unauthorized
        res.status(401).json({ message: "Not authorized!" })
    }
});