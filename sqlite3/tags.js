const schema = `
create table tags (
	tag_id integer primary key on conflict fail,
	name text not null,
	category text not null,
	count_on_active_posts integer not null
);`

const indexes = `
-- Not a unique index because some tags somehow got similar names
create index ix_tags_name on tags (name);
create index ix_tags_category on tags (category);`

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

module.exports = { schema, get_prepared_statements, insert_row, indexes };
