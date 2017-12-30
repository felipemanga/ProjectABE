import {bind, inject, getInstanceOf} from 'dry-di';


import App from './App.js';
import IStore from './store/IStore.js';
import CordovaStore from "./store/Cordova.js";
import { Model, boot } from './lib/mvc.js';

import * as entities from './entities/*.js';
import * as components from './components/*.js';

document.addEventListener( "deviceready", () => {

    bind(CordovaStore).to(IStore).singleton();

    boot({
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

} );
