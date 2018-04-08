var express = require('express');
var parser = require('body-parser');

var mongoose = require('mongoose');
mongoose.connect('mongodb://test:test@ds235239.mlab.com:35239/heroku_qbtk2kvp');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
 console.log("connected to mongo");
});

var usersSchema = new mongoose.Schema({
 id: Number,
 first_name: String,
 last_name: String,
 email: String,
 salt: String,
 password: String
});

var Users = mongoose.model('users', usersSchema);

// create an express app
var app = express();
// tell node to use json and HTTP header features in body-parser
app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));

let port = 8080;
app.listen(port, function() {
 console.log("Server running at port= " + port);
});

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
 res.send('users page')
})

//a. login request username/passowrd given as post variables
app.post('/users/login', function(req, resp) {
 // use mongoose to retrieve all books from Mongo
 Users.find({
   email: req.body.email,
   password: req.body.password
  },
  function(err, data) {
   if (err) {
    resp.json({ message: 'Unable to connect to stocks' });
   }
   else {
    // return JSON retrieved by Mongo as response
    resp.json(data);
   }
  });
});

app.get('/users/', function(req, resp) {
 // use mongoose to retrieve all books from Mongo
 Users.find({}, function(err, data) {
  if (err) {
   resp.json({ message: 'Unable to connect to stocks' });
  }
  else {
   // return JSON retrieved by Mongo as response
   resp.json(data);
  }
 });
});
