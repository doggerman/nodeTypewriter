console.log(process);
console.log(process.env);
console.log(process.env.DATABASE_URL);


var pg = require('pg').native
  , connectionString = process.env.DATABASE_URL || "postgres://thejsj_node_test:@localhost/thejsj_node_test"
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();

var insert_letters_table = 'create table IF NOT EXISTS letters ( id SERIAL PRIMARY KEY, letter VARCHAR(2), created timestamp DEFAULT current_timestamp );';
var insert_users_table = 'create table IF NOT EXISTS users ( id SERIAL PRIMARY KEY, color varchar(255), ip_address varchar(255), location varchar(255));';

client.query(insert_letters_table, function(err, result) {
	if(err){ console.log(err); }
	console.log('Create first Table Done');
	client.query(insert_users_table, function(err, result) {
		if(err){ console.log(err); }
		console.log("Done");
		client.end();
	});
});