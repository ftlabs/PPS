if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const helmet = require('helmet');
const express_enforces_ssl = require('express-enforces-ssl');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 2020;

const Sheet = require('./bin/lib/sheets');
const Structure = require('./bin/lib/structure');
const Input = require('./bin/lib/inputManagement');

if (process.env.NODE_ENV === 'production') {
	app.use(helmet());
	app.enable('trust proxy');
	app.use(express_enforces_ssl());

	const googleTokenPath = path.resolve(`${__dirname}/keyfile.json`);
	fs.writeFileSync(googleTokenPath, process.env.GOOGLE_CREDS);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
setUpStructure();

app.post('/add', (req,res) => {
	const payload = Structure.build(req.body.trigger_id);

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
});

app.post('/submit', async (req, res) => {
	const response = JSON.parse(req.body.payload);
	const actionType = response.type;
	const viewID = response.view.id;
	const user = response.user.name;
	const values = response.view.state.values;
	const submission = Input.submit(viewID, user, values);

	if(submission) {	
		await Sheet.write(submission, data => {
			Input.deleteView(viewID);
		});
	}

	res.json({
		"response_action": "clear"
	});
});

async function setUpStructure() {
	await Structure.init();
}

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));