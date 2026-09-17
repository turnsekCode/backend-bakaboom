import mongoose from "mongoose";

const connectDB = async () => {
    mongoose.connection.on("connected", () => {
        console.log("MongoDB Connected:", mongoose.connection.name);
    });

    mongoose.connection.on("error", (error) => {
        console.error("MongoDB Error:", error);
    });

    await mongoose.connect(process.env.MONGODB_URI);
};

export default connectDB;