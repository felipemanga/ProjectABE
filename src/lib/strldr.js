
function store( obj, asBuffer ){

    if( typeof obj == "function" ) obj = undefined;
    if( !obj || typeof obj != "object" )
        return obj;

    var inst = [], strIndex = {"Object":-2,"Array":-3}, arrIndex = {}, objIndex = [];

    add( obj );

    if( asBuffer )
        return toBuffer( inst );
    
    return inst;

    function add( obj ){
        var type = typeof obj;
        if( type == "function" ){
            obj = undefined;
            type = typeof obj;
        }

        var index;
        if( obj === undefined ){
            index = -4;
        }else if( type == "string" ){
            index = strIndex[obj];
            if( index === undefined )
                index = -1;
        }
        else index = inst.indexOf(obj);

        if( index != -1 ) return index;

        if( type == "object" ){
            index = objIndex.indexOf(obj);
            if( index != -1 ) return index;
        }

        index = inst.length;
        inst[index] = obj;

        if( type == "string" )
            strIndex[obj] = index;

        if( !obj || type != "object" )
            return index;
        
        objIndex[ index ] = obj;

        var ctorIndex = add( obj.constructor.fullName || obj.constructor.name );

        if( obj.buffer && obj.buffer instanceof ArrayBuffer ){

            if( !asBuffer )
                obj = Array.from( obj );

            inst[index] = [ctorIndex, -3, obj];
            return index;
           
        }
        
        var key, keySet = [];
        for( key in obj ){
            if( Object.prototype.hasOwnProperty.call(obj, key) ){
                var keyIndex = strIndex[key];
                if( keyIndex === undefined ){
                    keyIndex = inst.length;
                    inst[keyIndex] = key;
                    strIndex[key] = keyIndex;
                    keyIndex = -1;
                }
                keySet[keySet.length] = keyIndex;
            }
        }

        var strKeySet = JSON.stringify(keySet);
        keyIndex = arrIndex[ strKeySet ];
        if( keyIndex === undefined ){
            keyIndex = inst.length;
            inst[keyIndex] = keySet;
            arrIndex[strKeySet] = keyIndex;
        }

        var valueSet = [ ctorIndex, keyIndex ];

        for( key in obj ){
            if( obj.hasOwnProperty(key) ){
                var value = obj[key];
                var valueIndex = add( value );
                valueSet[valueSet.length] = valueIndex;                
            }
        }

        strKeySet = JSON.stringify(valueSet);
        keyIndex = arrIndex[ strKeySet ];
        if( keyIndex === undefined ){
            arrIndex[strKeySet] = index;
            inst[index] = valueSet;
        }else{
            inst[index] = [keyIndex];
        }

        return index;
    }

}

function load( arr, isBuffer ){

    if( isBuffer || (arr && arr.buffer) )
        arr = fromBuffer( arr );

    var SELF = null;

    if( !arr || typeof arr !== "object" )
        return arr;
    
    if( !Array.isArray(arr) )
        return undefined;

    (function(){ try{SELF=window;}catch(ex){} })();
    if( !SELF )
        (function(){ try{SELF=global;}catch(ex){} })();

    var objects = [];

    var cursor = 0;
    return read(-1);

    function read( pos ){

        switch( pos ){
        case -1:
            pos = cursor;
            break;
        case -2:
            return "Object";
        case -3:
            return "Array";
        default:
            if( objects[pos] )
                return objects[pos];

            break;
        }

        if( pos == cursor )
            cursor++;

        var value = arr[pos];
        if( !value ) return value;

        var type = typeof value;
        if( type != "object" ) return value;

        if( value.length == 1 )
            value = arr[ value[0] ];
        
        var className = read( value[0] );

        if( !className.split )
            console.log( className, value[0] );

        var ctor = SELF, obj;
        className.split(".").forEach( part => ctor = ctor[part] );

        if( value[1] !== -3 ){
            obj = new ctor();
            objects[ pos ] = obj;

            var fieldRefList, mustAdd = value[1] > pos;

            fieldRefList = arr[ value[1] ];

            var fieldList = fieldRefList.map( ref => read(ref) );

            if( mustAdd ) cursor++;


            for( var i=2; i<value.length; ++i ){
                var vi = value[i];
                if( vi !== -4 )
                    obj[ fieldList[i-2] ] = read(vi);
            }

        } else {

            obj = value[2];
            if( !isBuffer ) objects[ pos ] = obj = ctor.from( obj );
            else objects[ pos ] = obj = new ctor( obj );

            cursor++;

        }



        return obj;
    }

}

