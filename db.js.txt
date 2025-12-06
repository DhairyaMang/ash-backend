import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "ash_clipping_engine"
    });
    console.log("Backend Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB Error:", err.message);
  }
};
