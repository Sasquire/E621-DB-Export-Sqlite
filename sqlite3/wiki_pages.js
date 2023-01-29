const schema = `
create table wiki_pages (
	wiki_id integer primary key on conflict fail,
	created_at integer not null,
	updated_at integer not null,
	title text not null,
	body text not null,
	creator_id integer not null,
	updater_id integer not null,
	is_locked integer not null -- is a boolean
);`;

const indexes = ``;

function get_prepared_statements (database) {
	return [
		database.prepare(`
			insert into wiki_pages (
				wiki_id,
				created_at,
				updated_at,
				title,
				body,
				creator_id,
				updater_id,
				is_locked
			) values (
				@wiki_id,
				@created_at,
				@updated_at,
				@title,
				@body,
				@creator_id,
				@updater_id,
				@is_locked
			);
		`)
	];
}

function insert_row(statements, row) {
	statements[0].run({
		wiki_id: parseInt(row.wiki_id, 10),
		created_at: new Date(`${row.created_at}+00:00`).getTime(),
		updated_at: new Date(`${row.updated_at}+00:00`).getTime(),
		title: row.title,
		body: row.body,
		creator_id: parseInt(row.creator_id, 10),
		updater_id: parseInt(row.updater_id, 10) || parseInt(row.creator_id, 10),
		is_locked: row.is_locked === 't' ? 1 : 0
	});
}

module.exports = { schema, get_prepared_statements, insert_row, indexes };