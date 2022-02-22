import { IController, Model, IView } from '../lib/mvc.js';
import { getPolicy } from 'dry-di';
import Atcore from '../atcore/Atcore.js';
import Hex from '../atcore/Hex.js';
import * as skins from '../skins/*.js';

const LOADING = 0;
const RUNNING = 1;
const PAUSED  = 2;
const STEP    = 3;

const emptySkin = {elements:{}}, skinList = Object.keys(skins);

class Arduboy {

    static "@inject" = {
        root: [Model, {scope:"root"}],
	pool:"pool"
    }

    tick = []

    constructor( DOM ){

	this.pool.add(this);

	this.DOM = DOM;
	this.parent = DOM.element.parentElement;
	this.width = 0;
	this.height = 0;
	this.dead = false;
	this.skipResize = 0;
	this.firstInit = true;
	this.periferals = [];

	DOM.element.addEventListener( "addperiferal", evt => this.addPeriferal( evt.target.controller ) );

	this.update = this._update.bind( this );

	this.loadFlash();

	let skin = skins.EightBitcade

	this.initSkin( skin );
	this.resize();

	setTimeout( _ => this._update(), 5 );
	
    }

    loadFlash(){

	let preserve = null;

	if( this.core && this.core.breakpointsEnabled ){
	    preserve = {
		breakpoints: core.breakpoints,
		readBreakpoints: core.readBreakpoints,
		writeBreakpoints: core.writeBreakpoints
	    };
	}

	this.core = null;
	this.state = LOADING;
	
	let url = this.root.getItem("app.AT328P.url", null);
	if( url ){
	    
	    this.core = Atcore.ATmega328P();
	    
	    Hex.parseURL( url, this.core.flash, (success) => {
		if( success )
		    this.initCore( preserve );
	    });
	    return;
	    
	}

	let hex = this.root.getItem("app.AT328P.hex", null);
	if( hex ){
		
	    this.core = Atcore.ATmega328P();
	    Hex.parse( hex, this.core.flash );
	    this.initCore( preserve );
	    return;
	    
	}
	    
	url = this.root.getItem("app.AT32u4.url", null);
	if( url ){

	    this.core = Atcore.ATmega32u4();
	    if( !/.*\/?null$/.test(url) ){
		core.history.push("Loading hex from URL");
		Hex.parseURL( url, this.core.flash, (success, hex) => {

		    if( success ){
			this.initCore( preserve );
			core.hex = hex;
		    }
		    else this.pool.call("showDebugger");

		});
	    }else{
		this.pool.call("showDebugger");
	    }
	    
	    return;
	    
	}

	hex = this.root.getItem("app.AT32u4.hex", null);
	if( hex ){
	    
	    this.core = Atcore.ATmega32u4();
	    try{
		Hex.parse( hex, this.core.flash );
	    }catch(ex){
		this.pool.call("showDebugger");
		return;
	    }
	    this.initCore( preserve );
	    return;
	    
	}

	console.error("Nothing to load");
	
    }

    reset(){
	// prevent from running without a hex
	if( this.state == LOADING )
	    return;
	
	let oldCore = this.core, dbg = false;
	let oldCoreIF = core;
	this.core = new Atcore.ATmega32u4();
	if( oldCore ){
	    this.core.flash.set( oldCore.flash );
	}
	this.initCore( oldCoreIF && {
	    breakpoints:oldCoreIF.breakpoints,
	    readBreakpoints:oldCoreIF.readBreakpoints,
	    writeBreakpoints:oldCoreIF.writeBreakpoints
	});
	
	this.state = PAUSED;
	
    }

    resume(){
	if( this.state == PAUSED )
	    this.core.breakpoints.disableFirst = true;
	if( this.state != LOADING )
	    this.state = RUNNING;
    }

    step(){
	if( this.state == PAUSED ){
	    this.state = STEP;
	    this.core.breakpoints.disableFirst = true;
	}
    }

    pause(){
	if( this.state != LOADING )
	    this.state = PAUSED;
    }

    onPressF8(){
	if( this.core.debuggerEnabled ){
	    this.resume();
	    return true;
	}
    }

    onPressF6(){
	this.reset();
    }

    onPressF7(){
	this.step();
	return true;
    }

    onPressEscape(){
	if( !this.pool.call("hideFlasher") )
	    this.powerOff();
    }

