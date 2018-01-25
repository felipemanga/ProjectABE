# isval

isval is a helper module that validates any given value. It overcomes common JavaScript issues with type checking, like `NaN` and `null` values.

[![Build Status](https://travis-ci.org/tur-nr/node-isval.svg?branch=master)](https://travis-ci.org/tur-nr/node-isval)

### Example

```js
var isval = require('isval');
var string = 'I am a string';

assert.ok(isval(string, 'string'));
```

## Installation

### Node

To install isval in a Node application use npm.

```
$ npm install isval
```

### Browser

No tests available for the browser but you may try using it via [webpack](https://github.com/webpack/webpack).

```
$ webpack index.js isval.js
```

## Test

To run tests use npm.

```
$ npm install
$ npm test
```

## Documentation

### Basic Usage

The following types are available:

* `'string'`
* `'number'`
* `'boolean'`
* `'function'`
* `'object'`
* `'array'`
* `'regex'`
* `'regexp'`
* `'date'`
* `'null'`
* `'undefined'`
* `'NaN'`
* `'arguments'`

Types can also be literal values:

* `String`
* `Number`
* `Boolean`
* `Object`
* `null`
* `undefined`
* `NaN`

### Instance Of

Passing a constructor function will check if the value is an `instanceof` of that "Class".

```js
var buffer = new ArrayBuffer();
isval(buffer, ArrayBuffer);
```

### Truthy Values

Passing no type will check for truthy values.

```js
isval(1);
isval('true');
```

## API

#### isval(*&lt;value&gt;*, *[type]*)

## License

[MIT](LICENSE)

Copyright (c) 2014 [Christopher Turner](https://github.com/tur-nr)
