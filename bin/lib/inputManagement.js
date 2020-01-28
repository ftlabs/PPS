const Utils = require('./utils');

const views = {};
const template = {
	'mission': '',
	'releaseType': '',
	'releaseDate': 0,
	'productName': '',
	'productPhase': '',
	'productOwner': 'anonymous',
	'submitted': null,
	'submitter': null
};

function add(viewID, property, value) {
	checkExisting(viewID, true);

	views[viewID][property] = value;

	console.log(`ADDED: ${property} for ${viewID}`);
}

function checkExisting(viewID, create = false) {
	if(views[viewID] === undefined) {
		if(create) {
			views[viewID] = template;	
		}
		return false;
	} else {
		return true;
	}
}

function deleteView (viewID) {
	delete views[viewID];
}

function submit(viewID, user, values) {
	//TODO: check if exists, validate, etc.
	console.log('VIEWID::Sub', viewID);
	
	if(checkExisting(viewID)) {
		console.log('EXISTING');
		views[viewID].productName = values.product_name.product_name_text.value;
		views[viewID].productPhase = values.product_phase.product_phase_text.value;	
		views[viewID].releaseDate =  values.release_date.release_date_text.selected_date;
		
		views[viewID].submitter = user;
		views[viewID].submitted = new Date().toISOString();

		if(views[viewID].productOwner === 'anonymous') {
			views[viewID].productOwner = user;
		}


		console.log('SUB::', views[viewID]);
		return views[viewID];	
	}

	console.log('does not exist');
	return false;
}

function validate() {
	//TODO: ensure all fields have been filled before writing + exists
	return;
}

module.exports = {
	add,
	submit,
	deleteView
}