import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useFollow from "../../hooks/useFollow";

import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import LoadingSpinner from "./LoadingSpinner";

const RightPanel = () => {
  // Fetch suggested users
  const { data: suggestedUsers, isLoading, isError, error } = useQuery({
    queryKey: ["suggestedUsers"],
    queryFn: async () => {
      const res = await fetch("http://localhost:3002/api/users/suggested", {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch suggested users");
      }
      return data;
    },
  });

  const { follow, isPending } = useFollow();

  // If empty → collapse panel
  if (!isLoading && suggestedUsers?.length === 0) {
    return <div className="md:w-64 w-0"></div>;
  }

  return (
    <div className="hidden lg:block my-4 mx-2">
      <div className="bg-[#16181C] p-4 rounded-md sticky top-2">
        <p className="font-bold mb-3">Who to follow</p>

        {/* ⚠️ Error state */}
        {isError && (
          <p className="text-red-400 text-sm mb-2">
            {error?.message || "Something went wrong."}
          </p>
        )}

        <div className="flex flex-col gap-4">

          {/* ⏳ Loading skeletons */}
          {isLoading && (
            <>
              <RightPanelSkeleton />
              <RightPanelSkeleton />
              <RightPanelSkeleton />
              <RightPanelSkeleton />
            </>
          )}

          {/* 🎯 Suggested users list */}
          {!isLoading &&
            suggestedUsers?.map((user) => (
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center justify-between gap-4 hover:bg-[#1d1f23] p-2 rounded-md transition"
                key={user._id}
              >
                <div className="flex gap-2 items-center">
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img
                        src={user.profileImg || "/avatar-placeholder.png"}
                        alt={user.fullName || "User avatar"}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-semibold tracking-tight truncate w-28">
                      {user.fullName}
                    </span>
                    <span className="text-sm text-slate-500">
                      @{user.username}
                    </span>
                  </div>
                </div>

                <button
                  className="btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    follow(user._id);
                  }}
                >
                  {isPending ? <LoadingSpinner size="sm" /> : "Follow"}
                </button>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
