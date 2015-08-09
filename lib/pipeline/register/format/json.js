'use strict';

function JSONFormat(sections, pipeline) {
  this.sections = sections;
  this.pipeline = pipeline;
}
module.exports = JSONFormat;

JSONFormat.prototype.parse = function parse(json) {
  var pipeline = this.pipeline;
  var instructions = new Array(json.instructions.length);

  for (var i = 0; i < instructions.length; i++) {
    var instr = json.instructions[i];
    var current = pipeline.add(instr.opcode);

    instructions[i] = current;

    if (instr.output !== null)
      current.setOutput(this.parseOperand(instr.output, json));
    for (var j = 0; j < instr.inputs.length; j++)
      current.addInput(this.parseOperand(instr.inputs[j], json));
    for (var j = 0; j < instr.literals.length; j++)
      current.addLiteral(instr.literals[j]);
  }

  // Process links
  for (var i = 0; i < instructions.length; i++) {
    var instr = json.instructions[i];
    var current = instructions[i];

    for (var j = 0; j < instr.links.length; j++)
      current.link(instructions[instr.links[j]]);
  }
};

JSONFormat.prototype.parseOperand = function parseOperand(operand, json) {
  if (operand >= 0)
    return this.pipeline.reg(json.registers[operand]);

  return this.pipeline.spill(-1 - operand);
};

JSONFormat.prototype.render = function render() {
  var pipeline = this.pipeline;

  var registerMap = {};
  var registerList = [];

  var output = {
    registers: registerList,
    spills: pipeline.spills,
    instructions: new Array(pipeline.instructions.length)
  };

  for (var i = 0; i < pipeline.instructions.length; i++) {
    var instr = pipeline.instructions[i];

    var current = {
      opcode: instr.opcode,
      literals: instr.literals.slice(),
      output: null,
      inputs: new Array(instr.inputs.length),
      links: new Array(instr.links.length)
    };
    output.instructions[i] = current;

    if (instr.output !== null) {
      current.output = this.renderOperand(registerMap,
                                          registerList,
                                          instr.output);
    }

    for (var j = 0; j < instr.inputs.length; j++) {
      var input = instr.inputs[j];

      current.inputs[j] = this.renderOperand(registerMap, registerList, input);
    }

    for (var j = 0; j < instr.links.length; j++)
      current.links[j] = instr.links[j].index;
  }

  return output;
};

JSONFormat.prototype.renderOperand = function renderOperand(map,
                                                            list,
                                                            operand) {
  if (operand.isSpill())
    return -1 - operand.value;

  if (map[operand.value] !== undefined)
    return map[operand.value];

  var res = list.length;
  map[operand.value] = res;
  list.push(operand.value);

  return res;
};
