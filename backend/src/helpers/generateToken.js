import jwt from "jsonwebtoken";


// use user id to generate token
const generatedToken = (id) => {
    // token must be returned to the client
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

export default generatedToken;

// Path