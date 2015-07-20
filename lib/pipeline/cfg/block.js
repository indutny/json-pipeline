'use strict';

var assert = require('assert');
var util = require('util');

var pipeline = require('../../pipeline');

function Block(opcode) {
  pipeline.Pipeline.Node.call(this, opcode || 'region');

  this.predecessors = [];
  this.successors = [];
  this.nodes = [];
}
util.inherits(Block, pipeline.Pipeline.Node);
module.exports = Block;

Block.create = function create(opcode) {
  return new Block(opcode);
};

Block.prototype.add = function add(node) {
  this.nodes.push(node);
};

Block.prototype.jump = function jump(other) {
  this.successors.push(other);
  other.predecessors.push(this);
};

Block.prototype.getLastControl = function getLastControl() {
  var node = this.nodes[this.nodes.length - 1];
  assert(node.control[0] === this, 'Last node in block not control');
  return node;
};
