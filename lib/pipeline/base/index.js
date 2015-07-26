'use strict';

function Pipeline() {
  this.nodes = [];

  // Side tables
  this.cfg = [];
  this.dominance = [];
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

Pipeline.prototype.add = function add(opcode, inputs) {
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
