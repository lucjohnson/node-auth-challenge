'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

// the schema for our user model
var userSchema = new mongoose.Schema({
    local : { 
        email : {
            type : String,
            trim : true
        },
        password : String,
        displayName : {
            type : String,
            trim : true
        },
        gravatarHash : String
    },
    facebook : {
        id : String,
        token : String,
        displayName : String,
        email : String,
        gravatarHash : String
    },
    signUpMethod : String
});

// hashes a password before we save it to the database
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, 10);
}

// checks to make sure a provided password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
}

// creates and exposes the model to our app
module.exports = mongoose.model('User', userSchema);