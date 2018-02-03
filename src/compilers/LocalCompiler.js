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

class LocalCompiler {
    
    function build( data ){
	
	let ino =
	    Object
	    .keys( data )
	    .filter( name => /\.ino$/i.test(name) )
	    .reduce( (name, acc) => acc + data[name], '' );

	console.log( ino );

	return new Promise( (ok, nok) => {
	    setTimeout( _ => nok('boom'), 100 );
	});
	
    }
    
};

module.exports = LocalCompiler;
