'use strict';

function SpillTypeRange(type, from, to) {
  this.type = type;
  this.from = from;
  this.to = to;
}
module.exports = SpillTypeRange;

SpillTypeRange.sort = function sort(a, b) {
  return a.from - b.from;
};
