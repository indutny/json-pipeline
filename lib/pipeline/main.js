'use strict';
var pipeline = require('../pipeline');

function Pipeline() {
  this.nodes = [];

  // Side tables
  this.cfg = [];
  this.dominance = [];
}
module.exports = Pipeline;

Pipeline.create = function create() {
  return new Pipeline();
};

Pipeline.formats = {};

Pipeline.prototype.parse = function parse(data, formatName) {
  var format = Pipeline.formats[formatName];

  format.parse(data, this);

  return format;
};

Pipeline.prototype.add = function add(opcode, inputs) {
  var node = pipeline.node.create(opcode);
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

  this.nodes.push(node);

  return node;
};
