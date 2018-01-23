var Avrgirl = self.require('avrgirl-arduino');

var avrgirl = null;

class Flasher {
    constructor( app ){
	this.app = app;
    }

    onPressKeyU(){
	setTimeout( _ => this.doFlash(), 10 );
    }

    doFlash(){
	if( avrgirl ){
	    alert("Flasher is busy");
	    return;
	}
	let path = this.app.root.getItem("app.srcpath");
	if( !path ) return;
	let source = this.app.root.getModel( path, false );
	if( !source ) return;
	let build = source.getItem(["build.hex"]);
	if( !build || !confirm("Upload game to Arduboy?") ) return;

	let hndl = null;
	let buffer = new Buffer( build );
	
	avrgirl = new Avrgirl({
	    board: 'arduboy',
	    debug: function( d ){
		document.title = d; // console.log(d);
	    }
	});
	
	avrgirl.flash( buffer, function (error) {
	    clearTimeout( hndl );
	    if (error) 
		alert(error);
	    else
		alert('done.');
	});

	reset();

	function reset(){
	    
	    if( hndl )
		clearTimeout(hndl);
	    
	    setTimeout( _ => {
		document.title = "Flasher timed out";
		avrgirl = null;
	    }, 10000);
	    
	}
    }
};

module.exports = Flasher;
