import { Model, IController } from './lib/mvc.js';
import IStore  from './store/IStore.js';
import DOM from './lib/dry-dom.js';

window.strldr = require("./lib/strldr.js");

class App {

    static "@inject" = {
        DOM:DOM,
        store:IStore,
        pool:"pool",
        controllers:[IController,[]],
        root: [Model, {scope:"root"}]
    }
    
    constructor(){

        window.store = this.store;

        this.pool.add(this);

        this.models = [];

        this.store.onload = this.init.bind(this);

    }

    init(){

        this.controllers.forEach((controller) => {
            this.pool.add( controller );
        });

        this.pool.call("enterSplash");


        setInterval( this.commit.bind(this), 3000 );

        var pending = 2;
        this.openModel( "app", done.bind(this) );
        setTimeout( done.bind(this), 1000 );

        function done(){
            pending--;
            if( !pending )
                this.pool.call( "exitSplash" );

        }

    }

    openModel( name, cb, model ){

        var oldModel = this.models.find((obj) => obj.name == name );

        if( oldModel ){

            if( oldModel == model ) return;
            this.closeModel( name );

        }

        var path = name;

        if( typeof model == "string" ){
            path = model;
            model = null;
        }

        if( !model ) model = new Model();

        this.root.setItem( name, model.data );

        this.models[ this.models.length ] = {
            model,
            name,
            path,
            dirty: false
        };

        this.store.getTextItem( path, (data)=>{

            if( data ){
		model.load( JSON.parse(data) );
                model.dirty = false;
		cb.call();
            }else
                this.pool.call( name + "ModelInit", model, cb );


        });

    }

    closeModel( name ){
        // to-do: find, commit, remove from this.models
    }

    appModelInit( model, cb ){

		let repoURL = [
			"http://www.crait.net/arduboy/repo2.json",
			"http://arduboy.ried.cl/repo.json"
		];

		if( navigator.userAgent.indexOf("Electron") == -1 && typeof cordova == "undefined" ){
			// model.setItem("proxy", "https://crossorigin.me/");
			model.setItem("proxy", "https://cors-anywhere.herokuapp.com/");
			repoURL = repoURL.map( url => model.getItem("proxy") + url );
		}else{
			model.setItem("proxy", "");
		}

		let items = [];
		let pending = 2;

		repoURL.forEach( url =>	
						 fetch( url )
						 .then( rsp => rsp.json() )
						 .then( 
							 json => 
								 json && 
								 json.items && 
								 json.items.forEach( item => items.push(item) ) || 
								 done()
						 )
						 .catch( err => {
							 console.log( err );
							 done();
						 })	
		);

		function done(){
			pending--;

			if( !pending ){
				items = items.sort((a, b) => {
					if( a > b ) return 1;
					if( a < b ) return -1;
					return 0;
				});
				model.setItem("repo", items);
				cb();
			}
		}
	}

    commit(){

        for( var i = 0; i < this.models.length; ++i ){

            var obj = this.models[i];
            if( !obj.dirty && obj.model.dirty ){

                obj.dirty = true;
                obj.model.dirty = false;

            }else if( obj.dirty && !obj.model.dirty ){

                obj.dirty = false;
                this.store.setItem( obj.path, JSON.stringify(obj.model.data) );

            }else if( obj.dirty && obj.model.dirty ){

                obj.model.dirty = false;

            }

        }

    }

    setActiveView( view ){
        [...this.DOM.element.children].forEach( node => node.parentElement.removeChild(node) );
    }

}


export default App;
