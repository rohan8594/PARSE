var express = require('express');
var router = express.Router();

/* GET search_results page. */

router.get('/', function (req, res, next) {
    var name = req.query.name;
    var password = req.query.password;
    res.render('sign_up_results', {
        title: 'Sign up results',
        content: 'Sign up successed!' +'\n User Name:' + name + '\n password:' + password
    });
});
module.exports = router;