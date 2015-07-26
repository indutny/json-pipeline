'use strict';

var assert = require('assert');
var util = require('util');

var pipeline = require('../../pipeline');

function Node(opcode) {
  pipeline.Pipeline.Node.call(this, opcode);
  this.block = null;
}
util.inherits(Node, pipeline.Pipeline.Node);
module.exports = Node;

Node.create = function create(opcode) {
  return new Node(opcode);
};
