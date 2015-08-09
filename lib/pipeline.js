'use strict';

exports.Base = require('./pipeline/base');

exports.Pipeline = require('./pipeline/pipeline');

var formats = exports.Pipeline.formats;
formats.json = require('./pipeline/pipeline/format/json');
formats.printable = require('./pipeline/pipeline/format/printable');

exports.CFGBuilder = require('./pipeline/cfg');
exports.Dominance = require('./pipeline/dominance');

exports.Register = require('./pipeline/register');

var formats = exports.Register.formats;
formats.json = require('./pipeline/register/format/json');

// A public API
exports.create = require('./pipeline/api').create;
