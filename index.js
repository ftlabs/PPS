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

app.post('/add', (req, res) => {
	const private_metadata = {
		channel: req.body.channel,
		response_url: req.body.response_url
	};

	const payload = Structure.build(req.body.trigger_id, private_metadata);

	const options = {
		method: 'POST',
		body: JSON.stringify(payload),
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'Bearer ' + process.env.SLACK_TOKEN
		}
	};

	return fetch(`https://slack.com/api/views.open`, options)
		.then(response => response.json())
		.then(data => {
			console.log('D::', data);

			if (data.ok) {
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

	if (response.hasOwnProperty('view')) {
		return modalResponse(req, res);
	} else {
		return summaryResponse(req, res);
	}
});

async function modalResponse(req, res) {
	const response = JSON.parse(req.body.payload);
	const user = response.user.name;
	const viewID = response.view.id;
	const values = response.view.state.values;
	const private_metadata = JSON.parse(response.view.private_metadata);
	const response_url = private_metadata.response_url;
	const submission = Input.submit(viewID, user, values);

	const response_msg_process = Structure.processing(submission.productName);
	postData(response_url, response_msg_process);

	if (submission) {
		Sheet.write(submission, data => {
			Input.deleteView(viewID);

			const response_msg_confirm = Structure.confirm(data);
			postData(response_url, response_msg_confirm);
		});
	}

	return res.json(Structure.clear());
}

app.post('/summary', async (req, res) => {
	const parameter = req.body.text;
	const response_url = req.body.response_url;
	const titles = Structure.getReportTitles();

	if (parameter === '') {
		return res.json(Structure.summaryList(titles));
	} else if (parameter && titles.includes(parameter)) {
		return await Sheet.read(parameter, 'value', true, (data, headers, worksheet_id) => {
			postSummary(response_url, parameter, headers, data);
			return res.sendStatus(200);
		});
	} else {
		return res.json(Structure.error('No summary by that name'));
	}

	return res.json(Structure.clear());
});

async function summaryResponse(req, res) {
	const parsedPayload = JSON.parse(req.body.payload);
	const parameter = parsedPayload.actions[0].selected_option.text.text;
	const response_url = parsedPayload.response_url;

	return await Sheet.read(parameter, 'value', true, (data, headers, worksheet_id) => {
		postSummary(response_url, parameter, headers, data, worksheet_id);
		return res.sendStatus(200);
	});
}

async function postSummary(url, name, headers, data, worksheet_id) {
	const rows = [];

	data.forEach(item => {
		const row = [];
		for (const property in item) {
			if (headers.includes(property)) {
				row.push(item[property]);
			}
		}
		rows.push(row);
	});

	postData(url, Structure.summary(name, headers, rows, worksheet_id));
}

async function postData(url, data) {
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
		})
		.catch(err => console.log(err));
}

async function setUpStructure() {
	await Structure.init();
}

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
