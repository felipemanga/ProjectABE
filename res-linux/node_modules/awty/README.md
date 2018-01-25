# awty

`awty`, *Are We There Yet?*, is a simplistic polling module for repeat checking on asynchrous tasks.

[![Build Status](https://travis-ci.org/tur-nr/node-awty.svg?branch=master)](https://travis-ci.org/tur-nr/node-awty)

### Example

```js
var awty = require('awty');
var poll = awty(function() {
  // perform check on a certain length task
  // return true if and when finished polling
});

poll(function() {
  console.log('finished polling');
});
```

## Installation

### Node

To install `awty` in a Node application use npm.

```
$ npm install awty
```

### Browser

No tests available for the browser but you may try using it via [webpack](https://github.com/webpack/webpack).

```
$ webpack index.js awty.js
```

## Test

To run tests use npm.

```
$ npm install
$ npm test
```

## Documentation

### Basic Usage

`awty` takes a callback that will be called on each poll. Simply return `true` whenever the polling is finished. To start polling call the returned instance supplying a done callback.

```js
poll.every(250) // every 250ms
    .ask(5);    // only poll check 5 times

// start polling
poll(function(fin) {
  if (fin) console.log('polling finished');
  else console.log('polling stopped unfinished');
});
```

Set the timeout for each poll by the `every` method, passing a number of ms each call should wait.

A poll limit can also be set by the `ask` method, just pass a maximum number the poll should call.

### Async Usage

The callback that `awty` takes is also provided a `next` function as an argument. If the function uses the argument, it will wait until the `next` function is called.

Instead of returning, whether or not to stop needs to be provided as an argument to the `next` function.

```js
var awty = require('awty');
var poll = awty(function(next) {
  setTimeout(function() {
    next(/* `true` if polling should be finished */);
  }, 100)
});

poll(function() {
  console.log('finished polling');
});
```

### Incremental Polls

It possible to increment the timeout after each poll, using the `incr` method it will double the last timeout. Or supplying an number of ms to increment by.

```js
poll.incr(); // 250, 500, 1000, 2000, 4000, ...

// or set ms

poll.incr(50); // 250, 300, 350, 400, 450, ...
```

## API

#### awty(*&lt;poll&gt;*)
#### poll(*&lt;cb&gt;*)
#### poll.every(*&lt;ms&gt;*)
#### poll.ask(*&lt;num&gt;*)
#### poll.incr(*&lt;val&gt;*)

## License

[MIT](LICENSE)

Copyright (c) 2014 [Christopher Turner](https://github.com/tur-nr)
