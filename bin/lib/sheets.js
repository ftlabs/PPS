const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');

let doc = new GoogleSpreadsheet(process.env.SHEET_ID);
let sheet;
let headers;
let rows;

async function writeToSheet({ ...msg }, callback) {
	return async.series(
		[
			(setAuth = step => {
				creds = require('./../../keyfile.json');
				doc.useServiceAccountAuth(creds, step);
			}),
			(addRow = step => {
				doc.getInfo((err, info) => {
					if (err) {
						console.log(err);
						throw new Error();
					}

					//TODO: pick worksheet, optimise the sheets library
					//TODO: people could add missions or types

					sheet = info.worksheets[0];

					sheet.addRow(msg, (err, data) => {
						console.log('ERR::', err);
						console.log('DATA::', data);
						callback(data);
					});
				});
			})
		],
		err => {
			if (err) {
				console.log(`Error: ${err}`);
			}
		}
	);
}

async function readSheet(worksheet = 'Main', sortCol = 'mission', headersFlag = false, callback) {
	return async.series(
		[
			(setAuth = step => {
				creds = require('./../../keyfile.json');
				doc.useServiceAccountAuth(creds, step);
			}),
			(pickSheet = step => {
				doc.getInfo((err, info) => {
					if (err) {
						console.log(err);
						throw new Error();
					}

					// console.log('Loaded doc: '+info.title+' by '+info.author.email);
					// console.log(info.worksheets);

					const worksheetID = info.worksheets.findIndex(s => {
						return s.title === worksheet;
					});

					// console.log('worksheetID', worksheetID);
					sheet = info.worksheets[worksheetID];
					// console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
					step();
				});
			}),
			(readHeaders = step => {
				if (headersFlag) {
					sheet.getCells(
						{
							'max-row': 1
						},
						(err, readHeaders) => {
							console.log('Read ' + readHeaders.length + ' headers');

							headers = readHeaders.map(item => {
								return item._value.toLowerCase();
							});

							step();
						}
					);
				} else {
					step();
				}
			}),
			(readRows = step => {
				//NB row query format https://developers.google.com/sheets/api/v3/data#send_a_structured_query_for_rows
				sheet.getRows(
					{
						orderby: sortCol
					},
					(err, readRows) => {
						console.log('Read ' + readRows.length + ' rows');
						//callback(rows);
						rows = readRows;
						step();
					}
				);
			}),
			(initCallback = step => {
				callback(rows, headers);
			})
		],
		err => {
			if (err) {
				console.log(`Error: ${err}`);
			}
		}
	);
}

module.exports = {
	read: readSheet,
	write: writeToSheet
};
