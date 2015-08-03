/* post topline page stats to the channel from actionkit using /page slash command */

var request = require('request');
var querystring = require('querystring');

module.exports = function (req, res, next) {

  var pageId = req.body.text;
  var botPayload = {};

  if (req.body.token === '4xwsZfWgV3P1xq5DcgFZDahH') { // only proceed if the token matches the one for CREDO Action
    if (pageId) {
      request({
          url: 'https://act.credoaction.com/rest/v1/report/run/page_top_line_stats_slack/',
          auth: { user: 'meteor', pass: 'dingbergalis' },
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
              var oneLineStats = body.replace('[[','').replace(']]','').split('\", \"');
              var stats = {
                'title': oneLineStats[0],
                'sent': oneLineStats[1].replace(/\"/g,''),
                'usersMailed': oneLineStats[2].replace(/\"/g,''),
                'actions': oneLineStats[3].replace(/\"/g,''),
                'ntl': oneLineStats[4].replace(/\"/g,''),
                'unsubs': oneLineStats[5].replace(/\"/g,'')
              };
              var kickedTo = stats.sent - stats.usersMailed;
              var actionRate = 100 * stats.actions / stats.sent;
              var ntlRate = 100 * stats.ntl / stats.sent;
              var netNtl = stats.ntl - stats.unsubs;
              var netNtlPer1000Sent = 1000 * netNtl / stats.sent;
              var unsubRate = 100 * stats.unsubs / stats.sent;

              botPayload.text = 'Stats for <https://act.credoaction.com/report/petition_drilldown/?page_id=' + pageId + '|page ID ' + pageId + '>: "*' + stats.title + '*"\n' + 
                        '*Total mails sent:* ' + stats.sent + '\n' +
                        '*Total users mailed:* ' + stats.usersMailed + '\n' +
                        '*Users mailed more than once:* ' + kickedTo + '\n' +
                        '*Action rate:* ' + actionRate.toFixed(2) + '%\n' +
                        '*NTL / mailed:* ' + ntlRate.toFixed(2) + '%\n' +
                        '*Net NTL per 1K sent:* ' + netNtlPer1000Sent.toFixed(2) + ' (' + netNtl + ' NTL)\n' +
                        '*Unsub rate:* ' + unsubRate.toFixed(2) + '%\n' 
                       ;

              console.log(botPayload.text);

              botPayload.username = 'actionkit';
              botPayload.channel = req.body.channel_id;

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