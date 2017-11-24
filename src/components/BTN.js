class BTN {

    constructor( DOM ){
	
	DOM.element.controller = this;
	DOM.element.dispatchEvent( new Event("addperiferal", {bubbles:true}) );
	this.on.connect = DOM.element.getAttribute("pin-on");
	this.active = DOM.element.getAttribute("active") != "low";
	
	DOM.element.addEventListener( "mousedown", _ => this.on.value = this.active );
	DOM.element.addEventListener( "mouseup", _ => this.on.value = !this.active );
	DOM.element.addEventListener( "touchstart", _ => this.on.value = this.active );
	DOM.element.addEventListener( "touchend", _ => this.on.value = !this.active );

    }

    on = {
	connect: null,
	init:function(){
	    this.on.value = !this.active;
	}
    }
    
}

module.exports = BTN;
