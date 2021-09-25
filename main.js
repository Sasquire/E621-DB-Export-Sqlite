const Database = require('better-sqlite3');

const database_name = `e621.database.sqlite3`;
const db = new Database(database_name);

const data_types = [
	require('./plans/posts.js'),
	
	require('./plans/pools.js'),
	require('./plans/tag_aliases.js'),
	require('./plans/tag_implications.js'),
	require('./plans/tags.js'),
	require('./plans/wiki_pages.js')
];

async function main () {
	for (const type of data_types) {
		console.log(`Initializing ${type.name} table(s)`);
		type.init(db);

		console.log(`Downloading, parsing, and inserting ${type.url}`);

		let counter = 0;
		const statements = type.get_prepared_statements(db);
		await type.download_csv(rows_to_insert => db.transaction(() => {
			counter += rows_to_insert.length;
			for (const row of rows_to_insert) {
				type.insert_row(statements, row);
			}
			console.log(`${new Date().toISOString()}: Inserted ${counter} rows`);
		})(rows_to_insert));

		console.log('')
	}
}

main();
