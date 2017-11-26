
module.exports = function(addrs){
    return {

	write:{

            [addrs.TIFR]:function( value ){

		this.TOV0 = value & 1;
		this.OCF0A = (value>>1) & 1;
		this.OCF0B = (value>>2) & 1;

            },

            [addrs.TCCR_A]:function( value ){

		this.WGM10  = (value>>0) & 1;
		this.WGM11  = (value>>1) & 1;
		this.COM0C0 = (value>>2) & 1;
		this.COM0C1 = (value>>3) & 1;
		this.COM0B0 = (value>>4) & 1;
		this.COM0B1 = (value>>5) & 1;
		this.COM0A0 = (value>>6) & 1;
		this.COM0A1 = (value>>7) & 1;

		this.updateState();

            },

            [addrs.TCCR_B]:function( value ){

		
		this.ICNC1 = (value >> 7) & 1;
		this.ICES1 = (value >> 6) & 1;

		this.WGM13 = (value >> 5) & 1;
		this.WGM12 = (value >> 4) & 1;
		this.CS12 = (value >> 3) & 1;
		this.CS11 = (value >> 2) & 1;
		this.CS10= (value >> 1) & 1;

		this.updateState();

            },

	    [addrs.TCCR_C]:function( value ){
		this.FOC1A = (value>>7) & 1;
		this.FOC1B = (value>>6) & 1;
		this.FOC1C = (value>>5) & 1;
	    },

            [addrs.OCR_AH]:function( value ){
		this.OCR0A = (value << 8) | (this.OCR0A & 0xFF);
            },
            [addrs.OCR_AL]:function( value ){
		this.OCR0A = value | (this.OCRA & 0xFF00);
            },

            [addrs.OCR_BH]:function( value ){
		this.OCR0B = (value << 8) | (this.OCR0B & 0xFF);
            },
            [addrs.OCR_BL]:function( value ){
		this.OCR0B = value | (this.OCR0B & 0xFF00);
            },

            [addrs.TCNTH]:function( value ){
		this.TCNT = (value << 8) | (this.TCNT & 0xFF);
            },
            [addrs.TCNTL]:function( value ){
		this.TCNT = value | (this.TCNT & 0xFF00);
            },

            [addrs.TIMSK]:function( value ){
		this.TOIE0 = value & 1;
		this.OCIE0A = (value>>1) & 1;
		this.OCIE0B = (value>>2) & 1;
            }
            
	},

	init:function(){
            this.tick = 0;
            this.WGM10  = 0;
            this.WGM11  = 0;
	    
	    this.COM0C0 = 0;
	    this.COM0C1 = 0;
            this.COM0B0 = 0;
            this.COM0B1 = 0;
            this.COM0A0 = 0;
            this.COM0A1 = 0;

	    this.ICNC1 = 0;
	    this.ICES1 = 0;
	    this.WGM13 = 0;
	    this.WGM12 = 0;
	    this.CS12 = 0;
	    this.CS11 = 0;
	    this.CS10 = 0;
	    
            this.TOV0 = 0;
	    this.FOC1A = 0;
	    this.FOC1B = 0;
	    this.FOC1C = 0;

            this.TOIE0 = 0;
            this.OCIE0A = 0;
            this.OCIE0B = 0;

            this.time = 0;

	    
	    this._update = function( tick ){

		tick = tick || this.core.tick;
		
		var ticksSinceOVF = tick - this.tick;
		var interval = (ticksSinceOVF / this.prescale) | 0;
		if( !interval )
                    return;
		
		var cnt = (this.TCNT += interval);

		this.TCNT &= 0xFFFF;
		this.core.memory[ addrs.TCNTH ] = cnt >>> 8;
		this.core.memory[ addrs.TCNTL ] = cnt & 0xFF;
		
		
		this.tick += interval*this.prescale;
		
		this.TOV0 += (cnt / 0xFFFF) | 0;
		
	    }

            this.updateState = function(){

		var MAX = 0xFF, BOTTOM = 0, WGM10 = this.WGM10, WGM11 = this.WGM11, WGM12 = this.WGM12, WGM13 = this.WGM13;
		let WGM = (this.WGM10 << 3) | (this.WGM11 << 2) | (this.WGM12 << 1) | this.WGM13;
		let CS  = (this.CS10) | (this.CS11 << 1) | (this.CS12 << 2);

		switch( WGM ){
		case 0:
		    console.log("0- Timer16=Normal TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 1:
		    console.log("1- Timer16=PWM,PC8b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 2:
		    console.log("2- Timer16=PWM,PC9b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 3:
		    console.log("3- Timer16=PWM,PC10b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 4:
		    console.log("4- Timer16=CTC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 5:
		    console.log("5- Timer16=FPWM8b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 6:
		    console.log("6- Timer16=FPWM9b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 7:
		    console.log("7- Timer16=FPWM10b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 8:
		    console.log("8- Timer16=PWMPFC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 9:
		    console.log("9- Timer16=PWMPFC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 10:
		    console.log("10- Timer16=PWMPC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 11:
		    console.log("11- Timer16=PWMPC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 12:
		    console.log("12- Timer16=CTC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 13:
		    console.log("13- Timer16=RESERVED");
		    break;
		case 14:
		    console.log("14- Timer16=FPWM TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		case 15:
		    console.log("15- Timer16=FPWM TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
		    break;
		}

		switch( CS ){
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

            [addrs.TIFR]:function(){
		return ((!!this.TOV0)&1) | (this.OCF0A<<1) | (this.OCF0B<<2);
            },

            [addrs.TCNTH]:function(){

		this._update();

		return this.TCNT >>> 8;

            },

            [addrs.TCNTL]:function(){

		this._update();

		return this.TCNT & 0xFF;

            }

	},


	update:function( tick, ie ){

	    this._update();

	    if( ie ){

		if( this.TOV0 > 0 && this.TOIE0 ){
		    this.TOV0--;
		    return addrs.intOV;
		}
		
	    }

	}

    }
};
