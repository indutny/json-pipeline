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
});
