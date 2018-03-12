var mysql = require('mysql');

var con = mysql.createConnection({
  host: "us-cdbr-iron-east-05.cleardb.net",
  user: "b3220b75dccc0a",
  password: "ddd8323b",
  database: "heroku_d6fcf8fd2312a32"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "INSERT INTO Issue (Title, desc) VALUES ('Title', 'Description')";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });
});