const args = require('args-parser')(process.argv);
const E621ExportType = require('./utils/export_type');

// TODO come up with a requirement system for which order to do these
// because sqlite3 requires tags to come before aliases and implications
const to_process = [
	'wiki_pages',
	'tags',
	'tag_aliases',
	'tag_implications',
	'posts',
	'pools'
];

const plans = [
	// require('./sqlite3/main.js'),
	require('./roaring/main.js'),
];

async function main () {
	for (const plan of plans) {
		plan.init();
	}

	for (const process_type of to_process) {
		plans.forEach(e => e.pre(process_type));

		await new E621ExportType(process_type).download_csv((rows) => {
			plans.forEach(e => e.work(process_type, rows));
		}).catch(e => {throw e});
		
		plans.forEach(e => e.post(process_type));
	}

	for (const plan of plans) {
		plan.terminate();
	}
}

main();
