// let {bind, inject, getInstanceOf} = require('./lib/dry-di.js');
import {bind, inject, getInstanceOf} from 'dry-di';


import App from './App.js';
import IStore from './store/IStore.js';
import CordovaStore from "./store/Cordova.js";
import MT from './lib/mt.js';
import { Model, boot } from './lib/mvc.js';

import * as entities from './entities/*.js';
import * as components from './components/*.js';
import * as scenecomponents from './scenecomponents/*.js';
import * as scenecontrollers from './scenecontrollers/*.js';

function makeRNG( seed ){
    var rng = new MT( Math.round( seed||0 ) );
    return rng.random.bind(rng);
}

document.addEventListener( "deviceready", () => {
    setTimeout( function(){

    bind(CordovaStore).to(IStore).singleton();
    bind(makeRNG).to("RNG").factory();

    for( let k in scenecomponents )
        bind(scenecomponents[k]).to(k).withTags({ scenecomponent:true });
    for( let k in scenecontrollers )
        bind(scenecontrollers[k]).to(k).withTags({ scenecontroller:true });

    boot({
        main:App,
        element:document.body,
        components,
        entities,
        modelName: 'default'
    });

}, 2000);
} );