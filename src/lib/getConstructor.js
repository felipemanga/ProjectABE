

// Transpile ES6-classes into less-strict ES5 ones, without breaking instanceof.
function getConstructor( clazz ){

    let str = clazz.toString();
    if( str.substr(0, 5) != "class" )
        return clazz;

    let char = str.charAt.bind(str);
    let byte = str.charCodeAt.bind(str);
    let max = str.length - 1;

    let pos = findNext("{", 0) + 1;
    let name, args, body, ctor;
    for( ; pos<=max; ++pos ){
        WS();
        readName();
        WS();
        readArgs();
        WS();
        readBody();

        if( name == "constructor" ){
            let __base__ =
                clazz.prototype &&
                clazz.prototype.__proto__ &&
                clazz.prototype.__proto__.constructor &&
                getConstructor(clazz.prototype.__proto__.constructor);

            let memo = new Function( "__base__", "return function " + clazz.name + args + body );

            ctor = memo(__base__);
            break;
        }
    }

    // class has no constructor. Make one up.
    if( !ctor )
        ctor = (new Function("return function " + clazz.name + "(){}"))();

    ctor.prototype = Object.create( clazz.prototype );
    ctor.prototype.constructor = clazz;

    return ctor;

    function readBody(){
        let SUPER="super";
        let nextSuper = 0;

        let identifiers = [];
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_".split("").forEach(l => identifiers[l.charCodeAt()] = 1);

        body = "";
        let b = "";
        let depth = 0;
        while( pos < max ){
            b = char(pos);
            body += b;

            if( nextSuper >= 0 && b == SUPER[nextSuper] ){
                nextSuper++;
                if( nextSuper == SUPER.length ){
                    let nextB = byte(pos+1);
                    if( identifiers[nextB] ) nextSuper = -1;
                    else{
                        body = body.substr(0, body.length - SUPER.length);
                        body += "__base__.bind(this).call";
                        nextSuper = -1;
                    }
                }
                pos++;
                continue;
            }

            var bc = b.charCodeAt(0);
            nextSuper = identifiers[bc] ? -1 : 0;

            if( b == "{" ) depth++;
            else if( b == "}" ){
                depth--;
                if( !depth ){
                    pos++;
                    return;
                }
            }
            else if( b == "/" ){
                let cp = pos;
                let nextB = char(pos+1);
                if( nextB == "*" || nextB == "/" ){
                    WS();
                    body += str.substr( cp+1, pos-cp-1 );
                    continue;
                }else{
                    let end = findNext('/', pos+1);
                    body += str.substr( pos+1, end-pos );
                    pos = end;
                }
            }
            if( b == "'" || b == '"' || b == '`'){
                let end = findNext(b, pos+1);
                body += str.substr( pos+1, end-pos );
                pos = end;
            }
            pos++;
        }
    }

    function readArgs(){
        args = "";
        let b = "";
        let depth = 0;
        while( pos < max ){
            b = char(pos);
            args += b;
            if( b == "(" ) depth++;
            if( b == ")" ){
                depth--;
                if( !depth ){
                    pos++;
                    return;
                }
            }
            if( b == "/" ){
                let cp = pos;
                let nextB = char(pos+1);
                if( nextB == "*" || nextB == "/" ){
                    WS();
                    args += str.substr( cp+1, pos-cp-1 );
                    continue;
                }else{
                    let end = findNext('/', pos+1);
                    args += str.substr( pos+1, end-pos );
                    pos = end;
                }
            }
            if( b == "'" || b == '"' || b == '`'){
                let m = b;
                let end = findNext(b, pos+1);
                args += str.substr( pos+1, end-pos );
                pos = end;
            }
            pos++;
        }

    }
    
    function readName(){
        var b;
        name = "";
        while( pos < max ){
            b = byte(pos);
            if( b <= 40 && b != 36 )
                break;
            name += String.fromCharCode(b);
            pos++;
        }
    }
    
    function WS(){
        while( pos <= max ){
            while( pos <= max && byte(pos) <= 32 )
                pos++;
            if( byte(pos) == 47 ){
                if( char(pos+1) == "*" ){
                    pos += 2;
                    let prev = char(pos++);
                    while( pos <= max ){
                        let b = char(pos);
                        if( prev == "*" && b == "/" ) 
                            break;
                        prev = b;
                        pos++;
                    }
                    if( pos != max )
                        pos++;
                }else if( char(pos+1) == "/" ){
                    while( pos <= max && byte(pos++) > 13 );
                }else return;
            }else return;
        }
    }

    function findNext( search, pos ){
        while( pos <= max ){
            let ch = char(pos);
            if( ch == '\\' ){
                pos++;
            }else if( ch == search )
                return pos;
            pos++;
        }
        return pos;
    }
    
}


module.exports = getConstructor;