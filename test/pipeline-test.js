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

  it('should replace node uses with other node', function() {
    var one = p.add('literal').addLiteral(1);
    var two = p.add('literal').addLiteral(2);
    var add = p.add('add', [ one, two ]);

    var three = p.add('literal').addLiteral(3);
    one.replace(three);

    assertText.equal(p.render('printable'), fixtures.fn2str(function() {/*
      pipeline {
        i0 = literal 1
        i1 = literal 2
        i2 = add i3, i1
        i3 = literal 3
      }
    */}));
  });
});
