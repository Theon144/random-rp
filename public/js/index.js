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
    if (rooms.length == 0){
      window.location.href = '/create';
    } else {
      var scores = [];
      var total = 0;

      for (var i in rooms){
        var score = (rooms[rooms.length-1].users-rooms[i].users)+1;
        // ^-- The score should be higher for rooms with less players
        scores[rooms[i].id] = score;
        total += score;
      }

      pick = Math.random()*total;

      var current = 0;
      for (var id in scores){
        current+=scores[id];
        if (current > pick){
          window.location.href = '/g/'+id;
        }
      }
    }
  });
});
