const http = require("http");
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
// const io = require("socket.io");
const webServerConfig = require("../config/web-server");
const routes = require("./routes/index");

let httpServer;

function initialize() {
  return new Promise((resolve, reject) => {
    const app = express();

    httpServer = http.createServer(app);

    const WebSockets = require("./web-sockets");
    const io = require("socket.io")(httpServer, {
      transports: ["polling"],
      wsEngine: "ws",
      cors: {
        origin: "*",
      },
    });

    global.io = io.listen(httpServer);
    global.io.on("connection", WebSockets.connection);

    app.use(morgan("combined"));
    app.use(cors());
    app.use(bodyParser.json());
    app.use(
      "/api/uploads",
      express.static(path.join(__dirname, "..", "/uploads"))
    );
    app.use("/api", routes);
    app.use((req, res, next) => {
      const error = new Error("Not found");
      error.status = 404;
      next(error);
    });
    app.use((error, req, res, next) => {
      res
        .status(error.status || 500)
        .json({ error: { message: error.message } });
    });

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
