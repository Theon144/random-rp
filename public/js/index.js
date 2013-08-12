$(document).ready(function(){
  var socket = io.connect('http://'+window.location.hostname);
  var rooms;
  socket.on('room_list', function(data){
    rooms = data;
    rooms.sort(function(a, b){
      return a.users - b.users;
    });
    $('#list').html(Mustache.render($('#roomEntry').html(), {rooms: data}));
  });
  socket.emit('room_list', 'subscribe');

  $('#showlist').click(function(){
    $('#listmodal').modal('show');
  });

  $('#newroomform').hide();
  $('#create').click(function(){
    $('#newroomform').slideToggle();
  });

  $('#join').click(function(){
    var room;
    for (var i in rooms){
      if (rooms[i].users != 0){
        room = rooms[i];
        break;
      }
    }
    if (room == undefined){
      window.location.href = '/create';
    } else {
      window.location.href = '/g/'+room.id;
    }
  });
});
