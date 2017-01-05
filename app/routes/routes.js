var passport = require('passport');
var nodemailer = require('nodemailer');
var User = require('../models/user');
var School = require('../models/school');

var transporter = nodemailer.createTransport({
    service: process.env.EMAIL_PROV,
    auth: {
        user: process.env.EMAIL_ADDR,
        pass: process.env.EMAIL_PASS
    }
});

module.exports = function(app) {

    app.get('*', function(req, res, next) {
        if (req.headers['x-forwarded-proto'] != 'https') {
            res.redirect('https://coop-online.herokuapp.com' + req.url);
        } else {
            next();
        }
    });

    app.get('/', loggedIn(false), function (req, res) {
        res.render('landing', {messages: req.flash()});
    });

    app.get('/signup', loggedIn(false), function (req, res) {
        School.find({}, function(error, results) {
            if (error) {
                console.log(error);
            }
            res.render('signup', {messages: req.flash(), schools: results});
        });
    });

    app.post('/signup', function (req, res) {
        var newUser = {
            name: {
                first: req.body.fname,
                last: req.body.lname
            },
            username: req.body.email.toLowerCase(),
            role: req.body.role
        };
        if (newUser.role === 'Supervisor') {
            newUser.company = {
                name: req.body.cname,
                address: req.body.addr,
                phone: req.body.phone,
                type: req.body.type
            }
        } else {
            newUser.school = req.body.school;
        }
        if (newUser.role === 'Student') {
            newUser.superid = -1;
            newUser.superName = '';
            newUser.semester = req.body.semester;
            newUser.hourLog = [];
        }
        if (newUser.role === 'Teacher') {
            newUser.teacherVerified = false;
        }

        User.register(new User(newUser), req.body.password, function (error, user) {
            if (error) {
                console.log(error);
                req.flash('error', 'There was an error validating your information');
                res.redirect('/signup');
            } else {
                req.flash('success', 'Your account, ' + user.username + ', was successfully created');
                res.redirect('/login');
            }
        });
    });

    app.get('/login', loggedIn(false), function (req, res) {
        res.render('login', {messages: req.flash()});
    });

    app.post('/login', lower, passport.authenticate('local', {
        failureFlash: true,
        failureRedirect: '/login'
    }), function (req, res) {
        res.redirect('/main');
    });

    app.get('/logout', loggedIn(true), function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/forgot', function (req, res) {
        res.render('forgot', {messages: req.flash()});
    });

    app.post('/forgot', function (req, res) {
        var email = req.body.email.toLowerCase();
        var token = require('crypto').randomBytes(32).toString('hex');

        User.update({username: email}, {
            $set: {
                passwordResetToken: token,
                passwordResetExpires: new Date((new Date()).getTime() + 3600000),
                passwordResetUsed: false
            }
        }, function (error, result) {
            if (error) {
                console.log(error);
            } else if (result.n < 1 || result.nModified < 1) {
                req.flash('error', 'No user was found for the given email');
                res.redirect('/forgot');
            } else {
                transporter.sendMail({
                        to: email,
                        subject: 'Co-op Online Password Reset',
                        html: '<p>You are recieving this email because you (or someone else) requested a password reset for your account on Co-op Online.</p><p>Click <a href="' + process.env.URL + '/password_reset?token=' + token + '">here</a> to reset your password.</p>'
                    },
                    function (error, info) {
                        if (error) {
                            console.log(error);
                            req.flash('error', 'There was an error sending the reset email');
                        } else {
                            req.flash('info', 'An email was sent to ' + email + ' with password reset instructions');
                            console.log(info);
                        }
                        res.redirect('/forgot');
                    });
            }
        });
    });

    app.get('/password_reset', function (req, res) {
        var token = req.query.token;
        User.findOne({passwordResetToken: token}, function (error, result) {
            if (error) {
                console.log(error);
                req.flash('error', 'There was an error resetting your password');
                res.redirect('/forgot');
            } else if (result) {
                if (new Date() < result.passwordResetExpires && !result.passwordResetUsed) {
                    res.render('reset', {token: token, messages: req.flash()});
                } else {
                    req.flash('error', 'The password reset has expired');
                    res.redirect('/forgot');
                }
            } else {
                req.flash('error', 'There was an error resetting your password');
                res.redirect('/forgot');
            }
        });
    });

    app.post('/password_reset', function (req, res) {
        var token = req.body.token;
        var password = req.body.password;

        User.findOne({passwordResetToken: token}, function (error, result) {
            if (error) {
                console.log(error);
                req.flash('error', 'There was an error resetting your password');
                res.redirect('/forgot');
            } else if (new Date() >= result.passwordResetExpires && !result.passwordResetUsed) {
                req.flash('error', 'The password reset has expired');
                res.redirect('/forgot');
            } else if (result) {
                result.setPassword(password, function () {
                    result.save();
                });
                result.passwordResetUsed = true;
                result.save();
                req.flash('success', 'Your password has been reset');
                res.redirect('/login');
            } else {
                req.flash('error', 'There was an error resetting your password');
                res.redirect('/forgot');
            }
        });
    });

    app.get('/main', loggedIn(true), function (req, res) {
        res.render('main', {user: req.user, messages: req.flash()});
    });

    app.get('/profile', loggedIn(true), function (req, res) {
        res.render('profile', {user: req.user, messages: req.flash()});
    });

    app.post('/profile', loggedIn(true), function (req, res) {
        var fname = req.body.fname;
        var lname = req.body.lname;
        var password = req.body.password;
        var semester = req.body.semester;
        var cname = req.body.cname;
        var address = req.body.address;
        var phone = req.body.phone;
        var type = req.body.type;

        var err = false;

        var toSet = {};

        if (fname !== '') {
            toSet['name.first'] = fname;
        }
        if (lname !== '') {
            toSet['name.last'] = lname;
        }

        if (req.user.role === 'Student') {
            if (semester === '1' || semester === '2') {
                toSet['semester'] = parseInt(semester);
            }
        }

        if (req.user.role === 'Supervisor') {
            if (cname !== '') {
                toSet['company.name'] = cname;
            }
            if (address !== '') {
                toSet['company.address'] = address;
            }
            if (phone !== '') {
                toSet['company.phone'] = phone;
            }
            if (type !== '') {
                toSet['company.type'] = type;
            }
        }

        User.update({userid: req.user.userid}, {$set: toSet}, function (error) {
            if (error) {
                console.log(error);
                err = true;
            }
        });
        if (password !== '') {
            User.findOne({userid: req.user.userid}, function (error, result) {
                if (error) {
                    console.log(error);
                    err = true;
                }
                result.setPassword(password, function () {
                    result.save();
                });
            })
        }
        if (!err) {
            req.flash('success', 'Information updated');
        } else {
            req.flash('error', 'There was an error updating your information');
        }
        res.redirect('/profile');
    });

    // Student pages

    app.get('/hours', hasRole('Student'), function (req, res) {
        User.aggregate([{$match: {userid: req.user.userid}}, {$unwind: '$hourLog'}, {
            $group: {
                _id: '$userid',
                total: {$sum: '$hourLog.hours'}
            }
        }], function (error, result) {
            if (error) {
                console.log(error);
                res.render('hours', {user: req.user, message: '', totalHours: 0, messages: req.flash()});
            } else {
                res.render('hours', {
                    user: req.user,
                    message: '',
                    totalHours: (result[0] ? result[0].total : 0),
                    messages: req.flash()
                });
            }
        });
    });

    app.post('/hours', hasRole('Student'), function (req, res) {
        var year = parseInt(req.body.year);
        var month = req.body.month;
        var day = parseInt(req.body.day);
        var h = parseFloat(req.body.hours);
        if (!checkDay(year, month, day)) {
            res.render('hours', {user: req.user, message: 'The given date was not valid', messages: req.flash()});
        } else {
            var monthN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month);
            var date = new Date(year, monthN, day, 0, 0, 0);
            var log = {date: date, hours: h, verified: false};
            User.update({username: req.user.username}, {$pull: {hourLog: {date: date}}}, function (e1) {
                if (log.hours != 0) {
                    User.update({username: req.user.username}, {
                        $push: {
                            hourLog: {
                                $each: [log],
                                $sort: {date: -1}
                            }
                        }
                    }, function (e2, na) {
                        if (e1 || e2 || na.nModified < 1) {
                            res.render('hours', {
                                user: req.user,
                                message: 'There was an error logging your hours'
                            });
                        } else {
                            res.render('hours', {
                                user: req.user,
                                message: h + ' hours successfully logged on ' + month + ' ' + day + ', ' + year
                            });
                        }
                    });
                } else {
                    res.render('hours', {
                        user: req.user,
                        message: 'Hours removed on ' + month + ' ' + day + ', ' + year
                    });
                }
            });
        }
    });

    app.get('/viewhours', hasRole('Student'), function (req, res) {
        res.render('viewhours', {user: req.user, messages: req.flash()});
    });

    app.get('/supervisor', hasRole('Student'), function (req, res) {
        User.find({role: 'Supervisor'}, function (error, results) {
            res.render('supervisor', {user: req.user, results: results, messages: req.flash()});
        });
    });

    app.post('/assignsuper', hasRole('Student'), function (req, res) {
        User.findOne({userid: req.body.id}, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                var name = result.name.first + ' ' + result.name.last;
                User.update({username: req.user.username}, {
                    '$set': {
                        'superid': req.body.id,
                        'superName': name
                    }
                }, function (error) {
                    if (error) {
                        res.send('There was a problem assigning your supervisor');
                    } else {
                        res.send('Successfully assigned your supervisor');
                    }
                });
            }
        });
    });

    // Supervisor pages

    app.get('/verifyhours', hasRole('Supervisor'), function (req, res) {
        User.find({superid: req.user.userid}, function (error, results) {
            if (error) {
                console.log(error);
            }
            res.render('verifyhours', {user: req.user, students: results, messages: req.flash()});
        });
    });

    app.post('/verifyhours', hasRole('Supervisor'), function (req, res) {
        var student = req.body.userid;
        User.findOne({userid: student}, function (error, result) {
            if (error) {
                console.log(error);
            }
            res.render('studenthours', {user: req.user, student: result, messages: req.flash()});
        });
    });

    app.post('/checkhours', hasRole('Supervisor'), function (req, res) {
        var err = false;
        for (var i = 0; i < req.body.hours.length; i++) {
            User.update({
                userid: req.body.id,
                hourLog: {$elemMatch: {date: new Date(req.body.hours[i])}}
            }, {'$set': {'hourLog.$.verified': true}}, function (error) {
                if (error) {
                    console.log(error);
                    err = true;
                }
            });
        }
        if (err) {
            res.send('There was an error verifying hours');
        } else {
            res.send('Hours successfully verified');
        }
    });

    // Teacher pages

    app.get('/studenthours', hasRole('Teacher'), function (req, res) {
        User.find({role: 'Student', school: req.user.school}, function (error, results) {
            if (error) {
                console.log(error);
            }
            res.render('allstudenthours', {user: req.user, students: results, messages: req.flash()});
        });
    });

    app.post('/studenthours', hasRole('Teacher'), function (req, res) {
        User.findOne({userid: req.body.userid, school: req.user.school}, function (error, result) {
            if (error) {
                console.log(error);
            }
            res.render('showhours', {user: req.user, student: result, messages: req.flash()});
        });
    });

    app.get('/viewsupervisors', hasRole('Teacher'), function (req, res) {
        User.find({role: 'Supervisor'}, function (error, results) {
            if (error) {
                console.log(error);
            }
            res.render('viewsupervisors', {user: req.user, supervisors: results, messages: req.flash()});
        });
    });

    app.get('/verifyteachers', hasRole('Teacher'), function (req, res) {
        User.find({role: 'Teacher', teacherVerified: false, school: req.user.school}, function (error, results) {
            if (error) {
                console.log(error);
            }
            res.render('verifyteachers', {user: req.user, teachers: results, messages: req.flash()});
        });
    });

    app.post('/verifyteachers', hasRole('Teacher'), function (req, res) {
        User.update({userid: req.body.userid, school: req.user.school}, {$set: {teacherVerified: true}}, function (error) {
            if (error) {
                console.log(error);
            }
            res.redirect('/verifyteachers');
        });
    });

    app.get('/adminverify', hasRole('Admin'), function(req, res) {
        User.find({role: 'Teacher', teacherVerified: false, school: req.user.school}, function (error, results) {
            if (error) {
                console.log(error);
            }
            res.render('verifyteachers', {user: req.user, teachers: results, messages: req.flash()});
        });
    });

    app.post('/adminverify', hasRole('Admin'), function (req, res) {
        User.update({userid: req.body.userid}, {$set: {teacherVerified: true}}, function (error) {
            if (error) {
                console.log(error);
            }
            res.redirect('/adminverify');
        });
    });

    function checkDay(year, month, day) {
        if (month === 'January' || month === 'March' || month === 'May' || month === 'October' || month === 'December') {
            return day >= 1 && day <= 31;
        } else if (month === 'February') {
            if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) {
                return day >= 1 && day <= 29;
            } else {
                return day >= 1 && day <= 28;
            }
        } else {
            return day >= 1 && day <= 30;
        }
    }

    // Middlewares

    function loggedIn(b) {
        return function (req, res, next) {
            if (b) {
                if (req.user) {
                    next();
                } else {
                    res.redirect('/login');
                }
            } else {
                if (req.user) {
                    res.redirect('/main');
                } else {
                    next();
                }
            }
        }
    }

    function hasRole(r) {
        return function (req, res, next) {
            if (req.user) {
                if (req.user.role === r) {
                    if (req.user.role == 'Teacher' && !req.user.teacherVerified) {
                        req.flash('info', 'You have not been verified as a teacher');
                        res.redirect('/main');
                    } else {
                        next();
                    }
                } else {
                    res.redirect('/main');
                }
            } else {
                res.redirect('/login');
            }
        }
    }

    function lower(req, res, next) {
        req.body.username = req.body.username.toLowerCase();
        next();
    }

    app.get('*', function(req, res) {
        res.status(404);
        res.render('404', {});
    });
};