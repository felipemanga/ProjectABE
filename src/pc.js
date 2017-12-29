import {bind, inject, getInstanceOf} from 'dry-di';


import App from './App.js';
import IStore from './store/IStore.js';
import Store from './store/Node.js';
import { Model, boot } from './lib/mvc.js';

import * as entities from './entities/*.js';
import * as components from './components/*.js';

const electron = window.require('electron');
const fs = window.require('fs');

electron.webFrame.registerURLSchemeAsPrivileged('file', { bypassCSP: true });

const remote = electron.remote;
const argv = remote.getGlobal('argv');

document.addEventListener( "DOMContentLoaded", () => {
setTimeout( function(){

    bind(Store).to(IStore).singleton();

//    console.log( argv );

    let url, app;
    
    if( argv[1] ){
	let hnd = 0;
	let watcher = fs.watch(
	    argv[1],
	    { persistent:false },
	    _ => {
		if( hnd ) clearTimeout(hnd);
		hnd = setTimeout(
		    _=>{
			app.root.removeItem("app.AT32u4");
			app.root.setItem("app.AT32u4.url", url);
			app.pool.call("loadFlash");
		    },
		    1000
		);
	});
	
	url = "file://" + argv[1].replace(/\\/g, "/");
	
    }

    app = boot({
        main:App,
        element:document.body,
        components,
        entities,
        model:{
	    ram:{
		autoRun: url,
		debuggerEnabled: undefined
	    }
	}
    });

}, 2000);
} );
