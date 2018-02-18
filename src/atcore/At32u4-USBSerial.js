const USBINT = 0xDA,
      USBSTA = 0xD9,
      USBCON = 0xD8,
      UHWCON = 0xD7,
      UDIEN  = 0xE2,
      UDINT  = 0xE1;


let UEINT = 0xF4;   //  - EPINT6:0
let UEBCHX = 0xF3;  //  - - - - - BYCT10:8
let UEBCLX = 0xF2;  //  BYCT7:0
let UEDATX = 0xF1;  //  DAT7:0
let UEIENX = 0xF0;  //  FLERRE NAKINE - NAKOUTE RXSTPE RXOUTE STALLEDE TXINE
let UESTA1X = 0xEF; //  - - - - - CTRLDIR CURRBK1:0
let UESTA0X = 0xEE; //  CFGOK OVERFI UNDERFI - DTSEQ1:0 NBUSYBK1:0
let UECFG1X = 0xED; //  EPSIZE2:0 EPBK1:0 ALLOC -
let UECFG0X = 0xEC; //  EPTYPE1:0 - - - - - EPDIR
let UECONX  = 0xEB; //  - - STALLRQ STALLRQC RSTDT - - EPEN
let UERST   = 0xEA; //  - EPRST6:0
let UENUM   = 0xE9; //  - - - - - EPNUM2:0
let UEINTX  = 0xE8; //  FIFOCON NAKINI RWAL NAKOUTI RXSTPI RXOUTI STALLEDI TXINI

