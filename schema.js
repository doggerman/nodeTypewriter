var pg = require('pg').native
  , config = require('./config')
  , conString = config.getConnectionString()
  , client
  , query;

client = new pg.Client(conString);
client.connect();

var insert_letters_table = 'create table IF NOT EXISTS letters ( \
	id SERIAL PRIMARY KEY,\
	letter VARCHAR(2), \
	user_id INTEGER,
	created TIMESTAMP DEFAULT current_timestamp \
	);';

var insert_users_table = 'create table IF NOT EXISTS users ( \
	id SERIAL PRIMARY KEY, \
	color VARCHAR(255), \
	ip_address VARCHAR(255), \
	location VARCHAR(255)\
	);';

var drop_tables = 'DROP TABLE IF EXISTS users, letters CASCADE;'

if(process.argv[2] == 'create'){
	client.query(insert_letters_table, function(err, result) {
		if(err){ console.log(err); }
		console.log('Create first Table Done');
		client.query(insert_users_table, function(err, result) {
			if(err){ console.log(err); }
			console.log("Done");
			client.end();
		});
	});
}
else if(process.argv[2] == 'create'){
	client.query(drop_tables, function(err, result) {
		if(err){ console.log(err); }
		console.log('Tables Dropped : users + letters');
	});
}
else {
	console.log('No Arguments Found');
}

