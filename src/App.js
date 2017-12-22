import { Model, IController } from './lib/mvc.js';
import IStore  from './store/IStore.js';
import DOM from './lib/dry-dom.js';

window.strldr = require("./lib/strldr.js");

let controllers = {};

class App {

    static "@inject" = {
        DOM:DOM,
        store:IStore,
        pool:"pool",
        controllers:[IController,[]],
        root: [Model, {scope:"root"}]
    }

    iemap = {
	"Up":"ArrowUp",
	"Down":"ArrowDown",
	"Left":"ArrowLeft",
	"Right":"ArrowRight",
	"Alt":"AltLeft",
	"CONTROL":"ControlLeft"
    }

    gamepadmap = {
	0:"ControlLeft",
	1:"AltLeft",
	2:"ControlLeft",
	3:"AltLeft",
	12:"ArrowUp",
	15:"ArrowRight",
	13:"ArrowDown",
	14:"ArrowLeft"	
    }

    unblockable = {
	"F6":true,
	"F7":true,
	"F8":true
    }

    mappings = {
    }
    
    constructor(){

        window.store = this.store;

        this.pool.add(this);

        this.models = [];

        this.store.onload = this.init.bind(this);

    }

    remapKey( i, o ){
		if( i && typeof i == "object" ){
			for( let k in i )
				this.mappings[k] = i[k];
			return;
		}
		this.mappings[i] = o;
    }

    init(){

	this.initKeyboard();
	this.initControllers();

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

    initControllers(){

	controllers = {};

	let connecthandler = e => {
	    controllers[e.gamepad.index] = {gamepad:e.gamepad, state:{}};
	};

	let disconnecthandler = e => {
	    delete controllers[e.gamepad.index];
	};

	window.addEventListener("gamepadconnected", connecthandler);
	window.addEventListener("gamepaddisconnected", disconnecthandler);
	
    }

    onPollTickListeners( list ){
	list.push(this);	
    }

    tick(){

	Array.from((navigator.getGamepads || navigator.webkitGetGamepads || (_=>[])).call(navigator))
	    .filter( gp => !!gp )
	    .reduce( (c, gp) => {
		if( c[gp.index] ) c[gp.index].gamepad = gp;
		else c[gp.index] = {gamepad:gp, state:{}};
		return c;
	    }, controllers);	
	
	for( let k in controllers ){
	    let {gamepad, state} = controllers[k];

	    let upDown = gamepad.axes[1],
		leftRight = gamepad.axes[0];

	    if( upDown < -0.5 ) upDown = -1;
	    else if( upDown > 0.5 ) upDown = 1;
	    else upDown = 0;
	    
	    if( leftRight < -0.5 ) leftRight = -1;
	    else if( leftRight > 0.5 ) leftRight = 1;
	    else leftRight = 0;

	    if( upDown != state.upDown ){

		if( state.upDown < 0 )
		    this.inputUp("ArrowUp");
		else if( state.upDown > 0 )
		    this.inputUp("ArrowDown");
		
		state.upDown = upDown;
		
		if( upDown < 0 ) this.inputDown("ArrowUp");
		else if( upDown > 0 ) this.inputDown("ArrowDown");

	    }

	    if( leftRight != state.leftRight ){

		if( state.leftRight < 0 )
		    this.inputUp("ArrowLeft");
		else if( state.leftRight > 0 )
		    this.inputUp("ArrowRight");
		
		state.leftRight = leftRight;
		
		if( leftRight < 0 ) this.inputDown("ArrowLeft");
		else if( leftRight > 0 ) this.inputDown("ArrowRight");

	    }
	    
	    for( let i in this.gamepadmap ){
		let pressed = gamepad.buttons[i];
		
		if( typeof pressed == "object" )
		    pressed = pressed.pressed;
		else pressed = pressed >= 0.5;
		
		if( pressed != state[i] ){
		    state[i] = pressed;

		    if( pressed ) this.inputDown( this.gamepadmap[i] );
		    else this.inputUp( this.gamepadmap[i] );

		}
	    }
	}
	
    }

    inputDown( code ){
	return this.pool.call("onPress" + (this.mappings[ code ] || code) );	
    }

    inputUp( code ){
	return this.pool.call("onRelease" + (this.mappings[ code ] || code) );
    }

    initKeyboard(){
	
	document.body.addEventListener("keydown", evt => {

	    let code = evt.code;
	    if( code === undefined ) code = this.iemap[ evt.key ] || ("Key" + evt.key.toUpperCase());

	    if( (evt.target.tagName == "INPUT" || evt.target.tagName == "TEXTAREA") && !this.unblockable[code] )
		return;

	    let ret = this.inputDown( code );
	    if( ret === true ){
		evt.preventDefault();
		evt.stopPropagation();
	    }
		
	});

	document.body.addEventListener("keyup", evt => {

	    let code = evt.code;
	    if( code === undefined ) code = this.iemap[ evt.key ] || ("Key" + evt.key.toUpperCase());

	    if( (evt.target.tagName == "INPUT" || evt.target.tagName == "TEXTAREA") && !this.unblockable[code] )
		return;

	    let ret = this.inputUp( code );
	    if( ret === true ){
		evt.preventDefault();
		evt.stopPropagation();
	    }
	});

        this.controllers.forEach((controller) => {
            this.pool.add( controller );
        });
	
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

	    let onGetModel = data => {

		if( data ){
		    
		    model.load( data );
		    if( model.getItem("color") === undefined )
			model.setItem("color", Math.random()*10 | 0);

		    if( model.getItem("expires") > (new Date()).getTime() ){
			model.dirty = false;
			cb.call();
			return;
		    }

		    model.setItem("color", Math.random()*10 | 0);
		    
		}else if( model.getItem("color") === undefined )
		    model.setItem("color", Math.random()*10 | 0);

		
		this.pool.call( name + "ModelInit", model, cb );
		
	    };

            if( data ){
		try{
		    data=JSON.parse(data);
		}catch(ex){
		    data=null;
		}
	    }

	    if( !data || !Array.isArray(data) )
		return onGetModel( data );

	    let map = {}, pending = data.length;

	    data.forEach( de => {

		this.store.getTextItem( path + "/" + de, item => {

		    map[de] = JSON.parse(item);
		    pending--;
		    if( !pending )
			onGetModel( map );
		    
		});
		
	    });

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
	let pending = repoURL.length;

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

		    if( !item.sourceUrl && item.url )
			item.sourceUrl = item.url;
		    
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
                // this.store.setItem( obj.path, JSON.stringify(obj.model.data) );
		this.store.setItem( obj.path, JSON.stringify( Object.keys(obj.model.data) ) );
		for( let k in obj.model.data ){
		    this.store.setItem( obj.path + "/" + k, JSON.stringify( obj.model.data[k] ) );
		}

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
