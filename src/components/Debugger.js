import { IController, Model, IView } from '../lib/mvc.js';
import IStore  from '../store/IStore.js';
import JSZip from 'jszip/dist/jszip.min.js';
import DOM from '../lib/dry-dom.js';
import loadImage from '../lib/image.js';

let fs, path;

if( window.require ){
    try{
	fs = window.require('fs');
	path = window.require('path');
    }catch(ex){}
}

class Debugger {

    static "@inject" = {
        pool:"pool",
	compiler:"Compiler",
        model: [Model, {scope:"root"}],
	store: IStore
    }

    constructor( DOM ){
	this.model.setItem("ram.fuzzy", []);
	this.model.setItem("ram.blocksizes", []);

	this.pool.add(this);
	
	this.DOM = DOM;
	this.history = [];
	this.da = [];
	this.RAM = [];
	this.state = [];
	this.hints = {};
	this.comments = {};
	this.srcmap = [];
	this.rsrcmap = {};
	this.currentPC = null;
	this.ramComments = {};
	this.ramIndex = {};
	
	for( let i=0; i<32; ++i )
	    this.ramComments[i] = "@ R" + i;

	[
	    "Reserved", "Reserved", "Reserved", "PINB", "DDRB", "PORTB",
	    "PINC", "DDRC", "PORTC", "PIND", "DDRD", "PORTD",
	    "PINE", "DDRE", "PORTE", "PINF", "DDRF", "PORTF",
	    "Reserved", "Reserved", "Reserved", "TIFR0", "TIFR1", "Reserved",
	    "TIFR3", "TIFR4", "Reserved", "PCIFR", "EIFR", "EIMSK",
	    "GPIOR0", "EECR", "EEDR", "EEARL", "EEARH", "GTCCR",
	    "TCCR0A", "TCCR0B", "TCNT0", "OCR0A", "OCR0B", "PLLCSR",
	    "GPIOR1", "GPIOR2", "SPCR", "SPSR", "SPDR", "Reserved",
	    "ACSR", "OCDR / MONDR", "PLLFRQ", "SMCR", "MCUSR", "MCUCR",
	    "Reserved", "SPMCSR", "Reserved", "Reserved", "Reserved", "RAMPZ",
	    "Reserved", "SPL", "SPH", "SREG", "WDTCSR", "CLKPR",
	    "Reserved", "Reserved", "PRR0", "PRR1", "OSCCAL", "RCCTRL",
	    "PCICR", "EICRA", "EICRB", "PCMSK0", "Reserved", "Reserved",
	    "TIMSK0", "TIMSK1", "Reserved", "TIMSK3", "TIMSK4",
	    "Reserved", "Reserved", "Reserved", "Reserved", "Reserved",
	    "ADCL", "ADCH", "ADCSRA", "ADCSRB", "ADMUX", "DIDR2", "DIDR0",
	    "DIDR1", "TCCR1A", "TCCR1B", "TCCR1C", "Reserved", "TCNT1L",
	    "TCNT1H", "ICR1L", "ICR1H", "OCR1AL", "OCR1AH", "OCR1BL", "OCR1BH",
	    "OCR1CL", "OCR1CH", "Reserved", "Reserved", "TCCR3A", "TCCR3B", "TCCR3C",
	    "Reserved", "TCNT3L", "TCNT3H", "ICR3L","ICR3H", "OCR3AL", "OCR3AH", "OCR3BL", "OCR3BH",
	    "OCR3CL", "OCR3CH","Reserved", "Reserved", "Reserved", "Reserved", "Reserved", 
	    "Reserved", "Reserved", "Reserved", "Reserved", "Reserved", 
	    "Reserved", "Reserved", "Reserved", "Reserved", "Reserved",
	    "Reserved", "Reserved", "Reserved", "Reserved", "Reserved", 
	    "Reserved", "Reserved", "Reserved", "Reserved", "Reserved", "Reserved", 
	    "TWBR", "TWSR", "TWAR", "TWDR", "TWCR", "TWAMR", "TCNT4",
	    "TC4H", "TCCR4A", "TCCR4B", "TCCR4C", "TCCR4D", "TCCR4E",
	    "CLKSEL0", "CLKSEL1", "CLKSTA", "UCSR1A", "UCSR1B", "UCSR1C",
	    "Reserved", "UBRR1L", "UBRR1H", "UDR1", "OCR4A", "OCR4B", "OCR4C", "OCR4D",
	    "Reserved", "DT4", "Reserved", "Reserved", "UHWCON", "USBCON",
	    "USBSTA", "USBINT", "Reserved", "Reserved", "Reserved", "Reserved", "Reserved", 
	    "UDCON", "UDINT", "UDIEN", "UDADDR", "UDFNUML", "UDFNUMH", "UDMFN",
	    "Reserved", "UEINTX", "UENUM", "UERST", "UECONX", "UECFG0X",
	    "UECFG1X", "UESTA0X", "UESTA1X", "UEIENX", "UEDATX", "UEBCLX", "UEBCHX", "UEINT",
	    "Reserved", "Reserved", "Reserved", "Reserved", "Reserved",
	    "Reserved", "Reserved", "Reserved", "Reserved", "Reserved", "Reserved"
	].forEach( (name, i)=>this.ramComments[i+0x20] = name );

	this.code = null;
	this.compileId = 0;

	// this.initSource();
	
    }

    setActiveView(){
	this.pool.remove(this);
    }


