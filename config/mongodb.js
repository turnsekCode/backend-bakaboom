import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null,
    };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 30000,
            })
            .then((mongoose) => {
                console.log("✅ MongoDB conectado");
                console.log("Base de datos:", mongoose.connection.name);
                return mongoose;
            })
            .catch((error) => {
                cached.promise = null;
                console.error("❌ Error MongoDB:", error);
                throw error;
            });
    }

    cached.conn = await cached.promise;

    return cached.conn;
};

export default connectDB;


/*import mongoose from "mongoose";

const connectDB = async () => {
    mongoose.connection.on("connected", () => {
        console.log("MongoDB Connected:", mongoose.connection.name);
    });

    mongoose.connection.on("error", (error) => {
        console.error("MongoDB Error:", error);
    });

    await mongoose.connect(process.env.MONGODB_URI);
};

export default connectDB; */