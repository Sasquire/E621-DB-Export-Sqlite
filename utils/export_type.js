const fs = require('fs');
const path = require('path');
const stream = require('stream');

const axios = require('axios');
const pako = require('pako');
const papa = require('papaparse');

const today = require('./utils.js').get_today();

class E621ExportType {
	constructor(name, schema, get_prepared_statements, insert_row) {
		this.name = name;
		this.schema = schema
		this.insert_row = insert_row
		this.get_prepared_statements = get_prepared_statements;
	}

	get url () {
		return `https://e621.net/db_export/${this.name}-${today}.csv.gz`;
	}

	get path () {
		return path.join('.', `${this.name}-${today}.csv.gz`);
	}

	async download_csv (insert_rows_callback) {
		return download_blob(this)
			.then(response => inflator_stream(response.data))
			.then(readable_stream => parse_rows(readable_stream, insert_rows_callback));
	}
	
	get_prepared_statements (database) {
		return this.get_prepared_statements(database);
	}

	insert_row(statements, row) {
		return this.insert_row(statements, row);
	}

	init(database) {
		return database.exec(this.schema);
	}
}

function inflator_stream (input_stream) {
	const inflator = new pako.Inflate({ to: 'string' });

	const output_stream = new stream.Readable({read(){}});
	input_stream.on('data', chunk => inflator.push(chunk));
	inflator.onData = output_chunk => output_stream.push(output_chunk);
	inflator.onEnd = status => output_stream.push(null);

	return output_stream;
}

function parse_rows (input_stream, insert_rows_callback) {
	const csv_options = {
		delimiter: "",	// auto-detect
		newline: "",	// auto-detect
		quoteChar: '"',
		escapeChar: '"',
		header: true,
		transformHeader: undefined,
		dynamicTyping: false,
		preview: 0,
		encoding: 'utf8',
		worker: false,
		comments: false,
		step: undefined,
		complete: undefined,
		error: undefined,
		download: false,
		downloadRequestHeaders: undefined,
		downloadRequestBody: undefined,
		skipEmptyLines: true,
		chunk: undefined,
		chunkSize: undefined,
		fastMode: undefined,
		beforeFirstChunk: undefined,
		withCredentials: undefined,
		transform: undefined,
		delimitersToGuess: [',', '\t', '|', ';', papa.RECORD_SEP, papa.UNIT_SEP]
	};

	const row_buffer = [];
	return new Promise(resolve => {
		papa.parse(input_stream, {
			...csv_options,
			step: row => {
				row_buffer.push(row.data);
				if (row_buffer.length % 10000 === 0) {
					insert_rows_callback(row_buffer)
					row_buffer.length = 0;
				}
			},
			complete: () => {
				insert_rows_callback(row_buffer);
				resolve()
			}
		});
	});
}

async function download_blob (type) {
	if (fs.existsSync(type.path)) {
		console.log('File found. Using that instead of downloading');
		return {
			data: fs.createReadStream(type.path)
		}
	} else {
		console.log('No File found. Streaming data directly from website');
		return axios({
			url: type.url,
			method: 'GET',
			responseType: 'stream'
		});
	}
}

module.exports = E621ExportType;
 