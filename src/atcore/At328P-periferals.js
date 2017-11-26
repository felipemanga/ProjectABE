
module.exports = {

    PORTB:{
        write:{
            [0x04 + 0x20]:function( value ){
                this.core.pins.DDRB = value;
            },
            [0x05 + 0x20]:function( value, oldValue ){
		
                if( oldValue == value ) return;
                this.core.pins.PORTB = value;
		
            }
        },
        read:{
            [0x03 + 0x20]:function(){
                return (this.PINB & 0xFF) | 0;
            }
        },
        init:function(){
            this.PINB = 0;
            Object.defineProperty(this.core.pins, "PINB", {
                set:( v )=>this.PINB = (v>>>0)&0xFF,
                get:()=>this.PINB
            });
        }
    },

    PORTC:{
        write:{
            [0x07 + 0x20]:function( value ){
                this.core.pins.DDRC = value;
            },
            [0x08 + 0x20]:function( value ){
                this.core.pins.PORTC = value;
            }
        },
        read:{
            [0x06 + 0x20]:function(){
                return this.core.pins.PINC = (this.core.pins.PINC & 0xFF) || 0;
            }
        }
    },

    PORTD:{
        write:{
            [0x0A + 0x20]:function( value ){
                this.core.pins.DDRD = value;
            },
            [0x0B + 0x20]:function( value ){
                this.core.pins.PORTD = value;
            }
        },
        read:{
            [0x09 + 0x20]:function(){
                return this.core.pins.PIND = (this.core.pins.PIND & 0xFF) || 0;
            }
        }
    },

    TC:require('./Timer8.js')({
	TIFR:  0x35,
	TCCR_A:0x44,
	TCCR_B:0x45,
	OCR_A: 0x47,
	OCR_B: 0x48,
	TIMSK: 0x6E,
	TCNT:  0x46,
	intOV: "TIMER0O",
	cmpA:  "TIMER0A",
	cmpB:  "TIMER0B"
    }),

    USART:require('./At328P-USART.js')

};
