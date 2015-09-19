/* 
  post email calendar for a given date to the channel from actionkit using /calendar slash command
  curl -X POST http://localhost:3000/calendar --data "user_name=jin&token=zEYJqJLFFdnoRIsd9VGw3Ogm&text=2015-08-13"
*/

var request = require('request');
var querystring = require('querystring');

module.exports = function (req, res, next) {

  var requestDate = req.body.text;
  var botPayload = {};

  if (req.body.token === 'zEYJqJLFFdnoRIsd9VGw3Ogm') { // only proceed if the token matches the one for CREDO Action
    if (requestDate) {
      request({
          url: 'https://act.credoaction.com/rest/v1/report/run/mailings_calendar_given_date_slack/',
          auth: { user: 'meteor', pass: process.env.AK_PASS },
          qs: {
                'date': requestDate,
                'cache_duration': '60' // set cache to 1 min
              },
          method: 'POST', //Specify the method
          headers: {
            'Content-Type': 'application/json'
          }
      }, function(error, response, body){
          if (response && response.statusCode && response.statusCode == 200) {
              console.log('no errors ' + response.statusCode + ' ' + body);
              var reportResponse = JSON.parse(body);              
              var attachments = [];

              for (var i=0; i < reportResponse.length; i++) {
                var fields = {
                  'mailingId': reportResponse[i][0],
                  'subject': reportResponse[i][1].replace('\\u2018',"'").replace('\\u2019', "'").replace('\\u201C','"').replace('\\u201D','"'),
                  'notes': reportResponse[i][2],
                  'excludeOrdering': reportResponse[i][3],
                  'scheduledFor': reportResponse[i][4],
                  'expectedSendCount': reportResponse[i][5],
                  'sortBy': reportResponse[i][6],
                  'limit': reportResponse[i][7],
                  'mailsPerSecond': reportResponse[i][8],
                  'sender': reportResponse[i][9]
                };

                if (i==0)
                  var firstLine = 'Email calendar for ' + requestDate + ':\n';
                else var firstLine = '';

                var priority = (fields.excludeOrdering !== 'DOUBLEHIT' ? 'Priority ' : '');
                var fallback = firstLine + priority + fields.excludeOrdering + ': ' + fields.subject + ' (' + fields.mailingId + ')\n' +
                              fields.notes + '\n' +
                              'scheduledFor ' + fields.scheduledFor ? fields.scheduledFor : 'NOT ON TIMER' + '\n' +
                              'expectedSendCount ' + formatNumber(fields.expectedSendCount);
                
                attachments.push({
                  'fallback': fallback,
                  'color': (fields.scheduledFor ? 'good' : 'danger'),
                  'pretext': firstLine + priority + fields.excludeOrdering,
                  'title': fields.subject + ' (' + fields.mailingId + ')',
                  'title_link': 'https://act.credoaction.com/mailings/drafts/' + fields.mailingId,
                  'text': fields.notes,
                  'fields': [
                      {
                        'title': 'Count',
                        'value': formatNumber(fields.expectedSendCount),
                        'short': true
                      },
                      {
                        'title': 'On the timer',
                        'value': fields.scheduledFor ? fields.scheduledFor : 'NO',
                        'short': true
                      }
                  ]
                })
              };

              botPayload.username = 'actionkit';
              botPayload.channel = req.body.channel_id;
              botPayload.attachments = attachments;
              botPayload.link_names = 1;
              if (reportResponse.length == 0 ) {
                botPayload.text = 'No mailings are on the calendar for ' + requestDate;
              }

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

          } else if (response && response.statusCode) {
              console.log('error: ' + response.statusCode + ' ' + body);
              return res.status(200).send(body);
          } else return res.status(400).send(body);
      });
    } else {
      return res.status(200).send('Need to specify a date');
    }
  } else {
    return res.status(401).send('Unauthorized user');
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

var formatNumber = function (num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}