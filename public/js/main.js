/*

Sniff out new letter vs old letters... 

Add Delete... 

Identify Users by css class... Attribute

Styling...

*/

$(document).ready(function(){

	var socket = io.connect('http://162.243.58.104');

	socket.emit('requestAllLetters', function(data){
		console.log("Done with gett al letters");
	})

	socket.on('getAllLetters',function (data) {
		$('#letters').html('');
		for(i in data){
			var key = data[i].ip_address.substring(0,6);
			apppendCssClass(key);
			$('#letters').append('<div class="letter user_' + key + '">' + data[i].letter + '</div>')
		}
	});

	$(document).keypress(function(e){
		var letter = String.fromCharCode(e.keyCode)
		if(typeof(letter) == 'string' && letter != ''){
			socket.emit('inserLetter', { letter: letter });
		}
	})

	function getRandomLetter(){
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		return possible[parseInt(Math.random() * possible.length)];
	}

	function apppendCssClass(key){
		var style = document.createElement('style');
		style.type = 'text/css';
		/*
		border: solid 1px green;
		background: rgba(0, 128, 0, 0.2);
		text-shadow: 0px 0px 2px rgba(0, 128, 0, 0.5);
		color: green;
		*/
		var rgb = hexToRgb(key);
		style.innerHTML = '.user_' + key + ' { \
			color: #'+key+';\
			background: rgba( ' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.2);\
			border-color: #'+ key +'; \
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