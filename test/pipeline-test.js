var assert = require('assert');

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
    var extra2 = p.add('add', [ one, two ]);

    p.remove(extra1);
    p.remove(extra2);

    assert.equal(one.uses.length, 2);
    assert.equal(two.uses.length, 2);

    assert.deepEqual(p.render('json'), fixtures.json.p0);
  });
});
