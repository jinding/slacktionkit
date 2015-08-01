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
              var openRate = 100*stats.opens/stats.sent;
              var cpo = 100*stats.clicks/stats.opens;
              var unsubRate = 100*stats.unsubs_all/stats.sent;
              var spamRate = 100*stats.unsubs_spam/stats.sent;
              var actionRate = 100*stats.actions/stats.sent;
              var netNtl = stats.ntl-stats.unsubs_all;
              var netNtlPer1000Sent = 1000*(stats.ntl-stats.unsubs_all)/stats.sent;

              var bot = 'Mailing stats for mailing ID ' + mailingId + ':\n' + 
                        'Date: ' + stats.date.replace(/\"/g,'') + '\n' +
                        'Sent: ' + stats.sent + '\n' +
                        'Opens: ' + stats.opens + ' (' + openRate.toFixed(2) + '%)' + '\n' +
                        'Clicks: ' + stats.clicks + ' (CPO ' + cpo.toFixed(2) + '%)' + '\n' +
                        'Unsubs (all): ' + stats.unsubs_all + ' (' + unsubRate.toFixed(2) + '%)' + '\n' +
                        'Spam: ' + stats.unsubs_spam + ' (' + spamRate.toFixed(2) + '%)' + '\n' +
                        'Actions: ' + stats.actions + ' (' + actionRate.toFixed(2) + '%)' + '\n' +
                        'NTL: ' + stats.ntl + '\n' +
                        'Net NTL: ' + netNtl + ' (' + netNtlPer1000Sent.toFixed(2) + ' per 1K sent)'
                       ;
              console.log(bot);
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