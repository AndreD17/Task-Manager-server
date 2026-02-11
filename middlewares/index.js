import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { errorHandler } from "./error.js";
import { createAccessToken, verifyRefreshToken } from "../utils/token.js";

export const verifyToken = async (req, res, next) => {
  try {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;

    if (!accessToken && !refreshToken) {
      return next(errorHandler(401, "Unauthorized: Please log in"));
    }

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        req.user = { id: decoded.id };
        logger.info("✅ Access token valid");
        return next();
      } catch (err) {
        if (err.name !== "TokenExpiredError") {
          return next(errorHandler(403, "Invalid access token"));
        }
        logger.warn("⚠️ Access token expired, attempting refresh");
      }
    }

  
    if (!refreshToken) {
      return next(errorHandler(401, "Session expired, please log in again"));
    }

    let decodedRefresh;
    try {
      decodedRefresh = verifyRefreshToken(refreshToken);
    } catch (err) {
      return next(errorHandler(403, "Invalid refresh token"));
    }

    const user = await User.findByPk(decodedRefresh.id);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    const newAccessToken = createAccessToken({ id: user.id });

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: true,            
      sameSite: "none",          
      maxAge: 15 * 60 * 1000,    
      path: "/",                  
    });

    req.user = { id: user.id };
    logger.info("🔄 Access token refreshed successfully");

    next();
  } catch (err) {
    logger.error("❌ Authentication failed:", err.message);
    return next(errorHandler(403, "Authentication failed"));
  }
};
