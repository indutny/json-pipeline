'use strict';

var assert = require('assert');
var util = require('util');

var pipeline = require('../../../pipeline');

function Graphviz(sections, pipeline) {
  this.sections = sections;
  this.pipeline = pipeline;
}
module.exports = Graphviz;

Graphviz.prototype.parse = function parse(data) {
  throw new Error('Not implemented');
};

Graphviz.prototype.render = function render() {
  var pipeline = this.pipeline;

  var out = 'digraph {\n';

  out += 'node [fontsize=8,height=0.25]\n';
  out += 'rankdir="TB"\n';
  out += 'ranksep="1.2 equally"\n';
  out += 'overlap="false"\n';
  out += 'splines="true"\n';
  out += 'concentrate="true"\n';

  if (this.sections.cfg) {
    out += this._renderCFG();
  } else {
    out += this._renderPlain();
  }

  out += '}';
  return out;
};

Graphviz.prototype._renderCFG = function _renderCFG() {
  var out = '';
  for (var i = 0; i < this.pipeline.blocks.length; i++) {
    var block = this.pipeline.blocks[i];

    out += 'subgraph cluster' + i + '{\n';
    out += 'label = "b' + block.blockIndex + '"\n';
    out += this._renderNode(block);
    for (var j = 0; j < block.nodes.length; j++) {
      var node = block.nodes[j];
      out += this._renderNode(node);
    }
    out += '}\n';
  }
  for (var i = 0; i < this.pipeline.nodes.length; i++) {
    var node = this.pipeline.nodes[i];
    out += this._renderEdges(node);
  }
  return out;
};

Graphviz.prototype._renderPlain = function _renderPlain() {
  var out = '';
  for (var i = 0; i < this.pipeline.nodes.length; i++) {
    var node = this.pipeline.nodes[i];
    out += this._renderNode(node);
  }
  for (var i = 0; i < this.pipeline.nodes.length; i++) {
    var node = this.pipeline.nodes[i];
    out += this._renderEdges(node);
  }
  return out;
};

Graphviz.prototype._renderNode = function _renderNode(node) {
  var out = '';

  var label = '<S> i' + node.index + ' = ' + node.opcode;
  if (node.literals.length > 0)
    label += '(' + node.literals.join(', ') + ')';

  var records = [ '<CS>' ];
  for (var i = 0; i < node.control.length; i++)
    records.push('<C' + i + '> ^i' + node.control[i].index);
  records.push(label);
  for (var i = 0; i < node.inputs.length; i++)
    records.push('<I' + i + '> i' + node.inputs[i].index);

  out += 'N' + node.index + ' [\n';
  out += '  shape="record"\n';
  out += '  label="{{' + records.join('|') + '}}"\n';
  out += ']\n';

  return out;
};

Graphviz.prototype._renderEdges = function _renderEdges(node) {
  var out = '';

  var record = 'N' + node.index;
  for (var i = 0; i < node.control.length; i++) {
    out += 'N' + node.control[i].index + ':CS -> ' + record + ':C' + i;
    out += ' [dir=back, style=dashed]\n';
  }

  for (var i = 0; i < node.inputs.length; i++) {
    out += 'N' + node.inputs[i].index + ':S -> ' + record + ':I' + i;
    out += ' []\n';
  }

  return out;
};
