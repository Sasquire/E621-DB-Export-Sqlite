const schema = `
create table posts_metadata (
	post_id integer primary key,
	change_seq integer unique on conflict fail,
	updated_at integer not null,
	
	current_md5 text unique on conflict fail,
	file_ext text not null,

	created_at integer not null,
	uploader_id integer not null,
	approver_id integer not null,
	
	is_deleted integer not null, -- is a boolean
	is_pending integer not null, -- is a boolean
	is_flagged integer not null, -- is a boolean
	is_rating_locked integer not null, -- is a boolean
	is_status_locked integer not null, -- is a boolean
	is_note_locked integer not null, -- is a boolean

	rating text not null,
	parent_id integer, -- parent_id is nullable
	description text not null,

	image_width integer not null,
	image_height integer not null,
	file_size integer not null,
	duration integer, -- duration is nullable and is the playtime of the video in seconds
	
	fav_count integer not null,
	comment_count integer not null,
	up_score integer not null,
	down_score integer not null
);

create table posts_sources (
	post_id integer not null,
	source text not null,
	constraint fk_posts_sources_references_posts_metadata_post_id foreign key (post_id) references posts_metadata
);

create table posts_tags (
	post_id integer not null,
	tag_id integer not null,
	constraint fk_posts_tags_references_posts_metadata_post_id foreign key (post_id) references posts_metadata
	constraint fk_posts_tags_references_tags_tag_id foreign key (tag_id) references tags
);

create table posts_locked_tags (
	post_id integer not null,
	tag_id integer not null,
	constraint fk_posts_locked_tags_references_posts_metadata_post_id foreign key (post_id) references posts_metadata
	constraint fk_posts_locked_tags_references_tags_tag_id foreign key (tag_id) references tags
);
`

function get_prepared_statements (database) {
	return [
		database.prepare(`
			insert into posts_metadata (
				post_id,
				change_seq,
				updated_at,

				current_md5,
				file_ext,

				created_at,
				uploader_id,
				approver_id,

				is_deleted,
				is_pending,
				is_flagged,
				is_rating_locked,
				is_status_locked,
				is_note_locked,

				rating,
				parent_id,
				description,

				image_width,
				image_height,
				file_size,
				duration,

				fav_count,
				comment_count,
				up_score,
				down_score
			) values (
				@post_id,
				@change_seq,
				@updated_at,

				@current_md5,
				@file_ext,

				@created_at,
				@uploader_id,
				@approver_id,

				@is_deleted,
				@is_pending,
				@is_flagged,
				@is_rating_locked,
				@is_status_locked,
				@is_note_locked,

				@rating,
				@parent_id,
				@description,
				
				@image_width,
				@image_height,
				@file_size,
				@duration,

				@fav_count,
				@comment_count,
				@up_score,
				@down_score
			);
		`), database.prepare(`
			insert into posts_sources (post_id, source) values (@post_id, @source);
		`), database.prepare(`
			insert into posts_tags (post_id, tag_id) select @post_id as post_id, tag_id from tags where name = @tag;
		`), database.prepare(`
			insert into posts_locked_tags (post_id, tag_id) select @post_id as post_id, tag_id from tags where name = @locked_tag;
		`)
	];
}

const indexes = `
create index ix_posts_tags_post_id on posts_tags (post_id);
create index ix_posts_tags_tag_id on posts_tags (tag_id);
--Not actually making these indexes because it's probably(?) not worth it
--The increased file size for very little gain. If it needs to be changed
--later, sure. But I'll change it then not now
--create index ix_posts_sources_post_id on posts_sources (post_id);
--create index ix_posts_locked_tags_post_id on posts_tags (post_id);
--create index ix_posts_locked_tags_tag_id on posts_tags (tag_id);`

function insert_row(statements, row) {
	const post_id = parseInt(row.id, 10);
	statements[0].run({
		post_id: post_id,
		change_seq: parseInt(row.change_seq, 10),
		updated_at: new Date(`${row.updated_at || row.created_at}+00:00`).getTime(),

		current_md5: row.md5,
		file_ext: row.file_ext,

		created_at: new Date(`${row.created_at}+00:00`).getTime(),
		uploader_id: parseInt(row.uploader_id, 10),
		approver_id: parseInt(row.approver_id || row.uploader_id, 10),

		is_deleted: row.is_deleted === 't' ? 1 : 0,
		is_pending: row.is_pending === 't' ? 1 : 0,
		is_flagged: row.is_flagged === 't' ? 1 : 0,
		is_rating_locked: row.is_rating_locked === 't' ? 1 : 0,
		is_status_locked: row.is_status_locked === 't' ? 1 : 0,
		is_note_locked: row.is_note_locked === 't' ? 1 : 0,

		rating: row.rating,
		parent_id: parseInt(row.parent_id, 10),
		description: row.description,

		image_width: parseInt(row.image_width, 10),
		image_height: parseInt(row.image_height, 10),
		file_size: parseInt(row.file_size, 10),
		duration: parseInt(row.duration, 10),

		fav_count: parseInt(row.fav_count, 10),
		comment_count: parseInt(row.comment_count, 10),
		up_score: parseInt(row.up_score, 10),
		down_score: parseInt(row.down_score, 10)
	});

	row.source
		.split('\n')
		.filter(e => e)
		.forEach(source => statements[1].run({
			post_id: post_id,
			source: source
		}));

	row.tag_string
		.split(' ')
		.filter(e => e)
		.forEach(tag => statements[2].run({
			post_id: post_id,
			tag: tag
		}));

	row.locked_tags
		.split(' ')
		.filter(e => e)
		.forEach(locked_tag => statements[3].run({
			post_id: post_id,
			locked_tag: locked_tag
		}));
}

module.exports = { schema, get_prepared_statements, insert_row, indexes };