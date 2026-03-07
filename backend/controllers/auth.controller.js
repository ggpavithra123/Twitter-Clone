import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    if (!username || !fullName || !email || !password)
      return res.status(400).json({ error: "Please enter all fields" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: "Invalid email" });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ error: "Email already exists" });

    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ error: "Username already exists" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password too short" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    generateTokenAndSetCookie(newUser._id, res);

    return res.status(200).json({
      _id: newUser._id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      followers: newUser.followers,
      following: newUser.following,
      profileImg: newUser.profileImg,
    });
  } catch (error) {
    console.log("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ error: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid username or password" });

    generateTokenAndSetCookie(user._id, res);

    return res.status(200).json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      profileImg: user.profileImg,
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const logout = (req, res) => {
  res.cookie("jwt", "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });

  res.status(200).json({ message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.log("getMe error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
