'use strict';

function Pipeline() {
  this.nodes = [];
}
module.exports = Pipeline;

Pipeline.Node = require('./node');
Pipeline.prototype.Node = Pipeline.Node;

Pipeline.create = function create() {
  return new Pipeline();
};

Pipeline.formats = {};
Pipeline.prototype.formats = Pipeline.formats;

Pipeline.prototype._selectFormat = function _selectFormat(format) {
  if (!format || format === 'json')
    return this.formats.json;
  else if (format === 'printable')
    return this.formats.printable;
  else
    throw new Error('Unknown format: ' + format);
};

Pipeline.prototype.parse = function parse(data, sections, format) {
  if (typeof sections === 'string') {
    // .parse(data, format)
    format = sections;
    sections = {};
  }

  var Parser = this._selectFormat(format);

  return new Parser(sections || {}, this).parse(data);
};

Pipeline.prototype.render = function render(sections, format) {
  if (typeof sections === 'string') {
    // .render(format)
    format = sections;
    sections = {};
  }

  var Renderer = this._selectFormat(format);

  return new Renderer(sections || {}, this).render();
};

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
  // Clean-up use-def chains
  for (var i = 0; i < node.inputs.length; i++) {
    var input = node.inputs[i];
    input._unuse(node, i, false);
  }

  // Clean-up control chains
  for (var i = 0; i < node.control.length; i++) {
    var input = node.control[i];
    input._unuse(node, i, true);
  }

  var last = this.nodes.pop();

  // Lucky one - it was already the last node
  if (last === node)
    return;

  // Let the last node take the place of `node`
  this.nodes[node.index] = last;
  last.index = node.index;
  node.index = -1;
};
