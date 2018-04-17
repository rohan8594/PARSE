var express = require('express');
var router = express.Router();

/* GET about page. */
router.get('/', function (req, res, next) {
    res.render('sign_up', {
        title: 'Sign up'
    });
});

module.exports = router;