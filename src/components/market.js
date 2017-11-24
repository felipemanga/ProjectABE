import { Model } from '../lib/mvc.js';

class Market{

    static "@inject" = {
        root: [Model, {scope:"root"}]
    }

    constructor( DOM ){
    }

    run(){
        this.pool.call("runSim");
    }
    
}

module.exports = Market;
