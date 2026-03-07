import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const Posts = ({ feedType, username, userId }) => {
	// --------------------------
	// Decide API Endpoint (memoized)
	// --------------------------
	const POST_ENDPOINT = useMemo(() => {
		let endpoint = "https://twitter-clone-3-dzoz.onrender.com/api/posts/all";

		if (feedType === "following") {
			endpoint = "https://twitter-clone-3-dzoz.onrender.com/api/posts/following";
		}

		if (feedType === "posts" && username) {
			endpoint = `https://twitter-clone-3-dzoz.onrender.com/api/posts/user/${username}`;
		}

		if (feedType === "likes" && userId) {
			endpoint = `https://twitter-clone-3-dzoz.onrender.com/api/posts/likes/${userId}`;
		}

		console.log("📡 Fetching posts from:", endpoint);
		return endpoint;
	}, [feedType, username, userId]);

	// --------------------------
	// React Query Fetch
	// --------------------------
	const { data: posts, isLoading, isRefetching, error, refetch } = useQuery({
		queryKey: ["posts", feedType, username, userId],
		queryFn: async () => {
			console.log("🔍 Triggering API call...");

			const res = await fetch(POST_ENDPOINT, {
				method: "GET",
				credentials: "include", // send cookie token
			});

			const data = await res.json();

			console.log("📥 API Response Status:", res.status);
			console.log("📥 API Response Data:", data);

			if (!res.ok) {
				throw new Error(data.error || "Failed to fetch posts");
			}

			return data;
		},
		staleTime: 0,
		refetchOnWindowFocus: false,
	});

	// --------------------------
	// handleLike function
	// --------------------------
	const handleLike = async (postId) => {
		console.log("➡️ Like button clicked for post:", postId);

		try {
			const res = await fetch(`https://twitter-clone-3-dzoz.onrender.com/api/posts/like/${postId}`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await res.json();
			console.log("⬅️ Like API response:", data);

			if (!res.ok) {
				console.error("❌ Like error:", data.error);
				return;
			}

			// Refresh posts after like
			refetch();
		} catch (error) {
			console.error("❌ Like request failed:", error);
		}
	};

	// --------------------------
	// Render Logic
	// --------------------------
	return (
		<>
			{/* ERROR */}
			{error && (
				<p className="text-center text-red-500 my-4">
					⚠ Error loading posts: {error.message}
				</p>
			)}

			{/* LOADING */}
			{(isLoading || isRefetching) && (
				<div className="flex flex-col justify-center">
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}

			{/* EMPTY */}
			{!isLoading && !isRefetching && posts?.length === 0 && (
				<p className="text-center my-4 text-gray-400">
					No posts in this tab. Switch 👻
				</p>
			)}

			{/* POSTS */}
			{!isLoading && !isRefetching && posts && (
				<div>
					{posts.map((post) => (
						<Post
							key={post._id}
							post={post}
							onLike={() => handleLike(post._id)} // pass handleLike
						/>
					))}
				</div>
			)}
		</>
	);
};

export default Posts;
