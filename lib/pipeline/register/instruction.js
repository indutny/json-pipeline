'use strict';

function Instruction(opcode) {
  this.index = null;
  this.opcode = opcode;
  this.output = null;
  this.inputs = [];
  this.literals = [];

  this.links = [];
  this.linkUses = [];
}
module.exports = Instruction;

Instruction.create = function create(opcode) {
  return new Instruction(opcode);
};

Instruction.prototype.setOutput = function setOutput(output) {
  this.output = output;
  return this;
};

Instruction.prototype.addInput = function addInput(input) {
  this.inputs.push(input);
  return this;
};

Instruction.prototype.addLiteral = function addLiteral(value) {
  this.literals.push(value);
  return this;
};

Instruction.prototype.link = function link(instr) {
  instr.linkUses.push(instr, this.links.length);
  this.links.push(instr);
  return this;
};
