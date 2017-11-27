class Debugger {
    
    constructor( DOM ){
	
	this.DOM = DOM;
	this.history = [];
	this.da = [];
	this.state = [];
	
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
	
	let src = core.da( addr, 30 ).replace(/\t/g, "    ").replace(/ /g, "&nbsp;").split("\n");
	
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
				this.DOM.debuggerContainer.setAttribute("data-tab", "da");
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
