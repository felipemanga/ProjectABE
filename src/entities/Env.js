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
	this.model.removeItem("app.AT32u4");
	let source = this.model.getItem("app.source", null);
	if( source ){
	    for( let k in source )
		this.model.removeItem(["app", "source", k]);
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
	    this.pool.call("runSim");
	}


	let ghmatch = url.match(/^(https\:\/\/github.com\/[^/]+\/[^/]+\/).*/);
	if( ghmatch ){

	    fetch( this.model.getItem("app.proxy") + ghmatch[1] + "archive/master.zip" )
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

	}
	
	
	function fixJSON( str ){
	    
	    if( str.charCodeAt(0) == 0xFEFF )
		str = str.substr(1);
	    
	    return str.replace(/\,(?!\s*?[\{\[\"\'\w])/g, '');
	    
	}
    }

}


export default Env;
