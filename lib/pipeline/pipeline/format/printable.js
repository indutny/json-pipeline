'use strict';

var assert = require('assert');
var util = require('util');

function Printable(sections, pipeline) {
  this.sections = sections;
  this.pipeline = pipeline;

  this.ast = null;
  this.stack = [];
  this.current = null;
  this.currentLine = null;

  this.map = null;
}
module.exports = Printable;

Printable.prototype.parse = function parse(data) {
  var lines = (data + '').split(/\r\n|\r|\n/g);

  for (var i = 0; i < lines.length; i++)
    if (this._parseLine(lines[i].trim(), i) === false)
      break;

  assert(this.ast !== null, '`pipeline {}` section not found');

  this._parseAST(this.ast);
  this.pipeline.computeLastControl();
  this.pipeline.link();
  this.ast = null;
};

Printable.prototype._push = function _push(node) {
  this.stack.push(this.current);
  this.current = node;
};

Printable.prototype._pop = function _pop() {
  if (this.current.loc)
    this.current.loc.end = this.currentLine;
  this.current = this.stack.pop();
  return this.current;
};

var re = new RegExp('^\s*(?:' + [
  // `pipeline {`
  '(pipeline)\\s*{',

  // `b1 {` or `b1 => b2, b3, b4`
  '(b\\d+)\\s*({|([\\-=~]>)\\s*((?:b\\d+[\\s,]+)*b\\d+))',

  // `i0 = opcode 1, 2, i1, i2`
  '(i\\d+)\\s*=\\s*([^\\s]+)(?:\\s+((?:[^\\s]+[\\s,]+)*[^\\s]+))?',

  // `}`
  '(})'
].join('|') + ')\\s*(?:#\\s*(.*)\\s*)?$');
Printable.re = re;

Printable.prototype._parseLine = function _parseLine(line, index) {
  if (!line)
    return;

  var match = line.match(re);
  this.currentLine = index;

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
    id: id,
    body: [],
    loc: {
      line: this.currentLine,
      end: null
    }
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
      from: id,
      to: items[i],
      loc: {
        line: this.currentLine
      }
    });
  }
};

Printable.prototype._parseNode = function _parseNode(id, opcode, list) {
  var node = {
    type: 'Node',
    id: id,
    opcode: opcode,
    control: [],
    literals: [],
    inputs: [],
    loc: {
      line: this.currentLine
    }
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

    node.control.push(items[i].slice(1));
  }

  // Parse literals
  for (; i < items.length; i++) {
    if (/^i/.test(items[i]))
      break;

    node.literals.push(JSON.parse(items[i]));
  }

  // Parse inputs
  for (; i < items.length; i++)
    node.inputs.push(items[i]);
};

Printable.prototype._parseAST = function _parseAST(ast) {
  this.map = {};

  // Reserve blocks
  for (var i = 0; i < ast.body.length; i++) {
    var node = ast.body[i];

    if (node.type === 'Block')
      this._reserveBlock(i === 0, node);
    else if (node.type === 'Node')
      this._reserveNode(node);
  }

  // Fill blocks and link them
  for (var i = 0; i < ast.body.length; i++) {
    var node = ast.body[i];

    if (node.type === 'Block') {
      for (var j = 0; j < node.body.length; j++)
        this._fillNode(node.body[j]);
    } else if (node.type === 'Node') {
      this._fillNode(node);
    } else if (node.type === 'Link') {
      this._fillLink(node);
    }
  }

  this.map = null;
};

Printable.prototype._lookup = function _lookup(id) {
  var out = this.map[id];
  assert(out, 'Id: ' + id + ' not found');
  return out;
};

Printable.prototype._reserveBlock = function _reserveBlock(isFirst, block) {
  var out = this.pipeline.block(isFirst ? 'start' : 'region');
  out.loc = block.loc;
  this.map[block.id] = out;

  for (var i = 0; i < block.body.length; i++) {
    var node = block.body[i];
    this._reserveNode(node);
  }
};

Printable.prototype._reserveNode = function _reserveNode(node) {
  var out = this.pipeline.create(node.opcode);
  if (this.pipeline.currentBlock !== null)
    this.pipeline.currentBlock.add(out);
  out.loc = node.loc;
  this.map[node.id] = out;
};

Printable.prototype._fillNode = function _fillNode(node) {
  var current = this._lookup(node.id);

  if (node.control.length === 1)
    current.setControl(this._lookup(node.control[0]));
  else if (node.control.length === 2)
    current.setControl(this._lookup(node.control[0]),
                       this._lookup(node.control[1]));

  for (var i = 0; i < node.inputs.length; i++)
    current.addInput(this._lookup(node.inputs[i]));

  for (var i = 0; i < node.literals.length; i++)
    current.addLiteral(node.literals[i]);
};

Printable.prototype._fillLink = function _fillLink(link) {
  var from = this._lookup(link.from);
  var to = this._lookup(link.to);

  if (link.arrow == '->')
    from.jump(to);
  else if (link.arrow === '=>')
    from.addChild(to);
  else if (link.arrow === '~>')
    from.addFrontier(to);
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
