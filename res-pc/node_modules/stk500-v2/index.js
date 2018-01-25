//use strict might have screwed up my this context, or might not have.. 

var async = require("async");
var bufferEqual = require('buffer-equal');
var parser = require('./lib/parser-v2.js');
var c = require('./lib/constants-v2.js');

var CMD_SIGN_ON = 0x01;
var CMD_LOAD_ADDRESS = 0x06;
var CMD_ENTER_PROGMODE_ISP = 0x10;
var CMD_LEAVE_PROGMODE_ISP = 0x11;
var CMD_PROGRAM_FLASH_ISP = 0x13;
var CMD_SPI_MULTI = 0x1D;

var _options = {
  timeout:0xc8,
  stabDelay:0x64,
  cmdexeDelay:0x19,
  synchLoops:0x20,
  byteDelay:0x00,
  pollValue:0x53,
  pollIndex:0x03
};

function stk500(port) {
  if (!(this instanceof stk500)) 
    return new stk500(port);

  var self = this;

  self.parser = parser(port);

  // use these constants. instead of requiring them above because that should be a different module.
  self.constants = self.parser.constants;
  self.serialPort = port;
  
};

stk500.prototype.sync = function(attempts, done) {
  var self = this;
  var tries = 1;

  var cmd = new Buffer([CMD_SIGN_ON]);

  attempt();
  function attempt(){
  	tries=tries+1;

  	self.parser.send(cmd, function(error, pkt){


      var res;
      if(!error){
        // message response format for CMD_SIGN_ON
        // 1 CMD_SIGN_ON
        // 1 STATUS_CMD_OK
        // 1 8 - length of sig string
        // 8 the signature string - "STK500_2" or "AVRISP_2"
        var response = pkt.message;

        if(response[0] !== c.CMD_SIGN_ON){
          // something is wrong. look for error in constants. 
          error = new Error('command response was not CMD_SIGN_ON. '+response[0]); 
          error.code = "E_CMD_ERROR";
        } else if(response[1] !== c.STATUS_CMD_OK){
          // malformed. check command status constants and return error
          error = new Error('command status was not ok. '+response[1]); 
          error.code = "E_CMD_STATUS";
        } else {
          var len = response[2];
          res = response.slice(3)+'';
          if(res.length != len) {
            // something is wrong but all signs point to right, 
          }
        }
      }

      if(error && tries<=attempts){
        //console.log("failed attempt again");
        return attempt();
      }

      done(error,res);
  	});
  }
};


////// BELOW HERE IS TODO i'm mid refactor.


stk500.prototype.reset = function(delay1, delay2, done){
  //console.log("reset");

  var self = this;

  async.series([
    function(cbdone) {
    	//console.log("asserting");
      self.serialPort.set({rts:true, dtr:true}, function(result){
      	//console.log("asserted");
      	if(result) cbdone(result);
      	else cbdone();
      });
    },
    function(cbdone) {
    	//console.log("wait");
      setTimeout(cbdone, delay1);
    },
    function(cbdone) {
    	//console.log("clearing");
      self.serialPort.set({rts:false, dtr:false}, function(result){
      	//console.log("clear");
      	if(result) cbdone(result);
      	else cbdone();
      });
    },
    function(cbdone) {
    	//console.log("wait");
      setTimeout(cbdone, delay2);
    }],
  	function(error) {
  		done(error);
  	}
  );
};


stk500.prototype.verifySignature = function(signature, done) {
  //console.log("verify signature");

  this.getSignature(function(error, reportedSignature){

  	//console.log(reportedSignature);
  	//console.log(signature);
  	if(!bufferEqual(signature, reportedSignature)){
  		done(new Error("signature doesnt match. Found: " + reportedSignature.toString('hex'), error));
  	}else{
  		done();
  	}

  });
}

