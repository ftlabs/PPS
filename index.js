if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 2020;

const Sheet = require('./bin/lib/sheets');
const Structure = require('./bin/lib/structure');
const Input = require('./bin/lib/inputManagement');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
setUpStructure();

app.post('/add', (req,res) => {
	const payload = Structure.build(req.body.trigger_id);

	const options = {
		method: 'POST',
		body:    JSON.stringify(payload),
		headers: { 
			'Content-Type': 'application/json; charset=utf-8',
			'Authorization': 'Bearer ' + process.env.SLACK_TOKEN,
		}
	};

	return fetch(`https://slack.com/api/views.open`, options)
			.then(response => response.json())
			.then(data => {
				//TODO: check data status and handle error
				console.log('D::', data)
				res.end();
			})
			.catch(err => console.log(err));
});

app.post('/submit', async (req, res) => {
	const response = JSON.parse(req.body.payload);
	console.log('Submit', JSON.stringify(response.view.state));
	// const actionType = response.actions[0].type;
	// console.log('act::', actionType, response.actions.length)
	// console.log(response);

	// const blockID = response.actions[0].block_id;
	// console.log('it\'s still going to submit');

	//TODO: handle validation for all actions

	res.json({
	  "response_action": "clear"
	});

// 	switch(actionType) {
// 		case 'button':
// 			const user = response.user.name;
// 			const submission = Input.submit(blockID, user);

// 			if(submission) {
// 				await Sheet.write(submission, () => {
// 					Input.deleteBlock(blockID);

// 					//TODO: replace the text/collapse block;
// 					return res.send('New row added');
// 				});
// 			} else {
// 				//TODO: send/display error
// 				console.log('No block to submit');
// 				return res.sendStatus(200);	
// 			}
			
// 		break;

// 		case 'static_select':
// 			const property = response.actions[0].action_id;
// 			Input.add(blockID, property, response.actions[0].selected_option.value);
			
// 			return res.sendStatus(200);
// 		break;

// 		case 'datepicker':
// 			Input.add(blockID, 'releaseDate', response.actions[0].selected_date);
// 			return res.sendStatus(200);
// 		break;
// 	}
});

async function setUpStructure() {
	await Structure.init();
}

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));