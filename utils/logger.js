import pino from "pino";
import pretty from "pino-pretty";

// Create a Pino logger instance
const logger = pino(pretty({
    colorize: true, // Enables colored logs in the terminal
    translateTime: "HH:MM:ss Z", // Formats timestamps
    ignore: "pid,hostname" // Removes unnecessary metadata
}));

export default logger;
