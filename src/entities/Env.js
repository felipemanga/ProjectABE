import IStore from '../store/IStore.js';
import { IController, Model, IView } from '../lib/mvc.js';

class Env extends IController {

    static "@inject" = {
        store:IStore,
        pool:"pool",
        viewFactory:[IView, {controller:Env}],
        model: [Model, {scope:"root"}]
    }

    exitSplash(){
	/* */
        this._show();
	/*/
	this.model.setItem("app.AT32u4.url", "HelloWorld32u4.hex");
	this.pool.call("runSim");
	/* */	
    }

    exitSim(){
	this._show();
    }

    play( opt ){
	this.model.setItem("app.AT32u4.url", this.model.getItem("app.proxy") + opt.element.dataset.url);
	this.pool.call("runSim");
    }

}


export default Env;
