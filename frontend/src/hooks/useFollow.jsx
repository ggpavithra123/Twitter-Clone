import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useFollow = () => {
	const queryClient = useQueryClient();

	const { mutate: follow, isPending } = useMutation({
		mutationFn: async (userId) => {
			try {
				const res = await fetch(`http://localhost:3002/api/users/follow/${userId}`, {
					method: "POST",
					credentials: "include", // ⭐ REQUIRED FOR JWT COOKIE
				});

				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong!");
				}

				return data; // should contain message like "Followed" or "Unfollowed"
			} catch (error) {
				throw new Error(error.message);
			}
		},

		onSuccess: (data) => {
			// ⭐ Show toast on success
			toast.success(data?.message || "Action successful!");

			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }),
				queryClient.invalidateQueries({ queryKey: ["authUser"] }),
			]);
		},

		onError: (error) => {
			toast.error(error.message);
		},
	});

	return { follow, isPending };
};

export default useFollow;
