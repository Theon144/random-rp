exports.route = function(req, res){
  var id = req.route.params.id;
  if (Chat.rooms[id] != null){
    res.render('chat.ejs', {
      id: req.route.params.id,
      name: Chat.rooms[id].settings.name
    });
  } else {
    res.redirect('/');
  }
};
