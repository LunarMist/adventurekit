import express from "express";
import http from "http";
import socketio from "socket.io";
import path from "path";
import errorhandler from "errorhandler";

const app = express();
const server = new http.Server(app);
const io = socketio(server);

const templatesRoot = path.resolve(__dirname, "..", "templates");
const bundleRoot = path.resolve(__dirname, "..", "..", "frontend", "build");

const configPath = process.env.CONFIG_PATH || "./config/dev.js";
const config = require(configPath);

const bundleManifest = require(path.resolve(bundleRoot, "manifest.json"));

// Only in development mode
if (config.mode === 'development') {
  app.locals.pretty = true;
  app.use(errorhandler());
  console.log("Running in development mode!");
}

app.get("/", (req, res) => {
  res.render("index", {
    bundlePath: bundleManifest['main.js']
  });
});

// Serve bundle files
app.use('/static/bundle/', express.static(bundleRoot));

// View engine setup
app.set('views', templatesRoot);
app.set('view engine', 'pug');

io.on('connection', function (socket) {
  console.log(`User connected: ${socket.id}`);
});

server.listen(config.web.port, () => {
  return console.log(`Running on port: ${config.web.port}!`);
});
