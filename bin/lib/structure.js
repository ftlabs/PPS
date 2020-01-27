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

function build(triggerID) {

	const payload = {
		"trigger_id": triggerID,
	  	"view": {
		    "type": "modal",
			"title": {
				"type": "plain_text",
				"text": "Your project status update"
			},
			"submit": {
				"type": "plain_text",
				"text": "Submit"
			},
			"close": {
				"type": "plain_text",
				"text": "Cancel"
			},
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
						}
					]
				},
				{
					"type": "input",
					"block_id":"product_name",
					"element": {
						"type": "plain_text_input",
						"action_id": "product_name_text",
						"placeholder": {
							"type": "plain_text",
							"text": "e.g myFT, Apps, FT.com, etc."
						}
					},
					"label": {
						"type": "plain_text",
						"text": "Product name"
					}
				},
				{
					"type": "input",
					"block_id":"product_phase",
					"element": {
						"type": "plain_text_input",
						"action_id": "product_phase_text",
						"placeholder": {
							"type": "plain_text",
							"text": "e.g. A/B Test, Stabilisation, Upgrade, etc."
						}
					},
					"label": {
						"type": "plain_text",
						"text": "Product phase"
					}
				},
				{
					"type": "input",
					"element":{
						"type": "datepicker",
						"initial_date": Utils.dateFormat(new Date()),
						"placeholder": {
							"type": "plain_text",
							"text": "Release date"
						}
					},
					"label": {
						"type": "plain_text",
						"text": "Release date"
					}
				}
			]
		}
	};

	return payload;
}

module.exports = { 
	init,
	getMissions,
	getTypes,
	build
};