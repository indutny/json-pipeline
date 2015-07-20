# JSON pipeline
[![Build Status](https://secure.travis-ci.org/indutny/json-pipeline.png)](http://travis-ci.org/indutny/json-pipeline)
[![NPM version](https://badge.fury.io/js/json-pipeline.svg)](http://badge.fury.io/js/json-pipeline)

A structure specification for the flexible compiler design, with support to the
3rd-party optimization phases.

## Design document

Work on the design document is happening [here][0].

## Useful reading

- [Sea-of-nodes][1] and [this][2]
- [SSA][3]
- [CFG][4]
- [Dominator tree][5], [Lengauer Tarjan Algorithm][6]
- [GCM][7]

## LICENSE

This software is licensed under the MIT License.

Copyright Fedor Indutny, 2015.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.

[0]: design.md
[1]: http://www.researchgate.net/profile/Cliff_Click/publication/2394127_Combining_Analyses_Combining_Optimizations/links/0a85e537233956f6dd000000.pdf
[2]: http://static.squarespace.com/static/50030e0ac4aaab8fd03f41b7/50030ec0e4b0c0ebbd07b0e0/50030ec0e4b0c0ebbd07b268/1281379125883/
[3]: https://en.wikipedia.org/wiki/Static_single_assignment_form
[4]: https://en.wikipedia.org/wiki/Control_flow_graph
[5]: https://en.wikipedia.org/wiki/Dominator_(graph_theory)
[6]: https://www.cs.princeton.edu/courses/archive/fall03/cs528/handouts/a%20fast%20algorithm%20for%20finding.pdf
[7]: https://courses.cs.washington.edu/courses/cse501/04wi/papers/click-pldi95.pdf
