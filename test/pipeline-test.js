var assert = require('assert');
var assertText = require('assert-text');

assertText.options.trim = true;

var pipeline = require('../');

var fixtures = require('./fixtures');

describe('JSON Pipeline', function() {
  var p;
  beforeEach(function() {
    p = pipeline.create();
  });

  it('should render JSON', function() {
    var start = p.add('start');
    var one = p.add('literal').addLiteral(1);
    var two = p.add('literal').addLiteral(2);
    var add = p.add('add', [ one, two ]);
    var ret = p.add('return', [ add ]).setControl(start);

    assert(start.isControl());
    assert(ret.isControl());

    assert.equal(one.index, 1);

    assert.deepEqual(p.render('json'), fixtures.json.p0);
  });

  it('should parse JSON', function() {
    p.parse(fixtures.json.p0, 'json');
    assert.deepEqual(p.render('json'), fixtures.json.p0);
  });

  it('should remove nodes and clean up uses', function() {
    var start = p.add('start');
    var one = p.add('literal').addLiteral(1);
    var two = p.add('literal').addLiteral(2);
    var add = p.add('add', [ one, two ]);
    var extra1 = p.add('add', [ one, two ]);
    var ret = p.add('return', [ add ]).setControl(start);
    var extra2 = p.add('add', [ one, two ]).setControl(start);

    p.remove(extra1);
    p.remove(extra2);

    assert.equal(one.uses.length, 2);
    assert.equal(two.uses.length, 2);
    assert.equal(start.controlUses.length, 2);

    assert.deepEqual(p.render('json'), fixtures.json.p0);
  });

  it('should remove control nodes', function() {
    var start = p.add('start');
    var middle = p.add('middle').setControl(start);
    var end = p.add('end').setControl(middle);

    p.remove(middle);

    assertText.equal(p.render('printable'), fixtures.fn2str(function() {/*
      pipeline {
        i0 = start
        i1 = end ^i0
      }
    */}));
  });

  it('should cut control nodes', function() {
    var start = p.add('start');
    var branch = p.add('if').setControl(start);
    var left = p.add('region').setControl(branch);
    var right = p.add('region').setControl(branch);
    var merge = p.add('end').setControl(left, right);

    p.cut(branch);
    assert.equal(start.controlUses.length, 0);

    assertText.equal(p.render('printable'), fixtures.fn2str(function() {/*
      pipeline {
        i0 = start
        i1 = if
        i2 = region ^i1
        i3 = region ^i1
        i4 = end ^i2, ^i3
      }
    */}));
  });

  it('should replace node uses with other node', function() {
    var start = p.add('start');
    var one = p.add('literal').setControl(start).addLiteral(1);
    var two = p.add('literal').addLiteral(2);
    var add = p.add('add', [ one, two ]).setControl(one);

    var three = p.add('literal').addLiteral(3);
    one.replace(three);
    assert.equal(add.inputs[0], three);
    assert.equal(three.uses.length, 2);
    assert.equal(three.uses[0], add);
    assert.equal(three.uses[1], 0);

    assertText.equal(p.render('printable'), fixtures.fn2str(function() {/*
      pipeline {
        i0 = start
        i1 = literal 1
        i2 = literal 2
        i3 = add ^i4, i4, i2
        i4 = literal ^i0, 3
      }
    */}));
  });

  it('should replace control node', function() {
    var start = p.add('start');
    var middle = p.add('middle').setControl(start);
    var end = p.add('end').setControl(middle);

    middle.replace(p.add('replaced'));

    assertText.equal(p.render('printable'), fixtures.fn2str(function() {/*
      pipeline {
        i0 = start
        i1 = middle
        i2 = end ^i3
        i3 = replaced ^i0
      }
    */}));
  });

  it('should replace with control node', function() {
    var start = p.add('start');
    var middle = p.add('middle');
    var end = p.add('end').setControl(middle);

    var replaced = p.add('replaced').setControl(start);
    middle.replace(replaced);
    assert.equal(start.controlUses.length, 2);
    assert.equal(replaced.controlUses.length, 2);
    assert.equal(replaced.control.length, 1);
    assert.equal(end.control.length, 1);

    assertText.equal(p.render('printable'), fixtures.fn2str(function() {/*
      pipeline {
        i0 = start
        i1 = middle
        i2 = end ^i3
        i3 = replaced ^i0
      }
    */}));
  });

  it('should replace input uses with other node', function() {
    var one = p.add('literal').addLiteral(1);
    var two = p.add('literal').addLiteral(2);
    var add = p.add('add', [ one, two ]);

    var three = p.add('literal').addLiteral(3);
    add.replaceInput(0, three);

    assertText.equal(p.render('printable'), fixtures.fn2str(function() {/*
      pipeline {
        i0 = literal 1
        i1 = literal 2
        i2 = add i3, i1
        i3 = literal 3
      }
    */}));
  });

  it('should remove control from control node', function() {
    var start = p.add('start');
    var middle = p.add('middle').setControl(start);
    var end = p.add('end').setControl(middle);

    middle.removeControl();

    assertText.equal(p.render('printable'), fixtures.fn2str(function() {/*
      pipeline {
        i0 = start
        i1 = middle
        i2 = end ^i0
      }
    */}));
  });
});
