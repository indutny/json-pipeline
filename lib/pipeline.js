'use strict';

exports.Pipeline = require('./pipeline/base');
exports.CFGBuilder = require('./pipeline/cfg');

// A public API
exports.create = require('./pipeline/api').create;
