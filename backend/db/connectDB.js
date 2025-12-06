import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("MONGO_URI =", "mongodb+srv://ggpavi12_db_user:ZWaAjtMP8xtUnVjt@twitter.wz0qn89.mongodb.net/twitter-clone");
    await mongoose.connect("mongodb+srv://ggpavi12_db_user:ZWaAjtMP8xtUnVjt@twitter.wz0qn89.mongodb.net/twitter-clone");
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error(`MongoDB connection failed:", ${error.message}`);
    process.exit(1);
  }
};
export default connectDB;
