'use strict';

var assert = require('assert');
var util = require('util');

var pipeline = require('../../pipeline');

function Block(opcode) {
  pipeline.Pipeline.Node.call(this, opcode || 'region');
  this.blockIndex = 0;

  this.predecessors = [];
  this.successors = [];
  this.nodes = [];
  this.lastControl = this;
}
util.inherits(Block, pipeline.Pipeline.Node);
module.exports = Block;

Block.create = function create(opcode) {
  return new Block(opcode);
};

Block.prototype.prepend = function prepend(node) {
  this.nodes.unshift(node);
  node.block = this;
};

Block.prototype.insert = function insert(index, node) {
  this.nodes.splice(index, 0, node);
  node.block = this;
};

Block.prototype.add = function add(node) {
  this.nodes.push(node);
  node.block = this;
};

Block.prototype.addControl = function addControl(node) {
  node.setControl(this.lastControl);
  this.lastControl = node;
  this.add(node);
};

Block.prototype.remove = function remove(index) {
  var node = this.nodes[index];
  this.nodes.splice(index, 1);

  node.block = null;
};

Block.prototype.jump = function jump(other) {
  this.successors.push(other);
  other.predecessors.push(this);
};

Block.prototype.getLastControl = function getLastControl() {
  return this.lastControl;
};

Block.prototype.setLastControl = function setLastControl(node) {
  this.lastControl = node;
};

Block.prototype.computeLastControl = function computeLastControl() {
  if (this.nodes.length === 0)
    return;

  this.lastControl = this.nodes[this.nodes.length - 1];
  assert(this.lastControl.isControl(), 'Last block node is not control');
};

Block.prototype.link = function link() {
  if (this.control.length !== 0)
    return;

  if (this.predecessors.length === 0)
    return;

  if (this.predecessors.length === 1) {
    var a = this.predecessors[0];
    this.setControl(a.getLastControl());
    return;
  }

  var a = this.predecessors[0];
  var b = this.predecessors[1];
  this.setControl(a.getLastControl(), b.getLastControl());
};

Block.prototype._shortId = function _shortId() {
  return 'b' + this.blockIndex + '[' + this.opcode + ']';
};

Block.prototype.verify = function verify() {
  pipeline.Pipeline.Node.prototype.verify.call(this);

  var id = this._shortId();
  for (var i = 0; i < this.successors.length; i++) {
    var succ = this.successors[i];
    assert(succ.predecessors.indexOf(this) !== -1,
           'Not found ' + id + ' in ' + succ._shortId() + ' predecessors');
  }

  for (var i = 0; i < this.predecessors.length; i++) {
    var pred = this.predecessors[i];
    assert(pred.successors.indexOf(this) !== -1,
           'Not found ' + id + ' in ' + pred._shortId() + ' successors');
  }

  assert(!(this.successors.length === 2 && this.predecessors.length === 2),
         'X intersection at ' + id);
};
