var express = require('express');
var parser = require('body-parser');

var mongoose = require('mongoose');
mongoose.connect('mongodb://test:test@ds235239.mlab.com:35239/heroku_qbtk2kvp');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
 console.log("connected to mongo");
});

var pricesSchema = new mongoose.Schema({
 date: Date,
 open: Number,
 high: Number,
 low: Number,
 close: Number,
 volume: Number,
 name: String
});

var Prices = mongoose.model('prices', pricesSchema);

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
 res.send('prices page')
})

app.get('/prices/', function(req, resp) {
 // use mongoose to retrieve all books from Mongo
 Prices.find({}, function(err, data) {
  if (err) {
   resp.json({ message: 'Unable to connect to stocks' });
  }
  else {
   // return JSON retrieved by Mongo as response
   resp.json(data);
  }
 });
});

// c. Given a stock symbol and a month, return the price information for each day in the specified month
// kept trying to use $month function but mongoDB not casting is a lie apparently so had to do the substring crap
app.get('/prices/month-prices/:symb/:month', function(req, resp) {
 Prices.aggregate([{
  $project: {
   open: 1,
   high: 1,
   low: 1,
   close: 1,
   volume: 1,
   name: 1,
   month: { $substr: ["$date", 5, 2] }
  }
 }, {
  $match: {
   name: req.params.symb,
   month: req.params.month
  }
 }], function(err, data) {
  if (err) {
   resp.json({ message: 'Unable to connect to stocks' });
  }
  else {
   // return JSON retrieved by Mongo as response
   resp.json(data);
  }
 });
});

//d. Given a stock symbol, return the average close value for each month in the year.
app.get('/prices/month-average/:symb', function(req, resp) {
 Prices.aggregate([{
   $project: {
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    volume: 1,
    name: 1,
    month: { $substr: ["$date", 5, 2] },
    year: { $substr: ["$date", 0, 4] }
   }
  }, {
   $match: {
    name: req.params.symb
   }
  }, {
   $group: {
    "_id": {
     name: "$name",
     month: "$month"
    },
    monthlyAverage: { $avg: "$close" }
   }
  }, {
   $sort: { "_id.month": 1 }
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

//e. Given a stock symbol and a date, return the price information for that date

app.get('/prices/:date/:symb', function(req, resp) {
 // use mongoose to retrieve all books from Mongo
 Prices.aggregate([{
  $project: {
   open: 1,
   high: 1,
   low: 1,
   close: 1,
   volume: 1,
   name: 1,
   date: { $substr: ["$date", 0, 10] }
  }
 }, {
  $match: {
   name: req.params.symb,
   date: req.params.date
  }
 }], function(err, data) {
  if (err) {
   resp.json({ message: 'Unable to connect to stocks' });
  }
  else {
   // return JSON retrieved by Mongo as response
   resp.json(data);
  }
 });
});

//f. Given a stock symbol, return the latest price information. This will return the price
//information with the newest date
app.get('/price/lastprice/:symb', function(req, resp) {
 Prices.aggregate([{
   $project: {
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    volume: 1,
    name: 1,
    date: 1
   }
  }, {
   $match: {
    name: req.params.symb
   }
  }, {
   $sort: { date: -1 }
  }, { $limit: 1 }

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
