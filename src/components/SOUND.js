class SOUND {
    
    static "@inject" = {
	pool:"pool"
    };

    static context = null;
    
    constructor( DOM ){
	this.DOM = DOM;

	if( typeof AudioContext == "undefined" ){
	    if( typeof webkitAudioContext == "undefined" )
		return;
	    window.AudioContext = webkitAudioContext;
	}
	
	this.pool.add(this);

	this.ctx = SOUND.context || new AudioContext();
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
	this.prevDelta = 0;
	this.prevDelta2 = 0;
	this.error = 0;
	this.error2 = 0;

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
	    let delta = tick - this.previousTick;
	    this.prevDelta = delta;
	    this.previousTick = tick;

	    if( it >= ch1.length ){
		this.error = 0;
		return;
	    }
	    
	    while( this.error-->0 && it < ch1.length ) ch1[it++] = 0.5;

	    let max = this.ch1Buffer.length - it;
	    
	    if( delta > max && delta < max + ch1.length ) this.error = delta - max;
	    else this.error = 0;
	    delta = Math.min( max, delta );
	    	    
	    for( ; delta; delta-- )
		ch1[it++] = 0;
	    ch1[it] = 0.5;
	    this.bufferStart = it;
	    
	},
	
	onHighToLow:function( tick ){
	    tick = (tick * this.cycles)>>>0;
	    let it = this.bufferStart, ch1 = this.ch1Buffer;
	    let delta = tick - this.previousTick;
	    this.prevDelta = delta;
	    this.previousTick = tick;

	    if( it >= ch1.length ){
		this.error = 0;
		return;
	    }
	    
	    while( this.error-->0 && it < ch1.length ) ch1[it++] = 0;

	    let max = this.ch1Buffer.length - it;

	    if( delta > max && delta < max + ch1.length ) this.error = delta - max;
	    else this.error = 0;
	    delta = Math.min( max, delta );
	    	    
	    for( ; delta; delta-- )
		ch1[it++] = 0.5;
	    ch1[it] = 0;
	    this.bufferStart = it;
	    

	}
    }

    ch2 = {
	connect:null,
	onLowToHigh:function( tick ){
	    tick = (tick * this.cycles)>>>0;
	    let it = this.bufferStart2, ch1 = this.ch2Buffer;
	    let delta = tick - this.previousTick2;
	    this.prevDelta2 = delta;
	    this.previousTick2 = tick;

	    if( it >= ch1.length ){
		this.error2 = 0;
		return;
	    }
	    
	    while( this.error2-->0 && it < ch1.length ) ch1[it++] = 0.25;

	    let max = this.ch2Buffer.length - it;
	    
	    if( delta > max && delta < max + ch1.length ) this.error2 = delta - max;
	    else this.error2 = 0;
	    delta = Math.min( max, delta );
	    	    
	    for( ; delta; delta-- )
		ch1[it++] = 0;
	    ch1[it] = 0.25;
	    this.bufferStart2 = it;
	    
	},
	
	onHighToLow:function( tick ){
	    tick = (tick * this.cycles)>>>0;
	    let it = this.bufferStart2, ch1 = this.ch2Buffer;
	    let delta = tick - this.previousTick2;
	    this.prevDelta2 = delta;
	    this.previousTick2 = tick;

	    if( it >= ch1.length ){
		this.error2 = 0;
		return;
	    }
	    
	    while( this.error2-->0 && it < ch1.length ) ch1[it++] = 0;

	    let max = this.ch2Buffer.length - it;

	    if( delta > max && delta < max + ch1.length ) this.error2 = delta - max;
	    else this.error2 = 0;
	    delta = Math.min( max, delta );
	    	    
	    for( ; delta; delta-- )
		ch1[it++] = 0.25;
	    ch1[it] = 0;
	    this.bufferStart2 = it;
	    

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

	    if( this.bufferStart ){
		ch.set( this.ch1Buffer );

		let v = ch[ this.bufferStart ], d = this.prevDelta;
		for( let i=this.bufferStart+1; i<ch.length; ++i ){

		    ch[ i ] = v;
		    d--;
		    if( d == 0 ){
			if( v ) v = 0;
			else v = 0.5;
			d = this.prevDelta;
		    }
		    
		}
		this.ch1Buffer[0] = this.ch1Buffer[ this.bufferStart ];

	    }else ch.fill( this.ch1Buffer[0] );

	    ch = evt.outputBuffer.getChannelData(1);

	    if( this.bufferStart2 ){
		ch.set( this.ch2Buffer );
		let v = ch[ this.bufferStart2 ], d = this.prevDelta2;
		for( let i=this.bufferStart2+1; i<ch.length; ++i ){

		    ch[ i ] = v;
		    d--;
		    if( d == 0 ){
			if( v ) v = 0;
			else v = 0.25;
			d = this.prevDelta2;
		    }
		    
		}
		this.ch2Buffer[0] = this.ch2Buffer[ this.bufferStart2 ];

	    }else ch.fill( this.ch2Buffer[0] );
	    
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
