import IStore from '../store/IStore.js';
import { IController, Model, IView } from '../lib/mvc.js';
import JSZip from 'jszip/dist/jszip.min.js';

class Env extends IController {

    static "@inject" = {
        store:IStore,
        pool:"pool",
        viewFactory:[IView, {controller:Env}],
        model: [Model, {scope:"root"}]
    }

    exitSplash(){
	let match = location.search.match(/[?&](?:file|hex|url)=([^&]+)/);
	if( match )
	    this.play( {element:{dataset:{url:match[1]}}} );
	else
            this._show();
    }

    exitSim(){
	this._show();
    }

    onDropFile( dom, event ){
	event.stopPropagation();
	event.preventDefault();


	var dt = event.dataTransfer;
	var files = dt.files;

	for (var i = 0; i < files.length; i++) {
	    let file = files[i];
	    if( /.*\.arduboy$|.*\.hex$/i.test(file.name) )
		return loadFile.call( this, file );
	}

	function loadFile( file ){
	    let fr = new FileReader();
	    fr.onload = evt => {
		this.model.removeItem("app.AT32u4");		
		this.model.setItem("app.AT32u4.hex", fr.result);
		this.pool.call("runSim");
	    };
	    fr.readAsText(file);
	}
	
    }

    play( opt ){
	
	let url = opt.element.dataset.url;
	let srcurl = opt.element.dataset.source;

	if( url == 'new' ) url = 'null';
	
	this.model.removeItem("app.AT32u4");
	let source = this.model.getItem("app.source", null);
	
	if( source && ((url == 'null' && !source['main.ino']) || this.model.getItem('app.sourceUrl') !== url) ){
    	    for( let k in source )
		this.model.removeItem(["app", "source", k]);
	    source = null;
	}
		
	if( /\.arduboy$/i.test(url) ){
	    
	    let zip = null;
	    fetch( this.model.getItem("app.proxy") + url )
		.then( rsp => rsp.arrayBuffer() )
		.then( buff => JSZip.loadAsync( buff ) )
		.then( z => (zip=z).file("info.json").async("text") )
		.then( info => zip.file( JSON.parse( fixJSON(info) ).binaries[0].filename).async("text") )
		.then( hex => {
		    this.model.setItem("app.AT32u4.hex", hex);
		    this.pool.call("runSim");
		})
		.catch( err => {
		    console.error( err );
		});

	}else{
	    this.model.setItem("app.AT32u4.url", this.model.getItem("app.proxy") + url );
	    setTimeout( _ => this.pool.call("runSim"), 10 );
	}

	this.model.setItem('app.sourceUrl', url);

	let ghmatch = srcurl &&
	    srcurl.match(/^(https\:\/\/(bitbucket\.org|framagit\.org|github\.com)\/[^/]+\/[^/]+).*/) ||
	    url.match(/^(https\:\/\/(bitbucket\.org|framagit\.org|github\.com)\/[^/]+\/[^/]+).*/);
	
	if( ghmatch ){
	    srcurl = ghmatch[1] + "/archive/master.zip";
	}else if( srcurl && /.*\.zip$/.test(srcurl) ){
	}else if( /.*\.zip$/.test(url) ){
	    srcurl = url;
	}else srcurl = null;
	
	if( srcurl ){

	    fetch( this.model.getItem("app.proxy") + srcurl )
		.then( rsp => rsp.arrayBuffer() )
		.then( buff => JSZip.loadAsync( buff ) )
		.then( z => {
		    
		    for( let k in z.files ){
			if( /.*\.(h|hpp|c|cpp|ino)$/i.test(k) ){
			    addFile.call( this, k );
			}
			console.log(k);
		    }

		    function addFile( name ){
			z.file(name)
			    .async("text")
			    .then( txt =>{
				
				if( txt.charCodeAt(0) == 0xFEFF )
				    txt = txt.substr(1);
				
				this.model.setItem([
				    "app",
				    "source",
				    name.replace(/\\/g, "/")
				],txt );
				
			    })
			    .catch( err => {
				console.error( err.toString() );
				this.model.setItem([
				    "app",
				    "source",
				    name
				], "// ERROR LOADING: " + err)
			    });
		    }
		    
		})
		.catch(err => {
		    console.error( err.toString() );
		    this.model.setItem(
			["app","source","main.ino"],
			"// Could not load source: " + err
		    );
		});

	}else if( !source ){
	    this.model.setItem(
		["app","source","main.ino"],
`
/*
Hello, World! example
June 11, 2015
Copyright (C) 2015 David Martinez
All rights reserved.
This code is the most basic barebones code for writing a program for Arduboy.

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.
*/

#include <Arduboy2.h>

// make an instance of arduboy used for many functions
Arduboy2 arduboy;


// This function runs once in your game.
// use it for anything that needs to be set only once in your game.
void setup() {
  // initiate arduboy instance
  arduboy.begin();

  // here we set the framerate to 15, we do not need to run at
  // default 60 and it saves us battery life
  arduboy.setFrameRate(15);
}


// our main game loop, this runs once every cycle/frame.
// this is where our game logic goes.
void loop() {
  // pause render until it's time for the next frame
  if (!(arduboy.nextFrame()))
    return;

  // first we clear our screen to black
  arduboy.clear();

  // we set our cursor 5 pixels to the right and 10 down from the top
  // (positions start at 0, 0)
  arduboy.setCursor(4, 9);

  // then we print to screen what is in the Quotation marks ""
  arduboy.print(F("Hello, world!"));

  // then we finaly we tell the arduboy to display what we just wrote to the display
  arduboy.display();
}
`
	    );
	}
	
	
	function fixJSON( str ){
	    
	    if( str.charCodeAt(0) == 0xFEFF )
		str = str.substr(1);
	    
	    return str.replace(/\,(?!\s*?[\{\[\"\'\w])/g, '');
	    
	}
    }

}


export default Env;
