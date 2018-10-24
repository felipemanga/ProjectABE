"use strict";

// http://www.atmel.com/webdoc/avrassembler/avrassembler.wb_instruction_list.html

function bin( bytes, size ){

    var s = (bytes>>>0).toString(2);
    while( s.length < size ) s = "0"+s;
    return s.replace(/([01]{4,4})/g, "$1 ") + "  #" + (bytes>>>0).toString(16).toUpperCase();
    
}

if( typeof performance === "undefined" ){
    if( Date.now ) global.performance = { now:()=>Date.now() };
    else global.performance = { now:()=>(new Date()).getTime() };
}

let staticOp = {begin:"", end:"", srDirty:0};

class Atcore {

    constructor( desc ){

        if( !desc )
            return;

	this.sleeping = false;
        this.sreg = 0;
        this.pc = 0;
        this.sp = 0;
        this.clock = desc.clock;
        this.codec = desc.codec;
        this.interruptMap = desc.interrupt;
        this.error = 0;
        this.flags = desc.flags;
        this.tick = 0;
        this.startTick = 0;
        this.endTick = 0;
        this.execTime = 0;
	this.debuggerEnabled = false;
        this.time = performance.now();

	this.i8a = new Int8Array(4);

        this.breakpoints = {};
	this.readBreakpoints = {};
	this.writeBreakpoints = {};
	this.breakpointHit = false;
	this.minStack = 0xFFFFFFFF;
	this.lastReadValue = 0;
	this.lastReadAddr = 0;
	this.lastWriteValue = 0;
	this.lastWriteAddr = 0;
	this.history = window.execHistory = [];

        this.memory = new Uint8Array( 
            32 // register file
            + (0xFF - 0x1F) // io
            + desc.sram
            );
        
        this.flash = new Uint8Array( desc.flash );
        this.eeprom = new Uint8Array( desc.eeprom );

        this.initMapping();
        this.instruction = null;
        this.periferals = {};
        this.pins = {};

        for( var periferalName in desc.periferals ){

            let addr, periferal = desc.periferals[ periferalName ];
            let obj = this.periferals[ periferalName ] = { core:this };

            for( addr in periferal.write )
                this.writeMap[ addr ] = periferal.write[ addr ].bind( obj );

            for( addr in periferal.read )
                this.readMap[ addr ] = periferal.read[ addr ].bind( obj );

            if( periferal.update )
                this.updateList.push( periferal.update.bind( obj ) );
            
            if( periferal.init )
                periferal.init.call( obj );

        }

	this.initInterface();

    }

    initInterface(){

	let THIS = this;
	
	self.core = {
	    
	    history:this.history,
	    errors:[],
	    breakpoints: this.breakpoints,
	    readBreakpoints: this.readBreakpoints,
	    writeBreakpoints: this.writeBreakpoints,
	    enableDebugger:() => { this.enableDebugger(); },
	    memory: this.memory,
	    
	    get minStack(){ return THIS.minStack },
	    set minStack(value) { THIS.minStack = value; },
	    da: (a=null, l=20) => {
		let opc = this.pc;
		
		if( a===null ) a = this.pc;
		else a >>= 1;
		this.pc = a;
		
		let out = [];		
		for( let i=0; i<l; ++i ){
		    let op = (this.pc<<1).toString(16).padStart(4, " ") + ": ";
		    
		    let inst = this.identify();
		    if( !inst ){
			out.push( op + this.error );
			this.pc++;
			continue;
		    }

		    op += inst.name.toLowerCase();

		    let keys = Object.keys(inst.argv);
		    keys = keys.sort( (a,b)=>{
			a = a.toLowerCase();
			b = b.toLowerCase();
			if( a > b ) return 1;
			if( a < b ) return -1;
			return 0;
		    });
		    
		    let sep = " ";
		    for( var ki=0; ki<keys.length; ++ki ){
			let k = keys[ki];
			let v;
			if( inst.print && inst.print[k] )
			    v = inst.print[k]( inst.argv[k], this );
			else if( k == "r" || k == "d" || k == "x" )
			    v = "r" + inst.argv[k];
			else if( k == "A" || k == "k" || k == "K" )
			    v = "0x" + inst.argv[k].toString(16);
			else if( k == "b" || k == "s" )
			    v = inst.argv[k];
			else
			    v = k + "=" + inst.argv[k].toString(16);
			    
			op += sep + v;
			sep = ", ";
		    }

		    op += "\t\t; " + inst.decbytes.toString(2).padStart( 8*inst.bytes, "0" ).split(/(....)/).join(" ");
		    
		    out.push(op);
		    this.pc += inst.bytes >> 1;
			     
		}
		this.pc = opc;
		return out.join("\n");
	    },
	    state: () =>
		'PC: #'+(this.pc<<1).toString(16)+
		'\nSR: ' + this.memory[0x5F].toString(2).padStart(8, '0')+
		'\nSP: #' + this.sp.toString(16) +
		'\nStack: #' + (this.sram.length + 0xFF - this.minStack).toString(16) +
		'\n' + 
		Array.prototype.map.call( this.reg, 
					  (v,i) => 'R'+(i+'')+' '+(i<10?' ':'')+'=\t#'+v.toString(16).padStart(2,"0") + '\t' + v 
					).join('\n') +
		'\n' + 
		Array.from(this.wreg).map(
		    (v,i) => "WXYZ"[i]+'   =\t#'+v.toString(16).padStart(2,"0") + '\t' + v 
		).join('\n') +
		'\n' + 
		'#' + this.lastReadAddr.toString(16).padStart(4,"0") + " => #" + this.lastReadValue.toString(16).padStart(2, "0") +
		'\n' +
		'#' + this.lastWriteAddr.toString(16).padStart(4,"0") + " <= #" + this.lastWriteValue.toString(16).padStart(2, "0") +
		'\n'
	    
	};

    }

