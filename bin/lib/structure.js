const Sheet = require('./sheets');
const Utils = require('./utils');

async function init() {
	this.missionValues = await getValues('Mission');
	this.typeValues = await getValues('Type');

	return this;
}

async function getValues(sheetName) {
	return new Promise((resolve, reject) => {
		Sheet.read(sheetName, 'value', data => {
			const output = [];
			data.forEach(item => {
				output.push(item.value);
			});

			resolve(output);
		});
	});
}

function getMissions() {
	return this.missionValues;
}

function getTypes() {
	return this.typeValues;
}

function formatOptions(arr) {
	const options = [];

	arr.forEach(option => {
		options.push({
			"text": {
				"type": "plain_text",
				"text": option
				},
			"value": option
		});
	});

	return options;
}

function build() {
	//block types "section" vs "actions"

	const payload = {
		// ???? Any interactive components used within input blocks will not send this block_actions payload. They are included in view_submission payloads only.
		//https://api.slack.com/reference/interaction-payloads/block-actions
		"blocks": [
			{ 
				"type": "actions",
				"elements": [
					{
						"type": "static_select",
						"action_id": "mission",
						"placeholder": {
							"type": "plain_text",
							"text": "Pick a Mission"
						},
		 				options: formatOptions(this.missionValues)
					},
					{
						"type": "static_select",
						"action_id": "releaseType",
						"placeholder": {
							"type": "plain_text",
							"text": "Pick a Type"
						},
		 				options: formatOptions(this.typeValues)
					},
					{
						"type": "datepicker",
						"initial_date": Utils.dateFormat(new Date()),
						"placeholder": {
							"type": "plain_text",
							"text": "Release date"
						}
					},
					{
						"type": "button",
						"action_id": "submit",
						"text": {
							"type": "plain_text",
							"text": "Submit"
						},
						"style": "primary",
						"value": "submit"
					}
				]
			}
		]
	}

	return payload;
}

module.exports = { 
	init,
	getMissions,
	getTypes,
	build
};