exports.json = {
  p0: require('./p0.json'),
  p1: require('./p1.json'),
  p1cfg: require('./p1cfg.json'),
  p2dom: require('./p2dom.json')
};

exports.fn2str = function fn2str(fn) {
  return fn.toString().replace(/^function[^{]+{\/\*|\*\?}$/g, '');
};
