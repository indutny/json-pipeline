'use strict';

function Pipeline() {
  this.nodes = [];

  // Side tables
  this.cfg = [];
  this.dominance = [];
}
module.exports = Pipeline;

Pipeline.Node = require('./node');

Pipeline.create = function create() {
  return new Pipeline();
};

Pipeline.prototype.parse = function parse(json, sections) {
  if (!sections)
    sections = {};

  var nodes = new Array(json.nodes.length);

  // Create all nodes
  for (var i = 0; i < json.nodes.length; i++) {
    var node = json.nodes[i];
    nodes[i] = this.add(node.opcode);
  }

  // Link them together
  for (var i = 0; i < nodes.length; i++)
    this._parseNode(json, i, nodes);

  return this;
};

Pipeline.prototype._parseNode = function _parseNode(json, index, nodes) {
  var node = json.nodes[index];
  var current = nodes[index];

  for (var i = 0; i < node.literals.length; i++)
    current.addLiteral(node.literals[i]);

  for (var i = 0; i < node.inputs.length; i++)
    current.addInput(nodes[node.inputs[i]]);

  if (node.control.length === 2)
    current.setControl(nodes[node.control[0]], nodes[node.control[1]]);
  else if (node.control.length === 1)
    current.setControl(nodes[node.control[0]]);
};

Pipeline.prototype.render = function render(sections) {
  // .render('format')
  if (!sections)
    sections = {};

  var output = {
    nodes: new Array(this.nodes.length)
  };

  // Create index
  for (var i = 0; i < this.nodes.length; i++) {
    var node = this.nodes[i];
    node._index = i;

    output.nodes[i] = {
      opcode: node.opcode,
      control: new Array(node.control.length),
      literals: new Array(node.literals.length),
      inputs: new Array(node.inputs.length)
    };
  }

  // Fill it
  for (var i = 0; i < this.nodes.length; i++) {
    var node = this.nodes[i];
    var current = output.nodes[i];

    for (var j = 0; j < node.control.length; j++)
      current.control[j] = node.control[j]._index;

    for (var j = 0; j < node.literals.length; j++)
      current.literals[j] = node.literals[j];

    for (var j = 0; j < node.inputs.length; j++)
      current.inputs[j] = node.inputs[j]._index;
  }

  return output;
};

Pipeline.prototype.add = function add(opcode, inputs) {
  var node = Pipeline.Node.create(opcode);
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
