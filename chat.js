function makeid()
{
    var abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var result = "";
    for( var i=0; i < 16; i++ )
        result += abc.charAt(Math.floor(Math.random() * abc.length));
    return result;
}

var chat = function(update){
  this.rooms = [];
  this.update = update;
}

var room = function(id, chat, timeout, settings){
  this.id = id;
  this.chat = chat;
  this.timeout = timeout;
  this.settings = settings;
  this.users = [];
  this.log = [];
}

room.prototype.join = function (socket, nick){
  if (this.users.length == 0)
    clearTimeout(this.timeout);

  var Room = this;
  Room.send({
    type: 'system',
    message: 'user "'+nick+'" has joined the room'
  });

  var users = "";
  for (var i in Room.users){
    if ( i != Room.users.length-1 ){
      users += Room.users[i].nick+', '
    } else {
      users += Room.users[i].nick
    }
  }
  if (users != ""){
    socket.emit('msg', {
      type: "system",
      message: "users now in room: "+users
    });
  }
  for (var i in Room.log){
    socket.emit('msg', Room.log[i]);
  }
  Room.users.push({
    nick: nick,
    socket: socket
  });
  Room.chat.update();
}

room.prototype.leave = function (socket){
  var user = this.getUserBySocket(socket);

  this.users.splice(user.index, 1);
  var Room = this;
  Room.send({
    type: 'system',
    message: 'user "'+user.nick+'" has left the room'
  });
  socket.set('room', null);

  if (this.users.length == 0){
    this.timeout = setTimeout(function(){
      Room.chat.remove(Room.id, 'room empty');
    }, 60000);
  }
  this.chat.update();
}

room.prototype.send = function(message, socket, all){
  message.time = Date.now();

  if (this.log.length == 10){
    this.log.shift();
  }
  this.log.push(message);

  var index = this.getUserBySocket(socket).index;
  for (var i in this.users){
    if (i != index || all){
      this.users[i].socket.emit('msg', message);
    }
  }
}

room.prototype.getUserBySocket = function(socket){
  for (var i in this.users){
    if (this.users[i].socket == socket){
      return {
        nick: this.users[i].nick,
        index: i
      }
    }
  }
  return false;
}

room.prototype.changeNick = function(socket, nick){
  var user = this.getUserBySocket(socket);
  if (user){
    for (var i in this.users){
      if (this.users[i].nick == nick){
        socket.emit('chat', {
          status: 'err',
          err: 'error: username already in use'
        });
        return
      }
    }
    socket.emit('chat', {
      status: 'ok',
      action: 'nick',
      nick: nick
    });
    this.send({
      type: 'system',
      message: 'user '+user.nick+' is now known as '+nick
    });
    this.users[user.index].nick = nick;
  }
}

chat.prototype.create = function (name, tags){
  console.log('Creating room "'+name+'".');
  if (name == undefined)
    name = "Unnamed RPG Room"

  do
    var id = makeid();
  while (this.rooms[id] != null)

  timeout = setTimeout(function(){ chat.remove(id, 'room empty') }, 60000);
  this.rooms[id] = new room(id, this, timeout, { 
    name: name,
    tags: tags,
    private: false
  });

  var chat = this;

  this.update();
  return id;
};

chat.prototype.remove = function (id, reason){
  this.rooms[id].send({
    type: 'system',
    message: 'removed',
    reason: reason
  });
  console.log('Deleting room '+id+' because: '+reason);
  delete this.rooms[id];
  this.update();
};


chat.prototype.list = function(){
  tmp = [];
  for (var room in this.rooms){
    if (this.rooms[room].users.length != 0
     && this.rooms[room].settings.private == false){
      tmp.push({
        name: this.rooms[room].settings.name,
        tags: this.rooms[room].settings.tags,
        users: this.rooms[room].users.length,
        id: room
      });
    }
  }
  return tmp;
};

exports.chat = chat;
