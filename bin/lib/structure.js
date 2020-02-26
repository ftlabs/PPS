const Sheet = require('./sheets');
const Utils = require('./utils');
const AsciiTable = require('ascii-table');

async function init() {
	this.missionValues = await getValues('Mission');
	this.typeValues = await getValues('Type');
	this.reportValues = await getReportValues('Report');

	return this;
}

async function getValues(sheetName) {
	return new Promise((resolve, reject) => {
		Sheet.read(sheetName, 'value', false, data => {
			const output = [];
			data.forEach(item => {
				output.push(item.value);
			});

			resolve(output);
		});
	});
}

async function getReportValues(sheetName) {
	return new Promise((resolve, reject) => {
		Sheet.read(sheetName, 'value', false, data => {
			const output = [];
			data.forEach(item => {
				output.push({
					title: item.title,
					description: item.description
				});
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

function getReports() {
	return this.reportValues;
}

function getReportTitles() {
	return this.reportValues.map(report => {
		return report.title;
	});
}

function getReport(reportValues, name) {
	const foundProps = reportValues.filter(obj => {
		if (obj.title === name) {
			return obj;
		}
	});
	return foundProps[0];
}

function formatOptions(arr) {
	const options = [];

	arr.forEach(option => {
		options.push({
			text: {
				type: 'plain_text',
				text: option
			},
			value: option
		});
	});

	return options;
}

function build(triggerID) {
	const payload = {
		trigger_id: triggerID,
		view: {
			type: 'modal',
			title: {
				type: 'plain_text',
				text: 'Project status update'
			},
			submit: {
				type: 'plain_text',
				text: 'Submit'
			},
			close: {
				type: 'plain_text',
				text: 'Cancel'
			},
			blocks: [
				{
					type: 'input',
					block_id: 'mission',
					element: {
						type: 'static_select',
						action_id: 'mission_select',
						placeholder: {
							type: 'plain_text',
							text: 'Pick a Mission'
						},
						options: formatOptions(this.missionValues)
					},
					label: {
						type: 'plain_text',
						text: 'Mission'
					}
				},
				{
					type: 'input',
					block_id: 'release_type',
					element: {
						type: 'static_select',
						action_id: 'type_select',
						placeholder: {
							type: 'plain_text',
							text: 'Pick a Type'
						},
						options: formatOptions(this.typeValues)
					},
					label: {
						type: 'plain_text',
						text: 'Release Type'
					}
				},
				{
					type: 'input',
					block_id: 'product_name',
					element: {
						type: 'plain_text_input',
						action_id: 'product_name_text',
						placeholder: {
							type: 'plain_text',
							text: 'e.g myFT, Apps, FT.com, etc.'
						}
					},
					label: {
						type: 'plain_text',
						text: 'Product name'
					}
				},
				{
					type: 'input',
					block_id: 'product_phase',
					element: {
						type: 'plain_text_input',
						action_id: 'product_phase_text',
						placeholder: {
							type: 'plain_text',
							text: 'e.g. A/B Test, Stabilisation, Upgrade, etc.'
						}
					},
					label: {
						type: 'plain_text',
						text: 'Product phase'
					}
				},
				{
					type: 'input',
					block_id: 'release_date',
					element: {
						type: 'datepicker',
						action_id: 'release_date_text',
						initial_date: Utils.dateFormat(new Date()),
						placeholder: {
							type: 'plain_text',
							text: 'Release date'
						}
					},
					label: {
						type: 'plain_text',
						text: 'Release date'
					}
				}
			]
		}
	};

	return payload;
}

function confirm({ ...values }) {
	return {
		response_action: 'update',
		view: {
			type: 'modal',
			title: {
				type: 'plain_text',
				text: 'Update received'
			},
			close: {
				type: 'plain_text',
				text: 'Close'
			},
			blocks: [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `Added row: \`\`\`${values.mission} | ${values.releasetype} | ${values.productname} | ${values.productphase} | ${values.releasedate}\`\`\``
					}
				}
			]
		}
	};
}

function summaryList(values) {
	const options = [];

	values.forEach(item => {
		options.push({
			text: {
				type: 'plain_text',
				text: `${item}`,
				emoji: true
			},
			value: `report||${item}`
		});
	});

	return {
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'PPS summaries available: '
				},
				accessory: {
					type: 'static_select',
					placeholder: {
						type: 'plain_text',
						text: 'Select an item',
						emoji: true
					},
					options: options
				}
			}
		]
	};
}

function summary(name, headers, rows, worksheet_id) {
	const { title, description } = getReport(this.reportValues, name);
	const table = createAsciiTable(title, headers, rows);
	return {
		blocks: [
			{
				type: 'divider'
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `${title} report requested on ${Utils.dateFormat(
							new Date()
						)} \n Full report: https://docs.google.com/spreadsheets/d/${process.env.SHEET_ID}/edit#gid=${worksheet_id}`
					}
				]
			}
		],
		attachments: [
			{
				blocks: [
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `*${description}*`
						}
					},
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `\`\`\`${table}\`\`\``
						}
					}
				]
			}
		]
	};
}

function createAsciiTable(title, headers, rows) {
	let table = new AsciiTable();
	table.setHeading(headers);
	rows.forEach(row => {
		table.addRow(row);
	});
	table.setTitleAlignLeft();
	return table.toString();
}

function error(value) {
	return {
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'An error was detected'
				}
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `\`\`\`${value}\`\`\``
				}
			}
		]
	};
}

module.exports = {
	init,
	getMissions,
	getTypes,
	getReports,
	getReportTitles,
	build,
	confirm,
	summaryList,
	summary,
	error
};
