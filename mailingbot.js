/* 
  post top line mailing stats to the channel from actionkit using /mailing slash command
  curl -X POST http://localhost:3000/mailing --data "user_name=jin&token=1jRCHaci09PoI5nuZi7LbKt9&text=15274"  
*/

var request = require('request');
var querystring = require('querystring');

module.exports = function (req, res, next) {

  var mailingId = req.body.text;
  var botPayload = {};

  if (req.body.token === '1jRCHaci09PoI5nuZi7LbKt9') { // only proceed if the token matches the one for CREDO Action
    if (mailingId) {
      request({
          url: 'https://act.credoaction.com/rest/v1/report/run/mailings_one_line_stats_ids_slack/',
          auth: { user: 'meteor', pass: 'dingbergalis' },
          qs: {
                'mailing_id': mailingId,
                'cache_duration': '600' // set cache to 10 min
              },
          method: 'POST', //Specify the method
          headers: {
            'Content-Type': 'application/json'
          }
      }, function(error, response, body){
          if (response && response.statusCode && response.statusCode == 200) {
              console.log('no errors ' + response.statusCode + ' ' + body);

              var oneLineStats = JSON.parse(body);              
              var stats = {
                'date': oneLineStats[0][0],
                'subjectLine': oneLineStats[0][1].replace('\\u2018',"'").replace('\\u2019', "'").replace('\\u201C','"').replace('\\u201D','"'),
                'notes': oneLineStats[0][2],
                'sent': oneLineStats[0][3],
                'opens': oneLineStats[0][4],
                'clicks': oneLineStats[0][5],
                'unsubs_all': oneLineStats[0][6],
                'unsubs_bounce': oneLineStats[0][7],
                'unsubs_spam': oneLineStats[0][8],
                'actions': oneLineStats[0][9],
                'ntl': oneLineStats[0][10]
              }
              var openRate = 100*stats.opens/stats.sent;
              var cpo = 100*stats.clicks/stats.opens;
              var unsubRate = 100*stats.unsubs_all/stats.sent;
              var spamRate = 100*stats.unsubs_spam/stats.sent;
              var actionRate = 100*stats.actions/stats.sent;
              var netNtl = stats.ntl-stats.unsubs_all;
              var netNtlPer1000Sent = 1000*(stats.ntl-stats.unsubs_all)/stats.sent;



              var fallback = '@' + req.body.user_name + ' Stats for mailing ID ' + mailingId + ': "*' + stats.subjectLine + '*"\n' + 
                        '_' + stats.notes + '_\n' +
                        '*Sent on:* ' + stats.date + ' to ' + formatNumber(stats.sent) + '\n' +
                        '*Open rate:* ' + openRate.toFixed(2) + '%\n' +
                        '*CPO:* ' + cpo.toFixed(2) + '%\n' +
                        '*Action rate:* ' + actionRate.toFixed(2) + '%\n' +
                        '*Net NTL per 1K sent:* ' + netNtlPer1000Sent.toFixed(2) + ' (' + netNtl + ' NTL)\n' +
                        '*Unsub rate:* ' + unsubRate.toFixed(2) + '%\n' +
                        '*Spam rate:* ' + spamRate.toFixed(2) + '%'
                       ;

              console.log(fallback);

              botPayload.username = 'actionkit';
              botPayload.channel = req.body.channel_id;

              botPayload.attachments = [ {
                   "fallback": fallback,

                    "color": "#005b6e",

                    "pretext": "@" + req.body.user_name + " Stats for mailing ID " + mailingId,

                    "title": stats.subjectLine,
                    "title_link": 'https://act.credoaction.com/report/mailing_drilldown/?mailing_id=' + mailingId,
                    "text": stats.notes,

                    "fields": [
                        {
                            "title": "Sent",
                            "value": stats.date + ' to ' + formatNumber(stats.sent),
                            "short": true
                        },
                        {
                            "title": "Open rate",
                            "value": openRate.toFixed(2) + '%',
                            "short": true
                        },
                        {
                            "title": "Net NTL",
                            "value": formatNumber(netNtl),
                            "short": true
                        },
                        {
                            "title": "CPO",
                            "value": cpo.toFixed(2) + '%',
                            "short": true
                        },
                        {
                            "title": "Unsub rate",
                            "value": unsubRate.toFixed(2) + '%',
                            "short": true
                        },
                        {
                            "title": "Action rate",
                            "value": actionRate.toFixed(2) + '%',
                            "short": true
                        },
                        {
                            "title": "Spam rate",
                            "value": spamRate.toFixed(2) + '%',
                            "short": true
                        },
                        {
                            "title": "Net NTL / 1K sent",
                            "value": netNtlPer1000Sent.toFixed(2) + '%',
                            "short": true
                        }
                    ]
                }];
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
      return res.status(200).send('Need to specify a mailing ID');
    }
  } else {
    return res.status(401).send('Unauthorized user');
  }
}

function send (payload, callback) {
/*  
  var path = process.env.INCOMING_WEBHOOK_PATH;
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