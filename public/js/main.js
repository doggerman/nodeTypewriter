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
		console.log(data);
		console.log(data.length);
		$('#letters').html('');
		for(i in data){
			$('#letters').append('<div class="letter">' + data[i].letter + '</div>')
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

});