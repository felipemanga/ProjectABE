import {bind, inject, getInstanceOf} from 'dry-di';


import App from './App.js';
import IStore from './store/IStore.js';
import Store from './store/Node.js';
import { Model, boot } from './lib/mvc.js';

import * as entities from './entities/*.js';
import * as components from './components/*.js';

document.addEventListener( "DOMContentLoaded", () => {
setTimeout( function(){

    bind(Store).to(IStore).singleton();

    boot({
        main:App,
        element:document.body,
        components,
        entities,
        modelName: 'default'
    });

}, 2000);
} );
