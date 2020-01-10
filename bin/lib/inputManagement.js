const Utils = require('./utils');

const blocks = {};
const template = {
	'mission': '',
	'releaseType': '',
	'releaseDate': 0,
	'productOwner': 'anonymous',
	'submitted': null,
	'submitter': null
};

function add(blockID, property, value) {
	checkExisting(blockID, true);

	blocks[blockID][property] = value;

	console.log(`ADDED: ${property} for ${blockID}`);
}

function checkExisting(blockID, create = false) {
	if(blocks[blockID] === undefined) {
		if(create) {
			blocks[blockID] = template;	
		}
		return false;
	} else {
		return true;
	}
}

function deleteBlock (blockID) {
	delete blocks[blockID];
}

function submit(blockID, user) {
	//TODO: check if exists, validate, etc.
	console.log('BLOCK ID', blockID);
	
	if(checkExisting(blockID)) {
		blocks[blockID].submitter = user;
		blocks[blockID].submitted = new Date().toISOString(); 
		if(blocks[blockID].releaseDate === 0) {
			blocks[blockID].releaseDate = Utils.dateFormat(new Date());
		}

		if(blocks[blockID].productOwner === 'anonymous') {
			blocks[blockID].productOwner = user;
		}

		return blocks[blockID];	
	}

	return false;
}

function validate() {
	//TODO: ensure all fields have been filled before writing + exists
	return;
}

module.exports = {
	add,
	submit,
	deleteBlock
}