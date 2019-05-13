var http = require('http');
var fileSystem = require('fs');
const { Kafka, logLevel } = require('kafkajs');

var server = http.createServer(onRequest);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 5000;

const kafka = new Kafka({
    logLevel: logLevel.INFO,
    brokers: process.env.CLOUDKARAFKA_BROKERS.split(","),
    clientId: 'chat-consumer',
    ssl: {
      rejectUnauthorized: true
    },
    sasl: {
      mechanism: process.env.CLOUDKARAFKA_MECHANISM,
      username: process.env.CLOUDKARAFKA_USERNAME,
      password: process.env.CLOUDKARAFKA_PASSWORD,
    },
  });

//bind to dynamic PORT set by heroku at runtime
server.listen(PORT, function () {
    console.log("listening on PORT " + PORT);
});

const userTopic = process.env.CLOUDKARAFKA_USERS_TOPIC;
const messageTopic = process.env.CLOUDKARAFKA_MESSAGES_TOPIC;

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

io.on('connection', function (socket) {
    const ipAddr = socket.request.connection.remoteAddress;
    const userAgent = socket.request.headers["user-agent"];
    const uniqueUserConsumerGroupId = userTopic + "_" + ipAddr + "_" + userAgent + "_" + new Date().getTime();

    const userConsumer = kafka.consumer({ groupId: uniqueUserConsumerGroupId, fromBeginning: true });

    const runUserConsumer = async () => {
        await userConsumer.connect();
        await userConsumer.subscribe({ topic: userTopic, fromBeginning: true });
        await userConsumer.run({
            partitionsConsumedConcurrently: 5,
            eachMessage: async ({ topic, partition, message }) => {
                const userNick = message.value.toString();
                socket.emit('appUserUpdate', userNick);
            },

        });
    };

    runUserConsumer().catch(e => console.error(`[chat/userConsumer] ${e.message}`, e));

    const uniqueMessageConsumerGroupId = messageTopic + "_" + ipAddr + "_" + userAgent + "_" + new Date().getTime();
    const messageConsumer = kafka.consumer({ groupId: uniqueMessageConsumerGroupId, fromBeginning: true });

    const runMessageConsumer = async () => {
        await messageConsumer.connect();
        await messageConsumer.subscribe({ topic: messageTopic, fromBeginning: true });
        await messageConsumer.run({
            partitionsConsumedConcurrently: 5,
            eachMessage: async ({ topic, partition, message }) => {
                const key = message.key;
                const value = message.value;
                socket.emit('appMessageUpdate', message);
            },

        });
    };

    runMessageConsumer().catch(e => console.error(`[example/messageConsumer] ${e.message}`, e));

    errorTypes.map(type => {
        process.on(type, async e => {
            try {
                console.log(`process.on ${type}`)
                console.error(e)
                await userConsumer.disconnect()
                await messageConsumer.disconnect()
                process.exit(0)
            } catch (_) {
                process.exit(1)
            }
        });
    });

    signalTraps.map(type => {
        process.once(type, async () => {
            try {
                await userConsumer.disconnect()
                await messageConsumer.disconnect()
            } finally {
                process.kill(process.pid, type)
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('chatMessage', (message) => {
    
        const messageProducer = kafka.producer();
        const run = async () => {
            await messageProducer.connect();
            messageProducer.send({
                topic: messageTopic,
                //compression: CompressionTypes.GZIP,
                messages: [
                    {
                        key: String(new Date().getTime()),
                        value: message,
                    },
                ],
            })
                .then(console.log)
                .catch(e => console.error(`[chat/messageProducer] ${e.message}`, e));
        };

        run().catch(e => console.error(`[chat/messageProducer] ${e.message}`, e));

        errorTypes.map(type => {
            process.on(type, async e => {
                try {
                    console.log(`process.on ${type}`)
                    console.error(e)
                    await messageProducer.disconnect()
                    process.exit(0)
                } catch (_) {
                    process.exit(1)
                }
            });
        });
    
        signalTraps.map(type => {
            process.once(type, async () => {
                try {
                    await messageProducer.disconnect()
                } finally {
                    process.kill(process.pid, type)
                }
            });
        });

    });

    socket.on('addUser', (user) => {
        const userProducer = kafka.producer();
        const run = async () => {
            await userProducer.connect();
            userProducer.send({
                topic: userTopic,
                //compression: CompressionTypes.GZIP,
                messages: [
                    {
                        key: String(new Date().getTime()),
                        value: user,
                    }
                ],
            })
                .then(console.log)
                .catch(e => console.error(`[chat/userProducer] ${e.message}`, e));
        };

        run().catch(e => console.error(`[chat/userProducer] ${e.message}`, e));

        errorTypes.map(type => {
            process.on(type, async e => {
                try {
                    console.log(`process.on ${type}`)
                    console.error(e)
                    await userProducer.disconnect()
                    process.exit(0)
                } catch (_) {
                    process.exit(1)
                }
            });
        });
    
        signalTraps.map(type => {
            process.once(type, async () => {
                try {
                    await userProducer.disconnect()
                } finally {
                    process.kill(process.pid, type)
                }
            });
        });

    });
});

function onRequest(request, response) {
    const contentType = getFileTypeFromRequestUrl(request.url);
    const filePath = "."+(request.url === "/" ? "/index.html" : request.url);

    fileSystem.access(filePath, fileSystem.F_OK, (err) => {
        if(err){
            //Handle file not found 404 eror
        }else{
            serveFile(response, filePath, contentType);
        }
    });
}

function getFileTypeFromRequestUrl(requestUrl) {
    const fileExt = requestUrl.substring(requestUrl.lastIndexOf(".")+1);
    return getContentTypeFromExtension(fileExt);
}

function getContentTypeFromExtension(fileExt) {
    switch (fileExt) {
        case "png": return "image/png";
        case "ico": return "image/x-icon";

        case "/":
        case "html": return "text/html";
        
        case "js": return "text/javascript";
        case "css": return "text/css";
        
        default: return "";
    }
}

function serveFile(response, filePath, contentType) {
    fileSystem.readFile(filePath, function (err, fileContent) {
        response.writeHead(200, {
            'Content-Type': contentType
        });
        response.write(String(fileContent));
        response.end();
    });
}