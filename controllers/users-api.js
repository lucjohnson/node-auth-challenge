'use strict';

var User = require('../models/user.js');

module.exports = function(app, passport) {
    
    // used by the FB passport strategy to authenticate users
    app.get('/oauth/facebook', passport.authenticate('facebook'));
    
    // called after a user properly authenticates on FB
    app.get('/oauth/facebook/callback', passport.authenticate('facebook'), 
        function(req, res) {
            res.redirect('/profile.html');
        });
    
    // gets and returns the currently signed in user's profile information, null if no user is
    // signed in
    app.get('/api/v1/profile', function(req, res) {
        if(req.user) { 
            res.json(req.user);
        } else {
            res.json(null);
        }
    });
    
    // ends the user's sign in session and redirects to the home page
    app.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // used to authenticate a user who is signing up for the first time
    app.post('/api/v1/signup', passport.authenticate('signup', { failWithError : true}), 
        function(req, res, next) {
            res.json(req.user);  
        },
        function(err, req, res, next) {
            res.json(err);
        });

    // used to authenticate a user who has a local account
    app.post('/api/v1/signin', passport.authenticate('local', {failWithError : true}), 
        function(req, res, next) {
            res.json(req.user);
        },
        function(err, req, res, next) {
            res.json(err);
        });

    // allows user to edit their display name in our system
    app.put('/api/v1/editDisplayName', function(req, res) {
        User.findById(req.user._id, function(err, user) {
            if(err) {
                throw err;
            }
            if(user.signUpMethod === 'local') {
                user.local.displayName = req.body.newDisplay;
            } else {
                user.facebook.displayName = req.body.newDisplay;
            }
            user.save(function(err) {
                if (err) {
                    throw err;
                }
                res.json(user);
            });
        })   
    });

    // allows user to change their password, must pass in their current password first
    app.put('/api/v1/editPassword', function(req, res) {
        User.findById(req.user._id, function(err, user) {
            if(err) {
                throw err;
            }
            if(!user.validPassword(req.body.currentPass)) {
                return res.json({"status" : "failed", "message" : "The current password you passed is incorrect"});
            }
            if(req.body.newPass !== req.body.confirmPass) {
                return res.json({"status" : "failed", "message" : "New password and confirmation do not match"});
            }
            user.local.password = user.generateHash(req.body.newPass);
            user.save(function(err) {
                if (err) {
                    throw err;
                }
                res.json(user);
            })
        })
    })
};