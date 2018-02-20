let router;

class Client {
    buffer = [];

    constructor( id ){
	this.id = id;
	this.write = 0;
    }

    onGetData( data ){
	let id = this.id, buffer = this.buffer;
	buffer.push(data);
	if( buffer[0] == buffer.length-1 )
	    router.broadcast(id,buffer);
    }
}

class SerialRouter {
    state = 0;
    clients = [];

    constructor(){
	router = this;
    }
    
    pollForPeriferals( periferals ){
	periferals.push(this);
    }
    
    addLocalClient(){
	let c = this.clients[0] = new Client(1);
	c.write = function( v ){
	    pins.serial0In = v;
	};
	c.write(1);
    }

    broadcast( from, buffer ){

	console.log("BC: ", from, buffer);
	
	for( let i=0, c; c=this.clients[i++]; )
	    if( i+1 != from ) c.write( from );

	while( buffer.length ){
	    let b = buffer.shift();
	    for( let i=0, c; c=this.clients[i++]; )
		if( i+1 != from ) c.write( b );
	}
	
    }

    endpoint = {
	connect:"cpu.0",

	init:function(){
	    this.state = 0;
	},

	serial0:function( v ){
	    if( this.state == -1 )
		return;
	    if( this.state <= 9 && "ROUTERv1\r\n".charCodeAt(this.state++) != v ){
		console.log("Mismatch: ", this.state, v);
		this.state = -1;
		return;
	    }

	    switch( this.state ){
	    case 10:
		this.state++;
		this.addLocalClient();
		break;
	    case 11:
		this.clients[0].onGetData(v);
		break;
	    }
	}
    }
}

module.exports = SerialRouter;
