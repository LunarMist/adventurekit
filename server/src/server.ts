import express from "express";
import http from "http";
import socketio from "socket.io";
import path from "path";
import errorhandler from "errorhandler";

const app = express();
const server = new http.Server(app);
const io = socketio(server);

const templatesRoot = path.resolve(__dirname, "..", "templates");
const staticRoot = path.resolve(__dirname, "..", "..", "frontend", "build");

const configPath = process.env.CONFIG_PATH || "./config/dev.js";
const config = require(configPath);

if (config.mode === 'development') {
  // only use in development
  app.use(errorhandler())
}

app.get('/', (req, res) => {
  return res.render('index');
});

// Serve bundle files
app.use('/static/bundle/', express.static(staticRoot));

// View engine setup
app.set('views', templatesRoot);
app.set('view engine', 'pug');

io.on('connection', function (socket) {
  console.log(`User connected: ${socket.id}`);
});

server.listen(config.web.port, () => {
  return console.log(`Running on port: ${config.web.port}!`);
});
