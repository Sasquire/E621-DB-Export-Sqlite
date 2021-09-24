const E621ExportType = require('./../utils/export_type.js');

const schema = `
create table tag_aliases (
	alias_id integer primary key on conflict fail,
	tag text not null,
	main_tag text not null,
	created_at integer not null,
	status text not null
);`

function get_prepared_statements (database) {
	return [
		database.prepare(`
			insert into tag_aliases (
				alias_id,
				tag,
				main_tag,
				created_at,
				status
			) values (
				@alias_id,
				@tag,
				@main_tag,
				@created_at,
				@status
			);
		`)
	];
}

function insert_row(statements, row) {
	statements[0].run({
		alias_id: parseInt(row.id, 10),
		tag: row.antecedent_name,
		main_tag: row.consequent_name,
		created_at: parse_potentially_broken_dates(row.created_at),
		status: row.status
	});
}

function parse_potentially_broken_dates (date) {
	if (date === '') {
		return new Date(`2006-01-01 00:00:00.0000+00:00`).getTime();
	} else {
		return new Date(`${date}+00:00`).getTime();
	}
}

module.exports = new E621ExportType('tag_aliases', schema, get_prepared_statements, insert_row)