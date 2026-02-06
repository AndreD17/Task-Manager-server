import { DataTypes } from "sequelize";
import sequelize from "../config/database.js"; // Ensure correct path
import User from "./User.js"; // Ensure correct path
import "../cron/checkDueTasks.js";


const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
       unique: 'compositeIndex'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Task description cannot be empty" },
      },
    },
   dueDate: {
   type: DataTypes.DATE,
   allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
  type: DataTypes.ENUM('pending', 'completed', 'inProgress', 'cancelled'),
  defaultValue: 'pending'
}
  },
  {
    timestamps: true, // createdAt & updatedAt
    tableName: "tasks",
  }
);




// Define associations
User.hasMany(Task, { foreignKey: "userId", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "userId" });

export default Task;
