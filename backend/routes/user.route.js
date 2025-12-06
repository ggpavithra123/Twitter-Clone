import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  getUserProfile,
  followUnFollowUser,
  getSuggestedUsers,
  updateUser,
  
} from "../controllers/user.controller.js";
import { commentOnPost } from "../controllers/post.controller.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.post("/follow/:id", protectRoute, followUnFollowUser);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/update",protectRoute,updateUser);


export default router;
