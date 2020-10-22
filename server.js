const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

let instanceID = "";

app.get('/', function (req, res) {
  res.render('index', { id: instanceID, error: null });
})
const server = http.listen(3000, function () {
  instanceID = genID(10);
  console.log('Started on 3000');
});
io.sockets.on('connection', function (socket) {
  socket.on('username', function (username) {
    socket.username = username;
    io.emit('is_online', rc4(instanceID, '<i style="color: green;">' + rc4(instanceID, socket.username) + ' has join the group</i>'));
    console.log("new message(encrypted):" + rc4(instanceID, '<i style="color: green;">' + rc4(instanceID, socket.username) + ' has join the group</i>'));
  });

  socket.on('disconnect', function (username) {
    io.emit('is_online', rc4(instanceID, '<i style="color: red;">' + rc4(instanceID, socket.username) + ' has left the group</i>'));
    console.log("new message(encrypted):" + rc4(instanceID, '<i style="color: red;">' + rc4(instanceID, socket.username) + ' has left the group</i>'));
  })

  socket.on('chat_message', function (message) {
    if (message !== "" && message.indexOf("<script>") <= 0 && message.indexOf("</script>") <= 0 && message.indexOf("<style>") <= 0 && message.indexOf("</style>") <= 0) {
      io.emit('chat_message', rc4(instanceID, '<strong>' + rc4(instanceID, socket.username) + '</strong>: ' + rc4(instanceID,message)));
      console.log("new message(encrypted):" + rc4(instanceID, '<strong>' + rc4(instanceID, socket.username) + '</strong>: ' + message));
    }
  });

});
function rc4(key, str) {
  var s = [], j = 0, x, res = '';
  if (str !== undefined) {
    for (var i = 0; i < 256; i++) {
      s[i] = i;
    }
    for (i = 0; i < 256; i++) {
      j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
      x = s[i];
      s[i] = s[j];
      s[j] = x;
    }
    i = 0;
    j = 0;
    for (var y = 0; y < str.length; y++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;
      x = s[i];
      s[i] = s[j];
      s[j] = x;
      res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
    }
  }
  return res;
}
function genID(length) {
  var result = '';
  var characters = 'ABDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
