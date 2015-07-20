'use strict';

exports.node = require('./pipeline/node');
exports.pipeline = require('./pipeline/main');
exports.create = exports.pipeline.create;

// Input formats
exports.pipeline.formats.json = require('./pipeline/json');
