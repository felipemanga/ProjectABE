
module.exports = function(addrs){
    return {

	write:{

            [addrs.TIFR]:function( value ){

		this.TOVn = value & 1;
		this.OCFnA = 0; // (value>>1) & 1;
		this.OCFnB = 0; // (value>>2) & 1;
		this.OCFnC = 0;
            },

            [addrs.TCCR_A]:function( value ){

		this.WGMn0  = (value>>0) & 1;
		this.WGMn1  = (value>>1) & 1;
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

		this.WGMn3 = (value >> 4) & 1;
		this.WGMn2 = (value >> 3) & 1;
		this.CSn2 = (value >> 2) & 1;
		this.CSn1 = (value >> 1) & 1;
		this.CSn0= (value) & 1;

		this.updateState();

            },

	    [addrs.TCCR_C]:function( value ){
		this.FOCnA = (value>>7) & 1;
		this.FOCnB = (value>>6) & 1;
		this.FOCnC = (value>>5) & 1;
	    },

            [addrs.OCR_AH]:function( value ){
		this.OCRnA = (value << 8) | (this.OCRnA & 0xFF);
            },
            [addrs.OCR_AL]:function( value ){
		this.OCRnA = value | (this.OCRnA & 0xFF00);
            },

            [addrs.OCR_BH]:function( value ){
		this.OCRnB = (value << 8) | (this.OCRnB & 0xFF);
            },
            [addrs.OCR_BL]:function( value ){
		this.OCRnB = value | (this.OCRnB & 0xFF00);
            },

            [addrs.TCNTH]:function( value ){
		this.TCNT = (value << 8) | (this.TCNT & 0xFF);
            },
            [addrs.TCNTL]:function( value ){
		this.TCNT = value | (this.TCNT & 0xFF00);
            },

            [addrs.TIMSK]:function( value ){
		this.TOIE0 = value & 1;
		this.OCIEnA = (value>>1) & 1;
		this.OCIEnB = (value>>2) & 1;
		this.OCIEnC = (value>>3) & 1;
            }
            
	},

	init:function(){
            this.tick = 0;
            this.WGMn0  = 0;
            this.WGMn1  = 0;

	    this.OCFnA = 0;
	    this.OCFnB = 0;
	    this.OCFnC = 0;
	    
	    this.COM0C0 = 0;
	    this.COM0C1 = 0;
            this.COM0B0 = 0;
            this.COM0B1 = 0;
            this.COM0A0 = 0;
            this.COM0A1 = 0;

	    this.ICNC1 = 0;
	    this.ICES1 = 0;
	    this.WGMn3 = 0;
	    this.WGMn2 = 0;
	    this.CSn2 = 0;
	    this.CSn1 = 0;
	    this.CSn0 = 0;
	    
            this.TOVn = 0;
	    this.FOCnA = 0;
	    this.FOCnB = 0;
	    this.FOCnC = 0;

            this.TOIE0 = 0;
            this.OCIEnA = 0;
            this.OCIEnB = 0;
	    this.OCIEnC = 0;

            this.OCRnA = 0;
            this.OCRnB = 0;
	    this.OCRnC = 0;	    

            this.TCNT = 0;
	    this.prescale = 0;
	    this.TOP = 0xFFFF;

	    
	    this._update = function( tick ){
		if( !this.prescale )
		    return;

		tick = tick || this.core.tick;
		
		var ticksSinceOVF = tick - this.tick;
		var interval = (ticksSinceOVF / this.prescale) | 0;
		if( !interval )
                    return;

		var oldTCNT = this.TCNT;
		
		var cnt = (this.TCNT += interval);

		this.TCNT &= 0xFFFF;
		
		this.tick += interval*this.prescale;

		if( this.OCIEnA && oldTCNT < this.OCRnA && cnt >= this.OCRnA ){
		    this.OCFnA++;
		    if( this.CTC && !this.FOCnA )
			this.TCNT = cnt = 0;
		}
		if( this.OCIEnB && oldTCNT < this.OCRnB && cnt >= this.OCRnB ){
		    this.OCFnB++;
		    if( this.CTC && !this.FOCnB )
			this.TCNT = cnt = 0;
		}
		if( this.OCIEnC && oldTCNT < this.OCRnC && cnt >= this.OCRnC ){
		    this.OCFnC++;
		    if( this.CTC && !this.FOCnC )
			this.TCNT = cnt = 0;
		}

		this.core.memory[ addrs.TCNTH ] = cnt >>> 8;
		this.core.memory[ addrs.TCNTL ] = cnt & 0xFF;
		
		this.TOVn += (cnt / this.TOP) | 0;
		
	    }

            this.updateState = function(){

		var MAX = 0xFF, BOTTOM = 0, WGMn0 = this.WGMn0, WGMn1 = this.WGMn1, WGMn2 = this.WGMn2, WGMn3 = this.WGMn3;
		let WGM =
		    (this.WGMn3 << 3) |
		    (this.WGMn2 << 2) |
		    (this.WGMn1 << 1) |
 		     this.WGMn0;
		let CS  = (this.CSn0) | (this.CSn1 << 1) | (this.CSn2 << 2);

		if( WGM != this.oldWGM ){
		    this.CTC = false;
		    this.TOP = 0xFFFF;

		    switch( WGM ){
		    case 0:
			// console.log("0- Timer16=Normal TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			break;
		    case 1:
			// console.log("1- Timer16=PWM,PC8b TOP=0xFF UpdateOCRnx=imm TOVn=MAX");
			this.TOP = 0xFF;
			break;
		    case 2:
			// console.log("2- Timer16=PWM,PC9b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			this.TOP = 0x1FF;
			break;
		    case 3:
			// console.log("3- Timer16=PWM,PC10b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			this.TOP = 0x3FF;
			break;
		    case 4:
			// console.log("4- Timer16=CTC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			this.CTC = true;
			break;
		    case 5:
			// console.log("5- Timer16=FPWM8b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			this.TOP = 0xFF;
			break;
		    case 6:
			// console.log("6- Timer16=FPWM9b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			this.TOP = 0x1FF;
			break;
		    case 7:
			// console.log("7- Timer16=FPWM10b TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			this.TOP = 0x3FF;
			break;
		    case 8:
			// console.log("8- Timer16=PWMPFC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			break;
		    case 9:
			// console.log("9- Timer16=PWMPFC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			break;
		    case 10:
			// console.log("10- Timer16=PWMPC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			break;
		    case 11:
			// console.log("11- Timer16=PWMPC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			break;
		    case 12:
			// console.log("12- Timer16=CTC TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			this.CTC = true;
			break;
		    case 13:
			// console.log("13- Timer16=RESERVED");
			break;
		    case 14:
			// console.log("14- Timer16=FPWM TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			break;
		    case 15:
			// console.log("15- Timer16=FPWM TOP=0xFFFF UpdateOCRnx=imm TOVn=MAX");
			break;
		    }
		}

		this.oldWGM = WGM;		

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
	    [addrs.TCCR_C]:function( value ){
		return 0;
	    },
	    
            [addrs.TIFR]:function(){
		return ((!!this.TOVn)&1) | (this.OCFnA<<1) | (this.OCFnB<<2);
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

		if( this.OCFnA > 0 && this.OCIEnA && !this.FOCnA ){
		    this.OCFnA = 0;
		    return addrs.intCOMPA;
		}

		if( this.OCFnB > 0 && this.OCIEnB && !this.FOCnB ){
		    this.OCFnB = 0;
		    return addrs.intCOMPB;
		}

		if( this.OCFnC > 0 && this.OCIEnC && !this.FOCnC ){
		    this.OCFnC = 0;
		    return addrs.intCOMPC;
		}
		
		if( this.TOVn > 0 && this.TOIE0 ){
		    this.TOVn = 0;
		    return addrs.intOV;
		}
		
	    }

	}

    }
};
