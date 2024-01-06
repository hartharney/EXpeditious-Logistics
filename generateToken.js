const jwt = require("jsonwebtoken");
const secretKey = "iskaba";

const userId = "realAdmin";

const token = jwt.sign({ userId }, secretKey, { expiresIn: "1d" });

console.log("Generated Token:", token);
