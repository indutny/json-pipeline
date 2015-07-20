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

Dominance.prototype.parse = function parse(data, sections) {
  if (!sections)
    sections = {};

  CFGBuilder.prototype.parse.call(this, data, sections);
  if (!sections.dominance)
    return this;

  assert(sections.cfg, 'Can\'t parse Dominance without CFG');
  var blocks = data.dominance.blocks;
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    var current = this.blocks[i];

    // Blocks are created in the same order
    if (block.parent !== null)
      this.nodes[block.parent].addChild(current);

    for (var j = 0; j < block.frontier.length; j++)
      current.addFrontier(this.nodes[block.frontier[j]]);
  }

  return this;
};

Dominance.prototype.render = function render(sections) {
  if (!sections)
    sections = {};

  var out = CFGBuilder.prototype.render.call(this, sections);
  if (!sections.dominance)
    return out;

  assert(sections.cfg, 'Can\'t render Dominance without CFG');

  var dom = {
    blocks: new Array(this.blocks.length)
  };
  out.dominance = dom;

  for (var i = 0; i < this.blocks.length; i++) {
    var block = this.blocks[i];
    var current = {
      node: block._index,
      parent: block.parent === null ? null : block.parent._index,
      frontier: new Array(block.frontier.length)
    };
    dom.blocks[i] = current;

    for (var j = 0; j < block.frontier.length; j++)
      current.frontier[j] = block.frontier[j]._index;
  }

  return out;
};
