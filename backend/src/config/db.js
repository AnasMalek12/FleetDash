import mongoose from "mongoose";

/**
 * Establishes connection to MongoDB database.
 * Handles database connection lifecycle events and logs status to console.
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/fleetdash";

    mongoose.connection.on("connected", () => {
      console.log("💚 MongoDB connected successfully.");
    });

    mongoose.connection.on("error", (err) => {
      console.error(`🔴 MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB connection disconnected.");
    });

    await mongoose.connect(mongoURI);
  } catch (error) {
    console.error(`🔴 Initial MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
