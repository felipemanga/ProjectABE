// import Hex from '../atcore/Hex.js';

var Hex = require('intel-hex');

var busy = false;

function abtostr( buffer ){
    let str = '';
    let b = new Uint8Array( buffer );
    for( let i=0, l=b && b.length; i<l; ++i )
	str += String.fromCharCode( b[i] );
    return str;
}

function d(c){
    return (c+'').charCodeAt(0);
}

let idReadMap = {};
let serial = {
    wait:function( time ){
	return new Promise( (ok, nok) => {
	    setTimeout( _ => ok(true), time );
	});
    },

    read:function( id ){
	return new Promise( (ok, nok) => {
	    idReadMap[id] = data => {
		idReadMap[id] = null;
		ok(data);
	    };
	});
    },
    
    write:function( id, data ){
	
	if( typeof data == "string" ){
	    let tmp = new Uint8Array( data.length );
	    for( let i=0; i<data.length; ++i )
		tmp[i] = data.charCodeAt(i);
	    data = tmp.buffer;
	}else if( Array.isArray(data) ){
	    data = new Uint8Array( data );
	}
	
	return serial.send( id, data ).then( info => {
	    if( info.error )
		throw info.error;
	});
	    
    }
};

chrome.serial.onReceive.addListener( info => {
    if( idReadMap[info.connectionId] )
	idReadMap[info.connectionId]( info.data );
});

Object.keys(chrome.serial).forEach( k => {
    if( typeof chrome.serial[k] != "function" ) return;
    serial[k] = function( ...args ){
	return new Promise( (ok, nok) => {
	    let full = [...args, (arg) => {
		if( !arg ) nok();
		else ok( arg );
	    }];
	    try{
		chrome.serial[k].apply( chrome.serial, full );
	    }catch( ex ){
		nok(ex);
	    }
	});
    };
});

let _logcontainer;

class ChromeSerial {
    constructor( app ){
	this.app = app;
    }

    onPressKeyU(){
	setTimeout( _ => this.doFlash( true ), 10 );
    }

    onPressEscape(){
	if( _logcontainer )
	    _logcontainer.style.display = "none";
    }

