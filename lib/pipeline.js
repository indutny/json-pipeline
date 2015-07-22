'use strict';

exports.Pipeline = require('./pipeline/base');
exports.CFGBuilder = require('./pipeline/cfg');
exports.Dominance = require('./pipeline/dominance');

var formats = exports.Pipeline.formats;
formats.json = require('./pipeline/format/json');
formats.printable = require('./pipeline/format/printable');

// A public API
exports.create = require('./pipeline/api').create;
