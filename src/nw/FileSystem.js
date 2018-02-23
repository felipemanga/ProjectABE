import IStore  from '../store/IStore.js';
import { Model } from '../lib/mvc.js';

let fileWatches, disableWatch;

const fs = window.require("fs"),
      path = window.require('path');

class FileSystem {


    static "@inject" = {
        store:IStore,
        pool:"pool",
        root: [Model, {scope:"root"}]
    }
    
    
    onSetSkin( skin ){
	nw.Window.get().resizeTo( skin.width, skin.height );
    }
    
    embed(url){
	
	let parent = document.getElementById("embed");
	let wv = parent.children[0];

	document.getElementById("main").classList.add("embed");

	if( !wv ){
	    wv = document.createElement("webview");
	    parent.appendChild( wv );
	}

	wv.src = url;

    }

    initWatches(){

	if( !fs ) return;

	fileWatches = fileWatches || [];

	fileWatches.forEach( w => {
	    w.file.close();
	    if( w.hnd )
		clearTimeout( w.hnd );
	});
	
	fileWatches.length = 0;

    }

    saveFile( name, content ){
	let lsp = this.root.getItem("ram.localSourcePath", "");
	let fulltarget = path.resolve( lsp, name );
	disableWatch = fulltarget;
	this.store.saveFile( name, content );
	setTimeout( _=>{
	    if( disableWatch === fulltarget )
		disableWatch = null;
	}, 500);
    }

    watchFile( ffp, cb ){
	let lsp = this.root.getItem("ram.localSourcePath", "");
	
	if( !fs || !lsp || fileWatches.find( x=>x.path == ffp) )
	    return;
	
	let watch, reload;
	
	let watcher = {
	    path:ffp,
	    name:ffp.substr( lsp.length+1 )
	};

	let loadFile = _ => {
	    
	    fs.readFile( ffp, 'utf-8', (err,txt) => {
		if( err ) return cb( watcher.name );
		cb( watcher.name, txt );

		watch();
		
		if( fileWatches.indexOf(watcher) == -1 )
		    fileWatches.push(watcher);
		
	    });
	    
	};

	watch = () => {
	    if( watcher.file )
		watcher.file.close();

	    watcher.file = fs.watch( watcher.path,
				     {persistent:false},
				     _ => {
					 if( watcher.hnd )
					     clearTimeout(watcher.hnd);
					 watcher.hnd = setTimeout( reload.bind( this, watcher ), 50 );
				     });
	};

	reload = (watcher) => {
	    if( disableWatch == watcher.path )
		setTimeout( _ => watch(watcher), 100 );
	    else
		loadFile();
	};
	

	loadFile();	

    }


}

module.exports = FileSystem;