stk500.prototype.getSignature = function(done) {
  var self = this;

  var reportedSignature = new Buffer(3);

    async.series([
      function(cbdone){

      	var numTx = 0x04;
      	var numRx = 0x04;
      	var rxStartAddr = 0x00;

  			var cmd = new Buffer([CMD_SPI_MULTI, numTx, numRx, rxStartAddr, 0x30, 0x00, 0x00, 0x00]);

  			self.parser.send(cmd, function(error, pkt) {

  				if (pkt && pkt.message && pkt.message.length >= 6)
  				{
  					var sig = pkt.message[5];
  					reportedSignature.writeUInt8(sig, 0);
  				}

  				// self.matchReceive(new Buffer([Resp_STK_INSYNC, Resp_STK_OK]), timeout, function(error){
  			  	cbdone(error);
  				// });
  			});

      },
      function(cbdone){

      	var numTx = 0x04;
      	var numRx = 0x04;
      	var rxStartAddr = 0x00;

  			var cmd = new Buffer([CMD_SPI_MULTI, numTx, numRx, rxStartAddr, 0x30, 0x00, 0x01, 0x00]);

  			self.parser.send(cmd, function(error, pkt) {
  				//console.log("sent sig2");

  				if (pkt && pkt.message && pkt.message.length >= 6)
  				{
  					var sig = pkt.message[5];
  					reportedSignature.writeUInt8(sig, 1);
  				}

  				// self.matchReceive(new Buffer([Resp_STK_INSYNC, Resp_STK_OK]), timeout, function(error){
  			  	cbdone(error);
  				// });
  			});

      },
      function(cbdone){

      	var numTx = 0x04;
      	var numRx = 0x04;
      	var rxStartAddr = 0x00;

  			var cmd = new Buffer([CMD_SPI_MULTI, numTx, numRx, rxStartAddr, 0x30, 0x00, 0x02, 0x00]);

  			self.parser.send(cmd, function(error, pkt) {
  				//console.log("sent sig3");

  				if (pkt && pkt.message && pkt.message.length >= 6)
  				{
  					var sig = pkt.message[5];
  					reportedSignature.writeUInt8(sig, 2);
  				}

  				// self.matchReceive(new Buffer([Resp_STK_INSYNC, Resp_STK_OK]), timeout, function(error){
  			  	cbdone(error);
  				// });
  			});

      }
    ],
    function(error) {
      //console.log("read signature done");
      done(error, reportedSignature);
    });

}


stk500.prototype.enterProgrammingMode = function(options, done) {
  //console.log("send enter programming mode");

  var self = this;

  var args = Array.prototype.slice.call(arguments);
  done = args.pop();
  if (typeof(done) !== 'function') {
    done = null;
  }

  options = (typeof options !== 'function') && options || {};

  options.timeout = options.timeout || _options.timeout;
  options.stabDelay = options.stabDelay || _options.stabDelay;
  options.cmdexeDelay = options.cmdexeDelay || _options.cmdexeDelay;
  options.synchLoops = options.synchLoops || _options.synchLoops;
  options.byteDelay = options.byteDelay || _options.byteDelay;
  options.pollValue = options.pollValue || _options.pollValue;
  options.pollIndex = options.pollIndex || _options.pollIndex;

  var cmd1 = 0xac;
  var cmd2 = 0x53;
  var cmd3 = 0x00;
  var cmd4 = 0x00;

  var cmd = new Buffer([CMD_ENTER_PROGMODE_ISP, options.timeout, options.stabDelay, options.cmdexeDelay, options.synchLoops, options.byteDelay, options.pollValue, options.pollIndex, cmd1, cmd2, cmd3, cmd4]);

  self.parser.send(cmd, function(error, results) {
  	//console.log("sent enter programming mode");
  	// self.matchReceive(new Buffer([Resp_STK_INSYNC, Resp_STK_OK]), timeout, function(error){
    	done(error);
  	// });
  });
};


