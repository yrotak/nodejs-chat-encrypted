const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
  extended: true
}))
app.set('view engine', 'ejs')

let public_channel = {
  name: "main",
  key: genID(10),
  public: true
};
let chats = [public_channel];
let usernames = [];
let chatsnames = [];
let instanceID = "test";
app.get('/chat', function(req, res) {
  res.render('chat', {
    id: instanceID,
    error: null
  });
})
const server = http.listen(7777, function() {
  console.log("started");
});
io.sockets.on('connection', function(socket) {
  setInterval(function() {
    chatsnames = [];
    for (const element of chats) {
      if (element != undefined && element != null)
        chatsnames.push(element.name);
    }
    io.emit('channels', chatsnames);
  }, 500);
  socket.on('create_chat', function(name, key, public) {
    var alreadyUsed = false;
    for (const element of chatsnames)
      if (element == name)
        alreadyUsed = true;
    if (!alreadyUsed) {
      if(name != null && name != undefined && key != null && key != undefined) {
        if (name !== "" && name.indexOf("<script>") <= 0 && name.indexOf("</script>") <= 0 && name.indexOf("<style>") <= 0 && name.indexOf("</style>") <= 0) {
          if (key !== "" && key.indexOf("<script>") <= 0 && key.indexOf("</script>") <= 0 && key.indexOf("<style>") <= 0 && key.indexOf("</style>") <= 0) {
            chats.push({
              name: name,
              key: key,
              public: public
            });
            console.log("created");
          }
        }
      }
    }
  });
  socket.on('get_key', function(channel, requestid) {
    if (getChannelAuth(channel)) {
      io.emit('set_key', getChannelKey(channel), channel, requestid);
    } else {
      io.emit('need_password', channel, requestid);
    }
  });
  socket.on('username', function(username, chat_name) {
    if (rc4(getChannelKey(chat_name), username) !== "" && rc4(getChannelKey(chat_name), username).indexOf("<script>") <= 0 && rc4(getChannelKey(chat_name), username).indexOf("</script>") <= 0 && rc4(getChannelKey(chat_name), username).indexOf("<style>") <= 0 && rc4(getChannelKey(chat_name), username).indexOf("</style>") <= 0) {
      socket.username = username;
    } else {
      socket.username = rc4(getChannelKey(chat_name), genID(5));
    }
  });
  socket.on('encryptedUsername', function(user, chat_name, key) {
    if (getChannelKey(chat_name) != key) {
      io.emit('invalid_key', user, chat_name);
    }
  });

  socket.on('chat_message', function(message, chat_name) {
    if (rc4(getChannelKey(chat_name), message) !== "" && rc4(getChannelKey(chat_name), message).indexOf("<script>") <= 0 && rc4(getChannelKey(chat_name), message).indexOf("</script>") <= 0 && rc4(getChannelKey(chat_name), message).indexOf("<style>") <= 0 && rc4(getChannelKey(chat_name), message).indexOf("</style>") <= 0) {
      io.emit('chat_message', rc4(getChannelKey(chat_name), '<strong>' + socket.username + '</strong>: ' + rc4(getChannelKey(chat_name), message)), chat_name);
    }
  });

});

function rc4(key, str) {
  var s = [],
    j = 0,
    x, res = '';
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

function getChannelKey(channel) {
  var key = "";
  for (const element of chats) {
    if (element.name == channel)
      key = element.key;
  }
  return key;
}

function getChannelAuth(channel) {
  var public = false;
  for (const element of chats) {
    if (element.name == channel)
      public = element.public;
  }
  return public;
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
