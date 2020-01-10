function dateFormat(date) {
	return new Date(date).toISOString().split('T')[0];
}

module.exports = {
	dateFormat
}