import { validate as isUUID } from "uuid";
//import { v4 as uuidv4 } from 'uuid';
/**
 * Validate Email Format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    ) !== null;
};

/**
 * Validate UUID Format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateObjectId = (uuid) => {
  return isUUID(uuid);
};
