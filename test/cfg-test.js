var assert = require('assert');
var assertText = require('assert-text');

assertText.options.trim = true;

var pipeline = require('../');

var fixtures = require('./fixtures');

describe('JSON CFG Builder', function() {
  var p;
  beforeEach(function() {
    p = pipeline.create('cfg');
  });

  it('should generate CFG', function() {
    var start = p.block('start');
    assert.equal(start.index, 0);

    var one = p.add('literal').addLiteral(1);
    var two = p.add('literal').addLiteral(2);
    var add = p.add('add', [ one, two ]);
    var branch = p.addControl('if', [ add ]);

    var left = p.jumpFrom(start);
    assert.equal(left.blockIndex, 1);

    var x0 = p.add('literal').addLiteral('ok');
    var leftEnd = p.addControl('jump');

    var right = p.jumpFrom(start);

    var x1 = p.add('literal').addLiteral('not-ok');
    var rightEnd = p.addControl('jump');

    var merge = p.merge(left, right);
    var phi = p.addControl('phi', [ x0, x1 ]);
    p.addControl('return', [ phi ]);

    assert(phi.block === merge);

    // Normal export
    assert.deepEqual(p.render('json'), fixtures.json.p1);

    // CFG export
    assert.deepEqual(p.render({ cfg: true }, 'json'), fixtures.json.p1cfg);
  });

  it('should parse CFG', function() {
    p.parse(fixtures.json.p1cfg, { cfg: true }, 'json');

    // NOTE: we can't use `.render()` + `deepEqual()` here, because the indexes
    // are off after parsing
    assert.equal(p.blocks[0].nodes.length, 4);
    assert.equal(p.blocks[0].successors.length, 2);
    assert.equal(p.blocks[1].nodes.length, 2);
    assert.equal(p.blocks[1].successors.length, 1);
    assert.equal(p.blocks[2].nodes.length, 2);
    assert.equal(p.blocks[2].successors.length, 1);
    assert.equal(p.blocks[3].nodes.length, 2);
    assert.equal(p.blocks[3].successors.length, 0);
  });

  it('should reindex branch', function() {
    var start = p.block('start');

    var one = p.add('literal').addLiteral(1);
    var two = p.add('literal').addLiteral(2);
    var add = p.add('add', [ one, two ]);
    var branch = p.addControl('if', [ add ]);

    var left = p.jumpFrom(start);

    var x0 = p.add('literal').addLiteral('ok');
    var leftEnd = p.addControl('jump');

    var right = p.jumpFrom(start);

    var x1 = p.add('literal').addLiteral('not-ok');
    var rightEnd = p.addControl('jump');

    var merge = p.merge(left, right);
    var phi = p.addControl('phi', [ x0, x1 ]);
    p.addControl('return', [ phi ]);

    p.reindex();

    // CFG export
    var text = p.render({ cfg: true }, 'printable');
    assertText.equal(text, fixtures.fn2str(function() {/*
      pipeline {
        b0 {
          i0 = literal 1
          i1 = literal 2
          i2 = add i0, i1
          i3 = if ^b0, i2
        }
        b0 -> b1, b2
        b1 {
          i4 = literal "ok"
          i5 = jump ^b1
        }
        b1 -> b3
        b2 {
          i6 = literal "not-ok"
          i7 = jump ^b2
        }
        b2 -> b3
        b3 {
          i8 = phi ^b3, i4, i6
          i9 = return ^i8, i8
        }
      }
    */}));

    // Index of nodes
    assert.equal(start.index, 0);
    assert.equal(left.index, 1);
    assert.equal(right.index, 2);
  });

  it('should reindex loop', function() {
    var start = p.block('start');
    p.addControl('jump');

    var head = p.jumpFrom(start);
    var read = p.add('read');
    var branch = p.addControl('if', [ read ]);

    var body = p.jumpFrom(head);
    p.add('print');
    body.jump(head);

    var end = p.jumpFrom(head);
    p.addControl('return', read);

    p.reindex();

    // CFG export
    var text = p.render({ cfg: true }, 'printable');
    assertText.equal(text, fixtures.fn2str(function() {/*
      pipeline {
        b0 {
          i0 = jump ^b0
        }
        b0 -> b1
        b1 {
          i1 = read
          i2 = if ^b1, i1
        }
        b1 -> b2, b3
        b2 {
          i3 = print
        }
        b2 -> b1
        b3 {
          i4 = return ^b3, i1
        }
      }
    */}));
  });

  it('should link', function() {
    var start = p.block();
    p.addControl('if');

    var left = p.block();
    p.addControl('jump');

    var right = p.block();
    p.addControl('jump');

    var merge = p.block();
    var one = p.add('literal').addLiteral(1);
    p.addControl('return', one);

    start.jump(left);
    start.jump(right);
    left.jump(merge);
    right.jump(merge);

    p.link();

    var text = p.render('printable');
    assertText.equal(text, fixtures.fn2str(function() {/*
      pipeline {
        i0 = start
        i1 = if ^i0
        i2 = region ^i1
        i3 = jump ^i2
        i4 = region ^i1
        i5 = jump ^i4
        i6 = region ^i3, ^i5
        i7 = literal 1
        i8 = return ^i6, i7
      }
    */}));
  });

  it('should remove', function() {
    var start = p.block();
    var rem = p.add('to-be-removed');
    p.addControl('return');

    p.remove(rem);

    var text = p.render({ cfg: true }, 'printable');
    assertText.equal(text, fixtures.fn2str(function() {/*
      pipeline {
        b0 {
          i0 = return ^b0
        }
      }
    */}));
  });
});
