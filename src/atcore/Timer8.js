
module.exports = function(addrs){
    return {

	write:{

            [addrs.TIFR]:function( value ){

		this.TOV0 = value & 1;
		this.OCF0A = (value>>1) & 1;
		this.OCF0B = (value>>2) & 1;

            },

            [addrs.TCCR_A]:function( value ){

		this.WGM00  = (value>>0) & 1;
		this.WGM01  = (value>>1) & 1;
		this.COM0B0 = (value>>4) & 1;
		this.COM0B1 = (value>>5) & 1;
		this.COM0A0 = (value>>6) & 1;
		this.COM0A1 = (value>>7) & 1;

		this.updateState();

		// console.log(`TCCR0A:\n  WGM00:${this.WGM00}\n  WGM01:${this.WGM01}\n  COM0B0:${this.COM0B0}\n  COM0B1:${this.COM0B1}\n  COM0A0:${this.COM0A0}\n  COM0A1:${this.COM0A1}`);

            },

            [addrs.TCCR_B]:function( value ){

		this.FOC0A = ((value>>7) & 1) ^ 1;
		this.FOC0B = ((value>>6) & 1) ^ 1;
		this.WGM02 = (value>>3) & 1;
		this.CS = value & 7;

		this.updateState();

		// console.log(`TCCR0B:\n  FOC0A:${this.FOC0A}\n  FOC0B:${this.FOC0B}\n  WGM02:${this.WGM02}`);

		// console.log( "PC=" + (this.core.pc<<1).toString(16) + " WRITE TCCR0B: #" + value.toString(16) + " : " + value );

            },

            [addrs.OCR_A]:function( value ){
		this.OCR0A = value;
            },

            [addrs.OCR_B]:function( value ){
		this.OCR0B = value;
		// console.log( "OCR0B = " + value );
            },

            [addrs.TIMSK]:function( value ){
		this.TOIE0 = value & 1;
		this.OCIE0A = (value>>1) & 1;
		this.OCIE0B = (value>>2) & 1;
            }
            
	},

	init:function(){
            this.tick = 0;
            this.WGM00  = 0;
            this.WGM01  = 0;
            this.COM0B0 = 0;
            this.COM0B1 = 0;
            this.COM0A0 = 0;
            this.COM0A1 = 0;
            this.FOC0A = 0;
            this.FOC0B = 0;
            this.WGM02 = 0;
            this.CS = 0;
            this.TOV0 = 0;

            this.TOIE0 = 0;
            this.OCIE0A = 0;
            this.OCIE0B = 0;
	    this.OCR0A = 0;
	    this.OCR0B = 0;

            this.time = 0;

            this.updateState = function(){

		var MAX = 0xFF, BOTTOM = 0, WGM00 = this.WGM00, WGM01 = this.WGM01, WGM02 = this.WGM02;

		var WGM = (WGM02<<2) | (WGM02<<1) | (WGM00);

		var msg = null;

		switch( WGM ){
		case 0:
                    msg = "Timer Mode: Normal";
		case 1:
                    msg = "Timer Mode: PWM, phase correct";
		case 2:
                    msg = "Timer Mode: CTC";
		case 3:
                    msg = "Timer Mode: Fast PWM";
		case 4:
                    msg = "Timer Mode: Reserved";
		case 5:
                    msg = "Timer Mode: PWM, phase correct";
		case 6:
                    msg = "Timer Mode: Reserved";
		case 7:
                    msg = "Timer Mode: Fast PWM";
		}
		
		if( this.mode !== WGM )
		    console.log(`${msg} (${WGM})`);
		
		this.mode = WGM;

		switch( this.CS ){
		case 0: this.prescale = 0; break;
		case 1: this.prescale = 1; break;
		case 2: this.prescale = 8; break;
		case 3: this.prescale = 64; break;
		case 4: this.prescale = 256; break;
		case 5: this.prescale = 1024; break;
		default: this.prescale = 1; break;
		}
		
            };

	},

	read:{

	    [addrs.TCCRB]:function(v){
		let FOC0A = (!this.FOC0A) << 7;
		let FOC0B = (!this.FOC0B) << 6;
		v = (v & ~(3<<6)) | FOC0A | FOC0B;
		return v;
	    },

            [addrs.TIFR]:function(){
		return ((!!this.TOV0)&1) | (this.OCF0A<<1) | (this.OCF0B<<2);
            },

            [addrs.TCNT]:function(){

		var tick = this.core.tick;

		var ticksSinceOVF = tick - this.tick;
		var interval = (ticksSinceOVF / this.prescale) | 0;
		if( !interval )
                    return;

		var cnt = this.core.memory[ addrs.TCNT ] + interval;

		if( cnt > this.OCR0A && this.TCNT < this.OCR0A )
		    this.FOC0A += ((cnt - this.OCR0A) / 0xFF) | 0;

		if( cnt > this.OCR0B && this.TCNT < this.OCR0B )
		    this.FOC0B += ((cnt - this.OCR0B) / 0xFF) | 0;

		this.core.memory[ addrs.TCNT ] = this.TCNT = cnt;

		let scaled = interval*this.prescale;
		this.tick += scaled;

		var ofc = (scaled / 0xFF) | 0;
		this.TOV0 += ofc;

		return cnt;

            }

	},

	update:function( tick, ie ){

            var ticksSinceOVF = tick - this.tick;
            var interval = (ticksSinceOVF / this.prescale) | 0;
            
            if( interval ){

		var cnt = this.core.memory[ addrs.TCNT ] + interval;


		if( cnt > this.OCR0A && this.TCNT < this.OCR0A )
		    this.FOC0A += ((cnt - this.OCR0A) / 0xFF) | 0;

		if( cnt > this.OCR0B && this.TCNT < this.OCR0B )
		    this.FOC0B += ((cnt - this.OCR0B) / 0xFF) | 0;
		
		this.core.memory[ addrs.TCNT ] = this.TCNT = cnt;
		
		let scaled = interval*this.prescale;
		this.tick += scaled;

		this.TOV0 += (cnt / 0xFF) | 0;

            }

	    if( ie ){

		if( this.TOV0 > 0 && this.TOIE0 ){
		    this.TOV0--;
		    return addrs.intOV;
		}

		if( this.FOC0A > 0 && this.OCIE0A ){
		    this.FOC0A--;
		    return addrs.cmpA;
		}

		if( this.FOC0B > 0 && this.OCIE0B ){
		    this.FOC0B--;
		    return addrs.cmpB;
		}
		
	    }

	}

    }
};
