import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoCloseSharp } from "react-icons/io5";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const CreatePost = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);
  const imgRef = useRef(null);

  // ================= GET LOGGED-IN USER =================
  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await fetch("https://twitter-clone-3-dzoz.onrender.com/api/auth/me", {
        credentials: "include",
      });

      if (!res.ok) return null;
      return res.json();
    },
  });

  console.log("AUTH USER =>", authUser);

  const queryClient = useQueryClient();

  // ================= CREATE POST =================
  const { mutate: createPost, isPending, isError, error } = useMutation({
    mutationFn: async ({ text, img }) => {
      const res = await fetch("https://twitter-clone-3-dzoz.onrender.com/api/posts/create", {
        method: "POST",
        credentials: "include", // IMPORTANT for sending JWT cookie
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, img }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to create post");
      }

      return data;
    },

    onSuccess: () => {
      setText("");
      setImg(null);
      toast.success("Post created successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ================= Handle Submit =================
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !img) {
      return toast.error("Post cannot be empty");
    }
    createPost({ text, img });
  };

  // ================= Handle Image Upload =================
  const handleImgChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex p-4 items-start gap-4 border-b border-gray-700">
      {/* USER AVATAR */}
      <div className="avatar">
        <div className="w-8 rounded-full">
          <img
            src={authUser?.profileImg || "/avatar-placeholder.png"}
            alt="User avatar"
          />
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
        <textarea
          className="textarea w-full p-0 text-lg resize-none border-none focus:outline-none"
          placeholder="What is happening?!"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* IMAGE PREVIEW */}
        {img && (
          <div className="relative w-72 mx-auto">
            <IoCloseSharp
              className="absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer"
              onClick={() => {
                setImg(null);
                if (imgRef.current) imgRef.current.value = null;
              }}
            />

            <img
              src={img}
              alt="Selected preview"
              className="w-full mx-auto h-72 object-contain rounded"
            />
          </div>
        )}

        {/* FOOTER BAR */}
        <div className="flex justify-between border-t py-2 border-t-gray-700">
          <div className="flex gap-1 items-center">
            <CiImageOn
              className="fill-primary w-6 h-6 cursor-pointer"
              onClick={() => imgRef.current?.click()}
            />
            <BsEmojiSmileFill className="fill-primary w-5 h-5 cursor-pointer" />
          </div>

          <input
            type="file"
            accept="image/*"
            hidden
            ref={imgRef}
            onChange={handleImgChange}
          />

          <button className="btn btn-primary rounded-full btn-sm text-white px-4">
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>

        {isError && <div className="text-red-500">{error.message}</div>}
      </form>
    </div>
  );
};

export default CreatePost;
