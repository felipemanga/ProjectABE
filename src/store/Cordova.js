let IStore = require('./IStore.js');
let fs = require('../lib/html5-fs.js');

class CordovaStore extends IStore {

    constructor(){

	super();
	
	if( navigator.webkitPersistentStorage )
	    navigator.webkitPersistentStorage.requestQuota = null;
	if( window.webkitStorageInfo )
	    window.webkitStorageInfo.requestQuota = null;
        fs.init(1000, () => this.fs = fs );
		
    }

    
}

module.exports = CordovaStore;
