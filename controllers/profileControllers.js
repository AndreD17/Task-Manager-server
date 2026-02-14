import User from "../models/User.js";
import logger from "../utils/logger.js";

/**
 * GET USER PROFILE
 */
export const getProfile = async (req, res) => {
  try {
    // ✅ Defensive auth check
    if (!req.user?.id) {
      logger.warn("Unauthorized profile access attempt");
      return res.status(401).json({
        status: false,
        msg: "Unauthorized",
      });
    }

    const userId = req.user.id;

    logger.info(`Fetching profile for user: ${userId}`);

    // ✅ Explicit field selection (faster + safer)
    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "joiningTime", "createdAt"],
    });

    if (!user) {
      logger.warn(`User profile not found: ${userId}`);
      return res.status(404).json({
        status: false,
        msg: "User not found",
      });
    }

    return res.status(200).json({
      user,
      status: true,
      msg: "Profile fetched successfully",
    });

  } catch (err) {
    // ✅ Safe production logging
    logger.error("Profile fetch error:", {
      message: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      status: false,
      msg: "Internal Server Error",
    });
  }
};
