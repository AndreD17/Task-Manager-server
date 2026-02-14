import { DataTypes } from "sequelize";
import sequelize from "../config/database.js"; // Import the Sequelize instance

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },

  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },

  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  joiningTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }

}, {
  timestamps: true,
  tableName: "users",
  indexes: [
    {
      unique: true,
      fields: ["email"]
    }
  ]
});


export default User;
