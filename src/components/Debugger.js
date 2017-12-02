import { IController, Model, IView } from '../lib/mvc.js';

import DOM from '../lib/dry-dom.js';


const compiler = "https://projectabe.herokuapp.com/";

class Debugger {

    static "@inject" = {
        pool:"pool",
        model: [Model, {scope:"root"}]
    }

    constructor( DOM ){

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

	this.code = null;
	this.compileId = 0;
	
    }

    setActiveView(){
	this.pool.remove(this);
    }    

    initSource(){
	
	if( !this.model.getItem("app.source") ){
	    this.model.setItem("app.source", {
		"main.ino":`

void setup() {
  // initialize digital pin RED_LED as an output.
  pinMode(10, OUTPUT);
}

// the loop function runs over and over again forever
void loop() {
  digitalWrite(10, HIGH);   // turn the LED off
  delay(1000);                       // wait for a second
  digitalWrite(10, LOW);    // turn the LED on
  delay(1000);                       // wait for a second
}


`
	    });
	}

	this.initEditor();

	this.changeSourceFile();
	
    }

    initEditor(){
	if( this.code )
	    return;
	
	this.code = ace.edit( this.DOM.ace );
	this.code.$blockScrolling = Infinity;
	this.code.setTheme("ace/theme/monokai");
	this.code.getSession().setMode("ace/mode/c_cpp");
	this.code.resize(true);
	
	this.code.on( "change", _ => this.commit );
	
	this.code.on("guttermousedown", e => {
	    let target = e.domEvent.target; 
	    if (target.className.indexOf("ace_gutter-cell") == -1) 
		return; 
	    if (!this.code.isFocused()) 
		return;
	    /*
	    if (e.clientX > 25 + target.getBoundingClientRect().left) 
		return; 
	    */

	    e.stop();
	    
	    var line = e.getDocumentPosition().row+1;
	    var file = this.DOM.currentFile.value;
	    var addr = this.rsrcmap[file+":"+line];
	    if( addr !== undefined ){
		if( core.breakpoints[addr] )
		    core.breakpoints[addr] = false;
		else
		    core.breakpoints[addr] = () => true;
		
		core.enableDebugger();
		this.changeBreakpoints();
	    }else{
		this.code.session.setBreakpoint( line-1, "invalid");
	    }
	    
	});
		
        this.code.commands.addCommand({
            name: "replace",
            bindKey: {win: "Ctrl-Enter", mac: "Command-Option-Enter"},
            exec: () => this.compile()
        });	    

    }

    changeBreakpoints(){
	this.code.ignoreBreakpointChanges = true;
	this.code.session.clearBreakpoints();
	let paused = null;
	for( let addr in core.breakpoints ){
	    
	    if( addr in this.srcmap && core.breakpoints[addr] ){
		
		let c = "unconditional";
		if( addr == this.currentPC ){
		    c += " paused";
		    paused = true;
		}
		this.code.session.setBreakpoint( this.srcmap[addr].line-1, c );
	    }
	    
	}
	
	if( !paused && this.srcmap[ this.currentPC ] ){
	    this.code.session.setBreakpoint( this.srcmap[this.currentPC].line-1, "paused" );
	}
	
	this.code.ignoreBreakpointChanges = false;
	
    }

    changeSourceFile(){
	this.code.setValue( this.model.getItem("app.source", {})[ this.DOM.currentFile.value ] || "" );
	this.changeBreakpoints();
    }

