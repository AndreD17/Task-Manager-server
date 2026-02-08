import User from "../models/User.js";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import {
  createAccessToken,
  createRefreshToken,
} from "../utils/token.js";
import { validateEmail } from "../utils/validation.js";
import logger from "../utils/logger.js";

import jwt from "jsonwebtoken";


export const refresh = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ msg: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const newAccessToken = createAccessToken({ id: decoded.id });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ msg: "Invalid refresh token" });
  }
};


export const signup = async (req, res) => {
  try {
    logger.info("Signup attempt initiated");

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Please fill all fields" });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ msg: "All fields must be strings" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ msg: "Invalid email address" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        msg: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    logger.info(`User created: ${email}`);
    res.status(201).json({ msg: "Account created successfully" });
  } catch (err) {
    logger.error("Signup error:", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    logger.info(`Login attempt: ${req.body.email}`);

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: false, msg: "Email and password required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(400)
        .json({ status: false, msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ status: false, msg: "Incorrect password" });
    }

    const accessToken = createAccessToken({ id: user.id });
    const refreshToken = createRefreshToken({ id: user.id });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });


    logger.info(`User logged in: ${user.id}`);

    res.status(200).json({
      status: true,
      accessToken,
      user,
      msg: "Login successful",
    });
  } catch (err) {
    logger.error("Login error:", err);
    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};

export const signout = (req, res) => {
  // For JWT, signout is handled on the client by deleting the token.
  // Optionally, you can implement token blacklisting here.
  res.json({ msg: "User signed out successfully" });
};  