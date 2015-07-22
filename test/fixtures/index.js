var assert = require('assert');

exports.json = {
  p0: require('./p0.json'),
  p1: require('./p1.json'),
  p1cfg: require('./p1cfg.json'),
  p2dom: require('./p2dom.json')
};

exports.fn2str = function fn2str(fn) {
  return fn.toString().replace(/^function[^{]+{\/\*|\*\/}$/g, '');
};

function strip(val) {
  return val.split(/\r\n|\r|\n/g).map(function(line) {
    return line.replace(/^\s*/, '');
  }).filter(function(line) {
    return line;
  }).join('\n');
}

exports.stripEqual = function stripEqual(actual, expected) {
  assert.equal(strip(actual), strip(exports.fn2str(expected)));
};
