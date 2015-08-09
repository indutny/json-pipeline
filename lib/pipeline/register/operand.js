'use strict';

function Operand(kind, value) {
  this.kind = kind;
  this.value = value;
}
module.exports = Operand;

Operand.prototype.isEqual = function isEqual(other) {
  return this.kind === other.kind && this.value === other.value;
};

Operand.prototype.isRegister = function isRegister() {
  return this.kind === 'register';
};

Operand.prototype.isSpill = function isSpill() {
  return this.kind === 'spill';
};
