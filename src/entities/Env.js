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
	let url = this.model.getItem("ram.autoRun");
	if( url ){
	    this.play( {element:{dataset:{url}}} );
	}else{
	    let repoName = this.model.getItem("ram.currentRepo", "");
	    let list = this.model.getItem("app.repoList");
	    if( !repoName )
		repoName = Object.keys(list)[0];
	    
	    this.changeRepo( {element:{dataset:{
		key:repoName,
		url:list[repoName]
		}}} );
            this._show();
	}
    }

    exitSim(){
	this._show();
    }

    changeRepo( dom, event ){
	let repoName = dom.element.dataset.key;
	this.model.setItem("ram.currentRepo", repoName);

	let repoURL = dom.element.dataset.url;

	this.activateRepo( repoName );

	let proxy = this.model.getItem("proxy", "");
	repoURL = (/^https?.*/.test(repoURL) ? proxy : "") + repoURL;

	let age = (new Date()).valueOf() - this.model.getItem(["app", "repodata", repoName, "timestamp"], 0);
	
	if( age > 5 * 60 * 60 * 1000 )	
	    fetch( repoURL )
	    .then( rsp => rsp.json() )
	    .then( json => this._updateRepo( repoName, json ) )
	    .catch( err => console.warn(err) ) // might be offline, be subtle
    }

    activateRepo( repoName ){
	let clone = JSON.parse(
	    JSON.stringify(
		this.model.getModel(["app", "repodata", repoName], true).data
	    )
	);
	this.model.setItem("ram.repo", clone );	
    }

    _updateRepo( repoName, json ){
	if( !json || typeof json != "object" || !Array.isArray(json.items) ){
	    console.log("Repo JSON: ", json);
	    return;
	}

	json.timestamp = (new Date()).valueOf();
	
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
	    
	});

	this.model.setItem(["app", "repodata", repoName], json);

	if( repoName == this.model.getItem("ram.currentRepo") )
	    this.activateRepo( repoName );
	
    }

    onDropFile( dom, event ){
	var dt = event.dataTransfer;
	var files = dt.files;

	event.stopPropagation();
	event.preventDefault();

	this.model.removeItem("app.AT32u4");
	this.model.removeItem("app.srcpath");

	for (var i = 0; i < files.length; i++) {
	    let file = files[i];
	    
	    this.model.setItem('app.srcpath', ["app", "sources", file.name]);
	    
	    if( /.*\.hex$/i.test(file.name) )
		return loadFileHex.call( this, file );
	    
	    if( /.*\.arduboy$/i.test(file.name) )
		return loadFileArduboy.call( this, file );
	    
	}

	function loadFileHex( file ){
	    let fr = new FileReader();
	    fr.onload = evt => {
		this.model.removeItem("app.AT32u4");		
		this.model.setItem("app.AT32u4.hex", fr.result);
		let source = this.model.getModel( this.model.getItem("app.srcpath"), true );
		source.setItem(["build.hex"], fr.result);
		this.pool.call("runSim");
	    };
	    fr.readAsText(file);
	}
	
	function loadFileArduboy( file ){
	    let fr = new FileReader();
	    fr.onload = evt => this.loadArduboy( fr.result );
	    fr.readAsArrayBuffer(file);
	}
	
    }

    embed( dom, evt ){
	if( dom && evt )
	    this.pool.call("embed", evt.target.dataset.url);
    }

    preview( opt ){
	let key = opt.element.dataset.key;
	let item = this.model.getModel(["ram", "repo", "items", key], false);
	item = JSON.parse( JSON.stringify(item.data) );
	try{
	    item.aburl = 'arduboy:' + item.binaries[0].filename;
	}catch( ex ){
	    item.aburl = '';
	}
	this.model.setItem("ram.preview", item);
    }

    upload( opt ){
	if( this.model.getItem("ram.hasFlasher") )
	    this.load( opt, _ => this.pool.call("doFlash") );
	else
	    window.open( this.model.getItem("ram.preview.aburl") );
    }

    Konami(){
	if( !self.core )
	    this.play({element:{dataset:{
		title:'',
		url:''
	    }}});
    }
    
    play( opt ){
	this.load( opt, _ => this.pool.call("runSim") );
    }
    
    load( opt, cb ){

	let url, srcurl, title;

	if( opt.element.dataset.url ){
	    url = opt.element.dataset.url;
	    srcurl = opt.element.dataset.source;
	    title = opt.element.querySelector && opt.element.querySelector('.gameName');
	    if( title ) title = title.dataset.name;
	}else{
	    url = this.model.getItem("ram.preview.binaries.0.filename", "");
	    srcurl = this.model.getItem("ram.preview.sourceUrl");
	    title = this.model.getItem("ram.preview.title");
	}

	if( title )
	    document.title = title;

	if( url == 'new' ) url = 'null';
	
	this.model.removeItem("app.AT32u4");
	this.model.removeItem("app.srcpath");
	this.model.setItem('app.srcpath', ["app", "sources", url]);
	let source = this.model.getModel( this.model.getItem("app.srcpath"), true);

	let build = source.getItem(["build.hex"]);

	let finalURL, proxy = this.model.getItem("app.proxy");
	let github = url.match(/^https:\/\/raw.githubusercontent.com\/(.*)$/i);
	if( github && proxy )
	    finalURL = 'https://gitcdn.xyz/repo/' + github[1];
	
	if( !finalURL )
	    finalURL = proxy + url;
	
	if( build || url == "null" ){
	    
	    if( build )
		this.model.setItem("app.AT32u4.hex", build);
	    else
		this.model.setItem("app.AT32u4.url", url);
	    
	    cb();
	
	} else if( /\.arduboy$/i.test(url) ){
	    
	    let zip = null;
	    fetch( finalURL )
		.then( rsp => rsp.arrayBuffer() )
		.then( buff => this.loadArduboy(buff, cb) )
		.catch( err => {
		    console.error( err );
		});

	}else{
	    fetch( finalURL )
		.then( rsp => {
		    if( rsp.ok )
			return rsp.text();
		    else if( finalURL != url && proxy ){
			return new Promise((ok, nok) => {
			    fetch( proxy + url )
				.then( rsp => rsp.ok ? ok(rsp.text()) : nok("error") )
				.catch( ex => nok(ex) );
			});
		    }
		})
		.then( hex => {
		    source.setItem(["build.hex"], hex);
		    this.model.setItem("app.AT32u4.hex", hex);
		    cb();
		})
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
	
    }

    loadArduboy( buff, cb ){
	let zip;
	let source = this.model.getModel( this.model.getItem("app.srcpath"), true);
	
	JSZip.loadAsync( buff )
	    .then( z => (zip=z).file("info.json").async("text") )
	    .then( info => zip.file( JSON.parse( fixJSON(info) ).binaries[0].filename).async("text") )
	    .then( hex => {
		source.setItem(["build.hex"], hex);
		this.model.setItem("app.AT32u4.hex", hex);
		cb();
	    });

	function fixJSON( str ){
	    
	    if( str.charCodeAt(0) == 0xFEFF )
		str = str.substr(1);
	    
	    return str.replace(/\,(?!\s*?[\{\[\"\'\w])/g, '');
	    
	}
	
	
    }

}


export default Env;
