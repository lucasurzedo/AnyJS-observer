'use strict';

const express = require('express');
const router = express.Router();
const { notifyExecution } = require('../controllers');

router.get('/execute/task/:taskName/execution/:executionName/notification', notifyExecution);

module.exports = router;
