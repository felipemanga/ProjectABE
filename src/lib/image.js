import DOM from './dry-dom.js';


/* Almost direct port of TEAMarg's Cabi */
// compression / decompression session state
let cs = {
    byte:0,
    bit:0,
    dest:"",
    src:null,
    src_pos:0,
    out_pos:0,
    w:0,
    h:0
};

// ----------------------------------------------------------------------------
// :: Compress
// ----------------------------------------------------------------------------

/*
	getcol
	
	pos is the index of the pixel:  0 .. w*h-1
*/
function getcol( pos ){
    
    let x, y;
    
    // display order

    // if (cs.src[pos/8] & (1 << (pos&7))) return 1;
    let bit = pos % 8;
    x = (pos / 8 | 0) % cs.w;
    y = ((pos / 8 | 0) / cs.w | 0) * 8 + bit;
    if( cs.src( y*cs.w+x ) ) return 1;
    return 0;
    
}

function find_rlen( pos, plen ) 
{
    var col;
    var pos0;
    
    col = getcol(pos);
    pos0 = pos;

    while(getcol(pos) == col && pos < plen)
	pos ++;
    
    return pos-pos0;
}

// write a bit to the stream. non-zero val means 1, otherwise 0.
function putbit( val ){
    
    if (val) cs.byte |= cs.bit;
    cs.bit <<= 1;
    if (cs.bit == 0x100)
    {
	//output byte
	if (cs.out_pos != 0) cs.dest += ",";
	if (cs.out_pos % 16 == 0) cs.dest += "\n";
	cs.dest += "0x" + cs.byte.toString(16).padStart(2, "0");
	
	cs.out_pos ++;
	cs.bit = 0x1;
	cs.byte = 0;
	
    }
    
}

// write an n-bit (bits) number (val) to the output steam
function putval( val, bits ){
    
    var i;
    
    if (bits <= 0) return;
    for (i = 0; i < bits; i++)
	putbit(val & (1 << i));
    
}

// write a span length
// a string of bits encoding the number of bits needed to encode the length,
// and then the length.
function putsplen( len ){
    
	var blen = 1; // how bits needed to encode length
	while ((1 << blen) <= len)
		blen += 2;
	// write number of bits (1-terminated string of zeroes)
	putval(0,(blen-1)/2);
	putval(1,1);          // terminator
	// write length
	putval(len, blen);
}

/*
	comp
	
	compress plen 1-bit pixels from src to dest
	
*/
function compress_rle( src, w, h, prefix, suffix ){
    let pos,
	rlen,
	len;
    
    cs.dest = `const uint8_t PROGMEM ${prefix}${suffix}[] = {`;
    cs.src = src;
    cs.bit = 1;
    cs.byte = 0;
    cs.w = w;
    cs.h = h;
    cs.out_pos = 0;
	
    // header
    putval(w-1, 8);
    putval(h-1, 8);
    putval(getcol(0), 1); // first colour
	
    pos = 0;
	
    // span data
	
    while (pos < w*h)
    {
	rlen = find_rlen(pos, w*h);
	pos += rlen;
	putsplen(rlen-1);
    }
	
    // pad with zeros and flush
    while (cs.bit != 0x1)
	putbit(0);

    cs.dest += `\n}; // ${cs.out_pos}b vs ${w*h/8}b uncompressed\n`;
	
    return cs.out_pos; // bytes
}

// end port of Cabi

function cabi( data, cleanName, out ){
    let src = data.data;

    let white = i => src[ i*4+3 ] > 128 ? (src[i*4]+src[i*4+1]+src[i*4+2])/3 > 127 : 0;
    compress_rle( white, data.width, Math.ceil(data.height/8)*8, cleanName, "_comp_w" );
    out[cleanName + "_comp_w[]"] = cs.dest;

    let black = i => src[ i*4+3 ] > 128 ? (src[i*4]+src[i*4+1]+src[i*4+2])/3 < 127 : 0;
    compress_rle( black, data.width, Math.ceil(data.height/8)*8, cleanName, "_comp_b" );
    out[cleanName + "_comp_b[]"] = cs.dest;

    let alpha = i => src[ i*4+3 ] > 128 ? 1 : 0;
    compress_rle( alpha, data.width, Math.ceil(data.height/8)*8, cleanName, "_comp_a" );
    out[cleanName + "_comp_a[]"] = cs.dest;
}

