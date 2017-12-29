import { inject, bind, getInstanceOf, getPolicy } from 'dry-di';
import StrLdr from './strldr.js';
import IStore from '../store/IStore.js';
import DOM from "./dry-dom.js";
import Pool from './pool.js';


function read( str, ctx ){

    var parts, i=0;
    if( typeof str == "string" ) parts = str.split(".");
    else parts = str;    

    while( i<parts.length && ctx )
        ctx = ctx[ parts[i++] ];
    
    return ctx;

}

function readMethod( str, ctx, ...args ){

    var parts = str.split("."), i=0;

    var pctx = ctx;

    while( i<parts.length && ctx ){
        pctx = ctx;
        ctx = ctx[ parts[i++] ];
    }

    if( ctx && typeof ctx === "function" )
        return ctx.bind( pctx, ...args );
    
    return null;

}

function write( str, value, ctx ){

    var parts = str.split("."), i=0;

    while(parts.length-1 && ctx){
        if( !(parts[i] in ctx) )
            ctx[parts[i]] = {};
        ctx = ctx[ parts[i++] ];
    }
    
    if( ctx )
        ctx[ parts[i] ] = value;
    
    return !!ctx;
    
}

const pending = [];
let nextModelId = 0;

class Model {

    constructor(){
        
        var listeners = {};
        var data = {};
        var children = {};
        var revChildren = {};
        var parents = {};

        Object.defineProperty( data, "__model__", { value:this, writable: false, enumerable: false });
        
        Object.defineProperties( this, {
            root:{ value:this, enumerable:false, writable:true },
            listeners:{ value:listeners, enumerable: false, writable: false },
            data:{ value:data, enumerable: false, writable: true },
            children:{ value:children, enumerable: false, writable: false },
            revChildren:{ value:revChildren, enumerable: false, writable: false },
            parents:{ value:parents, enumerable: false, writable: false },
            id:{ value: ++nextModelId, enumerable: false, writable: false },
            dirty:{
                get:() => this.root.__dirty,
                set:( v ) => this.root.__dirty = v
            }
        });

    }

    store( binary=true ){
        return StrLdr.store( this.data, binary );
    }

    load( data, doRaise = true ){

        if( typeof data === "string" ){
            try{
                data = JSON.parse(data);
                data = StrLdr.load(data);
            }catch(ex){}
        }

        if( data && data.buffer && data.buffer instanceof ArrayBuffer ){
            if( !(data instanceof Uint8Array) )
                data = new Uint8Array(data.buffer);
            data = StrLdr.load( data, true );
        }

        for( var k in data ){
            this.setItem( [k], data[k], doRaise );
        }

        return this;

    }

    setItem( k, v, doRaise = true ){

	var raiseToParents = false;
        if( k.charCodeAt ) k = k.split(".");
        var prop = k.shift(), child;
        var data = this.data, children = this.children, revChildren = this.revChildren;

        if( k.length ){

            child = children[prop];
            if( !child ){
                child = children[prop] = new Model();
                child.root = this.root;
                child.parents[ this.id ] = this;
                data[prop] = child.data;
                this.dirty = true;
                revChildren[ child.id ] = [prop];
                this.raise( prop, false );
            }

	    var klength = k.length;
	    var child = children[prop].setItem( k, v, doRaise );

	    if( klength == 1)
		this.raise( prop, doRaise );

	    return child;

        }

        if( children[prop] ){

            if( children[prop].data !== v && v && typeof v == "object" ){
		for( var ck in children[prop].data ){
		    if( !(ck in v) )
			children[prop].removeItem([ck], doRaise);
		    else
			children[prop].setItem([ck], v[ck], doRaise);
		}
		for( var ck in v ){
		    if( !(ck in children[prop].data) )
			children[prop].setItem([ck], v[ck], doRaise);
		}
                return this;
	    }

            child = children[prop];

            let index = revChildren[ child.id ].indexOf(prop);
            if( index === -1 )
                throw new Error("Integrity compromised");
            
            revChildren[ child.id ].splice( index, 1 );

            delete child.parents[ this.id ];

        }else raiseToParents = true;

        if( v && typeof v == "object" ){

            var doLoad = false;
            if( !v.__model__ ){
                child = new Model();
                child.root = this.root;
                doLoad = true;
            }else{
                child = v.__model__;
            }

            if( !revChildren[ child.id ] ) revChildren[ child.id ] = [ prop ];
            else revChildren[ child.id ].push( prop );
            children[ prop ] = child;
            child.parents[ this.id ] = this;

            if( doLoad ){
                child.load( v, false );
                child.data = v;
                Object.defineProperty( v, "__model__", { value:child, writable: false });
            }
        }

        data[ prop ] = v;

        this.dirty = true;
        this.raise( prop, doRaise );
	if( raiseToParents ){
	    for( let pid in this.parents )
		this.parents[pid].raise( this.parents[pid].revChildren[ this.id ], doRaise );
	}	    

        return this;

    }

