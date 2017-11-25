class BTN {
    static "@inject" = {
        pool:"pool"
    }

    constructor( DOM ){

	DOM.element.controller = this;
	DOM.element.dispatchEvent( new Event("addperiferal", {bubbles:true}) );
	this.on.connect = DOM.element.getAttribute("pin-on");
	this.active = DOM.element.getAttribute("active") != "low";
	
	DOM.element.addEventListener( "mousedown",  _ => this.on.value =  this.active );
	DOM.element.addEventListener( "mouseup",    _ => this.on.value = !this.active );
	DOM.element.addEventListener( "touchstart", _ => this.on.value =  this.active );
	DOM.element.addEventListener( "touchend",   _ => this.on.value = !this.active );

	(DOM.element.getAttribute("bind-key") || "").split(/\s*,\s*/).forEach( k => {
	    this["onPress" + k] = _ => this.on.value = this.active;
	    this["onRelease" + k] = _ => this.on.value = !this.active;
	});

	this.pool.add(this);
	
    }

    setActiveView(){
	this.pool.remove(this);
    }

    on = {
	connect: null,
	init:function(){
	    this.on.value = !this.active;
	}
    }
    
}

module.exports = BTN;
