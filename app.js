#!/usr/bin/env node

/*jshint node:true, indent:2, curly:false, eqeqeq:true, immed:true, latedef:true, newcap:true, noarg:true,
regexp:true, undef:true, strict:true, trailing:true, white:true */

/**
 * Module dependencies.
 */
var express = require('express'),
  OAuth2 = require('oauth').OAuth2,
  passport = require('passport'),
  util = require('util'),
  url = require('url'),
  Oauth2BasicStrategy = require('./oauth2-basic').Oauth2BasicStrategy;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database we are just using the session.id.
passport.serializeUser(function (user, done) {
  "use strict";

  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  "use strict";

  done(null, obj);
});

// Conditionally load OAuth 2.0 strategy and passport.initialize().
var conditionalOAuthStrategy = function (req, res, next) {
  "use strict";

  var init_passport;

  if (req.session && req.session.settings) {
    // Use the Oauth2BasicStrategy within Passport.
    passport.use(new Oauth2BasicStrategy({
        clientID: req.session.settings.client_id,
        clientSecret: req.session.settings.client_secret,
        authorizationURL: req.session.settings.auth_endpoint,
        tokenURL: req.session.settings.token_endpoint,
        // TODO: Make this https and add certs.
        callbackURL: "http://" + req.headers.host + "/auth/callback",
        skipUserProfile: true
      },
      function (accessToken, refreshToken, params, profile, done) {
        // Save the tokens to the session so we can access them later.
        // In a typical application, you would store these in a database.
        req.session.settings.accessToken = accessToken || '';
        req.session.settings.refreshToken = refreshToken || '';

        // asynchronous verification, for effect...
        process.nextTick(function () {
          // To keep the example simple, the we return the session id to
          // represent the logged-in user. In a typical application, you would
          // want to not use skipUserProfile above and instead set that to a
          // callback function that would make a user profile REST request to
          // the remote API and associate the returned account with a user
          // record in your database, and then return that user instead.
          return done(null, {id: req.session.id});
        });
      }
    ));

    // Instead of doing app.use(passport.initialize())
    init_passport = passport.initialize();

    init_passport(req, res, next);
  } else {
    // Instead of doing app.use(passport.initialize())
    init_passport = passport.initialize();

    init_passport(req, res, next);
  }
};

var app = express();

// Configure Express server.
app.configure(function () {
  "use strict";

  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  //app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));

  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  // Conditionally load the OAuth 2.0 Strategy based on user settings. Based off these examples:
  // http://stackoverflow.com/questions/9348505/avoiding-image-logging-in-express-js/9351428#9351428
  // http://stackoverflow.com/questions/13516898/disable-csrf-validation-for-some-requests-on-express
  app.use(conditionalOAuthStrategy);
  app.use(passport.session());

  app.use(app.router);
});

app.get('/', function (req, res) {
  "use strict";

  var redirect_uri = "http://" + req.headers.host + "/auth/callback";

  res.render('index', { oauth2: req.session.settings, redirect_uri: redirect_uri });
});

app.post('/settings', function (req, res) {
  "use strict";

  // Save the OAuth 2.0 Client settings in the session.
  req.session.settings = {};
  req.session.settings.client_id = req.body.client_id;
  req.session.settings.client_secret = req.body.client_secret;
  req.session.settings.scope = req.body.scope;
  req.session.settings.auth_endpoint = req.body.auth_endpoint;
  req.session.settings.token_endpoint = req.body.token_endpoint;

  res.render('login');
});

app.post('/refresh', function (req, res, next) {
  "use strict";

  // Initialize an OAuth2 object with our settings.
  var auth_url = url.parse(req.session.settings.auth_endpoint),
    callback,
    token_url = url.parse(req.session.settings.token_endpoint),
    oa2 = new OAuth2(
      req.session.settings.client_id,
      req.session.settings.client_secret,
      auth_url.protocol + "//" + auth_url.host,
      auth_url.pathname,
      token_url.pathname
    ),
    params = {
      "grant_type": "refresh_token"
    };

  callback = function (error, accessToken, refreshToken, results) {
    var redirect_uri = "http://" + req.headers.host + "/auth/callback";

    // Update accessToken in session with the new one.
    req.session.settings.accessToken = accessToken || '';
    res.render('index', { oauth2: req.session.settings, redirect_uri: redirect_uri });
  };

  // Request a new accessToken by using our refreshToken.
  oa2.getOAuthAccessToken(req.session.settings.refreshToken, params, callback);
});

app.get('/login', function (req, res) {
  "use strict";

  res.render('login');
});

// Use passport.authenticate() as route middleware to authenticate the request.
// The first step in OAuth 2.0 authentication will involve redirecting the
// user to the OAuth 2.0 Server. After logging in and authorizing the request,
// the OAuth 2.0 Server will redirect the user back to this application at
// /auth/callback to verify a successful exchange.
app.get('/auth',
  function (req, res, next) {
    "use strict";

    var callback = passport.authenticate('oauth2basic', { scope: [req.session.settings.scope] });
    callback(req, res, next);
  }
);

// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
app.get('/auth/callback',
  passport.authenticate('oauth2basic', { failureRedirect: '/login' }),
  function (req, res) {
    "use strict";

    res.redirect('/');
  }
);

app.get('/logout', function (req, res) {
  "use strict";

  if (req.session.passport) {
    // Make extra sure passport is empty.
    req.session.passport = null;
  }

  if (req.session) {
    // Kill the whole session, db, cache and all.
    req.session.destroy(function () {});
  }

  res.clearCookie("connect.sid");
  req.logout();
  res.redirect('/');
});

// Add static route for CSS and images.
app.use('/assets', express.static('views/assets', { maxAge: 86400000 }));

// Set port number to listen on.
var port = 3000;

// Output SSL warning.
console.log("\nWARNING!!! This OAuth 2.0 Client App is running over basic http and is unencrypted.");
console.log("This App is NOT secure and should only be used for local development testing and experimentation.\n");
console.log("The OAuth 2.0 Client App is running on port " + port + ".");
console.log("You can now access it in your browser on this server's IP/hostname/localhost.");
console.log("Example:");
console.log("http://192.168.0.1:" + port);
console.log("http://client.example.com:" + port);
console.log("http://localhost:" + port);

// Start the server on this port.
app.listen(port);

// Simple route middleware to ensure the user is authenticated.
//   Use this route middleware on any resource that needs to be protected. If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  "use strict";

  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
}
