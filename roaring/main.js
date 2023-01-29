const fs = require('fs');

const Database = require('better-sqlite3');
const utils = require('./../utils/utils.js');
const sqlite3_database = new Database(utils.sqlite3_name);
const {roaring_name} = utils;
const RoaringBitmap32 = require('roaring/RoaringBitmap32')

// TODO create index cool_index on posts_tags (tag);
function init () {}
function pre (type) {}
function work (type, rows) {}
function post (type) {}

function build_tag_database () {
	if (utils.file_exists(roaring_name)) {
		console.log(`${roaring_name} exists. Will not continue until it's moved or deleted to avoid overwriting data.`)
		return
	}

	const tags = sqlite3_database
		.prepare('select name from tags order by count_on_active_posts desc;')
		.all()
		.map(e => e.name);

	const database = fs.createWriteStream(roaring_name);
	for (let i = 0; i < tags.length; i++) {
		const tag = tags[i];
		console.log(`Working on ${tag},\t the ${i}th of ${tags.length} tags`);

		const matching_posts = sqlite3_database
			.prepare('select post_id from posts_tags where tag = ?;')
			.all(tag)
			.map(e => e.post_id);

		// Used this format to match what byte[] had originally
		// Figured it would be good to have a matching binary
		// format and I can't think of a reason to change it
		if (matching_posts.length !== 0) {
			const name_buffer = Buffer.from(tag, 'utf-8');
			const bitmap_buffer = new RoaringBitmap32(matching_posts).serialize(false)

			database.write(number_to_buffer_with_32_bit_le(name_buffer.byteLength))
			database.write(number_to_buffer_with_32_bit_le(bitmap_buffer.byteLength))
			database.write(name_buffer)
			database.write(bitmap_buffer)
		}
	}
	database.close();
}

function number_to_buffer_with_32_bit_le (number) {
	const buf = Buffer.alloc(4);
	buf.writeInt32LE(number,0);
	return buf;
}

function terminate () {
	build_tag_database();
}

module.exports = {
	init,
	pre,
	work,
	post,
	terminate
};
