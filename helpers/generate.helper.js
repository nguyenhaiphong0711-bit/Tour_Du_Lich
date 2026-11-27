const crypto = require("crypto");

module.exports.generateRandomNumber = (length) => {
  return Array.from({ length }, () => crypto.randomInt(0, 10)).join("");
};
