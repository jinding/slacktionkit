/* 
  post unscheduled mailings for a given date to the channel from actionkit using /timer slash command
  curl -X POST http://localhost:3000/timer --data "user_name=jin&token=cVq5pNlL3f76yEBsRxKuGMpP&text=2015-08-15"
  INCOMING_WEBHOOK_PATH=/your/path/tokens node app
*/

var request = require('request');
var querystring = require('querystring');

module.exports = function (req, res, next) {

  var requestDate = req.body.text;
  var botPayload = {};

  if (req.body.token === process.env.TOKEN_TIMER) { // only proceed if the token matches the one for CREDO Action
    if (requestDate) {
      request({
          url: 'https://act.credoaction.com/rest/v1/report/run/mailings_timer_reminders_given_date_slack/',
          auth: { user: 'meteor', pass: process.env.AK_PASS },
          qs: {
                'date': requestDate,
                'cache_duration': '0' // set cache to 1 min
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
              var firstLine = '';

              for (var i=0; i < reportResponse.length; i++) {
                var fields = {
                  'mailingId': reportResponse[i][0],
                  'subject': reportResponse[i][1].replace('\\u2018',"'").replace('\\u2019', "'").replace('\\u201C','"').replace('\\u201D','"'),
                  'notes': reportResponse[i][2],
                  'excludeOrdering': reportResponse[i][3],
                  'expectedSendCount': reportResponse[i][4],
                  'sender': reportResponse[i][5]
                };

                if (i==0)
                  firstLine = 'Timer reminders for ' + requestDate + ':\n';
                else firstLine = '';

                var slackname = '';
                switch (fields.sender) {
                  case 'Heidi Hess': slackname = '@hhess - '; break;
                  case 'Josh Nelson': slackname = '@josh - '; break;
                  case 'Ari Chopelas': slackname = '@achopelas - '; break;
                  case 'Nicole Regalado': slackname = '@nregalado - '; break;
                  case 'Brandy Doyle': slackname = '@bdoyle - '; break;
                  case 'Kaili Lambe': slackname = '@klambe - '; break;
                  default: slackname = '';
                }

                var priority = (fields.excludeOrdering !== 'DOUBLEHIT' ? 'Priority ' : '');
                var fallback = firstLine + slackname + priority + fields.excludeOrdering + ': ' + fields.subject + ' (' + fields.mailingId + ')\n' +
                              fields.notes + '\n' +
                              'NOT ON TIMER ' + fields.sender + '\n' +
                              'expectedSendCount ' + formatNumber(fields.expectedSendCount);
                
                attachments.push({
                  'fallback': fallback,
                  'color': 'danger',
                  'pretext': firstLine + slackname + priority + fields.excludeOrdering,
                  'title': fields.subject + ' (' + fields.mailingId + ')',
                  'title_link': 'https://act.credoaction.com/mailings/drafts/' + fields.mailingId,
                  'text': fields.notes,
                  'fields': [
                      {
                        'title': 'Sender',
                        'value': fields.sender,
                        'short': true
                      },
                      {
                        'title': 'Count',
                        'value': formatNumber(fields.expectedSendCount),
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
                botPayload.text = 'All mailings for ' + requestDate + ' are on the timer!';
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