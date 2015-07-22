'use strict';

var assert = require('assert');
var util = require('util');

var pipeline = require('../../pipeline');
var CFGBuilder = pipeline.CFGBuilder;

function Dominance() {
  CFGBuilder.call(this);
}
module.exports = Dominance;
util.inherits(Dominance, CFGBuilder);

Dominance.Block = require('./block');
Dominance.prototype.Block = Dominance.Block;

Dominance.create = function create() {
  return new Dominance();
};

Dominance.prototype.renderJSON = function renderJSON(sections) {
  var out = CFGBuilder.prototype.renderJSON.call(this, sections);
  if (!sections.dominance)
    return out;


  return out;
};
