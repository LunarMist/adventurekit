import errorhandler from 'errorhandler';
import path from 'path';
import express from 'express';
import express_session from 'express-session';
import uuid from 'uuid/v4'
import connect_redis from 'connect-redis'
import bodyParser from 'body-parser';
import moment from 'moment';
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';

import config from './config/config';
import User from './entities/user';
import * as LoginUtils from './utils/login_utils';

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


/*** Configure passport ***/

function createSessionStoredUser(user: User) {
  return {id: user.id, username: user.username, email: user.email};
}

passport.use(new LocalStrategy(
  {usernameField: 'email', passwordField: 'password'},
  (email, password, done) => {
    User.validate(email, password)
      .then((user: User | undefined) => {
        console.log(`THEN: ${user}`);
        // User does not exist, or incorrect credentials
        if (user === undefined) {
          return done(null, false);
        }
        return done(null, createSessionStoredUser(user));
      })
      .catch(err => {
        console.log('ERROR: ${err}');
        done(err);
      });
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});


/*** Configure middleware ***/

// Static file middleware
app.use('/static/bundle/', express.static(bundleRoot));

// bodyparser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Session middleware
const sessionMiddleware = express_session({
  cookie: {
    httpOnly: true,
    secure: config.session.cookie.secure,
  },
  genid: req => uuid(),
  name: config.session.name,
  resave: false,
  saveUninitialized: true,
  secret: config.session.secret,
  store: new RedisStore({
    host: config.redis.host,
    port: config.redis.port,
    ttl: moment.duration(config.session.ttl).asSeconds(),
    db: config.session.redisDB,
    prefix: config.session.redisPrefix,
    logErrors: config.mode === 'development',
  }),
});

app.use(sessionMiddleware);

// Passport middleware
// Should be kept after session middleware
app.use(passport.initialize());
app.use(passport.session());

// View engine setup
app.set('views', templatesRoot);
app.set('view engine', 'pug');


/*** Routes ***/

app.get('/', (req, res) => {
  res.render('index', {
    bundlePath: bundleManifest['main.js']
  });
});

app.post('/api/login/',
  passport.authenticate('local'),
  (req, res) => {
    res.json({message: 'Success!'});
  });

app.post('/api/logout/', (req, res) => {
  req.logout();
  res.json({message: 'Success!'});
});

app.post('/api/register/', (req, res) => {
  if (!LoginUtils.validateUsername(req.body.username)) {
    res.status(400);
    return res.json({message: 'Invalid username'});
  }

  if (!LoginUtils.validateEmail(req.body.email)) {
    res.status(400);
    return res.json({message: 'Invalid email'});
  }

  if (!LoginUtils.validatePassword(req.body.password)) {
    res.status(400);
    return res.json({message: 'Invalid password'});
  }

  User.create(req.body.username, req.body.email, req.body.password)
    .then((user: User) => {
      req.login(createSessionStoredUser(user), function (err) {
        if (err) {
          return res.json({message: 'Unable to login user'});
        }
        return res.json({message: 'Success!'});
      });
    })
    .catch(err => {
      res.status(400);
      return res.json({message: 'Unable to register; Duplicate username or email'});
    });
});

app.get('/test/', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({message: `Authenticated as: ${req.user.username}`});
  } else {
    res.json({message: 'Anonymous'});
  }
});

export {app, sessionMiddleware};
