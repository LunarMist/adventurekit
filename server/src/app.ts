import errorhandler from 'errorhandler';
import path from 'path';
import express from 'express';
import expressSession from 'express-session';
import uuid from 'uuid/v4';
import connectRedis from 'connect-redis';
import bodyParser from 'body-parser';
import moment from 'moment';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import SGMail from '@sendgrid/mail';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express-serve-static-core';
import * as util from 'util';
import { LoginUtils } from 'rpgcore-common';

import config from './config/config';
import User from './entities/User';

// tslint:disable-next-line:variable-name
const SessionRedisStore = connectRedis(expressSession);

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

/*** Configure sendgrid ***/

SGMail.setApiKey(config.secret.sendgrid.apiKey);

/*** Configure passport ***/

function createSessionStoredUser(user: User) {
  return { id: user.id, username: user.username, email: user.email };
}

passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    try {
      const user: User | undefined = await User.validate(email, password);
      // User does not exist, or incorrect credentials
      if (user === undefined) {
        done(null, false);
      } else {
        done(null, createSessionStoredUser(user));
      }
    } catch (e) {
      done(e);
    }
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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session middleware
const sessionMiddleware = expressSession({
  cookie: {
    httpOnly: true,
    secure: config.session.cookie.secure,
  },
  genid: req => uuid(),
  name: config.session.name,
  resave: false,
  saveUninitialized: true,
  secret: config.session.secret,
  store: new SessionRedisStore({
    host: config.redis.host,
    port: config.redis.port,
    pass: config.redis.password,
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
  if (req.isAuthenticated()) {
    res.render('index', {
      bundlePath: bundleManifest['main.js'],
    });
  } else {
    res.redirect('/login/');
  }
});

app.get('/login/', (req, res) => {
  res.render('login', {
    bundlePath: bundleManifest['main.js'],
    usernameRequirementMessage: LoginUtils.USERNAME_REQUIREMENT_MESSAGE,
    passwordRequirementMessage: LoginUtils.PASSWORD_REQUIREMENT_MESSAGE,
  });
});

app.post(
  '/login/',
  passport.authenticate('local', { failWithError: true }),
  (req: Request, res: Response, next: NextFunction) => res.json({ message: 'Success!' }),
  (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.status === 400 || err.status === 401) {
      res.json({ message: 'Invalid username/password combination' });
    } else {
      next(err);
    }
  }
);

app.post('/logout/', (req, res) => {
  req.logout();
  res.json({ message: 'Success!' });
});

app.post('/register/', async (req, res, next) => {
  try {
    if (!LoginUtils.validateUsername(req.body.username)) {
      res.status(400);
      res.json({ message: 'Invalid username' });
      return;
    }

    if (!LoginUtils.validateEmail(req.body.email)) {
      res.status(400);
      res.json({ message: 'Invalid email' });
      return;
    }

    if (!LoginUtils.validatePassword(req.body.password)) {
      res.status(400);
      res.json({ message: 'Invalid password' });
      return;
    }

    // Create the user
    const user: User = await User.create(req.body.username, req.body.email, req.body.password);

    // Login the user
    const loginFunc = util.promisify<any>(req.login.bind(req));
    await loginFunc(createSessionStoredUser(user));

    // Sign the token with jwt
    const jwtSignFunc = util.promisify<any, any, any, any>(jwt.sign.bind(jwt));
    const regToken = await jwtSignFunc({ id: user.id }, config.registration.jwtSecret, { expiresIn: '3 day' });

    // Send a registration mail
    await SGMail.send({
      to: user.email,
      from: 'no-reply@adventurekit.app',
      subject: 'Please verify your email address',
      text: `Verification link: ${config.registration.urlBase}/verify/?token=${regToken}`,
    });

    // Report success
    res.json({ message: 'Success!' });
  } catch (e) {
    if (e.message.includes('idx_case_insensitive_username')) {
      res.status(400);
      res.json({ message: 'Username already in use' });
    } else if (e.message.includes('idx_case_insensitive_email')) {
      res.status(400);
      res.json({ message: 'Email already in use' });
    } else {
      next(e);
    }
  }
});

app.get('/verify/', (req, res, next) => {
  jwt.verify(req.query.token || '', config.registration.jwtSecret, async (err: VerifyErrors, decoded: any) => {
    try {
      if (err) {
        res.status(400);
        res.send('Invalid or expired token');
        return;
      }

      // Set email verified
      const user: User | undefined = await User.getById(decoded.id);
      if (user !== undefined) {
        await user.setEmailVerified(true);
      }
      res.send('Success!');
    } catch (e) {
      next(e);
    }
  });
});

app.get('/authorized/', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Authenticated as: ${req.user.username}`);
  } else {
    res.send('Anonymous');
  }
});

export { app, sessionMiddleware };
