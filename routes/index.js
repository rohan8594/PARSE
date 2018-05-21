/**
 * This file contains middleware that handles GET requests to the home page, submit
 * issue page and to the /issue/view/:id path that is used for displaying individual
 * issue details. Also contains middleware that handles POST request for posting
 * an issue.
 *
 * @author Rohan Patel, Dion Lagos, Zhenru Huang
 */

var express = require('express');
var async = require('async');
var router = express.Router();
var mysql = require('mysql');
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var thumb = require('node-thumbnail').thumb;
var moment = require('moment-timezone');
var multer  = require('multer');
var cloudinary = require('cloudinary');
var storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter }); //multer is used to handle file uploads

cloudinary.config({
    cloud_name: 'csc648-team04',
    api_key: 738987786956472,
    api_secret: 'zEpvQdr-gVD-gjbL38278t70YIc'
});

var max = null;

/**
 * GET home page.
 * Query the database to obtain all of the issue rows that don't have status as 'not approved'
 * to display on the home page.
 */
router.get('/', function (req, res) {

    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
        var user_name = req.user[0].user_id; // if user is logged in, get username in order to display it on navbar
    }

    req.getConnection(function(err, connection) {

        var query = connection.query("SELECT issue.id, issue.title, category.name, issue.thumbnail, " +
            "issue.description, issue.address, issue.zipcode FROM issue INNER JOIN category ON issue.category = category.id " +
            "WHERE issue.status != 1 ORDER BY issue.Date desc; SELECT name FROM category", [1,2], function(err,rows) {
            if(err)
                console.log("Error Selecting : %s ",err );

            res.render('index', {title: 'Team 04', data: rows[0], category:rows[1], isLogged:isLoggedIn, user_name: user_name});
            //console.log(rows)
        });
    });
});

// Middleware that handles GET requests to the about page.
router.get('/about', function (req, res){
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
        var user_name = req.user[0].user_id;
    }
    res.render('about', {title: 'Team 04', isLogged:isLoggedIn, user_name:user_name});

});

// Retrieve data of individual issue from the database and render that data on the display_issue.ejs view.
router.get('/issue/view/:id', function (req, res, next) {
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
        var user_name = req.user[0].user_id;
    }
    var id = req.params.id;

    req.getConnection(function (err, connection) {

        var query = connection.query('SELECT *, category.name as category_name, user.name as user_name FROM issue JOIN user ON issue.user_id = user.user_id, status, category WHERE issue.status = status.id AND issue.category = category.id AND issue.id = ?', [id], function (err, rows) {

            if (err)
                console.log("Error Selecting : %s ", err);

            var formatted_date = moment.tz(rows[0].date, 'America/Los_Angeles').format('MMMM Do YYYY, h:mm a').toString() + " PST";
            console.log(formatted_date);
            res.render('display_issue', {page_title: "View Result", user_name: user_name, data: rows, isLogged:isLoggedIn, date: formatted_date});


        });

        //console.log(query.sql);
    });
});

// Middleware that handles GET requests to submit issue page
router.get('/submit', function (req, res, next){
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
        var user_name = req.user[0].user_id;
    }
    req.getConnection(function (err, connection) {

        var query = connection.query("SELECT max(id) as id FROM issue; SELECT name FROM category", [1,2], function (err, rows) {

            if (err)
                console.log("Error Selecting : %s ", err);

            max = rows[0][0].id;
            res.render('submit', {page_title: "Submit", category:rows[1], isLogged:isLoggedIn, user_name: user_name});

        });

        //console.log(query.sql);
    });
});

/**
 * post_issue POST method
 * Middleware that updates the database when a new issue is posted. Cloudinary is used
 * to upload image and thumbnail to external filesystem, while rest of the query takes
 * the issue title, description, zipcode, address from the body of submit view to update
 * the db. Image and thumbnail names come from cloudinary's 'result' object, and date
 * comes from node's moment module.
 */
