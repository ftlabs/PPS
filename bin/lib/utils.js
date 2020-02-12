function dateFormat(date) {
	return new Date(date).toISOString().split('T')[0];
}

function wait(ms) {
	var start = new Date().getTime();
	var end = start;
	while (end < start + ms) {
		end = new Date().getTime();
	}
}

module.exports = {
	dateFormat,
	wait
}