    getModel( k, create ){

        if( k.charCodeAt )
            k = k.split(".");

        var ctx = this, i = 0;
        if( create ){
            while( ctx && i<k.length ){
                if( !ctx.children[k[i]] )
                    ctx.setItem([k[i]], {});
                ctx = ctx.children[ k[i++] ];
            }
        }else{
            while( ctx && i<k.length )
                ctx = ctx.children[ k[i++] ];
        }

        return ctx;

    }

    getItem( k, defaultValue ){
        var v = read( k, this.data );
        if( v === undefined ) v = defaultValue;
        return v;
    }

    removeItem(k, cb){

        var parent = (k && k.split && k.split(".")) || k;
        var key = parent.pop();

        var model = this.getModel( parent );
        var data = model.data, children = model.children;

        if( !(key in data) ) return;

        if( children[key] ){

            var child = children[key], 
                revChildren = model.revChildren[child.id];
            
            var index = revChildren.indexOf( key );
            if( index == -1 ) throw "Integrity compromised";

            revChildren.splice(index, 1);

            if( revChildren.length == 0 ){
                delete child.parents[ model.id ];
                delete model.revChildren[child.id];
            }

            delete children[key];

        }

        delete data[key];

        model.raise( key, true );
	for( let pid in this.parents )
	    this.parents[pid].raise( this.parents[pid].revChildren[ this.id ], true );

    }

    raise(k, doRaise){

	if( pending.find( p => p.model == this && p.key == k ) )
	    return;

        pending[pending.length++] = {model:this, key:k};

        if( !doRaise )
            return;

        while( pending.length ){
	    
	    var p = pending.shift();
            k = p.key;
            var model = p.model;

            if( k ){

                dispatch( model.listeners[k], model.data[k], k );

            } else {

                for( var pid in model.parents ){

                    var parent = model.parents[ pid ];
                    var revChildren = parent.revChildren[ model.id ];
                    if( !revChildren ) throw "Integrity compromised";

                    for( var j = 0, rcl = revChildren.length; j<rcl; ++j ){

                        dispatch( parent.listeners[ revChildren[j] ], parent.data, revChildren[j] );

                    }

                }

            }
        
        }

        pending.length = 0;

        function dispatch( listeners, value, key ){

            if( !listeners )
                return;

            for( var i=0, l=listeners.length; i<l; ++i )
                listeners[i]( value, key );

        }

    }
    
    // attach( k:String, cb:Function )
    // listen to notifications from a particular key
    // attach( cb:Function )
    // listen to key additions/removals
    attach(k, cb){
        var key = (k.split && k.split(".")) || k;
        var model;
        if( key.length == 1 ){
            key = k;
            model = this;
        }else{
            k = key.pop();
            model = this.getModel( key, true );
	    key.push(k);
            key = k;
        }
        
        if( !model.listeners[key] )
            model.listeners[key] = [ cb ];
        else
            model.listeners[key].push(cb);

    }

    // stop listening
    detach(k, cb){

        var index, listeners, model;

	k = (k.split && k.split(".")) || k;
	
	var key = k;

        if( key.length == 1 ){
            key = k;
            model = this;
        }else{
            k = key.pop();
            model = this.getModel( key, false );
	    key.push(k);
	    if( !model ) return;
            key = k;
        }

        listeners = model.listeners[k];
        if( !listeners[k] )
            return;

        index = listeners.indexOf(cb);
        if( index == -1 )
            return;
        
        listeners.splice( index, 1 );

    }

}

