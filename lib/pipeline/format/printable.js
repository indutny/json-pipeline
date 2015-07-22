'use strict';

var assert = require('assert');
var util = require('util');

var pipeline = require('../../pipeline');
var JSONFormat = pipeline.Pipeline.formats.json;

function Printable(sections, pipeline) {
  JSONFormat.call(this, sections, pipeline);

  this.ast = null;
  this.stack = [];
  this.current = null;
}
util.inherits(Printable, JSONFormat);
module.exports = Printable;
util.inherits(Printable, JSONFormat);

Printable.prototype.toJSON = function toJSON(data) {
  var lines = (data + '').split(/[\r\n]+/g);

  for (var i = 0; i < lines.length; i++)
    if (this._parseLine(lines[i].trim(), i) === false)
      break;

  assert(this.ast !== null, '`pipeline {}` section not found');

  return this._astToJSON(this.ast);
};

Printable.prototype.parse = function parse(data) {
  return JSONFormat.prototype.parse.call(this, this.toJSON(data));
};

Printable.prototype._push = function _push(node) {
  this.stack.push(this.current);
  this.current = node;
};

Printable.prototype._pop = function _pop() {
  this.current = this.stack.pop();
  return this.current;
};

var re = new RegExp('(?:' + [
  // `pipeline {`
  '(pipeline)\\s*{',

  // `b1 {` or `b1 => b2, b3, b4`
  'b(\\d+)\\s*({|([\\-=~]>)\\s*((?:b\\d+[\\s,]+)*b\\d+))',

  // `i0 = opcode 1, 2, i1, i2`
  'i(\\d+)\\s*=\\s*([^\\s]+)(?:\\s+((?:[^\\s]+[\\s,]+)*[^\\s]+))?',

  // `}`
  '(})'
].join('|') + ')\\s*(?:#\\s*(.*)\\s*)?$');
Printable.re = re;

Printable.prototype._parseLine = function _parseLine(line, index) {
  if (!line)
    return;

  var match = line.match(re);

  if (!match)
    throw new Error(util.format('Failed to parse: %j at line %d', line, index));

  // `pipeline {`
  if (match[1]) {
    assert(this.ast === null, 'Nested `pipeline {`');
    this.ast = {
      type: 'Pipeline',
      body: []
    };
    this._push(this.ast);
    return;
  }

  // `}`
  if (match[9]) {
    this._pop();

    // End of `pipeline {}`
    if (this.stack.length === 0)
      return false;
    return;
  }

  assert(this.ast !== null, 'Missing `pipeline {}` section');
  var pipeline = this.pipeline;

  // `b1 {`
  if (match[2] && !match[4])
    return this._parseBlock(match[2]);

  // `b1 -> ...`
  if (match[2]) {
    this._parseLink(match[2], match[4], match[5]);
    return;
  }

  // node
  assert(match[6]);
  this._parseNode(match[6], match[7], match[8]);
};

Printable.prototype._parseBlock = function _parseBlock(id) {
  var block = {
    type: 'Block',
    id: id | 0,
    body: []
  };
  this.current.body.push(block);
  this._push(block);
};

Printable.prototype._parseLink = function _parseLink(id, arrow, list) {
  var pipeline = this.pipeline;

  assert.equal(this.current.type,
               'Pipeline',
               'Arrow should be outside of the block');

  var items = list.split(/[\s,]+/g);
  for (var i = 0; i < items.length; i++) {
    this.current.body.push({
      type: 'Link',
      arrow: arrow,
      from: id | 0,
      to: items[i].slice(1) | 0
    });
  }
};

Printable.prototype._parseNode = function _parseNode(id, opcode, list) {
  var node = {
    type: 'Node',
    id: id | 0,
    opcode: opcode,
    control: [],
    literals: [],
    inputs: []
  };
  this.current.body.push(node);

  // No arguments
  if (!list)
    return;

  var items = list.split(/[\s,]+/g);

  // Parse control
  for (var i = 0; i < items.length; i++) {
    if (!/^\^/.test(items[i]))
      break;

    var prefix = items[i][1];
    assert(prefix === 'i' || prefix === 'b',
           'Unexpected control prefix: ' + prefix);

    node.control.push(items[i].slice(2) | 0);
  }

  // Parse literals
  for (; i < items.length; i++) {
    if (/^i/.test(items[i]))
      break;

    node.literals.push(JSON.parse(items[i]));
  }

  // Parse inputs
  for (; i < items.length; i++)
    node.inputs.push(items[i].slice(1) | 0);
};

Printable.prototype._astToJSON = function _astToJSON(ast) {
  var json = {
    nodes: [],
    cfg: {
      blocks: []
    },
    dominance: {
      blocks: []
    }
  };

  // Reserve blocks
  for (var i = 0; i < ast.body.length; i++) {
    var node = ast.body[i];

    if (node.type === 'Block')
      this._prepareBlock(node, json);
  }

  // Fill blocks and link them
  for (var i = 0; i < ast.body.length; i++) {
    var node = ast.body[i];

    if (node.type === 'Block') {
      for (var j = 0; j < node.body.length; j++)
        this._pushNode(node, node.body[j], json);
    } else if (node.type === 'Node') {
      this._pushNode(null, node, json);
    } else if (node.type === 'Link') {
      this._linkBlocks(node, json);
    }
  }
  return json;
};

Printable.prototype._prepareBlock = function _prepareBlock(block, json) {
  var index = json.nodes.length;
  json.nodes.push({
    opcode: index === 0 ? 'start' : 'region',

    // NOTE: CFGBuilder will fill this
    control: [],

    literals: [],
    inputs: []
  });
  json.cfg.blocks.push({
    node: index,
    successors: [],
    nodes: []
  });
  json.dominance.blocks.push({
    node: index,
    parent: null,
    frontier: []
  });
};

Printable.prototype._pushNode = function _pushNode(block, node, json) {
  assert.equal(node.type, 'Node');

  var offset = json.cfg.blocks.length;
  var inputs = new Array(node.inputs.length);

  for (var i = 0; i < inputs.length; i++)
    inputs[i] = node.inputs[i] + offset;

  var index = json.nodes.length;
  json.nodes.push({
    opcode: node.opcode,
    control: node.control,
    literals: node.literals,
    inputs: inputs
  });

  if (block !== null)
    json.cfg.blocks[block.id].nodes.push(index);
};

Printable.prototype._linkBlocks = function _linkBlocks(link, json) {
  if (link.arrow == '->')
    json.cfg.blocks[link.from].successors.push(link.to);
  else if (link.arrow === '=>')
    json.dominance.blocks[link.to].parent = link.from;
  else if (link.arrow === '~>')
    json.dominance.blocks[link.from].frontier.push(link.to);
  else
    throw new Error('Unexpected arrow type: ' + link.arrow);
};

Printable.prototype.render = function render() {
};
