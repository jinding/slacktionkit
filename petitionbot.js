/* 
  post topline page stats to the channel from actionkit using /petition slash command 
  curl -X POST http://localhost:3000/petition --data "user_name=jin&token=4xwsZfWgV3P1xq5DcgFZDahH&text=10109"  
*/

var request = require('request');
var querystring = require('querystring');

module.exports = function (req, res, next) {

  var pageId = req.body.text;
  var botPayload = {};

  if (req.body.token === '4xwsZfWgV3P1xq5DcgFZDahH') { // only proceed if the token matches the one for CREDO Action
    if (pageId) {
      request({
          url: 'https://act.credoaction.com/rest/v1/report/run/page_top_line_stats_slack/',
          auth: { user: 'meteor', pass: process.env.AK_PASS },
          qs: {
                'page_id': pageId,
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
                'title': oneLineStats[0][0].replace('\\u2018',"'").replace('\\u2019', "'").replace('\\u201C','"').replace('\\u201D','"'),
                'sent': oneLineStats[0][1],
                'usersMailed': oneLineStats[0][2],
                'actions': oneLineStats[0][3],
                'ntl': oneLineStats[0][4],
                'unsubs': oneLineStats[0][5]
              };
              var kickedTo = stats.sent - stats.usersMailed;
              var actionRate = 100 * stats.actions / stats.sent;
              var ntlRate = 100 * stats.ntl / stats.sent;
              var netNtl = stats.ntl - stats.unsubs;
              var netNtlPer1000Sent = 1000 * netNtl / stats.sent;
              var unsubRate = 100 * stats.unsubs / stats.sent;

              var fallback = 
                        '@' + req.body.user_name + ' Stats for <https://act.credoaction.com/report/petition_drilldown/?page_id=' + pageId + '|page ID ' + pageId + '>: "*' + 
                        stats.title + '*"\n' + 
                        '*Total mails sent:* ' + formatNumber(stats.sent) + '\n' +
                        '*Total users mailed:* ' + formatNumber(stats.usersMailed) + '\n' +
                        '*Users mailed more than once:* ' + formatNumber(kickedTo) + '\n' +
                        '*Action rate:* ' + actionRate.toFixed(2) + '%\n' +
                        '*NTL / mailed:* ' + ntlRate.toFixed(2) + '%\n' +
                        '*Net NTL per 1K sent:* ' + netNtlPer1000Sent.toFixed(2) + ' (' + formatNumber(netNtl) + ' NTL)\n' +
                        '*Unsub rate:* ' + unsubRate.toFixed(2) + '%\n' 
                       ;

              console.log(fallback);

              botPayload.username = 'actionkit';
              botPayload.channel = req.body.channel_id;
              botPayload.attachments = [ {
                   "fallback": fallback,

                    "color": "#005b6e",

                    "pretext": "@" + req.body.user_name + " Stats for petition ID " + pageId,

                    "title": stats.title,
                    "title_link": 'https://act.credoaction.com/report/petition_drilldown/?page_id=' + pageId,

                    "fields": [
                        {
                            "title": "Total mails sent",
                            "value": formatNumber(stats.sent),
                            "short": true
                        },
                        {
                            "title": "Action rate",
                            "value": actionRate.toFixed(2) + '%',
                            "short": true
                        },
                        {
                            "title": "Total users mailed",
                            "value": formatNumber(stats.usersMailed),
                            "short": true
                        },
                        {
                            "title": "NTL / mailed",
                            "value": ntlRate.toFixed(2) + '%',
                            "short": true
                        },
                        {
                            "title": "Users mailed more than once",
                            "value": formatNumber(kickedTo),
                            "short": true
                        },
                        {
                            "title": "Net NTL / 1K sent",
                            "value": netNtlPer1000Sent.toFixed(2) + '%',
                            "short": true
                        },
                        {
                            "title": "Net NTL",
                            "value": formatNumber(netNtl),
                            "short": true
                        },
                        {
                            "title": "Unsub rate",
                            "value": unsubRate.toFixed(2) + '%',
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
      return res.status(200).send('Need to specify a page ID');
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