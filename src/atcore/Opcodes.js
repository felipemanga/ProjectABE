module.exports = [
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
            'SR@5 ← R@3 | Rd@3 ¯'
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
        str:'1011011ddddd1110',
        impl: `Rd ← sp>>>8`,
        cycles: 1
    },
    {
        name: 'IN',
        str:'1011011ddddd1101',
        impl: `Rd ← sp&0xFF`,
        cycles: 1
    },
    {
        name: 'IN',
        str:'10110AAdddddAAAA',
        impl: `Rd ← a`,
	add:{A:32},
	resolve:{A:true},
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
        impl:'Rx ← k',
	resolve:{k:true},
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
        impl: 'SKIP ← !(a&(1<<b))',
        skip: true,
	add:{A:32},
	resolve:{A:true}
    },
    {
        name: 'SBIS',
        str: '10011011AAAAAbbb',
        impl: 'SKIP ← a&(1<<b)',
        skip: true,
	add:{A:32},
	resolve:{A:true}
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
    },
    {
	name: "WDR",
	str: '1001010110101000',
	impl:[
	    ''
	    ]
    }
];