    initMapping(){
        Object.defineProperties( this, {
            writeMap:{ value:[], enumerable:false, writable:false },
            readMap:{ value:[], enumerable:false, writable:false },
            updateList:{ value:[], enumerable:false, writable:false },
            reg:{ value: new Uint8Array( this.memory.buffer, 0, 0x20 ), enumerable:false },
            wreg:{ value: new Uint16Array( this.memory.buffer, 0x20-8, 4 ), enumerable: false },
            sram:{ value: new Uint8Array( this.memory.buffer, 0x100 ), enumerable:false },
            io:{ value: new Uint8Array( this.memory.buffer, 0x20, 0xFF - 0x20 ), enumerable:false },
            prog:{ value: new Uint16Array( this.flash.buffer ), enumerable:false },
        });

	this.native = {};

        this.codec.forEach( op =>{
            if( op.str ) this.parse( op );
        });

	this.codec = this.codec.sort( (a, b)=>b.score-a.score );

	self.codecs = this.codec;

	let memory = this.memory;
	let readMap = this.readMap, writeMap = this.writeMap;
	let THIS = this;
	
	this.read = function( addr ){
	    
            var value = memory[ addr ];

            var periferal = readMap[ addr ];
            if( periferal ){
		var ret = periferal( value );
		if( ret !== undefined ) value = ret;
            }

	    if( THIS.debuggerEnabled ){

		THIS.lastReadValue = value;
		THIS.lastReadAddr = addr;

		if( THIS.readBreakpoints[addr] ){
		    THIS.endTick = THIS.tick;
		    THIS.breakpointHit = true;
		}
		
	    }

            return value;
	    
	};

	this.readBit = function( addr, bit ){
	    debugger;
	    
            var value = memory[ addr ];

            var periferal = readMap[ addr ];
            if( periferal ){
		var ret = periferal( value );
		if( ret !== undefined ) value = ret;
            }

	    THIS.lastReadValue = value;
	    THIS.lastReadAddr = addr;

	    if( THIS.debuggerEnabled && THIS.readBreakpoints[addr] ){
		THIS.endTick = THIS.tick;
		THIS.breakpointHit = true;
	    }

            return (value >>> bit) & 1;
	};

	this.write = function( addr, value ){

	    var periferal = writeMap[ addr ];

	    if( periferal ){
		var ret = periferal( value, memory[ addr ] );
		if( ret === false ) return;
		if( ret !== undefined ) value = ret;
	    }

	    if( THIS.debuggerEnabled ){
	    
		THIS.lastWriteValue = value;
		THIS.lastWriteAddr = addr;
	    
		if( THIS.writeBreakpoints[addr] ){
		    THIS.endTick = THIS.tick;
		    THIS.breakpointHit = true;
		}
	    }

	    return memory[ addr ] = value;
	}
	
    }

    readStatic( addr ){
        var periferal = this.readMap[ addr ];
	
        if( periferal ){
	    return `(
t2 = memory[${addr}],
t1 = readMap[${addr}]( t2 ),
t1 === undefined ? t2 : t1
)`;
        }else{
	    return `memory[ ${addr} ]`;
	}
	
    }

    readRamStatic( addr ){
	return `memory[${addr}]`;
    }

    writeStack( addr, value ){
	this.write( addr, value );
	if( addr < this.minStack )
	    this.minStack = addr;
    }

