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
  var socket = io.connect('http://'+window.location.hostname);

  socket.emit('chat', {
    type: 'join',
    nick: "chicken",
    room: roomID
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
        socket.emit('msg', {
          type: "chat",
          message: message
        });
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
    $('#log').append(Mustache.render($('#messageTemplate').html(), data));
  });
});
