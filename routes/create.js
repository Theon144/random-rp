exports.route = function(req, res){
  var name = req.body.name;
  var tags = req.body.tags;

  if (name == ""){
    name = "Unnamed RPG room";
  }

  var id = Chat.create(name, tags);
  res.redirect('/g/'+id);
};
