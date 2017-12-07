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
	
	self.core = {
	    
	    history:this.history,
	    errors:[],
	    breakpoints: this.breakpoints,
	    readBreakpoints: this.readBreakpoints,
	    writeBreakpoints: this.writeBreakpoints,
	    enableDebugger:() => { this.enableDebugger(); },
	    memory: this.memory,
	    
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
            writeMap:{ value:{}, enumerable:false, writable:false },
            readMap:{ value:{}, enumerable:false, writable:false },
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
	
	this.read = function( addr, pc ){
	    
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

            return value;
	    
	};

	this.write = function( addr, value ){

	    var periferal = writeMap[ addr ];

	    if( periferal ){
		var ret = periferal( value, memory[ addr ] );
		if( ret === false ) return;
		if( ret !== undefined ) value = ret;
	    }

	    THIS.lastWriteValue = value;
	    THIS.lastWriteAddr = addr;
	    
	    if( THIS.debuggerEnabled && THIS.writeBreakpoints[addr] ){
		THIS.endTick = THIS.tick;
		THIS.breakpointHit = true;
	    }

	    return memory[ addr ] = value;
	}
	
    }
    
    readBit( addr, bit, pc ){

        var value = this.memory[ addr ];

        var periferal = this.readMap[ addr ];
        if( periferal ){
            var ret = periferal( value );
            if( ret !== undefined ) value = ret;
        }

	this.lastReadValue = value;
	this.lastReadAddr = addr;

	if( this.debuggerEnabled && this.readBreakpoints[addr] ){
	    this.endTick = this.tick;
	    this.breakpointHit = true;
	}

        return (value >>> bit) & 1;
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

		if( !this.breakpointHit && (this.tick >= this.endTick || this.tick - lastUpdate > 1000) ){
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
		    this.tick += 1000;
		}
		
		if( this.tick >= this.endTick || this.tick - lastUpdate > 1000 ){
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

	if( this.debuggerEnabled )
	    delta = 16;
	else
            delta = Math.max( 0, Math.min( 16, delta ) );

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
	    
        var code = '"use strict";\nvar sp=this.sp, r, t1, i8a=this.i8a, SKIP=false, read=this.read, write=this.write, ';
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
			doTickCheck--;
			if( doTickCheck <= 0 ){
				chunk += `\tif( (this.tick += ${inst.cycles}) >= this.endTick ) break;\n`;
				doTickCheck = 5;
			}else chunk += `\tthis.tick += ${inst.cycles};\n`;

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
	
	let log = "#" + (this.pc<<1).toString(16).padStart(4, "0") + " INT " + source;
	if( this.history[this.history.length-1] != log )
	    this.history.push( log );

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
            str = str.replace(/\(STACK\)\s*←/g, 'memory[sp--] =');
            str = str.replace(/\((STACK)\)/g, 'memory[++sp]');
            str = str.replace(/\(STACK2\)\s*←(.*)/g, 't1 = $1;\nmemory[sp--] = t1>>8;\nmemory[sp--] = t1;\n');
            str = str.replace(/\((STACK2)\)/g, '(memory[++sp] + (memory[++sp]<<8))');
	}else{
            str = str.replace(/\(STACK\)\s*←(.*)/g, 'write(sp--, $1)');
            str = str.replace(/\((STACK)\)/g, 'read(++sp)');
            str = str.replace(/\(STACK2\)\s*←(.*)/g, 't1 = $1;\nwrite(sp--, t1>>8);\nwrite(sp--, t1);\n');
            str = str.replace(/\((STACK2)\)/g, '(read(++sp) + (read(++sp)<<8))');
	}

        str = str.replace(/⊕/g, '^');
        str = str.replace(/•/g, '&');

        str = str.replace(/io\[([0-9]+)\]\s*←(.*?);?$/g, 'write( 32+$1, $2 )');
        str = str.replace(/io\[([0-9]+)@([0-9]+)\]\s*←(.*?);?$/g, 'this.writeBit( 32+$1, $2, $3 )');
        str = str.replace(/io\[([0-9+<]+)@([0-9]+)\]/g, 'this.readBit( 32+$1, $2, this.pc )');
        str = str.replace(/io\[([0-9+<]+)\]/g, 'read( 32+$1, this.pc )');
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
		
		TIMER1C: 0x0020,  //  CAPT Timer/Counter1 capture event
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

		TIMER3C: 0x003E,  //  CAPT Timer/Counter1 capture event
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

const AtCODEC = [
    {
        name: 'ADC',
	score:141,
        str: '000111rdddddrrrr',
        impl: 'Rd ← Rd + Rr + SR@0;',
        flags:'hzvnsc'
    },
    {
        name: 'ADD',
	score: 158,
        str: '000011rdddddrrrr',
        impl: 'Rd ← Rd + Rr;',
        flags:'hzvnsc'
    },
    {
        name: 'MUL',
        str: '100111rdddddrrrr',
        impl: [
            't1 = Rd * Rr',
            'R0 = t1',
            'R1 = t1 >> 8',
            'SR1 = !t1|0',
            'SR0 = (t1>>15)&1'
        ],
        flags:'hvnsc'
    },
    {
        name: 'ADIW',
        str: '10010110KKddKKKK',
        impl: [
            'WRd ← WRd + k;',
        ],
	print:{
	    d:d=>"WXYZ"[d]
	},
	debug: true,
        flags:'ZVNSC'
    },
    {
        name: 'AND',
        str: '001000rdddddrrrr',
        impl: [
            'Rd ← Rd • Rr;',
            'SR@3 ← 0'
        ],
        flags:'zns'
    },
    {
        name: 'ANDI',
        str: '0111KKKKddddKKKK',
        impl: [
            'Rd ← Rd • k;',
            'SR@3 ← 0'
        ],
	add:{ d:16 },
        flags:'zns'
    },
    {
        name: 'ASR',
        str: '1001010ddddd0101',
        impl: [
            'SR@0 ← Rd • 1',
            'Rd ← Rd << 24 >> 25;'
        ],
        flags:'zns'
    },
    {
        name: 'BCLRi',
        str: '1001010011111000',
        impl: 'SR@7 ← 0'
    },
    {
        name: 'BCLRt',
        str: '1001010011101000',
        impl: 'SR@6 ← 0'
    },
    {
        name: 'BCLRh',
        str: '1001010011011000',
        impl: 'SR@5 ← 0'
    },
    {
        name: 'BCLRs',
        str: '1001010011001000',
        impl: 'SR@4 ← 0'
    },
    {
        name: 'BCLRv',
        str: '1001010010111000',
        impl: 'SR@3 ← 0'
    },
    {
        name: 'BCLRn',
        str: '1001010010101000',
        impl: 'SR@2 ← 0'
    },
    {
        name: 'BCLRz',
        str: '1001010010011000',
        impl: 'SR@1 ← 0'
    },
    {
        name: 'BCLRc',
        str: '1001010010001000',
        impl: 'SR@0 ← 0'
    },
    {
        name: 'BRCC',
        str:'111101kkkkkkk000',
        impl: [
            'if( !SR@0 ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 2,
	sex:{k:25},
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BRBS',
	score:105,
        str:'111100kkkkkkksss',
        impl: [
            'if( SR@s ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 2,
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BRCS',
        str:'111100kkkkkkk000',
        impl: [
            'if( SR@0 ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 2,
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BREQ',
        str:'111100kkkkkkk001',
        impl: [
            'if( SR@1 ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 3,
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BRLT',
        str:'111100kkkkkkk100',
        impl: [
            'if( SR@4 ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 3,
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BRGE',
        str:'111101kkkkkkk100',
        impl: [
            'if( !SR@4 ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 3,
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BRNE',
	score:91,
        str:'111101kkkkkkk001',
        impl: [
            'if( !SR@1 ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 3,
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BRPL',
        str:'111101kkkkkkk010',
        impl: [
            'if( !SR@2 ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 2,
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BRMI',
        str:'111100kkkkkkk010',
        impl: [
            'if( SR@2 ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 2,
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BRTC',
        str:'111101kkkkkkk110',
        impl: [
            'if( !SR@6 ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 3,
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BRBC',
        str:'111101kkkkkkksss',
        impl: [
            'if( !SR@s ){',
            '  PC ← PC + (k << 25 >> 25) + 1;',
            '}'],
        cycles: 2,
	print:{
	    k: (k, core) => "#" + ((core.pc + (k << 25 >> 25) + 1)<<1).toString(16)
	}
    },
    {
        name: 'BST',
        str:'1111101ddddd0bbb',
        impl: 'SR6 = Rd@b'
        //,debug: true
    },
    {
        name: 'BLD',
        str:'1111100ddddd0bbb',
        impl: 'Rd@b ← SR@6'
    },
    {
        name: 'CALL',
	score:143,
        str:'1001010kkkkk111kkkkkkkkkkkkkkkkk',
        cycles:4,
        impl: [
            '(STACK2) ← PC + 2',
            'PC ← k'
            ],
	print:{
	    k: (k, core) => "#" + (k<<1).toString(16)
	}
    },
    {
        name: 'CBI',
	str: '10011000AAAAAbbb',
	impl: 'I/O[a@b] ← 0;'
    },    
    {
        name: 'COM',
        str:'1001010ddddd0000',
        impl: [
            'Rd ← ~ Rd;',
            'SR@3 ← 0',
            'SR@0 ← 1'
        ],
        flags: 'zns'
    },
    {
        name: 'FMUL',
	str:'000000110ddd1rrr',
	impl:[
	    't1 = Rd * Rr << 1',
            'R0 = t1',
            'R1 = t1 >> 8',
            'SR1 = !t1|0',
            'SR0 = (t1>>15)&1'
	],
	add:{d:16, r:16}
    },
    {
        name: 'NOP',
        str:'0000000000000000',
        impl:''
    },
    {
        name: 'NEG',
        str:'1001010ddddd0001',
        impl: [
            'Rd ← - Rd;',
            'SR3 = R@7 • R@6 ¯ • R@5 ¯ • R@4 ¯ • R@3 ¯ • R@2 ¯ • R@1 ¯ • R@0 ¯',
            'SR0 = (!!R)|0',
            'SR@5 ← R@3 | Rd3 ¯'
        ],
        flags: 'zns'
    },
    {
        name: 'CP',
        str:'000101rdddddrrrr',
        impl: [
            'R = ((Rd - Rr) >>> 0) & 0xFF;',
            'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)',
            'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)',
            'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) + (Rd@7 ¯ • Rr@7 • R@7)'
        ],
        flags: 'zns'
    },
    {
        name: 'CPI',
	score:83,
        str:'0011KKKKddddKKKK',
        impl: [
            'R = ((Rd - k) >>> 0) & 0xFF;',
            'SR@5 ← (Rd@3 ¯ • ((k>>3)&1)) | (((k>>3)&1) • R@3) | (R@3 • Rd@3 ¯)',
            'SR@0 ← (Rd@7 ¯ • ((k>>7)&1)) | (((k>>7)&1) • R@7) | (R@7 • Rd@7 ¯)',
            'SR@3 ← (Rd@7 • ((k>>7)&1^1) • R@7 ¯) + (Rd@7 ¯ • ((k>>7)&1) • R@7)'
        ],
        flags: 'zns',
	add:{d:16}
    },
    {
        name: 'CPC',
	score:107,
        str:'000001rdddddrrrr',
        impl: [
            'R = (Rd - Rr - SR@0) & 0xFF',
            'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)',
            'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)',
            'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) | (Rd@7 ¯ • Rr@7 • R@7)',
            'SR@1 ← (!R) & SR@1'
        ],
        flags: 'ns'
    },
    {
        name: 'CPSE',
        str: '000100rdddddrrrr',
        impl: 'SKIP ← Rr == Rd',
        skip: true
    },
    {
        name: 'DEC',
        str:'1001010ddddd1010',
        impl:[
            'Rd ← Rd - 1',
            'SR@3 ← R@7 ¯ • R@6 • R@5 • R@4 • R@3 • R@2 • R@1 • R@0'
        ],
        flags: 'zns'
    },
    {
        name: 'EOR',
        str:'001001rdddddrrrr',
        impl: [
            'Rd ← Rd ⊕ Rr;',
            'SR@3 ← 0'
        ],
        flags: 'zns'
    },
    {
        name: 'ICALL',
        str:'1001010100001001',
        cycles:3,
        impl: [
            '(STACK2) ← PC + 1',
            'PC ← WR3'
            ]
        // end:true
    },
    {
        name: 'INSR',
        str:'1011011ddddd1111',
        impl: `Rd ← SR`,
        cycles: 1
        // debug: true
    },
    {
        name: 'IN',
        str:'10110AAddddd1110',
        impl: `Rd ← sp>>>8`,
        cycles: 1
    },
    {
        name: 'IN',
        str:'10110AAddddd1101',
        impl: `Rd ← sp&0xFF`,
        cycles: 1
    },
    {
        name: 'IN',
        str:'10110AAdddddAAAA',
        impl: `Rd ← I/O[a]`,
        cycles: 1
    },
    {
        name: 'INC',
        str: '1001010ddddd0011',
        impl: [
            'Rd ← Rd + 1;',
            'SR@3 ← R@7 • R@6 ¯ • R@5 ¯ • R@4 ¯ • R@3 ¯ • R@2 ¯ • R@1 ¯ • R@0 ¯'
        ],
        flags:'zns'
    },
    {
        name: 'IJMP',
        str:'1001010000001001',
        impl: `PC ← WR3`,
        cycles: 2,
        end:true
    },
    {
        name: 'JMP',
        str:'1001010kkkkk110kkkkkkkkkkkkkkkkk',
        impl: `PC ← k`,
        cycles: 3,
        end:true,
	print:{
	    k: (k, core) => "0x" + (k<<1).toString(16)
	}
    },
    {
        name: 'LDI',
	score:704,
        str:'1110KKKKddddKKKK',
        impl:'Rd ← k',
	add:{d:16}
    },
    {
        name: 'LDS',
	score: 243,
        str:'1001000xxxxx0000kkkkkkkkkkkkkkkk',
        impl:'Rx ← this.read(k)',
        bytes: 4
    },
    {
        name: 'LDX',
        str:'1001000ddddd1100',
        impl: `Rd ← (X);`,
        cycles: 2
    },
    {
        name: 'LDX+',
        str:'1001000ddddd1101',
        impl: [
            `Rd ← (X);`,
            `WR1 ++;`
        ],
        cycles: 2
    },
    {
        name: 'LDX-',
        str:'1001000ddddd1110',
        impl: [
            `WR1 --;`,
            `Rd ← (X);`
        ],
        cycles: 2
    },

    {
        name: 'LDY',
        str:'1000000ddddd1000',
        impl: `Rd ← (Y)`,
        cycles: 2
    },
    {
        name: 'LDY+',
        str:'1001000ddddd1001',
        impl: [
            `Rd ← (Y);`,
            `WR2 ++;`
        ],
        cycles: 2
    },
    {
        name: 'LDY-',
        str:'1001000ddddd1010',
        impl: [
            `WR2 --;`,
            `Rd ← (Y);`
        ],
        cycles: 2
    },
    {
        name: 'LDYQ',
	score:81,
        str:'10q0qq0ddddd1qqq',
        impl: [
            `Rd ← (Y+q);`
        ],
        cycles: 2
    },

    {
        name: 'LDZ',
        str:'1000000ddddd0000',
        impl: `Rd ← (Z);`,
        cycles: 2
    },
    {
        name: 'LDZ+',
        str:'1001000ddddd0001',
        impl: [
            `Rd ← (Z);`,
            `WR3 ++;`
        ],
        cycles: 2
    },
    {
        name: 'LDZ-',
        str:'1001000ddddd0010',
        impl: [
            `WR3 --;`,
            `Rd ← (Z);`
        ],
        cycles: 2
    },
    {
        name: 'LDZQ',
        str:'10q0qq0ddddd0qqq',
        impl: [
            `Rd ← (Z+q);`
        ],
        cycles: 2
    },

    {
        name: 'LPMi',
        str:'1001010111001000',
        impl:'R0 ← FLASH(Z)'
    },
    {
        name: 'LPMii',
        str:'1001000ddddd0100',
        impl:'Rd ← FLASH(Z)'
    },
    {
        name: 'LPMiii',
        str:'1001000ddddd0101',
        impl:[
            'Rd ← FLASH(Z);',
            'WR3 ++;'
        ]
    },
    {
        name: 'LSR',
        str:'1001010ddddd0110',
        // debug:true,
        impl:[
            'SR0 = Rd@0',
            'Rd ← Rd >>> 1',
            'SR2 = 0',
            'SR3 = SR@2 ^ SR0'
        ],
        flags:'zs'
    },
    {
        name: 'MOV',
	score:173,
        str: '001011rdddddrrrr',
        impl: [
            'Rd ← Rr;'
        ]
    },
    {
        name: 'MOVW',
	score:250,
        str:'00000001ddddrrrr',
        impl:[
            'Rd = Rr',
            'Rd+1 = Rr+1'
        ],
	shift:{
	    d:1,
	    r:1
	},
	print:{
	    r:r=>"r" + r + ":r" + (r+1),
	    d:d=>"r" + d + ":r" + (d+1)
	}
    },
    {
        name: 'MULSU',
	str:'000000110ddd0rrr',
	impl:[
	    'i8a[0] = Rd',
	    't1 = i8a[0] * Rr',
            'R0 = t1',
            'R1 = t1 >> 8',
            'SR1 = !t1|0',
            'SR0 = (t1>>15)&1'
	],
	add:{d:16, r:16}
    },
    {
        name: 'MULS',
	str:'00000010ddddrrrr',
	impl:[
	    'i8a[0] = Rd',
	    'i8a[1] = Rr',
	    't1 = i8a[0] * i8a[1]',
            'R0 = t1',
            'R1 = t1 >> 8',
            'SR1 = !t1|0',
            'SR0 = (t1>>15)&1'
	],
	add:{d:16, r:16}
    },
    {
        name: 'OR',
        str: '001010rdddddrrrr',
        impl: [
            'Rd ← Rd | Rr;',
            'SR@3 ← 0'
        ],
        flags:'zns'
    },
    {
        name: 'ORI',
        str: '0110KKKKddddKKKK',
        impl: [
            'Rd ← Rd | k;',
            'SR@3 ← 0'
        ],
	add:{d:16},
        flags:'zns'
    },
    {
        name: 'OUTsr',
        str:'1011111rrrrr1111',
        impl: 'I/O[63] ← SR ← Rr',
        cycles: 1
    },    
    {
        name: 'OUTsph',
        str:'1011111rrrrr1110',
        impl: [
            'I/O[62] ← Rr;',
            'sp = (io[62]<<8) | (sp&0xFF);'
        ],
        cycles: 1
    },    
    {
        name: 'OUTspl',
        str:'1011111rrrrr1101',
        impl: [
            'I/O[61] ← Rr;',
            'sp = (sp&0xFF00) | io[61];'
        ],
        cycles: 1
    },    
    {
        name: 'OUT',
        str:'10111AArrrrrAAAA',
        impl: `I/O[a] ← Rr`,
        cycles: 1
    },
    {
        name: 'PUSH',
	score: 123,
        str:'1001001ddddd1111',
        impl:'(STACK) ← Rd',
        cycles: 2
    },
    {
        name: 'POP',
	score:160,
        str:'1001000ddddd1111',
        impl:'Rd ← (STACK)',
        cycles: 2
    },
    {
        name: 'RET',
        str:'1001010100001000',
        cycles:4,
        end:true,
        impl: 'PC ← (STACK2)'
    },
    {
        name: 'RETI',
        str:'1001010100011000',
        cycles:4,
        end:true,
        impl:[
            'memory[0x5F] = (SR |= 1<<7);',
            'PC ← (STACK2)'
        ]
    },
    {
        name: 'ROR',
        str:'1001010ddddd0111',
        impl:[
            'SR0 = Rd@0',
            'Rd ← Rd >>> 1 | (SR<<7&0x80)',
            'SR2 = R>>7',
            'SR3 = SR@2 ^ SR0'
        ],
        flags:'zs'
    },
    {
        name: 'HALT',
        str:'1100111111111111',
        impl: `PC ← PC - 1`,
        end:true
    },
    {
        name: 'RCALL',
        str:'1101kkkkkkkkkkkk',
        cycles:3,
        impl: [
            '(STACK2) ← PC + 1',
            `PC ← PC + (k << 20 >> 20) + 1`
        ],
        end:false
    },
    {
        name: 'RJMP',
	score: 184,
        str:'1100kkkkkkkkkkkk',
        impl: `PC ← PC + (k << 20 >> 20) + 1`,
        end:true,
	print:{
	    k:(k,core)=> "#" + ((core.pc + (k << 20 >> 20) + 1)<<1).toString(16)
	}
    },
    {
        name: 'SEC',
        str:'1001010000001000',
        impl: `SR@0 ← 1`
    },
    {
        name: 'SET',
        str:'1001010001101000',
        impl: `SR@6 ← 1`
    },
    {
        name: 'SEI',
        str:'1001010001111000',
        impl: `SR@7 ← 1`
    },
    {
        name: 'SFMUL',
	str:'000000111ddd0rrr',
	impl:[
	    'i8a[0] = Rd',
	    'i8a[1] = Rr',
	    't1 = i8a[0] * i8a[1] << 1',
            'R0 = t1',
            'R1 = t1 >> 8',
            'SR1 = !t1|0',
            'SR0 = (t1>>15)&1'
	],
	add:{d:16, r:16}
    },
    {
        name: 'STS',
	score: 344,
        str:'1001001ddddd0000kkkkkkkkkkkkkkkk',
        impl: `this.write( k, Rd )`,
        bytes: 4
    },
    {
        name: 'STX',
        str:'1001001rrrrr1100',
        impl: `(X) ← Rr`
    },
    {
        name: 'STX+',
        str:'1001001rrrrr1101',
        impl: [
            `(X) ← Rr`,
            `WR1 ++;`
        ]
    },
    {
        name: 'STX-',
        str:'1001001rrrrr1110',
        impl: [
            `WR1 --;`,
            `(X) ← Rr`
        ]
    },

    {
        name: 'STY',
        str:'1000001rrrrr1000',
        impl: `(Y) ← Rr`
    },
    {
        name: 'STY+',
        str:'1001001rrrrr1001',
        impl: [
            `(Y) ← Rr`,
            `WR2 ++;`
        ]
    },
    {
        name: 'STY-',
        str:'1001001rrrrr1010',
        impl: [
            `WR2 --;`,
            `(Y) ← Rr`
        ]
    },
    {
        name: 'STYQ',
	score:121,
        str:'10q0qq1rrrrr1qqq',
        impl: [
            `(Y+q) ← Rr`
        ]
    },

    {
        name: 'STZ',
        str:'1000001rrrrr0000',
        impl: `(Z) ← Rr`
    },
    {
        name: 'STZ+',
        str:'1001001rrrrr0001',
        impl: [
            `(Z) ← Rr`,
            `WR3 ++;`
        ]
    },
    {
        name: 'STZ-',
        str:'1001001rrrrr0010',
        impl: [
            `WR3 --;`,
            `(Z) ← Rr`
        ]
    },
    {
        name: 'STZQ',
        str:'10q0qq1rrrrr0qqq',
        impl: [
            `(Z+q) ← Rr`
        ]
    },

    {
        name: 'SBC',
        str: '000010rdddddrrrr',
        impl: [
            'Rd ← (Rd - Rr - SR@0) & 0xFF;',
            'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)',
            'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)',
            'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) | (Rd@7 ¯ • Rr@7 • R@7)',
            'SR@1 ← (!R) & SR@1'
        ],
        flags:'ns'
    },
    {
        name: 'SUB',
        str: '000110rdddddrrrr',
        impl: [
            'Rd ← (Rd - Rr)&0xFF;',
            'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)',
            'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)',
            'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) | (Rd@7 ¯ • Rr@7 • R@7)'

        ],
        flags:'zns'
    },
    {
        name: 'SBCI',
	score:70,
        str: '0100KKKKddddKKKK',
        impl: [
            'Rd ← (Rd - k - SR@0)&0xFF;',
            'SR@5 ← (Rd@3 ¯ • ((k>>3)&1)) | (((k>>3)&1) • R@3) | (R@3 • Rd@3 ¯)',
            'SR@0 ← (Rd@7 ¯ • ((k>>7)&1)) | (((k>>7)&1) • R@7) | (R@7 • Rd@7 ¯)',
            'SR@3 ← (Rd@7 • ((k>>7)&1^1) • R@7 ¯) | (Rd@7 ¯ • ((k>>7)&1) • R@7)',
            'SR@1 ← (!R) & SR@1'
        ],
	add:{d:16},
        flags:'ns'
    },
    {
        name: 'SUBI',
        str: '0101KKKKddddKKKK',
        impl: [
            'Rd ← Rd - k;',
            'SR@5 ← (Rd@3 ¯ • ((k>>3)&1)) | (((k>>3)&1) • R@3) | (R@3 • Rd@3 ¯)',
            'SR@0 ← (Rd@7 ¯ • ((k>>7)&1)) | (((k>>7)&1) • R@7) | (R@7 • Rd@7 ¯)',
            'SR@3 ← (Rd@7 • ((k>>7)&1^1) • R@7 ¯) | (Rd@7 ¯ • ((k>>7)&1) • R@7)'
        ],
	add:{d:16},
        flags:'zns'
    },
    {
        name: 'SBI',
	str: '10011010AAAAAbbb',
	impl: 'I/O[a@b] ← 1;'
    },
    {
        name: 'SBIW',
        str: '10010111KKddKKKK',
        impl: [
            'WRd ← WRd - k;',
	    'SR@0 ← WRd@15 ¯ • R@15',
	    'SR@3 ← WRd@15 • R@15 ¯'
        ],
	print:{
	    d:d=>"WXYZ"[d]
	},
        flags:'ZNS'
    },
    {
        name: 'SBIC',
        str: '10011001AAAAAbbb',
        impl: 'SKIP ← !I/O[a@b]',
        skip: true
    },
    {
        name: 'SBIS',
        str: '10011011AAAAAbbb',
        impl: 'SKIP ← I/O[a@b]',
        skip: true
    },
    {
        name: 'SBRC',
        str: '1111110rrrrr0bbb',
        // debug: true,
        impl: 'SKIP ← !(Rr & (1<<b))',
        skip: true
    },
    {
        name: 'SBRS',
        str: '1111111rrrrr0bbb',
        // debug: true,
        impl: 'SKIP ← Rr & (1<<b)',
        skip: true
    },
    {
        name: 'SLEEP',
	str: '1001010110001000',
	impl: [
	    'this.sleeping = true',
	    'PC ← PC + 1'
	],
	// debug: true,
	cycles: 0
    },
    {
        name: 'SWAP',
	str: '1001010ddddd0010',
	impl:[
	    'Rd ← (Rd >>> 4) | (Rd << 4)'
	    ]
    }
];

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
