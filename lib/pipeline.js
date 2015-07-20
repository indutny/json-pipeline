'use strict';

exports.Pipeline = require('./pipeline/base');
exports.Pipeline.formats.json = require('./pipeline/format/json');

exports.CFGBuilder = require('./pipeline/cfg');

// A public API
exports.create = require('./pipeline/api').create;
