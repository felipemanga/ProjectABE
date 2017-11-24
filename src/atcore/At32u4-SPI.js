module.exports = {
    init:function(){
	this.SPDR = 0;
	this.SPIF = 0;
	this.WCOL = 0;
	this.SPI2X = 0;
	this.SPIE = 0;
	this.SPE = 0;
	this.DORD = 0;
	this.MSTR = 0;
	this.CPOL = 0;
	this.CPHA = 0;
	this.SPR1 = 0;
	this.SPR0 = 0;
	this.core.pins.spiOut = this.core.pins.spiOut || [];
    },
    
    write:{
	0x4C:function( value, oldValue ){
	    this.SPIE = value >> 7;
	    this.SPE  = value >> 6;
	    this.DORD = value >> 5;
	    this.MSTR = value >> 4;
	    this.CPOL = value >> 3;
	    this.CPHA = value >> 2;
	    this.SPR1 = value >> 1;
	    this.SPR0 = value >> 0;
	},
	
	0x4D:function( value, oldValue ){
	    this.SPI2X = value & 1;
	    return (this.SPIF << 7) | (this.WCOL << 6) | this.SPI2X;
	},
	0x4E:function( value ){
	    this.SPDR = value;
	    this.core.pins.spiOut.push( value );
	    this.SPIF = 1;
	}
    },
    
    read:{
	0x4D:function(){
	    this.SPIF = (!!this.core.pins.spiIn.length) | 0;
	    return (this.SPIF << 7) | (this.WCOL << 6) | this.SPI2X;
	},
	0x4E:function(){
	    let spiIn = this.core.pins.spiIn;
	    if( spiIn.length )
		return this.SPDR = spiIn.shift();	 
	    return this.SPDR;
	}
    },
    
    update:function( tick, ie ){
	
	if( this.SPIF && this.SPIE && ie ){
	    this.SPIF = 0;
	    return "SPI";
	}
	    
    }
};
