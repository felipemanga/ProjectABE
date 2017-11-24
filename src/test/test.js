const queue = [];
var namePrefix = "";
var isBrowser = false;

try{
    (function(){
        isBrowser = !!window;
    })();
}catch(ex){ 
    isBrowser = false;
}

setTimeout(next, 10, true);

function test( async, name, cb ){
    if( arguments.length == 2 ){
        if( typeof name == "object" ){
            for( var k in arguments[1] ){
                test( k, arguments[1][k] );
            }
            return;
        }
        if( typeof name == "string" ){
            namePrefix = name + " :: ";
            return;
        }
        cb = arguments[1];
        name = cb.name;
    }
    
    name = namePrefix + name;

    queue[ queue.length ] = { 
        cb, 
        name, 
        async, 
        complete:0, 
        hnd:0,
        assertId:0,
        start:0
    };
}


function next( isFirst ){
    if( isFirst )
        console.log("\n - - - - - - - STARTING TEST RUN - - - - - - - - ");
    
    if( queue.length == 0 )
        return;

    var t = queue.shift();

    t.start = new Date().getMilliseconds();

    var testInstance = { assert:assert.bind(null, t) };

    if( t.async ){
        testInstance = Object.assign( onComplete.bind( null, t ), testInstance );
        t.hnd = setTimeout( onComplete.bind(null, t, "Timeout"), 2000 );
    }

    try{
        t.cb.call( testInstance, testInstance );
    }catch( ex ){
        onComplete( t, ex );
        return;
    }

    if( !t.async )
        onComplete( t );
}

function onComplete( t, err ){
    t.complete++;
    if( t.hnd ){
        clearTimeout( t.hnd );
        t.hnd = 0;
    }

    if( err !== undefined ){
        if( err && typeof err == "object" ){
            if( err.message ) err = err.message;
            else if( err.getMessage ) err = err.getMessage();
            else err = JSON.stringify(err);
        }
        if( typeof err !== "string" ) err = "" + err;
    }

    if( t.complete > 1 ){
        console.warn( "[ME" + t.complete + "] " + t.name + "\t- " + err );
        return;
    }

    if( err === undefined ){
        var msg =  "[PASS] " + t.name + " ... " + Math.round( ( new Date().getMilliseconds() - t.start ) ) + " ms" ;
        if( isBrowser ){
            var line = document.createElement("div");
            line.appendChild( document.createTextNode(msg) );
            document.body.appendChild( line );
        }else console.log( msg );
        setTimeout( next, 10 );
    }else{
        if( isBrowser ) console.log( "%c[FAIL] " + t.name + " - " + err, "background-color: red; color: white;" );
        else console.log( "\x1B[37;41m[FAIL] " + t.name + " - " + err + "\x1B[0m");
    }

}

function assert( test, check, error ){

    test.assertId++;
    if( check ) return assert.bind( null, test );

    error = error || ("Assert" + test.assertId);

    if( test.async ) 
        onComplete( test, error );

    throw error;

}

const out = test.bind( null, false );
out.async = test.bind( null, true );

export default out;
