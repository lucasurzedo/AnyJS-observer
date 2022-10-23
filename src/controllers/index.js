const mongoose = require('mongoose');
const ModelTask = require('../models/task');
const ModelObject = require('../models/object');

async function notifyDocument(req, res) {
  let jsonResult;
  let collectionName;
  let Model;

  if (req.params.service === 'task') {
    collectionName = (`${req.params.collectionName}_task`).toLowerCase();
    Model = mongoose.model(collectionName, ModelTask, collectionName);
    jsonResult = {
      uri: `${req.baseUrl}/execute/task/${req.params.collectionName}/execution/${req.params.documentName}`.toLowerCase(),
      result: 'execution finished',
    };
  } else if (req.params.service === 'object') {
    collectionName = (`${req.params.collectionName}_object`).toLowerCase();
    Model = mongoose.model(collectionName, ModelObject, collectionName);
    jsonResult = {
      uri: `${req.baseUrl}/store/object/${req.params.collectionName}/${req.params.documentName}`.toLowerCase(),
      result: 'storage finished',
    };
  }

  const timeout = req.query.timeout;
  if (timeout !== '-1') {
    console.log(`Set timeout to ${timeout}`);
    res.setTimeout(parseInt(timeout, 10) * 1000, () => {
      console.log('Request has timed out');
      jsonResult = {
        uri: `${req.baseUrl}${req.url}`,
        result: 'request has timed out',
        status: 408,
      };
      res.status(408).send(jsonResult);
    });
  }

  console.log(`Watching ${collectionName}`);

  const modelEventEmitter = Model.watch();

  modelEventEmitter.watch().on('change', (data) => {
    console.log(data);
    if (jsonResult.status == 408) {
      return;
    }
    if (data.operationType == 'replace' || data.operationType == 'update') {
      // eslint-disable-next-line no-underscore-dangle
      Model.findById(data.documentKey._id, (error, document) => {
        let key;
        if (req.params.service == 'task') {
          key = document.executionName;
        } else if (req.params.service == 'object') {
          key = document.objectName;
        }
        if (jsonResult.status !== 408 && key === req.params.documentName) {
          console.log(`No longer watching ${collectionName}`);
          jsonResult.status = 200;
          modelEventEmitter.close();
          res.status(200).send(jsonResult);
        }
      });
    }
  });
}

async function notifyCollection(req, res) {
  let jsonResult;
  let collectionName;
  let Model;

  if (req.params.service === 'task') {
    collectionName = (`${req.params.collectionName}_task`).toLowerCase();
    Model = mongoose.model(collectionName, ModelTask, collectionName);
    jsonResult = {
      uri: `${req.baseUrl}/task/${req.params.collectionName}`.toLowerCase(),
    };
  } else if (req.params.service === 'object') {
    collectionName = (`${req.params.collectionName}_object`).toLowerCase();
    Model = mongoose.model(collectionName, ModelObject, collectionName);
    jsonResult = {
      uri: `${req.baseUrl}/storage/object/${req.params.collectionName}`.toLowerCase(),
    };
  }

  const timeout = req.query.timeout;
  if (timeout && timeout !== '-1') {
    console.log(`Set timeout to ${timeout}`);
    res.setTimeout(parseInt(timeout, 10) * 1000, () => {
      console.log('Request has timed out');
      jsonResult = {
        uri: `${req.baseUrl}${req.url}`,
        result: 'request has timed out',
        status: 408,
      };
      res.status(408).send(jsonResult);
    });
  }

  console.log(`Watching ${collectionName}`);

  const count = req.query.count;
  let modified = 0;

  const modelEventEmitter = Model.watch();

  modelEventEmitter.on('change', (data) => {
    if (jsonResult.status === 408) {
      return;
    }
    if (data.operationType == 'replace' || data.operationType == 'update' || data.operationType == 'insert') {
      // eslint-disable-next-line no-underscore-dangle
      Model.findById(data.documentKey._id, (error, document) => {
        modified += 1;
        jsonResult.operationType = data.operationType;
        jsonResult.ns = data.ns;
        jsonResult.status = 200;
        if (data.updateDescription) {
          console.log(data.updateDescription);
          jsonResult.updateDescription = data.updateDescription;
          jsonResult.document = document;
        }
        if (data.fullDocument) {
          jsonResult.document = data.fullDocument;
        }

        try {
          if (!count) {
            console.log(`No longer watching ${collectionName}`);
            modelEventEmitter.close();
            res.status(200).send(jsonResult);
          } else if (count && count == modified) {
            console.log(`No longer watching ${collectionName}`);
            modified = 0;
            modelEventEmitter.close();
            res.status(200).send({
              uri: jsonResult.uri,
              result: 'operations completed',
            });
          }
        } catch (err) {
          console.log('Headers already sent to the client');
        }
      });
    }
  });
}

module.exports = {
  notifyDocument,
  notifyCollection,
};
