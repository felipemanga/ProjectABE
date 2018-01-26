var isval = require('isval')
  , doubler = require('./doubler');

module.exports = function awty(poll) {
  if (!arguments.length) {
    throw new SyntaxError('must supply a polling function');
  }

  if (!isval(poll, 'function')) {
    throw new TypeError('poll must be a function');
  }

  return (function() {
    var times = Infinity
      , incr = false
      , every = 1000
      , interval = null
      , counter = 0
      , instance
      , done;

    function run() {
      var result = poll(next);

      if (poll.length === 0) {
        next(result);
      }
    }

    function next(result) {
      var timeout = every
        , fin = done;

      counter += 1;

      if (result || counter >= times) {
        if (done) {
          done = null;
          fin(!!result);
        }
        return;
      }

      if (incr) {
        if (incr === true) {
          timeout = doubler(timeout, counter);
        } else {
          timeout += (counter * incr);
        }
      }

      interval = setTimeout(run, timeout);
    }

    instance = function pollInstance(cb) { 
      if (interval) {
        clearTimeout(interval);
        interval = null; 
        if (done) {
          done(false);
        } 
        done = null;
        counter = 0;
      } 
      
      if (arguments.length) {
        if (!isval(cb, 'function')) {
          throw new TypeError('done callback must be a function');
        } 
        done = cb;
      }

      interval = setTimeout(run, every);
    };

    instance.ask = function pollAsk(n) {
      if (interval) {
        throw new SyntaxError('can not set ask limit during polling');
      } else if (!isval(n, 'number')) {
        throw new TypeError('ask limit must be a number');
      } 
      times = n; 
      return instance;
    };

    instance.every = function pollEvery(ms) { 
      if (interval) {
        throw new SyntaxError('can not set timeout during polling');
      } else if (!isval(ms, 'number')) {
        throw new TypeError('timout must be a number');
      } 
      every = ms; 
      return instance;
    };

    instance.incr = function pollIncr(ms) {
      if (interval) {
        throw new SyntexError('can not set increment during polling');
      } else if (!arguments.length || isval(ms, 'boolean')) {
        incr = !!ms;
      } else if (isval(ms, 'number')) {
        incr = ms;
      } else {
        throw new TypeError('increment must be a boolean or number');
      } 
      return instance;
    };

    return instance;
  })();
};
