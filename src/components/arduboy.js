import { IController, Model, IView } from '../lib/mvc.js';
import { getPolicy } from 'dry-di';
import Atcore from '../atcore/Atcore.js';
import Hex from '../atcore/hex.js';

class Arduboy {

    static "@inject" = {
        root: [Model, {scope:"root"}]
    }

    tick = []

    constructor( DOM ){

	this.DOM = DOM;
	this.parent = DOM.element.parentElement;
	this.width = 0;
	this.height = 0;
	this.dead = false;

	DOM.element.addEventListener( "addperiferal", evt => this.addPeriferal( evt.target.controller ) );


	this.periferals = [];

	this.update = this._update.bind( this );
	this.resize();
	
	let url = this.root.getItem("app.AT328P.url", null);
	if( url ){
	    
	    this.core = Atcore.ATmega328P();
	    
	    Hex.parseURL( url, this.core.flash, (success) => {
		if( success )
		    this.initCore();
	    });
	    return;
	    
	}

	let hex = this.root.getItem("app.AT328P.hex", null);
	if( hex ){
		
	    this.core = Atcore.ATmega328P();
	    Hex.parse( hex, this.core.flash );
	    this.initCore();
	    return;
	    
	}
	    
	url = this.root.getItem("app.AT32u4.url", null);
	if( url ){

	    this.core = Atcore.ATmega32u4();
	    Hex.parseURL( url, this.core.flash, success => {
		if( success ) this.initCore();
	    });
	    return;
	    
	}

	hex = this.root.getItem("app.AT32u4.hex", null);
	if( hex ){
	    
	    this.core = Atcore.ATmega32u4();
	    Hex.parse( hex, this.core.flash );
	    this.initCore();
	    return;
	    
	}

	console.error("Nothing to load");
    }

    powerOff(){
	this.dead = true;
	this.DOM.element.dispatchEvent( new Event("poweroff", {bubbles:true}) );
    }

    initCore(){
	let core = this.core, oldValues = {}, DDRB, serial0Buffer = "", callbacks = {
            DDRB:{},
            DDRC:{},
            DDRD:{},
            PORTB:{},
            PORTC:{},
            PORTD:{},
            PORTE:{},
            PORTF:{}
	};

	Object.keys(callbacks).forEach( k =>
					Object.assign(callbacks[k],{
					    onHighToLow:[], 
					    onLowToHigh:[]
					})
				      );

	Object.defineProperties( core.pins, {

            onHighToLow:{value:function( port, bit, cb ){
		(callbacks[ port ].onHighToLow[ bit ] = callbacks[ port ][ bit ] || []).push( cb );
            }},

            onLowToHigh:{value:function( port, bit, cb ){
		(callbacks[ port ].onLowToHigh[ bit ] = callbacks[ port ][ bit ] || []).push( cb );
            }},

            0:{value:{ out:{port:"PORTD", bit:2 }, in:{port:"PIND", bit:2} } },
            1:{value:{ out:{port:"PORTD", bit:3 }, in:{port:"PIND", bit:3} } },
            2:{value:{ out:{port:"PORTD", bit:1 }, in:{port:"PIND", bit:1} } },
            3:{value:{ out:{port:"PORTD", bit:0 }, in:{port:"PIND", bit:0} } },
            4:{value:{ out:{port:"PORTD", bit:4 }, in:{port:"PIND", bit:4} } },
            5:{value:{ out:{port:"PORTC", bit:6 }, in:{port:"PINC", bit:6} } },
            6:{value:{ out:{port:"PORTD", bit:7 }, in:{port:"PIND", bit:7} } },
            7:{value:{ out:{port:"PORTE", bit:6 }, in:{port:"PINE", bit:6} } },
            8:{value:{ out:{port:"PORTB", bit:4 }, in:{port:"PINB", bit:4} } },
            9:{value:{ out:{port:"PORTB", bit:5 }, in:{port:"PINB", bit:5} } },
            10:{value:{ out:{port:"PORTB", bit:6 }, in:{port:"PINB", bit:6} } },
            11:{value:{ out:{port:"PORTB", bit:7 }, in:{port:"PINB", bit:7} } },

	    16:{value:{ out:{port:"PORTB", bit:2 }, in:{port:"PINB", bit:2} } },
            14:{value:{ out:{port:"PORTB", bit:3 }, in:{port:"PINB", bit:3} } },
            15:{value:{ out:{port:"PORTB", bit:1 }, in:{port:"PINB", bit:1} } },
            17:{value:{ out:{port:"PORTB", bit:0 }, in:{port:"PINB", bit:0} } },

            18:{value:{ out:{port:"PORTF", bit:7 }, in:{port:"PINF", bit:7} } },
            A0:{value:{ out:{port:"PORTF", bit:7 }, in:{port:"PINF", bit:7} } },
            19:{value:{ out:{port:"PORTF", bit:6 }, in:{port:"PINF", bit:6} } },
            A1:{value:{ out:{port:"PORTF", bit:6 }, in:{port:"PINF", bit:6} } },
            20:{value:{ out:{port:"PORTF", bit:5 }, in:{port:"PINF", bit:5} } },
            A2:{value:{ out:{port:"PORTF", bit:5 }, in:{port:"PINF", bit:5} } },
            21:{value:{ out:{port:"PORTF", bit:4 }, in:{port:"PINF", bit:4} } },
            A3:{value:{ out:{port:"PORTF", bit:4 }, in:{port:"PINF", bit:4} } },
	    
	    MOSI:{value:{}},
	    MISO:{value:{}},

	    spiIn:{
		value:[]
	    },
	    
	    spiOut:{
		value:{
		    listeners:[],
		    push( data ){
			let i=0, listeners=this.listeners, l=listeners.length;
			for(;i<l;++i)
			    listeners[i]( data );
		    }
		}
	    },
	    
            serial0:{
		set:function( str ){
                    str = (str || "").replace(/\r\n?/,'\n');
                    serial0Buffer += str;

                    var br = serial0Buffer.indexOf("\n");
                    if( br != -1 ){

                        var parts = serial0Buffer.split("\n");
                        while( parts.length>1 )
                            console.log( 'SERIAL: ', parts.shift() );

                        serial0Buffer = parts[0];

                    }
                    
		}
            },

            DDRB: {
		set: setDDR.bind(null, "DDRB"),
		get:function(){
                    return oldValues.DDRB|0;
		}
            },
            DDRC: {
		set: setDDR.bind(null, "DDRC"),
            },
            DDRD: {
		set: setDDR.bind(null, "DDRD"),
            },
            DDRE: {
		set: setDDR.bind(null, "DDRD"),
            },
            DDRF: {
		set: setDDR.bind(null, "DDRD"),
            },
            PORTB: {
		set: setPort.bind(null, "PORTB")
            },
            PORTC: {
		set: setPort.bind(null, "PORTC")
            },
            PORTD: {
		set: setPort.bind(null, "PORTD")
            },
            PORTE: {
		set: setPort.bind(null, "PORTE")
            },
            PORTF: {
		set: setPort.bind(null, "PORTF")
            }

	});

	setTimeout( _ => {
	    this.setupPeriferals();
	    this._update();
	}, 5);

	function setDDR( name, cur ){   
            var old = oldValues[name];                    
            if( old === cur ) return;
            oldValues[name] = cur;
	}

	function setPort( name, cur ){
            var old = oldValues[name];
            
            if( old === cur ) return;
            var s, j, l, lth = callbacks[name].onLowToHigh, htl = callbacks[name].onHighToLow, tick = core.tick;

            for( var i=0; i<8; ++i ){

		var ob = old>>>i&1, nb = cur>>>i&1;
		if( lth[i] && !ob && nb ){
                    for( j=0, s=lth[i], l=s.length; j<l; ++j )
			s[j]( tick );
		}
		if( htl[i] && ob && !nb ){
                    for( j=0, s=htl[i], l=s.length; j<l; ++j )
			s[j]( tick );
		}

            }

            oldValues[name] = cur;

	}
    }

    

