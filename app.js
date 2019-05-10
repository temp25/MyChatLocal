var http = require('http');
var fileSystem = require('fs');

const { Kafka, logLevel } = require('kafkajs');
const appUsers = [];
const PORT = process.env.PORT || 5000;
var isConsumerInitialized = false;
var socketPtr;
var ip_ua;

console.log("timestamp : " + (new Date()).getTime());

var server = http.createServer(onRequest);
const io = require('socket.io')(server);
server.listen(PORT); //bind to dynamic PORT set by heroku at runtime
console.log('Server has started');


/*setTimeout(() => {
    console.log("Invoking socket emission");
    socketPtr.emit('myevent', "sample data using socket.io");
}, 5000);*/


io.on('disconnect', (socket) => {
    console.log('Client disconnected');
});


const kafka = new Kafka({
  logLevel: logLevel.INFO,
  brokers: [
    'velomobile-01.srvs.cloudkafka.com:9094',
    'velomobile-02.srvs.cloudkafka.com:9094',
    'velomobile-03.srvs.cloudkafka.com:9094'
  ], //[`${host}:9094`],
  clientId: 'chat-consumer',
  ssl: {
    rejectUnauthorized: true
  },
  sasl: {
    mechanism: 'scram-sha-256',
    username: '19uds2d2', //'test',
    password: '48yZeR87btROThUIxvSzmooG4v7QZ3Pe', //'testtest',
  },
});


const userTopic = "19uds2d2-testUsers2";

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.map(type => {
  process.on(type, async e => {
    try {
      console.log(`process.on ${type}`)
      console.error(e)
      await consumer.disconnect()
      process.exit(0)
    } catch (_) {
      process.exit(1)
    }
  });
});

signalTraps.map(type => {
  process.once(type, async () => {
    try {
      await consumer.disconnect()
    } finally {
      process.kill(process.pid, type)
    }
  });
});


io.on('connection', (socket) => {
    console.log('Client connected');
    socketPtr = socket;
    var uniqueGroupId = ip_ua +"_"+(new Date()).getTime();
    const consumer = kafka.consumer({ groupId: uniqueGroupId, fromBeginning: true  });

    const run = async () => {
      await consumer.connect();
      await consumer.subscribe({ topic: userTopic, fromBeginning: true });
      await consumer.run({
        partitionsConsumedConcurrently: 5,
        eachMessage: async ({ topic, partition, message }) => {
            const msgRcvd = message.value.toString();
          //console.log("msgRcvd : "+msgRcvd);
          socket.emit('appUserUpdate', msgRcvd);
          if(!(msgRcvd in appUsers)){
              appUsers.push(msgRcvd);
              
              //console.log(appUsers.length+" app users added so far");
          }
        },
    
      });
    };
    
    run().catch(e => console.error(`[example/consumer] ${e.message}`, e));
    
    socket.on('addUser', (data) => {
        console.log('addUser requested for user with nick, '+data);
    });
    
});

function onRequest(request, response) {
  /* response.writeHead(200);
  response.write('Hello Noders');
  response.end(); */
 
 
 /*
 var user_ip_address = ((request.headers['x-forwarded-for'] || '').split(',')[0] || request.connection.remoteAddress);
 var user_agent = request.headers['user-agent'];
 ip_ua = user_ip_address+"_"+user_agent;
 var uniqueGroupId = ip_ua +"_"+(new Date()).getTime();
 
 if (!isConsumerInitialized) {
    isConsumerInitialized = true;
    console.log("topicConsumer is Initialized : ");
    const consumer = kafka.consumer({ groupId: uniqueGroupId, fromBeginning: true  });

    const run = async () => {
      await consumer.connect();
      await consumer.subscribe({ topic: userTopic, fromBeginning: true });
      await consumer.run({
        partitionsConsumedConcurrently: 5,
        eachMessage: async ({ topic, partition, message }) => {
            const msgRcvd = message.value.toString();
          //console.log("msgRcvd : "+msgRcvd);
          socketPtr.emit('appUserUpdate', msgRcvd);
          if(!(msgRcvd in appUsers)){
              appUsers.push(msgRcvd);
              
              //console.log(appUsers.length+" app users added so far");
          }
        },
    
      });
    };
    
    run().catch(e => console.error(`[example/consumer] ${e.message}`, e));
  }
  */


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