import { DataTypes } from "sequelize";
import sequelize from "../config/database.js"; 
import User from "./User.js";


const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: "id"
    },
    onDelete: "CASCADE"
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },

  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },

  status: {
    type: DataTypes.ENUM(
      "pending",
      "completed",
      "inProgress",
      "cancelled"
    ),
    defaultValue: "pending"
  }

}, {
  timestamps: true,
  tableName: "tasks",
  indexes: [
    { fields: ["userId"] },
    { fields: ["dueDate"] },
    { fields: ["status"] },
    { fields: ["userId", "status"] },
    { fields: ["userId", "dueDate"] }
  ]
});





// Define associations
User.hasMany(Task, { foreignKey: "userId", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "userId" });

export default Task;