    onPressF3(){
	for( let i=0, l=skinList.length; i<l; ++i ){
	    let name = skinList[i];
	    let skin = skins[name];
	    if( skin == this.skin ){
		name = skinList[(i+1)%skinList.length];
		this.root.setItem("app.skinName", name);
		this.initSkin( skins[ name ] );
		return true;
	    }
	}
    }

    initSkin( skin ){

	if( this.skin && this.skin != emptySkin && skin != emptySkin ){
	    this.initSkin( emptySkin );
	}

	this.skin = skin;
	this.width = 0;
	document.body.style.background = skin.background;
	this.pool.call( "CRTFade", skin.CRTFade );

	let root = this.DOM.element;

	for( let qs in skin.elements ){
	    let settings = skin.elements[qs];
	    let eseqs = emptySkin.elements[qs] = emptySkin.elements[qs] || {};
	    
	    Array.from(root.querySelectorAll(qs)).forEach( e => {
		
		for( let path in settings ){

		    eseqs[path] = "";

		    let value = settings[path], obj = e, prop;
		    
		    path = path.split(".");
		    prop = path.pop();
		    
		    if( path.length ){
			while( path.length )
			    obj = obj[path.shift()];
		    }else{
			if( prop in e.style && !(prop in e) )
			    obj = e.style;
		    }

		    if( typeof obj[prop] == "object" || e == obj ){
			if( value && typeof value == "object" )
			    Object.assign( obj[prop], value );
			else
			    e.setAttribute(prop, value);
		    }else
			obj[prop] = value;
		    
		}
		
	    });
	}

	if( !skin.remap ){
	    this.pool.call("remapKey", {
		ArrowUp:"ArrowUp",
		ArrowRight:"ArrowRight",
		ArrowDown:"ArrowDown",
		ArrowLeft:"ArrowLeft"
	    });
	}else{
	    this.pool.call("remapKey", {
		ArrowUp:"ArrowRight",
		ArrowRight:"ArrowDown",
		ArrowDown:"ArrowLeft",
		ArrowLeft:"ArrowUp"
	    });
	}

	if( skin != emptySkin )
	    this.pool.call("onSetSkin", skin);

    }

    arduboyMode(){
	this.initSkin( skins.EightBitcade );
    }

    microcardMode(){
	this.initSkin( skins.Microcard );
    }

    setActiveView(){
	this.pool.remove(this);
    }

    powerOff(){
	this.pool.remove(this);
	document.body.setAttribute("style", "");
	console.error = this._error;
	this.dead = true;
	self.core = null;
	this.DOM.element.dispatchEvent( new Event("poweroff", {bubbles:true}) );
    }

