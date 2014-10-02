var MongoClient = require('mongodb').MongoClient;
var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8080);

// Load index.html file
function handler (req, res) {
    fs.readFile(__dirname + '/index.html',

    function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
    });
}

// Connect to MongoDB client
MongoClient.connect('mongodb://127.0.0.1/chat', function(err, db) {
    if (err) {
        throw err;
    }

    // Connect to socket.io
    io.on('connection', function (socket) {

        // Use the 'messages' collection
        var collection = db.collection('messages');

        // Send a message to the client confirming it connected to the server
        socket.emit('connected', 'You are connected to the chat server!');
        socket.on('confirmConnection', function (data) {
            console.log(data);
        });

        // Send the messages stored in the DB when the user loads the page
        collection.find().limit(100).sort({_id: 1}).toArray(function(err, res) {
            if (err) {
                throw err;
            }
            socket.emit('output', res);
        });

        // Define method to send the message status
        function sendStatus (s) {
            socket.emit('status', s);
        };

        // Process messages sent from the client
        socket.on('toServer', function (data) {
            console.log(data);

            var name = data.name;
            var message = data.message;

            // Verify the content and name aren't empty
            var whiteSpaceCheck = /^\s*$/;

            if (whiteSpaceCheck.test(name) || whiteSpaceCheck.test(message)) {
                sendStatus('Name and message is required.');
            } else {

                // If the content and name aren't empty, store the message in the DB
                collection.insert({name: name, message: message}, function() {

                    // Send most recent message to all clients
                    io.emit('output', [data]);

                    // Send status to the client confirming the message was received
                    sendStatus({
                        message: "Message sent.",
                        clear: true
                    });
                });
            }
        });
    });
});