module.exports = {
    
    write:{
	[UENUM]:function(v){
	    this.UENUM = v & 0x7;
	    return this.UENUM;
	},

	[UEBCHX]:function(v){ return this.EP[this.UENUM].UEBCHX = v; },
	[UEBCLX]:function(v){ return this.EP[this.UENUM].UEBCLX = v; },
	[UEDATX]:function(v){ return this.EP[this.UENUM].UEDATX = v; },
	[UEIENX]:function(v){ return this.EP[this.UENUM].UEIENX = v; },
	[UESTA1X]:function(v){ return this.EP[this.UENUM].UESTA1X = v; },
	[UESTA0X]:function(v){ return this.EP[this.UENUM].UESTA0X = v; },
	[UECFG1X]:function(v){ return this.EP[this.UENUM].UECFG1X = v; },
	[UECFG0X]:function(v){ return this.EP[this.UENUM].UECFG0X = v; },
	[UECONX]:function(v){ return this.EP[this.UENUM].UECONX = v; },
	[UERST]:function(v){ return this.EP[this.UENUM].UERST = v; },
	[UENUM]:function(v){ return this.EP[this.UENUM].UENUM = v; },
	[UEINTX]:function(v){ return this.EP[this.UENUM].UEINTX = v; },
	
	[USBCON]:function(v){
	    this.VBUSTE = v & 1;
	    this.OTGPADE = (v >> 4) & 1;
	    this.FRZCLK  = (v >> 5) & 1;
	    this.USBE    = (v >> 7) & 1;
	    
	    if( this.USBE ){
		this.VBUSTI = 1;
		this.timeout = 10000;
		this.timeoutCB = _ => {
		    
		    this.EORSTI = 1;
		    let ep0 = this.EP[0];
		    ep0.EPEN = 1;
		    ep0.EPTYPE = 0;
		    ep0.EPSIZE = 0x32;
		    ep0.CFGOK = 1;
		    ep0.UEINTX = 1<<3;
		    ep0.UEIENX = 1<<3;
		    
		}
		
	    }else
		this.reset();
	    
	    return v;
	},
	[USBSTA]:function(v){
	    this.VBUS = v & 1;
	    return this.VBUS | 2;
	},
	[UHWCON]:function(v){
	    this.UVREGE = v & 1;
	    return this.UVREGE;
	},
	[UDIEN]:function(v){
	    this.SUSPE = v & 1;
	    this.MSOFE = (v>>1) & 1;
	    this.SOFE  = (v>>2) & 1;
	    this.EORSTE= (v>>3) & 1;
	    this.WAKEUPE = (v>>4) & 1;
	    this.EORSME  = (v>>5) & 1;
	    this.UPRSME  = (v>>6) & 1;
	    return v;
	},
	[UDINT]:function( v ){
	    this.SUSPI = (v>>0)&1;
	    this.MSOFI = (v>>1)&1;
	    this.SOFI = (v>>2)&1;
	    this.EORSTI = (v>>3)&1;
	    this.WAKEUPI = (v>>4)&1;
	    this.EORSMI = (v>>5)&1;
	    this.UPRSMI = (v>>6)&1;
	    return v;
	},
	[USBINT]:function( v ){
	    return this.VBUSTI = v & 1;
	}	
    },
    
    read:{

	[UEBCHX ]:function(){ return this.EP[this.UENUM].UEBCHX; },
	[UEBCLX ]:function(){ return this.EP[this.UENUM].UEBCLX; },
	[UEDATX ]:function(){ return this.EP[this.UENUM].UEDATX; },
	[UEIENX ]:function(){ return this.EP[this.UENUM].UEIENX; },
	[UESTA1X]:function(){ return this.EP[this.UENUM].UESTA1X; },
	[UESTA0X]:function(){ return this.EP[this.UENUM].UESTA0X; },
	[UECFG1X]:function(){ return this.EP[this.UENUM].UECFG1X; },
	[UECFG0X]:function(){ return this.EP[this.UENUM].UECFG0X; },
	[UECONX ]:function(){ return this.EP[this.UENUM].UECONX; },
	[UERST  ]:function(){ return this.EP[this.UENUM].UERST; },
	[UENUM  ]:function(){ return this.EP[this.UENUM].UENUM; },
	[UEINTX ]:function(){ return this.EP[this.UENUM].UEINTX; },

	[UDINT]:function(){
	    return this.SUSPI |
		(this.MSOFI<<1) |
		(this.SOFI<<2) |
		(this.EORSTI<<3) |
		(this.WAKEUPI<<4) |
		(this.EORSMI<<5) |
		(this.UPRSMI<<6);
	},
	[USBINT]:function(){
	    return this.VBUSTI;
	},
	[USBCON]:function(){
	    return this.VBUSTE |
		(this.OTGPADE<<4) |
		(this.FRZCLK<<5) |
		(this.USBE<<7);
	}
    },
    
    init:function(){
	this.timeout = 0;
	this.timeoutCB = null;
	this.DPRAM = new Uint8Array(832);
	this.EP = [];
	this.reset = () => {

	    this.UENUM = 0;
	    for( let i=0; i<8; ++i ){
		this.EP[i] = {
		    EPEN:0,
		    EPDIR:0,
		    EPTYPE:0,
		    ALLOC:0,
		    EPSIZE:0,
		    EPBK:0,
		    CFGOK:0,
		    ADDEN:0,
		    UADD:0,
		    UEIENX:0,
		    UEINTX:0,
		    ptr:0
		};
	    }

	    this.VBUSTI = 0;
	    this.VBUSTE = 0;
	    this.OTGPADE = 0;
	    this.FRZCLK = 1;
	    this.USBE = 0;

	    this.SUSPE = 0;
	    this.MSOFE = 0;
	    this.SOFE = 0;
	    this.EORSTE = 0;
	    this.WAKEUPE = 0;
	    this.EORSME = 0;
	    this.UPRSME = 0;

	    this.SUSPI = 0;
	    this.MSOFI = 0;
	    this.SOFI = 0;
	    this.EORSTI = 0;
	    this.WAKEUPI = 0;
	    this.EORSMI = 0;
	    this.UPRSMI = 0;

	    this.EPINT = 0;
	    
	    this.pluggedIn = false;
	};

	this.reset();
    },
    
    update:function( tick, ie ){

	if( this.timeout && !--this.timeout )
	    this.timeoutCB();
	
	if( ie ){

	    if( this.VBUSTI && this.VBUSTE ){
		this.VBUSTI = 0;
		return "USBGEN";
	    }

	    if( this.UPRSMI && this.UPRSME ){
		this.UPRSMI = 0;
		return "USBGEN";
	    }

	    if( this.EORSMI && this.EORSME ){
		this.EORSMI = 0;
		return "USBGEN";
	    }

	    if( this.WAKEUPI && this.WAKEUPE ){
		this.WAKEUPI = 0;
		return "USBGEN";
	    }

	    if( this.EORSTI && this.EORSTE ){
		this.EORSTI = 0;
		return "USBGEN";
	    }

	    if( this.SOFI && this.SOFE ){
		this.SOFI = 0;
		return "USBGEN";
	    }

	    if( this.SUSPI && this.SUSPE ){
		this.SUSPI = 0;
		return "USBGEN";
	    }

	    for( let i=0; i<8; ++i ){
		let ep = this.EP[i];
		let epi = ep.UEINTX & ep.UEIENX;
		if( epi ){
		    this.UEINT = i;
		    // return "USBEND";
		}
		
	    }
	}

    }
};
