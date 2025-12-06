import express from "express";
import { signup, login, logout, getMe } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
const router = express.Router();

// Signup route
// router.get("/signup", (req, res) => {
//   res.send("This is signup route");
// });

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
// ✔ Return logged in user
router.get("/me", protectRoute, (req, res) => {
   res.status(200).json(req.user);
});

export default router;
