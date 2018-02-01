
let IStore = require('./IStore.js');

if( window.require ){

    var fs = window.require('fs');
    var { remote:{app} } = window.require('electron');

    var {webFrame} = window.require('electron');
    webFrame.registerURLSchemeAsPrivileged('file', {});

}else{

    fs = {

        mkdir( path, cb ){ cb(); },

        readFile( path, enc, cb ){


            var data = localStorage.getItem( path );


            if( typeof enc === "function" ){

                cb = enc;
                if( data === null )
                    return cb( "ENOENT" );

                data = data.split(",");
                var buffer = new Uint8Array( data.length );
                for( var i=0, l=data.length; i<l; ++i )
                    buffer[i] = data[i] | 0;
                data = buffer;

            }else if( data === null )
                return cb( "ENOENT" );

            cb( undefined, data );
            
        },

        writeFile( path, data, cb ){

            localStorage.setItem( path, data );
            cb(true);

        }

    }
}

class NodeStore extends IStore {
    
    constructor(){
        super();

        if( app )
            this.root = app.getPath("userData") + "/";
        else
            this.root = "";

        this.fs = fs;

    }

}


module.exports = NodeStore;