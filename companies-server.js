var express = require('express');
var parser = require('body-parser');

var mongoose = require('mongoose');
mongoose.connect('mongodb://test:test@ds235239.mlab.com:35239/heroku_qbtk2kvp');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
 console.log("connected to mongo");
});

var companiesSchema = new mongoose.Schema({
 symbol: String,
 name: String,
 sector: String,
 subindustry: String,
 address: String,
 date_added: Date,
 CIK: Number,
 frequency: Number
});

var companies = mongoose.model('companies', companiesSchema);

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
 res.send('companies page')
})

//i. Return list of all companies (just stock symbol and company name).
app.get('/companies/', function(req, resp) {
 // use mongoose to retrieve all books from Mongo
 companies.find({}, { symbol: 1, name: 1 }, function(err, data) {
  if (err) {
   resp.json({ message: 'Unable to connect to companies' });
  }
  else {
   // return JSON retrieved by Mongo as response
   resp.json(data);
  }
 });
});

// b. Given a stock symbol returns the company information for it
app.get('/companies/:symb', function(req, resp) {
 // use mongoose to retrieve all books from Mongo
 companies.find({ symbol: req.params.symb }, function(err, data) {
  if (err) {
   resp.json({ message: 'Unable to connect to stocks' });
  }
  else {
   // return JSON retrieved by Mongo as response
   resp.json(data);
  }
 });
});