    doFlash( mustConfirm ){
	if( busy ) return;
	let path = this.app.root.getItem("app.srcpath");
	if( !path ) return;
	let source = this.app.root.getModel( path, false );
	if( !source ) return;
	let build = source.getItem(["build.hex"]);
	if( !build || (mustConfirm && !confirm("Upload game to Arduboy?\nRemember to press and hold the Up button on the Arduboy.")) ) return;

	let buffer = Hex.parse( build ).data;
	let size = buffer.length;
	let resetCount = 0;

	if( size > 28672 ){
	    alert("Sketch is too big!");
	    return;
	}

	_logcontainer = document.getElementsByTagName("log");
	if( _logcontainer[0] )
	    _logcontainer = _logcontainer[0];
	else{
	    _logcontainer = document.createElement("log");
	    document.body.appendChild( _logcontainer );
	}
	    
	function log( ...args ){
	    if( !_logcontainer ) return;
	    let c = document.createElement("div");
	    c.textContent = args.join(" ");
	    _logcontainer.appendChild( c );
	}
	function active(){
	    return !_logcontainer || (_logcontainer && _logcontainer.style.display == "block");
	}
	if( _logcontainer ){
	    while( _logcontainer.children.length )
		_logcontainer.removeChild( _logcontainer.children[0] );
	    _logcontainer.style.display = "block";
	}

	let state = "search", message, devices = {}, compat = [
	    {
		productId:0x8036,
		vendorId:9025,
		onMatch: reset
	    },
	    {
		productId:0x0036,
		vendorId:9025,
		onMatch: upload
	    },
	    {
		productId:0x8037,
		vendorId:9025,
		onMatch: reset
	    },
	    {
		productId:0x0037,
		vendorId:9025,
		onMatch: upload
	    }
	];

	function forget( obj ){
	    
	    log( obj.path, "Forgetting ", obj.connectionId );
	    
	    if( obj.connectionId )
		serial.disconnect( obj.connectionId ).then( _ => {} ).catch( _ => {} );

	    obj.connectionId = 0;
	    
	    if( devices[obj.path] == obj )
		delete devices[obj.path];
	    
	}

	function prepare( id ){
	    return new Promise( (ok, nok) => {
		let flashChunkSize;
		serial.write( id, 'S' ).then( ok => serial.read( id ) )
		    .then( data => {
			data = abtostr(data);
			if( data !== 'CATERIN' && data !== 'ARDUBOY' ){
			    state = "done";
			    message = "Unsupported device: " + data;
			    throw new Error(message);
			}
			return serial.write(id,'V');
		    })
		    .then( ok => serial.write(id,'v'))
		    .then( ok => serial.write(id,'p'))
		    .then( ok => serial.write(id,'a'))
		    .then( ok => serial.write(id,'b'))
		    .then( ok => serial.read(id))
		    .then( data => {
			data = new Uint8Array( data );
			if( data[0] != d('Y') ){
			    throw new Error('Buffered memory access not supported.');
			}
			flashChunkSize = (data[1]<<8) + data[2];// d.readUInt16BE(1);
			resetCount = 0;
		    })
		    .then( ok => serial.write(id,'t'))
		    .then( ok => serial.write(id,'TD'))
		    .then( ok => serial.write(id,'P'))
		    .then( ok => serial.write(id,'F'))
		    .then( ok => serial.write(id,'F'))
		    .then( ok => serial.write(id,'F'))
		    .then( ok => serial.write(id,'N'))
		    .then( ok => serial.write(id,'N'))
		    .then( ok => serial.write(id,'N'))
		    .then( ok => serial.write(id,'Q'))
		    .then( ok => serial.write(id,'Q'))
		    .then( ok => serial.write(id,'Q'))
		    .then( ok => serial.write(id,[d('A'), 0x03, 0xfc]))
		    .then( ok => serial.write(id,[d('g'), 0x00, 0x01, d('E')]))
		    .then( ok => serial.write(id,[d('A'), 0x03, 0xff]))
		    .then( ok => serial.write(id,[d('g'), 0x00, 0x01, d('E')]))
		    .then( ok => serial.write(id,[d('A'), 0x03, 0xff]))
		    .then( ok => serial.write(id,[d('g'), 0x00, 0x01, d('E')]))
		    .then( ok => serial.write(id,[d('A'), 0x03, 0xff]))
		    .then( ok => serial.write(id,[d('g'), 0x00, 0x01, d('E')]))
		    .then( _ => ok( flashChunkSize ) )
		    .catch( ex => nok( ex ) );
	    });
	}

	function erase( id ){
	    return serial.write( id, 'e' );
	}

	function fuseCheck( id ){
	    return serial.write(id,'F')
		.then( ok => serial.write(id,'F') )
		.then( ok => serial.write(id,'F') )
		.then( ok => serial.write(id,'N') )
		.then( ok => serial.write(id,'N') )
		.then( ok => serial.write(id,'N') )
		.then( ok => serial.write(id,'Q') )
		.then( ok => serial.write(id,'Q') )
		.then( ok => serial.write(id,'Q') )
		.then( ok => serial.write(id,'L') )
		.then( ok => serial.write(id,'E') );
	}

	function upload(){
	    let id, flashChunkSize;
	    serial.connect( this.path, { bitrate:57600 } )
		.then( desc => {

		    id = this.connectionId = desc.connectionId;

		    log( this.path, "Uploading", id );

		    return prepare(id);

		})
		.then( fcs => {
		    flashChunkSize = fcs;
		    // log( this.path, "FCS: ", flashChunkSize );
		    return erase(id);
		})
		.then( ok => serial.write( id, [d('A'), 0, 0]) )
		.then( ok => {
		    return new Promise( (ok, nok) => {
			let p = 0;
			send();
			
			function send(){
			    if( p >= size ){
				ok();
				return;
			    }
				
			    let chunk = buffer.slice(p, p+flashChunkSize);
			    let e = chunk.length;
			    p += e;
			    serial
				.write( id, [d('B'), (e >> 8) & 0xFF, e & 0xFF, d('F'), ... chunk])
				.then( ok => { send(); } )
				.catch( err => nok(new Error("Transmission error: " + err) ) );
			};
		    });
		})
		.then( ok => {
		    // log( this.path, "FuseCheck"); 
		    fuseCheck( id );
		})
		.then( ok => serial.flush( id ) )
		.then( ok => serial.wait( 100 ) )
		.then( ok => {
		    log( this.path, "Complete. Disconnect Arduboy.", id );
		    
		    let ping = () => {
			serial.write( id, [d('g'), 0, 0, 0])
			    .then( ok => serial.wait(1000) )
			    .then( ok => {
				ping();
			    })
			    .catch( err => forget( this ) );
		    }

		    ping();

		})
		.catch( ex => {
		    log( this.path, "Error", ex );
		    forget(this);
		});
	}

	function reset(){
	    if( resetCount >= 10 ){
		state = "done";
		message = "Could not connect to device.\nDid you hold the Up button?";
		return;
	    }

	    let connectionId;

	    log( this.path, ": Reset started" );
	    
	    serial.connect( this.path, { bitrate:1200 } )
		.then( obj =>{
		    connectionId = this.connectionId = obj.connectionId;
		    log( this.path, "Connected", connectionId );
		    return serial.wait( 10 );
		})
		.then( ok => {
		    // log( this.path, "DTR=true" );
		    return serial.setControlSignals( connectionId, {dtr:true, rts:true} )
		})
		.then( ok => {
		    // log( this.path, "DTR=false" );
		    return serial.setControlSignals( connectionId, {dtr:false, rts:false} )
		})
		.then( ok => {
		    // log( this.path, "flush" );
		    return serial.flush( connectionId );
		})
		.then( ok => serial.wait( 500 ) )
		.then( ok => {
		    
		    // log( this.path, "disconnecting" );
		    this.connectionId = 0;
		    serial.disconnect( connectionId )
			.then( ok => {
			    log( this.path, "Reset complete" );
			    resetCount++;
			})
			.catch( err => {
			    log( this.path, "Reset complete" );
			    resetCount++;
			});
		    
		})
		.catch( err => {
		    log( this.path, "Reset Error", err );
		    forget(this);
		});

	}

	function match( device, fp ){

	    for( let k in fp ){
		if( k in device && fp[k] !== device[k] )
		    return false;
	    }				    
	    
	    return true;
	}

	busy = true;
	var firstTry = true;

	log("Flash mode - press Esc to exit");
	log("Searching for Arduboy.");
	
	let hnd = setInterval( _ => {

	    if( !active() ){
		clearInterval( hnd );
		// alert( message );
		log( message );
		busy = false;
	    }else
		serial.getDevices().then( list => {

		    let keepAlive = {};

		    list.forEach( device => {

			keepAlive[ device.path ] = true;

			let c = compat.find( fp => match(device, fp) );
			
			if( devices[ device.path ] && match( device, devices[device.path].fp) ){
			    return;
			}

			if( c ){
			    device = devices[ device.path ] = Object.assign({ fp:c }, c, device );
			    device.onMatch();
			}else{
			    log("No match for ", device);
			}

		    });

		    for( var k in devices ){
			if( !keepAlive[k] )
			    forget(devices[k]);
		    }

		});
	    
	    
	}, 15);
    }

}

module.exports = ChromeSerial;
