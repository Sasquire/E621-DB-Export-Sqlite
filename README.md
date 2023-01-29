# E621 DB Export (sqlite)

This program takes the [e621 db_export](https://e621.net/db_export/) files and inserts them to a [sqlite3](https://sqlite.org/index.html) database.

## How to use

### TODO

Roaring is currently super broke on my machine. But I had all the code, so I'm not going to waste it.

### After running

Either method should create a file called `e621.database.sqlite3`. This is the database.

## Quirks

I have made some changes to the direct data export to make this database easier and more intuitive to understand.

- general
  - Tags: Tags are in their own post_id-tag_name table. This feels more correct than a tag-string, but I could be proven wrong.
  - Dates, times, instants: All times are stored in [Unix time](https://en.wikipedia.org/wiki/Unix_time).
- posts_metadata
  - `change_seq`: A unique identifier for any post in time. Changing anything about a post on e621 assigns it a new `change_seq` value.
  - `updated_at`: If the post has not been edited then this is set to `created_at`
  - `current_md5`: Replaces `md5` because the md5 of a post may change.
  - `approver_id`: If post did not have an approver, it was assumed it was auto-approved by the uploader.
  - `parent_id`: Nullable to improve ease-of-use.
  - `duration`: Represents playtime of post-video in seconds. Nullable to improve ease-of-use.
- posts_sources
  - `source`: Not guaranteed to be a URL. Split the sources string by newlines.
- tag_aliases
  - `created_at`: If was missing then is set to `2006-01-01`.
  - `tag`: Tag that is being aliased away (not the tag that is displayed). Called `antecedent_name` on e621.
  - `main_tag`: Tag that is being aliased to (the tag that is displayed everywhere). Called `consequent_name` on e621.
- tag_implications
  - `tag`: Tag that implies another tag. Called `antecedent_name` on e621.
  - `implied_tag`: Tag that is implied. Called `consequent_name` on e621.
- tags
  - `category`: Contains a [magic number](https://en.wikipedia.org/wiki/Magic_number_(programming)) referring to the tag category.
  - `count_on_active_posts`: Rename of `post_count` because `post_count` does not include deleted posts.
- wiki_pages
  - `updater_id`: If the page has not been edited then this is set to `creator_id`.

## Motivation

I wanted a small, portable, and efficient copy of the e621 database. Making a sqlite3 database meant that I would not have to parse a csv file every time or keep a clunky json file. SQL code could be written once with a lot less mental work. 

## Downsides

This program is not efficient for keeping up-to-date copies of the e621 database. It requires a decent amount of time to run on a dataset that is updated every 24 hours. If you want a more up-to-date database at all times consider looking at my other (not well-maintained) project [Furry-Database](https://github.com/Sasquire/Furry-Database) which is built to stay up-to-date on change to e621 (and hopefully other websites).

The database is much larger than the individual csv files. This is because of the slight overhead of using sqlite3 and because of the `posts_*` tables. If size were of a greater concern, the tag-strings in `posts_tags` could be replaced with `tag_id`'s, making posts require a dependency on tags, but this seemed more user-friendly.