    writeBit( addr, bit, bvalue ){
	bvalue = (!!bvalue) | 0;
	var value = this.memory[ addr ];
	value = (value & ~(1<<bit)) | (bvalue<<bit);
	
        var periferal = this.writeMap[ addr ];

        if( periferal ){
            var ret = periferal( value, this.memory[ addr ] );
            if( ret === false ) return;
            if( ret !== undefined ) value = ret;
        }

	this.lastWriteValue = value;
	this.lastWriteAddr = addr;

        this.memory[ addr ] = value;

	if( this.debuggerEnabled && this.writeBreakpoints[ addr ] ){
	    this.endTick = this.tick;
	    this.breakpointHit = true;
	}

	return this.memory[ addr ];
	
    }

    enableDebugger(){
	
	if( this.debuggerEnabled )
	    return;
	
	
	this.debuggerEnabled = true;
	this.native = {};
	
    }

    exec( time ){
	
        var cycles = (time * this.clock)|0;
        
        var start = this.tick;
        this.endTick = this.startTick + cycles;
        this.execTime = time;
	var lastUpdate = start;

	if( this.debuggerEnabled ){
	    this.breakpointHit = false;

	    while( this.tick < this.endTick ){

		if( !this.breakpointHit && (this.tick >= this.endTick || this.tick - lastUpdate > 1000 ) ){
		    lastUpdate = this.tick;
		    this.updatePeriferals();
		}
		
		// while( this.history.length > 100 ) this.history.shift();
		// this.history.push("#" + (this.pc<<1).toString(16));
		
		if( !this.sleeping ){

		    if( this.pc > 0xFFFF ) break;

		    var func = this.native[ this.pc ];
		    if( func ) func.call(this);
		    else if( !this.getBlock() )
			break;
		}else{
		    this.tick += 1000;
		}


	    }
	    
	}else{

	    while( this.tick < this.endTick ){
		
		if( !this.sleeping ){

		    var func = this.native[ this.pc ];
		    // if( !func ) 		    console.log( this.pc );
		    if( func ) func.call(this);
		    else if( !this.getBlock() )
			break;
		}else{
		    this.tick += 100;
		}
		
		if( this.tick >= this.endTick || this.tick - lastUpdate > 200 ){
		    lastUpdate = this.tick;
		    this.updatePeriferals();
		    while( this.history.length > 100 ) this.history.shift();
		}

	    }
	    
	}

	this.startTick = this.endTick;

    }

    updatePeriferals(){

        var interruptsEnabled = this.memory[0x5F] & (1<<7);

        var updateList = this.updateList;

        for( var i=0, l=updateList.length; i<l; ++i ){

            var ret = updateList[i]( this.tick, interruptsEnabled );

            if( ret && interruptsEnabled ){
                interruptsEnabled = 0;
		this.sleeping = false;
                this.interrupt( ret );
            }

        }

    }

    update(){
        var now = performance.now();
        var delta = now - this.time;

	/* * /
	if( this.debuggerEnabled )
	    delta = 16;
	else
            delta = Math.max( 0, Math.min( 33, delta ) );
	    /*/
	delta = 13.5;
	/* */

        this.exec( delta/1000 );

        this.time = now;
    }

