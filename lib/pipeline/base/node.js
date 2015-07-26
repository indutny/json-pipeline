'use strict';

function Node(opcode) {
  this.index = null;
  this.control = [];
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

Node.prototype._unuse = function _unuse(node, index) {
  for (var i = this.uses.length - 2; i >= 0; i -= 2)
    if (this.uses[i] === node && this.uses[i + 1] === index)
      break;

  // No such use found
  if (i < 0)
    return;

  var lastIndex = this.uses.pop();
  var lastNode = this.uses.pop();

  // Removed last use
  if (i === this.uses.length)
    return;

  // Replace with the last one
  this.uses[i] = lastNode;
  this.uses[i + 1] = lastIndex;
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

Node.prototype.setControl = function setControl(left, right) {
  if (right) {
    this.control = [ left, right ];
    left._use(this, 0);
    right._use(this, 1);
  } else {
    this.control = [ left ];
    left._use(this, 0);
  }
  return this;
};

Node.prototype.replace = function replace(other) {
  for (var i = 0; i < this.uses.length; i += 2) {
    var node = this.uses[i];
    var index = this.uses[i + 1];

    node.inputs[index] = other;
  }
  this.uses = [];
};
