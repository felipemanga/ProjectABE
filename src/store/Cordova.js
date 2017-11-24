let IStore = require('./IStore.js');
let fs = require('html5-fs');

class CordovaStore extends IStore {

    constructor(){
        fs.init(9000*1000, () => this.fs = fs );
        super();
    }

    
}

module.exports = CordovaStore;