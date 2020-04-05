const express = require("express"), app = express(), server = require('http').createServer(app), 
io = require('socket.io')(server), bodyParser = require("body-parser"), path = require('path'), 
db = require("./models"), exphbs = require("express-handlebars"),
PORT = process.env.PORT || 8082;
 
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

app.set('socketio', io);

require("./routes/game-routes.js")(app);
require("./routes/review-routes.js")(app);

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

db.sequelize.sync({ force: false, alter: true }).then(function() {
  server.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
  });
});