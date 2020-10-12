const mongoose = require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');

let userSchema = mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    psw: {
        type: String,
        required: true
    },
    secret: {
        type: String,
        required: true
    }
});

// Delete key password from object created when user is created
userSchema.methods.toJSON = function() {
    let user = this;
    let userObject = user.toObject();
    delete userObject.password;
    return userObject;
}

//Validator plugin for unique values
userSchema.plugin(uniqueValidator, {
    message: '{PATH} debe de ser único'
});

module.exports = mongoose.model('Usuario', userSchema);