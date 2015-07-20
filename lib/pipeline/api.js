'use strict';

var pipeline = require('../pipeline');

exports.create = function create(type) {
  if (type === 'cfg')
    return pipeline.CFGBuilder.create();
  else if (type === 'dominance')
    return pipeline.Dominance.create();
  else
    return pipeline.Pipeline.create();
};
