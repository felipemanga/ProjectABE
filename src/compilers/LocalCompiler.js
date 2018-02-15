/*


To convert the Sketch into a valid C++ file, a number of actions are needed:

If the Sketch is composed by many .ino files, those files are concatenated together into a single .ino.cpp file
An #inlcude <Arduino.h> is added at the beginning of the Sketch if not already present
All needed libraries are detected and include paths are discovered
All #include directives are replaced with the actual content of the files included (this is made with a run of gcc or another command line compatible compiler with the -E flag)
and finally:

The resulting file is preprocessed to automatically add missing function prototypes (forward declarations)
The arduino-preprocessor tool takes care to handle this last step.

*/

const PATH = window.require('path');
const process = window.require('process');
const fs = window.require('fs');
const os = window.require('os');
const chproc = window.require('child_process');

function normalize( path ){
    /* * /
    return path.replace(/\\/, '/')
	.replace( /\/\.?\/|\/[^\/]\/\.\.\//g, '/' )
	.replace(/\/+/g, '/');
    /*/
    return PATH.normalize( path );
    /* */
}

class LocalCompiler {

    constructor(){
	
	this.compilerPath = "";
	this.compilerExec = "";
	this.includePaths = [];
	this.libraries = {};
	this.flags = [
	    '-mmcu=atmega32u4',
	    '-DF_CPU=16000000L',
	    '-DARDUINO=10805',
	    '-DARDUINO_AVR_LEONARDO',
	    '-DARDUINO_ARCH_AVR',
	    '-DUSB_VID=0x2341',
	    '-DUSB_PID=0x8036',
	    '-DUSB_MANUFACTURER="Unknown"',
	    '-DUSB_PRODUCT="Arduino Leonardo"'
	];

	let home = [os.homedir(), 'Arduino', 'libraries'].join(PATH.sep);
	if( fs.existsSync( home ) )
	    this.addLibDir( home );

    }

    addLibDir( rootdir ){
	
	try{
	    fs.readdirSync( rootdir )
		.forEach( dir => {
		    let fullDir = rootdir + PATH.sep + dir;
		    if( !fs.lstatSync( fullDir ).isDirectory() )
			return;
		    
		    try{
			if( fs.lstatSync( fullDir + PATH.sep + 'src' ).isDirectory() )
			    fullDir += PATH.sep + 'src';
		    }catch(ex){}
			
		    this.libraries[dir] = fullDir;		    
		});		    
	}catch(ex){}
	
    }

    findCompiler(){
	if( this.compilerPath )
	    return;

	console.log("Looking for avr-gcc.");
	
	let ext = process.platform == 'win32' ? '.exe' : '';

	let queue = [
	    PATH.resolve('.'),
	    ...process.env.PATH.split(PATH.delimiter)
	];
	if( process.env.programfiles )
	    queue.push( process.env.programfiles + PATH.sep + 'arduino');

	let path = undefined;
	
	queue.find( x => {

	    let arduino = false;
	    
	    if( fs.existsSync( x + PATH.sep + 'avr-gcc' + ext ) ){
		x = x + PATH.sep + 'avr-gcc' + ext;
		this.compilerExec = x;
	    }else if( fs.existsSync( x + PATH.sep + 'arduino' + ext ) ){
		x = x + PATH.sep + 'arduino' + ext;
		arduino = true;
	    }else return false;
	    
	    try{
		x = fs.readlinkSync( x );
	    }catch(ex){}

	    x = PATH.dirname( x );

	    if( arduino ){
		let gcc = [x, 'hardware', 'tools', 'avr', 'bin', 'avr-gcc' + ext].join(PATH.sep);
		if( !fs.existsSync( gcc ) )
		    return false;

		this.addLibDir( [x, 'libraries'].join( PATH.sep ) );
		this.addLibDir( [x, 'hardware', 'arduino', 'avr', 'cores'].join( PATH.sep ) );
		this.addLibDir( [x, 'hardware', 'arduino', 'avr', 'libraries'].join( PATH.sep ) );
		this.libraries['__leonardo'] = [x, 'hardware', 'arduino', 'avr', 'variants', 'leonardo'].join( PATH.sep );

		this.compilerExec = gcc;
		
		x = PATH.dirname( gcc );

	    }

	    path = x;

	    return true;
	    
	});

	return this.compilerPath = path;
    }
    
    build( srcdata ){

	return new Promise( (ok, nok) => {

	    let gccpath = this.findCompiler();

	    if( !gccpath ) return nok("No Arduino IDE found");

	    let data = {};
	    for( let k in srcdata )
		data[ normalize(k) ] = srcdata[k];
	    
	    let ino =
		'#include <Arduino.h>\n' +
		Object
		.keys( data )
		.filter( name => /\.ino$/i.test(name) )
		.reduce( (acc, name) => acc + data[name], '' );

	    let libs = this.getLibList(ino, data);

	    let flags = [];

	    for( var lib in this.libraries )
		flags.push( '-I', this.libraries[lib] );

	    let args = [...flags, ...this.flags, '-E','-o','build.ii', '-'];

	    let child = chproc.spawn(
		this.compilerExec,
		args
	    );

	    let acc = args.join(" ") + '\n';

	    child.stdout.on('data', data => {
		console.log("STDOUT: ", data);
	    });

	    child.stderr.on('data', data => {
		for( let i=0, l=data.length; i<l; ++i )
		    acc += String.fromCharCode(data[i]);
	    });

	    
	    child.stdin.setEncoding('utf-8');
	    child.stdin.write( ino );
	    child.stdin.end();
	    
	    child.on('close', code => code ? nok(acc) : ok() );

	});
	
    }

    getLibList( ino, files ){
	let libs = {};
	let state = 0;
	
	for( let i=0, l=ino.length; i<l; ++i ){
	    let ch = ino[i];
	    switch( state ){
	    case 0:
		switch( ch ){
		case '"': state = 1; break;
		case '/': state = 2; break;
		case '#': state = 3; break;
		}
		break;
	    case 1:
		switch( ch ){
		case '"': state = 0; break;
		case '\\': ++i; break;
		}
		break;
	    case 2:
		switch( ch ){
		case '*': state = 4; break;
		case '/': state = 6; break;
		default: state = 0; break;
		}
		break;
	    case 3:
		{
		    let exp = /include\s*(["<])([^">]+)[">]/yi;
		    exp.lastIndex = i;
		    let match = exp.exec( ino );
		    if( match ){
			i += match[0].length;
			let path = normalize(match[2]);
			if( match[1] == "<" || !(path in files) )
			    libs[path] = "";
		    }
		    state = 0;
		    break;
		}
	    case 4:
		if( ch == '*' ) state = 5;
		break;
	    case 5:
		if( ch == '/' ) state = 0;
		else if( ch != '*' ) state = 4;
		break;
	    case 6:
		if( ch == '\n' ) state = 0;
		break;
	    }
	}

	return libs;

    }
    
};

module.exports = LocalCompiler;
