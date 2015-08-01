module.exports = function (req, res, next) {
  var querystring = require('querystring');
  var request = require('request');

  var bucket = req.body.text;

  if (req.body.token === 'Aj1sX74iobPZSkUMLBf8POMJ') { // only proceed if the token matches the one for CREDO Action
    if (bucket) {
      request({
          url: 'https://act.credoaction.com/rest/v1/report/run/list_issue_group_size_specific/',
          auth: { user: 'meteor', pass: 'dingbergalis' },
          qs: {
                'tag': bucket,
                'cache_duration': '86400' // set cache to 1 day
              },
          method: 'POST', //Specify the method
          headers: {
            'Content-Type': 'application/json'
          }
      }, function(error, response, body){
          if (response && response.statusCode && response.statusCode == 200) {
              console.log('no errors ' + response.statusCode + ' ' + body);
              var bot = 'There are currently '+body.replace('[[','').replace(']]','')+' members tagged '+bucket;
              return res.status(200).send(bot);
          } else if (response && response.statusCode) {
              console.log('error: ' + response.statusCode + ' ' + body);
              return res.status(200).send(body);
          } else return res.status(400).send(body);
      });
    } else {
      return res.status(200).send('Need to specify a tag');
    }
  } else {
    return res.status(401).send('Unauthorized user');
  }
}