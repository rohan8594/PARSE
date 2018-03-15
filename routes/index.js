var express = require('express');
var router = express.Router();

/* GET home page. */
 router.get('/', function(req, res, next) {
     req.getConnection(function(err,connection){

         var query = connection.query('SELECT * FROM issue',function(err,rows)
         {

             if(err)
                 console.log("Error Selecting : %s ",err );

             res.render('index',{title:"Customers",data:rows});

         });

         //console.log(query.sql);
     });
 });


module.exports = router;
