'use strict';

var util = require('util');

var pipeline = require('../../pipeline');
var Pipeline = pipeline.Pipeline;

function CFGBuilder() {
  Pipeline.call(this);

  this.blocks = [];
  this.currentBlock = null;
}
util.inherits(CFGBuilder, Pipeline);
module.exports = CFGBuilder;

CFGBuilder.Block = require('./block');

CFGBuilder.create = function create() {
  return new CFGBuilder();
};

CFGBuilder.prototype.parse = function parse(json, sections) {
  if (!sections)
    sections = {};

  if (!sections.cfg)
    return Pipeline.prototype.parse.call(json, sections);

  var nodes = new Array(json.nodes.length);

  // Create all blocks
  var blocks = json.cfg.blocks;
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    nodes[block.node] = this.block(i === 0 ? 'start' : null);

    // Habitate them with nodes
    for (var j = 0; j < block.nodes.length; j++) {
      var index = block.nodes[j];
      var node = json.nodes[index];
      nodes[index] = this.add(node.opcode);
    }
  }

  // Link nodes together
  for (var i = 0; i < nodes.length; i++)
    this._parseNode(json, i, nodes);

  // Link blocks together
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];

    for (var j = 0; j < block.successors.length; j++)
      nodes[block.node].jump(nodes[block.successors[j]]);
  }

  return this;
};

CFGBuilder.prototype.render = function render(sections) {
  if (!sections)
    sections = {};

  var json = Pipeline.prototype.render.call(this, sections);
  if (!sections.cfg)
    return json;

  var out = {
    blocks: new Array(this.blocks.length)
  };
  json.cfg = out;

  for (var i = 0; i < this.blocks.length; i++) {
    var block = this.blocks[i];
    var current = {
      node: block._index,
      successors: new Array(block.successors.length),
      nodes: new Array(block.nodes.length)
    };

    for (var j = 0; j < block.successors.length; j++)
      current.successors[j] = block.successors[j]._index;

    for (var j = 0; j < block.nodes.length; j++)
      current.nodes[j] = block.nodes[j]._index;

    out.blocks[i] = current;
  }

  return json;
};

CFGBuilder.prototype.block = function block(opcode) {
  var res = CFGBuilder.Block.create(opcode);
  this.nodes.push(res);
  this.blocks.push(res);
  this.setCurrentBlock(res);
  return res;
};

CFGBuilder.prototype.jumpFrom = function jumpFrom(other) {
  var res = this.block();
  other.jump(res);
  res.setControl(other.getLastControl());
  return res;
};

CFGBuilder.prototype.merge = function merge(left, right) {
  var res = this.block();
  left.jump(res);
  right.jump(res);

  res.setControl(left.getLastControl(), right.getLastControl());
  return res;
};

CFGBuilder.prototype.setCurrentBlock = function setCurrentBlock(block) {
  this.currentBlock = block;
};

CFGBuilder.prototype.add = function add() {
  var node = Pipeline.prototype.add.apply(this, arguments);
  this.currentBlock.add(node);
  return node;
};

CFGBuilder.prototype.addControl = function addControl() {
  var node = this.add.apply(this, arguments);
  node.setControl(this.currentBlock);
  return node;
};
