module.exports = function (req, res, next) {
  var querystring = require('querystring');
  var request = require('request');

  var bucket = req.body.text;
  console.log(bucket);

  request({
      url: 'https://act.credoaction.com/rest/v1/report/run/sql/',
      auth: { user: 'meteor', pass: 'dingbergalis' },
      qs: {
            'query': "SELECT COUNT(*) FROM core_user_page_tags upt JOIN core_tag t ON t.id = upt.tag_id JOIN core_subscription s ON s.user_id = upt.user_id AND s.list_id = 1 WHERE t.name = {{ tag }}",
            'tag': bucket
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
          console.log('error: ' + error + ' ' + body);
          return res.status(response.statusCode).send(body);
      } else return res.status(400).send('undefined error');
  });

}