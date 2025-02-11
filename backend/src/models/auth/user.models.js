import mongoose, { mongo } from "mongoose";
import bcrypt from "bcrypt";

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

// hash the password before saving
UserSchema.pre("save", async function (next) {
    // check if password is not moified
    if (!this.isModified("password")) {
        return next()
    }
    // hash the password ==>  bcrypt
    // generate salt
    const salt = await bcrypt.genSalt(10);
    // hash the password with salt
    const hashedPassword = await bcrypt.hash(this.password, salt);
    // set the password to the hashed password
    this.password = hashedPassword

    // call the next middleware
    next();
})

const User = mongoose.model("User", UserSchema);

export default User;