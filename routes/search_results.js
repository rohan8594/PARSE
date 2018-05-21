/**
 * This file contains middleware that handles GET requests to the search results page.
 * Essentially, this file handles the search functionality. A basic SQL % like query is
 * used to implement the search.
 *
 * @author Rohan Patel, Dion Lagos
 */

var express = require('express');
var router = express.Router();

/* GET search_results page. */
router.get('/', function (req, res, next) {
    var isLoggedIn = false;
    if (req.isAuthenticated()){
        isLoggedIn = true;
        var user_name = req.user[0].user_id;
    }

    var zip_code = req.query.zip_code;
    var issue_category = req.query.issue_category;
    console.log(issue_category);

    req.getConnection(function(err, connection) {

        var query = connection.query("SELECT issue.id, issue.title, category.name, issue.thumbnail, " +
            "issue.description, issue.address, issue.zipcode FROM issue INNER JOIN category ON issue.category = category.id " +
            "WHERE issue.status != 1 AND category.name LIKE '%" + issue_category + "%' AND zipcode LIKE '%" + zip_code + "%' " +
            "ORDER BY issue.Date desc; SELECT name FROM category", [1,2], function(err,rows) {
            if(err)
                console.log("Error Selecting : %s ",err );

            if(!rows[0].length){ // if search query returns no issues, we display the most recent issues instead of displaying an empty view
                var query = connection.query("SELECT * FROM issue INNER JOIN category ON issue.category = category.id " +
                    "WHERE issue.status != 1 order by date desc; SELECT name FROM category", [1,2], function (err,rows) {
                    if(err)
                        console.log("Error Selecting : %s ",err );

                    res.render('search_results', {title: 'Search Results', zcode: zip_code, data: rows[0], category:rows[1], isLogged: isLoggedIn, user_name: user_name});
                })
            }
            else {
                res.render('search_results', {title: 'Search Results', zcode: zip_code, data: rows[0], category:rows[1], isLogged: isLoggedIn, user_name: user_name});
                //console.log(rows)
            }
        });
    });

});

module.exports = router;