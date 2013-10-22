var express = require('express');
var http = require('http');
var mysql = require("mysql"); 
var app = require('express')();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server, { log: false });
var crypto = require('crypto');

// Create the connection. 
// Data is default to new mysql installation and should be changed according to your configuration. 
var connection = mysql.createConnection({ user: "thejsj_node_test", password: "ursulita", database: "thejsj_node_test" }); 

server.listen(80);

app.use(express.bodyParser());

app.configure(function(){
  app.use('/media', express.static(__dirname + '/media'));
  app.use(express.static(__dirname + '/public'));
});

/* --------------------

	Utilities

-------------------- */

// Get Letters
app.get('/api/letters/', function(req, res){
	getAllLetters(function(data){
		// Parse into a json
	});
});

// Get Letters
app.get('/api/delete_all/', function(req, res){
	deleteAllLetters(function(data){
		// Parse into a json
		res.send("All Letters Deleted");
	});
});

// Insert Letter
app.post('/api/insert/', function(req, res){
	insertLetterIntoDatabase(req.body.letter);
	// Parse Response into JSON
});

app.get('/', function(req, res){
	res.sendfile('public/index.html');
});

io.sockets.on('connection', function (socket) {

	socket.on('requestAllLetters', function(){
		getAllLetters(function(data){
			socket.emit('getAllLetters', data);
		});
	});

  	socket.on('inserLetter', function (letter) {
		insertLetter(letter, function(data){
			getAllLetters(function(data){
				socket.emit('getAllLetters', data); 
			});
		})
	});
});

/* --------------------

	MySql Functions

-------------------- */

function insertLetter(letter, callback){
	getNetworkIPs(function (error, ip) {
		var location = get_location('api.hostip.info', '/get_json.php?ip=' + ip[0], function(resposne){
			var data = JSON.parse(resposne);
			var encrypted_ip = crypto.createHash('md5').update(ip[0]).digest("hex")
			// Build Dict
			var letter_query  = {
				letter: letter.letter, 
				location: data.city + ", " + data.country_code, 
				ip_address : encrypted_ip,
			};
			var query = connection.query('INSERT INTO letters SET ?', letter_query, function(err, result) {
				if (err) throw err;
				query_response = {
					status : 'succses',
					letter_id : result.insertId,
				}
				callback(JSON.stringify(query_response));
			});
		});
		if (error) {
			console.log('error:', error);
		}
	}, false);
}

function getAllLetters(callback){
	connection.query('SELECT * FROM letters;', function (error, rows, fields) { 
		var new_dict = {}; 
		for(i in rows){
			new_dict[rows[i].letter_id] = rows[i];
		}
		callback(new_dict); 
	});
}

function deleteAllLetters(callback){
	connection.query('TRUNCATE TABLE letters;', function (error, rows, fields) { 
		callback(); 
	});
}

/* --------------------

	Utilities

-------------------- */

var getNetworkIPs = (function () {
    var ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;

    var exec = require('child_process').exec;
    var cached;
    var command;
    var filterRE;

    switch (process.platform) {
    case 'win32':
    //case 'win64': // TODO: test
        command = 'ipconfig';
        filterRE = /\bIPv[46][^:\r\n]+:\s*([^\s]+)/g;
        break;
    case 'darwin':
        command = 'ifconfig';
        filterRE = /\binet\s+([^\s]+)/g;
        // filterRE = /\binet6\s+([^\s]+)/g; // IPv6
        break;
    default:
        command = 'ifconfig';
        filterRE = /\binet\b[^:]+:\s*([^\s]+)/g;
        // filterRE = /\binet6[^:]+:\s*([^\s]+)/g; // IPv6
        break;
    }

    return function (callback, bypassCache) {
        if (cached && !bypassCache) {
            callback(null, cached);
            return;
        }
        // system call
        exec(command, function (error, stdout, sterr) {
            cached = [];
            var ip;
            var matches = stdout.match(filterRE) || [];
            //if (!error) {
            for (var i = 0; i < matches.length; i++) {
                ip = matches[i].replace(filterRE, '$1')
                if (!ignoreRE.test(ip)) {
                    cached.push(ip);
                }
            }
            //}
            callback(error, cached);
        });
    };
})();


function get_location(host, path, this_calback){
	//The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
	var options = {
		host: host,
		path: path,
	};

	callback = function(response) {
		var str = '';

		//another chunk of data has been recieved, so append it to `str`
		response.on('data', function (chunk) {
			str += chunk;
		});

		//the whole response has been recieved, so we just print it out here
		response.on('end', function () {
			this_calback(str);
		});
	}

	http.request(options, callback).end();
}