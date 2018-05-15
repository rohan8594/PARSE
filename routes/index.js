var express = require('express');
var async = require('async');
var router = express.Router();
var mysql = require('mysql');
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var thumb = require('node-thumbnail').thumb;
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
var upload = multer({ storage: storage, fileFilter: imageFilter });

cloudinary.config({
    cloud_name: 'csc648-team04',
    api_key: 738987786956472,
    api_secret: 'zEpvQdr-gVD-gjbL38278t70YIc'
});

var max = null;

/* GET home page. */
router.get('/', function (req, res) {

    req.getConnection(function(err, connection) {

        var query = connection.query("SELECT issue.id, issue.title, category.name, issue.thumbnail, " +
        "issue.description, issue.address, issue.zipcode FROM issue INNER JOIN category ON issue.category = category.id " +
        "WHERE issue.status != 1; SELECT name FROM category", [1,2], function(err,rows) {
            if(err)
                console.log("Error Selecting : %s ",err );

            res.render('index', {title: 'Team 04', data: rows[0], category:rows[1]});
            //console.log(rows)
        });
    });
});

router.get('/issue/view/:id', function (req, res, next) {

    var id = req.params.id;

    req.getConnection(function (err, connection) {

        var query = connection.query('SELECT * FROM issue JOIN user ON issue.user_id = user.user_id, status WHERE issue.status = status.id AND issue.id = ?', [id], function (err, rows) {

            if (err)
                console.log("Error Selecting : %s ", err);

            res.render('display_issue', {page_title: "View Result", data: rows});


        });

        //console.log(query.sql);
    });
});

router.get('/submit', function (req, res, next){
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
    }
    req.getConnection(function (err, connection) {

        var query = connection.query("SELECT max(id) as id FROM issue; SELECT name FROM category", [1,2], function (err, rows) {

            if (err)
                console.log("Error Selecting : %s ", err);

            max = rows[0][0].id;
            res.render('submit', {page_title: "Submit", category:rows[1], isLogged:isLoggedIn});

        });

        //console.log(query.sql);
    });
});

router.post('/post_issue', upload.single('issue_image'), function (req, res) {

    cloudinary.uploader.upload(req.file.path, function(result) {
        var image_name = result.public_id + '.' + result.format;
        var image_url = result.secure_url;
        var thumbnail_url = cloudinary.url(image_name, { width: 200, height: 200 });

        //console.log('Uploaded image: ' + image_name);
        //console.log('full image url:' + image_url);
        //console.log('thumbnail url:' + thumbnail_url);

        var title = req.body.title;
        var desc = req.body.description;
        var zipcode = req.body.zipcode;
        var category = req.body.issue_category;
        var address = req.body.address;
        var latitude = req.body.Lat;
        var longitude = req.body.Lng;

        req.checkBody('title', 'Title is required').notEmpty();
        req.checkBody('description', 'Description is required').notEmpty();
        req.checkBody('zipcode', 'Zip Code is required.').notEmpty();

        /* CHECK IF USER IS LOGGED IN */
        if(!req.isAuthenticated()){
            var username = req.body.username;
            var name = req.body.Name;
            var password = req.body.password;
            var password2 = req.body.password2;
            req.checkBody('username', 'Username is required').notEmpty();
            req.checkBody('password', 'Password is required').notEmpty();
            req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

            var errorList = req.validationErrors();

            if(errorList)
                res.render('submit',{
                    errors:errorList
                });
            max = max + 1;

            var data = {
                user_id: username,
                name: name,
                password: bcrypt.hashSync(password, bcrypt.genSaltSync(10))
            };

            req.getConnection(function (err, connection) {

                var query = connection.query(
                    "INSERT INTO issue (id, title, description, zipcode, category, image, thumbnail, latitude, longitude, address, status) VALUES (" + max + ",'" + title + "','"
                    + desc + "'," + zipcode + ",(SELECT category.id FROM category WHERE category.name = '" + category + "'),'"
                    + image_url + "','" + thumbnail_url + "','" + latitude + "','" + longitude + "','" + address + "'," + 1 + ");"
                    + "INSERT INTO user set ?", data,
                    function (err, rows) {
                        if (err)
                            console.log("Error Inserting : %s ", err);
                        res.redirect('/');
                    });

            });

        } else {

            var errors = req.validationErrors();

            if (errors)
                res.render('submit', {
                    errors: errors
                });
            max = max + 1;

            req.getConnection(function (err, connection) {

                var query = connection.query(
                    "INSERT INTO issue (id, title, description, zipcode, category, image, thumbnail, latitude, longitude, address, status) VALUES (" + max + ",'" + title + "','"
                    + desc + "'," + zipcode + ",(SELECT category.id FROM category WHERE category.name = '" + category + "'),'"
                    + image_url + "','" + thumbnail_url + "','" + latitude + "','" + longitude + "','" + address + "'," + 1 + ")", function (err, rows) {
                        if (err)
                            console.log("Error Inserting : %s ", err);
                        res.redirect('/');
                    });

            });
        }
    });
});

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    } else {
        //req.flash('loginMessage','You are not logged in');
        res.redirect('/user/login');
    }
}

module.exports = router;
