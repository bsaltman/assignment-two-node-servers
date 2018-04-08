var express = require('express');
var parser = require('body-parser');

var mongoose = require('mongoose');
mongoose.connect('mongodb://test:test@ds235239.mlab.com:35239/heroku_qbtk2kvp');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
 console.log("connected to mongo");
});

var portSchema = new mongoose.Schema({
 id: Number,
 symbol: String,
 user: Number,
 owned: Number
});

var Portfolio = mongoose.model('portfolios', portSchema);

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
app.get('/', function(req, resp) {
 // use mongoose to retrieve all books from Mongo
 Portfolio.find({}, function(err, data) {
  if (err) {
   resp.json({ message: 'Unable to connect to portfolio' });
  }
  else {
   // return JSON retrieved by Mongo as response
   resp.json(data);
  }
 });
});

//g. Given a user id, return all the portfolio information for that user
app.get('/portfolio/:user', function(req, resp) {
 // use mongoose to retrieve all books from Mongo
 Portfolio.find({
  user: req.params.user
 }, function(err, data) {
  if (err) {
   resp.json({ message: 'Unable to connect to portfolio' });
  }
  else {
   // return JSON retrieved by Mongo as response
   resp.json(data);
  }
 });
});

//h. Given a user id, return a percentage summary of the portfolio information for that user.
app.get('/portfolio/breakdown/:usernumber', function(req, resp) {
 // use mongoose to retrieve all books from Mongo
 var userNumber = parseInt(req.params.usernumber)
 Portfolio.aggregate([{
   $group: {
    "_id": {
     user: "$user",
     symbol: "$symbol"
    },
    totalOwned: { $sum: "$owned" }
   }
  },
  {
   $match: { "_id.user": userNumber }
  },

  {
   $sort: { "_id.user": 1 }
  }
 ], function(err, data) {
  if (err) {
   resp.json({ message: 'Unable to connect to stocks' });
  }
  else {
   // return JSON retrieved by Mongo as response
   resp.json(data);
  }
 });
});

app.get('/portfolio/breakdowntwo/:usernumber', function(req, resp) {
 // use mongoose to retrieve all books from Mongo
 var userNumber = parseInt(req.params.usernumber)
 Portfolio.aggregate([{
   $group: {
    "_id": {
     user: "$user",
    },
    totalOwned: { $sum: "$owned" }
   }
  },
  {
   $match: { "_id.user": userNumber }
  },

  {
   $sort: { "_id.user": 1 }
  }
 ], function(err, data) {
  if (err) {
   resp.json({ message: 'Unable to connect to stocks' });
  }
  else {
   // return JSON retrieved by Mongo as response
   resp.json(data);
  }
 });
});
