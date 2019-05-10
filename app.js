var http = require('http');
var fileSystem = require('fs');

const { Kafka, logLevel } = require('kafkajs');
const appUsers = [];
const PORT = process.env.PORT || 5000;
var isConsumerInitialized = false;
var usersJson = {};

console.log("timestamp : " + (new Date()).getTime());

var server = http.createServer(onRequest);
const io = require('socket.io')(server);
server.listen(PORT); //bind to dynamic PORT set by heroku at runtime
console.log('Server has started');


io.on('connection', (socket) => {
    console.log('Client connected');
});


io.on('disconnect', (socket) => {
    console.log('Client disconnected');
});



function onRequest(request, response) {
  /* response.writeHead(200);
  response.write('Hello Noders');
  response.end(); */

  if (request.url === "/") {
    fileSystem.readFile('./index.html', function (err, htmlContent) {
      response.writeHead(200, {
        'Content-Type': 'text/html'
      });
      response.write(String(htmlContent));
      response.end();
    });
  } else if (request.url === "/checkUser") {
    console.log("Users check invoked");
    
    // sleep 5 seconds for final user updates to be received
    setTimeout(() => {
        response.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        var _availUsers = getAvailableUsers();
        console.log("_availUsers : "+_availUsers);
        response.write(_availUsers);
        response.end();
    }, 10000);
    
  } else {
    //TODO: 404 handling
  }
}

function getAvailableUsers() {
    usersJson['users'] = appUsers;
    return JSON.stringify(usersJson);//appUsers.join();
}