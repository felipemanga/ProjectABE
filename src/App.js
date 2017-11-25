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

	document.body.addEventListener("keydown", evt => {
	    this.pool.call("onPress" + evt.code);
	    // console.log(evt);
	});

	document.body.addEventListener("keyup", evt => {
	    this.pool.call("onRelease" + evt.code);
	    // console.log(evt);
	});

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
		if( model.getItem("expires") > (new Date()).getTime() ){
                    model.dirty = false;
		    cb.call();
		    return;
		}
            }
	    
            this.pool.call( name + "ModelInit", model, cb );

        });

    }

    closeModel( name ){
        // to-do: find, commit, remove from this.models
    }

    appModelInit( model, cb ){

	let repoURL = [
	    "http://www.crait.net/arduboy/repo2.json",
	    "http://arduboy.ried.cl/repo.json",
	    "repo.json"
	];

	if( navigator.userAgent.indexOf("Electron") == -1 && typeof cordova == "undefined" ){
	    // model.setItem("proxy", "https://crossorigin.me/");
	    model.setItem("proxy", "https://cors-anywhere.herokuapp.com/");
	    repoURL = repoURL.map( url => (/^https?.*/.test(url) ? model.getItem("proxy") : "") + url );
	}else{
	    model.setItem("proxy", "");
	}

	let items = [];
	let pending = 3;

	repoURL.forEach( url =>
			 fetch( url )
			 .then( rsp => rsp.json() )
			 .then( add )
			 .catch( err => {
			     console.log( err );
			     done();
			 })	
		       );

	function add( json ){
	
	    if( json && json.items ){
	    
		json.items.forEach( item => {
		    
		    item.author = item.author || "<<unknown>>";
		    
		    if(
			item.banner && (
			    !item.screenshots ||
				!item.screenshots[0] ||
				!item.screenshots[0].filename
			))
			item.screenshots = [{filename:item.banner}];
		    
		    if( item.arduboy && (
			!item.binaries ||
			    !item.binaries[0] ||
			    !item.binaries[0].filename
		    ))
			item.binaries = [{filename:item.arduboy}]
		    
		    items.push(item);
		});
	    }
	    
	    done();
	    
	}

	function done(){
	    pending--;

	    if( !pending ){
		items = items.sort((a, b) => {
		    if( a.title > b.title ) return 1;
		    if( a.title < b.title ) return -1;
		    return 0;
		});
		model.removeItem("repo");
		model.setItem("repo", items);
		model.setItem("expires", (new Date()).getTime() + 60 * 60 * 1000 );
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
