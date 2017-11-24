import { IController, Model, IView } from '../lib/mvc.js';

class Sim extends IController {

    static "@inject" = {
        pool:"pool",
        viewFactory:[IView, {controller:Sim}],
        model: [Model, {scope:"root"}]
    }

    runSim(){
        this._show();
    }

    onEndSim(){
	this.pool.call("exitSim");
    }

}


export default Sim;