    initCore( preserve ){
	if( this.firstInit ){
	    this.pool.call("pollForPeriferals", this.periferals);
	    this.firstInit = false;
	}
	window.onerror = evt => {
	    self.core.history.push( "ERROR: " + evt.toString() );
	};
	this._error = console.error;
	console.error = (...args) => {
	    self.core.history.push( "ERROR: " + args.join(" ") );
	    this._error.apply( console, args );
	};
	
	this.root.setItem("ram.core", self.core);
	
	let core = this.core,
	    oldValues = {},
	    DDRB,
	    callbacks = {
		DDRB:{},
		DDRC:{},
		DDRD:{},
		PORTB:{},
		PORTC:{},
		PORTD:{},
		PORTE:{},
		PORTF:{}
	    };
	
	if( preserve ){
	    core.enableDebugger();
	    for( let k in preserve )
		Object.assign( core[k], preserve[k] );
	}

	Object.keys(callbacks).forEach( k =>
					Object.assign(callbacks[k],{
					    onHighToLow:[], 
					    onLowToHigh:[],
					    onChangePWM:[]
					})
				      );

	Object.defineProperties( core.pins, {

            onHighToLow:{value:function( port, bit, cb ){
		(callbacks[ port ].onHighToLow[ bit ] = callbacks[ port ][ bit ] || []).push( cb );
            }},

            onLowToHigh:{value:function( port, bit, cb ){
		(callbacks[ port ].onLowToHigh[ bit ] = callbacks[ port ][ bit ] || []).push( cb );
            }},

            onChangePWM:{value:function( port, bit, cb ){
		(callbacks[ port ].onLowToHigh[ bit ] = callbacks[ port ][ bit ] || []).push( cb );
            }},

            0:{value:{ out:{port:"PORTD", bit:2 }, in:{port:"PIND", bit:2} } },
            1:{value:{ out:{port:"PORTD", bit:3 }, in:{port:"PIND", bit:3} } },
            2:{value:{ out:{port:"PORTD", bit:1 }, in:{port:"PIND", bit:1} } },
            3:{value:{ out:{port:"PORTD", bit:0 }, in:{port:"PIND", bit:0} } },
            4:{value:{ out:{port:"PORTD", bit:4 }, in:{port:"PIND", bit:4} } },
            30:{value:{ out:{port:"PORTD", bit:5 }, in:{port:"PIND", bit:5} } },
            5:{value:{ out:{port:"PORTC", bit:6 }, in:{port:"PINC", bit:6} } },
	    13:{value:{out:{port:"PORTC", bit:7 }, in:{port:"PINC", bit:7} } },	    
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

            serial0Out:{
		value:{
		    listeners:[],
		    push( data ){
			let i=0, listeners=this.listeners, l=listeners.length;
			for(;i<l;++i)
			    listeners[i]( data );
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

	self.pins = core.pins;

	setTimeout( _ =>{
	    this.setupPeriferals();
	    this.JITwarmup();
	    this.state = RUNNING;
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

    JITwarmup(){

	let core = this.core;
	let startPC = core.pc;
	core.pc = 0;

	while( core.pc < core.prog.length )
	    core.getBlock( false );

	core.pc = startPC;

    }

    addPeriferal( ctrl ){
	
	this.periferals.push( ctrl );
	
    }

    setupPeriferals(){
	let pins = this.core.pins;
	let map = { cpu:this.core.pins };
	this.tick = [];

	this.pool.call("onPollTickListeners", this.tick);
	
	this.periferals.forEach( ctrl => {

	    if( ctrl.tick )
		this.tick.push( ctrl );
	    
	    for( let k in ctrl ){

		let v = ctrl[k];
		if( !v || !v.connect || typeof v.connect != "string" )
		    continue;

		v = ctrl[k] = Object.assign({}, v );

		let target = v.connect;
		if(typeof target == "number" )
		    target = "cpu." + target;

		let tobj = map;
		let tparts = target.split(".");
		while( tparts.length && tobj )
		    tobj = tobj[ tparts.shift() ];

		if( v.MOSI )
		    pins.spiOut.listeners.push( v.MOSI.bind( ctrl ) );

		if( v.serial0 )
		    pins.serial0Out.listeners.push( v.serial0.bind(ctrl) );

		if( !tobj ){
		    console.warn("Could not attach wire from ", k, " to ", target);
		    continue;
		}

		if( v.onLowToHigh )
		    pins.onLowToHigh( tobj.out.port, tobj.out.bit, v.onLowToHigh.bind( ctrl ) );
		
		if( v.onHighToLow )
		    pins.onHighToLow( tobj.out.port, tobj.out.bit, v.onHighToLow.bind( ctrl ) );

		if( v.onChangePWM )
		    pins.onChangePWM( tobj.out.port, tobj.out.bit, v.onChangePWM.bind( ctrl ) );

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
	
	switch( this.state ){
	case RUNNING:
	    this.core.update();
	    break;
	case STEP:
	    this.core.exec( (this.core.tick-this.core.endTick+1) / this.core.clock);
	    this.state = PAUSED;
	    this.core.breakpointHit = true;
	    break;
	default:
	    this.resize();
	    return;
	}

	if( this.core.breakpointHit ){
	    this.core.breakpointHit = false;
	    this.state = PAUSED;
	    this.pool.call("onHitBreakpoint", this.core.pc);
	}
	
	for( let i=0, l=this.tick.length; i<l; ++i )
	    this.tick[i].tick();	
	
	this.resize();
	
    }

    onResizeWindow(){
	this.skipResize = 0;
    }

    resize(){
	if( --this.skipResize > 0 )
	    return;

	this.skipResize = 60;
	
	let el = this.DOM.element;
	el.parentElement.style.maxHeight = "";
	el.parentElement.style.maxWidth = "";
	
	let maxHeight = el.parentElement.clientHeight;
	let maxWidth  = el.parentElement.clientWidth;

	if( this.width == maxWidth && this.height == maxHeight )
	    return;
	
	this.width = maxWidth;
	this.height = maxHeight;

	let ratio = 2.8;

	if( this.height * ratio >= this.width ){
	    
	    el.parentElement.style.maxWidth = el.style.width = this.width + "px";
	    el.style.height = (this.width / ratio) + "px";
	    
	}else{
	    
	    el.style.width = (this.height * ratio) + "px";
	    el.parentElement.style.maxHeight = el.style.height = this.height + "px";
	    
	}

	
    }
    
}

module.exports = Arduboy;
