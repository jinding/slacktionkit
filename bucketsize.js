module.exports = function (req, res, next) {
  var userName = req.body.user_name;
  var tag = req.body.text;

  if (tag) 
    var botPayload = 'There are ### current members tagged ' + tag + '.';
  else 
    var botPayload = "You didn't enter a tag.";
  
  return res.status(200).json(botPayload);
  
  //  return res.status(200).end(); -- for errors
  
}
