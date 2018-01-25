
var stk500 = require('../');
var serialport = require('serialport');
var intel_hex = require('intel-hex');
var fs = require('fs');

var data = fs.readFileSync(__dirname+'/../../panda-attack/bootstrap.hex')+'';
var hex = intel_hex.parse(data).data;


var pageSize = 256;
var baud = 115200;
var delay1 = 10;
var delay2 = 1;

var signature = new Buffer([0x1e, 0xa8, 0x02]);

var options = {
  timeout:0xc8,
  stabDelay:0x64,
  cmdexeDelay:0x19,
  synchLoops:0x20,
  byteDelay:0x00,
  pollValue:0x53,
  pollIndex:0x03
};


var comName = '/dev/ttyACM0';

var serialPort = new serialport.SerialPort(comName, {
  baudrate: baud,
  parser: serialport.parsers.raw
}, function(){
  console.log('opened!',serialPort.opened);
  console.log(serialPort);
  serialPort.close();
});


var programmer = stk500(serialPort);

// debug
programmer.parser.on('rawinput',function(buf){
  console.log("->",buf.toString('hex'));
})

programmer.parser.on('raw',function(buf){
  console.log("<-",buf.toString('hex'));
})

// do it!
programmer.sync(5,function(err,data){
  console.log('callback sync',err," ",data)
});

programmer.verifySignature(signature,function(err,data){
  console.log('callback sig',err," ",data);
});


programmer.enterProgrammingMode(options,function(err,data){
   console.log('enter programming mode.',err,data);
});

programmer.upload( hex, pageSize,function(err,data){
  console.log('upload> ',err,data);

  programmer.exitProgrammingMode(function(err,data){
    console.log('exitProgrammingMode> ',err,data)
  })
});
