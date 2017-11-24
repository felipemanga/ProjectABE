let fs = null;

function mkdirp( base, path, callback) {
    let acc = base || "";
    let paths = path.split(/[\/\\]+/);
    paths.pop(); // remove last file/empty entry
    work();
    return;

    function work(){
        if( !paths.length )
            return callback(true);
        let current = paths.shift();
        fs.mkdir( acc + current, (err) => {
            if( err && err.code != 'EEXIST' ){
                callback(false);
            }else{
                acc += current + '/';
                work();
            }
        });
    }
}

let onload = [], wasInit = false;
let lock = {};

class IStore {

    set onload( cb ){
        if( wasInit )
            cb();
        else
            onload.push(cb);
    }

    set fs( _fs ){

        if( fs ) return;

        fs = _fs;

        mkdirp( this.root, "store/", () => {

            this.root += "store/";

            wasInit = true;

            for( var i=0, cb; cb=onload[i]; ++i )
                cb();

        } );

    }

    getTextItem( k, cb ){

        if( lock[k] ) cb(lock[k] );
        else fs.readFile( this.root + k, "utf-8", (err, data) => cb(data) );

    }

    getItemBuffer( k, cb ){

            if( lock[k] ) cb(lock[k] );
            else{
                console.log("Reading ", k);
                fs.readFile( this.root + k, (err, data) => {
                    console.log("Read ", k, err);
                    cb(data);
                });

            }

    }

    setItem( k, v, cb ){

        mkdirp( this.root, k, (success)=>{

            if( !success ){
                cb(false);
            }else if( lock[k] ){
                setTimeout( this.setItem.bind(this, k, v, cb), 200 );
            }else{
                lock[k] = v;
                fs.writeFile( this.root + k, v, (err) => {

                    delete lock[k];
                    if( cb )
                        cb(!err);
                });

            }

        });

    }

}

module.exports = IStore;
