var SerialPort = require("serialport");
var intel_hex = require('intel-hex');

// require version 1 of stk500
var stk500 = require('../').v1;

var async = require("async");
var fs = require('fs');

var usbttyRE = /(cu\.usb|ttyACM|COM\d+)/;

var data = fs.readFileSync('arduino-1.0.6/uno/Blink.cpp.hex', { encoding: 'utf8' });

var hex = intel_hex.parse(data).data;

//TODO standardize chip configs
//uno
var pageSize = 128;
var baud = 115200;
var delay1 = 1; //minimum is 2.5us, so anything over 1 fine?
var delay2 = 1;
var signature = new Buffer([0x1e, 0x95, 0x0f]);
var options = {
  pagesizelow:pageSize
};

SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {

    console.log("found " + port.comName);
 
  	if(usbttyRE.test(port.comName))
  	{

			console.log("trying" + port.comName);

			var serialPort = new SerialPort.SerialPort(port.comName, {
			  baudrate: baud,
			  parser: SerialPort.parsers.raw
			}, false);

  		var programmer = new stk500(serialPort);

  		async.series([
        programmer.connect.bind(programmer),
        programmer.reset.bind(programmer,delay1, delay2),
        programmer.sync.bind(programmer, 3),
        programmer.verifySignature.bind(programmer, signature),
        programmer.setOptions.bind(programmer, options),
        programmer.enterProgrammingMode.bind(programmer),
        programmer.upload.bind(programmer, hex, pageSize),
        programmer.exitProgrammingMode.bind(programmer)
        
      ], function(error){

        programmer.disconnect();

        if(error){
          console.log("programing FAILED: " + error);
          process.exit(1);
        }else{
          console.log("programing SUCCESS!");
          process.exit(0);
        }
  		});

    }else{
      console.log("skipping " + port.comName);
    }

  });
});

