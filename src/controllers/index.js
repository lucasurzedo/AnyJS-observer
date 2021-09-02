const mongoose = require('mongoose');
const pluralize = require('pluralize');
const ModelTask = require('../models/modelTask');

async function notifyExecution(req, res, next) {
	const jsonResult = {
		"uri": `/api/anyJS/execute/task/${req.params['taskName']}/execution/${req.params['executionName']}`,
		"result": "execution finished",
		"status": 200
	}

	let timeout = req.query.timeout;
	if (timeout != -1){
		console.log(`Set timeout to ${timeout}`);
		res.setTimeout(parseInt(timeout, 10)*1000, () => {
			console.log('Request has timed out.');
				jsonResult.result = "request has timed out"
				jsonResult.status = 408;
				res.send(jsonResult);
		});
	}

	const Model = mongoose.model(req.params['taskName'], ModelTask);
	const collectionName = (req.params['taskName'] + "").toLowerCase();
	
	console.log(`Watching ${collectionName}`);

	const pipeline = [{ $match: { 'ns.db': 'anyjs-db', 'ns.coll': pluralize(collectionName)} }];
	Model.watch(pipeline).on('change', data => {
		if (jsonResult.status === 408) {
			return;
		}
		Model.findById(data.documentKey._id, (error, document) => {
			if (error) {
				console.log(error);
			}

			if (jsonResult.status != 408 && document.executionName == req.params['executionName']) {
				console.log(jsonResult);
				res.send(jsonResult);
			}
		});
	});
}

module.exports = {
	notifyExecution
};