    getBlock( execute ){

		if( execute == undefined )
			execute = true;
		
		if( this.pc >= 0xFFFF ){
			this.pc = 0;
			return false;
		}
	
	// this.history.push( "#" + (this.pc << 1).toString(16).padStart( 4, "0" ) );

        var startPC = this.pc;

        var skip = false, prev = false, dbg = this.debuggerEnabled;
        var cacheList = ['reg', 'wreg', 'io', 'memory', 'sram', 'flash']
		
		
		if( dbg )
			cacheList.push("breakpoints");
	    
        var code = '"use strict";\nvar sp=this.sp, r, t1, t2, i8a=this.i8a, SKIP=false, read=this.read, write=this.write, readMap=this.readMap, ';
        code += cacheList.map(c=> `${c} = this.${c}`).join(', ');
        code += ';\n';
        code += 'var sr = memory[0x5F]';
        for( var i=0; i<8; ++i )
            code += `, sr${i} = (sr>>${i})&1`;
        code += ';\n';

		
		code += 'switch( this.pc ){\n';
		// code += 'while(1){\n';

		let addrs = [];
		let doTickCheck = 1;
        do{
			
            var inst = this.identify();
            if( !inst ){
                // inst = nop;
		if( execute )
		    this.history.push( this.error );
		this.pc++;
                return;
            }

            code += `\ncase ${this.pc}:`;

            var chunk = `\n\tthis.pc = ${this.pc};\n`;
	    
	    if( dbg ){
		chunk += '\nif( !breakpoints.disableFirst ){\n';
		chunk += `\n\tif( breakpoints[${this.pc}] && breakpoints[${this.pc}](${this.pc},this.sp) )`;
		chunk += '{\n\t\tthis.endTick = this.tick;\n';
		chunk += '\t\tthis.breakpointHit = true;\n';
		chunk += '\t\tbreak;\n\t}\n';
	    }

	    chunk += `\tif( (this.tick += ${inst.cycles}) >= this.endTick ) break;\n`;

	    if( dbg ){
		chunk += '\n}else{\n';
		chunk += '\tthis.tick += ' + inst.cycles + ';\n';
		chunk += '\tbreakpoints.disableFirst = false;\n';
		chunk += '}\n';
	    }
	        
            var op = this.getOpcodeImpl( inst, inst.impl );
			
            var srDirty = op.srDirty;
            var line = op.begin, endline = op.end;
            if( inst.flags ){
                for( var i=0, l=inst.flags.length; i<l; ++i ){
                    var flagOp = this.getOpcodeImpl( inst, this.flags[inst.flags[i]] );
                    line += flagOp.begin;
                    endline += flagOp.end;
                    srDirty |= flagOp.srDirty;
                }
            }

            if( srDirty ){
                var pres = ((~srDirty)>>>0&0xFF).toString(2);
                endline += `sr = (sr&0b${pres}) `;
                for( var i=0; i<8; i++ )
                    if( srDirty&(1<<i) )
                        endline += ` | (sr${i}<<${i})`;
                endline += ';\nmemory[0x5F] = sr;\n';
            }

            chunk += line + endline;

            if( skip )
                code += "  if( !SKIP ){\n    " + chunk + "\n  }\nSKIP = false;\n";
            else
                code += chunk;

            prev = skip;
            skip = inst.skip;

            this.pc += inst.bytes >> 1;

        }while( this.pc < this.prog.length && (!inst.end || skip || prev) )

        code += `\nthis.pc = ${this.pc};\n`;
		code += `break;\n`;

        code += '\n\n}';
		code += 'this.sp = sp;\n';

		var endPC = this.pc;

        code = "return (function _" + (startPC<<1).toString(16) + "(){\n"
             + code
             + "});";

        try{

            var func = (new Function( code ))();

            for( var i=startPC; i<endPC; ++i )
                this.native[ i ] = func;

			if( execute ){
				this.pc = startPC;
				func.call( this );
			}

        }catch(ex){

			this.history.push( "Error on 0x" + startPC + ": " + ex.toString() );
            
            setTimeout(()=>{
                debugger;
                var func = new Function( code );
                func.call( this );
            }, 1);
            throw ex;
        }

        return endPC;

    }

    identify(){

        let prog = this.prog, 
            codec = this.codec, 
            bytes,
            h,
            j,
            i=0, 
            l = codec.length,
            pc = this.pc;

        let bytes2, bytes4;
        bytes2 = prog[pc] >>> 0;
        bytes4 = ((bytes2 << 16) | (prog[pc+1])) >>> 0;

        for( ; i<l; ++i ){

            var desc = codec[i];
            var opcode = desc.opcode>>>0;
            var mask = desc.mask>>>0;
            var size = desc.bytes;

            if( size === 4 ){

                if( (bytes4 & mask)>>>0 !== opcode )
                    continue;
                bytes = bytes4;

            }else{

                if( (bytes2 & mask)>>>0 !== opcode )
                    continue;
                bytes = bytes2;

            }


            this.instruction = desc;

            // var log = desc.name + " ";

            for( var k in desc.args ){
                mask = desc.args[k];
                var value = 0;
                h = 0;
                j = 0;
                while( mask ){
                    if( mask&1 ){
                        value |= ((bytes>>h)&1) << j;
                        j++;
                    }
                    mask = mask >>> 1;
                    h++;
                }
		if( desc.shift && desc.shift[k] ) value <<= desc.shift[k];
		if( desc.add && desc.add[k] ) value += desc.add[k];
		if( desc.resolve && desc.resolve[k] )
		    value = this.readStatic(value);
                desc.argv[k] = value;
                // log += k + ":" + value + "  "
            }
	    desc.decbytes = bytes;
            // console.log(log);

            return this.instruction;

        }


        this.error = `UNKNOWN OPCODE: ` + bin(bytes2, 16);

        return null;

    }

