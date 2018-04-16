var express = require('express');
var async = require('async');
var router = express.Router();
var mysql = require('mysql');
var bcrypt = require('bcryptjs');


router.get('/login', function (req, res, next) {
   res.render('login');
});

router.get('/register', function (req, res, next) {
    res.render('register');
});



router.post('/signup', function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if(errors){
        res.render('register',{
            errors:errors
        });
    } else {
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, function(err, hash) {

                var data = {
                    user_id: '103',
                    name: username,
                    password: hash
                };

                req.getConnection(function (err, connection) {

                    var query = connection.query(
                        'INSERT INTO user set ?', data, function (err, rows) {
                            if (err)
                                console.log("Error Inserting : %s ", err);
                            res.render('my_account');
                        });

                });

            });
        });

    }
});

module.exports = router;
