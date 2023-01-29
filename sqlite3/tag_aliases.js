const schema = `
create table tag_aliases (
	alias_id integer primary key on conflict fail,
	from_tag_id integer not null,
	to_tag_id text not null,
	created_at integer not null,
	status text not null,
	constraint fk_tag_aliases_from_tag_id_references_tags_tag_id foreign key (from_tag_id) references tags(tag_id),
	constraint fk_tag_aliases_to_tag_id_references_tags_tag_id foreign key (to_tag_id) references tags(tag_id)
);`

const indexes = `
create index ix_tag_aliases_from_tag_id on tag_aliases (from_tag_id);
create index ix_tag_aliases_to_tag_id on tag_aliases (to_tag_id);`

function get_prepared_statements (database) {
	return [
		database.prepare(`
			insert into tag_aliases select
				@alias_id as alias_id,
				from_tag_id,
				to_tag_id,
				@created_at as created_at,
				@status as status
			from (select tag_id as from_tag_id from tags where name = @from_tag)
			inner join (select tag_id as to_tag_id from tags where name = @to_tag);
		`)
	];
}

function insert_row(statements, row) {
	statements[0].run({
		alias_id: parseInt(row.id, 10),
		from_tag: row.antecedent_name,
		to_tag: row.consequent_name,
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

module.exports = { schema, get_prepared_statements, insert_row, indexes};