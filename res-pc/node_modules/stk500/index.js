var async = require("async");
var bufferEqual = require('buffer-equal');
var Statics = require('./lib/statics');
var sendCommand = require('./lib/sendCommand');

var stk500 = function (opts) {
  this.opts = opts || {};
  this.quiet = this.opts.quiet || false;
  if(this.quiet){
    this.log = function(){};
  }else{
    if(window){
      this.log = console.log.bind(window);
    }else{
      this.log = console.log;
    }
  }
}

stk500.prototype.sync = function (stream, attempts, timeout, done) {
	this.log("sync");
	var self = this;
	var tries = 1;

  var opt = {
    cmd: [
      Statics.Cmnd_STK_GET_SYNC
    ],
    responseData: Statics.OK_RESPONSE,
    timeout: timeout
  };
  function attempt () {
		tries=tries+1;
    sendCommand(stream, opt, function (err, data) {
			if (err && tries <= attempts) {
        if (err) {
          self.log(err);
        }
				self.log("failed attempt again", tries);
				return attempt();
      }
      self.log('sync complete', err, data, tries);
      done(err, data);
    });
  }
  attempt();
};

stk500.prototype.verifySignature = function (stream, signature, timeout, done) {
	this.log("verify signature");
	var self = this;
	match = Buffer.concat([
    new Buffer([Statics.Resp_STK_INSYNC]),
    signature,
    new Buffer([Statics.Resp_STK_OK])
  ]);

  var opt = {
    cmd: [
      Statics.Cmnd_STK_READ_SIGN
    ],
    responseLength: match.length,
    timeout: timeout
  };
  sendCommand(stream, opt, function (err, data) {
    if(data){
      self.log('confirm signature', err, data, data.toString('hex'));
    }else{
      self.log('confirm signature', err, 'no data');
    }
    done(err, data);
  });
};

stk500.prototype.getSignature = function (stream, timeout, done) {
	this.log("get signature");
  var opt = {
    cmd: [
      Statics.Cmnd_STK_READ_SIGN
    ],
    responseLength: 5,
    timeout: timeout
  };
  sendCommand(stream, opt, function (err, data) {
    this.log('getSignature', err, data);
    done(err, data);
  });
};

stk500.prototype.setOptions = function (stream, options, timeout, done) {
	this.log("set device");
	var self = this;
	
  var opt = {
    cmd: [
      Statics.Cmnd_STK_SET_DEVICE,
      options.devicecode || 0,
      options.revision || 0,
      options.progtype || 0,
      options.parmode || 0,
      options.polling || 0,
      options.selftimed || 0,
      options.lockbytes || 0,
      options.fusebytes || 0,
      options.flashpollval1 || 0,
      options.flashpollval2 || 0,
      options.eeprompollval1 || 0,
      options.eeprompollval2 || 0,
      options.pagesizehigh || 0,
      options.pagesizelow || 0,
      options.eepromsizehigh || 0,
      options.eepromsizelow || 0,
      options.flashsize4 || 0,
      options.flashsize3 || 0,
      options.flashsize2 || 0,
      options.flashsize1 || 0
    ],
    responseData: Statics.OK_RESPONSE,
    timeout: timeout
  };
  sendCommand(stream, opt, function (err, data) {
    self.log('setOptions', err, data);
    if (err) {
      return done(err);
    }
    done();
  });
};

stk500.prototype.enterProgrammingMode = function (stream, timeout, done) {
	this.log("send enter programming mode");
  var self = this;
  var opt = {
    cmd: [
      Statics.Cmnd_STK_ENTER_PROGMODE
    ],
    responseData: Statics.OK_RESPONSE,
    timeout: timeout
  };
  sendCommand(stream, opt, function (err, data) {
		self.log("sent enter programming mode", err, data);
    done(err, data);
  });
};

stk500.prototype.loadAddress = function (stream, useaddr, timeout, done) {
	this.log("load address");
  var self = this;
	var addr_low = useaddr & 0xff;
	var addr_high = (useaddr >> 8) & 0xff;
  var opt = {
    cmd: [
      Statics.Cmnd_STK_LOAD_ADDRESS,
      addr_low,
      addr_high
    ],
    responseData: Statics.OK_RESPONSE,
    timeout: timeout
  };
  sendCommand(stream, opt, function (err, data) {
		self.log('loaded address', err, data);
    done(err, data);
  });
};

stk500.prototype.loadPage = function (stream, writeBytes, timeout, done) {
	this.log("load page");
  var self = this;
	var bytes_low = writeBytes.length & 0xff;
	var bytes_high = writeBytes.length >> 8;

	var cmd = Buffer.concat([
    new Buffer([Statics.Cmnd_STK_PROG_PAGE, bytes_high, bytes_low, 0x46]),
    writeBytes,
    new Buffer([Statics.Sync_CRC_EOP])
  ]);

  var opt = {
    cmd: cmd,
    responseData: Statics.OK_RESPONSE,
    timeout: timeout
  };
  sendCommand(stream, opt, function (err, data) {
		self.log('loaded page', err, data);
    done(err, data);
  });
};

