import errorhandler from 'errorhandler';
import path from 'path';
import express from 'express';
import express_session from 'express-session';
import uuid from 'uuid/v4'
import * as moment from 'moment';
import connect_redis from 'connect-redis'

import config from './config/config';

const RedisStore = connect_redis(express_session);

const templatesRoot = path.resolve(__dirname, '..', 'templates');
const bundleRoot = path.resolve(__dirname, '..', '..', 'frontend', 'build');

const bundleManifest = require(path.resolve(bundleRoot, 'manifest.json'));

const app = express();


// Only in development mode
if (config.mode === 'development') {
  app.locals.pretty = true;
  app.use(errorhandler());
  console.log('Running in development mode!');
} else if (config.mode === 'production') {
  // trust first proxy
  // required by express-session
  app.set('trust proxy', 1);
  console.log('Running in production mode!');
}

app.get('/', (req, res) => {
  res.render('index', {
    bundlePath: bundleManifest['main.js']
  });
});

// Session middleware
app.use(express_session({
  cookie: {
    httpOnly: true,
    maxAge: moment.duration(config.session.cookie.maxAge).asMilliseconds(),
    secure: config.session.cookie.secure,
  },
  genid: req => uuid(),
  name: config.session.name,
  resave: false,
  saveUninitialized: false,
  secret: config.session.secret,
  store: new RedisStore({
    host: config.redis.host,
    port: config.redis.port,
    db: config.session.redisDB,
    prefix: config.session.redisPrefix,
    logErrors: config.mode === 'development',
  }),
}));

// Serve bundle files
app.use('/static/bundle/', express.static(bundleRoot));

// View engine setup
app.set('views', templatesRoot);
app.set('view engine', 'pug');

export default app;
