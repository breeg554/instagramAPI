const jwt = require("jsonwebtoken");
const config = require("../config/db");

function verify(req, res, next) {
  let token = req.header("Authorization");
  if (!token) return res.status(401).json("Access denied");
  try {
    const extractToken = token.substring(7, token.length);
    const isVerified = jwt.verify(extractToken, config.jwt);
    if (isVerified) {
      const decoded = jwt.decode(extractToken);
      req.userID = decoded.data.id;
    }
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      res.status(401).send("Token Expired");
    } else {
      res.status(401).send("Authentication failed");
    }
    return;
  }
  next();
}
module.exports = verify;
