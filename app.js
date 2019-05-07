var http = require('http');
var fileSystem = require('fs');
const { Kafka, logLevel } = require('kafkajs');

http.createServer(onRequest).listen(8888);
console.log('Server has started');

function onRequest(request, response) {
    /* response.writeHead(200);
    response.write('Hello Noders');
    response.end(); */
    
    console.log('request url '+request.url);

    if(request.url == "/"){
        fileSystem.readFile('./index.html', function(err, htmlContent){
            response.writeHead(200, {
                'Content-Type': 'text/html'
            });
            response.write(htmlContent+'');
            response.end();
        });
    }else if(request.url == "/checkUser"){
        console.log("Users check invoked");
        response.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        response.write(checkUser());
        response.end();
    }else {
        //TODO: 404 handling
    }
}

function checkUser() {
    return "Sample users";
}