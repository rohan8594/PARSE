/**
 * @author Rohan Patel, Dion Lagos
 */

var express = require('express');
var async = require('async');
var router = express.Router();
var mysql = require('mysql');

/**
 * This file contains middleware that handles GET requests to the home page and
 * to the /issue/view/:id path. When a user requests the homepage, the first
 * middleware sub-stack will connect to the MySQL database, retrieve all the issue
 * information and render the index.ejs view.
 *
 * When a user clicks on an issue on the homepage, the next middleware sub-stack
 * will retrieve data of that issue from the database and render that data on the
 * display_issue.ejs view.
*/

var creds = {
    host: "us-cdbr-iron-east-05.cleardb.net",
    user: "b3220b75dccc0a",
    password: "ddd8323b",
    database: "heroku_d6fcf8fd2312a32"
};

router.get('/', function (req, res) {
    var pool = mysql.createPool(creds);
    var query1 = 'SELECT name FROM category';
    var query2 = 'SELECT issue.id, issue.title, category.name, issue.image, ' +
        'issue.description, issue.zipcode FROM issue INNER JOIN category ON issue.category = category.id;';

    var return_data = {};

    async.parallel([
        function (parallel_done) {
            pool.query(query1, {}, function (err, results) {
                if (err) return parallel_done(err);
                return_data.table1 = results;
                parallel_done();
            });
        },
        function (parallel_done) {
            pool.query(query2, {}, function (err, results) {
                if (err) return parallel_done(err);
                return_data.table2 = results;
                parallel_done();
            });
        }
    ], function (err) {
        if (err) console.log(err);
        pool.end();
        res.render('index', {title: "Team 04", category: return_data.table1, data: return_data.table2});
    });
});

router.get('/issue/view/:id', function (req, res, next) {

    var id = req.params.id;

    req.getConnection(function (err, connection) {

        var query = connection.query('SELECT * FROM issue WHERE id = ?', [id], function (err, rows) {

            if (err)
                console.log("Error Selecting : %s ", err);

            res.render('display_issue', {page_title: "View Result", data: rows});


        });

        //console.log(query.sql);
    });
});

module.exports = router;
