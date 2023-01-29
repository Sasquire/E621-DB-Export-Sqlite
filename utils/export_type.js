const fs = require('fs');
const path = require('path');
const stream = require('stream');

const mkdirp = require('mkdirp');
const ReadableStreamClone = require("readable-stream-clone");
const axios = require('axios');
const pako = require('pako');
const papa = require('papaparse');

const today = require('./utils.js').get_today();

class E621ExportType {
	constructor(name) {
		this.name = name;
	}

	get url () {
		return `https://e621.net/db_export/${this.name}-${today}.csv.gz`;
	}

	get path () {
		return path.join('.', 'cache', `${this.name}-${today}.csv.gz`);
	}

	get get_name () {
		return this.name;
	}

	async download_csv (rows_callback) {
		return download_blob(this)
			.then(response => inflator_stream(response.data))
			.then(readable_stream => parse_rows(readable_stream, rows_callback));
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

function parse_rows (input_stream, rows_callback) {
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
	return new Promise((resolve, reject) => {
		papa.parse(input_stream, {
			...csv_options,
			step: row => {
				row_buffer.push(row.data);
				if (row_buffer.length % 10000 === 0) {
					try {
						rows_callback(row_buffer)
						row_buffer.length = 0;
					} catch (e) {
						reject(e);
					}
				}
			},
			complete: () => {
				try {
					rows_callback(row_buffer)
					resolve();
				} catch (e) {
					reject(e);
				}
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
		const data_stream = await axios({
			url: type.url,
			method: 'GET',
			responseType: 'stream'
		});

		await mkdirp(path.dirname(type.path));
		const read_stream = new ReadableStreamClone(data_stream.data);
		const write_stream = fs.createWriteStream(type.path);
		read_stream.pipe(write_stream);
		
		return {
			data: new ReadableStreamClone(data_stream.data)
		}
	}
}

module.exports = E621ExportType;
 