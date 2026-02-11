import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  createAccessToken,
  createRefreshToken,
} from "../utils/token.js";
import { errorHandler } from "../middlewares/error.js";

// Helper: cookie options
const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
};

// =======================
// SIGNUP
// =======================
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(errorHandler(400, "All fields are required"));
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(errorHandler(400, "Email already exists"));
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const accessToken = createAccessToken({ id: user.id });
    const refreshToken = createRefreshToken({ id: user.id });

    res.cookie("access_token", accessToken, accessCookieOptions);
    res.cookie("refresh_token", refreshToken, refreshCookieOptions);

    const { password: _, ...userData } = user.toJSON();

    res.status(201).json({
      message: "Signup successful",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// LOGIN
// =======================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return next(errorHandler(401, "Invalid email or password"));
    }

    const accessToken = createAccessToken({ id: user.id });
    const refreshToken = createRefreshToken({ id: user.id });

    res.cookie("access_token", accessToken, accessCookieOptions);
    res.cookie("refresh_token", refreshToken, refreshCookieOptions);

    const { password: _, ...userData } = user.toJSON();

    res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// GET CURRENT USER
// =======================
export const getMe = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(errorHandler(401, "Unauthorized"));
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email"],
    });

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

// =======================
// LOGOUT
// =======================
export const logout = (req, res) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  res.status(200).json({ message: "Logged out successfully" });
};
