'use strict';

exports.Pipeline = require('./pipeline/base');
exports.CFGBuilder = require('./pipeline/cfg');
exports.Dominance = require('./pipeline/dominance');

// A public API
exports.create = require('./pipeline/api').create;
