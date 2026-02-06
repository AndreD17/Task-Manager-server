// src/utils/logger.js
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// Configure pino
const logger = pino({
  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,    
          translateTime: "SYS:standard", 
          ignore: "pid,hostname" 
        }
      }
    : undefined, 
  level: isProduction ? "info" : "debug" 
});

export default logger;
