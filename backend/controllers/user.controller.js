import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notification.model.js";

export const getUserProfile = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username }).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }   
        res.status(200).json(user);
    } catch (error) {
        console.log(`Error in getProfile controller: ${error}`);
        res.status(500).json({ message: "Server error" });
    }   
}

export const followUnFollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id.toString();

    // 1️⃣ Prevent self-follow
    if (id === currentUserId) {
      return res.status(400).json({ error: "You can't follow/unfollow yourself" });
    }

    // 2️⃣ Fetch users
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(currentUserId);

    if (!userToModify || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 3️⃣ Check if already following
    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // ⭐ UNFOLLOW
      await User.findByIdAndUpdate(id, {
        $pull: { followers: new mongoose.Types.ObjectId(currentUserId) }
      });

      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: new mongoose.Types.ObjectId(id) }
      });

      return res.status(200).json({
        success: true,
        message: "User unfollowed successfully"
      });
    }

    // ⭐ FOLLOW
    await User.findByIdAndUpdate(id, {
      $addToSet: { followers: currentUserId }
    });

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: id }
    });

    // Create follow notification
    const notification = new Notification({
      type: "follow",
      from: currentUserId,
      to: userToModify._id
    });

    await notification.save();

    return res.status(200).json({
      success: true,
      message: "User followed successfully"
    });

  } catch (error) {
    console.log("Error in followUnFollowUser:", error.message);
    return res.status(500).json({ error: "Server error. Try again later." });
  }
};

export const getSuggestedUsers = async (req, res) => {
	try {
		const userId = req.user._id;

		const usersFollowedByMe = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{ $sample: { size: 10 } },
		]);

		// 1,2,3,4,5,6,
		const filteredUsers = users.filter((user) => !usersFollowedByMe.following?.includes(user._id));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		console.log("Error in getSuggestedUsers: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const updateUser = async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		if (profileImg) {
			if (user.profileImg) {
				// https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
				await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profileImg);
			profileImg = uploadedResponse.secure_url;
		}

		if (coverImg) {
			if (user.coverImg) {
				await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(coverImg);
			coverImg = uploadedResponse.secure_url;
		}

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		// password should be null in response
		user.password = null;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};


