/* based off of http://www.sitepoint.com/getting-started-slack-bots/ */

var express = require('express');
var bodyParser = require('body-parser');
var bucketsizebot = require('./bucketsize');
var mailingdmbot = require('./mailing-dm');
var mailingbot = require('./mailingbot');
var petitionbot = require('./petitionbot');
var calendarbot = require('./calendarbot');
var timerbot = require('./timerbot');
var mobilizePetition = require('./mobilize-new-petition');

var app = express();
var port = process.env.PORT || 3000;

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));


// test route
app.get('/', function (req, res) { res.status(200).send('Hello world!') });

// bucketsizebot
app.post('/bucket', bucketsizebot);

// mailingdmbot
app.post('/mailing-dm', mailingdmbot);

// mailingbot
app.post('/mailing', mailingbot);

// petitionbot
app.post('/petition', petitionbot);

// calendarbot
app.post('/calendar', calendarbot);

// timerbot
app.post('/timer', timerbot);

// CONTROLSHIFT - petition launched
app.post('/mobilize-new-petition', mobilizePetition);

// basic error handler
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(400).send(err.message);
});


app.listen(port, function () {
  console.log('Slack bot listening on port ' + port);
});