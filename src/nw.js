import {bind, inject, getInstanceOf} from 'dry-di';

import minimist from 'minimist';

import App from './App.js';
import IStore from './store/IStore.js';
import Store from './store/NW.js';
import { Model, boot } from './lib/mvc.js';

import LocalCompiler from './compilers/LocalCompiler.js';
// import LocalCompiler from './compilers/CloudCompiler.js';

import * as entities from './entities/*.js';
import * as components from './components/*.js';

import Flasher from './flashers/ChromeSerial.js';
import SerialRouter from './lib/SerialRouter.js';
import * as plugins from './nw/*.js';

const fs = window.require("fs");

document.addEventListener( "DOMContentLoaded", () => {
    
    const argv = minimist(nw.App.argv);//.slice(1).filter( f=>!/.*\.js$/.test(f) ));
    
    bind(Store).to(IStore).singleton();
    bind(LocalCompiler).to('Compiler').singleton();
    bind(Flasher).to('Plugin').singleton();
    bind(SerialRouter).to('Plugin').singleton();
    for( let k in plugins )
	bind( plugins[k] ).to('Plugin').singleton();

    let url, file = argv._[0], skin=argv.skin, app, width = 1024;

    if( file && /^https?:.*/i.test(file) ){
	url = file;
    }else if( file ){
	let hnd = 0, hex;
	let watcher;

	try{
	    hex = fs.readFileSync(file);
	}catch( ex ){
	    alert("Could not open file: " + JSON.stringify(argv));
	    nw.App.quit();
	    return;
	}

	function watch(){

	    if( watcher )
		watcher.close();

	    watcher = fs.watch(
		file,
		{ persistent:false },
		_ => {
		    if( hnd ) clearTimeout(hnd);
		    hnd = setTimeout(
			_=>{
			    try{
				hex = fs.readFileSync(file);			    
			    }catch( ex ){
				watch();
				return;
			    }
			    
			    URL.revokeObjectURL( url );
			    url = URL.createObjectURL( new Blob([hex], {type: 'text/x-hex'}) );

			    app.root.removeItem("app.AT32u4");

			    app.root.setItem("app.AT32u4.url", url);
			    app.pool.call("loadFlash");
			    watch();
			},
			1000
		    );
		});
	    
	}

	watch();

	url = URL.createObjectURL( new Blob([hex], {type: 'text/x-hex'}) );
	
    }else{
	
	let match = location.search.match(/[?&](?:file|hex|url)=([^&]+)/);
	if( match ){
	    url = match[1];
	    if( /^https?%.*/.test(url) )
		url = decodeURIComponent(url);
	}
	
    }

    if( !url )
	nw.Window.get().resizeTo( width, 600 );

    boot({
        main:App,
        element:document.body,
        components,
        entities,
        model:{
	    ram:{
		skin,
		autoRun: url,
		hasFlasher: true,
		debuggerEnabled: /* * / undefined /*/ true /* */,
		isNativeBuild: true
	    }
	}
    });

} );
