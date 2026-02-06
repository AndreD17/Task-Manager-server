import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

// ✅ Production-ready Sequelize configuration with connection pooling & error handling
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.info(msg) : false,
  pool: {
    max: 10,                     // Maximum number of connections in the pool
    min: 2,                      // Minimum number of connections to maintain
    acquire: 30000,              // Time (ms) to acquire a connection before timing out
    idle: 10000,                 // Time (ms) a connection can be idle before release
    evict: 10000,                // Evict idle connections
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  retry: {
    max: 5,                      // Maximum number of retries
    timeout: 5000,               // Time (ms) to wait before retrying
  },
  define: {
    timestamps: true,            // Add createdAt and updatedAt fields
    underscored: false,          // Use camelCase for field names
  },
});

// ✅ Test database connection on startup
sequelize.authenticate()
  .then(() => logger.info('Database connection successful'))
  .catch((err) => logger.error('Database connection failed:', err));

export default sequelize;
