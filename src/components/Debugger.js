import { IController, Model, IView } from '../lib/mvc.js';

const compiler = "https://projectabe.herokuapp.com/";

class Debugger {

    static "@inject" = {
        pool:"pool",
        model: [Model, {scope:"root"}]
    }

    constructor( DOM ){
	
	this.DOM = DOM;
	this.history = [];
	this.da = [];
	this.state = [];

	this.code = null;
	this.compileId = 0;
	
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

	if( !this.editor ){
	    this.code = ace.edit( this.DOM.ace );
	    this.code.$blockScrolling = Infinity;
	}

	this.changeSourceFile();
	
    }

    changeSourceFile(){
	this.code.setValue( this.model.getItem("app.source", {})[ this.DOM.currentFile.value ] || "" );
    }

    compile(){
	this.DOM.compile.style.display = "none";
	
	fetch( compiler + "build", {
	    method:"POST",
	    body:JSON.stringify( this.model.getItem("app.source") )
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
		    core.history.push( data.stdout );
		    this.pool.call("loadFlash");
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

    refreshState(){

	if( this.DOM.autoRefreshState.checked )
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
	
	let addr = parseInt( this.DOM.daAddress.value.replace(/^.*[x#]/, ""), 16 ) | 0;
	this.DOM.daAddress.value = addr.toString(16).padStart( 4, "0" );
	
	let src = core.da( addr, 50 ).replace(/\t/g, "    ").replace(/ /g, "&nbsp;").split("\n");
	
	while( this.da.length > src.length )
	    this.DOM.da.removeChild( this.da.shift() );
	
	while( this.da.length < src.length )
	    this.da.push( this.DOM.create( "li", this.DOM.da, [["code"]]) );

	this.da.forEach( (li, idx) => {
	    li.children[0].innerHTML = src[idx];
	});
	    
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
			    if( /^[0-9a-f]{4,}$/.test(evt.target.dataset.text) ){
				this.DOM.element.setAttribute("data-tab", "da");
				this.DOM.daAddress.value = evt.target.dataset.text;
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
