class SOUND {
    
    static "@inject" = {
	pool:"pool"
    }
    
    constructor( DOM ){
	this.DOM = DOM;
	return;
	
	this.buffer = new Uint8ClampedArray( 4096 );
	
	this.pool.add(this);

	this.ctx = new AudioContext();
	this.processor = null;
	let size = 4*1024;
	this.ch1Buffer = new Uint8ClampedArray( size );
	this.ch2Buffer = new Uint8ClampedArray( size );
	this.previousTick = 0;
	this.cycles = this.ctx.sampleRate / (16 * 1000 * 1000);
	this.bufferStart = 0;
	this.bufferEnd = 0;

	DOM.element.controller = this;
	DOM.element.dispatchEvent( new Event("addperiferal", {bubbles:true}) );
	
	this.ch1.connect = DOM.element.getAttribute("pin-ch1");
	this.ch2.connect = DOM.element.getAttribute("pin-ch2");

	// this.enableSound();
    }

    ch1 = {
	connect:null,
	onLowToHigh:function( tick ){
	    tick = (tick * this.cycles)>>>0;
	    let it = this.bufferEnd, ch1 = this.ch1Buffer;
	    let delta = Math.min( this.ch1Buffer.length*8, tick - this.previousTick );
	    let deltaBytes = delta>>3, start = this.bufferStart;
	    	    
	    for( ; deltaBytes; deltaBytes-- ){
		ch1[it] = 0;
		it = (it+1) % ch1.length;
		if( it == start ) start++;
	    }
	    ch1[it] = 0xFF;
	    this.bufferStart = start % ch1.length;	    
	    
	    this.previousTick = tick;
	},
	
	onHighToLow:function( tick ){

	    tick = (tick * this.cycles)>>>0;
	    let it = this.bufferEnd, ch1 = this.ch1Buffer;
	    let delta = Math.min( this.ch1Buffer.length*8, tick - this.previousTick );
	    let deltaBytes = delta>>3, start = this.bufferStart;
	    	    
	    for( ; deltaBytes; deltaBytes-- ){
		ch1[it] = 0xFF;
		it = (it+1) % ch1.length;
		if( it == start ) start++;
	    }
	    ch1[it] = 0;
	    this.bufferStart = start % ch1.length;	    
	    
	    this.previousTick = tick;

	}
    }

    ch2 = {
	connect:null
    }

    enableSound(){
	if( this.processor )
	    return;

	this.processor = this.ctx.createScriptProcessor( this.ch1Buffer.length, 0, 2 );
	this.processor.onaudioprocess = (evt) => {
	    
	    let ch = evt.outputBuffer.getChannelData(0);	   
	    ch.set( this.ch1Buffer );

	    ch = evt.outputBuffer.getChannelData(1);
	    ch.set( this.ch2Buffer );
	    
	}

	this.processor.connect( this.ctx.destination );
    }

    disableSound(){
	if( !this.processor )
	    return;
	this.processor.disconnect( this.ctx.destination );
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
