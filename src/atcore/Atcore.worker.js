import Atcore from './Atcore.js';
import * as externals from './externalPeriferals/*.js'
import Hex from './hex.js';

var cores = {}, nextID=0, diff = {}, dirty = false;

var scope = { create, destroy, destroyAll };

self.onmessage = function( msg ){
    var cmd = msg.data.cmd;
    if( typeof scope[cmd] == "function" )
        scope[cmd]( msg.data );

};

postMessage({info:"ready"});

setInterval( tick, 66 );

function tick(){

    for( var k in cores )
        cores[k].update();

    if( dirty ){
        postMessage( diff );
        diff = {};
        dirty = false;
    }

}

function create({ url, MID, periferals }){

    var core = Atcore.ATmega328P();
    var id, oldValues = {};
    
    var DDRB;
    var callbacks = {
        DDRB:{},
        DDRC:{},
        DDRD:{},
        PORTB:{},
        PORTC:{},
        PORTD:{}
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

        13:{value:{ out:{port:"PORTB", bit:5 }, in:{port:"PINB", bit:5} } },
        12:{value:{ out:{port:"PORTB", bit:4 }, in:{port:"PINB", bit:4} } },
        11:{value:{ out:{port:"PORTB", bit:3 }, in:{port:"PINB", bit:3} } },
        10:{value:{ out:{port:"PORTB", bit:2 }, in:{port:"PINB", bit:2} } },
         9:{value:{ out:{port:"PORTB", bit:1 }, in:{port:"PINB", bit:1} } },
         8:{value:{ out:{port:"PORTB", bit:0 }, in:{port:"PINB", bit:0} } },

        serial0:{
            set:function( str ){
                diff[id] = diff[id] || {}; dirty = true;
                diff[id].serial0 = (diff[id].serial0||"") + str;
            }
        },

        DDRB: {
            set:function( cur ){
                var old = oldValues.DDRB;
                
                if( old === cur ) return;
                diff[id] = diff[id] || {}; dirty = true;
                
                oldValues.DDRB = diff[id].DDRB = cur;
            },
            get:function(){
                return oldValues.DDRB|0;
            }
        },
        DDRC: {
            set:function(_dirty){
                if( oldValues.DDRC === core.pins.DDRC ) return;
                diff[id] = diff[id] || {}; dirty = true;
                oldValues.DDRC = diff[id].DDRC = core.pins.DDRC;
            }
        },
        DDRD: {
            set:function(_dirty){
                if( oldValues.DDRD === core.pins.DDRD ) return;
                diff[id] = diff[id] || {}; dirty = true;
                oldValues.DDRD = diff[id].DDRD = core.pins.DDRD;
            }
        },
        PORTB: {
            set:function( cur ){
                var old = oldValues.PORTB;
                
                if( old === cur ) return;
                diff[id] = diff[id] || {}; dirty = true;

                var s, j, l, lth = callbacks.PORTB.onLowToHigh, htl = callbacks.PORTB.onHighToLow, tick = core.tick;

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

                oldValues.PORTB = diff[id].PORTB = cur;

            }
        },
        PORTC: {
            set:function(_dirty){
                if( oldValues.PORTC === core.pins.PORTC ) return;
                diff[id] = diff[id] || {}; dirty = true;
                oldValues.PORTC = diff[id].PORTC = core.pins.PORTC;
            }
        },
        PORTD: {
            set:function(_dirty){
                if( oldValues.PORTD === core.pins.PORTD ) return;
                diff[id] = diff[id] || {}; dirty = true;
                oldValues.PORTD = diff[id].PORTD = core.pins.PORTD;
            }
        }

    });

    Hex.parseURL( url, core.flash, (success)=>{

        if( !success )
            return postMessage({ status:false, MID });

        id = ++nextID;
        cores[ id ] = core;

        if( periferals )
            setupPeriferals( periferals, core );

        postMessage({ status:id, MID });

    });

}

function destroy({ id }){

    var core = cores[id];
    if( core === undefined )
        return;

    delete cores[id];

}

function destroyAll(){
    cores = {};
}

function setupPeriferals( periferals, core ){

    let map = { cpu:core.pins };

    for( let periferal of periferals ){

        if( !(periferal.name in externals) ){
            console.warn( "Invalid external periferal name: ", periferal.name );
            return;
        }
    
        map[periferal.id] = new externals[ periferal.name ]( core );
                    
    }
    
    for( let periferal of periferals ){

        var wires = periferal.connect;
        for( var key in wires ){
            
            var sobj = map, tobj = map;
            var keyparts = key.split("."), valparts = wires[key].split(".");

            while( keyparts.length>1 && sobj )
                sobj = sobj[ keyparts.shift() ];

            if( !sobj || !sobj[keyparts[0]] ){
                console.warn("Could not attach wire from ", key, "to", wires[key], " - Bad source");
                continue;
            }

            while( valparts.length && tobj )
                tobj = tobj[ valparts.shift() ];

            if( !tobj ){
                console.warn("Could not attach wire from ", key, "to", wires[key], " - Bad target");
                continue;
            }
    
            sobj[keyparts[0]].connect( tobj, core );

        }

    }

}