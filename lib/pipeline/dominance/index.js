'use strict';

var assert = require('assert');
var util = require('util');
var BitField = require('bitfield.js');

var pipeline = require('../../pipeline');
var CFGBuilder = pipeline.CFGBuilder;

function Dominance() {
  CFGBuilder.call(this);
}
module.exports = Dominance;
util.inherits(Dominance, CFGBuilder);

Dominance.Block = require('./block');
Dominance.prototype.Block = Dominance.Block;

Dominance.create = function create() {
  return new Dominance();
};

Dominance.prototype.enumerate = function enumerate() {
  // Simple DFS with range tracking
  var queue = [ this.blocks[0] ];
  var visited = new BitField(this.blocks.length);

  var index = 0;
  while (queue.length !== 0) {
    var block = queue[queue.length - 1];
    if (!visited.set(block.blockIndex))
      continue;

    for (var i = block.children.length - 1; i >= 0; i--)
      queue.push(block.children[i]);

    block.dominanceStart = index++;
    if (block.children.length !== 0)
      continue;

    block.dominanceEnd = block.dominanceStart;

    // Pop to the top
    var last = queue.pop();
    while (queue.length !== 0) {
      // Process only right-most children
      if (last.parent.children[last.parent.children.length - 1] !== last)
        break;

      // Update parent's range
      last = queue.pop();
      last.dominanceEnd = block.dominanceStart;
    }
  }
};
