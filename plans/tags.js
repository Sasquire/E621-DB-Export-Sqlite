const E621ExportType = require('./../utils/export_type.js');

const schema = `
create table if not exists tags (
	tag_id integer primary key on conflict fail,
	name text not null,
	category text not null,
	count_on_active_posts integer not null
);`

function get_prepared_statements (database) {
	return [
		database.prepare(`
			insert into tags (
				tag_id,
				name,
				category,
				count_on_active_posts
			) values (
				@tag_id,
				@name,
				@category,
				@count_on_active_posts
			);
		`)
	];
}

function insert_row(statements, row) {
	statements[0].run({
		tag_id: parseInt(row.id, 10),
		name: row.name,
		category: row.category,
		count_on_active_posts: row.post_count
	});
}

module.exports = new E621ExportType('tags', schema, get_prepared_statements, insert_row)