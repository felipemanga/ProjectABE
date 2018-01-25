var sinon = require("sinon");
var Statics = require('../lib/statics');
var sendCommand = require('../lib/sendCommand');
var es = require('event-stream');
var bufferEqual = require('buffer-equal');

var EventEmitter = require('events').EventEmitter;

var hardware = new EventEmitter();

hardware.write = function(data, callback){
  callback(null, data);
};

hardware.insert = function(data){
  this.emit('data', data);
};

describe('sendCommands', function () {

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    hardware.removeAllListeners();
    sandbox.restore();
  });


  it('should write a buffer command', function (done) {
    var writeSpy = sandbox.spy(hardware, 'write');
    var cmd = new Buffer([Statics.Cmnd_STK_GET_SYNC, Statics.Sync_CRC_EOP]);
    var opt = {
      cmd: cmd,
      responseData: Statics.OK_RESPONSE,
      timeout: 10
    };
    sendCommand(hardware, opt, function (err, data) {
      var matched = bufferEqual(writeSpy.args[0][0], cmd);
      Should.exist(matched);
      matched.should.equal(true);
      done();
    });
    process.nextTick(function(){
      hardware.insert(Statics.OK_RESPONSE);
    });
  });

  it('should write an array command', function (done) {
    var writeSpy = sandbox.spy(hardware, 'write');
    var opt = {
      cmd: [
        Statics.Cmnd_STK_GET_SYNC
      ],
      responseData: Statics.OK_RESPONSE,
      timeout: 10
    };
    sendCommand(hardware, opt, function (err, data) {
      var matched = bufferEqual(writeSpy.args[0][0], new Buffer([Statics.Cmnd_STK_GET_SYNC, Statics.Sync_CRC_EOP]));
      Should.exist(matched);
      matched.should.equal(true);
      done();
    });
    process.nextTick(function(){
      hardware.insert(Statics.OK_RESPONSE);
    });
  });

  it('should timeout', function (done) {
    var opt = {
      cmd: [
        Statics.Cmnd_STK_GET_SYNC
      ],
      responseData: Statics.OK_RESPONSE,
      timeout: 10
    };

    sendCommand(hardware, opt, function (err, data) {
      if (err) {
        err.message.should.equal('Sending 3020: receiveData timeout after 10ms');
        return done();
      }
      done(new Error('Did not time out'));
      done();
    });

  });

  it('should get n number of bytes', function (done) {
    var opt = {
      cmd: [
        Statics.Cmnd_STK_GET_SYNC
      ],
      responseLength: 2,
      timeout: 10
    };

    sendCommand(hardware, opt, function (err, data) {
      if (err) {
        return done(err);
      }
      Should.not.exist(err);
      var matched = bufferEqual(data, Statics.OK_RESPONSE);
      Should.exist(matched);
      matched.should.equal(true);
      done();

    });
    process.nextTick(function(){
      hardware.insert(Statics.OK_RESPONSE);
    });
  });

  it('should match response', function (done) {
    var opt = {
      cmd: [
        Statics.Cmnd_STK_GET_SYNC
      ],
      responseData: Statics.OK_RESPONSE,
      timeout: 10
    };

    sendCommand(hardware, opt, function (err, data) {
      if (err) {
        return done(err);
      }
      Should.not.exist(err);
      var matched = bufferEqual(data, Statics.OK_RESPONSE);
      Should.exist(matched);
      matched.should.equal(true);
      done();

    });
    process.nextTick(function(){
      hardware.insert(Statics.OK_RESPONSE);
    });
  });

});
