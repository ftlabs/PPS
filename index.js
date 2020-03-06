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

const Util = require('./bin/lib/utils');
const Sheet = require('./bin/lib/sheets');
const Structure = require('./bin/lib/structure');
const Input = require('./bin/lib/inputManagement');
const DataReq = require('./bin/lib/dataRequest');

if (process.env.NODE_ENV === 'production') {
	app.use(helmet());
	app.enable('trust proxy');
	app.use(express_enforces_ssl());

	const googleTokenPath = path.resolve(`${__dirname}/keyfile.json`);
	fs.writeFileSync(googleTokenPath, process.env.GOOGLE_CREDS);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ----------------------------------------------------------------------------
// Endpoint for handling /add slash commands from Slack
// ----------------------------------------------------------------------------
app.post('/add', async (req, res) => {
	const private_metadata = {
		channel: req.body.channel,
		response_url: req.body.response_url
	};

	const payload = await Structure.build(req.body.trigger_id, private_metadata);

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
				res.send('We have issues processing the request, contact the app admin');
			}
		})
		.catch(err => console.log(err));
});

// ----------------------------------------------------------------------------
// Endpoint for receiving data submissions/requests from Slack
// ----------------------------------------------------------------------------
app.post('/submit', async (req, res) => {
	const response = JSON.parse(req.body.payload);

	if (response.hasOwnProperty('view')) {
		return modalResponse(req, res);
	} else {
		return summaryResponse(req, res);
	}
});

// ----------------------------------------------------------------------------
// Build and send Slack modal form for user(s) to add Project Status Updates
// ----------------------------------------------------------------------------
async function modalResponse(req, res) {
	const response = JSON.parse(req.body.payload);
	const user = response.user.name;
	const viewID = response.view.id;
	const values = response.view.state.values;
	const submission = Input.submit(viewID, user, values);
	const response_msg_process = Structure.processing(submission.productName);
	const private_metadata = JSON.parse(response.view.private_metadata);
	const response_url = private_metadata.response_url;

	// 1. Send a Slack message to the user confirming reception
	//    of the add entry request
	Util.postJSONData(response_url, response_msg_process);

	if (submission) {
		Sheet.write(submission, data => {
			// Deletes view so future requests can get a fresh version
			Input.deleteView(viewID);

			// 2. Send a Slack message confirming that the contents
			//    of the request was added to the data store
			const response_msg_confirm = Structure.confirm(data);
			Util.postJSONData(response_url, response_msg_confirm);
		});
	}

	// 3. Send a Slack message to clear the Slack modal form window
	return res.json(Structure.clear());
}

// ----------------------------------------------------------------------------
// Endpoint for handling /summary slash commands from Slack
// ----------------------------------------------------------------------------
app.post('/summary', async (req, res) => {
	const parameter = req.body.text;
	const response_url = req.body.response_url;
	const titles = await DataReq.getReportTitles();

	if (parameter && titles.includes(parameter)) {
		// Send specifically requested Report
		Sheet.read(parameter, 'value', true, (data, headers, worksheet_id) => {
			postSummary(response_url, parameter, headers, data, worksheet_id);
		});
		return res.json(Structure.processingReport(parameter));
	} else if (parameter === '') {
		// Send list of current available Reports
		return res.json(Structure.summaryList(titles));
	} else {
		return res.json(Structure.summaryList(titles, 'No summary by that name'));
	}
});

// ----------------------------------------------------------------------------
// Build and send Ascii table summaries of data reports
// ----------------------------------------------------------------------------
async function summaryResponse(req, res) {
	const parsedPayload = JSON.parse(req.body.payload);
	const parameter = parsedPayload.actions[0].selected_option.text.text;
	const response_url = parsedPayload.response_url;

	Sheet.read(parameter, 'value', true, (data, headers, worksheet_id) => {
		postSummary(response_url, parameter, headers, data, worksheet_id);
	});

	return res.json(Structure.processingReport(parameter));
}

// ----------------------------------------------------------------------------
// Build summary data from specified report to be sent to Slack user
// ----------------------------------------------------------------------------
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

	const summary = await Structure.summary(name, headers, rows, worksheet_id);

	Util.postJSONData(url, summary);
}

// ----------------------------------------------------------------------------
// Post JSON data to Slack
// ----------------------------------------------------------------------------
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

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
