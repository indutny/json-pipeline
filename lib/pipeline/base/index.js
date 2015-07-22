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

Pipeline.prototype.formats = {};

Pipeline.prototype._selectFormat = function _selectFormat(format) {
  if (!format || format === 'json')
    return this.formats.json;
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

  return new Parser(sections, this).parse(data);
};

Pipeline.prototype.render = function render(sections, format) {
  if (typeof sections === 'string') {
    // .render(format)
    format = sections;
    sections = {};
  }

  var Renderer;
  if (!format || format === 'json')
    Renderer = this.formats.json;
  else
    throw new Error('Unknown format: ' + format);

  return new Renderer(sections, this).render();
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

  node.index = this.nodes.length;
  this.nodes.push(node);

  return node;
};
