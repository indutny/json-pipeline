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

Pipeline.formats = {};

Pipeline.prototype.parse = function parse(data, sections, formatName) {
  // .parse(data, 'format')
  if (typeof sections === 'string') {
    formatName = sections;
    sections = {};
  }

  var format = Pipeline.formats[formatName];

  format.parse(data, sections, this);

  return this;
};

Pipeline.prototype.render = function render(sections, formatName) {
  // .render('format')
  if (typeof sections === 'string') {
    formatName = sections;
    sections = {};
  }

  var format = Pipeline.formats[formatName];

  return format.render(sections, this);
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
