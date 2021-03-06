module.exports = function (req, res, next) {
  var querystring = require('querystring');
  var request = require('request');

  var mailingId = req.body.text;

  if (req.body.token === 'rIJlkyMcOrHdzi8liiwZXlg5') { // only proceed if the token matches the one for CREDO Action
    if (mailingId) {
      request({
          url: 'https://act.credoaction.com/rest/v1/report/run/mailings_one_line_stats_ids_slack/',
          auth: { user: 'meteor', pass: process.env.AK_PASS },
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
              var oneLineStats = body.replace('[[','').replace(']]','').split('\", \"');
              var stats = {
                'date': oneLineStats[0].replace(/\"/g,''),
                'subjectLine': oneLineStats[1],
                'notes': oneLineStats[2],
                'sent': oneLineStats[3].replace(/\"/g,''),
                'opens': oneLineStats[4].replace(/\"/g,''),
                'clicks': oneLineStats[5].replace(/\"/g,''),
                'unsubs_all': oneLineStats[6].replace(/\"/g,''),
                'unsubs_bounce': oneLineStats[7].replace(/\"/g,''),
                'unsubs_spam': oneLineStats[8].replace(/\"/g,''),
                'actions': oneLineStats[9].replace(/\"/g,''),
                'ntl': oneLineStats[10].replace(/\"/g,'')
              }
              var openRate = 100*stats.opens/stats.sent;
              var cpo = 100*stats.clicks/stats.opens;
              var unsubRate = 100*stats.unsubs_all/stats.sent;
              var spamRate = 100*stats.unsubs_spam/stats.sent;
              var actionRate = 100*stats.actions/stats.sent;
              var netNtl = stats.ntl-stats.unsubs_all;
              var netNtlPer1000Sent = 1000*(stats.ntl-stats.unsubs_all)/stats.sent;

              var bot = 'Stats for mailing ID ' + mailingId + ': "' + stats.subjectLine + '"\n' + 
                        stats.notes + '\n' +
                        'Sent on: ' + stats.date + ' to ' + stats.sent + '\n' +
                        'Open rate: ' + openRate.toFixed(2) + '%\n' +
                        'CPO: ' + cpo.toFixed(2) + '%\n' +
                        'Action rate: ' + actionRate.toFixed(2) + '%\n' +
                        'Net NTL per 1K sent: ' + netNtlPer1000Sent.toFixed(2) + ' (' + netNtl + ' NTL)\n' +
                        'Unsub rate: ' + unsubRate.toFixed(2) + '%\n' +
                        'Spam rate: ' + spamRate.toFixed(2) + '%'
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