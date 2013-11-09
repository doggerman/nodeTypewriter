/*

Sniff out new letter vs old letters... 

Add Delete... 

Identify Users by css class... Attribute

Styling...

*/

$(document).ready(function(){

	var this_user, all_users, eia, all_letters, socket;

	if(document.domain == 'localhost'){
		console.log('Connecting to localhost');
		socket = io.connect('http://localhost:8080');
	}
	else {
		// var host = location.origin.replace(/^http/, '')
		//console.log('Connecting to http://gentle-cliffs-9860.herokuapp.com/');
		// var socket = io.connect('ws://gentle-cliffs-9860.herokuapp.com/');
		// console.log(location.origin);
		// var host = location.origin.replace(/^http/, 'ws');
		// console.log("host : ");
		// console.log(host);
		io.setPath('./Socket.IO/');
		console.log("Initiaging Socket");
		socket = io.connect(host, { 'port': 27862 });
		console.log("Connecting to Socket");
		socket.connect();
		//socket = new io.Socket('thejsj.webfactional.com', { 'port': 27862 });
		console.log(" + Socket: ");
		console.log(socket);
		// var socket = new io.Socket();
	}

	/* --------------------

	Sockets

	-------------------- */

    socket.on('connect', function(){
    	console.log(' ++ Socket Connected')
    });      

    socket.on('disconnect', function (){
    	console.log(' ++ Socket Disconnected')
    });

	socket.on('error', function (reason){
        console.error('Socket Error: Unable to connect to socket', reason);
    });

    socket.on('message', function (msg) {
        console.log('Socket Message : ' + msg);
    });

    socket.addEvent('close', function () {
	    console.log('Socket Close');
	});

	socket.on('getIpAddress', function(encrypted_ip_address){
		console.log("EIA : " + eia);
		eia = encrypted_ip_address;
		socket.emit('init', eia);
	});
	
	// On, init Get all Letter from Database
	socket.on('getAllLetters',function (data) {
		all_letters = data;
		$('#letters').html('');
		for(i in all_letters){
			var html = '<div id="letter-' + all_letters[i].id + '" class="letter user-' + all_letters[i].user_id + '">' + all_letters[i].letter + '</div>';
			$('#letters').append(html);
		}
	});

	// On Get New Letter, Add The Letter
	socket.on('getNewLetter',function (data) {
		// Append to our local array
		all_letters[data.id] = data;
		// Append to HTML
		$('#letters').append('<div id="letter-' + data.id + '" class="letter user-' + data.user_id + '">' + data.letter + '</div>');
	});

	// On Init, get Current User (from IP address)
	socket.on('getUser', function(user){
		this_user = user;
	});

	// On Get New Letter, Add The Letter
	socket.on('getAllUsers',function (data) {
		all_users = data;
		for(i in all_users){
			apppendCssClass(all_users[i].id, all_users[i].color);
		}
	});

	// On Get New Letter, Add The Letter
	socket.on('getNewUser',function (data) {
		if(all_users[data.id] == undefined){
			all_users[data.id] = data;
			apppendCssClass(data.id, data.color);
		}
	});

	socket.on('getDeletedLetter', function(letter_id){
		delete all_letters[letter_id];
		$("#letter-" + letter_id).remove();
		console.log($("#letter-" + letter_id));
		delete all_letters[letter_id];
	});

	/* --------------------

	Keypress bind

	-------------------- */

	window.onkeydown = function(e){
		if(e.keyCode === 8 || e.keyCode === 46) {
			e.preventDefault();
			e.stopPropagation();
			deleteLastUserLetter();
		}
	}

	$(document).keypress(function(e){
		if(e.keyCode != 8) {
			var letter = String.fromCharCode(e.keyCode);
			if(typeof(letter) == 'string' && letter != ''){
				socket.emit('inserLetter', { letter: letter, user: this_user.id });
			}
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

	function deleteLastUserLetter(){
		//
		// Get Last Letter By This User
		// 
		// Get All keys
		var all_keys = [];
		for(i in all_letters){ all_keys.push(i); }
		// Reverse Keys
		var all_keys_reverse = all_keys.reverse();
		// Search For Last Key
		for(var i = 0; i < all_keys_reverse.length; i++){
			if(all_letters[all_keys_reverse[i]].user_id == this_user.id){
				var deleted_letter_id = all_letters[all_keys_reverse[i]].id;
				break;
			}
		}
		socket.emit('deleteLetter', deleted_letter_id);
	}

});