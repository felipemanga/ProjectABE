// let {bind, inject, getInstanceOf} = require('./lib/dry-di.js');
import {bind, inject, getInstanceOf} from 'dry-di';


import App from './App.js';
import IStore from './store/IStore.js';
import Store from './store/Forage.js';
import { Model, boot } from './lib/mvc.js';

import CloudCompiler from './compilers/CloudCompiler.js';

import * as entities from './entities/*.js';
import * as components from './components/*.js';

document.addEventListener( "DOMContentLoaded", () => {
setTimeout( function(){

    bind(Store).to(IStore).singleton();
    bind(CloudCompiler).to('Compiler').singleton();

    class Dud {};
    bind(Dud).to('Plugin').singleton();

    let url;
    let match = location.search.match(/[?&](?:file|hex|url)=([^&]+)/);
    if( match ){
	url = match[1];
	if( /^https?%.*/.test(url) )
	    url = decodeURIComponent(url);
    }

    boot({
        main:App,
        element:document.body,
        components,
        entities,
        model:{
	    proxy:"https://cors-anywhere.herokuapp.com/",
	    ram:{
		skin: (location.search.match(/[?&]skin=([^&]+)/)||[])[1],
		autoRun: url,
		debuggerEnabled:true,
		isNativeBuild: false
	    }
	}
    }).pool.add({
	embed(url){
	    window.open(url);
	}
    });

}, 2000);
} );
