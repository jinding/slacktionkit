module.exports = function (req, res, next) {
  var querystring = require('querystring');
  var request = require('request');

  var mailingId = req.body.text;

  if (req.body.token === 'rIJlkyMcOrHdzi8liiwZXlg5') { // only proceed if the token matches the one for CREDO Action
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
              var oneLineStats = body.replace('[[','').replace(']]','').split(',');
              var stats = {
                'date': oneLineStats[0],
                'sent': oneLineStats[1],
                'opens': oneLineStats[2],
                'clicks': oneLineStats[3],
                'unsubs_all': oneLineStats[4],
                'unsubs_bounce': oneLineStats[5],
                'unsubs_spam': oneLineStats[6],
                'actions': oneLineStats[7],
                'ntl': oneLineStats[8]
              }
              console.log(stats.date);
              console.log(stats.sent);
              console.log(stats.opens);
              console.log(stats.clicks);
              console.log(stats.unsubs_all);
              console.log(stats.unsubs_bounce);
              console.log(stats.unsubs_spam);
              console.log(stats.actions);
              console.log(stats.ntl);
              var openRate = 100*stats.opens/stats.sent;
              var cpo = 100*stats.clicks/stats.opens;
              var unsubRate = 100*stats.unsubs_all/stats.sent;
              var spamRate = 100*stats.unsubs_spam/stats.sent;
              var actionRate = 100*stats.actions/stats.sent;
              var netNtlPer1000Sent = 1000*(stats.ntl-stats.unsubs_all)/stats.sent;

              console.log(openRate);
              console.log(cpo);
              console.log(unsubRate);
              console.log(spamRate);
              console.log(actionRate);
              console.log(netNtlPer1000Sent);

              var bot = 'Mailing stats for mailing ID ' + mailingId + ':\n' +
                        'Date: ' + stats.date + '\n' +
                        'Sent: ' + stats.sent + '\n' +
                        'Opens: ' + stats.opens + ' (' + openRate.toPrecision(2) + '%)' + '\n' +
                        'Clicks: ' + stats.clicks + ' (CPO ' + cpo.toPrecision(2) + '%)' + '\n' +
                        'Unsubs (all): ' + stats.unsubs_all + ' (' + unsubRate.toPrecision(2) + '%)' + '\n' +
                        'Spam: ' + stats.spam + ' (' + spamRate.toPrecision(2) + '%)' + '\n' +
                        'Actions: ' + stats.actions + ' (' + actionRate.toPrecision(2) + '%)' + '\n' +
                        'NTL: ' + stats.ntl + '\n' +
                        'Net NTL: ' + stats.ntl-stats.unsubs_all + ' (' + netNtlPer1000Sent.toPrecision(2) + 'per 1K sent)'
                        ;
              return res.status(200).send(bot);
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