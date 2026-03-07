import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  // --------------------------
  // Fetch authenticated user
  // --------------------------
  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await fetch("https://twitter-clone-3-dzoz.onrender.com/api/auth/me", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch auth user");
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  // --------------------------
  // Mutations
  // --------------------------
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`https://twitter-clone-3-dzoz.onrender.com/api/posts/${post._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const likePostMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`https://twitter-clone-3-dzoz.onrender.com/api/posts/like/${post._id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data.likes;
    },
    onSuccess: (updatedLikes) => {
      // Update all relevant caches
      queryClient.setQueryData(["posts"], (oldPosts) =>
        (oldPosts || []).map((p) =>
          p._id === post._id ? { ...p, likes: updatedLikes } : p
        )
      );

      queryClient.setQueryData(["posts", "likes", authUser?._id], (oldPosts) =>
        (oldPosts || []).map((p) =>
          p._id === post._id ? { ...p, likes: updatedLikes } : p
        )
      );

      queryClient.setQueryData(["post", post._id], (oldPost) => ({
        ...oldPost,
        likes: updatedLikes,
      }));

      toast.success("You liked the post!");
	  // Refetch posts to update UI
  	  queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const commentPostMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`https://twitter-clone-3-dzoz.onrender.com/api/posts/comment/${post._id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    onSuccess: () => {
      toast.success("Comment posted successfully");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentPostMutation.isLoading && comment.trim()) commentPostMutation.mutate();
  };

  if (authLoading) return <LoadingSpinner size="lg" />;

  // --------------------------
  // Safe defaults
  // --------------------------
  const postOwner = post?.user || {};
  const likes = post?.likes || [];
  const comments = post?.comments || [];
  const isLiked = authUser ? likes.includes(authUser._id) : false;
  const isMyPost = authUser ? authUser._id === postOwner._id : false;
  const formattedDate = post?.createdAt ? formatPostDate(post.createdAt) : "";

  // --------------------------
  // Render
  // --------------------------
  return (
    <div className="flex gap-2 items-start p-4 border-b border-gray-700">
      {/* Avatar */}
      <div className="avatar">
        <Link to={`/profile/${postOwner.username || ""}`} className="w-8 rounded-full overflow-hidden">
          <img src={postOwner.profileImg || "/avatar-placeholder.png"} alt={postOwner.fullName || "User"} />
        </Link>
      </div>

      {/* Post Content */}
      <div className="flex flex-col flex-1">
        <div className="flex gap-2 items-center">
          <Link to={`/profile/${postOwner.username || ""}`} className="font-bold">
            {postOwner.fullName || "Unknown User"}
          </Link>
          <span className="text-gray-700 flex gap-1 text-sm">
            <Link to={`/profile/${postOwner.username || ""}`}>@{postOwner.username || "unknown"}</Link>
            <span>·</span>
            <span>{formattedDate}</span>
          </span>

          {isMyPost && (
            <span className="flex justify-end flex-1">
              {!deletePostMutation.isLoading ? (
                <FaTrash className="cursor-pointer hover:text-red-500" onClick={() => deletePostMutation.mutate()} />
              ) : (
                <LoadingSpinner size="sm" />
              )}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 overflow-hidden">
          <span>{post.text || ""}</span>
          {post.img && (
            <img src={post.img} className="h-80 object-contain rounded-lg border border-gray-700" alt="" />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-3">
          <div className="flex gap-4 items-center w-2/3 justify-between">
            {/* Repost */}
            <div className="flex gap-1 items-center group cursor-pointer">
              <BiRepost className="w-6 h-6 text-slate-500 group-hover:text-green-500" />
              <span className="text-sm text-slate-500 group-hover:text-green-500">0</span>
            </div>

            {/* Like */}
            <div className="flex gap-1 items-center group cursor-pointer" onClick={() => likePostMutation.mutate()}>
              {likePostMutation.isLoading && <LoadingSpinner size="sm" />}
              {!isLiked && !likePostMutation.isLoading && <FaRegHeart className="w-4 h-4 text-slate-500 group-hover:text-pink-500" />}
              {isLiked && !likePostMutation.isLoading && <FaRegHeart className="w-4 h-4 text-pink-500" />}
              <span className={`text-sm ${isLiked ? "text-pink-500" : "text-slate-500"}`}>{likes.length}</span>
            </div>
          </div>

          {/* Bookmark */}
          <div className="flex w-1/3 justify-end gap-2 items-center">
            <FaRegBookmark className="w-4 h-4 text-slate-500 cursor-pointer" />
          </div>
        </div>

        {/* Comment Box */}
        <form className="flex gap-2 items-center mt-4" onSubmit={handlePostComment}>
          <textarea
            className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn btn-primary rounded-full btn-sm text-white px-4">
            {commentPostMutation.isLoading ? <LoadingSpinner size="md" /> : "Post"}
          </button>
        </form>

        {/* Comments List */}
        {comments.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 max-h-60 overflow-auto">
            {comments.map((c) => (
              <div key={c._id} className="flex gap-2 items-start">
                <div className="avatar w-8 rounded-full overflow-hidden">
                  <img src={c.user?.profileImg || "/avatar-placeholder.png"} alt={c.user?.fullName || "User"} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">{c.user?.fullName || "Unknown"}</span>
                  <span className="text-sm text-gray-700">@{c.user?.username || "unknown"}</span>
                  <span className="text-sm">{c.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Post;
