const Hex = {

    parseURL( url, buffer, cb ){

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if(  xhr.readyState === 4 ){
                try{
                    Hex.parse( xhr.responseText, buffer );
                }catch(ex){
                    cb(false);
                    return;
                }
                cb( true );
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
        
    },

    parse( src, buffer ){

        let state = 0, size = 0, num, byte, offset, sum = 0;

        for( let i=0, l=src.length; i<l; ){

            byte = src.charCodeAt(i++);

            if( byte === 58 ){
                state = 0;
                continue;
            }

            if( byte >= 65 && byte <= 70 ){
                num = (byte - 55) << 4;
            }else if( byte >= 48 && byte <= 57 ){
                num = (byte - 48) << 4;
            }else continue;

            while( i<l ){
                byte = src.charCodeAt(i++);
                if( byte >= 65 && byte <= 70 ){
                    num += byte - 55;
                    break;
                }else if( byte >= 48 && byte <= 57 ){
                    num += byte - 48;
                    break;
                }else continue;
            }

            switch( state ){
            case 0:
                size = num;
                state++;
                sum = num;
                break;
            
            case 1:
                offset = num << 8;
                state++;
                sum += num;
                break;
            
            case 2:
                offset += num;
                state++;
                sum += num;
                break;

            case 3:
                if( num === 1 ) return;
		if( num === 3 || num === 5 ){
		    state++;
		}else if( num !== 0 ) throw 'Unsupported record type: ' + num;
                state++;
                sum += num;
                break;
            
            case 4:
                buffer[offset++] = num;
	    case 5:
                sum += num;
                if( !--size ) state = 6;
                break;
            
            case 6:
                sum += num;
                sum = (-sum) & 0xFF;
                if( !sum ) state++;
                else throw ( 'Checksum mismatch: ' + sum );
                break;

            case 7:
            default:
                throw 'Illegal state ' + state;
            }

        }

    }

}


module.exports = Hex;
