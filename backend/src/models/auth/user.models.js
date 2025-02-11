import mongoose, { mongo } from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide your name"],
    },
    email: {
        type: String,
        required: [true, "Please provide your email"],
        unique: true,
        trim: true,
        match: [/^([\w\.-]+@([\w-]+\.)+[a-zA-Z]{2,4})$/, "Please add a valid email"]
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
    },
    photo: {
        type: String,
        default: "logo.png"
    },
    bio: {
        type: String,
        default: "I am a new user.",
    },
    role: {
        type: String,
        enum: ["user", "admin", "creator"],
        default: "user"
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true, minimize: true }
);

const User = mongoose.model("User", UserSchema);

export default User;