stk500.prototype.loadAddress = function(useaddr, done) {
  //console.log("load address");
  var self = this;

  msb = (useaddr >> 24) & 0xff | 0x80;
  xsb = (useaddr >> 16) & 0xff;
  ysb = (useaddr >> 8) & 0xff;
  lsb = useaddr & 0xff;

  var cmdBuf = new Buffer([CMD_LOAD_ADDRESS, msb, xsb, ysb, lsb]);

  self.parser.send(cmdBuf, function(error, results) {
  	//console.log("confirm load address");
    // self.matchReceive(new Buffer([Resp_STK_INSYNC, Resp_STK_OK]), timeout, function(error){
    	done(error);
    // });

  });

};


stk500.prototype.loadPage = function(writeBytes, done) {
  //console.log("load page");
  var self = this;

  var bytesMsb = writeBytes.length >> 8; //Total number of bytes to program, MSB first
  var bytesLsb = writeBytes.length & 0xff; //Total number of bytes to program, MSB first
  var mode = 0xc1; //paged, rdy/bsy polling, write page
  var delay = 0x0a; //Delay, used for different types of programming termination, according to mode byte
  var cmd1 = 0x40; // Load Page, Write Program Memory
  var cmd2 = 0x4c; // Write Program Memory Page
  var cmd3 = 0x20; //Read Program Memory
  var poll1 = 0x00; //Poll Value #1
  var poll2 = 0x00; //Poll Value #2 (not used for flash programming)


  var cmdBuf = new Buffer([CMD_PROGRAM_FLASH_ISP, bytesMsb, bytesLsb, mode, delay, cmd1, cmd2, cmd3, poll1, poll2]);

  cmdBuf = Buffer.concat([cmdBuf,writeBytes]);

  self.parser.send(cmdBuf, function(error, results) {
  	//console.log("loaded page");

  	// self.matchReceive(new Buffer([Resp_STK_INSYNC, Resp_STK_OK]), timeout, function(error){
  		done(error);
  	// });

  });
};

stk500.prototype.upload = function(hex, pageSize, done) {
  //console.log("program");

  var pageaddr = 0;
  var writeBytes;
  var useaddr;

  var self = this;

  // program individual pages
  async.whilst(
    function() { return pageaddr < hex.length; },
    function(pagedone) {
  		//console.log("program page");
      async.series([
        function(cbdone){
        	useaddr = pageaddr >> 1;
        	cbdone();
        },
        function(cbdone){
        	self.loadAddress(useaddr, cbdone);
        },
        function(cbdone){

  				writeBytes = hex.slice(pageaddr, (hex.length > pageSize ? (pageaddr + pageSize) : hex.length - 1))
          cbdone();
        },
        function(cbdone){
          self.loadPage(writeBytes, cbdone);
        },
        function(cbdone){
  				//console.log("programmed page");
          pageaddr =  pageaddr + writeBytes.length;
          setTimeout(cbdone, 4);
        }
      ],
      function(error) {
        //console.log("page done");
        pagedone(error);
      });
    },
    function(error) {
      //console.log("upload done");
      done(error);
    }
  );
};

stk500.prototype.exitProgrammingMode = function(done) {
  //console.log("send leave programming mode");
  var self = this;

  var preDelay = 0x01;
  var postDelay = 0x01;

  var cmd = new Buffer([CMD_LEAVE_PROGMODE_ISP, preDelay, postDelay]);

  self.parser.send(cmd, function(error, results) {
  	//console.log("sent leave programming mode");
  	// self.matchReceive(new Buffer([Resp_STK_INSYNC, Resp_STK_OK]), timeout, function(error){
  		done(error);
  	// });
  });
};

stk500.prototype.verify = function(hex, done) {
  // console.log("verify");
  // var self = this;

  // serial.parser.send([Cmnd_STK_LOAD_ADDRESS, addr_low, addr_high, Sync_CRC_EOP]) n times
  // self.matchReceive([Resp_STK_INSYNC, Resp_STK_OK]);
  // serial.send ([Cmnd_STK_READ_PAGE, bytes_high, bytes_low, memtype, Sync_CRC_EOP]) n times
  // self.matchReceive([Resp_STK_INSYNC].concat(writeBytes));
  done();
};

//todo convenience function
stk500.prototype.bootload = function (chip, hex, done){
  done();
};


// export the class
module.exports = stk500;
