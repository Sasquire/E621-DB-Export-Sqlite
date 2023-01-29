const { parse_potentially_empty_date } = require('./../utils/utils.js');

const schema = `
create table tag_implications (
	implication_id integer primary key on conflict fail,
	implier_tag_id integer not null,
	implied_tag_id integer not null,
	created_at integer not null,
	status text not null,
	constraint fk_tag_implications_implied_tag_id_references_tags_tag_id foreign key (implier_tag_id) references tags(tag_id),
	constraint fk_tag_implications_implier_tag_id_references_tags_tag_id foreign key (implied_tag_id) references tags(tag_id)
);`

const indexes = `
create index ix_tag_implications_implier_tag_id on tag_implications (implier_tag_id);
create index ix_tag_implications_implied_tag_id on tag_implications (implied_tag_id);`

function get_prepared_statements (database) {
	return [
		database.prepare(`
			insert into tag_implications (
				implication_id,
				implier_tag_id,
				implied_tag_id,
				created_at,
				status
			) select
				@implication_id as implication_id,
				implier_tag_id,
				implied_tag_id,
				@created_at,
				@status
			from (select tag_id as implied_tag_id from tags where name = @implied_tag)
			inner join (select tag_id as implier_tag_id from tags where name = @implier_tag);
		`)
	];
}

function insert_row(statements, row) {
	statements[0].run({
		implication_id: parseInt(row.id, 10),
		implier_tag: row.antecedent_name,
		implied_tag: row.consequent_name,
		created_at: parse_potentially_empty_date(row.created_at),
		status: row.status
	});
}

module.exports = { schema, get_prepared_statements, insert_row, indexes };