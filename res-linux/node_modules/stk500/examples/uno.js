var SerialPort = require("serialport");
var intel_hex = require('intel-hex');
var Stk500 = require('../');
var fs = require('fs');

var data = fs.readFileSync('arduino-1.0.6/uno/Blink.cpp.hex', { encoding: 'utf8' });

var hex = intel_hex.parse(data).data;

var board = {
  name: "Arduino Uno",
  baud: 115200,
  signature: new Buffer([0x1e, 0x95, 0x0f]),
  pageSize: 128,
  timeout: 400
};

var stk500 = new Stk500({quiet: true});

function upload(path, done){

  var serialPort = new SerialPort.SerialPort(path, {
    baudrate: board.baud,
  });

  serialPort.on('open', function(){

    stk500.bootload(serialPort, hex, board, function(error){

      serialPort.close(function (error) {
        console.log(error);
      });

      done(error);
    });

  });

}

if(process && process.argv && process.argv[2])
{
  upload(process.argv[2], function(error){
    if(!error)
    {
      console.log("programming succeeded!");
      process.exit(0);
    }
  });
}else
{
  console.log("call with a path like /dev/tty.something");
  process.exit(0);
}
