var Avrgirl = self.require('avrgirl-arduino');

var avrgirl = null;

class Flasher {
    constructor( app ){
	this.app = app;
    }

    onPressKeyU(){
	setTimeout( _ => this.doFlash(), 10 );
    }

    doFlash( tries ){
	let ask = tries === undefined;
	if( ask ) tries = 10;
	
	if( avrgirl ){
	    alert("Flasher is busy");
	    return;
	}
	let path = this.app.root.getItem("ram.srcpath");
	if( !path ) return;
	let source = this.app.root.getModel( path, false );
	if( !source ) return;
	let build = source.getItem(["build.hex"]);
	if( !build || (ask && !confirm("Upload game to Arduboy?")) ) return;

	let hndl = null;
	let buffer = new Buffer( build );
	
	avrgirl = new Avrgirl({
	    board: 'arduboy',
	    debug: function( d ){
		document.title = d; // console.log(d);
		reset();
	    }
	});
	
	avrgirl.flash( buffer, (error) => {
	    clearTimeout( hndl ); hndl = null;
	    cleanup( error );
	    
	    if (error){
		if( tries )
		    this.doFlash( tries-- );
		else
		    alert(error);
	    }else
		document.title = "Done!";
	});

	reset();

	function reset(){
	    
	    if( hndl )
		clearTimeout(hndl);
	    
	    hndl = setTimeout( _ => {
		document.title = "Flasher timed out";
		cleanup( true );
	    }, 10000);
	    
	}

	function cleanup( error ){
	    
	    if( error ){
		try{
		    avrgirl.connection.serialPort.close();
		}catch(ex){}
	    }
	    
	    avrgirl = null;
	    
	    if( hndl )
		clearTimeout(hndl);
	    hndl = null;
	    
	}
    }
};

module.exports = Flasher;
