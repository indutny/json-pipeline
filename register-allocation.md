# Output Format

## JSON

```js
{
  "registers": [ "rax", "rbx", ... ],
  "spills": ...spill count...,

  "instructions": [
    {
      "opcode": "...opcode name...",
      "output": null or operand,
      "inputs": [
        // Input operands
        0, 1, 2, 3,  // positive numbers for registers
        -1, -2, -3, -4  // negative numbers for spills
      ],
      "literals": [
        // Any javascript literal values
      ],
      "links": [
        0, 1, 2  // indexes of other instructions (useful for jumps/ifs)
      ]
    }
  ]
}
```

## Printable

General format for each line is:

`out = opcode literals, links, inputs`

Where output, input, link, and literal have following format:

* `%...` for register
* `[...]` for spill slot
* `&+...`, `&-...` for link: `+...` and `-...` specifies offset from the current
  instruction (in instruction count)
* everything else - literal

Example:

```
register {
  %rax = literal 1
  %rbx = literal 2
  %rax = add %rax, %rbx
  if &+1, &+3

  %rax = add %rax, %rax
  jump &+3

  %rax = add %rax, %rbx
  jump &+1

  return %rax
}
```
