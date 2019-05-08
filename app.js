var http = require('http');
var fileSystem = require('fs');
const { Kafka, logLevel } = require('kafkajs');
const appUsers = [];
const PORT = process.env.PORT || 5000;

console.log("timestamp : " + (new Date()).getTime());

//const host = process.env.HOST_IP || ip.address()

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


const topic = "19uds2d2-testUsers2";
const gId = "19uds2d2-consumer_"+(new Date()).getTime();

console.log("\n topic : " + topic + "\n");
console.log("\n groupId : " + gId + "\n");

const consumer = kafka.consumer({ groupId: gId, fromBeginning: true  });

const run = async () => {
  await consumer.connect()
  await consumer.subscribe({ topic: topic, fromBeginning: true })
  await consumer.run({
    partitionsConsumedConcurrently: 5,
    eachMessage: async ({ topic, partition, message }) => {
        const msgRcvd = message.value.toString();
      //console.log(msgRcvd);
      if(!(msgRcvd in appUsers)){
          appUsers.push(msgRcvd);
          //console.log(appUsers.length+" app users added so far");
      }
    },

  })
}

run().catch(e => console.error(`[example/consumer] ${e.message}`, e))

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
  })
})

signalTraps.map(type => {
  process.once(type, async () => {
    try {
      await consumer.disconnect()
    } finally {
      process.kill(process.pid, type)
    }
  })
})



http.createServer(onRequest).listen(PORT); //bind to dynamic PORT set by heroku at runtime
console.log('Server has started');

function onRequest(request, response) {
  /* response.writeHead(200);
  response.write('Hello Noders');
  response.end(); */

  console.log('request url ' + request.url);

  if (request.url == "/") {
    fileSystem.readFile('./index.html', function (err, htmlContent) {
      response.writeHead(200, {
        'Content-Type': 'text/html'
      });
      response.write(htmlContent + '');
      response.end();
    });
  } else if (request.url == "/checkUser") {
    console.log("Users check invoked");
    
    // sleep 5 seconds for final user updates to be received
    setTimeout(() => {
        response.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        response.write(getAvailableUsers());
        response.end();
    }, 5000);
    
  } else {
    //TODO: 404 handling
  }
}

function getAvailableUsers() {
  return appUsers.join();
}