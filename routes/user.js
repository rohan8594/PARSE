var express = require('express');
var async = require('async');
var router = express.Router();
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');

router.get('/my_account', function(req, res){
    var isLoggedIn = false;
    var isAnAdmin = false;

    if (req.isAuthenticated()){
        isLoggedIn = true;
        if (req.user.isAdmin === 1)
        {
            isAnAdmin = true;
        }
    }

   res.render('my_account', { message: req.flash('loginMessage'), isLogged: isLoggedIn, isAdmin: isAnAdmin});
});


router.get('/login', function(req, res) {
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
        res.redirect('/my_account');
    } else {
        res.render('login', {message: req.flash('loginMessage'), isLogged:isLoggedIn});
    }
});

router.post('/login', passport.authenticate('local-login', {
        successRedirect : '/user/my_account',
        failureRedirect : '/user/login',
        failureFlash : true
    }),
    function(req, res) {
        if (req.body.rememberMe) {
            req.session.cookie.maxAge = 1000 * 60 * 3;
        } else {
            req.session.cookie.expires = false;
        }
        res.redirect('/');
    });

router.get('/logout', function(req, res){
    req.logout();
    res.render('login', {message: req.flash('You have been logged out.')});
});

router.get('/register', function (req, res, next) {
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
        res.redirect('/my_account');
    } else {
        res.render('register', {message: req.flash('loginMessage'), isLogged:isLoggedIn});
    }});



router.post('/signup', function(req, res){
    var username = req.body.username;
    var name = req.body.Name;
    var password = req.body.password;
    var password2 = req.body.password2;

    console.log(req.body.username);
    console.log(req.body.Name);
    console.log(req.body.password);

    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if(errors){
        res.render('register',{
            errors:errors
        });
    } else {

                var data = {
                    user_id: username,
                    name: name,
                    password: bcrypt.hashSync(password, bcrypt.genSaltSync(10))
                };

                req.getConnection(function (err, connection) {

                    var query = connection.query(
                        'INSERT INTO user set ?', data, function (err, rows) {
                            if (err)
                                console.log("Error Inserting : %s ", err);
                            res.render('my_account');
                        });

                });
    }
});

module.exports = router;