import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import XSvg from "../../../components/svgs/X";
import { MdPassword } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const {
    mutate: loginMutation,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ username, password }) => {
      const res = await fetch("https://twitter-clone-3-dzoz.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      let data;

      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      return data;
    },

    onSuccess: (data) => {
      toast.success("Logged in successfully!");

      // refresh auth user
      queryClient.invalidateQueries({ queryKey: ["authUser"] });

      queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] });

      // store token if returned
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // redirect to home page
      navigate("/");
    },

    onError: (err) => {
      toast.error(err.message || "Login failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation(formData);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-screen-xl mx-auto flex h-screen">
      {/* Left illustration */}
      <div className="flex-1 hidden lg:flex items-center justify-center">
        <XSvg className="lg:w-2/3 fill-white" />
      </div>

      {/* Login form */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <form className="flex gap-4 flex-col w-80" onSubmit={handleSubmit}>
          <XSvg className="w-24 lg:hidden fill-white" />

          <h1 className="text-4xl font-extrabold text-white">
            Let's go.
          </h1>

          {/* Username */}
          <label className="input input-bordered rounded flex items-center gap-2">
            <FaUser />
            <input
              type="text"
              className="grow"
              placeholder="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </label>

          {/* Password */}
          <label className="input input-bordered rounded flex items-center gap-2">
            <MdPassword />
            <input
              type="password"
              className="grow"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </label>

          {/* Login button */}
          <button className="btn rounded-full btn-primary text-white">
            {isPending ? "Loading..." : "Login"}
          </button>

          {/* Error */}
          {isError && (
            <p className="text-red-500 text-center mt-2">
              {error?.message || "Something went wrong"}
            </p>
          )}
        </form>

        {/* Signup */}
        <div className="flex flex-col gap-2 mt-4">
          <p className="text-white text-lg">
            Don't have an account?
          </p>

          <Link to="/signup">
            <button className="btn rounded-full btn-primary text-white btn-outline w-full">
              Sign up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

