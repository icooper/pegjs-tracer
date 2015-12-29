# pegjs-backtrace.js
A debug tracer module for PEG.js. It generates a backtrace of the grammer rules when the parser fails.

# Example
The following example grammer is from PEG.js tutorial. It recognizes arithmetic expressions like `2*(3+4)`.

```
start = additive

plus = "+"

mult = "*"

additive = multiplicative plus additive / multiplicative

multiplicative = primary mult multiplicative / primary

primary = integer / "(" additive ")"

integer = digits:[0-9]+
```

If you give the `2*(3/4)` which the grammer does not recognize, pegjs-backtrace shows backtrace from the most deep failure after parser fails as follows.

![](./sample/verbose.png)

# Usage
pegjs-backtrace is implemented as a Tracer. When calling the `parse` function, pass the backtrace instance to the `tracer` option.
Then, after parser fails, you can obtain a backtrace object from `backtrace()`, or backtrace string from `dumpBacktrace()`.

```
var Parser = require('./parser.js'); // parser generated by pegjs --trace
var Tracer = require('pegjs-debug-backtrace');

var text = '2*(3/4)';
var tracer = new Tracer(text); // input text is required.

try {
    Parser.parse(text,{tracer:tracer});
} catch(e) {
	console.log(tracer.dumpBacktrace());
}
```
Note that `--trace` option is required to generated parser.js with pegjs command. If the `--trace` option is not supplied, tracer feature is disabled.

# Options

When creating pegjs-backtrace instance, you can provide some options as follows.

```
var Tracer = require('pegjs-backtrace');
var tracer = new Tracer(text,{
  parent:null,
  hiddenPaths:[],
  useColor:true,
  truncateThreshold:128,
  verbose:true,
  maxSourceLines:6,
});
```

## parent
This option specifies a parent Tracer instance. If the option is set, the parent's `trace` method is also called during parsing. The default value is `null`.
```
var Parser = require('parser.js');
var Tracer = require('pegjs-backtrace');
var tracer = new Tracer(text,{
  parent:new Parser.DefaultTracer(),
});
```

## useColor
If true, the backtrace string is colored with ANSI escape sequence. Otherwise no escape sequence is used. The default value is `true`.

## truncateThreshold
This option truncates the displaying path name if its length is greater than this value.

## maxSourceLines
The maximum number of lines shown as the quoted source in a node.

## verbose
If the option is true, the full path name and the quoted source are shown for an each trace. Otherwise minimal information of each trace will be shown like following. The default value is `true`.

![](./sample/no-verbose.png)

## hiddenPaths
This option specifies trace path patterns to hide. Any trace that matches one of these patterns will be hidden from the backtrace. The default value is `[]`.

```
var Tracer = require('pegjs-backtrace');
var tracer = new Tracer(text,{
  hiddenPaths:["integer","primary/.*"]
});
```

The type of a pattern must be `string` or `RegExp`. If the type of element is string like `"FOO"`, it is treated as the regular expression `/(^|\/)FOO(\/|$)/`.

# Limitation
In the quoted source, the cursor `^` sometimes points the wrong position if the input text contains East Asian full-width Characters.

The backtrace is based on the observable trace events from the pegjs parser. Any local failure inside a grammer rule is ignored. For example, if parser fails while
reading `"+"` character in the following `additive` rule, we can observe the event that `additive` fails but cannot get any information of `"+"` fails.
```
additive = multiplicative "+" additive / multiplicative
```
If you would like to see the event on `"+"` failure, the `"+"` should be an explicit rule like:
```
plus = "+"
additive = multiplicative plus additive / multiplicative
```
