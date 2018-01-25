var c = require('./constants-v2');
var EventEmitter = require("events").EventEmitter;

module.exports = function(serialPort){

  var o = ext(
    new EventEmitter,
    {
    constants:c,
    port:serialPort,
    boundOpen:false,
    closed:false,
    // write
    _inc:-1,
    _queue:[],
    _current:false,
    // parser.
    states:["Start", "GetSequenceNumber", "GetMessageSize1", "GetMessageSize2", "GetToken", "GetData", "GetChecksum", "Done"],
    state:0,
    pkt:false,
    // public interface,
    send:function(body,cb){
      if(this.closed) return setImmediate(function(){
        var e = new Error('this parser is closed.');
        e.code = "E_CLOSED";
        cb(e);
      });

      if(!Buffer.isBuffer(body)) body = new Buffer(body);

      var timeout = this._commandTimeout(body[0]);

      var messageLen = new Buffer([0,0]);
      messageLen.writeUInt16BE(body.length,0);    

      //MESSAGE_START,SEQUENCE_NUMBER,MESSAGE_SIZE,TOKEN,MESSAGE_BODY,CMD_READ/PROGRAM_FLASH/EEPROM,CHECKSUM
      var out = Buffer.concat([new Buffer([c.MESSAGE_START,this._seq(),messageLen[0],messageLen[1],c.TOKEN]),body]);
     
 
      var checksum = this.checksum(out);


      this._queue.push({buf:Buffer.concat([out,new Buffer([checksum])]),seq:this._inc,cb:cb,timeout:timeout});

      // if not waiting for another command to return. send this command
      this._send();
    },
    checksum:function(buf){

      var checksum = 0;
      for(var i=0;i<buf.length;++i){
        checksum ^= buf[i]; 
      }

      return checksum;
    },
    _seq:function(){
      this._inc++;
      if(this._inc > 0xff) this._inc = 0;
      return this._inc;
    },
    _commandTimeout:function(typeByte){
      //The total timeout period is from a command is sent to the answer must be completely
      //received. The total timeout period is 200 ms for the CMD_SIGN_ON command, 5
      //seconds for the CMD_READ/PROGRAM_FLASH/EEPROM commands, and 1
      //second for all other commands.
      timeout = 1000;
      if(typeByte === c.CMD_SIGN_ON) timeout = 200;
      else {
        // grab the constant names.
        var keys = Object.keys(c);
        for(var i=0;i<keys.length;++i){
          if(c[keys[i]] === typeByte) {
            if(keys[i].indexOf('CMD_READ') > -1 || keys[i].indexOf('PROGRAM_FLASH') > -1 || keys[i].indexOf('EEPROM') > -1) {
              timeout = 5000;
            }
            break;
          }
        }
      }
      return timeout;
    },
    _send:function(){
      if(this.closed) return false;
      if(this._current) return;
      if(!this._queue.length) return;   

      // if the serialport is not open yet. Check on node && chrome.
      if(!serialPort.fd && !serialPort.connectionId){
        var z = this;
        if(!this.boundOpen) serialPort.once('open',function(){
          z._send();
        });
        return;
      }

      var message = this._queue.shift();
      var current = this._current = {
        timeout:false,
        seq:message.seq,
        cb:message.cb
      };

      this._current
      this.state = 0;  
      var z = this;

      this.port.write(message.buf);
      this.port.drain(function(){
        if(current !== z._current) return z.emit('log',"current was no longer the current message after drain callback"); 
        current.timeout = setTimeout(function(){
          var err = new Error("stk500 timeout. "+message.timeout+"ms")
          err.code = "E_TIMEOUT";
          z._resolveCurrent(err);
        },message.timeout);
      });
      this.emit('rawinput',message.buf);
    },
    _handle:function(data){
      var current = this._current;
      this.emit('raw',data);
      if(!current) return this.emit('log','notice',"dropping data",'data');
      // put state machine here. proove this works foolio.
      
      for(var i=0;i<data.length;++i) {
        this._stateMachine(data.readUInt8(i));
      }
    },
    _pkt:function(){
      return {
        seq:-1,
        len:[],
        raw:[],
        message:[],
        checksum:0,
      }
    },
    _stateMachine:function(curByte){
      var pkt = this.pkt;
      switch(this.state) {
      case 0:
        // always reset packet.
        pkt = this.pkt = this._pkt();
        
        if (curByte !== 0x1b) {
          // the spec says "update statistics".
          // the avrdude source just logs this out and does not treat it as a hard failure
          // https://github.com/arduino/avrdude/blob/master/stk500v2.c#L399
          return this.emit('log','parser',"Invalid header byte expected 27 got: " + curByte);
        }
        ++this.state;
        break;
      case 1:
        if (curByte !== this._current.seq) {
          this.state = 0;
          return this.emit('log','parser',"Invalid sequence number. back to start. got: " + curByte);
        }
        pkt.seq = curByte;
        ++this.state;
        break;
      case 2:
        pkt.len.push(curByte);
        ++this.state;
        break;
      case 3:
        pkt.len.push(curByte);
        pkt.len = (pkt.len[0] << 8) | pkt.len[1];
        ++this.state;
        break;
      case 4:
        if (curByte !== 0x0e) {
          this.state = 0;
          pkt.error = new Error("Invalid message token byte. got: " + curByte);
          pkt.error.code = "E_PARSE";
          return this.emit('log','parser',this.pkt.error);
        }
        ++this.state;
        // can stk500 send empty messages? probably not. avrdude doesnt support it.
        if(!pkt.len) ++this.state;
        break;
      case 5:
        if(pkt.len === 0 && curByte === c.STATUS_CKSUM_ERROR){
          // the message was corrupted in transit or some such error.
          // i could retry send the message for these errors!
          // i dont buffer the message right now TODO
          pkt.error = new Error("send checksum error");
          pkt.error.code = "E_STATUS_CKSUM";

          // TODO check to see if the first byte of all messages is a has errored byte.
          // this checksum error is the only error checked for in avrdude source
        }

        pkt.message.push(curByte);
        if (--pkt.len == 0) ++this.state;
        break;
      case 6:
        
        pkt.checksum = this.checksum(pkt.raw);

        pkt.checksum = (pkt.checksum === curByte) ? true : false;
        if(!pkt.checksum){
          pkt.error = new Error("recv cecksum didn't match");
          pkt.error.code = "E_RECV_CKSUM";
        }

        pkt.message = new Buffer(pkt.message);
        this.emit('data',pkt);
        this.state++;// sets state to 7. the parser is not interested in any other bytes until a message is queued.
        pkt.len = pkt.message.length;
        delete pkt.raw;
        this._resolveCurrent(pkt.error?pkt.error:false,pkt);
        break;
      }

      if(pkt.raw) pkt.raw.push(curByte);

    },
    _resolveCurrent:function(err,pkt){
      var toCall = this._current;
      this._current = false;
      // write the next pending command.
      // on timeout i error out the whole pending stack if any command errors.
      // im fairly certain that this is the only responsible thing to do in the case of any parse error.

      var q = false;
      if(err.code == "E_PARSE" || err.code == "E_TIMEOUT" || this.closed){
        q = this.queue;
        this.queue = [];
      }

      clearTimeout(toCall.timeout);

      toCall.cb(err,pkt);
      if(q){
        var e = err;
        if(!this.closed) {
          e = new Error("a call queued before this call errored leaving the protocol in an upredictable state. timidly refusing to run queued commands.");
          e.code = "E_DEPENDENT";
          e.prev_code = err.code;
        } 
        while(q.lenth) q.shift()(err);
      }

      this._send();
    }
  });
 
  serialPort.on('data',dataHandler).once('error',cleanup).once('close',cleanup);

  return o;

  function dataHandler(data){
    o._handle(data);
  };

  function cleanup(err){

    // prevent new commands from writing to serial.
    o.closed = true;
    // stop sending data
    serialPort.removeListener('data',dataHandler);

    if(!err) {
      err = new Error('serial closed.');
      err.code = "E_CLOSED";
    }

    if(o._current) o._resolveCurrent(err);
    this.emit('closed');
  }

}

function ext(o1,o2){
  Object.keys(o2).forEach(function(k){
    o1[k] = o2[k];
  })
  return o1;
}
