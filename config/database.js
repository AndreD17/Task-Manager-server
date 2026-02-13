import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

// Production-ready Sequelize configuration with connection pooling & error handling
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.info(msg) : false,
  pool: {
    max: 10,                     
    min: 2,                     
    acquire: 30000,             
    idle: 10000,                 
    evict: 10000,           
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  retry: {
    max: 5,                     
    timeout: 5000,              
  },
  define: {
    timestamps: true,            
    underscored: false,    
  },
});


export default sequelize;