    initSource(){
	if( this.source )
	    return true;
	
	this.source = this.model.getModel(
	    this.model.getItem("ram.srcpath"),
	    true
	) || new Model();

	let promise = null;

	let srcurl = this.model.getItem("ram.srcurl", "");
	let lsp = this.model.getItem("ram.localSourcePath", "");

	if( /.*\.ino$/.test(srcurl) ){
	    
	    promise = fetch( this.model.getItem("app.proxy") + srcurl )
		.then( rsp => rsp.text() )
		.then( txt => {

		    if( txt.charCodeAt(0) == 0xFEFF )
			txt = txt.substr(1);
		    
		    this.addNewFile( "main.ino", txt );
		    
		});
	    
	}else if( srcurl ){

	    promise = fetch( this.model.getItem("app.proxy") + srcurl )
		.then( rsp => rsp.arrayBuffer() )
		.then( buff => JSZip.loadAsync( buff ) )
		.then( z => this.importZipSourceFiles(z) );

	}else if( lsp && fs ){
	    this.pool.call("initWatches");
	    
	    let readDir = ( d ) => {
		fs.readdir( d, (err, files) => {

		    if( !files ){
			console.log("Could not read " + d);
			console.log( err );
			return;
		    }
		    
		    files.forEach( file => {

			if( file[0] == '.' )
			    return;
		    
			let ffp = d + path.sep + file;
			if( fs.lstatSync(ffp).isDirectory() )
			    return readDir( ffp );

			let ext = file.match(/.*\.(h|hpp|c|cpp|ino)$/i);
			if( ext )
			    this.pool.call("watchFile", ffp, (name,txt) => {
				if( txt === undefined ) return;
				this.addNewFile( name, txt, true );
				
				if( ext[1].toLowerCase() == 'ino' ){
				    this.DOM.currentFile.value = name;
				    this.changeSourceFile();
				    ext = ["",""];
				}
				
			    });
			
		    } );
		    
		} );
	    }

	    setTimeout( _ => readDir( lsp ), 100 );

	}else if( !Object.keys(this.source.data).length ){
	    let name = prompt("Project Name:");
	    lsp = '';
	    if( fs ){
		lsp = this.compiler.getSketchDir() + `/${name}`;
		this.model.setItem("ram.localSourcePath", lsp);
	    }

	    this.addNewFile(
		`${name}.ino`,
`

// See: https://mlxxxp.github.io/documents/Arduino/libraries/Arduboy2/Doxygen/html/
#include <Arduboy2.h>
 
Arduboy2 arduboy;

void setup() {
  arduboy.begin();
  arduboy.setFrameRate(30);

  // initialize things here

}

void loop() {
  if (!(arduboy.nextFrame()))
    return;

  arduboy.clear();

  // game goes here

  arduboy.display();
}
`
	    );
	}

	
	if( promise )
	    promise.catch(err => {
		console.error( err.toString() );
		core.history.push( err.toString() );
		this.DOM.element.setAttribute("data-tab", "history");
		this.refreshHistory();
	    });
	
	if( !this.source )
	    return false;

	this.initEditor();

	return true;
	
    }

    showDebugger(){
	this.DOM.element.setAttribute("hidden", "false");
	this.DOM.element.setAttribute("data-tab", "source");
	this.initSource();
    }

    initEditor(){
	if( this.code )
	    return;
	let editor = this.code = ace.edit( this.DOM.ace );
	editor.$blockScrolling = Infinity;
	editor.setTheme("ace/theme/monokai");
	editor.getSession().setMode("ace/mode/c_cpp");
	editor.resize(true);
	
	editor.session.on( "change", _ => this.commit() );
	editor.session.setOptions({ tabSize: 2 });

	let getLineAddress = ( line ) => {
	    var file = this.DOM.currentFile.value;
	    return this.rsrcmap[file+":"+(line+1)];	    
	};
	
	editor.on("guttermousedown", e => {
	    let target = e.domEvent.target; 
	    if (target.className.indexOf("ace_gutter-cell") == -1) 
		return; 
	    if (!this.code.isFocused()) 
		return;

	    e.stop();
	    let row = e.getDocumentPosition().row;
	    var addr = getLineAddress( row )
	    if( addr !== undefined ){
		if( core.breakpoints[addr] )
		    core.breakpoints[addr] = false;
		else
		    core.breakpoints[addr] = () => true;
		
		core.enableDebugger();
		this.changeBreakpoints();
	    }else{
		this.code.session.setBreakpoint( row, "invalid");
	    }
	    
	});

	let updateTooltip = (position, text) => {

	    if( !text ){
		this.DOM.codeToolTip.style.display = "none";
		return;
	    }

	    let offX = 0, offY = 0;
	    let pe = this.DOM.codeToolTip.parentElement;
	    while( pe ){
		offX += pe.offsetLeft;
		offY += pe.offsetTop;
		pe = pe.parentElement;
	    }
	    
	    this.DOM.codeToolTip.setAttribute("data-text", text);
	    this.DOM.codeToolTip.style.display = "block";
	    this.DOM.codeToolTip.style.left = (position.pageX - offX) + 'px';
	    this.DOM.codeToolTip.style.top = (position.pageY - offY) + 'px';
	};

	editor.on("mousemove", (e) => {
	    var position = e.getDocumentPosition();
	    if( !position ) return;
	    var wordRange = editor.getSession().getWordRange(position.row , position.column);
	    var text = editor.session.getTextRange(wordRange);
	    var pixelPosition = editor.renderer.textToScreenCoordinates(position);
	    pixelPosition.pageY += editor.renderer.lineHeight;
	    
	    let addr = this.ramIndex[text];
	    if( !text || !addr ){
		text = "";
	    }else{
		let name = text;
		text += ":\n";

		if( this.ramIndex[name+"+0x3"] && ! this.ramIndex[name+"+0x4"] ){ // 32-bit
		    let value =
			core.memory[ addr ] +
			(core.memory[ addr+1 ] << 7) +
			(core.memory[ addr+2 ] << 14) +
			(core.memory[ addr+3 ] << 21);
		    if( value&0x80000000 ){
			text += "uint32: " + (value>>>0) + " (0x" + (value>>>0).toString(16) + ")\n";
			text += "int32: " + (value) + " (0x" + (value).toString(16) + ")\n";
		    }else
			text += "(u)int32: " + (value) + " (0x" + (value).toString(16) + ")\n";			
		    
		}else if( this.ramIndex[name+"+0x1"] && !this.ramIndex[name+"+0x2"] ){
		    let value =
			core.memory[ addr ] +
			(core.memory[ addr+1 ] << 8);
		    if( value&0x8000 ){
			text += "uint16: " + (value>>>0) + " (0x" + (value>>>0).toString(16) + ")\n";
			text += "int16: " + (0xFFFF0000|value) + " (0x" + (value).toString(16) + ")\n";
		    }else
			text += "(u)int16: " + (value) + " (0x" + (value).toString(16) + ")\n";

		    let src = this.srcmap[ value ];
		    if( src && !src.offset && this.hints[value] ){
			this.hints[value].replace(/(?:^|\n)[0-9a-f]+\s+<([^>]+)>:\n/, (m, fname) => {
			    text += "fptr: ";
			    fname = this.unmangle(fname); // fname.replace(/_Z[0-9]+(.*)v/, "$1");
			    text += fname + "\n" + src.file + ":" + src.line;
			});
		    }
		    
		}else{
		    let value =
			core.memory[ addr ];
		    if( value & 0x80 ){
			text += "uint8: " + (value>>>0) + " (0x" + (value>>>0).toString(16) + ")\n";
			text += "int8: " + (0xFFFFFF00|value) + " (0x" + (value).toString(16) + ")\n";
		    }else
			text += "(u)int8: " + (value) + " (0x" + (value).toString(16) + ")\n";
		}
	    }
	    
	    updateTooltip(pixelPosition, text);
	});	
		
        this.code.commands.addCommand({
            name: "replace",
            bindKey: {win: "Ctrl-Enter", mac: "Command-Option-Enter"},
            exec: () => this.compile()
        });	    

        this.code.commands.addCommand({
            name: "fuzzy",
            bindKey: {win: "Ctrl-P", mac: "Command-P"},
            exec: () => this.showFuzzyFinder()
        });	    

	this.changeSourceFile();

    }

