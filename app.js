var express = require('express')
  , routes  = require('./routes')
  , user    = require('./routes/user')
  , http    = require('http')
  , fs      = require('fs')
  , path    = require('path');

var app = express();
var port = 3000;

// all environments
app.set('port', process.env.PORT || port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var users = [];

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function(socket){

	io.sockets.emit('newUserList', {userList:users});

	socket.on('addUser', function(name){
		socket.username = name;
		console.log(name + " has joined");
		users.push(name);
		io.sockets.emit('updateUserList', {user:name, connectionType:'add'});
		fs.readFile(__dirname + "/lib/questions.json", "Utf-8", function(err, data){
			socket.emit('sendQuestions', JSON.parse(data));
		});
	});
	socket.on('disconnect', function(){
		console.log(socket.username + " has disconnected");
		var index = users.indexOf(socket.username);
		users.splice(index, 1);
		io.sockets.emit('updateUserList', {user:socket.username, connectionType:'delete'});
	});


});