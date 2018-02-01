
let IStore = require('./IStore.js');

var fs = window.require('fs');
var path = window.require('path');

class NWStore extends IStore {
    
    constructor(){
        super();

        this.root = nw.App.dataPath + path.sep;
        
        this.fs = fs;

    }

}


module.exports = NWStore;
