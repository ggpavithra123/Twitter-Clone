//import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
//import { v2 as cloudinary } from "cloudinary";
import cloudinary from "../config/cloudinary.js";

export const createPost = async (req, res) => {
  try {

    console.log("===== CREATE POST START =====");

    const { text } = req.body;
    let { img } = req.body;

    console.log("Request body:", req.body);
    console.log("Image received:", img ? "YES" : "NO");

    console.log("User from token:", req.user);

    const userId = req.user._id.toString();
    console.log("User ID:", userId);

    // Check ENV variables
    console.log("Cloudinary ENV CHECK:");
    console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
    console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET);

    const user = await User.findOne({ _id: userId });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    if (!text && !img) {
      console.log("Post content empty");
      return res.status(400).json({ message: "Post content cannot be empty" });
    }

    // Upload image
    if (img) {

      console.log("Uploading image to Cloudinary...");

      const uploadResponse = await cloudinary.uploader.upload(img);

      console.log("Cloudinary response:", uploadResponse);

      img = uploadResponse.secure_url;

      console.log("Uploaded image URL:", img);
    }

    const newPost = new Post({
      user: userId,
      text,
      img
    });

    console.log("Saving post to database...");

    await newPost.save();

    console.log("Post saved successfully:", newPost);

    res.status(201).json({
      message: "Post created successfully",
      post: newPost
    });

  } catch (error) {

    console.log("===== CREATE POST ERROR =====");
    console.log("Error:", error);
    console.log("Error message:", error.message);
    console.log("Stack:", error.stack);

    res.status(500).json({
      message: "Internal Server error",
      error: error.message
    });
  }
};

export const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.user.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "You are not authorized to delete this post" });
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.log("Error in deletePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const commentOnPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;

		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}
		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const comment = { user: userId, text };

		post.comments.push(comment);
		await post.save();

		res.status(200).json(post);
	} catch (error) {
		console.log("Error in commentOnPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const likeUnlikePost = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id: postId } = req.params;

		const post = await Post.findById(postId);

        console.log("Post found: ", post);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

			const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
			res.status(200).json(updatedLikes);
		} else {
			// Like post
			post.likes.push(userId);
			await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
			await post.save();

			const notification = new Notification({
				from: userId,
				to: post.user,
				type: "like",
			});
            console.log("Notification to be saved: ", notification);    
			await notification.save();

			const updatedLikes = post.likes;
            console.log("Updated likes after liking: ", post.likes);
			res.status(200).json(updatedLikes);
		}
	} catch (error) {
		console.log("Error in likeUnlikePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getAllPosts = async (req, res) =>{
    try{
        const posts = await Post.find().populate("user", "-password").populate("comments.user", "-password").sort({createdAt: -1});
        if (posts.length === 0) {
			return res.status(200).json([]);
		}
        res.status(200).json(posts);
    } catch(error){
        console.log(`Error in getAllPosts controller: ${error}`);
        res.status(500).json({ message: "Internal Server error" });
    }
}

export const getLikedPosts = async (req, res) => {
	const userId = req.params.id;
	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(likedPosts);
	} catch (error) {
		console.log("Error in getLikedPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getFollowingPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const following = user.following;

		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;
        console.log("Fetching posts for username: ", username);
		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
