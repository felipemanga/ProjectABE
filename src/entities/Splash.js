// import IStore from '../store/IStore.js';
import { IController, IView } from '../lib/mvc.js';


class Splash extends IController {

    static "@inject" = {
        pool:"pool",
        viewFactory:[IView, {controller:Splash}]
    };

    enterSplash(){
        this._show();
    }

    BODY = {
        bound:function( evt ){
            var target = evt.target;
        }
    }

}


export default Splash;
