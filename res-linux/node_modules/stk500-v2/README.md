stk500-v2
=========

[STK500](http://www.atmel.com/tools/stk500.aspx) javascript implementation for node and browserify

Fully javascript stk500v2 programmer. Allows you to program Arduinos straight from node (or browser for that matter). No more avrdude system calls or using the arduino IDE.

###INSTALL
```
npm install stk500-v2
```

####Program:

* this may not be true. anymore update before 1.0.0 release * 
You need an *unconnected* instance of (my fork of) Chris Williams's Node Serial Port at the correct speed for your chip (commonly 115200) with a raw parser.

```
var serialPort = new SerialPort.SerialPort(port.comName, {
  baudrate: 115200,
  parser: SerialPort.parsers.raw
}, false);

```

Then you can instantiate a programmer.

```
var stk500 = require('stk500-v2');

var programmerv2 = stk500(serialPort);

```

Beyond that you can send stk500 commands. For programming the process is a fairly strict series of async series including connect, reset, sync, setOptions (pagesize is the only necessary option), enterprogrammingmode, program, exitprogrammingmode, disconnect. See uno.js in examples.


###How to get a hex

You can compile by hand yourself with avrdude if you know your stuff, or you can just steal one from Arduino. First make sure you have verbosity enabled in your Arduino preferences: Arduino Preferences -> check Show verbose output during Compilation. Now when you build you'll see a ton of lines on screen. The last couple lines have what you need:
```
/var/folders/zp/bpw8zd0141j5zf7l8m_qtt8w0000gp/T/build6252696906929781517.tmp/Blink.cpp.hex 

Sketch uses 896 bytes (2%) of program storage space. Maximum is 32,256 bytes.
Global variables use 9 bytes (0%) of dynamic memory, leaving 2,039 bytes for local variables. Maximum is 2,048 bytes.
```
Grab that hex file and you're good to go.

###CHANGELOG

1.0.0
removed support for stk500 v1 because that is now another project 
updated readme
