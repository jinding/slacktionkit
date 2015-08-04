/* post topline page stats to the channel from actionkit using /page slash command */

var request = require('request');
var querystring = require('querystring');

module.exports = function (req, res, next) {

  var requestDate = req.body.text;
  var botPayload = {};

  if (req.body.token === 'zEYJqJLFFdnoRIsd9VGw3Ogm') { // only proceed if the token matches the one for CREDO Action
    if (requestDate) {
      request({
          url: 'https://act.credoaction.com/rest/v1/report/run/mailings_calendar_given_date_slack/',
          auth: { user: 'meteor', pass: 'dingbergalis' },
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
                  'subject': reportResponse[i][1],
                  'notes': reportResponse[i][2],
                  'excludeOrdering': reportResponse[i][3],
                  'scheduledFor': reportResponse[i][4],
                  'expectedSendCount': reportResponse[i][5],
                  'sortBy': reportResponse[i][6],
                  'limit': reportResponse[i][7],
                  'mailsPerSecond': reportResponse[i][8]
                };

                console.log('mailingId ' + fields.mailingId);
                console.log('subject ' + fields.subject);
                console.log('notes ' + fields.notes);
                console.log('priority ' + fields.excludeOrdering);
                console.log('scheduledFor ' + fields.scheduledFor ? fields.scheduledFor : 'NOT ON TIMER');
                console.log('expectedSendCount ' + fields.expectedSendCount);
                console.log('sortBy ' + fields.sortBy);
                console.log('limit ' + fields.limit);
                console.log('mailsPerSecond ' + fields.mailsPerSecond);

                var fallback = 'Priority ' + fields.excludeOrdering + ': ' + fields.subject + ' (' + fields.mailingId + ')\n' +
                              fields.notes + '\n' +
                              'scheduledFor ' + fields.scheduledFor ? fields.scheduledFor : 'NOT ON TIMER' + '\n' +
                              'expectedSendCount ' + formatNumber(fields.expectedSendCount);
                
                attachments.push({
                  'fallback': fallback,
                  'color': '#005b6e',
                  'pretext': 'Priority ' + fields.excludeOrdering,
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
                      } /* ,
                      {
                        'title': 'Sort',
                        'value': fields.sortBy,
                        'short': true
                      },
                      {
                        'title': 'Rate limit',
                        'value': fields.mailsPerSecond,
                        'short': true
                      } */
                  ]
                })
              };

              botPayload.username = 'actionkit';
              botPayload.channel = req.body.channel_id;
              botPayload.attachments = attachments;
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
/*  
  var path = process.env.INCOMING_WEBHOOK_PATH; // set in heroku config vars under settings
  var uri = 'https://hooks.slack.com/services' + path;
*/
  var uri = 'https://hooks.slack.com/services/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';

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