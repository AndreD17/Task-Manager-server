import dotenv from "dotenv";
import app from "./app.js";
import sequelize from "./config/database.js";
import "./models/index.js";
import "./cron/checkDueTasks.js";
import logger from "./utils/logger.js";
import "./cron/checkDueTasks.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connected");

    await sequelize.sync();
    logger.info("Models synced");

    app.listen(PORT, () => {
      logger.info(`Server running on port http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error(" Server startup failed", err);
    process.exit(1);
  }
};


startServer();
