var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('cookie-session');
var flash = require('connect-flash');

var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

mongoose.connect(process.env.MONGO_URL);
autoIncrement.initialize(mongoose);

app.set('views', 'public/views');
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.use(session({secret: require('crypto').randomBytes(32).toString('hex')}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var User = require('./app/models/user.js');
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// configure routes
require('./app/routes/routes')(app);

app.listen(process.env.PORT);
console.log('Listening on port ' + process.env.PORT);