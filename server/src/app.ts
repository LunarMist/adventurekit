import errorhandler from "errorhandler";
import path from "path";
import express from "express";

import config from "./config/config";

const templatesRoot = path.resolve(__dirname, "..", "templates");
const bundleRoot = path.resolve(__dirname, "..", "..", "frontend", "build");

const bundleManifest = require(path.resolve(bundleRoot, "manifest.json"));

const app = express();

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

export {app};
