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
	this.model.removeItem("app.srcpath");
	this.model.setItem('app.srcpath', ["app", "sources", url]);
	let source = this.model.getModel( this.model.getItem("app.srcpath"), true);
	
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

	let ghmatch = srcurl &&
	    srcurl.match(/^(https\:\/\/(bitbucket\.org|framagit\.org|github\.com)\/[^/]+\/[^/]+).*/) ||
	    url.match(/^(https\:\/\/(bitbucket\.org|framagit\.org|github\.com)\/[^/]+\/[^/]+).*/);
	
	if( ghmatch ){
	    srcurl = ghmatch[1] + "/archive/master.zip";
	}else if( srcurl && /.*\.(?:zip|ino)$/.test(srcurl) ){
	}else if( /.*\.(?:zip|ino)$/.test(url) ){
	    srcurl = url;
	}else srcurl = null;

	this.model.setItem("ram.srcurl", srcurl);	
	
	function fixJSON( str ){
	    
	    if( str.charCodeAt(0) == 0xFEFF )
		str = str.substr(1);
	    
	    return str.replace(/\,(?!\s*?[\{\[\"\'\w])/g, '');
	    
	}
    }

}


export default Env;