function toBuffer( src ){
    const out = [];

    const dab = new Float64Array(1);
    const bab = new Uint8Array(dab.buffer);
    const sab = new Int32Array(dab.buffer);
    const fab = new Float32Array(dab.buffer);

    var p=0;

    for( var i=0, l=src.length; i<l; ++i ){
        var value = src[i],
            type = typeof value;

        switch( type ){
        case "boolean": // 1, 2
            out[p++] = 1+(value|0);
            break;

        case "number":
            var isFloat = Math.floor( value ) !== value;
            if( isFloat ){

                fab[0] = value;

                if( fab[0] === value || isNaN(value) ){
                    out[p++] = 3;
                    out[p++] = bab[0]; out[p++] = bab[1];
                    out[p++] = bab[2]; out[p++] = bab[3];
                }else{
                    dab[0] = value;
                    out[p++] = 4;
                    out[p++] = bab[0]; out[p++] = bab[1];
                    out[p++] = bab[2]; out[p++] = bab[3];
                    out[p++] = bab[4]; out[p++] = bab[5];
                    out[p++] = bab[6]; out[p++] = bab[7];
                }

            }else{
                saveInt( 0, value );
            }
            break;
        
        case "string":
            var start = p, restart = false;
            saveInt( 1, value.length );
            for( var bi=0, bl=value.length; bi<bl; ++bi ){
                var byte = value.charCodeAt(bi);
                if( byte > 0xFF ){
                    restart = true;
                    break;
                }
                out[p++] = byte;
            }

            if( !restart )
                break;
            
            p = start;
            saveInt( 2, value.length );

            for( var bi=0, bl=value.length; bi<bl; ++bi ){
                var byte = value.charCodeAt(bi);
                out[p++] = byte & 0xFF;
                out[p++] = (byte>>8) & 0xFF;
            }

            break;
        
        case "object":
            if( typeof value[2] == "object" ){
                var typed = new Uint8Array( value[2].buffer );

                saveInt( 3, -typed.length );
                saveInt( 0, value[0] );

                for( var bi=0, bl=typed.length; bi<bl; ++bi ){
                    out[p++] = typed[bi];
                }

            }else{
                saveInt( 3, value.length );
                for( var bi=0, bl=value.length; bi<bl; ++bi ){
                    saveInt( 0, value[bi] );
                }
            }


            break;
        }

    }

    return Uint8Array.from(out);

    function saveInt( type, value ){

        var bitCount = Math.ceil( Math.log2( Math.abs(value) ) );
        var byte = type << 6;

        if( bitCount < 3 || value === -8 ){
            byte |= 0x30;
            byte |= value & 0xF;
            out[p++] = byte;
            return;
        }

        if( bitCount <= 8+3 || value === -2048 ){
            byte |= 0x10;
            byte |= (value >>> 8) & 0xF;
            out[p++] = byte;
            out[p++] = value & 0xFF;
            return;
        }

        if( bitCount <= 16+3 || value === -524288 ){
            byte |= 0x20;
            byte |= (value >>> 16) & 0xF;
            out[p++] = byte;
            out[p++] = (value>>>8) & 0xFF;
            out[p++] = value & 0xFF;
            return;
        }

        sab[0] = value;
        out[p++] = byte;
        out[p++] = bab[0]; out[p++] = bab[1];
        out[p++] = bab[2]; out[p++] = bab[3];
        return;
    }
}


function fromBuffer( src ){
    const out = [];
    const dab = new Float64Array(1);
    const bab = new Uint8Array(dab.buffer);
    const sab = new Int32Array(dab.buffer);
    const fab = new Float32Array(dab.buffer);

    var pos = 0;

    for( var l=src.length; pos<l; )
        out[out.length] = read();

    return out;

    function read(){
        var tmp;
        var byte = src[pos++];
        switch( byte ){
        case 0: break;
        case 1: return false;
        case 2: return true;
        case 3: return decodeFloat32();
        case 4: return decodeFloat64();
        }
    
        var hb = byte >>> 4;
        var lb = byte & 0xF;
        switch( hb & 3 ){
        case 0: // 32 bit int
            tmp = decodeInt32();
            break;
        case 1: // 12 bit int
            tmp = src[pos++] | ((lb<<28)>>20);
            break;
        case 2: // 19 bit int
            tmp = ((lb<<28)>>12) | src[pos] | (src[pos+1]<<8);
            pos += 2;
            break;
        case 3: // 4-bit int
            tmp = (lb<<28)>>28; 
        }

        switch( hb>>2 ){
        case 0: return tmp;
        case 1: return decodeStr8( tmp );
        case 2: return decodeStr16( tmp );
        case 3: return decodeArray( tmp );
        }

    }

    function decodeStr8( size ){
        var acc = "";
        for( var i=0; i<size; ++i )
            acc += String.fromCharCode( src[pos++] )
        return acc;
    }

    function decodeStr16( size ){
        var acc = "";
        for( var i=0; i<size; ++i ){
            var h = src[pos++];
            acc += String.fromCharCode( (h<<8) | src[pos++] )
        }
        return acc;
    }

    function decodeArray( size ){

        var ret = [];
        if( size < 0 ){

            ret[0] = read(); // type
            ret[1] = -3;

            size = -size;

            var bytes = new Uint8Array(size);
            
            for( var i=0; i<size; ++i )
                bytes[i] = src[pos++]

            ret[2] = bytes.buffer;

        }else{

            for( var i=0; i<size; ++i )
                ret[i] = read();

        }

        return ret;

    }

    function decodeInt32(){
        bab[0] = src[pos++]; bab[1] = src[pos++];
        bab[2] = src[pos++]; bab[3] = src[pos++];
        return sab[0];
    }

    function decodeFloat32(){
        bab[0] = src[pos++]; bab[1] = src[pos++];
        bab[2] = src[pos++]; bab[3] = src[pos++];
        return fab[0];
    }

    function decodeFloat64(){
        bab[0] = src[pos++]; bab[1] = src[pos++];
        bab[2] = src[pos++]; bab[3] = src[pos++];
        bab[4] = src[pos++]; bab[5] = src[pos++];
        bab[6] = src[pos++]; bab[7] = src[pos++];
        return dab[0];
    }
}


module.exports = { store, load };
