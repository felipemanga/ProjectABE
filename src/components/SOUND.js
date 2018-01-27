class SOUND {
    
    static "@inject" = {
	pool:"pool"
    }
    
    constructor( DOM ){
	this.DOM = DOM;
	
	this.pool.add(this);

	this.ctx = new AudioContext();
	this.processor = null;
	let size = 4*1024;
	this.ch1Buffer = new Float32Array( size );
	this.ch2Buffer = new Float32Array( size );
	this.previousTick = 0;
	this.cycles = this.ctx.sampleRate / (16 * 1000 * 1000);
	this.bufferStart = 0;
	this.bufferEnd = 0;
	this.bufferStart2 = 0;
	this.bufferEnd2 = 0;

	DOM.element.controller = this;
	DOM.element.dispatchEvent( new Event("addperiferal", {bubbles:true}) );
	
	this.ch1.connect = DOM.element.getAttribute("pin-ch1");
	this.ch2.connect = DOM.element.getAttribute("pin-ch2");

	this.enableSound();
    }

    ch1 = {
	connect:null,
	onLowToHigh:function( tick ){
	    tick = (tick * this.cycles)>>>0;
	    let it = this.bufferStart, ch1 = this.ch1Buffer;
	    let delta = Math.min( this.ch1Buffer.length - it, tick - this.previousTick );
	    	    
	    for( ; delta; delta-- )
		ch1[it++] = 0;
	    ch1[it] = 0.5;
	    this.bufferStart = it;
	    
	    this.previousTick = tick;
	},
	
	onHighToLow:function( tick ){

	    tick = (tick * this.cycles)>>>0;
	    let it = this.bufferStart, ch1 = this.ch1Buffer;
	    let delta = Math.min( this.ch1Buffer.length - it, tick - this.previousTick );
	    	    
	    for( ; delta; delta-- )
		ch1[it++] = 0.5;
	    ch1[it] = 0;
	    this.bufferStart = it;
	    
	    this.previousTick = tick;

	}
    }

    ch2 = {
	connect:null,
	onLowToHigh:function( tick ){
	    tick = (tick * this.cycles)>>>0;
	    let it = this.bufferStart2, ch1 = this.ch2Buffer;
	    let delta = Math.min( this.ch2Buffer.length - it, tick - this.previousTick2 );
	    	    
	    for( ; delta; delta-- )
		ch1[it++] = 0;
	    ch1[it] = 0.25;
	    this.bufferStart2 = it;
	    
	    this.previousTick2 = tick;
	},
	
	onHighToLow:function( tick ){

	    tick = (tick * this.cycles)>>>0;
	    let it = this.bufferStart, ch1 = this.ch2Buffer;
	    let delta = Math.min( this.ch2Buffer.length - it, tick - this.previousTick2 );
	    	    
	    for( ; delta; delta-- )
		ch1[it++] = 0.25;
	    ch1[it] = 0;
	    this.bufferStart2 = it;
	    
	    this.previousTick2 = tick;

	}
    }

    enableSound(){
	if( this.processor )
	    return;


	this.splitter = this.ctx.createChannelSplitter(2);
	this.merger = this.ctx.createChannelMerger(2);
	this.splitter.connect( this.merger, 0, 0 );
	this.splitter.connect( this.merger, 1, 0 );
	this.splitter.connect( this.merger, 0, 1 );
	this.splitter.connect( this.merger, 1, 1 );
	this.merger.connect( this.ctx.destination );

	this.processor = this.ctx.createScriptProcessor( this.ch1Buffer.length, 0, 2 );
	this.processor.onaudioprocess = (evt) => {
	    
	    let ch = evt.outputBuffer.getChannelData(0);	   
	    ch.set( this.ch1Buffer );
	    for( let v = ch[this.bufferStart], i=this.bufferStart+1; i<ch.length; ++i )
		ch[i] = v;		

	    ch = evt.outputBuffer.getChannelData(1);
	    ch.set( this.ch2Buffer );
	    for( let v = ch[this.bufferStart2], i=this.bufferStart2+1; i<ch.length; ++i )
		ch[i] = v;		
	    
	    this.bufferStart = 0;
	    this.bufferStart2 = 0;
	    
	}

	this.processor.connect( this.splitter );
    }

    disableSound(){
	if( !this.processor )
	    return;
	this.merger.disconnect( this.ctx.destination );
	this.processor = null;
    }

    toggleSoundEnabled(){
	if( this.processor )
	    this.disableSound();
	else
	    this.enableSound();
    }

    setActiveView(){
	this.pool.remove(this);
	this.disableSound();
    }

    onPressKeyM(){
	this.toggleSoundEnabled();
    }    

}

module.exports = SOUND;
