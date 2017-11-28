const { execFile } = require('child_process');
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

let nbid = 1;
let queue = [], builders = {}, busy = false;

function Builder(){

    this.id = nbid++;

    this.result = "";

    this.state = "INIT";

    builders[ this.id ] = this;
    
    this.destroy = _ => {	
	if( builders[ this.id ] == this )
	    delete builders[ this.id ];
    };
    
    this.resetDestroy = _ => {
	this.destroyHND = setTimeout( this.destroy, 60 * 1000 );
    };
    
    this.resetDestroy();
    
    this.addData = data => {
	this.resetDestroy();
	console.log("DATA:{" + data + "}");
	return true;
    };

    this.start = _ => {
	this.resetDestroy();
	queue.push( this );
	this.state = "QUEUED";
    };

    this.run = _ => {

	if( this.state != "QUEUED" ) return;

	this.resetDestroy();
	this.state = "BUILDING";
	busy = true;

	const child = execFile('node', ['--version'], (error, stdout, stderr) => {
	    
	    busy = false;
	    this.state = "DONE";

	    if( error ){
		this.result = "ERROR: " + error;
	    }else if( stderr ){
		this.result = stderr;
	    }else{
		this.result = stdout;
	    }
	    
	});
	
    };
    
}



setInterval( _ => {
    
    if( !queue.length || busy )
	return;

    let next = queue.shift();
    next.run();
    
}, 1000 );

express()
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .get('/poll', (req, res) => {

	let builder = builders[ req.query.id ];
	
	res.writeHead(200, {'Content-Type': 'text/plain'});
	if( builder ){
	    
	    if( builder.state !== "DONE" )
		res.end( builder.state );
	    else
		res.end( builder.result );
	    
	}else
	    res.end( "DESTROYED" );
	
    })
    .post('/build', (req, res) => {

	let builder;
	if( req.query.id ){
	    
	    builder = builders[req.query.id];
	    if( !builder ){
		
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end( "DESTROYED" );
		
	    }else if( builder.state != "DONE" ){
		
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end( builder.state );
		
	    }else{
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end(  );
		return;		
	    }
		
	}else
	    builder = new Builder();

	req.on('data', function (data) {
	    if( !builder.addData( data ) )
		req.connection.destroy();
	});

	req.on('end', function () {
	    
	    builder.start();
	    res.writeHead(200, {'Content-Type': 'text/plain'});
	    res.end( builder.id.toString() );
	    
	});
	
    })
    .listen(PORT, () => console.log(`Listening on ${ PORT }`))