    local( str, cb ){
	if( !cb ) cb = str;
	if( typeof str != "string" ) str = this.DOM.currentFile.value;
	if( typeof cb != "function" ) cb = null;
	
	let lsp = this.model.getItem("ram.localSourcePath", "");
	
	if( !lsp || !fs )
	    return;
	
	let filePath = path.resolve( lsp, str );
	
	if( !cb ) return filePath;

	return cb( filePath, lsp );
    }

    deleteFile(){
	if( !this.initSource() ) return;

	if( !confirm("Are you sure you want to delete " + this.DOM.currentFile.value + "?") )
	    return;

	if( this.local( file => {
	    try{
		fs.unlinkSync(file);
	    }catch( err ){
		alert("Unable to delete: " + err);
		return false;
	    }
	} ) === false )
	    return;
	
	this.source.removeItem([this.DOM.currentFile.value]);
	this.DOM.currentFile.value = Object.keys(this.source.data)[0];
	this.changeSourceFile();
    }

    renameFile(){
	if( !this.initSource() ) return;

	let current = this.DOM.currentFile.value;
	let shortCurrent = current;
	
	let lsp = this.model.getItem("ram.localSourcePath", "");
	if( current.startsWith(lsp) )
	    shortCurrent = current.substr(lsp.length+1);
	
	let target = prompt("Rename " + shortCurrent + " to:", shortCurrent);
	target = (target||"").trim();
	
	if( target == "" || target == shortCurrent )
	    return;
	
	let src = this.source.getItem([current]);

	this.pool.call("saveFile", target, src);

	if( this.local( file => {
	    
	    let del = _ => {
		try{
		    fs.unlinkSync(file);
		}catch( ex ){
		    alert("Error: " + ex);
		    return false;
		}
	    };

	    target = lsp + path.sep + target;
	    
	    let fulltarget = path.resolve( target );
	    if( fs.existsSync(target) ){
		alert("Error: New name not available");
		return false;
	    }

	    // if the only change was capitalization, delete first because of Windows / OS X
	    if( target.toLowerCase() == shortCurrent.toLowerCase() ){
		del();
		save();
	    }else{
		save();
		del();
	    }

	}) === false )
	    return;
	

	this.source.removeItem([current]);
	this.source.setItem([target], src);
	this.DOM.currentFile.value = target;
    }

    addNewFile( target, content, disableSave ){
	if( !this.initSource() ) return;

	if( typeof target !== "string" )
	    target = (prompt("File name:") || "").trim();
	
	if( target == "" ) return;

	content += "";

	let old = this.source.getItem([target], undefined);
	
	this.source.setItem( [target], content );

	this.local( target, ffp => clearTimeout(this.saveHandles[ ffp ]) );
	
	if( !disableSave && old !== content ){
	    this.DOM.currentFile.value = target;
	    this._saveFile( target, content, true );
	}

	if( this.DOM.currentFile.value == target )
	    this.changeSourceFile();
    }

    zip(){
	
	var zip = new JSZip();
	let source = this.source.data;
	
	for( let name in source )
	    zip.file( name, source[name]);
	
	zip.generateAsync({type:"blob"})
	    .then( content => {
		
		if( !this.saver ){
		    
		    let dom = new DOM(this.DOM.create("div", {
			id:"el",
			className:"FileSaver",
			onclick:_=>this.saver.el.style.display = "none"
		    }, [
			["a", {
			    id: "zip",
			    textContent:"ZIP",
			    attr:{
				download:"ArduboyProject.zip"
			    }
			}],
			["a", {
			    id: "hex",
			    textContent:"HEX",
			    attr:{
				download:"ArduboyProject.hex"
			    }
			}]
		    ], document.body));
		    this.saver = dom.index("id");		    
		    
		}else
		    URL.revokeObjectURL( this.saver.href );
				
		this.saver.zip.href = URL.createObjectURL( content );
		this.saver.hex.href = URL.createObjectURL(
		    new Blob( [ this.source.getItem(["build.hex"]) ], {type:"text/x-hex"} )
		);
		this.saver.el.style.display = "block";
		
	    });	
    }

    importZipSourceFiles( z ){

	for( let k in z.files ){
	    if( /.*\.(h|hpp|c|cpp|ino)$/i.test(k) ){
		addFile.call( this, k );
	    }
	}

	function addFile( name ){
	    z.file(name)
		.async("text")
		.then( txt =>{
		    
		    if( txt.charCodeAt(0) == 0xFEFF )
			txt = txt.substr(1);

		    this.addNewFile( name.replace(/\\/g, "/"), txt );
		    
		})
		.catch( err => {
		    console.error( err.toString() );
		    this.source.setItem([name], "// ERROR LOADING: " + err)
		});
	}
	
    }

