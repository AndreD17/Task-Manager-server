import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";


const { ACCESS_TOKEN_SECRET } = process.env;

export const verifyAccessToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ status: false, msg: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        status: false,
        msg: "Access token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      status: false,
      msg: "Invalid access token",
    });
  }

  try {
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ status: false, msg: "User no longer exists" });
    }

    req.user = user;
    logger.info(`Access token verified for user ${user.id}`);
    next();
  } catch (err) {
    logger.error("Token verification error:", err);
    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};


