const http = require("http");
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const webServerConfig = require("../config/web-server");
const routes = require("./routes/index");
let httpServer;

function initialize() {
  return new Promise((resolve, reject) => {
    const app = express();

    httpServer = http.createServer(app);

    app.use(morgan("combined"));
    app.use(cors());
    app.use(bodyParser.json());
    app.use("/uploads", express.static(path.join(__dirname, "..", "/uploads")));

    app.use("/api", routes);

    httpServer
      .listen(webServerConfig.port)
      .on("listening", () => {
        console.log(`web-server listening on port:${webServerConfig.port}`);
        resolve();
      })
      .on("error", (err) => {
        console.log(err);
        reject();
      });
  });
}
module.exports.initialize = initialize;

function close() {
  return new Promise((resolve, reject) => {
    httpServer.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

module.exports.close = close;
