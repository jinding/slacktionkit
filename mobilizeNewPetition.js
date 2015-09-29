/* 
  post email calendar for a given date to the channel from actionkit using /calendar slash command
  curl -X POST http://localhost:3000/calendar --data "user_name=jin&token=zEYJqJLFFdnoRIsd9VGw3Ogm&text=2015-08-13"

  INCOMING_WEBHOOK_PATH=/your/path/tokens node app
*/

var request = require('request');
var querystring = require('querystring');

module.exports = function (req, res, next) {

  var petitionData = req.body.data;
  console.log(req);
  console.log(req.body);
  var botPayload = {};

  if (req.body.type == 'petition.launched') {

    var fallback = 'Title: ' + petitionData.title + '\n' +
                  'URL: ' + petitionData.url + '\n' +
                  'Creator: ' + petitionData.creator_name + '\n' +
                  'Who: ' + petitionData.who + '\n' +
                  'What: ' + petitionData.what + '\n' +
                  'Why: ' + petitionData.why;

    console.log(fallback);

    botPayload.username = 'controlshift';

    botPayload.attachments = [ {
      "fallback": fallback,
      "color": "#005b6e",
      "pretext": "New petition created!",
      "title": petitionData.title,
      "title_link": petitionData.url,
      "text": 'Creator: ' + petitionData.creator_name + '\n' +
              'Who: ' + petitionData.who + '\n' +
              'What: ' + petitionData.what + '\n' +
              'Why: ' + petitionData.why
    } ];

    botPayload.link_names = 1;

    // send results
    send(botPayload, function (error, status, body) {
      if (error) {
        return next(error);

      } else if (status !== 200) {
        // inform user that our Incoming WebHook failed
        return next(new Error('Incoming WebHook: ' + status + ' ' + body));

      } else {
        return res.status(200).end();
      }
    });
  }
}

function send (payload, callback) { 
  var path = process.env.INCOMING_WEBHOOK_PATH; // set in heroku config vars under settings
  var uri = 'https://hooks.slack.com/services' + path;

  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(payload)
  }, function (error, response, body) {
    if (error) {
      return callback(error);
    }

    callback(null, response.statusCode, body);
  });
}
