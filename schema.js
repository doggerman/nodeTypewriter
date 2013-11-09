var pg = require('pg')
  , config = require('./config')
  , conString = config.getConnectionString()
  , client
  , query;

console.log('Libraries Imported');

client = new pg.Client(conString);
client.connect(function(err) {
	if(err) {
		return console.error('could not connect to postgres', err);
	}
	console.log('Connection to Postgres succsefully established.');
});

/* --------------------

	Queries

-------------------- */

var insert_letters_table = [
	'create table IF NOT EXISTS letters ( ',
	'id SERIAL PRIMARY KEY, ',
	'letter VARCHAR(2), ',
	'user_id INTEGER, ',
	'created TIMESTAMP DEFAULT current_timestamp ',
	');'
]
insert_letters_table = insert_letters_table.join();

var insert_users_table = [
	'create table IF NOT EXISTS users ( ',
	'id SERIAL PRIMARY KEY, ',
	'color VARCHAR(255), ',
	'ip_address VARCHAR(255), ',
	'location VARCHAR(255) ',
	');'
];
insert_users_table = insert_users_table.join();

var drop_tables = 'DROP TABLE IF EXISTS users, letters CASCADE;'

/* --------------------

	Execute queries

-------------------- */

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

