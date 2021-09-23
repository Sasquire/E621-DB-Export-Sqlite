const E621ExportType = require('./../utils/export_type.js');

const schema = `
create table if not exists pools_metadata (
	pool_id integer primary key on conflict fail,
	pool_name text not null,
	created_at integer not null,
	updated_at integer not null,
	creator_id integer not null,
	description text not null,
	is_active integer not null, -- is a boolean
	category text not null
);

create table if not exists pools (
	post_id integer not null,
	pool_id integer not null,
	constraint pools_references_pools_metadata foreign key (pool_id) references pools_metadata
);`

function get_prepared_statements (database) {
	return [
		database.prepare(`
			insert into pools_metadata (
				pool_id,
				pool_name,
				created_at,
				updated_at,
				creator_id,
				description,
				is_active,
				category
			) values (
				@pool_id,
				@pool_name,
				@created_at,
				@updated_at,
				@creator_id,
				@description,
				@is_active,
				@category
			);
		`), database.prepare(`
				insert into pools (post_id, pool_id) values (@post_id, @pool_id);
		`)
	];
}

function insert_row(statements, row) {
	const pool_id = parseInt(row.id, 10);
	statements[0].run({
		pool_id: pool_id,
		pool_name: row.name,
		created_at: new Date(`${row.created_at}+00:00`).getTime(),
		updated_at: new Date(`${row.updated_at}+00:00`).getTime(),
		creator_id: parseInt(row.creator_id, 10),
		description: row.description,
		is_active: row.is_active === 't' ? 1 : 0,
		category: row.category
	});

	row.post_ids
		.slice(1, -1)
		.split(',')
		.filter(e => e)
		.map(e => parseInt(e, 10))
		.forEach(post_id => statements[1].run({
			pool_id: pool_id,
			post_id: post_id
		}));
}

module.exports = new E621ExportType('pools', schema, get_prepared_statements, insert_row)