    onDropFile( dom, event ){
	
	var dt = event.dataTransfer;
	var files = dt.files;

	event.stopPropagation();
	event.preventDefault();

	for (var i = 0; i < files.length; i++) {
	    let file = files[i];
	    if( /.*\.(png|jpg|gif|bmp)$/i.test(file.name) )
		loadImageFile.call( this, file );
	    if( /.*\.zip$/i.test(file.name) )
		loadZipFile.call( this, file );
	    if( /.*\.(cpp|ino|h|hpp)$/i.test(file.name) )
		loadSourceFile.call( this, file );
	}

	this.changeSourceFile();

	function loadSourceFile( file ){
	    let fr = new FileReader();
	    fr.onload = evt => {

		let txt = fr.result, name = file.name;

		if( txt.charCodeAt(0) == 0xFEFF )
		    txt = txt.substr(1);

		this.addNewFile( name.replace(/\\/g, "/"), txt );
		
		
	    };
	    fr.readAsText( file );
	}
		
	function loadZipFile( file ){
	    let fr = new FileReader();
	    fr.onload = evt => {
				
		JSZip.loadAsync( fr.result )
		    .then( z => this.importZipSourceFiles(z) );
		
	    };
	    fr.readAsArrayBuffer( file );
	  
	}
		
	function loadImageFile( file ){
	    let fr = new FileReader();
	    fr.onload = evt => {
		
		let cleanName = file.name.replace(/^.*?([^\/\\.]+)\..+$/,'$1');
		cleanName = cleanName.replace(/^([0-9])/, "_$1");
    
		let img = DOM.create("img", {
		    src:fr.result,
		    onload:_=>{

			let src = loadImage( img, cleanName, /.*\.png$/i.test(file.name) );

			var bmpcpp = this.source.getItem(["bmp.cpp"], "#include <Arduino.h>\n#include \"bmp.h\"\n");
			var hasHeader = false;
			var headerPath = "bmp/" + cleanName + ".h";
			
			bmpcpp.replace(/#include\s+"([^"]+)"/g, (_, inc) =>{
			    hasHeader = hasHeader || inc == headerPath;
			    return "";
			});
			
			if( !hasHeader )
			    bmpcpp += "\n#include \"" + headerPath + "\"\n";

			this.source.setItem(["bmp.cpp"], bmpcpp);
			this._saveFile( "bmp.cpp", bmpcpp );

			var bmph = this.source.getItem(["bmp.h"], "");
			var hasExtern = false;

			bmph.replace(/extern\s+const\s+unsigned\s+char\s+PROGMEM\s+([^\[\s\[]+)/g, (_, inc) => {
			    hasExtern = hasExtern || inc == cleanName;
			});

			if( !hasExtern )
			    bmph = src.h + bmph;

			this.source.setItem(["bmp.h"], bmph);
			this._saveFile( "bmp.h", bmph );
			
			this.addNewFile( headerPath, src.cpp );
			
		    }
		    
		});
		
		    
	    };
	    fr.readAsDataURL(file);
	}
	
    }    

    changeBreakpoints(){

	this.code.session.clearBreakpoints();
	if( typeof core == "undefined" ) return;

	let paused = null, currentFile = this.DOM.currentFile.value;
	for( let addr in core.breakpoints ){
	    	    
	    if( addr in this.srcmap && this.srcmap[addr].file == currentFile && core.breakpoints[addr] ){
		
		let c = "unconditional";
		if( addr == this.currentPC ){
		    c += " paused";
		    paused = true;
		}
		this.code.session.setBreakpoint( this.srcmap[addr].line-1, c );
	    }
	    	    
	}
	
	if( !paused && this.srcmap[ this.currentPC ] && this.srcmap[this.currentPC].file == currentFile ){
	    this.code.session.setBreakpoint( this.srcmap[this.currentPC].line-1, "paused" );
	}
	
    }

    showFuzzyFinder(){
	this.DOM.currentFile.style.display = "none";
	this.DOM.fuzzyContainer.style.display = "block";
	this.DOM.fuzzy.focus();
	this.DOM.fuzzy.setSelectionRange(0, this.DOM.fuzzy.value.length);
	this.updateFuzzyFind();
    }

    escapeRegex( str ){
	return str.replace(/[|\\{}()\[\]^$+*?.]/g, '\\$&');
    }

    updateFuzzyFind(){

	let matches, THIS = this;
	let str = this.DOM.fuzzy.value.trim().replace();
	
	if( str.length > 1 ) matches = fuzzy( str, Object.keys(this.source.data) );
	else matches = [];
	
	this.model.setItem( "ram.fuzzy", matches.sort( (a,b)=>a.rank-b.rank ).map( a=>a.match ) );


	function fuzzy( str, args ){

	    if ( str === void 0 ) str = '';
	    if ( args === void 0 ) args = [];

	    var escaped = THIS.escapeRegex(str);
	    var regex = new RegExp(((escaped.split(/(\\.|)/).filter( x=>x.length ).join('(.{0,3})')) ), "i");
	    var length = str.length;

	    return args.reduce(function (acc, possibleMatch) {
		var result = regex.exec(possibleMatch),
		    obj;

		while( result ){
		    let err = 0;
		    for( let i=1; i<result.length; ++i ){
			err += result[i].length;
		    }

		    if( !obj ){
			obj = {
			    match: possibleMatch,
			    rank: err
			}
			acc.push(obj);
		    }else if( obj.rank > err )
			obj.rank = err;
		    
		    possibleMatch = possibleMatch.substr( result.index+1 );
		    result = regex.exec(possibleMatch);
		}
		return acc
	    }, []);
	    
	}
    }

    cancelFuzzyFind( dom, evt ){
	
	if( evt ) return setTimeout( _=>this.cancelFuzzyFind(), 10 );
	
	this.DOM.fuzzyContainer.style.display = "none";
	this.DOM.currentFile.style.display = "";
	this.code.focus();
	
    }

    endFuzzyFind( dom, evt ){
	
	let results = this.model.getItem("ram.fuzzy", []);
	let result = null;
	
	if( evt ){
	    if( evt.type == "keydown" ){
		
		if( evt.key == "Escape")
		    return this.cancelFuzzyFind();
		else if( evt.key != "Enter" )
		    return;
		else if( !results[0] && this.DOM.fuzzy.value.trim().length ){
		    result = this.DOM.fuzzy.value.trim();
		    this.addNewFile( result, "" );
		}

		evt.preventDefault();
		evt.stopPropagation();
		
	    }else if( evt.target.textContent in this.source.data )		
		result = evt.target.textContent;
	    
	}
    
	if( !result && results.length )
	    result = results[0];

	if( result ){
	    this.DOM.currentFile.value = result;
	    setTimeout( _=>this.changeSourceFile(), 10 );
	}
	
	this.cancelFuzzyFind();
	
    }

    changeSourceFile(){
	if( !this.code ) return;
	this.disableCommits = true;
	try{
	    this.code.setValue( this.source.getItem([ this.DOM.currentFile.value ],"") );
	}catch( ex ){
	    throw ex;
	}finally{
	    this.disableCommits = false;
	}
	this.changeBreakpoints();
    }

    unmangle( str ){
	let end = 0, sub = [];
	
	if( str[0] != "_" || str[1] != "Z" ) return str;
	str = str.substr(2);
	let srcstr = str;

	str = chunk(str);

	if( end < srcstr.length ){
	    let a = args( srcstr.substr(end) );
	    str += "(" + a.join(", ") + ")";
	}
	
	return str;
	
	function chunk( str, noDict ){
	    let m = str.match(/(L)?(N)?(Z)?([0-9]+)?/);
	    if( !m ){
		end = str.length;
		return str;
	    }
	    let len = parseInt( m[4] );
	    if( m[2] ){
		let acc = chunk( str.substr(1) );
		let p = 1+end;
		acc += "::" + chunk( str.substr(p), true );
		end += p + 1;
		return acc;
	    }else if(m[3]){
		let func = chunk( str.substr(1) );
		m = str.match(/3__c_?([0-9A-Z]+)$/);
		let idx = 0;
		if( m )
		    idx = parseInt(idx, 36)+1;
		
		func = "Local String #" + idx + " in " + func;
		return func;
	    }else if(m[4]){
		let start = (m[1]?1:0) + m[4].length;
		end = start + len;
		let ret = str.substr( start, len );
		
		if( !noDict ) sub.push( ret );
		
		return ret;
	    }else{
		end = str.length;
		return str;
	    }
	}
	//*
	function args( str ){
	    let pos = 0, acc = [];
	    let nextPostfix = "", nextPrefix = "";
	    
	    while( pos < str.length ){
		let c = {
		    v:"void",
		    w:"wchar_t",
		    b:"bool",
		    c:"char",
		    a:"signed char",
		    h:"unsigned char",
		    s:"short",
		    t:"unsigned short",
		    i:"int",
		    j:"unsigned int",
		    l:"long",
		    m:"unsigned long",
		    x:"long long",
		    y:"unsigned long long",
		    n:"__int128",
		    o:"unsigned __int128",
		    f:"float",
		    d:"double",
		    e:"long double",
		    g:"float128",
		    z:"ellipsis"
		}[ str[pos] ] || str[pos];

		if( c == "P" ){
		    nextPostfix += "*";
		}else if( c == "R" ){
		    nextPostfix += "&";
		}else if( c == "K" ){
		    nextPrefix += "const ";
		}else if( c == "S" ){
		    let idx;
		    if( str[pos+1] == "_" ){
			pos++;
			idx = 0;
		    }else if( /[0-9A-Z]/.test(str[pos+1]) ){
			idx = parseInt(str.substr(pos+1, 36))+1;
		    }else{
			idx = "";
			pos+=2;
			acc.push("?");
			continue;
		    }
		    c = sub[idx];
		    
		    while( str[pos] != "_" && pos++ < str.length );
		    acc.push( nextPrefix + c + nextPostfix );
		    nextPrefix = nextPostfix = "";
		    
		}else if( c == "." ){
		    pos += str.length;
		}else{
		    
		    if( /[0-9]/.test(c) ){
			c = chunk(str.substr(pos));
			pos += end;
		    }
		    if( nextPrefix ){
			sub.push(nextPrefix + c );
		    }
		    if( nextPostfix ){
			sub.push(nextPrefix + c + nextPostfix);
		    }
		    acc.push( nextPrefix + c + nextPostfix );
		    nextPrefix = nextPostfix = "";
		}
		pos++;
	    }

	    return acc;
	}
	/* */

    }

    initSpacebar( txt ){
	var blockSizes = {};

	let prevBlock = null;
	let maxaddr = 28672;
	
	txt.replace(/\n([0-9a-f]{8,8})\s+<([^>]+)>:\s+([^\(:]+\()?/g, (m, addr, name, func, index) => {
	    addr = parseInt(addr, 16);
	    if( prevBlock ){
		prevBlock.end = addr;
		prevBlock.bytes = prevBlock.end - prevBlock.begin;
		prevBlock.endIndex = index;
	    }
	    
	    var r=Math.random()*100+155|0,
		g=Math.random()*100+155|0,
		b=Math.random()*100+155|0;
	    
	    prevBlock = {
		name: this.unmangle(name),
		index,
		endIndex:0,
		deps:{},
		dependants:0,
		isFunc: func !== undefined,
 		begin: addr,
		end: addr,
		size: null,
		bytes: 0,
		color: `rgb(${r},${g},${b})`,
		anticolor: `rgb(${255-r},${255-g},${255-b})`
	    };

	    // name = this.unmangle(name); // .replace(/_ZL?[0-9]+(.*)v/, "$1");
	    
	    blockSizes[ name ] = prevBlock;

	    return "";
	});

	var tinyBlock = {
	    size: null,
	    bytes: 0,
	    color: "black",
	    anticolor: "white",
	    name: "Tiny (<0.5%)"
	};
	var freeBlock = {
	    size: null,
	    bytes: maxaddr - prevBlock.end,
	    color: "white",
	    anticolor: "black",
	    name: "Free"
	};

	var sum = 0;
	
	for( var k in blockSizes ){
	    var block = blockSizes[k];
	    var blockCode = txt.substr( block.index, block.endIndex-block.index );
	    
	    var lines = {}, prevLine = null, prevAddr, accSize = 0;

	    blockCode.replace(/(?:\n|^)([\/a-zA-Z0-9_.]+):([0-9]+)\n\s+([0-9a-f]{4,4}:)/gi, (m, file, line, addr) => {
		addr = parseInt(addr, 16);
		file = file.replace(/^\/app\/public\/builds\/[0-9]+\/sketch\//, '');
		let curLine = `${file}:${line}`;

		if( !(curLine in lines) ){
		    lines[curLine] = {
			line:curLine,
			size:0
		    };
		}

		if( prevLine )
		    prevLine.size += addr - prevAddr;

		prevLine = lines[ curLine ];
		prevAddr = addr;
	    });

	    if( prevLine )
		prevLine.size += block.end - prevAddr;

	    block.lines = Object.keys(lines).map( l => lines[l] );

	    blockCode.replace(/\s+call\s+[.+\-x0-9a-f]+\s+;\s+0x[0-9a-f]+\s+<([^>]+)>/gi, (m, dep)=>{
		if( !blockSizes[dep] ){
		    // console.error("Dependency not found: " + dep);
		    return;
		}
		let count = block.deps[dep] || 0;
		block.deps[dep] = count+1;
		blockSizes[dep].dependants++;
	    });
	}
	/*
	this.source.setItem(["dependencies.txt"],
			    Object.keys(blockSizes)
			    .filter( a => blockSizes[a].isFunc )
			    .sort( (a, b)=> blockSizes[b].bytes - blockSizes[a].bytes )
			    .reduce((acc, key)=>{
				let block = blockSizes[key];
				return acc + block.name +
				    " " + [
					block.bytes + "b:",
					'Internal:',
					    ...block.lines.sort( (a,b)=> b.size - a.size ).map( l => `\t\t${l.line}\t${l.size}b` ),
					'References:',
					    ...Object.keys(block.deps).sort( (a, b) => {
						let wa = blockSizes[a].bytes * (block.deps[a] / blockSizes[a].dependants);
						let wb = blockSizes[b].bytes * (block.deps[b] / blockSizes[b].dependants);
						return wb - wa;
					    })
					    .map( n => `\t\t${this.unmangle(n)} ${blockSizes[n].bytes}b ${block.deps[n]} of ${blockSizes[n].dependants}` )
				    ].join("\n") + "\n\n"
			    }, ""));
	*/
	
	for( var k in blockSizes ){
	    var block = blockSizes[k];
    
	    let size = block.bytes / maxaddr * 100;
	    if( size < 0.5 ){
		delete blockSizes[k];
		tinyBlock.bytes += block.bytes;
		continue;
	    }
	    size = Math.round(size);
	    sum += size;
	    block.size = size + "%";
	}


	let size = Math.round(freeBlock.bytes / maxaddr * 100);
	sum += size;
	freeBlock.size = size + "%";
	if( freeBlock.bytes < 200 )
	    freeBlock.anticolor = "red";

	
	size = Math.round(tinyBlock.bytes / maxaddr * 100);
	sum += size;
	
	if( sum > 100 ) size -= sum - 100;
	tinyBlock.size = size + "%";

	
	blockSizes[ tinyBlock.name ] = tinyBlock;
	blockSizes[ freeBlock.name ] = freeBlock;

	this.model.setItem("ram.blocksizes", blockSizes);
    }

    initHints( txt ){
	let source = this.source.data;
	this.srcmap = [];
	this.rsrcmap = {};

	this.initSpacebar( txt );

	let lsp = this.model.getItem("ram.localSourcePath", "");
	let lbp = this.model.getItem("ram.localBuildPath", "");
	let root = lsp || /^\/app\/builds\/[0-9]+\//;
	let sketchExp;

	if( lsp ){
	    sketchExp = new RegExp( this.escapeRegex(lbp) + path.sep + "sketch" + path.sep + "(.*)" );
	}else
	    sketchExp = /^\/app\/public\/builds\/[0-9]+\/sketch\/(.*)/;
	
	txt.replace(
		/\n([\/a-zA-Z0-9._\- ]+):([0-9]+)\n([\s\S]+?)(?=$|\n[0-9a-f]+ <[^>]+>:|\n(?:[\/a-zA-Z0-9._\-<> ]+:[0-9]+\n))/g,
	    (m, file, line, code)=>{
		if( !lsp )
		    file = file.replace( root, '');
		
		file = file.replace( sketchExp, (match,name) => {
		    name = name.replace(/\\/g, '/');
		    for( let candidate in source ){
			let key = candidate;
			candidate = '/' + candidate.replace(/\\/g, '/');
			if( candidate.substr(candidate.length-name.length-1) == "/" + name ){
			    return key;
			}			  
		    }
		    
		});
		
		if( !(file in source) )
		    return '';
		
		code = '\n' + code;
		let pos = 0;
		code.replace(
			/(?:[\s\S]*?\n)\s+([0-9a-f]+):\t[ a-f0-9]+\t(?:[^\n\r]+)/g,
		    (m, addr) => {
			
			addr = parseInt(addr, 16)>>1;
			
			if( !pos )
			    this.rsrcmap[ file+":"+line ] = addr;
			
			this.srcmap[ addr ] = {file, line, offset:pos++};

			return '';
		    }
		);
		
		return '';
	    });
	
	this.hints = {};
	txt = txt.replace(/\n([0-9a-f]+)\s+(<[^>]+>:)(?:\n\s+[0-9a-f]+:[^\n]+|\n+\s+\.\.\.[^\n]*)+/g, (txt, addr, lbl) =>{
	    this.hints[ parseInt(addr, 16)>>1 ] = (lbl).trim();
	    return '';
	});

	let oldttAddr = this.ttAddr;
	this.ramIndex = {};
	
	txt.replace(/([\s\S]*?\n)\s+([0-9a-f]+):\t[ a-f0-9]+\t([^\n\r]+)/g, (txt, before, addr, after) => {
	    this.hints[ parseInt(addr, 16)>>1 ] = (before + after).trim();
	    after.replace(/\s+;\s+0x8([0-9a-f]{5,5})\s<([^>]+)>/g, (m, addr, name) => {
		let startAddr = parseInt( addr, 16 );
		let endAddr = startAddr+1;
		name = name.replace(/^(.*?)\+0x([0-9a-f]+)$/, (m, name, off)=>{
		    off = parseInt( off, 16 );
		    startAddr -= off;
		    return name;
		});
		if( startAddr < 0 )
		    return;

		let offset = 0;

		for( addr=startAddr; addr<endAddr; addr++ ){

		    let offName = name + (offset?"+0x"+offset.toString(16):"");
		    offset++;

		    this.ramIndex[ offName ] = addr;

		    offName = "@ " + offName;
		    
		    if(
			this.ramComments[addr] &&
			    (this.ramComments[addr][0] != "@" || this.ramComments[addr] == offName)
		    ){ 
			continue;
		    }

		    this.ttAddr = addr;
		    this.setTTComment( offName );
		    
		}
		
	    });
	    return '';
	    
	});

	this.ttAddr = oldttAddr;
	
    }

    saveHandles = {}
    disableCommits = false;

    commit( force ){

	if( this.disableCommits )
	    return;
	
	let code = this.code.getValue();

	let old = this.source.getItem( [this.DOM.currentFile.value] );

	this.source.setItem( [this.DOM.currentFile.value], code );

	if( force || old !== code )
	    this._saveFile( this.DOM.currentFile.value, code, force );

    }

    _saveFile( name, code, force ){
	let lsp = this.model.getItem("ram.localSourcePath", "");
	
	if( !lsp || !fs )
	    return;
	
	let filePath = path.resolve( lsp, name );

	if( this.saveHandles[filePath] )
	    clearTimeout( this.saveHandles[filePath] );

	if( force )
	    write.call(this);
	else
	    this.saveHandles[filePath] = setTimeout( write.bind(this), 10000 );

	function write( ){
	    this.pool.call("saveFile", filePath, code);	    
	}
	
    }

    initQRCGen(){
	if( typeof QRCode == "undefined" ){
	    self.QRCode = false;
	    DOM.create("script", {src:"qrcode.min.js"}, document.head);
	}
    }
    
    updateQRCode( url ){

	this.initQRCGen();

	if( !self.QRCode )
	    return;
	
	url = url.replace(/^https?:/i, "arduboy:");
	
	if( !this.qrcode ){
	    
	    this.qrcode = new QRCode( this.DOM.qrcContainer, {
		text:url,
		correctLevel: QRCode.CorrectLevel.L
	    });
	    
	}else{
	    
	    this.qrcode.clear();
	    this.qrcode.makeCode( url );
	    
	}
	    
	this.DOM.qrc.style.display = "inline";

	if( this.qrcClearTH )
	    clearTimeout( this.qrcClearTH );

	this.qrcClearTH = setTimeout( _=>{
	    
	    this.qrcode.clear();
	    this.DOM.qrc.style.display = "none";
	    if( this.DOM.element.getAttribute("data-tab") == "qr" )
 		this.DOM.element.setAttribute("data-tab", "source");

	    
	}, 50000 );
	
    }

    compile(){
	if( this.DOM.compile.style.display == "none" )
	    return;

	this.commit( true );	
	
	let src = {}, main = null, base = null;
	for( let key in this.source.data ){
	    if( /.*\.(?:hpp|h|c|cpp|ino)$/i.test(key) )
		src[key] = this.source.data[key];
	    if( /.*\.ino$/i.test(key) ){
		let mainParts = key.split(/[/\\]/);
		let parentDir = mainParts.pop();
		if( !main || ((parentDir == key || parentDir + "-master" == key) && base.length<mainParts.length) ){
		    main = key;
		    base = mainParts;
		}
	    }
	}

	if( !main )
	    return alert("Project does not contain an ino file");
	
	this.DOM.compile.style.display = "none";

	this.initQRCGen();
	this.compiler.build( src, main )
	    .then( data => {
		
		this.DOM.compile.style.display = "initial";
		this.model.removeItem("app.AT32u4");

		if( data.path )
		    this.updateQRCode( data.path );

		if( data.disassembly ){
		    this.initHints( data.disassembly );
		    this.source.setItem(["disassembly.s"], data.disassembly);
		}
		
		this.model.setItem("app.AT32u4.hex", data.hex);
		this.source.setItem(["build.hex"], data.hex);
		this.pool.call("loadFlash");		
		
	    })
	    .catch( err => {

		if( typeof err != "string" )
		    err = err.toString();
		    
		err.split("\n").forEach( p => core.history.push(p) );

		this.DOM.element.setAttribute("data-tab", "history");
		this.refreshHistory();
		this.DOM.compile.style.display = "initial";

	    });

    }
    
    refreshRAM( ignoreAuto ){

	if( !ignoreAuto && this.DOM.autoRefreshRAM.checked )
	    setTimeout( _ => this.refreshRAM(), 1000 );
	
	let src = core.memory;
	
	while( this.RAM.length > src.length )
	    this.DOM.RAM.removeChild( this.RAM.pop() );

	let oldttAddr = this.ttAddr;
	while( this.RAM.length < src.length ){
	    
	    this.ttAddr = this.RAM.length;
	    this.RAM.push( this.DOM.create( "li", this.DOM.RAM, {
		title:"0x" + this.RAM.length.toString(16).padStart(4,"0")
	    }) );

	    if( this.ramComments[ this.ttAddr ] )
		this.setTTComment( this.ramComments[ this.ttAddr ] );
	    
	}
	
	this.ttAddr = oldttAddr;

	this.RAM.forEach( (li, idx) => {
	    li.textContent = src[idx].toString(16).padStart(2, "0");
	});
	
    }

    openRAMTT( _, evt ){
	let tt = this.DOM.RAMTT;
	
	let addr = parseInt( evt.target.title, 16 ) || 0;

	this.ttAddr = addr;

	Object.assign(tt.style, {
	    top: evt.target.offsetTop + "px",
	    left: evt.target.offsetLeft + "px",
	    display: "block"
	});

	this.DOM.RAMTTvalue.value = core.memory[ addr ].toString(16).padStart(2, "0");
	this.DOM.RAMTTread.checked = !!core.readBreakpoints[ addr ];
	this.DOM.RAMTTwrite.checked = !!core.writeBreakpoints[ addr ];
	this.DOM.comment.value = this.ramComments[ addr ] || "";
	this.DOM.RAMTTaddr.textContent = "0x" + addr.toString(16).padStart(4, "0");
	
    }

    toggleRAMReadBP(){
	let addr = this.ttAddr || 0;
	core.readBreakpoints[ addr ] = !core.readBreakpoints[ addr ];
	this.updateRAMColor();
    }

    toggleRAMWriteBP(){
	let addr = this.ttAddr || 0;
	core.writeBreakpoints[ addr ] = !core.writeBreakpoints[ addr ];
	this.updateRAMColor();
    }

    updateRAMColor(){
	let color = [0,0,0];
	if( core.readBreakpoints[ this.ttAddr ] ) color[0] = 255;
	if( core.writeBreakpoints[ this.ttAddr ] ) color[1] = 255;
	if( this.ramComments[ this.ttAddr ] )
	    color[2] = parseInt(
		this.ramComments[ this.ttAddr ]
		    .toLowerCase()
		    .replace(/\+.*|[^a-z0-9]+/g, "")
		, 36)*16807%127+127;
	
	color = color.join(",");
	if( color == "0,0,0" ) color = '';
	else color = "rgba(" + color + ",0.5)";
	this.RAM[ this.ttAddr ].style.backgroundColor = color;
    }

    closeRAMTT(){
	this.DOM.RAMTT.style.display = "none";
    }

    setTTvalue(){
	core.memory[ this.ttAddr ] = parseInt( this.DOM.RAMTTvalue.value.trim().replace(/^#|^0x/, ''), 16 ) || 0;
	this.RAM[ this.ttAddr ].textContent = core.memory[ this.ttAddr ];
    }

    setTTComment( value ){
	if( typeof value !== "string" )
	    value = this.DOM.comment.value.trim();

	if( !this.RAM || !this.RAM.length )
	    this.refreshRAM( true );
	
	this.ramComments[ this.ttAddr ] = value;

	this.RAM[ this.ttAddr || 0 ].title = "0x" + this.ttAddr.toString(16).padStart(4, "0") + " " + value;
	this.updateRAMColor();
    }

    refreshState( ignoreAuto ){

	if( !ignoreAuto && this.DOM.autoRefreshState.checked )
	    setTimeout( _ => this.refreshState(), 1000 );
	
	let src = core.state().replace(/\t/g, "    ").replace(/ /g, "&nbsp;").split("\n");
	
	while( this.state.length > src.length )
	    this.DOM.state.removeChild( this.state.shift() );
	
	while( this.state.length < src.length )
	    this.state.push( this.DOM.create( "li", this.DOM.state, [["code"]]) );

	this.state.forEach( (li, idx) => {
	    li.children[0].innerHTML = src[idx];
	});
	
    }

    refreshDa(){
	this.refreshState( true );
	let pc = this.currentPC;
	
	let addr = parseInt( this.DOM.daAddress.value.replace(/^.*[x#]/, ""), 16 ) | 0;
	this.DOM.daAddress.value = addr.toString(16).padStart( 4, "0" );
	
	let src = core.da( addr, 50 )/*.replace(/\t/g, "    ").replace(/ /g, "&nbsp;")*/.split("\n");
	
	while( this.da.length > src.length )
	    this.DOM.da.removeChild( this.da.shift() );
	
	while( this.da.length < src.length ){
	    let el = this.DOM.create( "li", this.DOM.da, [
		["pre",{className:"opContainer"},[
		    ["div", {className:"breakpoint"}],
		    ["code", {className:"op"}]]
		],
		["pre",{className:"commentContainer"},[["code", {className:"comment"}]]]
	    ], {
		onclick:evt=>this.onClickDAItem(evt.currentTarget)
	    });
	    el.dom = (new DOM(el)).index(["id", "className"]);
	    this.da.push( el );
	}

	this.da.forEach( (li, idx) => {
	    
	    let addr = parseInt( src[idx].replace(/&nbsp;/g, ''), 16 ) >> 1;
	    
	    li.address = addr;
	    
	    if( core.breakpoints[addr] )
		li.setAttribute('breakpoint', 'true');
	    else
		li.setAttribute('breakpoint', 'false');

	    if( addr === pc )
		li.setAttribute('pc', 'true');
	    else
		li.setAttribute('pc', 'false');
	    

	    let srcparts = src[idx].split(';');
	    li.dom.op.textContent = srcparts.shift();	    

	    let hint = this.hints[ addr ];
	    if( hint ){
		li.dom.comment.textContent = hint;
	    }else{
		li.dom.comment.textContent = srcparts.join(';');
	    }
	    
	});
	    
    }

    onHitBreakpoint( pc ){
	this.currentPC = pc;
	let srcref = this.srcmap[pc];
	
	if(
	    srcref &&
		srcref.offset &&
		!(pc in core.breakpoints || pc in core.readBreakpoints || pc in core.writeBreakpoints) &&
		this.DOM.element.getAttribute("data-tab") == "source"
	){
	    this.reqStep();
	    return;
	}
	
	this.DOM.daAddress.value = (Math.max(pc-5,0)<<1).toString(16);
	this.refreshDa();

	if( srcref && this.source.getItem([srcref.file]) ){
	    this.DOM.currentFile.value = srcref.file;
	    this.changeSourceFile();
	    this.code.scrollToLine( srcref.line, true, true, _=>{} );
	    this.code.gotoLine( srcref.line, 0, true );	    
	}
	
	if( srcref && !srcref.offset && this.source.getItem([srcref.file]) ){
	    this.DOM.element.setAttribute("data-tab", "source");
	}else{
	    this.DOM.element.setAttribute("data-tab", "da");
	}
	this.DOM.element.setAttribute("paused", "true");
    }

    onScrollDA( DOM, evt ){
	let off = (evt.deltaY > 0 ? -2 : 2) * 4;
	this.DOM.daAddress.value = Math.max( 0, parseInt( this.DOM.daAddress.value, 16 ) - off ).toString(16);
	this.refreshDa();
    }

    onClickDAItem( item ){
	let addr = item.address || 0;
	if( item.getAttribute("breakpoint") !== "true" ){
	    item.setAttribute("breakpoint", "true");
	    
	    core.breakpoints[ addr ] = (pc,sp) => true;
	    
	    core.enableDebugger();
	    
	} else {

	    item.setAttribute("breakpoint", "false");
	    core.breakpoints[ addr ] = null;
	    
	}
	
    }

    reqReset(){
	this.pool.call("reset");
    }

    reqResume(){
	this.DOM.element.setAttribute("paused", "false");
	this.pool.call("resume");
    }

    reqStep(){
	this.pool.call("step");
    }

    pollForPeriferals( periferals ){
	let serial0OUTBuffer = '';
	
	periferals.push({
	    logger:{
		connect:"cpu.0",
		init: _ => serial0OUTBuffer = '',
		serial0:(v) => {
		    
		    let str = String.fromCharCode(v);
		    // str = (str || "").replace(/\r/g,'');
		    serial0OUTBuffer += str;

		    var br = serial0OUTBuffer.indexOf("\n");
		    if( br != -1 ){

			var parts = serial0OUTBuffer.split("\n");
			while( parts.length>1 )
			    self.core.history.push(
				parts.shift().replace(/\r/g, '')
			    );

			this.refreshHistory();

			serial0OUTBuffer = parts[0];

		    }
		}
	    }
	});
	
    }

    refreshHistory(){
		
	while( core.history.length > this.history.length )
	    this.history.push(
		this.DOM.create(
		    "li",
		    this.DOM.history,
		    {
			onclick: evt => {
			    let m = evt.target.dataset.text.match( /^#([0-9a-f]{4,})\s?.*$/ );
			    if( m ){
				this.DOM.element.setAttribute("data-tab", "da");
				this.DOM.daAddress.value = m[1];
				this.refreshDa();
			    }
			}
		    }
		)
	    );
	
	while( this.history.length > core.history.length )
	    this.DOM.history.removeChild( this.history.shift() );
	
	this.history.forEach( (li, idx) => {
	    if( li.dataset.text != core.history[idx] )
		li.setAttribute("data-text", core.history[idx]);	    
	});

	this.DOM.history.scrollTop = this.DOM.history.scrollHeight - this.DOM.history.clientHeight;
	
    }
    
};

export default Debugger;
