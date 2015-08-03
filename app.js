var express = require('express');
var bodyParser = require('body-parser');
var hellobot = require('./hellobot');
var dicebot = require('./dicebot');
var bucketsizebot = require('./bucketsize');
var mailingdmbot = require('./mailing-dm');
var mailingbot = require('./mailingbot');

var app = express();
var port = process.env.PORT || 3000;

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));


// test route
app.get('/', function (req, res) { res.status(200).send('Hello world!') });

// hellobot
app.post('/hello', hellobot);

// dicebot
app.post('/roll', dicebot);

// bucketsizebot
app.post('/bucket', bucketsizebot);

// mailingbot
app.post('/mailing-dm', mailingdmbot);

// mailingbot
app.post('/mailing', mailingbot);

// basic error handler
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(400).send(err.message);
});


app.listen(port, function () {
  console.log('Slack bot listening on port ' + port);
});