var mongoose = require('mongoose');
var validator = require('validator');
var localMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var autoIncrement = require('mongoose-auto-increment');

var subCompany = {
    name: {type: String},
    address: {type: String},
    phone: {type: String},
    type: {type: String, validate: {
        validator: function(v) {
            return require('../../config/sectors').indexOf(v) >= 0;
        },
        message: '{VALUE} is not a valid job sector'
    }}
};

var logSchema = new Schema({
    date: {type: Date, required: true},
    hours: {type: Number, required: true},
    verified: {type: Boolean, required: true}
});

var userSchema = new Schema({
    name: {
          first: { type: String, required: true },
          last: { type: String, required: true }
        },
    username: { type: String, required: true, validate: {
        validator: function(v) {
            return validator.isEmail(v);
        },
        message: '{VALUE} is not a valid email'
    }},
    role: {type: String, required: true},
    userid: {type: Number, required: true, default: 0},
    createdOn: {type: Date, required: true, default: Date.now},
    school: String,
    company: subCompany,
    superid: Number,
    superName: String,
    semester: Number,
    hourLog: [ logSchema ],
    teacherVerified: Boolean,
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordResetUsed: Boolean
});

userSchema.plugin(localMongoose);
userSchema.plugin(autoIncrement.plugin, {model: 'User', field: 'userid'});

module.exports = mongoose.model('User', userSchema);