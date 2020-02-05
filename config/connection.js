let mysql = require('mysql');

let con;

if(process.env.JAWSDB_URL){
  con = mysql.createConnection(process.env.JAWSDB_URL);
}
else{
  con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "null", //change
    database: "tcsPlay_db"
  })
}

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = con;