    get statusI(){ return this.sreg & (1<<7); }
    get statusT(){ return this.sreg & (1<<6); }
    get statusH(){ return this.sreg & (1<<5); }
    get statusS(){ return this.sreg & (1<<4); }
    get statusV(){ return this.sreg & (1<<3); }
    get statusN(){ return this.sreg & (1<<2); }
    get statusZ(){ return this.sreg & (1<<1); }
    get statusC(){ return this.sreg & (1<<0); }


    interrupt( source ){

        // console.log("INTERRUPT " + source);

        let addr = this.interruptMap[source];
        var pc = this.pc;
        this.memory[this.sp--] = pc>>8;
        this.memory[this.sp--] = pc;
        this.memory[0x5F] &= ~(1<<7); // disable interrupts
        this.pc = addr;
	this.tick += 5;

	/*
	let log = "#" + (this.pc<<1).toString(16).padStart(4, "0") + " INT " + source;
	if( this.history[this.history.length-1] != log )
	    this.history.push( log );
	*/
	
    }

    parse( out ){
	var opcode = 0;
	var mask = 0;
	var args = {};
	var argv = {};
	var nargv = 0x00080000;
	

	var str = out.str, l=str.length;
	for( var i=0; i<l; ++i ){
            var chr = str[i];
            var bit = (l-i-1)>>>0;
            if( chr == '0' ){
		mask |= 1<<bit;
            }else if( chr == '1' ){
		mask |= 1<<bit;
		opcode |= 1<<bit;            
            }else{
		if( !(chr in args) ){
                    args[chr] = 0;
		    argv[chr] = nargv++;
		}
		args[chr] |= 1<<bit;
            }
	}

	out.opcode = opcode;
	out.mask = mask;
	out.args = args;
	out.argv = argv;
	out.bytes = (l/8)|0;
	out.bytes = out.bytes || 2;
	out.cycles = out.cycles || 1;
	out.score = out.score || 0;

	var op = this.getOpcodeImpl( out, out.impl );

	out.parsedBegin = getParsed( op.begin );
	out.parsedEnd = getParsed( op.end );
	out.parsedsrDirty = op.srDirty|0;

	if( out.flags ){
	    
            for( var i=0, l=out.flags.length; i<l; ++i ){
                var flagOp = this.getOpcodeImpl( out, this.flags[out.flags[i]] );

		var tmp = getParsed(flagOp.begin);
		out.parsedBegin[ out.parsedBegin.length-1 ] += tmp[0];
		for( var j=1; j<tmp.length; ++j )
		    out.parsedBegin.push( tmp[j] );

		tmp = getParsed( flagOp.end );
                out.parsedEnd[ out.parsedEnd.length-1 ] += tmp[0];
		for( j=1; j<tmp.length; ++j )
		    out.parsedEnd.push( tmp[j] );
		
                out.parsedsrDirty |= flagOp.srDirty;
            }
	    
	    out.flags = null;
	    
	}

	function getParsed( impl ){
	    if( !impl ) return [""];
	    
	    var parsed = [impl];
	    
	    for( var k in args ){
		
		var klc = k.toLowerCase();
		var val = argv[k];
		
		for( var i=parsed.length-1; i>=0; i-=2 ){
		    var parts = parsed[i].split( val );
		    var oparts = [i, 1];
		    parts.forEach( p => oparts.push( p, k ) );
		    oparts.pop();
		    parsed.splice.apply( parsed, oparts );
		}
		
	    }

	    return parsed;
	    
	}

    }

    
    getOpcodeImpl( inst, str, useParsed=true ){
        var i, l, op = staticOp;

	if( inst.parsedBegin && str === inst.impl && useParsed ){
	    op.begin = getParsed( inst.parsedBegin );
	    op.end   = getParsed( inst.parsedEnd );
	    op.srDirty = inst.parsedsrDirty;
	    
	    function getParsed( arr ){
		
		var ret = "", i = 0;
		if( arr.length > 1 )
		    for( i; i<arr.length-1; ){
			ret += arr[i++];
			ret += inst.argv[arr[i++]];
		    }
		
		ret += arr[i++];
		
		return ret;
	    }
	    
	    return op;
	}

	op = {begin:"", end:"", srDirty:0};

        if( Array.isArray(str) ){
            for( i = 0, l=str.length; i<l; ++i ){
                var tmp = this.getOpcodeImpl( inst, str[i] );
                op.begin += tmp.begin + "\n";
                op.end += tmp.end + "\n";
                op.srDirty |= tmp.srDirty;
            }
            return op;
        }

        var src = str, argv = inst.argv;

        for( var k in argv )
            str = str.split(k.toLowerCase()).join(argv[k]);

        var SRSync = "", SRDirty = 0;

        str = str.replace(/SR@([0-9]+)\s*←\s*1;?\s*$/g, (m, bit, assign)=>{
            SRDirty |= 1 << bit;
            return `sr${bit} = 1;\n`;
        });
        str = str.replace(/SR@([0-9]+)\s*←\s*0;?\s*$/g, (m, bit, assign)=>{
            SRDirty |= 1 << bit;
            return `sr${bit} = 0;\n`;
        });
        str = str.replace(/SR([0-9]+)\s*=(.*)/g, (m, bit, assign)=>{
            SRDirty |= 1 << bit;
            return `sr${bit} = ${assign};\n`;
        });
        str = str.replace(/SR\s*←/g, () => {
            SRSync = 'memory[0x5F] = sr; sr0=sr&1; sr1=(sr>>1)&1; sr2=(sr>>2)&1; sr3=(sr>>3)&1; sr4=(sr>>4)&1; sr5=(sr>>5)&1; sr6=(sr>>6)&1; sr7=(sr>>7)&1;';
            return 'sr =';
        });
        str = str.replace(/SR@([0-9]+)\s*←(.*)$/g, (m, bit, assign)=>{
            SRDirty |= 1 << bit;
            return `sr${bit} = (!!(${assign}))|0;`;
        });
        str = str.replace(/SR\s*¯/g, '(~sr)');
        str = str.replace(/SR@([0-9]+)\s*¯/g, '(~sr$1) ');
        str = str.replace(/SR@([0-9]+)\s*/g, '(sr$1) ');
        str = str.replace(/SR/g, 'sr');

        str = str.replace(/WR([0-9]+)\s*←/g, (m, num) =>{
	    op.end += `wreg[${num}] = r;\n`;
	    return 'r = ';
	});
        str = str.replace(/WR([0-9]+)@([0-9]+)\s*←(.*)$/g, (m, num, bit, assign)=>{
	    op.end += `wreg[${num}] = r;\n`;
	    return `r = (wreg[${num}] & ~(1<<${bit})) | (((!!(${assign}))|0)<<${bit});`
	});
        str = str.replace(/WR([0-9]+)\s*¯/g, '(~wreg[$1]) ');
        str = str.replace(/WR([0-9]+)@([0-9]+)\s*¯/g, '(~(wreg[$1]>>>$2)&1) ');
        str = str.replace(/WR([0-9]+)@([0-9]+)\s*/g, '((wreg[$1]>>>$2)&1) ');
        str = str.replace(/WR([0-9]+)/g, 'wreg[$1]');

        str = str.replace(/R([0-9<]+)(\+[0-9]+)?\s*←/g, (m, num, numadd) =>{ 
            numadd = numadd || "";
            op.end += `reg[(${num})${numadd}] = r;\n`; 
            return 'r = '; 
        });
        str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*←(.*)$/g, (m, num, numadd, bit, assign)=>{
            numadd = numadd || "";
            op.end += `reg[(${num})${numadd}] = r;\n`
            return `r = (reg[(${num})${numadd}] & ~(1<<${bit})) | (((!!(${assign}))|0)<<${bit});`;
        });

