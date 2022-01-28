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
      res.send(jsonResult);
    });
  }

  console.log(`Watching ${collectionName}`);

  const pipeline = [{ $match: { 'ns.coll': collectionName } }];
  Model.watch(pipeline).on('change', (data) => {
    console.log(data);
    if (jsonResult.status === 408) {
      return;
    }
    // eslint-disable-next-line no-underscore-dangle
    Model.findById(data.documentKey._id, (error, document) => {
      let key;
      if (req.params.service === 'task') {
        key = document.executionName;
      } else if (req.params.service === 'object') {
        key = document.objectName;
      }
      if (jsonResult.status !== 408 && key === req.params.documentName) {
        jsonResult.status = 200;
        console.log(jsonResult);
        res.send(jsonResult);
      }
    });
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
      uri: `${req.baseUrl}/execute/task/${req.params.collectionName}`.toLowerCase(),
    };
  } else if (req.params.service === 'object') {
    collectionName = (`${req.params.collectionName}_object`).toLowerCase();
    Model = mongoose.model(collectionName, ModelObject, collectionName);
    jsonResult = {
      uri: `${req.baseUrl}/store/object/${req.params.collectionName}`.toLowerCase(),
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
      res.send(jsonResult);
    });
  }

  console.log(`Watching ${collectionName}`);

  const pipeline = [{ $match: { 'ns.coll': collectionName } }];
  Model.watch(pipeline).on('change', (data) => {
    if (jsonResult.status === 408) {
      return;
    }
    // eslint-disable-next-line no-underscore-dangle
    Model.findById(data.documentKey._id, (error, document) => {
      jsonResult.operationType = data.operationType;
      jsonResult.ns = data.ns;
      jsonResult.status = 200;
      if (data.updateDescription) {
        jsonResult.updateDescription = data.updateDescription;
        jsonResult.document = document;
      }
      if (data.fullDocument) {
        jsonResult.document = data.fullDocument;
      }

      try {
        res.send(jsonResult);
      } catch (err) {
        console.log('Headers already sent to the client');
      }
    });
  });
}

module.exports = {
  notifyDocument,
  notifyCollection,
};
