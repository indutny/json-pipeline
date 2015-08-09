'use strict';

var util = require('util');

var pipeline = require('../../pipeline');
var Base = pipeline.Base;

function Register() {
  Base.call(this);

  this.instructions = [];
  this.spills = 0;
}
util.inherits(Register, Base);
module.exports = Register;

Register.Instruction = require('./instruction');
Register.Operand = require('./operand');

Register.create = function create() {
  return new Register();
};

Register.formats = {};
Register.prototype.formats = Register.formats;

Register.prototype.reg = function reg(name) {
  return new Register.Operand('register', name);
};

Register.prototype.spill = function spill(index) {
  this.spills = Math.max(this.spills, index + 1);
  return new Register.Operand('spill', index);
};

Register.prototype.add = function add(opcode, output, inputs) {
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

  instr.index = this.instructions.length;
  this.instructions.push(instr);

  return instr;
};
