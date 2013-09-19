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
app.set('port', process.env.PORT || 80);
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
  app.set('port', process.env.PORT || 7777);
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
io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
    io.set('match origin protocol', true);
});
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
      switch (data.action){
        case 'join':
          if (Chat.rooms[room]){ // If the user is already in another room
            Chat.rooms[room].leave(socket); // make him leave it
          }
          if (Chat.rooms[data.room]){ // If the room the user is trying to join exists
            if (data.nick){
              var nick = data.nick.trim();
              if (nick.length < 3 || nick.length > 16 || nick.search('[a-zA-Z0-9]') == -1){
                socket.emit('chat', {
                  status: "err",
                  err: "invalid nickname"
                });
                return;
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
              }
            } else {
              nick = 'Guest_'+Math.floor(Math.random()*9999);
            }
            socket.set('room', data.room, function(){
              Chat.rooms[data.room].join(socket, nick);
              socket.emit('chat', {
                status: "ok",
                action: "join",
                nick: nick
              });
            });
          } else {
            socket.emit('chat', {
              status: 'err',
              err: "room doesn't exist"
            });
          }
          break;
        case 'leave':
          if (Chat.rooms[room]){
            Chat.rooms[room].leave(socket);
          }
          break;
        case 'nick':
          if (Chat.rooms[room]){
            if (data.nick){
              Chat.rooms[room].changeNick(socket, data.nick);
            }
          }
          break;
      }
    });
  });

  socket.on('msg', function(message) {
    socket.get('room', function(err, room){
      if (Chat.rooms[room]){
        var user = Chat.rooms[room].getUserBySocket(socket);
        if (user){
          var data = {};
          var all = false;
          data.nick = user.nick;
          data.type = message.type;
  
          switch (message.type){
            case "chat":
            case "me":
              data.message = message.message;
              break;
            case "roll":
              var roll = dice.roll(message.message);
              if (roll.err){
                socket.emit('chat', {
                  status: 'err',
                  err: roll.err
                });
                return;
              } else {
                data.roll = message.message;
                data.rolls = roll.rolls;
                data.result = roll.result;
                data.name = message.name;
                all = true;
              }
              break;
          }
          Chat.rooms[room].send(data, socket, all);
        } else {
          socket.emit('chat', {
            status: 'err',
            err: "user not in room"
          });
        }
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
