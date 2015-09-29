'use strict';

var assert = require('assert');

function Node(opcode) {
  this.index = null;
  this.control = [];
  this.opcode = opcode;
  this.inputs = [];
  this.literals = [];
  this.uses = [];
  this.controlUses = [];

  // Only for tooling, filled by `printable` format
  this.loc = null;

  // Only for storing user-data
  this.data = null;
}
module.exports = Node;

Node.create = function create(opcode) {
  return new Node(opcode);
};

Node.prototype._use = function _use(other, index, control) {
  if (control)
    this.controlUses.push(other, index);
  else
    this.uses.push(other, index);
};

Node.prototype._unuse = function _unuse(node, index, control) {
  var uses = control ? this.controlUses : this.uses;

  for (var i = uses.length - 2; i >= 0; i -= 2)
    if (uses[i] === node && uses[i + 1] === index)
      break;

  // No such use found
  if (i < 0)
    return;

  var lastIndex = uses.pop();
  var lastNode = uses.pop();

  // Removed last use
  if (i === uses.length)
    return;

  // Replace with the last one
  uses[i] = lastNode;
  uses[i + 1] = lastIndex;
};

Node.prototype.clearInputs = function clearInputs() {
  for (var i = 0; i < this.inputs.length; i++) {
    var input = this.inputs[i];
    input._unuse(this, i, false);
  }
  this.inputs.length = 0;
};

Node.prototype.removeControl = function removeControl() {
  if (this.controlUses.length === 0) {
    // No children - just cut link to the parent
    this.cutControl();
    return;
  }

  assert(this.controlUses.length === 2, 'Can\'t remove branch node');

  // Replace control uses in parent with the control child
  var child = this.controlUses[0];
  var index = this.controlUses[1];
  for (var i = 0; i < this.control.length; i++) {
    var parent = this.control[i];

    child.control[index] = parent;
    for (var j = 0; j < parent.controlUses.length; j += 2) {
      var parentUse = parent.controlUses[j];
      if (parentUse !== this)
        continue;

      parent.controlUses[j] = child;
      parent.controlUses[j + 1] = index;
    }
  }
  this.control.length = 0;
  this.controlUses.length = 0;
};

Node.prototype.cutControl = function cutControl() {
  for (var i = 0; i < this.control.length; i++) {
    var parent = this.control[i];
    parent._unuse(this, i, true);
  }
  this.control.length = 0;
};

Node.prototype.remove = function remove() {
  this.clearInputs();
  this.removeControl();
};

Node.prototype.cut = function cut() {
  this.clearInputs();
  this.cutControl();
};

Node.prototype.addInput = function addInput(other) {
  other._use(this, this.inputs.length, false);
  this.inputs.push(other);
  return this;
};

Node.prototype.replaceInput = function replaceInput(index, other) {
  var old = this.inputs[index];
  old._unuse(this, index);
  this.inputs[index] = other;
  other._use(this, index, false);
};

Node.prototype.addLiteral = function addLiteral(literal) {
  this.literals.push(literal);
  return this;
};

Node.prototype.setControl = function setControl(left, right) {
  if (right) {
    this.control.length = 0;
    this.control.push(left, right);
    left._use(this, 0, true);
    right._use(this, 1, true);
  } else {
    this.control.length = 0;
    this.control.push(left);
    left._use(this, 0, true);
  }
  return this;
};

Node.prototype.splitControl = function splitControl(parent) {
  for (var i = 0; i < parent.controlUses.length; i += 2) {
    var use = parent.controlUses[i];
    var index = parent.controlUses[i + 1];

    use.control[index] = this;
    this._use(use, index, true);
  }
  parent.controlUses.length = 0;

  this.control.length = 0;
  this.control.push(parent);
  parent._use(this, 0, true);
  return this;
};

Node.prototype.isControl = function isControl() {
  return this.opcode === 'start' || this.control.length !== 0;
};

Node.prototype.replace = function replace(other) {
  for (var i = 0; i < this.uses.length; i += 2) {
    var node = this.uses[i];
    var index = this.uses[i + 1];

    node.inputs[index] = other;
    other._use(node, index, false);
  }
  this.uses.length = 0;

  // Re-route control chain
  for (var i = 0; i < this.control.length; i++) {
    var control = this.control[i];
    for (var j = 0; j < control.controlUses.length; j++) {
      var use = control.controlUses[j];
      if (use !== this)
        continue;

      control.controlUses[j] = other;
      control.controlUses[j + 1] = other.control.length;
    }
    other.control.push(control);
  }
  this.control.length = 0;

  for (var i = 0; i < this.controlUses.length; i += 2) {
    var node = this.controlUses[i];
    var index = this.controlUses[i + 1];

    node.control[index] = other;
    other._use(node, index, true);
  }
  this.controlUses.length = 0;
};

Node.prototype._shortId = function _shortId() {
  return 'i' + this.index + '[' + this.opcode + ']';
};

Node.prototype.verify = function verify() {
  var id = this._shortId();

  // Verify that every input has use at this node
  for (var i = 0; i < this.inputs.length; i++) {
    var input = this.inputs[i];

    var found = false;
    for (var j = 0; !found && j < input.uses.length; j += 2) {
      var use = input.uses[j];
      var useIndex = input.uses[j + 1];
      if (use === this && useIndex === i)
        found = true;
    }

    assert(found,
           id + '->' + input._shortId() +
               ': input without use in other node');
  }

  // Verify that every control has use at this node
  assert(this.control.length <= 2, id + ': too much control inputs');
  for (var i = 0; i < this.control.length; i++) {
    var control = this.control[i];

    var found = false;
    for (var j = 0; !found && j < control.controlUses.length; j += 2) {
      var use = control.controlUses[j];
      var useIndex = control.controlUses[j + 1];
      if (use === this && useIndex === i)
        found = true;
    }

    assert(found,
           id + '<-' + control._shortId() +
               ': control without use in other node');
  }

  // Verify that uses have their inputs
  for (var i = 0; i < this.uses.length; i += 2) {
    var use = this.uses[i];
    var useIndex = this.uses[i + 1];

    assert.equal(use.inputs[useIndex],
                 this,
                 'Use for ' + id + ' not found at ' + use._shortId());
  }

  for (var i = 0; i < this.controlUses.length; i += 2) {
    var use = this.controlUses[i];
    var useIndex = this.controlUses[i + 1];

    assert.equal(use.control[useIndex],
                 this,
                 'Use for ' + id + ' not found at ' + use._shortId());
  }
};
