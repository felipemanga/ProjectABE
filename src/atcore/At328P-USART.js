module.exports = {

    write:{
        0xC0( value ){ return this.UCSR0A = (this.UCSR0A & 0b10111100) | (value & 0b01000011); },
        0xC1( value ){ return this.UCSR0B = value; },
        0xC2( value ){ return this.UCSR0C = value; },
        0xC4( value ){ return this.UBRR0L = value; },
        0xC5( value ){ return this.UBRR0H = value; },
        0xC6( value ){ this.core.pins.serial0 = (this.core.pins.serial0||"") + String.fromCharCode(value); return this.UDR0 = value; }
    },

    read:{
        0xC0(){ return this.UCSR0A; },
        0xC1(){ return this.UCSR0B; },
        0xC2(){ return this.UCSR0C; },
        0xC4(){ return this.UBRR0L; },
        0xC5(){ return this.UBRR0H & 0x0F; },
        0xC6(){ return this.UDR0; }
    },

    init:function(){
        this.UCSR0A = 0x20;
        this.UCSR0B = 0;
        this.UCSR0C = 0x06;
        this.UBRR0L = 0; // USART Baud Rate 0 Register Low
        this.UBRR0H = 0; // USART Baud Rate 0 Register High            
        this.UDR0 = 0;
    },

    update:function( tick, ie ){

    }

};
