'use strict';

var assert = require('assert');
var util = require('util');

var pipeline = require('../../pipeline');
var Base = pipeline.Base;

function Pipeline() {
  Base.call(this);

  this.nodes = [];
}
util.inherits(Pipeline, Base);
module.exports = Pipeline;

Pipeline.Node = require('./node');
Pipeline.prototype.Node = Pipeline.Node;

Pipeline.create = function create() {
  return new Pipeline();
};

Pipeline.formats = {};
Pipeline.prototype.formats = Pipeline.formats;

Pipeline.prototype.create = function create(opcode, inputs) {
  var node = this.Node.create(opcode);
  if (inputs) {
    // Single input
    if (!Array.isArray(inputs)) {
      node.addInput(inputs);

    // Multiple inputs
    } else {
      for (var i = 0; i < inputs.length; i++)
        node.addInput(inputs[i]);
    }
  }

  node.index = this.nodes.length;
  this.nodes.push(node);

  return node;
};

// Mostly compatibility
Pipeline.prototype.add = function add(opcode, inputs) {
  return this.create(opcode, inputs);
};

Pipeline.prototype.remove = function remove(node) {
  assert.equal(node.uses.length, 0, 'Can\'t remove node with uses.');

  // Clean-up use-def chains
  for (var i = 0; i < node.inputs.length; i++) {
    var input = node.inputs[i];
    input._unuse(node, i, false);
  }

  node.removeControl();

  var last = this.nodes.pop();

  // Lucky one - it was already the last node
  if (last === node)
    return;

  // Let the last node take the place of `node`
  this.nodes[node.index] = last;
  last.index = node.index;
  node.index = -1;
};
