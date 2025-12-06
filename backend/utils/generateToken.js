import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, "your_jwt_secret_key", {
    expiresIn: "1d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,      // JS on frontend cannot access the cookie
    secure: false,       // true in production with HTTPS
    sameSite: "lax",     // 'none' if frontend and backend are on different domains with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  return token;
};
