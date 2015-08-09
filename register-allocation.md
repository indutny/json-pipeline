# Output Format

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
