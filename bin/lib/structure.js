const Utils = require('./utils');
const DataRequest = require('./dataRequest');
const AsciiTable = require('ascii-table');

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

function build(triggerID, private_metadata) {
	const missions = DataRequest.getMissions();
	const types = DataRequest.getTypes();
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
			private_metadata: JSON.stringify(private_metadata),
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
						options: formatOptions(missions)
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
						options: formatOptions(types)
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

function clear() {
	return {
		response_action: 'clear'
	};
}

function processing(productName) {
	return {
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `New row request for *${productName}* received. Processing...`
				}
			}
		]
	};
}

function confirm({ ...values }) {
	return {
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `Added row: \`\`\`${values.mission} | ${values.releasetype} | ${values.productname} | ${values.productphase} | ${values.releasedate}\`\`\``
				}
			}
		]
	};
}

function processingReport(reportName) {
	return {
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `Report request for *${reportName}* received. Processing...`
				}
			}
		]
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

async function summary(name, headers, rows, worksheet_id) {
	const { title, description } = await getReport(name);

	const table = createAsciiTable(headers, rows);
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

function getReport(name) {
	return DataRequest.getReports().then(reports => {
		const foundProps = reports.filter(report => {
			if (report.title === name) {
				return report;
			}
		});
		return foundProps[0];
	});
}

function createAsciiTable(headers, rows) {
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
	build,
	processing,
	confirm,
	clear,
	confirm,
	processingReport,
	summaryList,
	summary,
	error
};
