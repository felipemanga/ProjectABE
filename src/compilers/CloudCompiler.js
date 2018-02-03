const compiler = "https://projectabe.herokuapp.com/";

class CloudCompiler {
    
    build( src ){
	let ok, nok;
	let p = new Promise( (_ok, _nok) => {
	    ok = _ok;
	    nok = _nok;
	});
	
	fetch( compiler + "build", {
	    method:"POST",
	    body:JSON.stringify( src )
	})
	    .then( rsp => rsp.text() )
	    .then( txt => {

		this.compileId = parseInt(txt);
		this.pollCompilerService( src, ok, nok );
		
	    })
	    .catch( err => {
		nok( err );		
	    });
	
	return p;
    }

    pollCompilerService( src, ok, nok ){
	
	fetch( compiler + "poll?id=" + this.compileId )
	    .then( rsp => rsp.text() )
	    .then( txt => {
		
		if( txt == "DESTROYED" ){
		    
		    this.compileId = null;
		    this.build( src );
		    return;
		    
		}else if( txt[0] == "{" ){
		    
		    let data = JSON.parse( txt );

		    if( data.path ){
			
			fetch( compiler + data.path )
			    .then( rsp => rsp.text() )
			    .then( text => {
				data.hex = text;
				data.path = compiler + data.path;
				ok( data );
				
			    });

		    }else ok( data );
		    
		}else if( /^ERROR[\s\S]*/.test(txt) ){
		    nok( txt );		    
		}else
		    setTimeout( _ => this.pollCompilerService( src, ok, nok ), 3000 );
		
	    })
	    .catch( err => {
		nok( err );
	    });
    }
    
}

module.exports = CloudCompiler;
