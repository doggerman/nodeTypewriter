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

if(process.argv[2] == 'local'){
	console.log(' Listening to Port: 8080');
	server.listen(8080);
}
else {
	console.log(' Listening to Port: 80');
	server.listen(80);
}

app.use(express.bodyParser());

app.configure(function(){
  app.use('/media', express.static(__dirname + '/media'));
  app.use(express.static(__dirname + '/public'));
});

/* --------------------

	Router

-------------------- */

// Get Letters
app.get('/api/letters/', function(req, res){
	res.send('This feautre is unavailable');
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
	res.send('This feautre is unavailable');
});

app.get('/', function(req, res){
	console.log('Getting Index');
	console.log('IP:' + req.ip);
	console.log(getIp(req));
	res.sendfile('public/index.html');
});

/* --------------------

	Sockets

-------------------- */

io.sockets.on('connection', function (socket) {

	console.log('socket connection');

	var address = socket.handshake.address;
    console.log("New connection from " + address.address + ":" + address.port);

	socket.on('init',function(){
		getAllLetters(function(all_letters){
			socket.emit('getAllLetters', all_letters);
		});
		getCurrentUser(function(user_array){
			socket.emit('getUser', user_array);
		});
		getAllUsers(function(all_users_array){
			socket.emit('getAllUsers', all_users_array);
		});
	});

	socket.on('inserLetter', function (letter) {
		insertLetter(letter, function(new_letter){
			// Emit Letter Before Mysql Query
			// Emit to all users
			io.sockets.emit('getNewLetter', new_letter);
		})
	});

});

/* --------------------

	MySql Functions

-------------------- */

function insertLetter(data, callback){
	var letter_query = {
		letter: data.letter, 
		user: data.user,
	}
	var query = connection.query('INSERT INTO letters SET ?', letter_query, function(err, result) {
		if (err) throw err;
		query_response = {
			id : result.insertId,
			letter: data.letter, 
			user: data.user,
		}
		callback(query_response);
	});
}

function getAllLetters(callback){
	connection.query('SELECT * FROM letters;', function (error, rows, fields) { 
		var new_dict = {}; 
		for(i in rows){
			new_dict[rows[i].id] = rows[i];
		}
		callback(new_dict);
	});
}

function getAllUsers(callback){
	connection.query('SELECT * FROM users;', function (error, rows, fields) { 
		var new_dict = {}; 
		for(i in rows){
			new_dict[rows[i].id] = rows[i];
		}
		callback(new_dict);
	});
}

function getCurrentUser(callback){
	// Get Ip Address
	getIpAddress(function(error, ip){
		// Encrypt IP address (Goes in the DB)
		var encrypted_ip = crypto.createHash('md5').update(ip[0]).digest("hex");
		console.log('IP Address: ' + ip[0]);
		console.log('Encrypted : ' + encrypted_ip)
		connection.query('SELECT * FROM users WHERE ip_address = ?',[encrypted_ip], function (error, results) { 
			if(results.length > 0){
				callback(results[0]); 
			}
			else {
				// Get Location
				var location = get_location('api.hostip.info', '/get_json.php?ip=' + ip[0], function(response){
					/* Users
					| id         | int(11)      | NO   | PRI | NULL    | auto_increment |
					| color      | varchar(255) | YES  |     | NULL    |                |
					| ip_address | varchar(255) | YES  |     | NULL    |                |
					| location   | varchar(255) | YES  |     | NULL    |      
					*/
					var responseLocation = response.city + ", " + response.country_code;
					var color = generateRandomHexColor();
					connection.query('INSERT INTO users SET ?', { color: color, ip_address: encrypted_ip, location: responseLocation }, function(err, result){
						var query_response = {
							id : result.insertId,
							color : color, 
							location : responseLocation,
						}
						callback(query_response);
					});
				});
			}
		});
	}, false);
}

function deleteAllLetters(callback){
	connection.query('TRUNCATE TABLE letters;', function (error, rows, fields) { 
		callback(); 
	});
}

/* --------------------

	Utilities

-------------------- */

var getIpAddress = (function () {
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

function generateRandomHexColor(){
	return '#'+Math.floor(Math.random()*16777215).toString(16);
}

function getIp(req){
	var ip = req.headers['x-forwarded-for'] || 
		req.connection.remoteAddress || 
		req.socket.remoteAddress ||
		req.connection.socket.remoteAddress;
}