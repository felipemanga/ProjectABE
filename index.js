const { execFile, execSync } = require('child_process');
const fs = require('fs');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;

let nbid = 1;
let queue = [], builders = {}, busy = false;

function sendHeaders( res ){

    res.writeHead(200, {
	'Content-Type': 'text/plain'
    });
    
}

function Builder(){

    this.id = nbid++;

    this.result = "";

    this.state = "INIT";

    builders[ this.id ] = this;

    fs.mkdirSync(__dirname + '/builds/' + this.id);
    fs.mkdirSync(__dirname + '/public/builds/' + this.id);

    let data = '', stdout = '', disassembly = '';

    let main = null;

    let retry = {};
    
    this.destroy = _ => {	
	if( builders[ this.id ] == this )
	    delete builders[ this.id ];
	try{
	    rimraf( __dirname + '/builds/' + this.id, _ => {});
	}catch( err ){
	    console.error(err);
	}
	try{
	    rimraf( __dirname + '/public/builds/' + this.id, _ => {});
	}catch( err ){
	    console.error(err);
	}
    };
    
    this.resetDestroy = _ => {
	this.destroyHND = setTimeout( this.destroy, 60 * 1000 );
    };
    
    this.resetDestroy();
    
    this.addData = _data => {
	data += _data;
	if( data.length > 3 * 1024 * 1024 ){
	    data = '';
	    return false;
	}
	this.resetDestroy();
	return true;
    };

    this.start = _ => {
	
	try{
	    data = JSON.parse(data);
	}catch( ex ){
	    data = '';
	    this.result = ex.toString();
	    this.state = "DONE";
	    return;
	}
	
	this.resetDestroy();
	queue.push( this );
	this.state = "QUEUED";
	
    };

    this.run = _ => {

	if( this.state != "QUEUED" ) return;

	this.resetDestroy();
	this.state = "BUILDING";
	busy = true;

	let files = Object.keys( data );
	this.pop( files );
    };

    this.pop = files => {
	
	if( !files.length )
	    return this.compile();
	
	let file = files.shift().replace(/\\/g, '/'); // convert \ to /
	let fullPath = __dirname + '/builds/' + this.id + '/' + file.replace(/\/\.+\//g, '/'); // remove shenanigans
	
	if( /.*?[^\/]+.ino$/i.test(fullPath) )
	    main = fullPath;

	let parts = fullPath.split('/');
	parts.pop();
	mkdirp( parts.join('/'), e => {

	    fs.writeFile( fullPath, data[file], e => {
		
		if( e ){
		    this.state = 'DONE';
		    busy = false;
		    this.result = "ERROR: " + file + " - " + e.toString();
		    return;
		}

		fs.access( fullPath, (e) => {
		    if( e ){
			if( retry[ file ] ){
			    this.state = 'DONE';
			    busy = false;
			    this.result = "ERROR: " + file + " - " + e.toString();
			    return;
			}else{
			    stdout += "Retrying file " + file + "\n";
			    retry[ file ] = 1;
			    files.push( file );
			}
		    }else stdout += "Saved file " + file + "\n";
		    
		    return this.pop(files);
		});

	    });
	    
	});
    };

    this.compile = _ => {
	
	if( main === null ){
	    this.state = "DONE";
	    this.result = "ERROR: main.ino not found";
	    busy = false;
	    return;
	}
	
	try{	    

	    const child = execFile(
		__dirname + '/arduino/arduino',
		[
		    '--board', 'arduino:avr:leonardo',
		    '--pref', 'build.path=' + __dirname + '/public/builds/' + this.id + '/',
		    '--verify', main
		],
		(error, _stdout, stderr) => {

		    stdout += _stdout;
		    
		    if( error ){
			busy = false;
			this.state = "DONE";
			this.result = "ERROR: " + error + " " + stderr;
		    }else{
			this.disassemble();
		    }
		    
		});
	    
	}catch( ex ){
	    
	    this.result = "ERROR: " + ex;
	    this.state = "DONE";
	    busy = false;
	    
	}
	
    };

    this.disassemble = _ =>{

	try{

	    execFile(
		__dirname + '/arduino/hardware/tools/avr/bin/avr-objdump',
		[
		    '-dl',
		    __dirname + '/public/builds/' + this.id + '/' + main.replace(/.*?([^\/]+)$/, '$1') + '.elf'
		],
		{
		    maxBuffer:3*1024*1024
		},
		( error, da, stderr ) => {
		    disassembly = da + stderr;
		    this.complete();
		    try{
			fs.close(out);
		    }catch(ex){
		    }
		}
	    );
		    
	}catch( ex ){
	    this.complete(false);
	}
	
    };

    this.complete = hasDA => {
	
	busy = false;
	this.state = "DONE";
			
	this.result = JSON.stringify({
	    path:'/builds/' + this.id + '/' + main.replace(/.*?([^\/]+)$/, '$1') + '.hex',
	    disassembly: disassembly,
	    stdout
	});
	
    };
    
}



setInterval( _ => {
    
    if( !queue.length || busy )
	return;

    let next = queue.shift();
    next.run();
    
}, 1000 );

execSync("chmod +x -R " + __dirname + "/arduino/");

express()
    .get('/*',function(req,res,next){
	res.header('Access-Control-Allow-Origin', '*');
	next();
    })
    .post('/*',function(req,res,next){
	res.header('Access-Control-Allow-Origin', '*');
	next();
    })
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .get('/poll', (req, res) => {

	let builder = builders[ req.query.id ];
	
	sendHeaders( res );
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
		
		sendHeaders( res );
		res.end( "DESTROYED" );
		return;
		
	    }else if( builder.state != "DONE" ){
		
		sendHeaders( res );
		res.end( builder.state );
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
	    sendHeaders( res );
	    res.end( builder.id.toString() );
	    
	});
	
    })
    .listen(PORT, () => console.log(`Listening on ${ PORT }`))
