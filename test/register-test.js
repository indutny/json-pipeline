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
});
