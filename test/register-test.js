var assert = require('assert');
var assertText = require('assert-text');

assertText.options.trim = true;

var pipeline = require('../');

var fixtures = require('./fixtures');

describe('JSON Pipeline', function() {
  var p;
  beforeEach(function() {
    p = pipeline.create('register');
  });

  it('should render JSON', function() {
    var one = p.add('literal', p.reg('rax')).addLiteral(1);
    var two = p.add('literal', p.reg('rbx')).addLiteral(2);
    var add = p.add('add', p.reg('rax'), [ p.reg('rax'), p.reg('rbx') ]);
    var ret = p.add('return', null, p.reg('rax'));

    assert.equal(two.index, 1);

    assert.deepEqual(p.render('json'), fixtures.json.r0);
  });

  it('should parse JSON', function() {
    p.parse(fixtures.json.r0, 'json');
    assert.deepEqual(p.render('json'), fixtures.json.r0);
  });

  it('should report used registers', function() {
    p.parse(fixtures.json.r0, 'json');
    assert.deepEqual(p.getUsedRegisters(), [ 'rax', 'rbx' ]);
  });

  it('should render printable', function() {
    var one = p.add('literal', p.reg('rax')).addLiteral(1);
    var two = p.add('literal', p.spill(0)).addLiteral(2);
    var add = p.add('add', p.reg('rax'), [ p.reg('rax'), p.spill(0) ]);
    var branch = p.add('if');

    var left = p.add('add', p.spill(1), [ p.reg('rax'), p.reg('rax') ]);
    var leftJump = p.add('jump');

    var right = p.add('add', p.reg('rax'), [ p.reg('rax'), p.spill(1) ]);
    var rightJump = p.add('jump');

    branch.link(left);
    branch.link(right);

    var ret = p.add('return', null, p.reg('rax'));
    leftJump.link(ret);
    rightJump.link(ret);

    p.setSpillType('gp', 0, 1);
    p.setSpillType('fp', 1, 2);

    assertText.equal(p.render('printable'), fixtures.fn2str(function() {/*
      register {
        # [0, 1) as gp
        # [1, 2) as fp

        %rax = literal 1
        [0] = literal 2
        %rax = add %rax, [0]
        if &+1, &+3

        [1] = add %rax, %rax
        jump &+3

        %rax = add %rax, [1]
        jump &+1

        return %rax
      }
    */}));
  });
});
