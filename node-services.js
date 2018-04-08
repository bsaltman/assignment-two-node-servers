var express = require('express');
var parser = require('body-parser');


var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
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

var portSchema = new mongoose.Schema({
    id: Number,
    symbol: String,
    user: Number,
    owned: Number
});

var Portfolio = mongoose.model('portfolios', portSchema);

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


app.listen(process.env.PORT, function() {
    console.log("Server running at port= " + process.env.PORT);
});

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

// c. Given a stock symbol and a month, return the price information for each day in the specified month
// kept trying to use $month function but mongoDB not casting is a lie apparently so had to do the substring crap
app.get('/prices/month-prices/:symb/:month', function(req, resp) {
    Prices.aggregate([{
        $project: {
            open: 1,
            high: 1,
            date: 1,
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
//Will simplify to a single query in future refactoring. Most likely after due date :/
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
// h continued
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
