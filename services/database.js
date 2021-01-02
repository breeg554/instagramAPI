const mongoose = require("mongoose");
const config = require("../config/db");

async function initialize() {
  await mongoose.connect(config.db, { useNewUrlParser: true });
}
module.exports.initialize = initialize;

async function close() {
  await mongoose.disconnect();
}
module.exports.close = close;
