function parse_potentially_empty_date (date) {
	if (date === '') {
		// Site start
		return new Date(`2006-01-01 00:00:00.0000+00:00`).getTime();
	} else {
		return new Date(`${date}+00:00`).getTime();
	}
}

module.exports = {
	parse_potentially_empty_date: parse_potentially_empty_date
}