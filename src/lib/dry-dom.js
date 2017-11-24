module.exports = DOM;

function DOM( element ){

    if( !element && document && document.body )
        element = document.body;

    this.element = element;

}

var spare = null;
function getThis( that ){

    if( !that || typeof that == "function" )
        return spare = spare || new DOM();

    return that;

}

function prototype( obj ){
    
    var desc = {};
    for( var k in obj ){
        desc[k] = {
            enumerable:false,
            value: obj[k]
        }
    }

    var ret = {};
    Object.defineProperties(ret, desc);

    return ret;

}

var impl = {

    create:function( strTagName, objProperties, arrChildren, elParent ){
        var args = Array.from(arguments);
        strTagName = objProperties = arrChildren = elParent = undefined;

        for( var i=0, l=args.length; i<l; ++i ){
            var arg = args[i];
            if( typeof arg == "string" )
                strTagName = arg;
            else if( typeof arg == "object" ){
                if( Array.isArray(arg) )
                    arrChildren = arg;
                else if( arg instanceof Element )
                    elParent = arg;
                else
                    objProperties = arg;
            }    
        }

        if( !elParent && this.element )
            elParent = this.element;

        if( !strTagName ){
            if( !elParent )
                strTagName = "span";
            else
                strTagName = {
                    table:"tr",
                    tr:"td",
                    select:"option",
                    ul:"li",
                    ol:"li",
                    dl:"dt",
                    optgroup:"option",
                    datalist:"option"
                }[elParent.tagName] || elParent.tagName;
        }

        var element = document.createElement( strTagName );
        if( elParent )
            elParent.appendChild( element );
        
        var listener;

        for( var key in objProperties ){
            var value = objProperties[key];
            if( key == "text" )
                element.appendChild( document.createTextNode(value) );
            else if( key == "listener" )
                listener = value;
            else if( key == "attr" ){
                for( var attr in value )
                    element.setAttribute( attr, value[attr] );
            }else if( element[key] && typeof element[key] == "object" && typeof value == "object" )
                Object.assign( element[key], value );
            else
                element[key] = value;
        }

        if( this.element && element.id )
            this[element.id] = element;

        for( i=0, l=arrChildren && arrChildren.length; i<l; ++i ){
            this.create.apply( this, arrChildren[i].concat(element) );
        }

        if( listener )
            (new DOM(element)).listen( listener );

        return element;
    },

    listen:function( listeners, that, prefix ){
        prefix = prefix || "";
        if( that === undefined ) that = listeners;

        var THIS = getThis( this );

        var keys = Object.keys( listeners );

        THIS.forEach( element => {

            if( listeners[prefix + element.tagName] ) 
                bind( listeners[prefix + element.tagName], element );

            if( listeners[prefix + element.id] ) 
                bind( listeners[prefix + element.id], element );

            if( listeners[prefix + element.className] ) 
                bind( listeners[prefix + element.className], element );

            if( listeners[prefix + element.name] ) 
                bind( listeners[prefix + element.name], element );

        });

        return THIS;

        function bind( obj, element ){

            for( var event in obj ){
                var func = obj[event];
                if( !func.call ) continue;
                element.addEventListener( event, that ? func.bind(that) : func );
            }

        }

    },

    index:function( keys, multiple, property ){
        var THIS = getThis(this);

        var index = Object.create(DOM.prototype);

        if( typeof keys == "string" ) keys = [keys];

        for( var i=0, l=keys.length; i<l; ++i ){

            var key = keys[i];
            if( typeof key != "string" )
                continue;

            if( !property && !multiple ){

                THIS.forEach( child => child[key] !== undefined && (index[ child[key] ] = child) );

            }else if( property && !multiple ){

                THIS.forEach( child =>{
                    if( child[property] && typeof child[property] == "object" && child[property][key] !== undefined ) 
                        index[ child[property][key] ] = child;
                });

            }else if( !property && typeof multiple == "function" ){
                
                THIS.forEach( child => {
                    if( child[key] !== undefined )
                        multiple( child[key], child );
                });

            }else if( property && typeof multiple == "function" ){

                THIS.forEach( child =>{

                    if( !child[property] || typeof child[property] != "object" ) 
                        return;

                    var v = child[property][key];
                    if( v !== undefined )
                        multiple( v, child );
                    
                });
                
            }else if( !property && multiple ){
                
                THIS.forEach( child => {
                    if( child[key] !== undefined ){
                        if( !index[ child[key] ] )
                            index[ child[key] ] = [child];
                        else
                            index[ child[key] ].push( child );
                    }
                });

            }else if( property && multiple ){

                THIS.forEach( child =>{

                    if( !child[property] || typeof child[property] != "object" ) 
                        return;

                    var v = child[property][key];
                    if( v !== undefined ){
                        if( !index[ v ] )
                            index[ v ] = [child];
                        else
                            index[ v ].push( child );
                    }
                    
                });
                
            }

        }

        return index;

    },

    forEach:function( cb, element ){
        var THIS = getThis(this);

        element = element || THIS.element;

        if( !element )
            return;

        if( cb(element) === false )
            return;

        if( !element.children )
            return;

        for( var i=0, l=element.children.length; i<l; ++i ){
            THIS.forEach( cb, element.children[i] );
        }

    }

};

Object.assign(DOM, impl);
DOM.prototype = prototype(impl);
