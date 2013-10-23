/*

Sniff out new letter vs old letters... 

Add Delete... 

Identify Users by css class... Attribute

Styling...

*/

$(document).ready(function(){

	var this_user;
	var all_users;
	var eia;

	if(document.domain == 'localhost'){
		console.log('Connecting to localhost');
		var socket = io.connect('http://localhost:8080');
	}
	else {
		console.log('Connecting to http://162.243.58.104');
		var socket = io.connect('http://162.243.58.104');
	}

	/* --------------------

	Sockets

	-------------------- */

	socket.on('getIpAddres', function(encrypted_ip_address){
		eia = encrypted_ip_address;
		socket.emit('init', eia);
	});
	

	// On, init Get all Letter from Database
	socket.on('getAllLetters',function (data) {
		$('#letters').html('');
		for(i in data){
			$('#letters').append('<div id="' + data[i].id + '" class="letter user-' + data[i].user + '">' + data[i].letter + '</div>');
		}
	});

	// On Init, get Current User (from IP address)
	socket.on('getUser', function(user){
		this_user = user;
	});

	// On Get New Letter, Add The Letter
	socket.on('getNewLetter',function (data) {
		$('#letters').append('<div id="' + data.id + '" class="letter user-' + data.user + '">' + data.letter + '</div>');
	});

	// On Get New Letter, Add The Letter
	socket.on('getAllUsers',function (data) {
		console.log('users');
		console.log(data);
		all_users = data;
		for(i in all_users){

			apppendCssClass(data[i].id, data[i].color);
		}
	});

	/* --------------------

	Keypress bind

	-------------------- */

	$(document).keypress(function(e){
		var letter = String.fromCharCode(e.keyCode)
		if(typeof(letter) == 'string' && letter != ''){
			socket.emit('inserLetter', { letter: letter, user: this_user.id });
		}
	})

	/* --------------------

	Utilities

	-------------------- */

	function getRandomLetter(){
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		return possible[parseInt(Math.random() * possible.length)];
	}

	function apppendCssClass(id, hex){

		console.log('apppendCssClass');
		console.log(hex);

		var style = document.createElement('style');
		style.type = 'text/css';
		/*
		border: solid 1px green;
		background: rgba(0, 128, 0, 0.2);
		text-shadow: 0px 0px 2px rgba(0, 128, 0, 0.5);
		color: green;
		*/

		if(hex.length == 7){
			// Remove first char
			hex = hex.substring(1);
		}

		var rgb = hexToRgb(hex);

		console.log('.user-' + id );
		style.innerHTML = '.user-' + id + ' { \
			color: #'+hex+';\
			background: rgba( ' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.2);\
			border-color: #'+ hex +'; \
			text-shadow: 0px 0px 2px rgba( ' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.5);\
		}';
		document.getElementsByTagName('head')[0].appendChild(style);
	}
	function hexToRgb(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

});