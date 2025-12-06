import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import EditProfileModal from "./EditProfileModal";

import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { FaLink } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { formatMemberSinceDate } from "../../utils/date";

import useFollow from "../../hooks/useFollow";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";

const ProfilePage = () => {
  const [coverImg, setCoverImg] = useState(null);
  const [profileImg, setProfileImg] = useState(null);
  const [feedType, setFeedType] = useState("posts");

  const coverImgRef = useRef(null);
  const profileImgRef = useRef(null);

  const { username } = useParams();

  const { follow, isPending } = useFollow();
  const { isUpdatingProfile, updateProfile } = useUpdateUserProfile();

  // logged-in user
  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await fetch("http://localhost:3002/api/auth/me", {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  // profile user (the page we're viewing)
  const {
    data: user,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3002/api/users/profile/${username}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    enabled: !!username,
  });

  useEffect(() => {
    if (username) refetch();
  }, [username, refetch]);

  // safe checks
  const isMyProfile = authUser?._id === user?._id;
  const amIFollowing = !!authUser?.following?.includes(user?._id);
  const memberSinceDate = user ? formatMemberSinceDate(user.createdAt) : "";

  const handleImgChange = (e, type) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (type === "coverImg") setCoverImg(reader.result);
      if (type === "profileImg") setProfileImg(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateClick = async () => {
    await updateProfile({ coverImg, profileImg });
    setCoverImg(null);
    setProfileImg(null);
    // refetch to get updated images
    refetch();
  };

  return (
    <div className="flex-[4_4_0] border-r border-gray-700 min-h-screen">
      {/* header skeleton / not found */}
      {(isLoading || isRefetching) && <ProfileHeaderSkeleton />}
      {!isLoading && !isRefetching && !user && (
        <p className="text-center text-lg mt-4">User not found</p>
      )}

      {!isLoading && user && (
        <>
          {/* Back + name */}
          <div className="flex gap-10 px-4 py-2 items-center">
            <Link to="/">
              <FaArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex flex-col">
              <p className="font-bold text-lg">{user.fullName}</p>
              <span className="text-sm text-slate-500">{user.postsCount ?? 0} posts</span>
            </div>
          </div>

          {/* Cover */}
          <div className="relative group/cover">
            {/* decorative cover image — empty alt */}
            <img
              src={coverImg || user.coverImg || "/cover.png"}
              className="h-52 w-full object-cover"
              alt=""
            />

            {isMyProfile && (
              <div
                className="absolute top-2 right-2 rounded-full p-2 bg-gray-800 bg-opacity-75 cursor-pointer opacity-0 group-hover/cover:opacity-100 transition duration-200"
                onClick={() => coverImgRef.current?.click()}
                role="button"
                aria-label="Change cover"
              >
                <MdEdit className="w-5 h-5 text-white" />
              </div>
            )}

            <input
              type="file"
              hidden
              accept="image/*"
              ref={coverImgRef}
              onChange={(e) => handleImgChange(e, "coverImg")}
            />

            <input
              type="file"
              hidden
              accept="image/*"
              ref={profileImgRef}
              onChange={(e) => handleImgChange(e, "profileImg")}
            />

            {/* Avatar */}
            <div className="avatar absolute -bottom-16 left-4">
              <div className="w-32 rounded-full relative group/avatar overflow-hidden">
                {/* meaningful alt without redundant words */}
                <img
                  src={profileImg || user.profileImg || "/avatar-placeholder.png"}
                  alt={user.username || ""}
                  className="w-full h-full object-cover"
                />

                {isMyProfile && (
                  <div className="absolute top-5 right-3 p-1 bg-primary rounded-full group-hover/avatar:opacity-100 opacity-0 cursor-pointer">
                    <MdEdit
                      className="w-4 h-4 text-white"
                      onClick={() => profileImgRef.current?.click()}
                      role="button"
                      aria-label="Change avatar"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* action buttons */}
          <div className="flex justify-end px-4 mt-5">
            {isMyProfile && <EditProfileModal authUser={authUser} />}

            {!isMyProfile && (
              <button
                className="btn btn-outline rounded-full btn-sm"
                onClick={() => follow(user._id)}
                aria-pressed={amIFollowing}
              >
                {isPending ? "Loading..." : amIFollowing ? "Unfollow" : "Follow"}
              </button>
            )}

            {(coverImg || profileImg) && (
              <button
                className="btn btn-primary rounded-full btn-sm text-white px-4 ml-2"
                onClick={handleUpdateClick}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? "Updating..." : "Update"}
              </button>
            )}
          </div>

          {/* profile meta */}
          <div className="flex flex-col gap-4 mt-14 px-4">
            <div className="flex flex-col">
              <span className="font-bold text-lg">{user.fullName}</span>
              <span className="text-sm text-slate-500">@{user.username}</span>
              <span className="text-sm my-1">{user.bio}</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {user.link && (
                <div className="flex gap-1 items-center">
                  <FaLink className="w-3 h-3 text-slate-500" />
                  <a
                    href={user.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {user.link}
                  </a>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <IoCalendarOutline className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-500">{memberSinceDate}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex gap-1 items-center">
                <span className="font-bold text-xs">{user.following?.length ?? 0}</span>
                <span className="text-slate-500 text-xs">Following</span>
              </div>
              <div className="flex gap-1 items-center">
                <span className="font-bold text-xs">{user.followers?.length ?? 0}</span>
                <span className="text-slate-500 text-xs">Followers</span>
              </div>
            </div>
          </div>

          {/* feed tabs */}
          <div className="flex w-full border-b border-gray-700 mt-4">
            <div
              className={`flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 relative cursor-pointer ${
                feedType === "posts" ? "text-white" : ""
              }`}
              onClick={() => setFeedType("posts")}
              role="button"
              tabIndex={0}
            >
              Posts
              {feedType === "posts" && (
                <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
              )}
            </div>

            <div
              className={`flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 relative cursor-pointer ${
                feedType === "likes" ? "text-white" : "text-slate-500"
              }`}
              onClick={() => setFeedType("likes")}
              role="button"
              tabIndex={0}
            >
              Likes
              {feedType === "likes" && (
                <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
              )}
            </div>
          </div>
        </>
      )}

      {/* posts component (safe even if user undefined) */}
      <Posts feedType={feedType} username={username} userId={user?._id} />
    </div>
  );
};

export default ProfilePage;
