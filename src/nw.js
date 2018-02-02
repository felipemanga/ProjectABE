import {bind, inject, getInstanceOf} from 'dry-di';


import App from './App.js';
import IStore from './store/IStore.js';
import Store from './store/NW.js';
import { Model, boot } from './lib/mvc.js';

import * as entities from './entities/*.js';
import * as components from './components/*.js';

import Flasher from './flashers/ChromeSerial.js';

const fs = window.require("fs");

document.addEventListener( "DOMContentLoaded", () => {
    const argv = nw.App.argv;
    bind(Store).to(IStore).singleton();

    let url, app;
    
    if( argv[0] && !/.*\.js$/.test(argv[0]) ){
	let hnd = 0;
	let watcher;

	function watch(){

	    if( watcher )
		watcher.close();

	    watcher = fs.watch(
		argv[0],
		{ persistent:false },
		_ => {
		    if( hnd ) clearTimeout(hnd);
		    hnd = setTimeout(
			_=>{
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
	
	url = "file://" + argv[0].replace(/\\/g, "/");
	
    }

    app = boot({
        main:App,
        element:document.body,
        components,
        entities,
        model:{
	    ram:{
		autoRun: url,
		hasFlasher: true,
		debuggerEnabled: undefined
	    }
	}
    });

    app.pool.add(new Flasher( app ));

} );
