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

room.prototype.join = function (socket){
  if (this.users.length == 0)
    clearTimeout(this.timeout);

  var Room = this;
  socket.get('nick', function(err, nick){
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
  });
}

room.prototype.leave = function (socket){
  var index = -1;
  for (var i in this.users){
    if (this.users[i].socket == socket){
      index = i;
      break;
    }
  }
  if (index == -1){
    return false;
  }

  this.users.splice(index, 1);
  var Room = this;
  socket.get('nick', function(err, nick){
    Room.send({
      type: 'system',
      message: 'user "'+nick+'" has left the room'
    });
  });
  socket.set('room', null);

  if (this.users.length == 0){
    this.timeout = setTimeout(function(){
      Room.chat.remove(Room.id, 'room empty');
    }, 60000);
  }
  this.chat.update();
}

room.prototype.send = function(message){
  message.time = Date.now();

  if (this.log.length == 10){
    this.log.shift();
  }
  this.log.push(message);

  for (var i in this.users){
    if (this.users[i].nick != message.nick){
      this.users[i].socket.emit('msg', message);
    }
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
  console.log(id);
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
