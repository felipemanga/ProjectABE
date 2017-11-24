
module.exports = {

    PORTB:{
        write:{
            [0x04 + 0x20]:function( value ){
                this.core.pins.DDRB = value;
            },
            [0x05 + 0x20]:function( value, oldValue ){

                if( oldValue == value ) return;

		/*
                if( typeof document != "undefined" ){
                    if( value & 0x20 ) document.body.style.backgroundColor = "black";
                    else document.body.style.backgroundColor = "white";
                }else if( typeof WorkerGlobalScope == "undefined" ){
                    if( value & 0x20 ) console.log( "LED ON #", (this.core.pc<<1).toString(16) );
                    else console.log( "LED OFF #", (this.core.pc<<1).toString(16) );
                }
		*/

                this.core.pins.PORTB = value;

                // console.log("worker@" + this.core.pc.toString(16) + "[tick " + (this.core.tick / this.core.clock * 1000).toFixed(3) + "]", " PORTB = ", value.toString(2));
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

    TC:require('./At328P-TC.js'),

    USART:require('./At328P-USART.js')

};
