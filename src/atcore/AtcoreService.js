class State{
    constructor( svc, id ){
        this._svc = svc;
        this.id = id;
    }

    destroy(){
        delete this._svc.states[ this.id ];
        this._svc.msg({ id:this.id, cmd:"destroy" });
    }
}

class AtcoreService {

    constructor( path="./atcore.worker.js" ){
        this.cbmap = {};
        this.nextCBID = 0;
        this.states = {};
        this.worker = new Worker( path );
        this.worker.onmessage = this._onmsg.bind(this);
        this.queue = [];
    }

    create( url, periferals, cb ){

        this.msg({
            cmd:"create",
            periferals,
            url,
            MID:({status})=>{

                if( status ){
                    var state = new State( this, status );
                    this.states[ status ] = state;
                    cb( state );                    
                } 
                else cb();

            } 
        });
    
    }

    msg( data ){

        if( typeof data.MID == "function" ){
            this.cbmap[ ++this.nextCBID ] = data.MID;
            data.MID = this.nextCBID;
        }

        if( this.queue )
            this.queue.push( data );
        else
            this.worker.postMessage( data );

    }

    _onmsg( evt ){

        if( evt.data.info == "ready" ){

            for( var i=0; i<this.queue.length; ++i )
                this.worker.postMessage( this.queue[i] );

            this.queue = null;

            return;
            
        }

        if( evt.data.MID ){

            var cb = this.cbmap[ evt.data.MID ];
            delete this.cbmap[ evt.data.MID ];

            if( cb )
                cb( evt.data );

        }else{

            for( var k in evt.data ){
                var diff = evt.data[k];
                var cpu = this.states[k];
                if( !cpu ) continue;
                Object.assign( cpu, diff );
            }

        }

    }

}

module.exports = AtcoreService;