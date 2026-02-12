import fs from "fs";
import path from "path";
import { Sequelize } from "sequelize";
import config from "../config/database.js";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const db = {};

// Initialize Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  { ...config, dialect: "postgres" } 
);

// Dynamically import all models
const files = fs
  .readdirSync(__dirname)
  .filter(
    (file) =>
      file.endsWith(".js") &&
      file !== path.basename(__filename) &&
      !file.endsWith(".test.js")
  );

for (const file of files) {
  const modelPath = path.join(__dirname, file);
  const { default: model } = await import(`file://${modelPath}`);
  db[model.name] = model;
}

// Run associations if any
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
