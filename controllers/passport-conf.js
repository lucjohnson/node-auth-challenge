'use strict';

// load up the strategies used by the app
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');

// requires the user model
var User = require('../models/user.js');

module.exports = function(passport) {
    
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    
    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    
    // import configuration for the FB login strategy
    var fbConfig = require('../secret/oauth-config.json').facebookAuth;
    fbConfig.callbackURL = '/oauth/facebook/callback';
    fbConfig.profileFields = ['email', 'gender', 'displayName'];

    // allows users to be authenticated by FB and then saved into our database
    var fbStrategy = new FacebookStrategy(fbConfig, 
        function(token, refreshToken, profile, done) {
            User.findOne({'facebook.id' : profile.id}, function(err, user) {
                if(user) {
                    return done(null, user);
                } else {
                    var newUser = new User();
                    
                    newUser.facebook.id = profile.id;
                    newUser.facebook.token = token;
                    newUser.facebook.displayName = profile.displayName;
                    newUser.facebook.email = (profile.emails !== undefined) ? profile.emails[0].value : null;
                    
                    if(newUser.facebook.email !== null) {
                        var hash = crypto.createHash("md5");
                        hash.update(newUser.facebook.email);
                        newUser.facebook.gravatarHash = hash.digest("hex");
                    }
                    
                    newUser.signUpMethod = 'fb';
                    
                    newUser.save(function(err) {
                        if(err) throw err;
                        
                        return done(null, newUser);
                    });
                }
            });
        });
    // tell passport to use the above strategy
    passport.use(fbStrategy);
    
    // strategy used to authenticate users who are logging in, checks to make sure password matches the stored hash
    passport.use(new LocalStrategy({ usernameField : 'inEmail', passwordField : 'inPassword', passReqToCallback : true}, 
        function(req, username, password, done) {
            User.findOne({'local.email' : username}, function(err, user) {
                if(err) { 
                    return done(err); 
                }
                if(!user) { 
                    return done(null, false); 
                };
                if(!user.validPassword(password)) {
                    return done(null, false);
                }
                return done(null, user);
            });
        }
    ));

    // strategy used to authenticate brand new users who are creating a local account
    passport.use('signup', new LocalStrategy({ usernameField : 'upEmail', passwordField : 'upPassword', passReqToCallback : true},
        function(req, username, password, done) {
            User.findOne({'local.email' : username}, function(err, user) {
                if(err) {
                    return done(err);
                }
                if (user) {
                    return done(null, false);
                }
                var newUser = new User();
                
                newUser.local.email = username;
                newUser.local.password = newUser.generateHash(password);
                newUser.local.displayName = req.body.upDisplayName;
                
                var hash = crypto.createHash("md5");
                hash.update(newUser.local.email);
                newUser.local.gravatarHash = hash.digest("hex");
                
                newUser.signUpMethod = 'local';
                
                newUser.save(function(err) {
                    if(err) {    
                        throw err;
                    }
                    return done(null, newUser);
                });
            });
        }
    ));
}