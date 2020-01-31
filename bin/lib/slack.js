const fetch = require('node-fetch');

function openView(payload, res) {
	const options = {
		method: 'POST',
		body:    JSON.stringify(payload),
		headers: { 
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + process.env.SLACK_TOKEN,
		}
	};

	return fetch(`https://slack.com/api/views.open`, options)
			.then(response => response.json())
			.then(data => {
				console.log('D::', data)

				if(data.ok) {
					res.end();
				} else {
					//TODO: throw Error here and focus the error handling throughout the app.
					res.send('We have issues processing the request, contact the app admin');
				}
			})
			.catch(err => console.log(err));
}

function updateView(content, res) {
	const options = {
		method: 'POST',
		body:    JSON.stringify(content),
		headers: { 
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + process.env.SLACK_TOKEN,
		}
	};

	console.log(options,'::updateView' );

	return fetch(`https://slack.com/api/views.update`, options)
			.then(response => response.json())
			.then(data => {
				console.log('UPDATE DATA::', data)

				if(data.ok) {
					// res.end();
				} else {
					//TODO: throw Error here and focus the error handling throughout the app.
					res.send('We have issues processing the request, contact the app admin');
				}
			})
			.catch(err => console.log(err));
}

function pushView(content) {
	const options = {
		method: 'POST',
		body:    JSON.stringify(content),
		headers: { 
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + process.env.SLACK_TOKEN,
		}
	};

	console.log(options,'::updateView' );

	return fetch(`https://slack.com/api/views.push`, options)
			.then(response => response.json())
			.then(data => {
				console.log('UPDATE DATA::', data)

				// if(data.ok) {
				// 	res.end();
				// } else {
				// 	//TODO: throw Error here and focus the error handling throughout the app.
				// 	res.send('We have issues processing the request, contact the app admin');
				// }
			})
			.catch(err => console.log(err));
}


module.exports = {
	openView,
	updateView,
	pushView
}