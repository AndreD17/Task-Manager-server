import User from "../models/User.js";
import logger from "../utils/logger.js";


export const getProfile = async (req, res) => {
    try {
        logger.info(`Extracted user ID: ${req.user?.id}`);

        
        const userId = req.user.id; // From decoded token
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ["password"] } // Exclude password from response
        });

        if (!user) {
            logger.warn(`User not found: ${req.user.id}`);
            return res.status(404).json({ status: false, msg: "User not found" });
        }

        res.status(200).json({ user, status: true, msg: "Profile found successfully." });
    } catch (err) {
        logger.error("Error fetching profile:", err);
        return res.status(500).json({ status: false, msg: "Internal Server Error", error: err.message });
    }
};
