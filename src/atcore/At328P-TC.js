
module.exports = {

    write:{

        [0x15 + 0x20]:function( value ){

            this.TOV0 = value & 1;
            this.OCF0A = (value>>1) & 1;
            this.OCF0B = (value>>2) & 1;

        },

        [0x24 + 0x20]:function( value ){

            this.WGM00  = (value>>0) & 1;
            this.WGM01  = (value>>1) & 1;
            this.COM0B0 = (value>>4) & 1;
            this.COM0B1 = (value>>5) & 1;
            this.COM0A0 = (value>>6) & 1;
            this.COM0A1 = (value>>7) & 1;

            this.updateState();

            // console.log(`TCCR0A:\n  WGM00:${this.WGM00}\n  WGM01:${this.WGM01}\n  COM0B0:${this.COM0B0}\n  COM0B1:${this.COM0B1}\n  COM0A0:${this.COM0A0}\n  COM0A1:${this.COM0A1}`);

        },

        [0x25 + 0x20]:function( value ){

            this.FOC0A = (value>>7) & 1;
            this.FOC0B = (value>>6) & 1;
            this.WGM02 = (value>>3) & 1;
            this.CS = value & 7;

            this.updateState();

            // console.log(`TCCR0B:\n  FOC0A:${this.FOC0A}\n  FOC0B:${this.FOC0B}\n  WGM02:${this.WGM02}`);

            // console.log( "PC=" + (this.core.pc<<1).toString(16) + " WRITE TCCR0B: #" + value.toString(16) + " : " + value );

        },

        [0x27 + 0x20]:function( value ){
            this.OCR0A = value;
            // console.log( "OCR0A = " + value );
        },

        [0x28 + 0x20]:function( value ){
            this.OCR0B = value;
            // console.log( "OCR0B = " + value );
        },

        [0x6E]:function( value ){
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

        this.time = 0;

        this.updateState = function(){

            var MAX = 0xFF, BOTTOM = 0, WGM00 = this.WGM00, WGM01 = this.WGM01, WGM02 = this.WGM02;

            if(       WGM02 == 0 && WGM01 == 0 && WGM00 == 0 ){
                this.mode = 0;
                console.log("Timer Mode: Normal (" + this.mode + ")");
            }else if( WGM02 == 0 && WGM01 == 0 && WGM00 == 1 ){
                this.mode = 1;
                console.log("Timer Mode: PWM, phase correct (" + this.mode + ")");
            }else if( WGM02 == 0 && WGM01 == 1 && WGM00 == 0 ){
                this.mode = 2;
                console.log("Timer Mode: CTC (" + this.mode + ")");
            }else if( WGM02 == 0 && WGM01 == 1 && WGM00 == 1 ){
                this.mode = 3;
                console.log("Timer Mode: Fast PWM (" + this.mode + ")");
            }else if( WGM02 == 1 && WGM01 == 0 && WGM00 == 0 ){
                this.mode = 4;
                console.log("Timer Mode: Reserved (" + this.mode + ")");
            }else if( WGM02 == 1 && WGM01 == 0 && WGM00 == 1 ){
                this.mode = 5;
                console.log("Timer Mode: PWM, phase correct (" + this.mode + ")");
            }else if( WGM02 == 1 && WGM01 == 1 && WGM00 == 0 ){
                this.mode = 6;
                console.log("Timer Mode: Reserved (" + this.mode + ")");
            }else if( WGM02 == 1 && WGM01 == 1 && WGM00 == 1 ){
                this.mode = 7;
                console.log("Timer Mode: Fast PWM (" + this.mode + ")");
            }

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

        [0x15 + 0x20]:function(){
            return ((!!this.TOV0)&1) | (this.OCF0A<<1) | (this.OCF0B<<2);
        },

        [0x26 + 0x20]:function(){

            var tick = this.core.tick;

            var ticksSinceOVF = tick - this.tick;
            var interval = (ticksSinceOVF / this.prescale) | 0;
            if( !interval )
                return;

            var TCNT0 = 0x26 + 0x20;
            var cnt = this.core.memory[ TCNT0 ] + interval;

            this.core.memory[ TCNT0 ] += interval;
            
            this.tick += interval*this.prescale;

            this.TOV0 += (cnt / 0xFF) | 0;

        }

    },

    update:function( tick, ie ){

        var ticksSinceOVF = tick - this.tick;
        var interval = (ticksSinceOVF / this.prescale) | 0;
        
        if( interval ){
            var TCNT0 = 0x26 + 0x20;
            var cnt = this.core.memory[ TCNT0 ] + interval;

            this.core.memory[ TCNT0 ] += interval;
            
            this.tick += interval*this.prescale;

            this.TOV0 += (cnt / 0xFF) | 0;

        }

        if( this.TOV0 > 0 && ie ){
            this.TOV0--;
            return "TIMER0O";
        }

    }

};
