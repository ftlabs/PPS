const fetch = require('node-fetch');

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

async function postJSONData(url, data, callback = null) {
	const options = {
		method: 'POST',
		body: JSON.stringify(data),
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'Bearer ' + process.env.SLACK_TOKEN
		}
	};

	return fetch(url, options)
		.then(response => {
			if (response.error != null) {
				throw error;
			}
			if (callback) {
				callback(response);
			}
		})
		.catch(err => console.log(err));
}

module.exports = {
	dateFormat,
	wait,
	postJSONData
};
