import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { fileURLToPath } from "url";
import path from "path";

// =========================
// __dirname fix for ES module
// =========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// =========================
// LOAD ENV FILE
// =========================
dotenv.config({ path: path.join(__dirname, ".env") });

import connectDB from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("ENV CHECK:");
console.log("CLOUD NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API KEY:", process.env.CLOUDINARY_API_KEY);
console.log("API SECRET:", process.env.CLOUDINARY_API_SECRET);

const app = express();
const PORT = process.env.PORT || 3002;

app.use(
  cors({
    origin: ["http://localhost:3000", "https://twitter-clone-delta-eight-50.vercel.app", "https://twitter-3yrj.vercel.app/"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
