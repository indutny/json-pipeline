var assert = require('assert');

var pipeline = require('../');
var Printable = pipeline.Pipeline.formats.printable;

var fixtures = require('./fixtures');

describe('Printable format', function() {
  var p;
  var printable;
  beforeEach(function() {
    p = pipeline.create('dominance');
    printable = new Printable({}, p);
  });

  it('should have proper line regexp', function() {
    var re = Printable.re;
    var match;

    match = 'pipeline {'.match(re);
    assert(match && match[1]);

    match = 'b123 {'.match(re);
    assert(match && match[2] && !match[4]);
    assert.equal(match[2], '123');

    match = 'b123 => b456, b7, b8'.match(re);
    assert(match && match[2] && match[4]);
    assert.equal(match[2], '123');
    assert.equal(match[4], '=>');
    assert.equal(match[5], 'b456, b7, b8');

    match = 'i23 = opcode 1, "hel lo", i1, i2'.match(re);
    assert(match && match[6]);
    assert.equal(match[6], '23');
    assert.equal(match[7], 'opcode');
    assert.equal(match[8], '1, "hel lo", i1, i2');

    match = 'i23 = opcode 1'.match(re);
    assert(match && match[6]);
    assert.equal(match[6], '23');
    assert.equal(match[7], 'opcode');
    assert.equal(match[8], '1');

    match = 'i23 = opcode  '.match(re);
    assert(match && match[6]);
    assert.equal(match[6], '23');
    assert.equal(match[7], 'opcode');
    assert.equal(match[8], undefined);

    match = '}'.match(re);
    assert(match && match[9]);

    match = '} # comment'.match(re);
    assert(match && match[9]);
    assert.equal(match[10], 'comment');
  });

  it('should parse plain input', function() {
    var input = fixtures.fn2str(function() {/*
      pipeline {
        i0 = start
        i1 = literal 1
        i2 = literal 2
        i3 = add i1, i2
        i4 = if ^i0
      }
    */});

    assert.deepEqual(printable.toJSON(input), {
      cfg: {
        blocks: []
      },
      dominance: {
        blocks: []
      },
      nodes: [
        { opcode: 'start', control: [], literals: [], inputs: [] },
        { opcode: 'literal', control: [], literals: [ 1 ], inputs: [] },
        { opcode: 'literal', control: [], literals: [ 2 ], inputs: [] },
        { opcode: 'add', control: [], literals: [], inputs: [ 1, 2 ] },
        { opcode: 'if', control: [ 0 ], literals: [], inputs: [] }
      ]
    });
  });

  it('should parse CFG input', function() {
    var input = fixtures.fn2str(function() {/*
      pipeline {
        b0 {
          i0 = literal 1
          i1 = literal 2
          i2 = add i0, i1
          i3 = if ^b0
        }
        b0 -> b1
        b0 => b1
        b0 ~> b1

        b1 {
          i4 = ret i2
        }
      }
    */});

    assert.deepEqual(printable.toJSON(input), {
      cfg: {
        blocks: [{
          node: 0,
          successors: [ 1 ],
          nodes: [ 2, 3, 4, 5 ]
        }, {
          node: 1,
          successors: [],
          nodes: [ 6 ]
        }]
      },
      dominance: {
        blocks: [{
          node: 0,
          parent: null,
          frontier: [ 1 ]
        }, {
          node: 1,
          parent: 0,
          frontier: []
        }]
      },
      nodes: [
        { opcode: 'start', control: [], literals: [], inputs: [] },
        { opcode: 'region', control: [], literals: [], inputs: [] },
        { opcode: 'literal', control: [], literals: [ 1 ], inputs: [] },
        { opcode: 'literal', control: [], literals: [ 2 ], inputs: [] },
        { opcode: 'add', control: [], literals: [], inputs: [ 2, 3 ] },
        { opcode: 'if', control: [ 0 ], literals: [], inputs: [] },
        { opcode: 'ret', control: [], literals: [], inputs: [ 4 ] }
      ]
    });
  });
});
