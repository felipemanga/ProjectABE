var bufferEqual = require('buffer-equal');
var receiveData = require('./receiveData');
var Statics = require('./statics');

module.exports = function (stream, opt, callback) {
  var timeout = opt.timeout || 0;
  var startingBytes = [
    Statics.Resp_STK_INSYNC,
    Statics.Resp_STK_NOSYNC
  ];
  var responseData = null;
  var responseLength = 0;
  var error;

  if (opt.responseData && opt.responseData.length > 0) {
    responseData = opt.responseData;
  }
  if (responseData) {
    responseLength = responseData.length;
  }
  if (opt.responseLength) {
    responseLength = opt.responseLength;
  }
  var cmd = opt.cmd;
  if (cmd instanceof Array) {
    cmd = new Buffer(cmd.concat(Statics.Sync_CRC_EOP));
  }

  stream.write(cmd, function (err) {
    if (err) {
      error = new Error('Sending ' + cmd.toString('hex') + ': ' + err.message);
      return callback(error);
    }
    receiveData(stream, timeout, responseLength, function (err, data) {
      if (err) {
        error = new Error('Sending ' + cmd.toString('hex') + ': ' + err.message);
        return callback(error);
      }

      if (responseData && !bufferEqual(data, responseData)) {
        error = new Error(cmd + ' response mismatch: '+data.toString('hex')+', '+responseData.toString('hex'));
        return callback(error);
      }
      callback(null, data);
    });
  });
};
