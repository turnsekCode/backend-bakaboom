import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI no está definida");
}

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
      .connect(MONGODB_URI, {
        dbName: "bakaboom_bd",
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongoose) => {
        console.log("✅ MongoDB conectado");
        return mongoose;
      })
      .catch((error) => {
        cached.promise = null;

        console.error("❌ Error conectando a MongoDB:");
        console.error(error);

        throw error;
      });
  }

  cached.conn = await cached.promise;

  return cached.conn;
};

export default connectDB;





/*import mongoose from "mongoose";

const connectDB = async () => {

    mongoose.connection.on('connected', ()=> {
        //console.log("DB Connected")
    })

    await mongoose.connect(`${process.env.MONGODB_URI}/bakaboom_bd`)
}

export default connectDB; */