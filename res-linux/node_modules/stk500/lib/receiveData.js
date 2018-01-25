var Statics = require('./statics');

var startingBytes = [
  Statics.Resp_STK_INSYNC
];

module.exports = function (stream, timeout, responseLength, callback) {
  var buffer = new Buffer(0);
  var started = false;
  var timeoutId = null;
  var handleChunk = function (data) {
    var index = 0;
    while (!started && index < data.length) {
      var byte = data[index];
      if (startingBytes.indexOf(byte) !== -1) {
        data = data.slice(index, data.length - index);
        started = true;
      }
      index++;
    }
    if (started) {
      buffer = Buffer.concat([buffer, data]);
    }
    if (buffer.length > responseLength) {
      // or ignore after
      return finished(new Error('buffer overflow '+buffer.length+' > '+responseLength));
    }
    if (buffer.length == responseLength) {
      finished();
    }
  };
  var finished = function (err) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    // VALIDATE TERMINAL BYTE?
    stream.removeListener('data', handleChunk);
    callback(err, buffer);
  };
  if (timeout && timeout > 0) {
    timeoutId = setTimeout(function () {
      timeoutId = null;
      finished(new Error('receiveData timeout after ' + timeout + 'ms'));
    }, timeout);
  }
  stream.on('data', handleChunk);
};
