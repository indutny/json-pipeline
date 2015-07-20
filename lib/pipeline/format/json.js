'use strict';

exports.parse = function parse(json, sections, pipeline) {
  var nodes = new Array(json.nodes.length);

  // Create all nodes
  for (var i = 0; i < json.nodes.length; i++) {
    var node = json.nodes[i];
    nodes[i] = pipeline.add(node.opcode);
  }

  // Link them together
  for (var i = 0; i < nodes.length; i++) {
    var node = json.nodes[i];
    var current = nodes[i];

    for (var j = 0; j < node.literals.length; j++)
      current.addLiteral(node.literals[j]);

    for (var j = 0; j < node.inputs.length; j++)
      current.addInput(nodes[node.inputs[j]]);

    if (node.control.length === 2)
      current.setControl(nodes[node.control[0]], nodes[node.control[1]]);
    else if (node.control.length === 1)
      current.setControl(nodes[node.control[0]]);
  }
};

exports.render = function render(sections, pipeline) {
  var output = {
    nodes: new Array(pipeline.nodes.length)
  };

  // Create index
  for (var i = 0; i < pipeline.nodes.length; i++) {
    var node = pipeline.nodes[i];
    node._index = i;

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
      current.control[j] = node.control[j]._index;

    for (var j = 0; j < node.literals.length; j++)
      current.literals[j] = node.literals[j];

    for (var j = 0; j < node.inputs.length; j++)
      current.inputs[j] = node.inputs[j]._index;
  }

  if (sections.cfg)
    output.cfg = exports.renderCfg(pipeline);

  // TODO(indutny): this should be debug-mode only
  // Clean-up
  for (var i = 0; i < pipeline.nodes.length; i++) {
    var node = pipeline.nodes[i];
    node._index = null;
  }

  return output;
};

exports.renderCfg = function renderCfg(pipeline) {
  var out = {
    blocks: new Array(pipeline.blocks.length)
  };

  for (var i = 0; i < pipeline.blocks.length; i++) {
    var block = pipeline.blocks[i];
    var current = {
      node: block._index,
      successors: new Array(block.successors.length),
      nodes: new Array(block.nodes.length)
    };

    for (var j = 0; j < block.successors.length; j++)
      current.successors[j] = block.successors[j]._index;

    for (var j = 0; j < block.nodes.length; j++)
      current.nodes[j] = block.nodes[j]._index;

    out.blocks[i] = current;
  }

  return out;
};