const cache = {};

class IView {

    static "@inject" = {
        parentElement:"ParentElement",
        model:[Model,{scope:'root'}]
    }

    constructor( controller ){

        var layout = "layouts/" + controller.constructor.name + ".html";
        this.controller = controller;
        this.dom = null;

        if( !cache[layout] ){

            fetch( layout )
            .then( (rsp) => {

                if( !rsp.ok && rsp.status !== 0 ) throw new Error("Not OK!");
                return rsp.text();

            })
            .then( text => (new window.DOMParser()).parseFromString(text, "text/html"))
            .then((html) => {
                cache[ layout ] = html;
                this.loadLayout( html );
            }).catch( (ex) => {

                this.parentElement.innerHTML = `<div>` + (ex.message || ex) + `: ${layout}!</div>` + (ex.stack||"").split("\n").map( e => `<div>${e}</div>` ).join("");

            });

        }else 
            this.loadLayout( cache[layout] );

    }

    loadLayout( doc ){
        doc = doc.cloneNode(true);
        [...doc.body.children].forEach( child => this.parentElement.appendChild(child) );

        var dom = new DOM( this.parentElement );
        this.dom = dom;

        prepareDOM( dom, this.controller, this.model, dom );
    }

}

function prepareDOM( dom, controller, _model, viewdom ){

    dom.forEach((element) => {

        for( var i=0; i<element.attributes.length; ++i ){
            var key = element.attributes[i].name;
            var value = element.attributes[i].value;

            var parts = key.split("-");
            
            if( parts.length == 2 )
                switch( parts[1] ){
		case "hide":
		    bindVisibility( element, parts[0], value, "hidden" );
		    break;
		case "show":
		    bindVisibility( element, parts[0], value, "visible" );
		    break;
		    
                case "call":
		    
                    var target = readMethod( value, controller, dom );
                    if( target )
                        element.addEventListener( parts[0], target );
                    else
                        console.warn("Could not bind event to " + controller.constructor.name + "." + name);

                    break;

                case "toggle":
		    
                    value.split(";").forEach( sp => {
			var vparts = sp.match(/^([^@]+)\@([^=]+)\=(.+)$/);
                    
			if( vparts )
                            bindToggle( element, parts[0], vparts );
			else
                            console.warn("Could not parse toggle: " + value);
		    });
		    
                    break;

                }

            var memo = { __src:value, __hnd:0 };
            value.replace(/\{\{([^\}]+)\}\}/g, bindAttribute.bind( null, element.attributes[i], memo ));
            updateAttribute( element.attributes[i], memo );
        }

        if( (element.dataset.src || element.dataset.srcIndirect) && !element.dataset.inject ){
	    let indirect = element.dataset.srcIndirect, prevattach;

	    if( indirect ){
		_model.attach( indirect, _ => attach( _model.getItem(indirect, "") ) );
	    }
	    
            switch( element.tagName ){
            case 'UL':
            case 'OL':
	    case 'SELECT':
                var template = element.cloneNode(true);
		var attachcb = _ => renderList(
		    element,
		    template,
		    _model.getItem( indirect ? _model.getItem(indirect, "") : element.dataset.src )
		);
		attach( indirect ? _model.getItem(indirect, "") : element.dataset.src );
                break;

            default:
                break;
            }
	    
	    function attach( src ){
		if( Array.isArray(src) )
		    src = [...src];
		
		if( prevattach )
		    _model.detach( prevattach, attachcb );		
		prevattach = src;
		
		if( Array.isArray(src) )
		    src = [...src];
                _model.attach( src, attachcb );
		
		attachcb();
		
	    }
	    
            return false;
        }

	for( var i=0; i<element.childNodes.length; ++i ){
	    
	    var childNode = element.childNodes[i];
	    if( childNode.nodeType != XMLDocument.TEXT_NODE ) continue;
            var memo = { __src:childNode.nodeValue, __hnd:0 };
	    childNode.nodeValue.replace(/\{\{([^\}]+)\}\}/g, bindNodeValue.bind( null, childNode, memo ));
            updateNodeValue( childNode, memo );
	    
	}

        if( element.dataset.inject && element != dom.element ){

            let childDom = new DOM(element);
            Object.assign( childDom, childDom.index("id") );
            
            var ctrl = getInstanceOf( element.dataset.inject, childDom );
            dom[element.dataset.inject] = ctrl;

            prepareDOM( childDom, ctrl, _model, viewdom );

            return false;
        }

    });

    function bindVisibility( element, value, path, style ){

	if( value == "undefined" ) value = undefined;
	else{
	    try{ value = JSON.parse(value); }
	    catch( ex ){}
	}
	let cb = v => {
	    if( v == value )
		element.style.visibility = style;
	};
	
	cb( _model.getItem(path) );
	
	_model.attach( path, cb );
	
    }

    function bindToggle( element, event, cmd ){
	
        element.addEventListener( event, ()=>{
	    
            [...viewdom.element.querySelectorAll(cmd[1])].forEach( target => target.setAttribute(cmd[2], cmd[3]) );
	    
        });
	
    }


    function renderList( element, template, arr ){

	let value = element.value;

        while( element.children.length )
            element.removeChild( element.children[0] );
        
        for( var key in arr ){

            var childModel = new Model();
            childModel.load( _model.data );
            childModel.setItem("key", key);
            childModel.setItem("value", arr[key]);
            childModel.root = _model.root;

            [...template.cloneNode(true).children].forEach(child => {

                element.appendChild( child );
                prepareDOM( new DOM(child), controller, childModel, viewdom );

            });

        }

	element.value = value;

    }

    function bindAttribute( attr, memo, match, inner ){

        if( inner in memo ) return "";

        _model.attach( inner, (value)=>{
            memo[inner] = value;
            if( memo.__hnd ) return;
            memo.__hnd = setTimeout( updateAttribute.bind( null, attr, memo ), 1 );
        });

        memo[inner] = _model.getItem(inner);

        return "";

    }

    function updateAttribute( attr, memo ){
        memo.__hnd = 0;
        attr.value = memo.__src.replace(
		/\{\{([^\}]+)\}\}/g,
	    (match, path) => typeof memo[path] == "object" ?
		JSON.stringify(memo[path])
		: memo[path]
	);
    }

    function bindNodeValue( attr, memo, match, inner ){

        if( inner in memo ) return "";

        _model.attach( inner, (value)=>{
            memo[inner] = value;
            if( memo.__hnd ) return;
            memo.__hnd = setTimeout( updateNodeValue.bind( null, attr, memo ), 1 );
        });

        memo[inner] = _model.getItem(inner);

        return "";

    }

    function updateNodeValue( attr, memo ){
        memo.__hnd = 0;
        attr.nodeValue = memo.__src.replace(
		/\{\{([^\}]+)\}\}/g,
	    (match, path) => typeof memo[path] == "object" ?
		JSON.stringify(memo[path])
		: memo[path]
	);
    }

    
}

var defaultModel = null;

class IController {

    static "@inject" = {
        viewFactory:IView,
        pool:"pool",
        model:Model
    }

    constructor( ){

        this.pool.add(this);

    }

    _show(){
        console.log("created view");
        this.pool.call( "setActiveView", null );	
        var view = this.viewFactory( this );
        return view;
    }

}


function boot( { main, element, components, entities, model } ){

    bind(Pool).to('pool').singleton();
    bind(Model).to(Model).withTags({scope:'root'}).singleton();

    if( model ){
	
	let root = getPolicy({
	    _interface: Model,
	    tags:{scope:'root'},
	    args:[]
	});
	
	root.load( model );
    }

    for( var k in components )
        bind( components[k] ).to( k );

    for( var k in entities ){
        var ctrl = entities[k];
        // console.log( "Adding entity " + k, ctrl );
        bind(ctrl).to(IController);
        bind(IView)
            .to(IView)
            .injecting(
                [document.body, 'ParentElement']
            )
            .withTags({controller:ctrl})
            .factory(); 
    }

    bind(main).to(main).injecting([new DOM(element), DOM]);
    return getInstanceOf( main );

}


export { Model, IView, IController, boot };

