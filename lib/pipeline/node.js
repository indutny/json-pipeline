'use strict';

function Node(opcode) {
  // Serialization field
  this._index = null;

  this.control = null;
  this.opcode = opcode;
  this.inputs = [];
  this.literals = [];
  this.uses = [];
}
module.exports = Node;

Node.create = function create(opcode) {
  return new Node(opcode);
};

Node.prototype._use = function _use(other, index) {
  this.uses.push(other, index);
};

Node.prototype.addInput = function addInput(other) {
  other._use(this, this.inputs.length);
  this.inputs.push(other);
  return this;
};

Node.prototype.addLiteral = function addLiteral(literal) {
  this.literals.push(literal);
  return this;
};

Node.prototype.setControl = function setControl(other) {
  this.control = other;
  other._use(this, 0);
};
