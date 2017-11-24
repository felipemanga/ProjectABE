
class HCSR04 {

    constructor( core, component ){

        this.core = core; // worker
        this.component = component; // main

        this.echo.connect = this.echo.connect.bind(this);
        this.trigger.connect = this.trigger.connect.bind(this);
        this.state = 0;
        this.tick = 0;
        this.port = 0;
        this.portBit = 0;

        core && core.updateList.push((tick, ie)=>{
            switch( this.state ){
            case 0: return;
            case 1: // got trigger, wait 10cs
                if( tick < this.tick ) break;
                this.state = 2;
                core.pins[ this.port ] |= 1<<this.portBit;
                this.tick = tick + 1000000;
                break;
            case 2:
                if( tick < this.tick ) break;
                this.state = 0;
                core.pins[ this.port ] &= ~(1<<this.portBit);
                break;
            }
        });

    }

    echo = {
        connect( target ){
            console.log("Sonar.echo connecting to ", target.in);
            this.port = target.in.port;
            this.portBit = target.in.bit;
        }
    }

    trigger = {
        connect( target, core ){
            console.log("Sonar.trigger connecting to ", target.out);
            core.pins.onHighToLow( target.out.port, target.out.bit, (tick)=>{
                this.tick = tick + 500;
                this.state = 1;
            });
        }
    }

};

module.exports = HCSR04;
