'use strict';

function JSONFormat(sections, pipeline) {
  this.sections = sections;
  this.pipeline = pipeline;
}
module.exports = JSONFormat;

JSONFormat.prototype.parse = function parse(json) {
  var pipeline = this.pipeline;
  var nodes = new Array(json.nodes.length);

  var blocks;
  if (this.sections.cfg) {
    // Create all blocks
    blocks = json.cfg.blocks;
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      nodes[block.node] = pipeline.block();

      // Debug information
      if (json.nodes[block.node].loc)
        nodes[block.node].loc = json.nodes[block.node].loc;

      // Habitate them with nodes
      for (var j = 0; j < block.nodes.length; j++) {
        var index = block.nodes[j];
        var node = json.nodes[index];
        nodes[index] = pipeline.add(node.opcode);

        // Debug information
        if (node.loc)
          nodes[index].loc = node.loc;
      }
    }

    if (this.sections.dominance)
      this._parseDominance(json, blocks);
  } else {
    // Create all nodes
    for (var i = 0; i < json.nodes.length; i++) {
      var node = json.nodes[i];
      nodes[i] = pipeline.add(node.opcode);

      // Debug information
      if (node.loc)
        nodes[i].loc = node.loc;
    }
  }

  // Link nodes together
  for (var i = 0; i < nodes.length; i++)
    this._parseNode(json, i, nodes);

  if (this.sections.cfg) {
    // Link blocks together
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];

      for (var j = 0; j < block.successors.length; j++)
        nodes[block.node].jump(nodes[block.successors[j]]);
    }

    this.pipeline.link();
  }
};

JSONFormat.prototype._parseNode = function _parseNode(json, index, nodes) {
  var node = json.nodes[index];
  var current = nodes[index];

  for (var i = 0; i < node.literals.length; i++)
    current.addLiteral(node.literals[i]);

  for (var i = 0; i < node.inputs.length; i++)
    current.addInput(nodes[node.inputs[i]]);

  if (node.control.length === 2)
    current.setControl(nodes[node.control[0]], nodes[node.control[1]]);
  else if (node.control.length === 1)
    current.setControl(nodes[node.control[0]]);
};

JSONFormat.prototype._parseDominance = function _parseDominance(json, blocks) {
  var pipeline = this.pipeline;
  var blocks = json.dominance.blocks;
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    var current = pipeline.blocks[i];

    // Blocks are created in the same order
    if (block.parent !== null)
      pipeline.nodes[block.parent].addChild(current);

    for (var j = 0; j < block.frontier.length; j++)
      current.addFrontier(pipeline.nodes[block.frontier[j]]);
  }
};

JSONFormat.prototype.render = function render() {
  var pipeline = this.pipeline;

  var output = {
    nodes: new Array(pipeline.nodes.length)
  };

  // Create index
  for (var i = 0; i < pipeline.nodes.length; i++) {
    var node = pipeline.nodes[i];

    output.nodes[i] = {
      opcode: node.opcode,
      control: new Array(node.control.length),
      literals: new Array(node.literals.length),
      inputs: new Array(node.inputs.length)
    };
  }

  // Fill it
  for (var i = 0; i < pipeline.nodes.length; i++) {
    var node = pipeline.nodes[i];
    var current = output.nodes[i];

    for (var j = 0; j < node.control.length; j++)
      current.control[j] = node.control[j].index;

    for (var j = 0; j < node.literals.length; j++)
      current.literals[j] = node.literals[j];

    for (var j = 0; j < node.inputs.length; j++)
      current.inputs[j] = node.inputs[j].index;
  }

  if (this.sections.cfg) {
    output.cfg = this._renderCFG();
    if (this.sections.dominance)
      output.dominance = this._renderDominance();
  }

  return output;
};

JSONFormat.prototype._renderCFG = function _renderCFG() {
  var pipeline = this.pipeline;
  var cfg = {
    blocks: new Array(pipeline.blocks.length)
  };

  for (var i = 0; i < pipeline.blocks.length; i++) {
    var block = pipeline.blocks[i];
    var current = {
      node: block.index,
      successors: new Array(block.successors.length),
      nodes: new Array(block.nodes.length)
    };

    for (var j = 0; j < block.successors.length; j++)
      current.successors[j] = block.successors[j].index;

    for (var j = 0; j < block.nodes.length; j++)
      current.nodes[j] = block.nodes[j].index;

    cfg.blocks[i] = current;
  }

  return cfg;
};

JSONFormat.prototype._renderDominance = function _renderDominance() {
  var pipeline = this.pipeline;
  var dom = {
    blocks: new Array(pipeline.blocks.length)
  };

  for (var i = 0; i < pipeline.blocks.length; i++) {
    var block = pipeline.blocks[i];
    var current = {
      node: block.index,
      parent: block.parent === null ? null : block.parent.index,
      frontier: new Array(block.frontier.length)
    };
    dom.blocks[i] = current;

    for (var j = 0; j < block.frontier.length; j++)
      current.frontier[j] = block.frontier[j].index;
  }

  return dom;
};
