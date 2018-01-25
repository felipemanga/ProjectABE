##stk500
Fully javascript stk500v1 programmer. Allows you to program Arduinos straight from node (or browser for that matter -- see [browserdude](github.com/jacobrosenthal/browserdude). No more avrdude system calls or using the arduino IDE.

Huge thanks to Pinoccio for their stk500v2 browser implementation (for Arduino Megas, etc) from which I stole whole lines of code. We're working to unify our programmers with some sort of overarching module. For now see [js-stk500](https://github.com/Pinoccio/js-stk500) to program Arduino Mega and Pinoccio's

###INSTALL
```
npm install stk500
```

####Program:

You need a stream object, commonly [serialport](https://www.npmjs.com/package/serialport) with the correct speed for your chip (115200 for the uno) and path to your device  :
```
var SerialPort = require("serialport");
var serialPort = new SerialPort.SerialPort("/dev/tty.something", {
baudrate: 115200,
});
```

We've included some examples hexes, and you can parse them with the [intel-hex](https://www.npmjs.com/package/intel-hex):
```
var intel_hex = require('intel-hex');
var fs = require('fs');

var data = fs.readFileSync('arduino-1.0.6/uno/StandardFirmata.cpp.hex', { encoding: 'utf8' });

var hex = intel_hex.parse(data).data;

```

With [serialport](https://www.npmjs.com/package/serialport), you need to wait for your open event, but then you can bootload:
```
var Stk500 = require('stk500');

serialPort.on('open', function(){

	var board = {
	  signature: new Buffer([0x1e, 0x95, 0x0f]),
	  pageSize: 128,
	  timeout: 400
	};

	Stk500.bootload(serialPort, hex, board, function(error){

	  serialPort.close(function (error) {
	    console.log(error);
	  });

	  done(error);
	});

});

```


###How to get a hex

You can compile by hand yourself with avrdude if you know your stuff, or you can just steal one from Arduino. First make sure you have verbosity enabled in your Arduino preferences: Arduino Preferences -> check Show verbose output during Compilation. Now when you build you'll see a ton of lines on screen. The last couple lines have what you need:
```
/var/folders/zp/bpw8zd0141j5zf7l8m_qtt8w0000gp/T/build6252696906929781517.tmp/Blink.cpp.hex 

Sketch uses 896 bytes (2%) of program storage space. Maximum is 32,256 bytes.
Global variables use 9 bytes (0%) of dynamic memory, leaving 2,039 bytes for local variables. Maximum is 2,048 bytes.
```
Grab that hex file and you're good to go.

###CHANGELOG
0.0.1 
first

0.0.2
Added loading from fs to example, some example hexes from arduino 1.0.6 for Uno, and instructions on how to find a hex file to load.

0.0.3
Bugs squashed leading to much more stable getsync and less attempts necessary to successfuly programmin. Slight refactor in example and clearer console.log messaging.

0.0.4
Slight require change for browserfy-ability and a few more touchups in example

0.0.5
Fixed instability issue especially in chrome where listeners were not being deregistered

0.0.6
Added ability to verify device signature.

1.0.0
* Nearly complete rearchitecture.
* Moved away from constructor.
* Take a stream object instead of an explicit node serial object now, though node serial is a stream so no change for most users.
* No connect, reset or disconnect anymore, it is now your job to send it a recently reset (opened) connection thats ready to go.
* Added verify command
* Added bootload convenience function that takes a board options object
* Added more examples

1.0.1
Clean up dependencies

1.0.2
Remove postinstall

1.0.3
* Better errors
* More Tests