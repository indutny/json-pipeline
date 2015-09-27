var assert = require('assert');

var pipeline = require('../');

var fixtures = require('./fixtures');

describe('JSON Dominance', function() {
  var p;
  beforeEach(function() {
    p = pipeline.create('dominance');
  });

  it('should generate CFG with Dominator tree', function() {
    var start = p.block('start');
    var t = p.add('literal').addLiteral(true);
    var branch = p.addControl('if', [ t ]);

    var left = p.jumpFrom(start);
    start.addChild(left);

    var x0 = p.add('literal').addLiteral('ok');
    var leftEnd = p.addControl('jump');

    var right = p.jumpFrom(start);
    start.addChild(right);

    var x1 = p.add('literal').addLiteral('not-ok');
    var rightEnd = p.addControl('jump');

    var merge = p.merge(left, right);
    start.addChild(merge);
    left.addFrontier(merge);
    right.addFrontier(merge);

    var phi = p.addControl('phi', [ x0, x1 ]);
    p.addControl('return', [ phi ]);

    p.link();

    // Dominance export
    assert.deepEqual(p.render({
      cfg: true,
      dominance: true
    }, 'json'), fixtures.json.p2dom);
  });

  it('should parse CFG with Dominator tree', function() {
    p.parse(fixtures.json.p2dom, { cfg: true, dominance: true }, 'json');

    // Tree
    assert(p.blocks[0].parent === null);
    assert(p.blocks[1].parent === p.blocks[0]);
    assert(p.blocks[2].parent === p.blocks[0]);
    assert(p.blocks[3].parent === p.blocks[0]);

    // Frontier
    assert(p.blocks[1].frontier[0] === p.blocks[3]);
    assert(p.blocks[2].frontier[0] === p.blocks[3]);
  });

  it('should enumerate Dominator tree and do `dominates` checks', function() {
    var input = fixtures.fn2str(function() {/*
      pipeline {
        b0 {
        }
        b0 => b1, b4, b6

        b1 {
        }
        b1 => b2, b3

        b2 {
        }
        b3 {
        }

        b4 {
        }
        b4 => b5

        b5 {
        }

        b6 {
        }
      }
    */});
    p.parse(input, { cfg: true, dominance: true }, 'printable');

    p.enumerate();

    /*
     *             b0
     *         /    |    \
     *       b1    b4     b6
     *    /   |     |
     *  b2    b3    b5
     */
    function range(index) {
      var block = p.blocks[index];
      return '[' + block.dominanceStart + ';' + block.dominanceEnd + ']';
    }
    assert.equal(range(0), '[0;6]');
    assert.equal(range(1), '[1;3]');
    assert.equal(range(2), '[2;2]');
    assert.equal(range(3), '[3;3]');
    assert.equal(range(4), '[4;5]');
    assert.equal(range(6), '[6;6]');

    assert(p.blocks[0].dominates(p.blocks[2]));
    assert(p.blocks[0].dominates(p.blocks[3]));
    assert(p.blocks[0].dominates(p.blocks[5]));
    assert(p.blocks[0].dominates(p.blocks[6]));
    assert(!p.blocks[1].dominates(p.blocks[5]));
    assert(!p.blocks[6].dominates(p.blocks[2]));
    assert(!p.blocks[6].dominates(p.blocks[0]));

    assert.equal(p.blocks[0].dominanceDepth, 0);
    assert.equal(p.blocks[1].dominanceDepth, 1);
    assert.equal(p.blocks[4].dominanceDepth, 1);
    assert.equal(p.blocks[6].dominanceDepth, 1);
    assert.equal(p.blocks[2].dominanceDepth, 2);
    assert.equal(p.blocks[3].dominanceDepth, 2);
    assert.equal(p.blocks[5].dominanceDepth, 2);
  });
});
