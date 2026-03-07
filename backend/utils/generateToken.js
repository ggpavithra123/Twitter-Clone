import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true,        // REQUIRED for HTTPS (Vercel + Render)
    sameSite: "None",    // REQUIRED for cross-domain cookies
    maxAge: 24 * 60 * 60 * 1000,
  });

  return token;
};
