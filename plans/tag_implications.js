const E621ExportType = require('./../utils/export_type.js');
const { parse_potentially_empty_date } = require('./../utils/utils.js');

const schema = `
create table tag_implications (
	implication_id integer primary key on conflict fail,
	tag text not null,
	implied_tag text not null,
	created_at integer not null,
	status text not null
);`

function get_prepared_statements (database) {
	return [
		database.prepare(`
			insert into tag_implications (
				implication_id,
				tag,
				implied_tag,
				created_at,
				status
			) values (
				@implication_id,
				@tag,
				@implied_tag,
				@created_at,
				@status
			);
		`)
	];
}

function insert_row(statements, row) {
	statements[0].run({
		implication_id: parseInt(row.id, 10),
		tag: row.antecedent_name,
		implied_tag: row.consequent_name,
		created_at: parse_potentially_empty_date(row.created_at),
		status: row.status
	});
}

module.exports = new E621ExportType('tag_implications', schema, get_prepared_statements, insert_row)