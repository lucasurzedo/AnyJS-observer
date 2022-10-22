const express = require('express');

const router = express.Router();
const { notifyDocument, notifyCollection } = require('../controllers');

router.get('/observer/:service/:collectionName/:documentName', notifyDocument);
router.get('/observer/:service/:collectionName', notifyCollection);

module.exports = router;
