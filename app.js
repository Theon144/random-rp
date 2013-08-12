var express = require('express')
  , http = require('http')
  , path = require('path')
  , chat = require('./chat.js');

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
      if (data.type == 'join'){
        if (room){
          if (Chat.rooms[room]){
            Chat.rooms[room].leave(socket);
          }
        }
        socket.set('nick', data.nick);
        socket.set('room', data.room);
        Chat.rooms[data.room].join(socket);
      } else if (data.type == 'leave'){
        if (Chat.rooms[room]){
          Chat.rooms[room].leave(socket);
        }
      }
    });
  });

  socket.on('msg', function(data) {
    console.log(data);
    socket.get('room', function(err, room){
      // TODO: Error checking
      socket.get('nick', function (err, nick) {
        Chat.rooms[room].send({
          nick: nick,
          message: data.message
        });
      });
    });
  });

  socket.on('disconnect', function () {
    socket.get('room', function(err, room){
      if (room != null){
        Chat.rooms[room].leave(socket);
      }
    });
  });

});
