
function uint8( data ){

    let len = data.length;
    let out = new Uint8Array( len );

    if( typeof data == "string" ){
	for( let i=0; i<len; ++i )
	    out[i] = data.charCodeAt(i);
    }else
	out.set( data );

    return out;
}

function BYTE( ...args ){
    let out = new Uint8Array( args.length );
    out.set( args );
    return out;
}

function WORD( ...args ){
    let tmp = new Uint16Array( args.length );
    tmp.set( args );
    let out = new Uint8Array( tmp.buffer );
    return out;
}

class gif1b {
    
    constructor(){	
    }

    add( data, time ){

	if( !this.blocks ){
	    let packed = 0x80,
		bg = 0,
		ratio = 0;

	    this.blocks = [
		uint8("GIF87a"),
		WORD( data.width, data.height ),
		BYTE(
		    packed, bg, ratio,
		    0, 0, 0,
		    0xFF, 0xFF, 0xFF,
		    0x21, 0xFF, 0x0B
		),
		uint8("NETSCAPE2.0"),
		BYTE(0x03, 0x01, 0, 0, 0)
	    ];

	}
	
	time = Math.round(time|0) || 1;
	
	this.blocks.push(
	    BYTE(0x21, 0xF9, 0x04, 0x04),
	    WORD( time/10, 0 )
	);
	
	this.blocks.push( BYTE(0x2C),
			  WORD(0, 0, data.width, data.height),
			  BYTE(0, 2)
			);

	this.lzw( data.data, data.width );
	
    }

    lzw( data, width ){
	var out;
	const CC = 4, EOI = 5;
	var nc = 0, op = 0, opoff = 0, bits = 3;
	var table, string;

	let end = () => {
	    out[0] = op-1;
	    // op++;
	    this.blocks.push( out.slice(0, op) );
	}


	function init(){

	    let needsCC = !!out;

	    if( out ){
		// write(table[CC], 0);
		end();
	    }
	    
	    out = new Uint8Array(256);

	    nc = 0;
	    table = [];
	    string = table;
	    table[0] = [,,nc++];
	    table[1] = [,,nc++];
	    table[2] = [];
	    table[3] = [];
	    table[CC] = [,,CC];
	    table[EOI] = [,,EOI];
	    nc = CC+2;
	    op = 0;
	    opoff = 0;
	    out[op++] = 0;

	    write(table[CC], 0);

	}

	for( let i=0; i<data.length; i+=4 ){
	    if( !out || ((op > 128 || bits>11) && !((bits+opoff)%8)) ){
		if( string )
		    write( string, 0 );
		init();
	    }
	    
	    let ch = data[i+3] > 128 ? 1 : 0;
	    if( string[ch] )
		string = string[ch];
	    else
		write( string, ch );
	}

	write( string, 0 );
	op++;
	end();
	this.blocks.push( BYTE(0) );

	function mask( bits ){
	    return ((~0)>>>(31-(bits-1)));
	}

	function write( arr, next ){
	    if( arr == table )
		return;

	    let code = arr[2]|0;
	    // console.log( code );

	    out[op] |= code << opoff;
	    opoff += bits;
	    while( opoff >= 8 ){
		opoff -= 8;
		op++;
		out[op] = code >>> (bits - opoff);
	    }

	    if( nc == mask(bits)+1 )
		bits++;
	    
	    if( arr != table[CC] ){
		arr[next] = [,,nc++];
		string = table[ next ];
	    }else{
		string = table;
		bits = 3;
	    }

	}
	
    }

    write(){
	
	let sum = 1;
	
	for( let i=0, l=this.blocks.length; i<l; ++i )
	    sum += this.blocks[i].length;
	
	let acc = new Uint8Array(sum);
	sum = 0;
	for( let i=0, l=this.blocks.length; i<l; ++i ){
	    acc.set( this.blocks[i], sum );
	    sum += this.blocks[i].length;	    
	}

	acc[ sum ] = 0x3B; // trailer

	return acc;
    }

}

if( typeof module !== "undefined" )
    module.exports = gif1b;
