'use strict';

exports.Pipeline = require('./pipeline/base');
exports.CFGBuilder = require('./pipeline/cfg');
exports.Dominance = require('./pipeline/dominance');

exports.Pipeline.prototype.formats.json = require('./pipeline/format/json');

// A public API
exports.create = require('./pipeline/api').create;
