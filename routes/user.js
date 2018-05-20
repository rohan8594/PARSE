var express = require('express');
var async = require('async');
var router = express.Router();
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');

/**
 * my_account GET method
 * Server first checks to see if the user is logged in, and then checks if they are an admin.
 * Then we query the database to obtain all of the issue rows to display on the dashboard.
 */
router.get('/my_account', function(req, res){
    var isLoggedIn = false;
    var isAnAdmin = false;

    if (req.isAuthenticated()){
        isLoggedIn = true;
        var user_name = req.user[0].user_id;
        if (req.user[0].isAdmin === 1)
        {
            isAnAdmin = true;
        }

        req.getConnection(function(err, connection) {

        var query = connection.query("SELECT issue.id, issue.status, issue.title, category.name, issue.thumbnail, " +
            "issue.description, issue.address, issue.zipcode FROM issue INNER JOIN category ON issue.category = category.id; " +
            "SELECT name FROM category", [1,2], function(err,rows) {
            if(err)
                console.log("Error Selecting : %s ",err );
            
            res.render('my_account', {message: req.flash('loginMessage'), title: 'Team 04', data: rows[0], category:rows[1], isLogged:isLoggedIn, isAdmin: isAnAdmin, user_name: user_name});
            //console.log(rows)
        });
    });
    } else {
        res.redirect('/user/login');
    }
});

/**
 * update_status POST method
 * Controller Action to update the database after an ajax call from the view.
 * Query takes the id and status from the body and uses it to update the proper issue.
 */
router.post('/update_status', function(req, res){
    console.log('body: ' + JSON.stringify(req.body));

    req.getConnection(function(err, connection){
       var query = connection.query("UPDATE issue SET status='" + req.body.status + "' WHERE id='" + req.body.id  + "';", function(err){
           if(err) console.log("Error Updating : %s ",err );
           res.send(req.body);

       });

    });
});

/**
 * login GET method
 * Displays login page along with any errors returned during form validation.
 */
router.get('/login', function(req, res) {
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
        var user_name = req.user[0].user_id;
        res.redirect('/user/my_account');
    } else {
        res.render('login', {message: req.flash('loginMessage'), isLogged:isLoggedIn, user_name: user_name});
    }
});

/**
 * login POST method
 * Uses passport to verify user credentials and then log them in.
 * On successful validation, the user is then logged in, and their session is kept in a cookie if they choose "remember me".
 * On failed validation, user is sent back to login page with error listed.
 */
router.post('/login',passport.authenticate('local-login', {
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


/**
 * logout GET method
 * Logs user out of session and redirects them to the login page.
 */
router.get('/logout', function(req, res){
    req.logout();
    res.render('login', {message: req.flash('You have been logged out.')});
});


/**
 * register GET method
 * Brings user to the registration page, but first checks to see if they are logged in and redirects them to their dashboard.
 */
router.get('/register', function (req, res, next) {
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
        var user_name = req.user[0].user_id;
        res.redirect('/my_account');
    } else {
        res.render('register', {message: req.flash('loginMessage'), isLogged:isLoggedIn, user_name: user_name});
    }});

/**
 * signup POST method
 * Registers a new user.
 * Form validation occurs first, checks to see if username and password are not empty and meet the requirements.
 * If requirements are met, a query inserts them into the database, using bcrypt to hash their passwords.
 */
router.post('/signup', function(req, res){
    var username = req.body.username;
    var name = req.body.Name;
    var password = req.body.password;
    var password2 = req.body.password2;

    // Field validation
    req.checkBody('Name', 'Name field cannot be empty').notEmpty();
    req.checkBody('username', 'Username cannot be empty').notEmpty();
    req.checkBody('password', 'Password cannot be empty').notEmpty();
    req.checkBody('password', 'Password must be at least 8 characters long').len(8, 100);
    req.checkBody('password2', 'Password must be at least 8 characters long').len(8, 100);
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