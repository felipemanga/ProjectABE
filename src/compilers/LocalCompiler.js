/*


To convert the Sketch into a valid C++ file, a number of actions are needed:

If the Sketch is composed by many .ino files, those files are concatenated together into a single .ino.cpp file
An #inlcude <Arduino.h> is added at the beginning of the Sketch if not already present
All needed libraries are detected and include paths are discovered
All #include directives are replaced with the actual content of the files included (this is made with a run of gcc or another command line compatible compiler with the -E flag)
and finally:

The resulting file is preprocessed to automatically add missing function prototypes (forward declarations)
The arduino-preprocessor tool takes care to handle this last step.

*/

const PATH = window.require('path');

function normalize( path ){
    /* * /
    return path.replace(/\\/, '/')
	.replace( /\/\.?\/|\/[^\/]\/\.\.\//g, '/' )
	.replace(/\/+/g, '/');
    /*/
    return PATH.normalize( path );
    /* */
}

class LocalCompiler {

    
    
    build( srcdata ){

	let data = {};
	for( let k in srcdata )
	    data[ normalize(k) ] = srcdata[k];
	
	let ino =
	    '#include <Arduino.h>\n' +
	    Object
	    .keys( data )
	    .filter( name => /\.ino$/i.test(name) )
	    .reduce( (acc, name) => acc + data[name], '' );

	let libs = this.getLibList(ino, data);

	console.log( ino, libs );

	return new Promise( (ok, nok) => {
	    setTimeout( _ => nok('boom'), 100 );
	});
	
    }

    getLibList( ino, files ){
	let libs = {};
	let state = 0;
	
	for( let i=0, l=ino.length; i<l; ++i ){
	    let ch = ino[i];
	    switch( state ){
	    case 0:
		switch( ch ){
		case '"': state = 1; break;
		case '/': state = 2; break;
		case '#': state = 3; break;
		}
		break;
	    case 1:
		switch( ch ){
		case '"': state = 0; break;
		case '\\': ++i; break;
		}
		break;
	    case 2:
		switch( ch ){
		case '*': state = 4; break;
		case '/': state = 6; break;
		default: state = 0; break;
		}
		break;
	    case 3:
		{
		    let exp = /include\s*(["<])([^">]+)[">]/yi;
		    exp.lastIndex = i;
		    let match = exp.exec( ino );
		    if( match ){
			i += match[0].length;
			let path = normalize(match[2]);
			if( match[1] == "<" || !(path in files) )
			    libs[path] = "";
		    }
		    state = 0;
		    break;
		}
	    case 4:
		if( ch == '*' ) state = 5;
		break;
	    case 5:
		if( ch == '/' ) state = 0;
		else if( ch != '*' ) state = 4;
		break;
	    case 6:
		if( ch == '\n' ) state = 0;
		break;
	    }
	}

	return libs;

    }
    
};

module.exports = LocalCompiler;
