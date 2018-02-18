const PATH = window.require('path');
const process = window.require('process');
const fs = window.require('fs');
const os = window.require('os');
const chproc = window.require('child_process');
import { IController, Model, IView } from '../lib/mvc.js';
import IStore  from '../store/IStore.js';

function normalize( path ){
    return PATH.normalize( path );
}

class LocalCompiler {

    static "@inject" = {
	model: [Model, {scope:"root"}],
	store: IStore
    }

    constructor(){
	
	this.compilerPath = "";
	this.compilerExec = "";
	this.prefixArgs = [];
	
    }

    getSketchDir(){
	return [os.homedir(), 'Arduino'].join(PATH.sep);
    }

    getUserGames( out ){
	let dirs, sketchDir = this.getSketchDir();
	try{
	    dirs = fs.readdirSync( sketchDir );
	}catch(ex){
	    console.log("Sketch dir not found in " + sketchDir);
	    return;
	}

	dirs.forEach( p => {
	    let fp = sketchDir + PATH.sep + p;
	    
	    try{
		fp = fs.readlinkSync( fp );
		fp = PATH.resolve( sketchDir, fp );
	    }catch(ex){}

	    try{
		let isDir = fs.lstatSync(fp).isDirectory();
		if( isDir && fs.existsSync(fp + PATH.sep + p + '.ino' ) )
		    out.push({
			title:p,
			localSourcePath:fp
		    });
	    }catch(ex){}
	    
	} );
    }

    findCompiler(){
	if( this.compilerPath )
	    return this.compilerPath;

	console.log("Looking for arduino IDE.");
	
	let ext = process.platform == 'win32' ? '.exe' : '';

	let queue = [
	    PATH.resolve('.'),
	    ...process.env.PATH.split(PATH.delimiter)
	];
	if( process.env.programfiles ){
	    queue.push( process.env.programfiles + PATH.sep + 'arduino');
	}else if( process.platform == 'darwin' ){
	    queue.push('/Applications');
	    queue.push(os.homedir() + '/Applications');
	    ext = '.app';
	}

	let path = undefined;
	
	queue.find( x => {
	    
	    if( !fs.existsSync( x + PATH.sep + 'arduino' + ext ) )
		return false;
	    
	    let exec = x + PATH.sep + 'arduino_debug' + ext;

	    // windows, mostly
	    if( !fs.existsSync(exec) )
		exec = x + PATH.sep + 'arduino' + ext;
	    
	    // linux, mostly
	    try{
		exec = fs.readlinkSync( exec );
		exec = PATH.resolve( x, exec );
	    }catch(ex){}

	    this.compilerExec = exec;
	    
	    // derpy, mostly
	    if( process.platform == 'darwin' )
		this.compilerExec += '/Contents/MacOS/Arduino';
	    
	    path = PATH.dirname( exec );

	    return true;
	    
	});

	return this.compilerPath = path;
    }
    
    build( srcdata, main ){

	return new Promise( (ok, nok) => {

	    if( !this.findCompiler() )
		return nok("No Arduino IDE found");

	    let lsp = this.model.getItem("ram.localSourcePath");
	    let lbp = this.model.getItem("ram.localBuildPath");

	    if( !lsp ){
		lsp = fs.mkdtempSync( PATH.resolve(this.store.root, "src_") );
		console.log("LSP: ", lsp); 
		this.model.setItem("ram.localSourcePath", lsp);
		for( let k in srcdata )
		    this.store.saveFile( lsp + PATH.sep + k, srcdata[k] );
	    }
	    if( !lbp )
		lbp = fs.mkdtempSync( PATH.resolve(this.store.root, "build_") );

	    console.log("LBP: ", lbp);
	    
	    let args = [ ...this.prefixArgs,
		'--board', 'arduino:avr:leonardo',
		'--pref', 'build.path=' + lbp,
		'--verify', PATH.resolve(lsp, main)
			];

	    let child = chproc.spawn(
		this.compilerExec,
		args
	    );

	    let acc = args.join(" ") + '\n', hex;

	    child.stdout.on('data', data => {
		    let tmp = '';
		for( let i=0, l=data.length; i<l; ++i )
		    tmp += String.fromCharCode(data[i]);
		    acc += tmp;
		    console.log(tmp);
	    });

	    child.stderr.on('data', data => {
		for( let i=0, l=data.length; i<l; ++i )
		    acc += String.fromCharCode(data[i]);
	    });
	    
	    child.on('close', code => {
		if( code ) return nok(acc);

		let hexpath = fs.readdirSync(lbp).find( f => /.*\.hex/i.test(f) && f.indexOf("with_bootloader") == -1 );
		
		hex = fs.readFileSync( PATH.resolve(lbp, hexpath), 'utf-8' );

		ok({
		    hex,
		    stdout:acc
		});
	    });

	});
	
    }
    
};

module.exports = LocalCompiler;
