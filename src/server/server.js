
// Express 4
var express             = require('express');

var session             = require('express-session');

var MongoStore          = require('connect-mongo')(session);

var midError            = require('./error');

// Derby
var derby               = require('derby');

var racerBrowserChannel = require('racer-browserchannel');
var liveDbMongo         = require('livedb-mongo');

derby.use(require('racer-bundle'));

exports.setup = setup;

function setup(app, options) {

  var mongoUrl = process.env.MONGO_URL || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/derby-app';

  var store = derby.createStore({db: liveDbMongo(mongoUrl + '?auto_reconnect', {safe: true})});

  // Настраиваем derby-auth
  var auth = require('derby-auth');

  var strategies = {
    github: {
      strategy: require("passport-github").Strategy,
      conf: {
        clientID: 'eeb00e8fa12f5119e5e9',
        clientSecret: '61631bdef37fce808334c83f1336320846647115'
      }
    }
  }


  var options = {
    passport: {
      failureRedirect: '/login',
      successRedirect: '/'
    },
    site: {
      domain: 'http://localhost:3000',
      name: 'Derby-auth example',
      email: 'admin@mysite.com'
    },
    smtp: {
      service: 'Gmail',
      user: 'zag2art@gmail.com',
      pass: 'blahblahblah'
    }
  }

  auth.store(store, false, strategies);

  var expressApp = express()
    // Respond to requests for application script bundles
  expressApp.use(app.scripts(store))

  if (options && options.static) {
    expressApp.use(require('serve-static')(options.static));
  }


  expressApp.use(racerBrowserChannel(store));
  expressApp.use(store.modelMiddleware());

  expressApp.use(require('cookie-parser')());
  expressApp.use(session({
      secret: process.env.SESSION_SECRET || 'YOUR SECRET HERE'
    , store: new MongoStore({url: mongoUrl})
  }));

  expressApp.use(require('body-parser')());
  expressApp.use(require('method-override')());

  expressApp.use(auth.middleware(strategies, options));

  expressApp.use(app.router());


  expressApp.all('*', function(req, res, next) { next('404: ' + req.url); });

  expressApp.use(midError())

  return expressApp;
}



function createUserId(req, res, next) {
  var model = req.getModel();
  var userId = req.session.userId;
  if (!userId) userId = req.session.userId = model.id();
  model.set('_session.userId', userId);
  next();
}