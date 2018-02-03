import {bind, inject, getInstanceOf} from 'dry-di';
import DOM from "./lib/dry-dom.js";

import App from './App.js';
import IStore from './store/IStore.js';
import CordovaStore from "./store/Cordova.js";
import { Model, boot } from './lib/mvc.js';

import CloudCompiler from './compilers/CloudCompiler.js';

import * as entities from './entities/*.js';
import * as components from './components/*.js';

DOM.create("script", {src:"cordova.js"}, document.head);

document.addEventListener( "deviceready", () => {

    bind(CordovaStore).to(IStore).singleton();
    bind(CloudCompiler).to('Compiler').singleton();

    boot({
        main:App,
        element:document.body,
        components,
        entities,
        model:{
	    ram:{
		autoRun: undefined,
		debuggerEnabled: undefined
	    }
	}
    });

} );
