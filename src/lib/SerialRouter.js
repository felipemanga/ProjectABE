let router, hnd, local;

const CMD_SETID  = 0,
      CMD_ADD    = 1,
      CMD_REMOVE = 2;

function log( ...args ){
    console.log.apply(console, args);
    if( typeof core != "undefined" && core && core.history )
	core.history.push(args.join(" "));
}

class Client {
    buffer = [];

    constructor( id ){
	this.id = id;
	this.write = null;
	this.state = 0;
    }

    onGetData( data ){
	let id = this.id, buffer = this.buffer;

	if( this.state == -1 )
	    return;
	if( this.state <= 9 && "ROUTERv1\r\n".charCodeAt(this.state++) != data ){
	    log( "Mismatch: ", this.state, data );
	    this.state = -1;
	    return;
	}

	switch( this.state ){
	case 10:
	    this.state++;
	    this.command( CMD_SETID, this.id );
	    
	    for( let i=0; i<router.clients.length; ++i ){
		if( i+1 !== this.id && router.clients[i] ){
		    router.clients[i].command( CMD_ADD, this.id );
		    this.command( CMD_ADD, i+1 );
		}
	    }
	    
	    break;
	case 11:
	
	    if( data && data.length )
		buffer.push( ...data );
	    else
		buffer.push(data);
	    
	    if( buffer[0] == buffer.length-1 )
		router.broadcast( id, buffer );
	    
	    break;
	}
		
    }

    command( c, ...data ){
	log( this.id, "<-: ", ["SetID", "ADD", "REMOVE"][c], data );
	this.write(0);
	this.write(data.length+1);
	this.write(c);
	data.forEach( d => this.write(d) );
    }

    disconnect(){
	if( this.connectionId ){
	    let conErr;
	    chrome.serial.disconnect( this.connectionId, ret => {
		conErr = chrome.runtime.lastError;
	    });
	    delete pathClientMap[ idPathMap[ this.connectionId ] ];
	    delete idPathMap[ this.connectionId ];
	    this.connectionId = 0;
	}
	router.removeClient( this.id );
    }
}

let pathClientMap = {};
let idPathMap = {};

function writeSerial( v ){

    let that = this;
    let id = this.connectionId;
    if( !id ) return;

    if( !this.queue )
	this.queue = [];

    let queue = this.queue;

    if( typeof v == 'number' ){
	let tmp = new Uint8Array(1);
	tmp[0] = v;
	v = tmp;
    }else v = new Uint8Array(v);

    queue.push(v);
    
    if( queue.length==1 )
	resend( queue[0] );
    
    return;

    function resend( v ){
	chrome.serial.send( id, v, ret => {
	    if( ret.error == "pending" ){
		log( "Resending ", id, v );
		return setTimeout( _=>resend(v), 1 );
	    }else if( ret.error ){
		log( "Send Error", ret.error );
		that.disconnect();
	    }else{
		queue.shift();
		if( queue.length )
		    resend(queue[0]);
	    }
	});
    }
    
}

chrome.serial.onReceive.addListener( info => {
    let clients = router.clients;
    let path = idPathMap[ info.connectionId ];
    let c = pathClientMap[ path ];
    if( c ){
	let data = new Uint8Array( info.data );
	for( let i=0; i<data.length; ++i )
	    c.onGetData( data[i] );
    }
});

class SerialRouter {
    
    state = 0;
    clients = [];

    constructor( app ){
	this.app = app;
	router = this;
	hnd = setInterval( _ => this.pollSerialPort(), 1000 );
    }

    pollSerialPort(){
	if( this.app.pool.call("flasherActive") )
	    return;

	chrome.serial.getConnections( cons => {
	    for( let i=0; i<cons.length; ++i ){
		let con = cons[i];
		let path = idPathMap[con.connectionId];
		let client = pathClientMap[path];
		if( client && con.paused )
		    client.disconnect();
	    }
	});

	chrome.serial.getDevices( devs => {
	    devs.forEach( dev => checkDevice.call(this, dev) );
	});

	function checkDevice( dev ){
	    let client = pathClientMap[ dev.path ];
	    if( client )
		return;
	    
	    pathClientMap[ dev.path ] = true;
	    log("new device", dev.path);
	    
	    chrome.serial.connect( dev.path, con => {
		if( con.connectionId ){
		    log("connected", dev.path, con.connectionId);
		    
		    let client = this.addClient({
			connectionId:con.connectionId,
			write:writeSerial
		    });
		    
		    pathClientMap[ dev.path ] = client;
		    idPathMap[con.connectionId] = dev.path;
		    
		}else{
		    log("could not connect", con);
		    delete pathClientMap[ dev.path ];
		}
		    
	    });
	    
	}
	
    }

    removeClient( id ){
	let clients = this.clients;

	log( "removing client", id );
	
	if( !clients[id-1] )
	    return;

	if( clients[id-1] == local )
	    local = null;

	clients[id-1] = null;
	
	for( let i=0; i<clients.length; ++i )
	    if( clients[i] ) clients[i].command(CMD_REMOVE, id);
    }
    
    addClient( opt ){
	log( "adding client" );
	
	let id, c;
	for( id=0; this.clients[id]; id++ );

	c = new Client( id+1 );
	Object.assign( c, opt );
	this.clients[id] = c;

	return c;
    }
    
    pollForPeriferals( periferals ){
	periferals.push(this);
    }
    
    addLocalClient(){
	if( local )
	    return;
	local = this.addClient({
	    write:function( v ){
		if( typeof v == 'number' )
		    pins.serial0In = v;
		else{
		    for( var i=0; i<v.length; ++i )
			pins.serial0In = v[i];			
		}
	    }
	});
    }

    broadcast( from, buffer ){

	// log("BC: ", from, buffer);

	let clients = this.clients;
	
	for( let i=0; i<clients.length; ++i )
	    if( i+1 != from && clients[i] )
		clients[i].write( [from, ...buffer] );

	buffer.length = 0;

    }

    endpoint = {
	connect:"cpu.0",

	init:function(){
	    
	    if( local )
		local.disconnect();

	    this.addLocalClient();
	    
	},

	serial0:function( v ){
	    local.onGetData(v);
	}
    }
}

module.exports = SerialRouter;
