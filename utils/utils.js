function parse_potentially_empty_date (date) {
	if (date === '') {
		// Site start
		return new Date(`2006-01-01 00:00:00.0000+00:00`).getTime();
	} else {
		return new Date(`${date}+00:00`).getTime();
	}
}

function get_today () {
	const now = new Date();
	const year = now.getFullYear().toString().padStart(4, '0');
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	const day = now.getDate().toString().padStart(2, '0');
	const today = `${year}-${month}-${day}`;
	return today;
}

module.exports = {
	parse_potentially_empty_date: parse_potentially_empty_date,
	get_today: get_today
}