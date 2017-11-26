
function port( obj ){
    
    let out = { write:{}, read:{}, init:null };

    for( let k in obj ){
	
	let addr = obj[k];
	if( /DDR.|PORT./.test(k) ){
	    
	    out.write[ addr ] = setter(k);
	    
	}else{

	    out.read[ addr ] = getter(k);
	    out.init = init(k);
	    
	}
	
    }

    function setter( k ){
	return function( value, oldValue ){
	    if( value != oldValue )
		this.core.pins[k] = value;	    
	};
    }

    function getter( k ){
	return function(){
	    return (this[k] & 0xFF) | 0;
	};
    }

    function init( k ){
	return function(){
	    this[k] = 0;
	    let _this = this;
	    Object.defineProperty( this.core.pins, k, {
		set:function(v){ return _this[k] = (v>>>0) & 0xFF },
		get:function( ){ return _this[k] }
	    });
	}
    }
    
    return out;
    
}

module.exports = {

    PORTB:port({ PINB:0x23, DDRB:0x24, PORTB:0x25 }),
    PORTC:port({ PINC:0x26, DDRC:0x27, PORTC:0x28 }),
    PORTD:port({ PIND:0x29, DDRD:0x2A, PORTD:0x2B }),
    PORTE:port({ PINE:0x2C, DDRE:0x2D, PORTE:0x2E }),
    PORTF:port({ PINF:0x2F, DDRF:0x30, PORTF:0x31 }),

    TC0:require('./Timer8.js')({
	TIFR:  0x35,
	TCCR_A:0x44,
	TCCR_B:0x45,
	OCR_A: 0x47,
	OCR_B: 0x48,
	TIMSK: 0x6E,
	TCNT:  0x46,
	intOV: "TIMER0O"
    }),

    TC1:require('./Timer16.js')({
	TIFR:  0x36,
	TCCR_A:0x80,
	TCCR_B:0x81,
	TCCR_C:0x82,
	OCR_AH: 0x89,
	OCR_AL: 0x88,
	OCR_BH: 0x8B,
	OCR_BL: 0x8A,
	TIMSK: 0x6F,
	TCNTH: 0x85,
	TCNTL: 0x85,
	intOV: "TIMER1O"
    }),

    USART:require('./At328P-USART.js'),

    PLL:{
	read:{
	    0x49:function( value ){
		return (this.PINDIV << 4) | (this.PLLE << 1) | this.PLOCK;
	    }
	},
	write:{
	    0x49:function( value, oldValue ){
		if( value === oldValue ) return;
		this.PINDIV = (value >> 4) & 1;
		this.PLLE   = (value >> 1) & 1;
		this.PLOCK  = 1;
	    }
	},
	init:function(){
	    this.PINDIV = 0;
	    this.PLLE = 0;
	    this.PLOCK = 0;
	}
    },

    SPI:require('./At32u4-SPI.js'),

    EEPROM:{
	write:{
	    0x3F:function( value, oldValue ){
		value &= ~2;
		return value;
	    }
	},
	read:{},
	init:function(){
	    
	}
    },

    ADCSRA:{
	
	write:{
	    0x7A:function(value, oldValue){
		this.ADEN = value>>7 & 1;
		this.ADSC = value>>6 & 1;
		this.ADATE = value>>5 & 1;
		this.ADIF = value>>4 & 1;
		this.ADIE = value>>3 & 1;
		this.ADPS2 = value>>2 & 1;
		this.ADPS1 = value>>1 & 1;
		this.ADPS0 = value & 1;
		if( this.ADEN ){
		    if( this.ADSC ){
			this.ADCH = (Math.random() * 0xFF) >>> 0;
			this.ADCL = (Math.random() * 0xFF) >>> 0;
			this.ADSC = 0;
			value &= ~(1<<6);
		    }
		}
		return value;
	    }
	},

	read:{
	    0x79:function(){
		return this.ADCH;
	    },
	    0x78:function(){
		return this.ADCL;
	    }
	},
		
	init:function(){
	    this.ADEN = 0;
	    this.ADSC = 0;
	    this.ADATE = 0;
	    this.ADIF = 0;
	    this.ADIE = 0;
	    this.ADPS2 = 0;
	    this.ADPS1 = 0;
	    this.ADPS0 = 0;
	},

	update:function( tick, ie ){
	    if( this.ADEN && this.ADIE ){
		this.ADIF = 1;
		this.ADSC = 0;
		this.ADCH = (Math.random() * 0xFF) >>> 0;
		this.ADCL = (Math.random() * 0xFF) >>> 0;
	    }

	    if( this.ADIF && this.ADIE && ie ){
		this.ADIF = 0;
		return "ADC";
	    }
	}
	
    }

};
