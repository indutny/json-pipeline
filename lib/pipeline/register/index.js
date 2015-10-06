'use strict';

var util = require('util');

var pipeline = require('../../pipeline');
var Base = pipeline.Base;

function Register() {
  Base.call(this);

  this.instructions = [];
  this.spills = 0;
  this.spillType = [];
  this._registers = {};
}
util.inherits(Register, Base);
module.exports = Register;

Register.Instruction = require('./instruction');
Register.Operand = require('./operand');
Register.SpillTypeRange = require('./spill-type-range');

Register.create = function create() {
  return new Register();
};

Register.formats = {};
Register.prototype.formats = Register.formats;

Register.prototype.getUsedRegisters = function getUsedRegisters() {
  return Object.keys(this._registers);
};

Register.prototype.reg = function reg(name) {
  this._registers[name] = true;
  return new Register.Operand('register', name);
};

Register.prototype.spill = function spill(index) {
  this.spills = Math.max(this.spills, index + 1);
  return new Register.Operand('spill', index);
};

Register.prototype.setSpillType = function setSpillType(type, from, to) {
  this.spillType.push(new Register.SpillTypeRange(type, from, to));
};

Register.prototype.create = function create(opcode, output, inputs) {
  var instr = Register.Instruction.create(opcode);

  if (output)
    instr.setOutput(output);

  if (inputs) {
    // Single input
    if (!Array.isArray(inputs)) {
      instr.addInput(inputs);

    // Multiple inputs
    } else {
      for (var i = 0; i < inputs.length; i++)
        instr.addInput(inputs[i]);
    }
  }

  return instr;
};

Register.prototype.add = function add(opcode, output, inputs) {
  var instr = this.create(opcode, output, inputs);

  return this.append(instr);
};

Register.prototype.append = function append(instr) {
  instr.index = this.instructions.length;
  this.instructions.push(instr);

  return instr;
};
