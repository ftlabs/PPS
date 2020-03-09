const Sheet = require('./sheets');

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

async function getMissions() {
	return getValues('Mission');
}

async function getTypes() {
	return getValues('Type');
}

async function getReports() {
	return getReportValues('Report');
}

function getReportTitles() {
	return getReports().then(data => {
		return data.map(report => {
			return report.title;
		});
	});
}

module.exports = {
	getMissions,
	getTypes,
	getReports,
	getReportTitles
};
