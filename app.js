var express = require('express');
var app = express();
var gameManager = require('./server/gameManager');
var frontend = require('./server/frontend');
var backendClient = require('./server/backend_client');
var backendServer = require('./server/backend_server');

// Statics files
app.use('/script', express.static('client/script'));
app.use('/style', express.static('client/style'));
app.use('/img', express.static('client/img'));
app.set('views', __dirname + '/client/views');

// Start frontend routing and rendering (i.e. html serving)
frontend(app, gameManager);

// Start backends (i.e. websockets handling)
var server = require('http').Server(app);
var io = require('socket.io')(server);

backendServer(app, server, io, gameManager);
backendClient(app, server, io, gameManager);

server.listen(8080);