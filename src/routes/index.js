const express = require('express');

const router = express.Router();
const { notifyDocument, notifyCollection } = require('../controllers');

router.get('/:service/:collectionName/:documentName/notification', notifyDocument);
router.get('/:service/:collectionName/notification', notifyCollection);

module.exports = router;
