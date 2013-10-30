var express = require('express');
var http = require('http');
var mysql = require("mysql"); 
var app = require('express')();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server, { log: false });
var crypto = require('crypto');

// Create the connection. 
// Data is default to new mysql installation and should be changed according to your configuration. 
var connection = mysql.createConnection({ 
	user: "thejsj_node_test", 
	password: "ursulita", 
	database: "thejsj_node_test" 
}); 

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
	res.sendfile('public/index.html');
});

/* --------------------

	Sockets

-------------------- */

io.sockets.on('connection', function (socket) {

	var ip_address = socket.handshake.address.address;
	console.log('Socket connection : ' + ip_address);
    var encrypted_ip_address = crypto.createHash('md5').update(ip_address).digest("hex");
    socket.emit('getIpAddress', encrypted_ip_address);

	socket.on('init',function(eia){
		console.log('init : ' + eia);
		getAllLetters(function(all_letters){
			socket.emit('getAllLetters', all_letters);
		});
		getCurrentUser(eia, ip_address, function(user_array){
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

	socket.on('deleteLetter', function (letter_id) {
		deleteLetter(letter_id, function(letter_id){
			// Emit Letter Before Mysql Query
			// Emit to all users
			io.sockets.emit('getDeletedLetter', letter_id);
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
		console.log('insert query result');
		console.log(result);
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

function getCurrentUser(eia, ip_address, callback){
	// Get Ip Address
	// Encrypt IP address (Goes in the DB)
	console.log(' + Encrypted : ' + eia)
	connection.query('SELECT * FROM users WHERE ip_address = ?',[eia], function (error, results) { 
		if(results.length > 0){
			callback(results[0]); 
		}
		else {
			// Get Location
			var location = get_location('api.hostip.info', '/get_json.php?ip=' + ip_address, function(response){
				/* Users
				| id         | int(11)      | NO   | PRI | NULL    | auto_increment |
				| color      | varchar(255) | YES  |     | NULL    |                |
				| ip_address | varchar(255) | YES  |     | NULL    |                |
				| location   | varchar(255) | YES  |     | NULL    |      
				*/
				var responseLocation = response.city + ", " + response.country_code;
				var color = generateRandomHexColor();
				connection.query('INSERT INTO users SET ?', { color: color, ip_address: eia, location: responseLocation }, function(err, result){
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
}

function deleteAllLetters(callback){
	connection.query('TRUNCATE TABLE letters;', function (error, rows, fields) { 
		callback(); 
	});
}

/* --------------------

	Utilities

-------------------- */

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