stk500.prototype.upload = function (stream, hex, pageSize, timeout, done) {
	this.log("program");

	var pageaddr = 0;
	var writeBytes;
	var useaddr;

	var self = this;

	// program individual pages
  async.whilst(
    function() { return pageaddr < hex.length; },
    function(pagedone) {
			self.log("program page");
      async.series([
      	function(cbdone){
      		useaddr = pageaddr >> 1;
      		cbdone();
      	},
      	function(cbdone){
      		self.loadAddress(stream, useaddr, timeout, cbdone);
      	},
        function(cbdone){

					writeBytes = hex.slice(pageaddr, (hex.length > pageSize ? (pageaddr + pageSize) : hex.length - 1))
        	cbdone();
        },
        function(cbdone){
        	self.loadPage(stream, writeBytes, timeout, cbdone);
        },
        function(cbdone){
					self.log("programmed page");
        	pageaddr =  pageaddr + writeBytes.length;
        	setTimeout(cbdone, 4);
        }
      ],
      function(error) {
      	self.log("page done");
      	pagedone(error);
      });
    },
    function(error) {
    	self.log("upload done");
    	done(error);
    }
  );
};

stk500.prototype.exitProgrammingMode = function (stream, timeout, done) {
	this.log("send leave programming mode");
  var self = this;
  var opt = {
    cmd: [
      Statics.Cmnd_STK_LEAVE_PROGMODE
    ],
    responseData: Statics.OK_RESPONSE,
    timeout: timeout
  };
  sendCommand(stream, opt, function (err, data) {
		self.log('sent leave programming mode', err, data);
    done(err, data);
  });
};

stk500.prototype.verify = function (stream, hex, pageSize, timeout, done) {
	this.log("verify");

	var pageaddr = 0;
	var writeBytes;
	var useaddr;

	var self = this;

	// verify individual pages
  async.whilst(
    function() { return pageaddr < hex.length; },
    function(pagedone) {
			self.log("verify page");
      async.series([
      	function(cbdone){
      		useaddr = pageaddr >> 1;
      		cbdone();
      	},
      	function(cbdone){
      		self.loadAddress(stream, useaddr, timeout, cbdone);
      	},
        function(cbdone){

					writeBytes = hex.slice(pageaddr, (hex.length > pageSize ? (pageaddr + pageSize) : hex.length - 1))
        	cbdone();
        },
        function(cbdone){
        	self.verifyPage(stream, writeBytes, pageSize, timeout, cbdone);
        },
        function(cbdone){
					self.log("verified page");
        	pageaddr =  pageaddr + writeBytes.length;
        	setTimeout(cbdone, 4);
        }
      ],
      function(error) {
      	self.log("verify done");
      	pagedone(error);
      });
    },
    function(error) {
    	self.log("verify done");
    	done(error);
    }
  );
};

stk500.prototype.verifyPage = function (stream, writeBytes, pageSize, timeout, done) {
	this.log("verify page");
	var self = this;
	match = Buffer.concat([
    new Buffer([Statics.Resp_STK_INSYNC]),
    writeBytes,
    new Buffer([Statics.Resp_STK_OK])
  ]);

	var size = writeBytes.length >= pageSize ? pageSize : writeBytes.length;

  var opt = {
    cmd: [
      Statics.Cmnd_STK_READ_PAGE,
      (size>>8) & 0xff,
      size & 0xff,
      0x46
    ],
    responseLength: match.length,
    timeout: timeout
  };
  sendCommand(stream, opt, function (err, data) {
		self.log('confirm page', err, data, data.toString('hex'));
    done(err, data);
  }); 
};

stk500.prototype.bootload = function (stream, hex, opt, done) {

  var parameters = {
    pagesizehigh: (opt.pagesizehigh<<8 & 0xff),
    pagesizelow: opt.pagesizelow & 0xff
  }

  async.series([
    this.sync.bind(this, stream, 3, opt.timeout),
    this.verifySignature.bind(this, stream, opt.signature, opt.timeout),
    this.setOptions.bind(this, stream, parameters, opt.timeout),
    this.enterProgrammingMode.bind(this, stream, opt.timeout),
    this.upload.bind(this, stream, hex, opt.pageSize, opt.timeout),
    this.verify.bind(this, stream, hex, opt.pageSize, opt.timeout),
    this.exitProgrammingMode.bind(this, stream, opt.timeout)
  ], function(error){
  	return done(error);
  });
};

module.exports = stk500;
