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

  it('should render printable', function() {
    var one = p.add('literal', p.reg('rax')).addLiteral(1);
    var two = p.add('literal', p.reg('rbx')).addLiteral(2);
    var add = p.add('add', p.reg('rax'), [ p.reg('rax'), p.reg('rbx') ]);
    var branch = p.add('if');

    var left = p.add('add', p.reg('rax'), [ p.reg('rax'), p.reg('rax') ]);
    var leftJump = p.add('jump');

    var right = p.add('add', p.reg('rax'), [ p.reg('rax'), p.reg('rbx') ]);
    var rightJump = p.add('jump');

    branch.link(left);
    branch.link(right);

    var ret = p.add('return', null, p.reg('rax'));
    leftJump.link(ret);
    rightJump.link(ret);

    assertText.equal(p.render('printable'), fixtures.fn2str(function() {/*
      register {
        %rax = literal 1
        %rbx = literal 2
        %rax = add %rax, %rbx
        if &+1, &+3

        %rax = add %rax, %rax
        jump &+3

        %rax = add %rax, %rbx
        jump &+1

        return %rax
      }
    */}));
  });
});
