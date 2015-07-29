'use strict';

var assert = require('assert');
var util = require('util');

var pipeline = require('../../pipeline');
var CFGBuilder = pipeline.CFGBuilder;

function Block(opcode) {
  CFGBuilder.Block.call(this, opcode);

  // Fast checks for dominance
  this.dominanceStart = null;
  this.dominanceEnd = null;
  this.dominanceDepth = null;

  this.parent = null;
  this.children = [];
  this.frontier = [];
}
module.exports = Block;
util.inherits(Block, CFGBuilder.Block);

Block.create = function create(opcode) {
  return new Block(opcode);
};

Block.prototype.addChild = function addChild(other) {
  assert(other.parent === null, 'Block is already in Dominator tree');
  this.children.push(other);
  other.parent = this;
};

Block.prototype.addFrontier = function addFrontier(other) {
  this.frontier.push(other);
};

Block.prototype.dominates = function dominates(other) {
  var index = other.dominanceStart;
  var start = this.dominanceStart;
  var end = this.dominanceEnd;

  return start <= index && index <= end;
};
