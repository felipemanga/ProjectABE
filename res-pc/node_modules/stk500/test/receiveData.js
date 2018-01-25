var Statics = require('../lib/statics');
var receiveData = require('../lib/receiveData');
var es = require('event-stream');
var bufferEqual = require('buffer-equal');

describe('receiveData', function () {
  beforeEach(function () {
    this.port = es.through(function (data) {
      this.emit('data', data);
    });
  });

  it('should receive a matching buffer', function (done) {
    var inputBuffer = Statics.OK_RESPONSE;
    receiveData(this.port, 10, inputBuffer.length, function (err, data) {
      if (err) {
        return done(err);
      }
      Should.not.exist(err);
      var matched = bufferEqual(data, inputBuffer);
      Should.exist(matched);
      matched.should.equal(true);
      done();
    });
    this.port.write(inputBuffer);
  });

  it('should timeout', function (done) {
    var inputBuffer = Statics.OK_RESPONSE;
    receiveData(this.port, 10, inputBuffer.length, function (err, data) {
      if (err) {
        err.message.should.equal('receiveData timeout after 10ms');
        return done();
      }
      done(new Error('Did not time out'));
    });
    this.port.write(inputBuffer.slice(0, 1));
  });

  it('should receive a buffer in chunks', function (done) {
    var inputBuffer = Statics.OK_RESPONSE;
    receiveData(this.port, 10, inputBuffer.length, function (err, data) {
      if (err) {
        return done(err);
      }
      Should.not.exist(err);
      var matched = bufferEqual(data, inputBuffer);
      Should.exist(matched);
      matched.should.equal(true);
      done();
    });
    this.port.write(inputBuffer.slice(0, 1));
    this.port.write(inputBuffer.slice(1, 2));
  });
});
