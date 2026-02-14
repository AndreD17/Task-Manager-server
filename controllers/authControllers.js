import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  createAccessToken,
  createRefreshToken,
} from "../utils/token.js";
import { errorHandler } from "../middlewares/error.js";

const isProduction = process.env.NODE_ENV === "production";


const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 15 * 60 * 1000, 
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 3 * 24 * 60 * 60 * 1000,
};

export const signup = async (req, res, next) => {
  try {
    let { name, email, password } = req.body;

    
    if (!name || !email || !password) {
      return next(errorHandler(400, "All fields are required"));
    }

    email = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      where: { email },
      attributes: ["id"],
    });

    if (existingUser) {
      return next(errorHandler(400, "Email already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const [accessToken, refreshToken] = await Promise.all([
      createAccessToken({ id: user.id }),
      createRefreshToken({ id: user.id }),
    ]);

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


export const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return next(errorHandler(400, "Email and password are required"));
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({
      where: { email },
      attributes: ["id", "password", "name", "email"],
    });

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(errorHandler(401, "Invalid email or password"));
    }

    const [accessToken, refreshToken] = await Promise.all([
      createAccessToken({ id: user.id }),
      createRefreshToken({ id: user.id }),
    ]);

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

/**
 
export const logout = (req, res) => {
  res.clearCookie("access_token", accessCookieOptions);
  res.clearCookie("refresh_token", refreshCookieOptions);

  res.status(200).json({
    message: "Logged out successfully",
  });
};

 */