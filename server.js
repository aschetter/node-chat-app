var MongoClient = require('mongodb').MongoClient;

var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8080);

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

MongoClient.connect('mongodb://127.0.0.1/chat', function(err, db) {
    if (err) {
        throw err;
    }

    io.on('connection', function (socket) {

        var collection = db.collection('messages');
        
        function sendStatus (s) {
            socket.emit('status', s);
        };

        socket.emit('connected', 'You are connected to the chat server!');
        socket.on('confirmConnection', function (data) {
            console.log(data);
        });

        socket.on('toServer', function (data) {
            console.log(data);

            var name = data.name;
            var message = data.message;
            var whiteSpaceCheck = /^\s*$/;

            if (whiteSpaceCheck.test(name) || whiteSpaceCheck.test(message)) {
                sendStatus('Name and message is required.');
            } else {
                collection.insert({name: name, message: message}, function() {
                    console.log('Inserted');
                });
            }
        });
    });
});