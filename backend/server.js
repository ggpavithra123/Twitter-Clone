import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

import connectDB from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// =========================
// CLOUDINARY CONFIG
// =========================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =========================
// MIDDLEWARE
// =========================

// Allow frontend to send cookies
app.use(
  cors({
    origin: ["http://localhost:3000","https://twitter-1nvn.vercel.app/","https://twitter-3yrj.vercel.app/"],
    credentials: true,
  })
);

// Parse JSON body
app.use(express.json({ limit: "50mb" }));
// Parse cookies
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));




// =========================
// ROUTES
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Hello, backend is running!");
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  connectDB();
});
