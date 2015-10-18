'use strict';

var util = require('util');
var BitField = require('bitfield.js');

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
CFGBuilder.prototype.Block = CFGBuilder.Block;

CFGBuilder.Node = require('./node');
CFGBuilder.prototype.Node = CFGBuilder.Node;

CFGBuilder.create = function create() {
  return new CFGBuilder();
};

CFGBuilder.prototype.createBlock = function createBlock(opcode) {
  var res = this.Block.create(opcode ||
                              (this.blocks.length === 0 ? 'start' : null));
  res.index = this.nodes.length;
  res.blockIndex = this.blocks.length;
  this.nodes.push(res);
  this.blocks.push(res);
  return res;
};

CFGBuilder.prototype.block = function block(opcode) {
  var res = this.createBlock(opcode);
  this.setCurrentBlock(res);
  return res;
};

CFGBuilder.prototype.jumpFrom = function jumpFrom(other) {
  var res = this.block();
  other.jump(res);
  return res;
};

CFGBuilder.prototype.merge = function merge(left, right) {
  var res = this.block();
  left.jump(res);
  right.jump(res);
  return res;
};

CFGBuilder.prototype.setCurrentBlock = function setCurrentBlock(block) {
  this.currentBlock = block;
};

CFGBuilder.prototype.add = function add() {
  var node = this.create.apply(this, arguments);
  this.currentBlock.add(node);
  return node;
};

CFGBuilder.prototype.addControl = function addControl() {
  var node = this.create.apply(this, arguments);
  this.currentBlock.addControl(node);
  return node;
};

CFGBuilder.prototype.reindex = function reindex() {
  var blocks = this._reindexBlocks();

  var nodes = [];
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    block.index = nodes.length;
    block.blockIndex = i;
    nodes.push(block);
  }

  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    for (var j = 0; j < block.nodes.length; j++) {
      var node = block.nodes[j];

      node.index = nodes.length;
      nodes.push(node);
    }
  }

  this.blocks = blocks;
  this.nodes = nodes;
};

CFGBuilder.prototype._reindexBlocks = function _reindexBlocks() {
  var out = [];

  var visited = new BitField(this.blocks.length);
  var queue = [ this.blocks[0] ];
  while (queue.length !== 0) {
    var block = queue.pop();

    var ready = true;
    for (var i = 0; i < block.predecessors.length; i++)
      if (!visited.check(block.predecessors[i].blockIndex))
        ready = false;

    // Back edge
    if (queue.length === 0)
      ready = true;
    if (!ready)
      continue;

    if (visited.set(block.blockIndex))
      out.push(block);

    for (var i = block.successors.length - 1; i >= 0; i--)
      if (!visited.check(block.successors[i].blockIndex))
        queue.push(block.successors[i]);
  }

  return out;
};

CFGBuilder.prototype.link = function link() {
  for (var i = 0; i < this.blocks.length; i++)
    this.blocks[i].link();
};

CFGBuilder.prototype.computeLastControl = function computeLastControl() {
  for (var i = 0; i < this.blocks.length; i++)
    this.blocks[i].computeLastControl();
};

CFGBuilder.prototype.remove = function remove(node) {
  var res = Pipeline.prototype.remove.apply(this, arguments);
  if (node.block === null)
    return;

  var index = node.block.nodes.indexOf(node);
  if (index < 0)
    return;

  node.block.remove(index);
};
