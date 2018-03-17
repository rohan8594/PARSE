var express = require('express');
var router = express.Router();

/* GET home page. */
 router.get('/', function(req, res, next) {
     req.getConnection(function(err,connection){

         var query = connection.query('SELECT * FROM issue',function(err,rows)
         {

             if(err)
                 console.log("Error Selecting : %s ",err );

             res.render('index',{title:"Team 04",data:rows});

         });

         //console.log(query.sql);
     });
 });
router.get('/issue/view/:id', function (req, res, next) {

    var id = req.params.id;

    req.getConnection(function(err,connection){

        var query = connection.query('SELECT * FROM issue WHERE id = ?',[id],function(err,rows)
        {

            if(err)
                console.log("Error Selecting : %s ",err );

            res.render('display_issue',{page_title:"View Result",data:rows});


        });

        //console.log(query.sql);
    });
});

module.exports = router;
