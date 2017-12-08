
let IStore = require('./IStore.js');
let lf = require('localforage');

class ForageStore extends IStore {
    
    constructor(){
        super();

        this.root = "";

        this.fs = {
	    
	    mkdir( path, cb ){ cb(); },
	    
	    readFile( path, enc, cb ){
		lf.getItem( path, cb );
	    },

	    writeFile( path, data, cb ){
		lf.setItem( path, data, cb );
	    }
	    
	};

    }

}


module.exports = ForageStore;
