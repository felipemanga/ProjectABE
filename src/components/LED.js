class LED {
    
    constructor( DOM ){
	
	this.el = DOM.element;
	DOM.element.controller = this;
	DOM.element.dispatchEvent( new Event("addperiferal", {bubbles:true}) );
	this.on.connect = DOM.element.getAttribute("pin-on");
	this.el.style.opacity = 0;
	
    }

    on = {
	
	connect:null,
	
	onLowToHigh(){
	    this.el.style.opacity = "0";
	},
	
	onHighToLow(){
	    this.el.style.opacity = "1";
	}
	
    }
    
}

module.exports = LED;
