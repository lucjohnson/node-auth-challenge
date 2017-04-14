'use strict';

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var mongoose = require('mongoose');
var passport = require('passport');
var dbConfig = require('./secret/config-mongo.json');

mongoose.connect(dbConfig.url);

// set the COOKIE_SIG_SECRET with command export COOKIE_SIG_SECRET=$(uuidgen)
var cookieSignatureSecret = process.env.COOKIE_SIG_SECRET;
if(!cookieSignatureSecret) {
    console.error('Please set COOKIE_SIG_SECRET');
    process.exit(1);
}

// bring in our passport strategies, passing passport for configuration
require('./controllers/passport-conf.js')(passport);

var app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended : true
}));

// adds session support to the application and tells it to store session data in 
// local Redis database pass a {host: host-name} object to the RedisStore() 
// constructor to use a different host
app.use(session({
    secret: cookieSignatureSecret,
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({host: 'auth-redis.6rz2pe.ng.0001.usw2.cache.amazonaws.com', port: 6379})
}));

app.use(passport.initialize());
app.use(passport.session());

// load our routes and pass in our app and configured passport
require('./controllers/users-api.js')(app, passport);

// serve public files to anyone
app.use(express.static(__dirname + '/static/public'));

// block non-authenticated users from accessing secure files
app.use(function(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    
    res.redirect('/');
});

app.use(express.static(__dirname + '/static/secure'));

app.listen(80, function() {
    console.log('server is listening, so tell it what you want. what you really, really want');
});