    initHints( txt ){
	let source = this.model.getItem("app.source");
	this.srcmap = [];
	this.rsrcmap = {};
	txt.replace(
		/\n([\/a-zA-Z0-9._\- ]+):([0-9]+)\n([\s\S]+?)(?=$|\n[0-9a-f]+ <[^>]+>:|\n(?:[\/a-zA-Z0-9._\-<> ]+:[0-9]+\n))/g,
	    (m, file, line, code)=>{
		 
		file = file.replace(/^\/app\/builds\/[0-9]+\//, '');
		
		file = file.replace(/^\/app\/public\/builds\/[0-9]+\/sketch\/(.*)/, (match,name) => {
		    for( let candidate in source ){
			candidate = '/' + candidate;
			if( candidate.substr(candidate.length-name.length-1) == "/" + name ){
			    return candidate.substr(1);
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
	
	txt.replace(/([\s\S]*?\n)\s+([0-9a-f]+):\t[ a-f0-9]+\t([^\n\r]+)/g, (txt, before, addr, after) => {
	    this.hints[ parseInt(addr, 16)>>1 ] = (before + after).trim();
	    return '';
	    
	});
	
    }

    commit(){
	this.model.getItem("app.source", {})[ this.DOM.currentFile.value ] = this.code.getValue();
    }

    compile(){
	this.commit();
	
	this.DOM.compile.style.display = "none";

	let src = Object.assign({}, this.model.getItem("app.source"));
	delete src["disassembly.s"];
	
	fetch( compiler + "build", {
	    method:"POST",
	    body:JSON.stringify( src )
	})
	    .then( rsp => rsp.text() )
	    .then( txt => {

		this.compileId = parseInt(txt);
		this.pollCompilerService();
		
	    })
	    .catch( err => {
		
		core.history.push( err.toString() );
		this.DOM.element.setAttribute("data-tab", "history");
		this.refreshHistory();
		this.DOM.compile.style.display = "initial";
		
	    });
    }

    pollCompilerService(){
	
	fetch( compiler + "poll?id=" + this.compileId )
	    .then( rsp => rsp.text() )
	    .then( txt => {
		
		if( txt == "DESTROYED" ){
		    
		    this.compileId = null;
		    this.compile();
		    return;
		    
		}else if( txt[0] == "{" ){
		    
		    let data = JSON.parse( txt );
		    this.model.removeItem("app.AT32u4");
		    this.model.setItem("app.AT32u4.url", compiler + data.path );
		    this.initHints( data.disassembly );
		    core.history.push( data.stdout );
		    this.pool.call("loadFlash");
		    this.DOM.compile.style.display = "initial";
		    
		    let currentFile = this.DOM.currentFile.value;
		    this.model.setItem(["app","source", "disassembly.s"], data.disassembly);
		    this.DOM.currentFile.value = currentFile;
		    
		}else if( /^ERROR[\s\S]*/.test(txt) ){

		    txt.split("\n").forEach( p => core.history.push(p) );

		    this.DOM.element.setAttribute("data-tab", "history");
		    this.refreshHistory();
		    this.DOM.compile.style.display = "initial";
		    
		}else
		    setTimeout( _ => this.pollCompilerService(), 3000 );
		
	    })
	    .catch( err => {
		
		core.history.push( err.toString() );
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
	
	while( this.RAM.length < src.length )
	    this.RAM.push( this.DOM.create( "li", this.DOM.RAM, {
		title:"0x" + this.RAM.length.toString(16).padStart(4,"0")
	    }) );

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
	if( this.ramComments[ this.ttAddr ] ) color[2] = 255;
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

    setTTComment(){
	this.ramComments[ this.ttAddr ] = this.DOM.comment.value.trim();
	this.RAM[ this.ttAddr || 0 ].title = "0x" + this.ttAddr.toString(16).padStart(4, "0") + " " + this.ramComments[ this.ttAddr ];
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
	if( srcref && !srcref.offset && this.model.getItem(["app", "source", srcref.file]) ){
	    this.DOM.element.setAttribute("data-tab", "source");
	    this.DOM.currentFile.value = srcref.file;
	    this.changeSourceFile();
	    this.code.scrollToLine( srcref.line, true, true, _=>{} );
	    this.code.gotoLine( srcref.line, 0, true );
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

    refreshHistory(){
	
	if( this.DOM.autoRefreshHistory.checked )
	    setTimeout( _ => this.refreshHistory(), 1000 );
	
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
