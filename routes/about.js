/**
 * @author Rohan Patel
 */

var express = require('express');
var router = express.Router();

// This file contains middleware that handles GET requests to the about page.
router.get('/', function (req, res, next) {
    res.render('about', {
        title: 'About us'
    });
});

module.exports = router;