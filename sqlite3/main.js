const Database = require('better-sqlite3');
const utils = require('./../utils/utils.js');

const plans = [
	'tags',
	'tag_aliases',
	'tag_implications',
	'posts',
	'pools',
	'wiki_pages'
].map(e => ({
	name: e,
	...require(`./${e}.js`),
	statements: null
}))

class Sqlite3Database {
	constructor (database_name) {
		this.database_name = database_name;
		this.db = null;
		this.counter = 0
	}

	init () {
		this.db = new Database(this.database_name);
	}
	
	pre (type) {
		plans
			.filter(e => e.name === type)
			.forEach(matched => {
				this.db.exec(matched.schema)
				matched.statements = matched.get_prepared_statements(this.db);
				this.counter = 0;
			});
	}
	
	work (type, given_rows) {
		plans
			.filter(e => e.name === type)
			.forEach(matched => (this.db.transaction((rows) => {
				for (const row of rows) {
					matched.insert_row(matched.statements, row);
				}
			})(given_rows)));

		this.counter += given_rows.length;
		console.log(`${new Date().toISOString()}: Inserted ${this.counter} rows for ${type}`);
	}
	
	post (type) {
		plans
			.filter(e => e.name === type)
			.forEach(matched => {
				this.db.exec(matched.indexes);
			});
	}
	
	terminate () {
	
	}
}

module.exports = new Sqlite3Database(utils.sqlite3_name);