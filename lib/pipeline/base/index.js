'use strict';

function Base() {
}
module.exports = Base;

Base.create = function create() {
  return new Base();
};

// To be defined in ancestors
Base.prototype.formats = null;

Base.prototype._selectFormat = function _selectFormat(format) {
  if (!format || format === 'json')
    return this.formats.json;
  else if (format === 'printable')
    return this.formats.printable;
  else if (format === 'graphviz')
    return this.formats.graphviz;
  else
    throw new Error('Unknown format: ' + format);
};

Base.prototype.parse = function parse(data, sections, format) {
  if (typeof sections === 'string') {
    // .parse(data, format)
    format = sections;
    sections = {};
  }

  var Parser = this._selectFormat(format);

  return new Parser(sections || {}, this).parse(data);
};

Base.prototype.render = function render(sections, format) {
  if (typeof sections === 'string') {
    // .render(format)
    format = sections;
    sections = {};
  }

  var Renderer = this._selectFormat(format);

  return new Renderer(sections || {}, this).render();
};