function loadImage( img, cleanName, isPNG ){
    
    let width = img.naturalWidth;

    let canvas = DOM.create("canvas", {
	width,
	height: img.naturalHeight
    });

    let ctx = canvas.getContext("2d");
    ctx.drawImage( img, 0, 0 );

    let data = ctx.getImageData( 0, 0, canvas.width, canvas.height );

    let ret = {};

    cabi( data, cleanName, ret );

    let masksrc = "\nconst unsigned char PROGMEM " + cleanName + "_mask[] = ";

    let spmasksrc = "\nconst unsigned char PROGMEM " + cleanName + "_plus_mask[] = ";

    let src = '', ascii = "/*";
    
    src += "\n\nconst unsigned char PROGMEM " + cleanName + "[] = ";
    
    src += "{\n// width, height,\n" + width + ", " + img.naturalHeight;
    spmasksrc += "{\n// width, height,\n" + width + ", " + img.naturalHeight;
    masksrc += "{";
    
    let pageCount = Math.ceil( img.naturalHeight / 8 );
    let currentByte = 0;

    for( let y=0; y<data.height; ++y ){
	ascii += "\n";
	for( let x=0; x<data.width; ++x ){
	    
	    let i = (y*data.width + x) * 4;
	    let lum = (data.data[i  ] + data.data[i+1] + data.data[i+2]) / 3;
	    if( data.data[ i+3 ] > 128 ){
		if( lum > 128 )
		    ascii += "#";
		else
		    ascii += " ";
	    }else
		ascii += "-";
	    
	}

    }
    
    // Read the sprite page-by-page
    for( let page = 0; page < pageCount; page++ ) {

	// Read the page column-by-column
	for( let column = 0; column < width; column++ ) {

	    // Read the column into a byte
	    let spriteByte = 0, maskByte = 0;
	    for( let yPixel = 0; yPixel < 8; yPixel++) {

		let i = ((page*8 + yPixel) * data.width + column) * 4;
		let lum = (data.data[i  ] + data.data[i+1] + data.data[i+2]) / 3;

		if( lum > 128 )
		    spriteByte |= (1 << yPixel);
		if( data.data[ i+3 ] > 128 )
		    maskByte |= (1 << yPixel);
	    }

	    src += ",";
	    spmasksrc += ",";

	    if( currentByte != 0 )
		masksrc += ",";
	    
	    if( currentByte%width == 0 ){
		src += "\n"; masksrc += "\n";
		spmasksrc += "\n";
	    }

	    let byte = "0x" + spriteByte.toString(16).padStart(2, "0");
	    src += byte;
	    spmasksrc += byte;
	    	    
	    if( isPNG ){
		byte = "0x" + maskByte.toString(16).padStart(2, "0");
		masksrc += byte;
		spmasksrc += ", " + byte;
	    }

	    currentByte++;
	}
    }
    src += "\n};\n\n"; masksrc += "\n};\n\n";
    spmasksrc += "\n};\n\n";
    ascii += "\n*/\n\n";

    src += masksrc + "\n";    
    src += spmasksrc + "\n";    
	
    let headers = [
	cleanName + "[]",
	cleanName + "_mask[]",
	cleanName + "_plus_mask[]"
    ]
    for( var k in ret ){
	src += ret[k];
	headers.push(k);
    }
    
    return {
	cpp: ascii + src,
	h: "extern const unsigned char PROGMEM " + headers.join(', ') + ";\n"
    };
}

module.exports = loadImage;
