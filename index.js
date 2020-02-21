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
	const user = response.user.name;

	if(response.hasOwnProperty('view')){
		// reply to modal submission

		const viewID = response.view.id;
		const values = response.view.state.values;
		const submission = Input.submit(viewID, user, values);

		if(submission) {	
			return await Sheet.write(submission, data => {
				Input.deleteView(viewID);
				return res.json(Structure.confirm(data, res));
			});
		}
	} else {
		// handle other posts

		const parsedPayload = JSON.parse(req.body.payload);
		const parameter = parsedPayload.actions[0].selected_option.text.text;
		const response_url = parsedPayload.response_url;

		return await Sheet.read(parameter, 'value', data => {
			const output = [];
			data.forEach(item => {
				output.push({
					mission: item.mission,
					count: item.count
				});
			});
			console.log(output);
			//return res.json(Structure.summary(output));
			
			const response_msg_summary = Structure.summary(output);
			postData(response_url, response_msg_summary);

			return res.sendStatus(200);
		});
	}
	
});

app.post('/summary', async (req, res) => {
	const parameter = req.body.text;
	
	return await Sheet.read('Report', 'value', async(data) => {
		const output = [];
		data.forEach(item => {
			output.push(item.value);
		});

		if(parameter === ''){
			return res.json(Structure.summaryList(output));
		} else if(parameter && output.includes(parameter)) {
			return await Sheet.read(parameter, 'value', data => {
				const output = [];
				data.forEach(item => {
					output.push({
						mission: item.mission,
						count: item.count
					});
				});
				return res.json(Structure.summary(output));
			});
		} else {
			return res.json(Structure.error("No summary by that name"));
		}
	});
});

async function setUpStructure() {
	await Structure.init();
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
			if(response.error != null ){
				throw error;
			}
		})
		.catch(err => console.log(err));
}

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));