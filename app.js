var express = require('express')
  , http = require('http')
  , path = require('path')
  , chat = require('./chat.js')
  , dice = require('./dice.js');

var routes = require('./routes');
routes.chat = require('./routes/chat.js').route;
routes.create = require('./routes/create.js').route;

var app = express();

// all environments
app.set('port', process.env.PORT || 7777);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/g/:id', routes.chat);
app.get('/create', routes.create);
app.post('/create', routes.create);

server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Random-rp starting on port ' + app.get('port'));
});

io = require('socket.io').listen(server);
Chat = new chat.chat(function(list){
  io.sockets.in('room_list').emit('room_list', Chat.list());
});

io.sockets.on('connection', function(socket) {
  socket.on('room_list', function (data){
    socket.join('room_list');
    socket.emit('room_list', Chat.list());
  });

  socket.on('chat', function(data) {
    socket.get('room', function(err, room){
      if (data.action == 'join'){
        if (Chat.rooms[room]){ // If the user is already in another room
          Chat.rooms[room].leave(socket); // make him leave it
        }
        if (Chat.rooms[data.room]){ // If the room the user is trying to join exists
          var nick = data.nick.trim();
          if (nick.length < 3 || nick.length > 16 || nick.search('[a-zA-Z0-9]') == -1){
            socket.emit('chat', {
              status: "err",
              err: "Invalid nickname"
            });
          } else {
            for (var i in Chat.rooms[data.room].users){
              if (Chat.rooms[data.room].users[i].nick == nick){
                socket.emit('chat', {
                  status: 'err',
                  err: "username already in use"
                });
                return;
              }
            }
            socket.set('room', data.room, function(){
              socket.set('nick', data.nick, function(){
                Chat.rooms[data.room].join(socket);
                socket.emit('chat', {
                  action: "join",
                  status: "ok"
                });
              });
            });
          }
        } else {
          socket.emit('chat', {
            status: 'err',
            err: "room doesn't exist"
          });
        }
      } else if (data.action == 'leave'){
        if (Chat.rooms[room]){
          Chat.rooms[room].leave(socket);
        }
      }
    });
  });

  socket.on('msg', function(data) {
    socket.get('room', function(err, room){
      if (Chat.rooms[room]){
        socket.get('nick', function (err, nick) {
          switch (data.type){
            case "me":
            case "chat":
              Chat.rooms[room].send({
                nick: nick,
                type: data.type,
                message: data.message
              });
              break;
            case "roll":
              roll = dice.roll(data.message);
              if (roll.err){
                socket.emit('chat', {
                  status: 'err',
                  err: roll.err
                });
              } else {
                Chat.rooms[room].send({
                  nick: nick,
                  type: 'roll',
                  roll: data.message,
                  rolls: roll.rolls,
                  result: roll.result,
                  name: data.name
                });
              }
          }
        });
      } else if (room) {
        socket.emit('chat', {
          status: 'err',
          err: "room doesn't exist"
        });
      } else {
        socket.emit('chat', {
          status: 'err',
          err: "not in any room"
        });
      }
    });
  });

  socket.on('disconnect', function () {
    socket.get('room', function(err, room){
      if (Chat.rooms[room]){
        Chat.rooms[room].leave(socket);
      }
    });
  });

});
