var pipeline = require('../');

var fixtures = require('./fixtures');

describe('JSON Pipeline', function() {
  var p;
  beforeEach(function() {
    p = pipeline.create();
  });

  it('should add nodes', function() {
    var start = p.add('start');
    var one = p.add('literal').addLiteral(1);
    var two = p.add('literal').addLiteral(2);
    var sum = p.add('sum', [ one, two ]);
    var ret = p.add('return', [ sum ]).setControl(start);

    console.log(p.nodes);
  });
});
