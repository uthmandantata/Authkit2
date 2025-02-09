import mongoose from "mongoose";

const connect = async () => {
    try {
        console.log("Attempting to connect to db....");
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`Database Connected: ${conn.connection.host}`)

    } catch (error) {
        console.log("Failed to connect to db....", error.message);
        process.exit(1);
    }
}

export default connect;