    addPeriferal( ctrl ){
	
	this.periferals.push( ctrl );
	
    }

    setupPeriferals(){
	let pins = this.core.pins;
	let map = { cpu:this.core.pins };
	
	this.periferals.forEach( ctrl => {

	    if( ctrl.tick )
		this.tick.push( ctrl );
	    
	    for( let k in ctrl ){

		let v = ctrl[k];
		if( !v || !v.connect ) continue;

		let target = v.connect;
		if(typeof target == "number" )
		    target = "cpu." + target;

		let tobj = map;
		let tparts = target.split(".");
		while( tparts.length && tobj )
		    tobj = tobj[ tparts.shift() ];

		if( v.MOSI )
		    pins.spiOut.listeners.push( v.MOSI.bind( ctrl ) );

		if( !tobj ){
		    console.warn("Could not attach wire from ", k, " to ", target);
		    continue;
		}

		if( v.onLowToHigh )
		    pins.onLowToHigh( tobj.out.port, tobj.out.bit, v.onLowToHigh.bind( ctrl ) );
		
		if( v.onHighToLow )
		    pins.onHighToLow( tobj.out.port, tobj.out.bit, v.onHighToLow.bind( ctrl ) );


		let setter = (function( tobj, nv ){
		    
		    if( nv ) pins[ tobj.in.port ] |= 1 << tobj.in.bit;
		    else pins[ tobj.in.port ] &= ~(1 << tobj.in.bit);
		    
		}).bind(this, tobj);

		let getter = (function( tobj ){
		    return (pins[ tobj.out.port ] >>> tobj.out.bit) & 1;
		}).bind(this, tobj);

		Object.defineProperty(v, "value", {
		    set:setter,
		    get:getter
		});

		if( v.init )
		    v.init.call( ctrl );

	    }
	    
	});
	
    }

    _update(){
	if( this.dead ) return;
	
	requestAnimationFrame( this.update );
	this.core.update();
	this.resize();
	for( let i=0, l=this.tick.length; i<l; ++i )
	    this.tick[i].tick();
    }

    resize(){
	
	let maxHeight = this.parent.clientHeight;
	let maxWidth  = this.parent.clientWidth;

	if( this.width == maxWidth && this.height == maxHeight )
	    return;
	
	this.width = maxWidth;
	this.height = maxHeight;

	let ratio = 393 / 624;

	if( this.height * ratio > this.width ){
	    this.DOM.element.style.width = this.width + "px";
	    this.DOM.element.style.height = (this.width / ratio) + "px";
	}else{
	    this.DOM.element.style.width = (this.height * ratio) + "px";
	    this.DOM.element.style.height = this.height + "px";
	}
	
    }
    
}

module.exports = Arduboy;
