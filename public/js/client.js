function resize () {
    $('#log').height($(window).height()-145);
    // I'll kiss whoever can fix this ---^
}

function isRoll(string){
 return (string.search("^([()+/*0-9-]*([0-9]+d[0-9F]+[!]*)[()+/*0-9-]*)+$") != -1) 
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
        case "nick":
          nick = data.nick;
          break;
      }
    }
  });


  $('#join').click(function(){
    nick = $('#nick').val();
    socket.emit('chat', {
      action: "join",
      nick: nick,
      room: roomID
    });
  });
  $('#nick').keypress(function (e) {
    if (e.which == 13) {
      $('#join').click();
      return false;
    }
  });

  var prevMessage = "";
  $('#send').click(function(){
    var message = $('#outMsg').val();
    if (message == ""){
      return;
    }
    $('#outMsg').val('');

    var data = {};
    var messageWords = message.split(' ');
    if (isRoll(messageWords[0])){
      data.type = "roll";
      data.message = messageWords[0];
      data.name = messageWords.slice(1).join(' ');
    } else {
      switch (messageWords[0]){
        case '/me':
          data.type = "me";
          data.message = message.slice(4);
          break;
        case '/nick':
          socket.emit('chat', {
            action: 'nick',
            nick: message.slice(6)
          });
          return;
        default:
          data.type = "chat";
          data.message = message;
      }
      data.nick = nick;
      $('#log').append(Mustache.render($('#template-'+data.type).html(), data));
    }
    socket.emit('msg', data);
    prevMessage = message;
  });
  $('#outMsg').keypress(function (e) {
    switch (e.keyCode){
      case 13:
        $('#send').click();
        return false;
      case 38:
        $('#outMsg').val(prevMessage);
        return false;
      case 40:
        $('#outMsg').val('');
        return false;
    }
  });

  socket.on('msg', function(data){
    $('#log').append(Mustache.render($('#template-'+data.type).html(), data));
    $('#log').scrollTop(9001);
  });
});
