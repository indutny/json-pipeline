'use strict';

var assert = require('assert');
var util = require('util');

var pipeline = require('../../pipeline');
var JSONFormat = pipeline.Pipeline.formats.json;

function Printable(sections, pipeline) {
  this.sections = sections;
  this.pipeline = pipeline;

  this.json = new JSONFormat(sections, pipeline);

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

  var out = this._astToJSON(this.ast);
  this.ast = null;
  return out;
};

Printable.prototype.parse = function parse(data) {
  return this.json.parse(this.toJSON(data));
};

Printable.prototype._push = function _push(node) {
  this.stack.push(this.current);
  this.current = node;
};

Printable.prototype._pop = function _pop() {
  this.current = this.stack.pop();
  return this.current;
};

var re = new RegExp('^\s*(?:' + [
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
  var out = 'pipeline {\n';

  if (this.sections.cfg)
    out += this._renderCFG();
  else
    out += this._renderPlain();

  out += '}';

  return out;
};

Printable.prototype._renderPlain = function _renderPlain() {
  var out = '';
  var pipeline = this.pipeline;

  for (var i = 0; i < pipeline.nodes.length; i++)
    out += this._renderNode(pipeline.nodes[i], null, '  ');

  return out;
};

function lookupId(ids, node) {
  return ids === null ? 'i' + node.index : ids[node.index];
}

Printable.prototype._renderNode = function _renderNode(node, ids, pad) {
  var out = lookupId(ids, node) + ' = ' + node.opcode;

  var args = [];
  for (var i = 0; i < node.control.length; i++)
    args.push('^' + lookupId(ids, node.control[i]));
  for (var i = 0; i < node.literals.length; i++)
    args.push(JSON.stringify(node.literals[i]));
  for (var i = 0; i < node.inputs.length; i++)
    args.push(lookupId(ids, node.inputs[i]));

  if (args.length !== 0)
    out += ' ' + args.join(', ');

  return pad + out + '\n';
};

Printable.prototype._renderCFG = function _renderCFG() {
  var pipeline = this.pipeline;
  var out = '';

  // We need node ids skipping the blocks
  var ids = new Array(pipeline.nodes.length);
  for (var i = 0, j = 0, k = 0; i < ids.length; i++) {
    // Block node
    if (j < pipeline.blocks.length && pipeline.blocks[j].index === i) {
      ids[i] = 'b' + j;
      j++;
      continue;
    }

    // Other node
    ids[i] = 'i' + k;
    k++;
  }

  for (var i = 0; i < pipeline.blocks.length; i++)
    out += this._renderBlock(pipeline.blocks[i], ids);

  return out;
};

function renderArrow(id, arrow, list) {
  var ids = new Array(list.length);
  for (var i = 0; i < ids.length; i++)
    ids[i] = 'b' + list[i].blockIndex;
  return id + ' ' + arrow + ' ' + ids.join(', ') + '\n';
}

Printable.prototype._renderBlock = function _renderBlock(block, ids) {
  var id = 'b' + block.blockIndex;
  var out = '  ' + id + ' {\n';

  for (var i = 0; i < block.nodes.length; i++)
    out += this._renderNode(block.nodes[i], ids, '    ');

  out += '  }\n';

  if (block.successors.length !== 0)
    out += '  ' + renderArrow(id, '->', block.successors);

  if (this.sections.dominance) {
    if (block.children.length !== 0)
      out += '  ' + renderArrow(id, '=>', block.children);

    if (block.frontier.length !== 0)
      out += '  ' + renderArrow(id, '~>', block.frontier);
  }

  return out;
};