        str = str.replace(/R([0-9<]+)(\+[0-9]+)?\s*=\s+/g, (m, num, numadd) =>{ 
            numadd = numadd || "";
            return `r = reg[(${num})${numadd}] = `; 
        });
        str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*=\s+(.*)$/g, (m, num, numadd, bit, assign)=>{
            numadd = numadd || "";
            return `r = reg[(${num})${numadd}] = (reg[(${num})${numadd}] & ~(1<<${bit})) | (((!!(${assign}))|0)<<${bit});`;
        });

        str = str.replace(/R([0-9<]+)(\+[0-9]+)?\s*¯/g, '(~reg[($1)$2]) ');
        str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*¯/g, '(~(reg[($1)$2]>>>$3)&1) ');
        str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*/g, '((reg[($1)$2]>>>$3)&1) ');
        str = str.replace(/R([0-9<]+)(\+[0-9]+)?/g, '(reg[($1)$2]>>>0)');

        str = str.replace(/R@([0-9]+)\s*¯/g, '(~(r>>>$1)&1) ');
        str = str.replace(/R@([0-9]+)\s*/g, '((r>>>$1)&1) ');
        str = str.replace(/I\/O/g, 'io');
        str = str.replace(/R/g, 'r');

        str = str.replace(/FLASH\(([XYZ])\)\s*←(.*);?$/g, (m, n, v) => 'flash[ wreg[' + (n.charCodeAt(0)-87) + '] ] = ' + v + ';');
        str = str.replace(/FLASH\(([XYZ])\)/g, (m, n) => 'flash[ wreg[' + (n.charCodeAt(0)-87) + '] ]');
        str = str.replace(/\(([XYZ])(\+[0-9]+)?\)\s*←(.*);?$/g, (m, n, off, v) => 'write( wreg[' + (n.charCodeAt(0)-87) + ']' + (off||'') + ', ' + v + ');');
        str = str.replace(/\(([XYZ])(\+[0-9]+)?\)/g, (m, n, off) => 'read( wreg[' + (n.charCodeAt(0)-87) + ']' + (off||'') + ', this.pc )');

	if( !this.debuggerEnabled ){
            str = str.replace(/\(STACK\)\s*←(.*)/g, 'memory[sp--] = $1; if(sp<this.minStack) this.minStack = sp; ');
            str = str.replace(/\((STACK)\)/g, 'memory[++sp]');
            str = str.replace(/\(STACK2\)\s*←(.*)/g, 't1 = $1;\nmemory[sp--] = t1>>8;\nmemory[sp--] = t1;\n if(sp<this.minStack) this.minStack = sp;\n');
            str = str.replace(/\((STACK2)\)/g, '(memory[++sp] + (memory[++sp]<<8))');
	}else{
            str = str.replace(/\(STACK\)\s*←(.*)/g, 'this.writeStack(sp--, $1)');
            str = str.replace(/\((STACK)\)/g, 'read(++sp)');
            str = str.replace(/\(STACK2\)\s*←(.*)/g, 't1 = $1;\nthis.writeStack(sp--, t1>>8);\nthis.writeStack(sp--, t1);\n');
            str = str.replace(/\((STACK2)\)/g, '(read(++sp) + (read(++sp)<<8))');
	}

        str = str.replace(/⊕/g, '^');
        str = str.replace(/•/g, '&');

        str = str.replace(/io\[([0-9]+)\]\s*←(.*?);?$/g, 'write( 32+$1, $2 )');
        str = str.replace(/io\[([0-9]+)@([0-9]+)\]\s*←(.*?);?$/g, 'this.writeBit( 32+$1, $2, $3 )');
	str = str.replace(/io\[([0-9+<]+)@([0-9]+)\]/g, '((read( 32+$1 )>>>$2)&1)');
        str = str.replace(/io\[([0-9+<]+)\]/g, 'read( 32+$1 )');

        str = str.replace(/SP/g, 'sp');
        str = str.replace(/PC\s*←(.*)$/g, 't1 = $1;\n this.pc = t1; break;\n');
        str = str.replace(/PC/g, 'this.pc');
        str = str.replace(/←/g, '=');


        str = '// ' + src.replace(/[\n\r]+\s*/g, '\n\t// ') + "\n" + str + "\n";
        
        op.srDirty = SRDirty;

        op.begin = str;
        op.end += SRSync;

        return op;
    }

    static ATmega328P(){

        let core = new Atcore({
            flash: 32 * 1024,
            eeprom: 1 * 1024,
            sram: 2 * 1024,
            codec: AtCODEC,
            flags: AtFlags,
            clock: 16 * 1000 * 1000, // speed in kHz
            periferals:require('./At328P-periferals.js'),
            interrupt:{
                RESET: 0x0000,  //  External pin, power-on reset, brown-out reset and watchdog system reset
                INT0: 0x002 ,  //  External interrupt request 0
                INT1: 0x0004,  //  External interrupt request 1
                PCINT0: 0x0006,  //  Pin change interrupt request 0
                PCINT1: 0x0008,  //  Pin change interrupt request 1
                PCINT2: 0x000A,  //  Pin change interrupt request 2
                WDT: 0x000C,  //  Watchdog time-out interrupt
                TIMER2A: 0x000E,  //  COMPA Timer/Counter2 compare match A
                TIMER2B: 0x0010,  //  COMPB Timer/Counter2 compare match B
                TIMER2O: 0x0012,  //  OVF Timer/Counter2 overflow
                TIMER1C: 0x0014,  //  CAPT Timer/Counter1 capture event
                TIMER1A: 0x0016,  //  COMPA Timer/Counter1 compare match A
                TIMER1B: 0x0018,  //  COMPB Timer/Counter1 compare match B
                TIMER1O: 0x001A,  //  OVF Timer/Counter1 overflow
                TIMER0A: 0x001C,  //  COMPA Timer/Counter0 compare match A
                TIMER0B: 0x001E,  //  COMPB Timer/Counter0 compare match B
                TIMER0O: 0x0020,  //  OVF Timer/Counter0 overflow
                SPI: 0x0022,  // , STC SPI serial transfer complete
                USARTRX: 0x0024,  // , RX USART Rx complete
                USARTE: 0x0026,  // , UDRE USART, data register empty
                USARTTX: 0x0028,  // , TX USART, Tx complete
                ADC: 0x002A,  //  ADC conversion complete
                EEREADY: 0x002C,  //  READY EEPROM ready
                ANALOG: 0x002E,  //  COMP Analog comparator
                TWI: 0x0030,  //  2-wire serial interface
                SPM: 0x0032  //  READY Store program memory ready                
            }
        });

        return core;

    }

    static ATmega32u4(){

	let core = new Atcore({
            flash: 32 * 1024,
            eeprom: 1 * 1024,
            sram: 2 * 1024 + 512,
            codec: AtCODEC,
            flags: AtFlags,
            clock: 16 * 1000 * 1000, // speed in kHz
            periferals:require('./At32u4-periferals.js'),
            interrupt:{
		RESET: 0x0000,  //  External pin, power-on reset, brown-out reset and watchdog system reset
		INT0: 0x002 ,  //  External interrupt request 0
		INT1: 0x0004,  //  External interrupt request 1
		INT2: 0x0006,  //  External interrupt request 2
		INT3: 0x0008,  //  External interrupt request 3
		RESERVED0: 0x000A,
		RESERVED1: 0x000C,
		INT6: 0x000E,    //  External interrupt request 6
		PCINT0: 0x0012,  //  Pin change interrupt request 0
		USBGEN: 0x0014,  // USB General Interrupt request
		USBEND: 0x0016,  // USB Endpoint Interrupt request
		WDT: 0x0018,     //  Watchdog time-out interrupt
		
		TIMER1CAP: 0x0020,  //  CAPT Timer/Counter1 capture event
		TIMER1A: 0x0022,  //  COMPA Timer/Counter1 compare match A
		TIMER1B: 0x0024,  //  COMPB Timer/Counter1 compare match B
		TIMER1C: 0x0026,  //  COMPC Timer/Counter1 compare match C
		TIMER1O: 0x0028,  //  OVF Timer/Counter1 overflow
		TIMER0A: 0x002A,  //  COMPA Timer/Counter0 compare match A
		TIMER0B: 0x002C,  //  COMPB Timer/Counter0 compare match B
		TIMER0O: 0x002E,  //  OVF Timer/Counter0 overflow
		
		SPI: 0x0030,  // , STC SPI serial transfer complete
		
		USARTRX: 0x0032,  // , RX USART Rx complete
		USARTE: 0x0034,  // , UDRE USART, data register empty
		USARTTX: 0x0036,  // , TX USART, Tx complete

		ANALOG: 0x0038, // Analog Comparator
		ADC: 0x003A,  //  ADC conversion complete
		
		EEREADY: 0x003C,  //  EEPROM ready

		TIMER3CAP: 0x003E,  //  CAPT Timer/Counter1 capture event
		TIMER3A: 0x0040,  //  COMPA Timer/Counter1 compare match A
		TIMER3B: 0x0042,  //  COMPB Timer/Counter1 compare match B
		TIMER3C: 0x0044,  //  COMPC Timer/Counter1 compare match C
		TIMER3O: 0x0046,  //  OVF Timer/Counter1 overflow
		
		
		TWI: 0x0048,  //  2-wire serial interface
		
		SPM: 0x004A,  //  READY Store program memory ready
		
		TIMER4A: 0x004C,
		TIMER4B: 0x004E,
		TIMER4D: 0x0050,
		TIMER4O: 0x0052,
		TIMER4FPF: 0x0054
            }
	});

	return core;

    }

}

const AtCODEC = require('./Opcodes');

const AtFlags = {

    h: 'SR@5 ← (Rd@3 • Rr@3) + (Rr@3 • R@3 ¯) | (R@3 ¯ • Rd@3)',
    H: '',
    z: 'SR1 = !(R&0xFF)|0',
    Z: 'SR1 = !(R&0xFFFF)|0',
    v: 'SR3 = (Rd@7 • Rr@7 • R@7 ¯) | (Rd@7 ¯ • Rr@7 ¯ • R@7)',
    V: 'SR3 = WRd@15 ¯ • R@15',
    n: 'SR2 = R@7',
    N: 'SR2 = R@15',
    s: 'SR4 = SR@2 ⊕ SR@3',
    S: 'SR4 = SR@2 ⊕ SR@3',
    c: 'SR0 = (Rd@7 • Rr@7) | (Rr@7 • R@7 ¯) | (R@7 ¯ • Rd@7)',
    C: 'SR0 = (R@15 ¯ • WRd@15)'
    
};



module.exports = Atcore;
