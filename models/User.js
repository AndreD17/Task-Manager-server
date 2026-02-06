import { DataTypes } from "sequelize";
import sequelize from "../config/database.js"; // Import the Sequelize instance

const User = sequelize.define("User", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Generates a unique UUID
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Please enter your name" }
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: "Please enter a valid email" }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Please enter your password" }
        }
    },
    joiningTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Equivalent to MongoDB's `Date.now`
    }
}, {
    timestamps: true, // Adds `createdAt` & `updatedAt` fields
    tableName: "users", // Custom table name
});

export default User;
