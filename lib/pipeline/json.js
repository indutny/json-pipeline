'use strict';

exports.parse = function parse(json, pipeline) {
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

    if (node.control !== null)
      current.setControl(nodes[node.control]);
  }
};

exports.render = function render(pipeline) {
  var output = {
    nodes: new Array(pipeline.nodes.length)
  };

  // Create index
  for (var i = 0; i < pipeline.nodes.length; i++) {
    var node = pipeline.nodes[i];
    node._index = i;

    output.nodes[i] = {
      opcode: node.opcode,
      control: null,
      literals: new Array(node.literals.length),
      inputs: new Array(node.inputs.length)
    };
  }

  // Fill it
  for (var i = 0; i < pipeline.nodes.length; i++) {
    var node = pipeline.nodes[i];
    var current = output.nodes[i];

    if (node.control !== null)
      current.control = node.control._index;

    for (var j = 0; j < node.literals.length; j++)
      current.literals[j] = node.literals[j];

    for (var j = 0; j < node.inputs.length; j++)
      current.inputs[j] = node.inputs[j]._index;
  }

  // TODO(indutny): this should be debug-mode only
  // Clean-up
  for (var i = 0; i < pipeline.nodes.length; i++) {
    var node = pipeline.nodes[i];
    node._index = null;
  }

  return output;
};
