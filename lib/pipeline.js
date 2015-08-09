'use strict';

exports.Base = require('./pipeline/base');
exports.Pipeline = require('./pipeline/pipeline');
exports.CFGBuilder = require('./pipeline/cfg');
exports.Dominance = require('./pipeline/dominance');

var formats = exports.Pipeline.formats;
formats.json = require('./pipeline/format/json');
formats.printable = require('./pipeline/format/printable');

// A public API
exports.create = require('./pipeline/api').create;
