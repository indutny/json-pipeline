'use strict';

var assert = require('assert');
var util = require('util');

var pipeline = require('../../../pipeline');
var JSONFormat = pipeline.Register.formats.json;

function Printable(sections, pipeline) {
  this.sections = sections;
  this.pipeline = pipeline;

  this.json = new JSONFormat(sections, pipeline);
}
util.inherits(Printable, JSONFormat);
module.exports = Printable;
util.inherits(Printable, JSONFormat);

Printable.prototype.parse = function parse(data) {
  throw new Error('Not implemented yet');
};

Printable.prototype.render = function render() {
  var out = 'register {\n';

  out += this.renderSpillType();

  for (var i = 0; i < this.pipeline.instructions.length; i++)
    out += '  ' + this.renderInstruction(this.pipeline.instructions[i]) + '\n';

  out += '}';

  return out;
};

Printable.prototype.renderSpillType = function renderSpillType() {
  var out = '';
  for (var i = 0; i < this.pipeline.spillType.length; i++) {
    var type = this.pipeline.spillType[i];
    out += '  # [' + type.from + ', ' + type.to + ') as ' + type.type + '\n';
  }
  return out;
};

Printable.prototype.renderInstruction = function renderInstruction(instr) {
  var out = '';

  if (instr.output === null)
    out += instr.opcode;
  else
    out += this.renderOperand(instr.output) + ' = ' + instr.opcode;

  var list = [];
  for (var i = 0; i < instr.literals.length; i++)
    list.push(JSON.stringify(instr.literals[i]));

  for (var i = 0; i < instr.links.length; i++) {
    var delta = instr.links[i].index - instr.index;
    var tmp = '&';
    if (delta >= 0)
      tmp += '+' + delta;
    else
      tmp += delta;

    list.push(tmp);
  }

  for (var i = 0; i < instr.inputs.length; i++)
    list.push(this.renderOperand(instr.inputs[i]));

  if (list.length === 0)
    return out;

  return out + ' ' + list.join(', ');
};

Printable.prototype.renderOperand = function renderOperand(operand) {
  if (operand.kind === 'register')
    return '%' + operand.value;

  return '[' + operand.value + ']';
};
