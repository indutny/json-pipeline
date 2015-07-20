# Data format for the compiler

## Conventions

Opcode names MUST not contain `:` unless:

* They are going to be consumed and renamed by one of the next stages
* They represent platform specific low-level instructions. In this case the
  `<platform-name>:prefix` should be used. `platform-name` should not contain
  any characters except ones defined by the set `[a-zA-Z0-9_\-\.]`

Every node may take several literal inputs, several regular inputs, and
possibly a control input.

## Process

Stage receive and produce data with indexes instead of pointers between
structures, thus ensuring that the data might be serialized between all stages.

Stage might transform input data to some internal representation with pointers
instead of the indexes before performing any kind of operations.

The compilation goes in a following steps.

### AST to SSA-less CFG

AST is naively transformed into CFG graph with:

* `ssa:load(ssa:name("..."))`
* `ssa:store(ssa:name("..."), value)`

for all local variable lookups. Context and global variable lookups should be
generally done using language-specific opcodes, and are not subject to the SSA
phase defined below.

Every node (except region nodes) must be in the `nodes` list of one block. First
block in `cfg` section is considered a `start` node.

SSA-less CFG information is propagated to the next stage.

### SSA-less CFG to CFG+SSA

Using dominator tree information, `ssa:load`s are replaced with proper
`ssa:store`'s values or `ssa:phi` nodes. `ssa:phi` takes two inputs and
has a control dependency on the CFG block that holds it.

`start`, `region`, `jump`, and `if` nodes are inserted with field
`control` pointing to each other or being `null`.

CFG and dominance information is propagated to the next stage.

### CFG to Sea-of-Nodes

Some optimizations may happen here.

Nothing is propagated to the next stage, except the `nodes` DAG.

### Optimizations on Sea-of-Nodes

Some optimizations may happen here.

Propagate all inputs.

### Sea-of-Nodes to Low-level Sea-of-Nodes

**Platform specific stage**

Opcodes are replaced with their low-level counterparts, possibly generating more
nodes that was previously in the graph.

Propagate all inputs.

### Sea-of-Nodes to CFG

Scheduling algorithm generates blocks and puts the nodes at proper
positions into them, thus creating CFG out of DAG representation. Blocks are
ordered to optimize amount of jumps.

This stage propagates CFG and dominance information.

### Optional optimizations on CFG

Some optimizations may happen here.

Propagate all inputs.

### Generate machine code

**Platform specific stage**

Generate machine code using blocks and their nodes.

## Representation

### JSON

```js
{
  // Lookup by `node id`
  "nodes": [
    {
      "opcode": "opcode id",
      "control": [ ...node ids... ],

      "literals": [ ...literal values... ],
      "inputs": [ ...node ids... ]
    }
  ],

  // Optional CFG information
  "cfg": {
    // Lookup by `block id`
    "blocks": [
      {
        "node": ...node id... // Points to region node
        "successors": [ ...block ids... ],
        "nodes": [ ...node ids... ]
      }
    ]
  },

  // Optional dominance information (lookup by `block id` everywhere)
  "dominance": {
    "blocks": [
      {
        "node": ...node id... // Point to region node
        "parent": ...node id... or `null`,
        "frontier": [
          [ ... ],
          ...
          [ ... ]
        ]
      }
    ]
  }
}
```

### Binary

To be defined
