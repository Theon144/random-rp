function resize () {
    $('#log').height($(window).height()-145);
    // I'll kiss whoever can fix this ---^
}

function isRoll(string){
 return (string.search("^([()+/*0-9-]*([0-9]+d[0-9]+)[()+/*0-9-]*)+$") != -1) 
 // The regex above should match everything that looks like a dice roll/expression.
 // I had a complete regex, but it was this 70+ character abomination, so I rather
 // made a relatively simpler one.
}

$(document).ready(function(){
  resize();
  $(window).resize(resize);
  $('#nickModal').modal('show');

  var socket = io.connect('http://'+window.location.hostname);
  socket.on('chat', function(data){
    if (data.status == 'err'){
      alert(data.err);
    } else {
      switch (data.action){
        case "join":
          $('#nickModal').modal('hide');
          break;
      }
    }
  });


  $('#join').click(function(){
    socket.emit('chat', {
      action: "join",
      nick: $('#nick').val(),
      room: roomID
    });
  });
  $('#nick').keypress(function (e) {
    if (e.which == 13) {
      $('#join').click();
      return false;
    }
  });

  $('#send').click(function(){
    var message = $('#outMsg').val();
    $('#outMsg').val('');
    if (message != ""){
      if (isRoll(message)){
        socket.emit('msg', {
          type: "roll",
          message: message
        });
      } else {
        if (message.slice(0, 4) == '/me '){
          socket.emit('msg', {
            type: "me",
            message: message.slice(4)
          });
        } else {
          socket.emit('msg', {
            type: "chat",
            message: message
          });
        }
      }
    }
  });
  $('#outMsg').keypress(function (e) {
    if (e.which == 13) {
      $('#send').click();
      return false;
    }
  });

  socket.on('msg', function(data){
    $('#log').append(Mustache.render($('#template-'+data.type).html(), data));
    $('#log').scrollTop(9001);
  });
});