router.post('/post_issue', upload.single('issue_image'), function (req, res) {
    if (typeof req.file === 'undefined') {
        console.log("whoopsie! no image. ");
        req.checkBody('issue_image', 'An image is required.').equals(typeof 'undefined');
        var errorList = req.validationErrors();
        if (errorList) {
            var isLoggedIn = false;
            if (req.isAuthenticated()) {
                isLoggedIn = true;
                var user_name = req.user[0].user_id;
            }
            req.getConnection(function (err, connection) {

                var query = connection.query("SELECT max(id) as id FROM issue; SELECT name FROM category", [1, 2], function (err, rows) {

                    if (err)
                        console.log("Error Selecting : %s ", err);

                    max = rows[0][0].id;
                    res.render('submit', {
                        page_title: "Submit",
                        category: rows[1],
                        isLogged: isLoggedIn,
                        user_name: user_name,
                        errors: errorList
                    });
                });
            });
        }
        return;
    }
    cloudinary.uploader.upload(req.file.path, function(result) {
        var image_name = result.public_id + '.' + result.format;
        var image_url = result.secure_url;
        var thumbnail_url = cloudinary.url(image_name, { width: 200, height: 200 }); //cloudinary auto generates thumbnail

        //console.log('Uploaded image: ' + image_name);
        //console.log('full image url:' + image_url);
        //console.log('thumbnail url:' + thumbnail_url);

        var title = req.body.title.replace(/'/g, "\\'");
        var desc = req.body.description.replace(/'/g, "\\'");
        var zipcode = req.body.zipcode;
        var category = req.body.issue_category;
        var address = req.body.address;
        var latitude = req.body.Lat;
        var longitude = req.body.Lng;
        var date = new moment(); // node's moment module is used to get datetime
        var formatted_date = moment.tz(date, 'America/Los_Angeles').format('YYYY-MM-DD HH:mm:ss');

        req.checkBody('title', 'Title is required').notEmpty();
        req.checkBody('description', 'Description is required').notEmpty();
        req.checkBody('address', 'Address is required').notEmpty();
        req.checkBody('zipcode', 'Zip Code is required.').notEmpty();

        /* CHECK IF USER IS LOGGED IN */
        if(!req.isAuthenticated()){
            var username = req.body.username;
            var name = req.body.Name;
            var password = req.body.password;
            var password2 = req.body.password2;
            req.checkBody('Name', 'Name field cannot be empty').notEmpty();
            req.checkBody('username', 'Username cannot be empty').notEmpty();
            req.checkBody('password', 'Password cannot be empty').notEmpty();
            req.checkBody('password', 'Password must be at least 8 characters long').len(8, 100);
            req.checkBody('password2', 'Password must be at least 8 characters long').len(8, 100);
            req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

            var errorList = req.validationErrors();

            if(errorList){
                var isLoggedIn = false;
                if (req.isAuthenticated()){
                    isLoggedIn = true;
                    var user_name = req.user[0].user_id;
                }
                req.getConnection(function (err, connection) {

                    var query = connection.query("SELECT max(id) as id FROM issue; SELECT name FROM category", [1,2], function (err, rows) {

                        if (err)
                            console.log("Error Selecting : %s ", err);

                        max = rows[0][0].id;
                        res.render('submit', {page_title: "Submit", category:rows[1], isLogged:isLoggedIn, user_name: user_name, errors: errorList});

                    });

                    //console.log(query.sql);
                });
            } else {
                max = max + 1;

                var user_id = username;
                var pwd = bcrypt.hashSync(password, bcrypt.genSaltSync(10)); //generate encrypted password

                //console.log(user_id);
                //console.log(name);
                //console.log(pwd);

                req.getConnection(function (err, connection) {

                    var query = connection.query(
                        "INSERT INTO user (user_id, name, password) VALUES ('" + user_id + "','" + name + "','" + pwd + "'); INSERT INTO issue (id, title, description, zipcode, category, image, thumbnail, latitude, longitude, address, status, user_id, date) VALUES (" + max + ",'" + title + "','"
                        + desc + "'," + zipcode + ",(SELECT category.id FROM category WHERE category.name = '" + category + "'),'"
                        + image_url + "','" + thumbnail_url + "','" + latitude + "','" + longitude + "','" + address + "'," + 2 + ",'" + username + "','" + formatted_date + "');", [1,2], function (err, rows) {
                            if (err)
                                console.log("Error Inserting : %s ", err);
                            res.redirect('/');
                        });

                });
            }
        } else {

            var errors = req.validationErrors();

            if (errors){
                var isLoggedIn = false;
                if (req.isAuthenticated()){
                    isLoggedIn = true;
                    var user_name = req.user[0].user_id;
                }
                req.getConnection(function (err, connection) {

                    var query = connection.query("SELECT max(id) as id FROM issue; SELECT name FROM category", [1,2], function (err, rows) {

                        if (err)
                            console.log("Error Selecting : %s ", err);

                        max = rows[0][0].id;
                        res.render('submit', {page_title: "Submit", category:rows[1], isLogged:isLoggedIn, user_name: user_name, errors: errors});

                    });

                    //console.log(query.sql);
                });
            } else {
                max = max + 1;

                req.getConnection(function (err, connection) {

                    var query = connection.query(
                        "INSERT INTO issue (id, title, description, zipcode, category, image, thumbnail, latitude, longitude, address, status, user_id, date) VALUES (" + max + ",'" + title + "','"
                        + desc + "'," + zipcode + ",(SELECT category.id FROM category WHERE category.name = '" + category + "'),'"
                        + image_url + "','" + thumbnail_url + "','" + latitude + "','" + longitude + "','" + address + "'," + 2 + ",'" + req.user[0].user_id + "','" + formatted_date + "');", function (err, rows) {
                            if (err)
                                console.log("Error Inserting : %s ", err);
                            res.redirect('/');
                        });

                });
            }
        }
    });
});

module.exports = router;
