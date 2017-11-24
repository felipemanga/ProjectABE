import {load, store} from '../lib/strldr.js';
import test from './test.js';

test( "STRLDR");

test(function basicRoundTrip(){
    var a = {a:"b"};
    var b = store(a);

    this.assert
        ( JSON.stringify(a) == JSON.stringify( load(b) ) );
});

test(function circularRoundTrip(){
    var a = {};
    a.a = a;
    var b = load( JSON.parse( JSON.stringify( store(a) ) ) );

    this.assert
        ( b )
        ( b.a == b );
});

test(function doubleRef(){
    var b = { k:1 };
    var a = { x:b, y:b };

    var s = store( a );
    var c = load(s);

    this.assert
        ( c )
        ( c.x )
        ( c.x == c.y )
        ( c.x.k == 1, "x=" + JSON.stringify(c.x) + " in " + JSON.stringify(s) );
});

test(function arrayRef(){
    var b = [1,2,"doritos"];
    var a = {arr:b};
    var s = store( a );
    var c = load( s );

    this.assert
        ( c )
        ( c.arr )
        ( c.arr instanceof Array )
        ( c.arr.length == 3 )
        ( c.arr[0] == 1 )
        ( c.arr[1] == 2 )
        ( c.arr[2] == "doritos" );

});

test( function appdata(){
    var bytes = new Uint8Array(2);
    var a = {data:bytes, stuff:{"ide":"js"}};

    var s = store( a );
    var c = load( s );

    this.assert
        ( c )
        ( JSON.stringify(a) == JSON.stringify(c), JSON.stringify(c) )

});

test(function checkInteger(){
    this.assert( load(store(1)) === 1 );
})

test(function checkFloat(){
    this.assert( load(store(1.5)) === 1.5 );
})

test(function checkFunction(){
    this.assert( load(store(function(){})) === undefined );
})

test(function checkBoolean(){
    this.assert( load(store(true)) === true );
    this.assert( load(store(false)) === false );
})

test(function checkNull(){
    this.assert( load(store(null)) === null );
})

test(function checkString(){
    this.assert( load(store("bacon")) === "bacon" );
})

test(function checkIntegerInObject(){
    this.assert( load(store({x:1})).x === 1 );
})

test(function checkFloatInObject(){
    this.assert( load(store({x:1.5})).x === 1.5 );
})

test(function checkFunctionInObject(){
    this.assert( load(store({x:function(){}})).x === undefined );
})

test(function checkBooleanInObject(){
    this.assert( load(store({x:true})).x === true );
    this.assert( load(store(false)) === false );
})

test(function checkNullInObject(){
    this.assert( load(store({x:null})).x === null );
})

test(function checkStringInObject(){
    this.assert( load(store({x:"bacon"})).x === "bacon" );
})

test(function checkClassES5(){
    function A(){
        this.m2 = function(){ return 2; }
    }
    A.prototype.m1 = function(){ return 1; };
    global.A = A;

    var a = new A();
    var b = load(store(a));

    this.assert
        ( b )
        ( b instanceof A )
        ( b.m2() == 2 )
        ( b.m1() == 1 );
})

/*

// TO-DO: this test is failing for some reason.

test( function threejson(){
    var a = {
        "metadata": {
            "generator": "io_three",
            "version": 4.4,
            "type": "Object"
        },
        "object": {
            "type": "Scene",
            "matrix": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
            "children": [{
                "name": "ID174.001",
                "uuid": "7A5EC089-E0D6-3F53-9C13-A1803AA8BE18",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID178.001",
                "uuid": "6C04E91E-DFC6-3713-B971-D8236A7B8D69",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID182.001",
                "uuid": "BCCAA549-2BF1-30CA-8869-30773EA087A2",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID186.001",
                "uuid": "E891B4E0-63C7-31EB-AA77-FFA6ABE7799C",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID190.001",
                "uuid": "E66B49D5-A710-36DA-86BE-4800311D767C",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID194.001",
                "uuid": "B79C6E3F-9E22-3157-B3BE-885E2A976072",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID198.001",
                "uuid": "B0E6D5E0-66E7-3A4F-B62C-DDCC4D9699F6",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID202.001",
                "uuid": "F1C0A5B1-CD72-36EA-B694-047C168A8EB4",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID206.001",
                "uuid": "A99B4EF5-87C0-367A-9D6E-82C9D78914FA",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID210.001",
                "uuid": "FE8B0555-FC9C-377D-8E0E-953DBC00A624",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID214.001",
                "uuid": "49463BC9-5A0E-319E-A59D-D889D337BAC2",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID218.001",
                "uuid": "D05E420A-B33D-3DDD-B1EB-668773D63EA8",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID222.001",
                "uuid": "72366B0E-53AD-39E7-B92E-38348DD4D90B",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID226.001",
                "uuid": "8ADE278D-0269-3973-842A-53F011E19E0E",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID230.001",
                "uuid": "3460F7F8-49F5-37FC-B9D1-6BCE38AD1622",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID234.001",
                "uuid": "A205C69C-39FD-3A69-9106-A299FFF6B7AD",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID238.001",
                "uuid": "86474E88-C057-3AC9-B8C3-E2163F2E1060",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID242.001",
                "uuid": "DACA1A19-174E-345F-87EF-A53C92513982",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID246.001",
                "uuid": "09BE2C18-7062-3F77-873C-A1E13C901AF2",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID250.001",
                "uuid": "D50AB721-3495-3170-A6B4-74F5BBCECF87",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID254.001",
                "uuid": "8FDB8895-8792-3EF5-B81A-5FEB0816F79A",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID258.001",
                "uuid": "F8563A06-EAEC-3814-A87D-8C4B4866893C",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID262.001",
                "uuid": "EB23F004-8349-3C66-9A15-EB303269A6B0",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID266.001",
                "uuid": "10C2B8EE-705D-39CB-88CF-61AAB27BFF8F",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID270.001",
                "uuid": "FDADE43C-FB01-366F-92E0-22309DDFD370",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID274.001",
                "uuid": "BE168188-2A3B-3E3F-8FE2-FC0AFF33E07B",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID278.001",
                "uuid": "BDC2A51D-7560-3008-81B6-96C8377E0AEE",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID282.001",
                "uuid": "78B56B89-7290-361F-BA28-D3A74122868B",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID286.001",
                "uuid": "B77BA9DA-D780-3C9B-89CF-6C93BA7263E4",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID290.001",
                "uuid": "26C189D7-7193-3F96-8A2F-599F2C304FD8",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID294.001",
                "uuid": "EDBB0C5B-DAC5-346D-8A43-1C4C352744C0",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID298.001",
                "uuid": "684532CD-43FE-3672-9D0B-992FEA012A27",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID302.001",
                "uuid": "F5EFD1B0-4117-3244-BAF4-3A3CD273474F",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID306.001",
                "uuid": "3218348D-56F6-3D76-82C2-CC9021142755",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID310.001",
                "uuid": "6753B7B7-4FD5-3B07-B271-2094B4C7DE36",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID314.001",
                "uuid": "0449E2FA-B9C7-357D-BD35-1130E4E6B178",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID318.001",
                "uuid": "3BF07EDE-0C56-368E-B47F-9CC813A3B47C",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID322.001",
                "uuid": "C808FE8E-555D-3C16-9608-CA341638035D",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID326.001",
                "uuid": "B6AF312E-C05B-3A31-85B1-FC766672811B",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID330.001",
                "uuid": "2B6D633A-EDCB-3442-A7BD-DF32EF8AB413",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID334.001",
                "uuid": "60317AD0-B5A8-3E32-AAE8-5F412FEE3B91",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID338.001",
                "uuid": "2D43CFF2-64F9-3000-8F20-EA2DBA9C8471",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID342.001",
                "uuid": "320D58BB-D5E0-305D-A95C-25C78EFD4578",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID346.001",
                "uuid": "629152BE-0A17-3CD3-942C-8C9C872F5834",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID350.001",
                "uuid": "59E57B72-8D48-3487-AD2B-C9447B9FB1C0",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID354.001",
                "uuid": "CB2EDD40-66F7-3F76-98B8-6027A63969FC",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID358.001",
                "uuid": "7F548CF0-7864-3D80-9151-EC2AFB84CD38",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID362.001",
                "uuid": "DE2F0CB5-3C12-309D-88C7-D7C8A66AD010",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID366.001",
                "uuid": "2F7A9C08-AD4A-3EE9-9DDB-6380E2EC5342",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID370.001",
                "uuid": "9D0377FA-7BB8-3AF8-9161-659768DA8E17",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID374.001",
                "uuid": "8B1ECA50-A1ED-382A-BCC5-9B211E190154",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID378.001",
                "uuid": "A7815309-CBBD-3030-833B-3290897A5979",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID382.001",
                "uuid": "C5AECB74-5AF6-38F5-8012-219047159B38",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID386.001",
                "uuid": "ED528121-4467-3E65-B60B-F90431368A3C",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID390.001",
                "uuid": "890CE131-91B2-3D18-8306-26522F52C969",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID394.001",
                "uuid": "AE70B89C-2867-3E3D-9DE0-0764B635DA95",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID398.001",
                "uuid": "F96557E9-2F82-3652-A371-3D9EC84DA696",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID402.001",
                "uuid": "4ADC3446-36DA-31EB-8770-E47124EC3DAC",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID406.001",
                "uuid": "26381F6E-38F1-3298-B107-A55691E4112E",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID410.001",
                "uuid": "9D8928C4-1E3B-3FD6-9E82-E49BF0883F13",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID414.001",
                "uuid": "CE24A1A1-28DB-3402-B9BE-64F63404C5C5",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID418.001",
                "uuid": "238B0675-D20E-321E-B0C1-5B86D98AE26B",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID422.001",
                "uuid": "EAA40E93-CC85-33E2-A699-FCE1900D7477",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID426.001",
                "uuid": "4C5A320B-BDC7-377B-938A-2E7ABB4D0598",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID430.001",
                "uuid": "9E7F549C-B2DF-38CF-B944-63DE4013C6E5",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID434.001",
                "uuid": "1DE03CBF-46B9-3ADA-B016-3DD5C489C77C",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID438.001",
                "uuid": "B41F50A3-5AEE-3FF0-B3B7-1912822F1FE9",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID442.001",
                "uuid": "7BD237FF-E097-387D-8E93-4F9570E06107",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID446.001",
                "uuid": "0D6602BE-4F24-35C9-800C-1FC4C8A590C3",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID450.001",
                "uuid": "81487C4C-C44B-3F8A-9730-69849D9CF157",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID454.001",
                "uuid": "01E720EC-5AF5-3791-AC70-46FA5B8C0DB8",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID458.001",
                "uuid": "FC4E1751-C5F8-3133-A605-9D21D68611D1",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID462.001",
                "uuid": "477BFA39-7DD5-32EF-AAAD-6D0746E5C73B",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID466.001",
                "uuid": "C14C83C7-4A78-33FB-B016-000C0191A5B5",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "ID470.001",
                "uuid": "6A7607DC-6663-3CCC-8769-BB13C2F601DB",
                "matrix": [-1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
                "visible": true,
                "type": "Object"
            },{
                "name": "instance_10.001",
                "uuid": "FABD15CE-B305-3E48-8FEF-B0DB492A2D24",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,0.593701,-0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_2.015",
                    "uuid": "44792643-AB0E-3AD6-A9AA-2B3103D67461",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,0,0,-0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "71C158B3-78B9-302A-AB61-37BC09EF2E90",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "AD2E111C-985E-347E-9FC9-C14B83D4CFB6"
                }]
            },{
                "name": "instance_11.001",
                "uuid": "A2928166-36E3-3BFE-88C4-AF86E8E7EB1B",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,0.493701,-0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_1.009",
                    "uuid": "20650F09-1FDA-3E42-AF8A-B99521E99EB2",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,-4e-06,0,-0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "CC757FE8-196C-3EE3-B9C5-231C539AFF31",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "889997B0-1A3A-3CD3-9972-FAB63A58AE88"
                }]
            },{
                "name": "instance_12.001",
                "uuid": "38640423-6D3E-3328-BF46-6CDF72CCD33E",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,0.693701,-0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_2.014",
                    "uuid": "CCF365D8-8CB5-3668-849B-255B3F0C075E",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,0,0,-0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "A57264C1-6699-35E8-96EC-46637BA5F35E",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "DB28B6EA-28E8-36D3-9380-D313EB3967A8"
                }]
            },{
                "name": "instance_13.001",
                "uuid": "0B6CEED9-A519-330F-A766-2830EE16E1C5",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,-0.593701,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_2.018",
                    "uuid": "CEFE5640-B83C-3B76-B682-08CF70CA85BF",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,0,0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "A7A1B42E-6F60-3C28-8F73-1F207E5B9140",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "26385B27-4430-35E6-BB05-AB7AE92E87B6"
                }]
            },{
                "name": "instance_14.001",
                "uuid": "E6F90FEC-9A96-321C-AB07-73EAE9B3A329",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,-0.693701,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_1.007",
                    "uuid": "7676987D-04CB-3284-BD95-089BA3AE9773",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,0,0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "560285B7-C0B5-32BE-98F1-6C2CB3AA722E",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "E90A65DC-3E0D-3F1F-BCA2-4F1906068069"
                }]
            },{
                "name": "instance_15.001",
                "uuid": "C6E5443A-B62F-36BA-A9DD-C283DE6493BB",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,-0.493701,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_2.017",
                    "uuid": "30059884-2563-3A15-85C9-88371719D916",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,4e-06,0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "715FE4FE-F19C-390A-94D8-D78858601B37",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "059CEAB2-9703-3685-B1BF-2405B2A4CF86"
                }]
            },{
                "name": "instance_16.001",
                "uuid": "172DCDC4-2F03-3E52-A1DD-BF6499CC518A",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,0.1,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_2.012",
                    "uuid": "B8CCF40B-8713-3C76-AB0D-E683957AA769",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,1e-06,0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "E5C33156-BA20-397F-9E61-ED1F7F431722",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "1A5C8DA6-0621-34A4-A259-7F17D89371ED"
                }]
            },{
                "name": "instance_17.001",
                "uuid": "7D588A55-C6B8-3BFD-A227-DA90EA3F3E29",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,-0.1,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_1.010",
                    "uuid": "7A556A7F-83DF-3276-A6D4-64C227B90359",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,-1e-06,0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "114E90A3-B0C0-3CAD-91A0-90CDA687DDD5",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "37159F16-F3A7-369E-802A-3B97C9795804"
                }]
            },{
                "name": "instance_18.001",
                "uuid": "223A2578-06A9-358F-9C51-6A4850D51427",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,0,0,-0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_2.013",
                    "uuid": "4ECC9DE9-9675-3FC0-9A62-8DC0CEE8603D",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,0,-0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "3D4B1B16-CE9E-3CC1-A702-3EF4EDF1BA35",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "2E7FE112-D814-3AF1-950F-74ACEF387701"
                }]
            },{
                "name": "instance_19.001",
                "uuid": "7EE5EB3D-F29E-3B38-A2A2-56A3D44C1F91",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,-0.19685,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_2.021",
                    "uuid": "8E3012C6-B0FA-3B73-8005-6E5B541FB4D1",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,0,0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "774CA365-E828-35B4-8646-CF013EF6F9AA",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "89AF8581-5073-3295-964D-B7923651B8FA"
                }]
            },{
                "name": "instance_20.001",
                "uuid": "15FBD01C-4CB3-33AB-A5DB-2AF0DBAC6FBF",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,-0.29685,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_2.016",
                    "uuid": "69039E06-2CA0-3A7B-968F-6D2B23932732",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,2e-06,0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "BBF44B76-3C6A-3B42-815A-75838D8FD131",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "B988BEE5-5F9E-3D39-A31F-605E61431FF9"
                }]
            },{
                "name": "instance_21.001",
                "uuid": "7249BAB9-02EF-31EF-9E6B-B7397AC1C49B",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,-0.39685,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_1.006",
                    "uuid": "A57EEBDF-2427-30FF-B9AD-18D8F477D44D",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,4e-06,0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "A05335A0-0AFD-3CB1-B70C-7B9C19987CF5",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "1F7BE7A1-4015-3C45-9438-5A5E26C6DBC1"
                }]
            },{
                "name": "instance_7.001",
                "uuid": "01BEA893-FFDE-3542-8A3A-CC453A34E1D9",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,0.29685,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_2.019",
                    "uuid": "3BF00935-7214-3BA3-AABB-204F9401080B",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,-2e-06,0,-0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "0E8F2D10-501C-39E3-9491-6DA909748812",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "FFA6F583-CF2B-3DEF-A493-FA262156A2DB"
                }]
            },{
                "name": "instance_8.001",
                "uuid": "E884254B-70E0-3067-B6BD-DAAC041935FF",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,0.19685,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_1.008",
                    "uuid": "C304A0A2-35F7-30F1-8436-885E58AFDFB2",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,0,0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "08B52D0A-085F-3877-8606-46FD3D9EB11A",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "22808256-E171-322C-884F-D8BF600B40EB"
                }]
            },{
                "name": "instance_9.001",
                "uuid": "4A62C905-BABB-3FF4-ABF5-2E5128F4FE08",
                "matrix": [-0.01,-0,0,0,0,-0,0.01,0,-0,0.01,0,0,0.39685,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "pin_2.020",
                    "uuid": "F7E243BC-1D58-353B-BDB6-E93A7161652C",
                    "matrix": [1,0,-0,0,0,1,0,0,0,0,1,0,-4e-06,0,0,1],
                    "visible": true,
                    "type": "Mesh",
                    "material": "08271DEA-F9D5-3ABD-ACBE-02E39B8A3231",
                    "castShadow": true,
                    "receiveShadow": true,
                    "geometry": "9929E54E-6440-3A3D-B6AB-46774A96106C"
                }]
            },{
                "name": "SketchUp",
                "uuid": "AD7B3BBF-7EF3-3A6E-B4E4-410D3863EA19",
                "matrix": [-0.0254,0,0,0,0,-0.0254,-0,0,0,-0,0.0254,0,0,0,0,1],
                "visible": true,
                "type": "Object",
                "children": [{
                    "name": "instance_0",
                    "uuid": "A78E04FE-6C3B-300D-B612-245C54C17E03",
                    "matrix": [1,0,-0,0,0,-1,0,0,-0,0,-1,0,0.444472,-0.663386,2.03021,1],
                    "visible": true,
                    "type": "Object",
                    "children": [{
                        "name": "Arduino_Nano",
                        "uuid": "C3BEDE4A-AB04-3B1F-A179-E04862107D75",
                        "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                        "visible": true,
                        "type": "Mesh",
                        "material": "A75C46B1-B415-3C97-9886-42D5981E5023",
                        "castShadow": true,
                        "receiveShadow": true,
                        "geometry": "9A08F511-0964-3B76-B803-6271DABF9D8A",
                        "children": [{
                            "name": "group_0",
                            "uuid": "FC77151B-8555-376C-B04D-004B39224D9D",
                            "matrix": [1,0,-0,0,-0,-1,0,0,-0,0,-1,0,0.212677,-0.306693,1.81344,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "AF8E39D0-C1BB-38E3-B571-CA5656512726",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "4471B9EF-3A18-3BDC-B738-2490AC004F13",
                            "children": [{
                                "name": "ID25",
                                "uuid": "1BB39593-7DAD-330D-B236-4767E8AA221A",
                                "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,0,-0,-0,1],
                                "visible": true,
                                "type": "Mesh",
                                "material": "AF8E39D0-C1BB-38E3-B571-CA5656512726",
                                "castShadow": true,
                                "receiveShadow": true,
                                "geometry": "61BCB1C6-6F3A-31C7-B6BC-015007850159"
                            },{
                                "name": "ID35",
                                "uuid": "D1853421-10C3-3B14-9D42-1E3198FC9210",
                                "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,0,-0,-0,1],
                                "visible": true,
                                "type": "Mesh",
                                "material": "AF8E39D0-C1BB-38E3-B571-CA5656512726",
                                "castShadow": true,
                                "receiveShadow": true,
                                "geometry": "627DAE5E-2C88-3384-BC90-5954B7283D07"
                            },{
                                "name": "ID45",
                                "uuid": "36FADA53-CF07-37A0-83BA-BA229FB14FEE",
                                "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,0,-0,-0,1],
                                "visible": true,
                                "type": "Mesh",
                                "material": "AF8E39D0-C1BB-38E3-B571-CA5656512726",
                                "castShadow": true,
                                "receiveShadow": true,
                                "geometry": "DFC6DB66-ABF8-3623-87A5-E3548B01340D"
                            },{
                                "name": "ID55",
                                "uuid": "B8F15A2B-06DB-3ECF-A06F-D7A7C782B979",
                                "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,0,-0,-0,1],
                                "visible": true,
                                "type": "Mesh",
                                "material": "AF8E39D0-C1BB-38E3-B571-CA5656512726",
                                "castShadow": true,
                                "receiveShadow": true,
                                "geometry": "550D5815-AB70-3A0F-8DA9-F285BEC5AB95"
                            },{
                                "name": "ID65",
                                "uuid": "27DB866B-DB59-3566-8014-693E840696FF",
                                "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,0,-0,-0,1],
                                "visible": true,
                                "type": "Mesh",
                                "material": "07664766-12CB-3998-ABC0-27BCF2EF7B82",
                                "castShadow": true,
                                "receiveShadow": true,
                                "geometry": "60CB4A99-1DE8-33B7-B3A5-8E42B5FD4929"
                            },{
                                "name": "ID75",
                                "uuid": "EA0F4252-9739-3F5F-B4DF-4FBDB1EBAACA",
                                "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,0,-0,-0,1],
                                "visible": true,
                                "type": "Mesh",
                                "material": "AF8E39D0-C1BB-38E3-B571-CA5656512726",
                                "castShadow": true,
                                "receiveShadow": true,
                                "geometry": "71D1AF13-AF4E-3E4A-A8CB-62A7EF5D255D"
                            },{
                                "name": "ID85",
                                "uuid": "F88BBA85-D477-388E-A681-5EAB9525389B",
                                "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,0,-0,-0,1],
                                "visible": true,
                                "type": "Mesh",
                                "material": "AF8E39D0-C1BB-38E3-B571-CA5656512726",
                                "castShadow": true,
                                "receiveShadow": true,
                                "geometry": "68FFE787-DE97-347C-B80E-EF543A72C76F"
                            },{
                                "name": "ID95",
                                "uuid": "DCBEBCF5-29EE-3B83-AFAC-CD8EA2B9A7B3",
                                "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,0,-0,-0,1],
                                "visible": true,
                                "type": "Object"
                            }]
                        },{
                            "name": "ID493",
                            "uuid": "3E104F8A-4555-39DC-B35C-3D5D37AC53AB",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "FB007F4F-B5A8-3729-91F9-E6E0A773569C",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "92351E03-DD6E-3789-BDFD-42EF2DBFAB61"
                        },{
                            "name": "ID503",
                            "uuid": "AA28DB4F-A7AA-3846-8792-4DF69DFF3A41",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "A75C46B1-B415-3C97-9886-42D5981E5023",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "2999DB1F-9585-37AB-9B7D-45B5C56880A5"
                        },{
                            "name": "ID513",
                            "uuid": "E15A6D2B-4AF6-398C-AE57-4F6D1280481F",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "410D79C3-992F-368E-9644-883E7849DD33"
                        },{
                            "name": "ID530",
                            "uuid": "4D53B5E4-CAA2-3532-BD11-BEA082DC6A57",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "FB007F4F-B5A8-3729-91F9-E6E0A773569C",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "E29072AC-2015-3398-B90A-93A7735F8753"
                        },{
                            "name": "ID540",
                            "uuid": "4E01B557-A68D-3F96-8512-3C648AF6833F",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "A75C46B1-B415-3C97-9886-42D5981E5023",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "01431A4B-F789-370D-B767-8AB2E8E9083A"
                        },{
                            "name": "ID550",
                            "uuid": "32ACD015-CD1B-3631-92DD-E09AED76D292",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "A75C46B1-B415-3C97-9886-42D5981E5023",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "FF35E6C7-DFA2-3092-8AC0-3BED4A410CA9"
                        },{
                            "name": "ID560",
                            "uuid": "D7C59320-0420-3DDC-934A-DC1ADA00A282",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "8AED80A9-BAC9-38AF-9781-EEB691C96440"
                        },{
                            "name": "ID572",
                            "uuid": "7FBEC31D-1FD3-31C5-8AE2-29709117B247",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "1BDE687F-9DFE-3E5F-92FA-92352C94C7C0"
                        },{
                            "name": "ID587",
                            "uuid": "EDAB9476-3B72-37B7-B8BD-F90894486D19",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "A7D67BB3-C43E-311E-8FC9-A92E5068F33D"
                        },{
                            "name": "ID599",
                            "uuid": "7E703672-347A-31C4-B9A8-3E00E2DEAD3C",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "7A8ACABB-D06D-36B0-9DB2-F41A927C627A"
                        },{
                            "name": "ID609",
                            "uuid": "F26A839C-7CD0-340E-9AF1-B9EF77F237F2",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "A75C46B1-B415-3C97-9886-42D5981E5023",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "6231C51E-34FC-33F6-BB8D-7A3CC85F4840"
                        },{
                            "name": "ID619",
                            "uuid": "06420187-6FDE-365D-9B24-23D48F870A41",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "F3C9A248-DB38-3EBB-BE90-58ECED44E2BF"
                        },{
                            "name": "ID629",
                            "uuid": "C7501D7B-3E0D-307B-ACA6-350A73BE5369",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "F24BDE7E-2329-3FFE-A2CC-13777F6BED0B"
                        },{
                            "name": "ID639",
                            "uuid": "E56A2F4B-28F5-3908-8946-8BA2F1992C36",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "FB007F4F-B5A8-3729-91F9-E6E0A773569C",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "D1CC1563-A9A1-360D-8363-0D8E09A5B122"
                        },{
                            "name": "ID649",
                            "uuid": "63F3B485-DCB7-37EE-902B-85EDE52052FA",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "FB839AA1-AEF0-3F01-8674-60F0657AA29D"
                        },{
                            "name": "ID664",
                            "uuid": "724E5C13-7C86-3DB0-95C3-35DDB1933DE0",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "3C6A3809-796B-3CA7-B5EF-F2E04C2F8C48"
                        },{
                            "name": "ID674",
                            "uuid": "04479401-0064-32EF-AE7B-2E6E41694A6C",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "FB007F4F-B5A8-3729-91F9-E6E0A773569C",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "E03F1779-5F75-33B3-A281-71663F5FD063"
                        },{
                            "name": "ID684",
                            "uuid": "FDB3DF83-36FA-3A8B-9ACB-78FCD0DF2185",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "3FFE75C8-E21D-3A6D-AA2A-D26467E83391"
                        },{
                            "name": "ID694",
                            "uuid": "09612F15-6620-385A-B49D-041F84E0EFFD",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "37AD6ECE-D897-36C9-B21A-84755694786C"
                        },{
                            "name": "ID704",
                            "uuid": "F4B00841-3C2C-337C-9731-3769AF656FAE",
                            "matrix": [1,0,0,0,0,1,0,0,-0,0,1,0,0,-0,0,1],
                            "visible": true,
                            "type": "Mesh",
                            "material": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
                            "castShadow": true,
                            "receiveShadow": true,
                            "geometry": "9EBEB9DE-D50F-398B-9CA9-CA154B8E53AC"
                        },{
                            "name": "instance_1",
                            "uuid": "A70F84D1-6D34-3C51-A529-DCAAE462DD42",
                            "matrix": [-0.01,-0,-0,0,-0,0.01,0,0,0,0,-0.01,0,0.434521,-0.068898,0.112983,1],
                            "visible": true,
                            "type": "Object",
                            "children": [{
                                "name": "ELEC_23_2Pins_3",
                                "uuid": "BC337698-CEA5-3AF7-B290-CB265E0B04C3",
                                "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,-5e-06,7e-06,1],
                                "visible": true,
                                "type": "Object",
                                "children": [{
                                    "name": "instance_2",
                                    "uuid": "4C4BC523-452C-369C-9322-D8D21BCC669B",
                                    "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,3.42278,-4e-06,3.42278,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2",
                                        "uuid": "7E524DBA-57E9-368F-9CE2-A8678BE66F45",
                                        "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,-4e-06,2.3e-05,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "7149AAE1-8FEC-38DA-BBE1-A3B81C83675B",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "D6CCECB4-C9D3-34D0-B275-2862DB722996"
                                    }]
                                },{
                                    "name": "instance_3",
                                    "uuid": "52C4EE75-F615-3A30-B333-D8460D40176A",
                                    "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,13.4228,-4e-06,3.42278,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_1",
                                        "uuid": "0855D835-E64E-3A11-9B06-4789B1A35D4E",
                                        "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,-4e-06,2.3e-05,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "7149AAE1-8FEC-38DA-BBE1-A3B81C83675B",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "A78FDF46-E524-37DE-ACC8-189CBBEF71CF"
                                    }]
                                },{
                                    "name": "instance_4",
                                    "uuid": "EF72E624-D1CA-321E-9541-7BA171B19B32",
                                    "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,-6.57722,-4e-06,3.42278,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.001",
                                        "uuid": "2DF9DAFA-B324-3853-B124-A37472B5413C",
                                        "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,-4e-06,2.3e-05,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "0ADE688F-692C-3DE3-B277-0C1A0E203D03",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "F24808D6-9B74-3742-9B19-4D91984252B0"
                                    }]
                                },{
                                    "name": "instance_5",
                                    "uuid": "544D8E68-F4D6-3B32-B54D-C4E9EFAB0C26",
                                    "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,-13.7795,9e-06,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "block_1",
                                        "uuid": "E301DFE0-A711-3570-94F3-89A2FDB424C4",
                                        "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,-1e-06,-6e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "0CE53820-F636-37B3-A292-DA0E2CBAE0C6",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "88554500-ACE7-3253-917C-D27FA91CB31B"
                                    }]
                                }]
                            }]
                        },{
                            "name": "instance_22",
                            "uuid": "278D5E2D-7F33-315D-92F2-7C70F41B3F5F",
                            "matrix": [-0.01,-0,-0,0,-0,0.01,0,0,0,0,-0.01,0,0.434521,-0.068898,0.212983,1],
                            "visible": true,
                            "type": "Object",
                            "children": [{
                                "name": "ELEC_23_2Pins_3.001",
                                "uuid": "380244BE-2F63-3C47-AD62-8E30E28D83C8",
                                "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,2e-06,7e-06,1],
                                "visible": true,
                                "type": "Object",
                                "children": [{
                                    "name": "instance_2.001",
                                    "uuid": "028B60C3-AD67-3460-A789-0DD1AA186E32",
                                    "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,3.42278,2e-06,3.42278,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.022",
                                        "uuid": "CF533F7F-165A-3C72-9A78-F6E437EC2F35",
                                        "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,-2e-06,2.3e-05,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "1823B8E2-1824-3213-AD2F-76A1801BE88F",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "911254FF-0E72-34F0-9322-90AD7D547C6A"
                                    }]
                                },{
                                    "name": "instance_3.001",
                                    "uuid": "AA51E6D9-2634-36C1-9D3D-A11CB58DC817",
                                    "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,13.4228,2e-06,3.42278,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_1.011",
                                        "uuid": "AB6A72E7-4523-3F05-801C-F54D789C985A",
                                        "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,-2e-06,2.3e-05,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "0F86A3A0-90F9-3321-9D8E-5E518751EC19",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "9A52E88D-D34E-3A41-9C17-67ED9AA105CF"
                                    }]
                                },{
                                    "name": "instance_4.001",
                                    "uuid": "D7960EBF-4F67-3014-BBE9-4A04AC7CAA87",
                                    "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,-6.57722,2e-06,3.42278,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.023",
                                        "uuid": "F3C52FF0-E3FF-3FEA-9E38-B6E769350BC1",
                                        "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,-2e-06,2.3e-05,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "E0DB43E0-3F06-3994-821A-75C5E23CFFB5",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "3AE40213-F5F7-3055-97B3-41E0031483EA"
                                    }]
                                },{
                                    "name": "instance_5.001",
                                    "uuid": "35CAB677-B147-3A23-805B-2E5B198AE14E",
                                    "matrix": [1,-0,0,0,-0,1,0,0,-0,0,1,0,0,-13.7795,9e-06,1],
                                    "visible": true,
                                    "type": "Object"
                                }]
                            }]
                        },{
                            "name": "instance_23",
                            "uuid": "C9A7C864-CB5C-3421-9D53-691EBA69CD03",
                            "matrix": [-0,0,-1,0,0,-1,0,0,-1,-0,-0,0,0.075772,-0.594488,0.871323,1],
                            "visible": true,
                            "type": "Object"
                        },{
                            "name": "instance_6",
                            "uuid": "E26F138A-90FD-3E0D-ADD4-34028C23A27B",
                            "matrix": [-0,0,-1,0,0,-1,0,0,-1,-0,-0,0,0.685772,-0.594488,0.871182,1],
                            "visible": true,
                            "type": "Object",
                            "children": [{
                                "name": "ELEC_23_2Pins_2",
                                "uuid": "62054677-09CC-3A31-89CB-FD9F842A08F2",
                                "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                "visible": true,
                                "type": "Mesh",
                                "material": "0CE53820-F636-37B3-A292-DA0E2CBAE0C6",
                                "castShadow": true,
                                "receiveShadow": true,
                                "geometry": "E7960076-46CF-3C6D-8706-D662CF402CD4",
                                "children": [{
                                    "name": "ID174",
                                    "uuid": "F1277DE9-EF4F-3F3D-AB99-EC9ADDA725BC",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID178",
                                    "uuid": "FE55AA1F-0ECD-3C2B-8A19-206450053F11",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID182",
                                    "uuid": "95EB5F03-E834-3F5D-8567-140206432271",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID186",
                                    "uuid": "2E5DA2CA-989F-374E-9540-31AAE3381EA8",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID190",
                                    "uuid": "E9DC6993-21D4-3EEB-AEC7-83F4C108AC12",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID194",
                                    "uuid": "3630F766-24E0-399E-9F7F-6560F124511E",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID198",
                                    "uuid": "7DB6AA23-DB1E-3181-8916-4C07A1A7614B",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID202",
                                    "uuid": "C331CCB5-C099-3E62-B13F-55B8B1A910BC",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID206",
                                    "uuid": "D4E0370D-953F-364C-9F75-3826255EC185",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID210",
                                    "uuid": "31F3A97B-3A7C-3CFF-A2FE-2EB931073EA3",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID214",
                                    "uuid": "A1480770-D88A-3FCD-873D-BAB28BD1CC01",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID218",
                                    "uuid": "60553C6B-166D-34A2-8024-09924340BE9B",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID222",
                                    "uuid": "2C6C8CD7-B0CD-3D8C-8EF9-692977DF8BC3",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID226",
                                    "uuid": "56532D69-BB1B-3C1F-8F58-5D57D1737663",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID230",
                                    "uuid": "1731593A-2BBE-3E1C-9FE9-40DD15CC5686",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID234",
                                    "uuid": "29262F79-8966-385E-A4C1-56F5CEA3ADA7",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID238",
                                    "uuid": "90E3BB5B-22CE-3434-9498-30E3AE0C64B1",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID242",
                                    "uuid": "E5BB16C6-85AF-3424-8D8D-CD3244A90E9C",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID246",
                                    "uuid": "6A802027-4534-342B-AB20-0377F56CBE8F",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID250",
                                    "uuid": "C4B2F4F7-1255-3FC1-AA27-12102A6A992F",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID254",
                                    "uuid": "E9F819F0-A80F-396F-B4CF-6EEE7E212AA1",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID258",
                                    "uuid": "F0ACB8E0-8EA9-30A2-8B7B-36E83532ACA9",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID262",
                                    "uuid": "8D7A6093-134B-3A3E-A126-A110C0425CE7",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID266",
                                    "uuid": "0619D358-13B7-39B1-83C7-C3F4F80949F6",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID270",
                                    "uuid": "F8130E3A-D0EB-3A10-B6EE-7F85737FFA1F",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID274",
                                    "uuid": "FC41E3BF-C8B0-3185-A867-FF3450847CE8",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID278",
                                    "uuid": "9AA8D703-6F6B-3F56-9912-8D541E323925",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID282",
                                    "uuid": "979D006B-8A11-3EF3-B1C7-66A39D34B5B1",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID286",
                                    "uuid": "3FA2456C-9589-3789-AE2A-047FF3D0E017",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID290",
                                    "uuid": "F54C014B-75C9-3735-A4A3-7BF7C2CF9023",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID294",
                                    "uuid": "A4273C26-4DF4-3234-B885-5E0F77A54797",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID298",
                                    "uuid": "C0F8DB86-B5FD-36BF-AA62-A00BADD223BF",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID302",
                                    "uuid": "6A41A537-23BF-3830-9DFA-8B46581B8717",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID306",
                                    "uuid": "EBE98765-E33C-3A7B-92C5-E8E6BCB19A0E",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID310",
                                    "uuid": "1DDFF9FE-DDB2-329B-903E-1D0A687D2061",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID314",
                                    "uuid": "C6D2638C-313B-32F9-BDDC-8B74622278A6",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID318",
                                    "uuid": "071071D2-8AC7-343A-B5DC-09B3E11D5D91",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID322",
                                    "uuid": "DFCFE44F-C561-358E-9D4E-46FC32E64853",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID326",
                                    "uuid": "599434B8-4C97-38BA-BDE8-EFAE7573CF78",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID330",
                                    "uuid": "6A9A2C91-0A84-3490-B459-313AA82AC5ED",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID334",
                                    "uuid": "718D6CC8-CF12-3D39-8170-0C35EED22133",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID338",
                                    "uuid": "09A372FC-C3DE-3074-8C79-6173DCC997B2",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID342",
                                    "uuid": "68196D43-FC83-3B34-BFDC-1C5735175203",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID346",
                                    "uuid": "FE403628-4792-3E12-BC06-80D2EE8BCE73",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID350",
                                    "uuid": "9ABB7F04-A400-3A2D-B6A9-CF74B0E44FAD",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID354",
                                    "uuid": "AC18B2CD-C49A-3220-88C6-4BB098934FFD",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID358",
                                    "uuid": "23DC924C-9062-36FB-8E11-E55D0A68D542",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID362",
                                    "uuid": "9E136716-1B20-3F74-AC6F-67AF59DCDD68",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID366",
                                    "uuid": "61EF986A-3903-3D2A-97C0-D477AAEE9156",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID370",
                                    "uuid": "A07972B7-33A6-3098-991A-2624036F47C8",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID374",
                                    "uuid": "D411E341-9FBE-3527-B53F-E19BBF5DDE9A",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID378",
                                    "uuid": "ED363D6D-F519-3644-8FF5-F3D1DF6AE9E3",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID382",
                                    "uuid": "6080EC6F-F762-371E-AA29-93755E79D00A",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID386",
                                    "uuid": "9637715E-62C6-3378-9487-5BA9D229EA85",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID390",
                                    "uuid": "B9B2A71C-4245-393E-B964-45B6AD000552",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID394",
                                    "uuid": "80C952CB-BCE2-35E6-A73B-B759F8DC4001",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID398",
                                    "uuid": "E3D7CC78-FBA2-39D9-9241-05E0CB9A210B",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID402",
                                    "uuid": "006289E7-0B9C-3566-8BB6-8BBE7BD60EE8",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID406",
                                    "uuid": "39A3929B-F6B3-39C9-8299-8FD748F13C9B",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID410",
                                    "uuid": "052C6BAF-2A3A-3DC9-8E92-41472C5E90A0",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID414",
                                    "uuid": "FF09BE2F-9178-3F58-B866-FF3BE3DB261A",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID418",
                                    "uuid": "DEDBC853-FE02-320A-BCEA-61585985E156",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID422",
                                    "uuid": "1DB5ABEF-9900-326A-B1A8-2D23D6852471",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID426",
                                    "uuid": "66A78F0F-73F1-3026-B884-FC56ED88006D",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID430",
                                    "uuid": "52318C0C-7609-3E26-A0FF-C63432EC0566",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID434",
                                    "uuid": "215E0F57-5E21-31E5-86B2-05248462C6E5",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID438",
                                    "uuid": "3A90173F-DA8A-3AF6-8625-5C87324D8342",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID442",
                                    "uuid": "0828A86B-0065-33B3-8A4B-C95F58AAF9E5",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID446",
                                    "uuid": "BA8E4B8C-A9D9-30A4-8BDC-BEC6199FA390",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID450",
                                    "uuid": "8547FBF0-0C1B-3FD1-BC71-7153E8DDD116",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID454",
                                    "uuid": "F1ACD008-F3FD-3FF8-BF38-A52E96936EAA",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID458",
                                    "uuid": "7D82CC64-3DEC-3F39-8E98-9ED2118B204C",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID462",
                                    "uuid": "25A86B70-5A51-3F26-AAC4-905B87135176",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID466",
                                    "uuid": "D7212395-2D67-3E11-B444-9EB317FE11F8",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "ID470",
                                    "uuid": "ECDD6964-AF12-39BF-BF50-C15F98644216",
                                    "matrix": [1,-0,-0,0,0,1,0,0,0,-0,1,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object"
                                },{
                                    "name": "instance_10",
                                    "uuid": "E9F8D7B1-2031-3324-B145-284E36D1968D",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,-0.593701,-0,0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.008",
                                        "uuid": "A962C42D-B7CD-3ABF-A2D9-42C24015A182",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,3e-06,-0,-8e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "5C9EEB14-ADEE-3AF7-920C-2CC6079B45C1",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "AC2B12EA-9361-3E40-AD2A-0BC80A9E2598"
                                    }]
                                },{
                                    "name": "instance_11",
                                    "uuid": "D5613F86-6602-38A4-9231-DE3E13C680A6",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,-0.493701,0,0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_1.005",
                                        "uuid": "BA53F3F7-47B5-315A-A00A-F5E0438A4ACC",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,7e-06,-0,-9e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "3D851371-EDCE-309E-9A7F-F60CAF829268",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "0F01A96E-B4D6-3D8F-ACC0-81E00569B642"
                                    }]
                                },{
                                    "name": "instance_12",
                                    "uuid": "AEBA1EF2-26D3-39D1-B8DC-6A418E60A445",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,-0.693701,-0,0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.002",
                                        "uuid": "8A376667-343F-37B3-B2A3-2C6A1736D613",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,-1e-06,-1e-06,-6e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "50BBB7FB-44A1-31C0-89CB-7AC73A9657C5",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "6950AF9B-3670-397C-9661-A803DB45AEC6"
                                    }]
                                },{
                                    "name": "instance_13",
                                    "uuid": "5B246036-6046-3B87-BBC1-5D0D2676C6BA",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,0.593701,-0,0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.005",
                                        "uuid": "C817587B-3A7E-3FBD-BF4C-56DDD357B059",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,-1e-06,-1e-06,-8e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "4F23841D-F825-3FB0-9A89-A500ECA2129E",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "E3AA74C4-449B-3CF9-B64C-78CE8228911B"
                                    }]
                                },{
                                    "name": "instance_14",
                                    "uuid": "9479AE25-E536-3CB8-8D98-28473F86ECAB",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,0.693701,-0,-0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_1.004",
                                        "uuid": "17020554-27FA-31CB-B78E-978C4CF7E008",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,1.4e-05,-1e-06,-2e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "CB50B31A-38D8-30E6-9C02-F1DF7C2A5260",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "B0EC0887-9366-33F9-A485-4316189EE455"
                                    }]
                                },{
                                    "name": "instance_15",
                                    "uuid": "68DDDCE3-A2DB-3097-B195-6810E1617536",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,0.493701,-0,0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.006",
                                        "uuid": "981980D9-EF74-3549-B96A-A42B8A60DCD2",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,-1e-06,-0,-7e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "25583FD0-7AB2-3F60-B4B0-0AB20D082F06",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "5DB34F46-BE6A-3743-8DD3-C5A7D82EDB03"
                                    }]
                                },{
                                    "name": "instance_16",
                                    "uuid": "2A62BC86-E39C-33B2-8099-C97FF5289C1E",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,-0.1,-0,-0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.004",
                                        "uuid": "6C984D95-8D9F-3DCC-BD82-77D0A98F3C88",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,-1e-06,-0,-7e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "D1E30EED-8C44-3DF0-9B3D-B80AD658920A",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "82514B16-847C-30D3-972D-03A298E71186"
                                    }]
                                },{
                                    "name": "instance_17",
                                    "uuid": "A9A0B7E1-7131-3A4A-B380-EEDA6B735C8C",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,0.1,-0,-0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_1.003",
                                        "uuid": "5405B107-D505-3116-812B-EBE7F769673B",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,-1e-06,-1e-06,-9e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "1F78BD51-0276-3E55-9FE5-974CEECABFF5",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "D19B81F0-1FB8-3CA4-9709-86D6D9F5EF2D"
                                    }]
                                },{
                                    "name": "instance_18",
                                    "uuid": "A0A45BD6-03FB-34E1-ACF5-8925ABCDE52B",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,0,0,-0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.009",
                                        "uuid": "2188441B-31AC-33AA-908D-B58FF008A81D",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,-1e-06,-1e-06,-8e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "87266AB2-4402-38C2-908D-F486F86E932F",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "120C2C67-FBEE-327C-9E1F-0C67B2F38C52"
                                    }]
                                },{
                                    "name": "instance_19",
                                    "uuid": "06788954-4D00-3293-848D-5C1E617680E6",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,0.19685,-0,-0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.003",
                                        "uuid": "13B2E94C-1874-315D-A018-4A83B25FACB7",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,-1e-06,-1e-06,-3e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "91A4A4DC-E6CA-39D2-91BD-39E492819B77",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "6A228D8C-3B18-360D-B8EE-28AB73BBC815"
                                    }]
                                },{
                                    "name": "instance_20",
                                    "uuid": "5B49353D-AF6A-3408-A331-5BEBDC97E093",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,0.29685,-0,0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.011",
                                        "uuid": "0F77A289-A886-3451-8FCB-F79FA8A72C12",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,1.4e-05,-0,-4e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "F14FD73F-772A-3E35-9648-3F434687F99B",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "100B103A-CF7B-3105-AFD0-F4A6C0241712"
                                    }]
                                },{
                                    "name": "instance_21",
                                    "uuid": "65FBAD0E-EAFB-3718-8E9F-0CC5E01B9559",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,0.39685,-0,0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_1.001",
                                        "uuid": "B56E9B93-A198-3767-985A-AE7635AA76A2",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,1.4e-05,-0,-6e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "C83988B8-928C-37CF-B26B-417E7410410C",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "3B82A728-C110-396A-8217-94C100CE54A3"
                                    }]
                                },{
                                    "name": "instance_7",
                                    "uuid": "5FDC327D-D30A-3082-B6FD-F063E6C90FD8",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,-0.29685,-0,0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.007",
                                        "uuid": "057391DF-EE0B-3A04-BF84-CC49988A4444",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,-1e-06,-1e-06,-4e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "1CDF2094-F0CF-329C-9293-B3A98AFAB089",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "0E7F6C07-0036-3CF2-A61A-36FF9128BF73"
                                    }]
                                },{
                                    "name": "instance_8",
                                    "uuid": "C91CEFCF-6BAB-3730-800C-56614D3540C6",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,-0.19685,-0,-0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_1.002",
                                        "uuid": "92E39B36-747C-3145-A037-C44BEB7E77DF",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,7e-06,-1e-06,-5e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "C424DD96-604C-38AF-A52D-ABC498F9536E",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "19711DAF-357D-36AD-A97F-29C697D2B320"
                                    }]
                                },{
                                    "name": "instance_9",
                                    "uuid": "BFC5D93B-6C13-3463-9EE2-C31C52300E45",
                                    "matrix": [0.01,-0,-0,0,-0,0.01,0,0,0,-0,0.01,0,-0.39685,-0,0,1],
                                    "visible": true,
                                    "type": "Object",
                                    "children": [{
                                        "name": "pin_2.010",
                                        "uuid": "002C0809-77CC-3CD9-AD19-DB7C9222F7C0",
                                        "matrix": [1,-0,-0,0,0,1,0,0,0,0,1,0,-9e-06,-0,-3e-06,1],
                                        "visible": true,
                                        "type": "Mesh",
                                        "material": "B40B9823-322E-31BA-8C35-A7B71C1F8D34",
                                        "castShadow": true,
                                        "receiveShadow": true,
                                        "geometry": "AB085745-896D-3AAB-A8C3-F04632A12CAC"
                                    }]
                                }]
                            }]
                        }]
                    }]
                },{
                    "name": "skp_camera_Last_Saved_SketchUp_View",
                    "uuid": "9D9BC9A0-E51E-3F9A-8675-2E2B75DB2283",
                    "matrix": [0.65835,-0,0.752711,0,-0.630952,-0.545302,0.551856,0,0.410455,-0.83824,-0.359,0,2.41649,-3.65444,-0.319598,1],
                    "visible": true,
                    "type": "PerspectiveCamera",
                    "far": 25.4,
                    "near": 0.0254,
                    "aspect": 1.77778,
                    "fov": 50.7455
                }]
            }],
            "uuid": "69D4CE1B-D0DF-483E-8318-C410D340554D"
        },
        "textures": [{
            "magFilter": 1006,
            "image": "5B7F5289-4F87-350D-96C7-8DDF98948A44",
            "wrap": [1000,1000],
            "repeat": [1,1],
            "name": "__Metal_Aluminum_Anodized__jpg",
            "minFilter": 1008,
            "mapping": 300,
            "anisotropy": 1,
            "uuid": "2ADC6804-A828-31D2-8EDE-087C85BD1F7B"
        },{
            "magFilter": 1006,
            "image": "8A160F20-9E93-314E-9535-FE17A343B364",
            "wrap": [1000,1000],
            "repeat": [1,1],
            "name": "__Metal_Corrogated_Shiny__jpg",
            "minFilter": 1008,
            "mapping": 300,
            "anisotropy": 1,
            "uuid": "3F278713-310B-320B-BFF1-073AC7F5EBB4"
        },{
            "magFilter": 1006,
            "image": "53FACE63-28D8-3D9E-B193-E8CD9EA3B44D",
            "wrap": [1000,1000],
            "repeat": [1,1],
            "name": "__Metal_Panel__jpg",
            "minFilter": 1008,
            "mapping": 300,
            "anisotropy": 1,
            "uuid": "72983AA0-3D13-3DD9-A89C-5D29531A7A06"
        },{
            "magFilter": 1006,
            "image": "91442881-DD37-3455-A427-3F509D465FFF",
            "wrap": [1000,1000],
            "repeat": [1,1],
            "name": "__Metal_Rough__jpg",
            "minFilter": 1008,
            "mapping": 300,
            "anisotropy": 1,
            "uuid": "E16281F4-32CE-3EA3-852C-913707426F01"
        },{
            "magFilter": 1006,
            "image": "BB8B1D31-1CA5-3E87-8343-A8CF47EA0E32",
            "wrap": [1000,1000],
            "repeat": [1,1],
            "name": "material_8_jpg",
            "minFilter": 1008,
            "mapping": 300,
            "anisotropy": 1,
            "uuid": "D2505C06-BC95-3E16-8299-0EFEAD7A1B15"
        },{
            "magFilter": 1006,
            "image": "954B572A-F04F-311F-AC5E-87EC566D3BC8",
            "wrap": [1000,1000],
            "repeat": [1,1],
            "name": "material_9_jpg",
            "minFilter": 1008,
            "mapping": 300,
            "anisotropy": 1,
            "uuid": "F74BC686-68E2-3146-8032-7F900597D08A"
        }],
        "animations": [{
            "name": "default",
            "tracks": [],
            "fps": 29
        }],
        "images": [{
            "name": "__Metal_Aluminum_Anodized_.jpg",
            "url": "__Metal_Aluminum_Anodized_.jpg",
            "uuid": "5B7F5289-4F87-350D-96C7-8DDF98948A44"
        },{
            "name": "__Metal_Corrogated_Shiny_.jpg",
            "url": "__Metal_Corrogated_Shiny_.jpg",
            "uuid": "8A160F20-9E93-314E-9535-FE17A343B364"
        },{
            "name": "__Metal_Panel_.jpg",
            "url": "__Metal_Panel_.jpg",
            "uuid": "53FACE63-28D8-3D9E-B193-E8CD9EA3B44D"
        },{
            "name": "__Metal_Rough_.jpg",
            "url": "__Metal_Rough_.jpg",
            "uuid": "91442881-DD37-3455-A427-3F509D465FFF"
        },{
            "name": "material_8.jpg",
            "url": "material_8.jpg",
            "uuid": "BB8B1D31-1CA5-3E87-8343-A8CF47EA0E32"
        },{
            "name": "material_9.jpg",
            "url": "material_9.jpg",
            "uuid": "954B572A-F04F-311F-AC5E-87EC566D3BC8"
        }],
        "materials": [{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "A75C46B1-B415-3C97-9886-42D5981E5023",
            "ambient": 16053468,
            "type": "MeshPhongMaterial",
            "name": "__0049_Beige_",
            "shininess": 50,
            "color": 16053468
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "0CE53820-F636-37B3-A292-DA0E2CBAE0C6",
            "ambient": 5329233,
            "type": "MeshPhongMaterial",
            "name": "__0135_DarkGray_",
            "shininess": 50,
            "color": 5329233
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "FB007F4F-B5A8-3729-91F9-E6E0A773569C",
            "ambient": 2236962,
            "type": "MeshPhongMaterial",
            "name": "__0136_Charcoal_",
            "shininess": 50,
            "color": 2236962
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "7149AAE1-8FEC-38DA-BBE1-A3B81C83675B",
            "map": "2ADC6804-A828-31D2-8EDE-087C85BD1F7B",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "__Metal_Aluminum_Anodized_",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "AF8E39D0-C1BB-38E3-B571-CA5656512726",
            "map": "3F278713-310B-320B-BFF1-073AC7F5EBB4",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "__Metal_Corrogated_Shiny_",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "19EC379C-AE42-389F-ACF1-F1670C92CEA1",
            "map": "72983AA0-3D13-3DD9-A89C-5D29531A7A06",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "__Metal_Panel_",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "22808E46-424D-33A2-BAF4-4825C7C1D8FD",
            "map": "E16281F4-32CE-3EA3-852C-913707426F01",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "__Metal_Rough_",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "CFFE3669-FC33-3A25-A594-D382FE44AAD6",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "edge_color000255",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "CC5AB9A7-B94A-39FF-9FA4-7FEE0756A81B",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "edge_color196196196255",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "8EBA9475-7FFB-35D3-BA3F-399283E0714D",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "edge_color202209219255",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "540A5313-52B8-3735-917F-C573634CEE66",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "edge_color353535255",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "B728AEEB-9182-3198-AA5F-532D5BE4A237",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "edge_color818181255",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "07664766-12CB-3998-ABC0-27BCF2EF7B82",
            "ambient": 11186380,
            "type": "MeshPhongMaterial",
            "name": "material",
            "shininess": 50,
            "color": 11186380
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "B5943101-3D11-3D1E-93D7-F409933D2C51",
            "ambient": 15611179,
            "type": "MeshPhongMaterial",
            "name": "material_10",
            "shininess": 50,
            "color": 15611179
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "1D4CAD2B-4B94-3C62-B846-C232E4DB78C3",
            "ambient": 7853879,
            "type": "MeshPhongMaterial",
            "name": "material_11",
            "shininess": 50,
            "color": 7853879
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "4E822AA1-7B13-3CCF-A4F0-12B4809B0D31",
            "map": "D2505C06-BC95-3E16-8299-0EFEAD7A1B15",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "material_8",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 131586,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "74C0A651-1E2D-32EA-B5CA-C7BAAE7E04EA",
            "map": "F74BC686-68E2-3146-8032-7F900597D08A",
            "ambient": 13421772,
            "type": "MeshPhongMaterial",
            "name": "material_9",
            "shininess": 50,
            "color": 13421772
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "C83988B8-928C-37CF-B26B-417E7410410C",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "C424DD96-604C-38AF-A52D-ABC498F9536E",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default.001",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "1F78BD51-0276-3E55-9FE5-974CEECABFF5",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default.002",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "CB50B31A-38D8-30E6-9C02-F1DF7C2A5260",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default.003",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "3D851371-EDCE-309E-9A7F-F60CAF829268",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default.004",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "A05335A0-0AFD-3CB1-B70C-7B9C19987CF5",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default.005",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "560285B7-C0B5-32BE-98F1-6C2CB3AA722E",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default.006",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "08B52D0A-085F-3877-8606-46FD3D9EB11A",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default.007",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "CC757FE8-196C-3EE3-B9C5-231C539AFF31",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default.008",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "114E90A3-B0C0-3CAD-91A0-90CDA687DDD5",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default.009",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "0F86A3A0-90F9-3321-9D8E-5E518751EC19",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_1Default.010",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "0ADE688F-692C-3DE3-B277-0C1A0E203D03",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "50BBB7FB-44A1-31C0-89CB-7AC73A9657C5",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.001",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "91A4A4DC-E6CA-39D2-91BD-39E492819B77",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.002",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "D1E30EED-8C44-3DF0-9B3D-B80AD658920A",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.003",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "4F23841D-F825-3FB0-9A89-A500ECA2129E",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.004",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "25583FD0-7AB2-3F60-B4B0-0AB20D082F06",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.005",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "1CDF2094-F0CF-329C-9293-B3A98AFAB089",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.006",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "5C9EEB14-ADEE-3AF7-920C-2CC6079B45C1",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.007",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "87266AB2-4402-38C2-908D-F486F86E932F",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.008",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "B40B9823-322E-31BA-8C35-A7B71C1F8D34",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.009",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "F14FD73F-772A-3E35-9648-3F434687F99B",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.010",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "E5C33156-BA20-397F-9E61-ED1F7F431722",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.011",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "3D4B1B16-CE9E-3CC1-A702-3EF4EDF1BA35",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.012",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "A57264C1-6699-35E8-96EC-46637BA5F35E",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.013",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "71C158B3-78B9-302A-AB61-37BC09EF2E90",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.014",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "BBF44B76-3C6A-3B42-815A-75838D8FD131",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.015",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "715FE4FE-F19C-390A-94D8-D78858601B37",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.016",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "A7A1B42E-6F60-3C28-8F73-1F207E5B9140",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.017",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "0E8F2D10-501C-39E3-9491-6DA909748812",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.018",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "08271DEA-F9D5-3ABD-ACBE-02E39B8A3231",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.019",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "774CA365-E828-35B4-8646-CF013EF6F9AA",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.020",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "1823B8E2-1824-3213-AD2F-76A1801BE88F",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.021",
            "shininess": 50,
            "color": 16777215
        },{
            "specular": 8355711,
            "emissive": 0,
            "depthWrite": true,
            "vertexColors": false,
            "blending": "NormalBlending",
            "depthTest": true,
            "uuid": "E0DB43E0-3F06-3994-821A-75C5E23CFFB5",
            "ambient": 16777215,
            "type": "MeshPhongMaterial",
            "name": "pin_2Default.022",
            "shininess": 50,
            "color": 16777215
        }],
        "geometries": [{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.003Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.002",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "6A228D8C-3B18-360D-B8EE-28AB73BBC815"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,-1,0,0,1,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,1,3,0,1,1,1,1,42,7,6,5,1,2,1,0,1,1,1],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 4,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 12,
                    "normals": 2,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID513Geometry",
                "vertices": [0.298492,-0.406693,1.08828,0.498492,-0.406693,1.48828,0.298492,-0.406693,1.48828,0.498492,-0.406693,1.08828,0.498492,-0.406693,1.08828,0.298492,-0.406693,1.08828,0.498492,-0.406693,1.48828,0.298492,-0.406693,1.48828,0.498492,-0.406693,1.48828,0.498492,-0.406693,1.08828,0.298492,-0.406693,1.48828,0.298492,-0.406693,1.08828],
                "uvs": [[23.3929,17.6263,23.6668,17.8616,23.3929,17.8616,23.6668,17.6263]]
            },
            "materials": [{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_9",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_9.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "410D79C3-992F-368E-9644-883E7849DD33"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.008Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default.007",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "22808256-E171-322C-884F-D8BF600B40EB"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.006Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default.005",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "1F7BE7A1-4015-3C45-9438-5A5E26C6DBC1"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,1,0,0,0.999969,0,0,-1,0,0,-0.999969,0],
                "faces": [42,0,1,2,0,0,1,2,0,1,0,42,1,0,3,0,1,0,3,1,0,0,42,1,3,4,0,1,3,4,1,0,0,42,4,3,5,0,4,3,5,0,0,0,42,4,5,6,0,4,5,6,0,0,0,42,6,5,7,0,6,5,7,0,0,0,42,7,5,8,0,7,5,8,0,0,0,42,7,8,9,0,7,8,9,0,0,1,42,9,8,10,0,9,8,10,1,0,0,42,9,10,11,0,9,10,11,1,0,0,42,9,11,12,0,9,11,12,1,0,0,42,12,11,13,0,12,11,13,0,0,0,42,12,13,14,0,12,13,14,0,0,1,42,14,13,15,0,14,13,15,1,0,0,42,14,15,16,0,14,15,16,1,0,0,42,16,15,17,0,16,15,17,0,0,1,42,17,15,18,0,17,15,18,1,0,0,42,17,18,19,0,17,18,19,1,0,0,42,19,18,20,0,19,18,20,0,0,0,42,19,20,21,0,19,20,21,0,0,0,42,19,21,22,0,19,21,22,0,0,0,42,22,21,23,0,22,21,23,0,0,0,42,24,25,26,0,23,21,22,2,2,2,42,26,25,27,0,22,21,19,2,2,2,42,25,28,27,0,21,20,19,2,2,2,42,28,29,27,0,20,18,19,2,2,2,42,27,29,30,0,19,18,17,2,2,3,42,29,31,30,0,18,15,17,2,2,3,42,30,31,32,0,17,15,16,3,2,2,42,32,31,33,0,16,15,14,2,2,3,42,31,34,33,0,15,13,14,2,2,3,42,33,34,35,0,14,13,12,3,2,2,42,34,36,35,0,13,11,12,2,2,2,42,35,36,37,0,12,11,9,2,2,3,42,36,38,37,0,11,10,9,2,2,3,42,38,39,37,0,10,8,9,2,2,3,42,37,39,40,0,9,8,7,3,2,3,42,39,41,40,0,8,5,7,2,2,3,42,40,41,42,0,7,5,6,3,2,2,42,42,41,43,0,6,5,4,2,2,2,42,41,44,43,0,5,3,4,2,2,2,42,43,44,45,0,4,3,1,2,2,3,42,44,46,45,0,3,0,1,2,2,3,42,47,45,46,0,2,1,0,2,3,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 72,
                    "normals": 4,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID704Geometry",
                "vertices": [0.428558,-0.231693,0.581229,0.428558,-0.231693,0.563112,0.427365,-0.231693,0.57217,0.432054,-0.231693,0.58967,0.432054,-0.231693,0.55467,0.437617,-0.231693,0.596919,0.437617,-0.231693,0.547422,0.444865,-0.231693,0.54186,0.444865,-0.231693,0.602481,0.453307,-0.231693,0.538363,0.453307,-0.231693,0.605978,0.462365,-0.231693,0.60717,0.462365,-0.231693,0.53717,0.471424,-0.231693,0.605978,0.471424,-0.231693,0.538363,0.479865,-0.231693,0.602481,0.479865,-0.231693,0.54186,0.487114,-0.231693,0.547422,0.487114,-0.231693,0.596919,0.492676,-0.231693,0.55467,0.492676,-0.231693,0.58967,0.496173,-0.231693,0.581229,0.496173,-0.231693,0.563112,0.497365,-0.231693,0.57217,0.497365,-0.231693,0.57217,0.496173,-0.231693,0.581229,0.496173,-0.231693,0.563112,0.492676,-0.231693,0.55467,0.492676,-0.231693,0.58967,0.487114,-0.231693,0.596919,0.487114,-0.231693,0.547422,0.479865,-0.231693,0.602481,0.479865,-0.231693,0.54186,0.471424,-0.231693,0.538363,0.471424,-0.231693,0.605978,0.462365,-0.231693,0.53717,0.462365,-0.231693,0.60717,0.453307,-0.231693,0.538363,0.453307,-0.231693,0.605978,0.444865,-0.231693,0.602481,0.444865,-0.231693,0.54186,0.437617,-0.231693,0.596919,0.437617,-0.231693,0.547422,0.432054,-0.231693,0.55467,0.432054,-0.231693,0.58967,0.428558,-0.231693,0.563112,0.428558,-0.231693,0.581229,0.427365,-0.231693,0.57217,0.432054,-0.231693,0.55467,0.437617,-0.231693,0.547422,0.428558,-0.231693,0.563112,0.427365,-0.231693,0.57217,0.428558,-0.231693,0.581229,0.432054,-0.231693,0.58967,0.437617,-0.231693,0.596919,0.444865,-0.231693,0.602481,0.453307,-0.231693,0.605978,0.462365,-0.231693,0.60717,0.471424,-0.231693,0.605978,0.479865,-0.231693,0.602481,0.487114,-0.231693,0.596919,0.492676,-0.231693,0.58967,0.496173,-0.231693,0.581229,0.497365,-0.231693,0.57217,0.496173,-0.231693,0.563112,0.492676,-0.231693,0.55467,0.487114,-0.231693,0.547422,0.479865,-0.231693,0.54186,0.471424,-0.231693,0.538363,0.462365,-0.231693,0.53717,0.453307,-0.231693,0.538363,0.444865,-0.231693,0.54186],
                "uvs": [[-23.571,17.3281,-23.571,17.3174,-23.5694,17.3227,-23.5758,17.333,-23.5758,17.3124,-23.5834,17.3373,-23.5834,17.3082,-23.5934,17.3049,-23.5934,17.3405,-23.6049,17.3028,-23.6049,17.3426,-23.6173,17.3433,-23.6173,17.3021,-23.6298,17.3426,-23.6298,17.3028,-23.6413,17.3405,-23.6413,17.3049,-23.6513,17.3082,-23.6513,17.3373,-23.6589,17.3124,-23.6589,17.333,-23.6637,17.3281,-23.6637,17.3174,-23.6653,17.3227]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "9EBEB9DE-D50F-398B-9CA9-CA154B8E53AC"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.008Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.007",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "AC2B12EA-9361-3E40-AD2A-0BC80A9E2598"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0,-0.999969,0,0,-1,0,-1,0,-1,0,0,-0.707083,-0.707083,0,-0.999969,0,0,0,1,0,0,0.999969,0,0,0,1,0.999969,0,0,1,0,0,0.707083,-0.707083,0,0,0,0.999969,0.707083,0.707083,0,0,-0.999969,0,-0.707083,0.707083,0],
                "faces": [42,0,1,2,0,0,1,2,0,1,1,42,1,0,3,0,1,0,3,1,0,1,42,1,3,4,0,1,3,4,1,1,1,42,4,3,5,0,4,3,5,1,1,1,42,4,5,6,0,4,5,6,1,1,1,42,4,6,7,0,4,6,7,1,1,1,42,2,8,9,0,2,8,9,1,1,1,42,8,2,1,0,8,2,1,1,1,1,42,9,8,7,0,9,8,7,1,1,1,42,9,7,10,0,9,7,10,1,1,1,42,10,7,11,0,10,7,11,1,1,1,42,11,7,6,0,11,7,6,1,1,1,42,36,37,38,0,12,13,14,2,2,2,42,37,36,39,0,13,12,15,2,2,2,42,46,47,48,0,16,17,18,3,3,3,42,47,46,49,0,17,16,19,3,3,3,42,55,56,57,0,20,21,22,4,4,4,42,56,55,58,0,21,20,23,4,4,4,42,64,65,66,0,24,25,26,5,5,3,42,65,64,67,0,25,24,27,5,5,3,42,73,74,75,0,28,29,30,6,6,6,42,74,73,76,0,29,28,31,6,6,6,42,76,73,77,0,31,28,32,6,6,6,42,75,74,78,0,30,29,33,6,6,6,42,74,76,79,0,29,31,34,6,6,6,42,79,76,80,0,34,31,35,6,6,6,42,79,80,81,0,34,35,36,6,6,6,42,80,76,82,0,35,31,37,6,6,6,42,82,76,83,0,37,31,38,6,6,6,42,76,77,84,0,31,32,39,6,6,6,42,84,77,85,0,39,32,40,6,6,6,42,84,85,86,0,39,40,41,6,6,6,42,85,77,87,0,40,32,42,6,6,6,42,87,77,88,0,42,32,43,6,6,6,42,87,88,89,0,42,43,44,6,6,6,42,88,77,90,0,43,32,45,6,6,6,42,78,91,75,0,33,46,30,6,7,6,42,91,78,92,0,46,33,47,7,6,6,42,91,92,83,0,46,47,38,7,6,6,42,83,92,82,0,38,47,37,6,6,6,42,91,83,93,0,46,38,48,7,6,6,42,91,93,94,0,46,48,49,7,6,6,42,94,93,95,0,49,48,50,6,6,7,42,94,95,96,0,49,50,51,6,7,6,42,94,96,97,0,49,51,52,6,6,8,42,91,94,98,0,46,49,53,7,6,6,42,91,98,86,0,46,53,41,7,6,6,42,86,98,84,0,41,53,39,6,6,6,42,91,86,99,0,46,41,54,7,6,6,42,91,99,90,0,46,54,45,7,6,6,42,91,90,77,0,46,45,32,7,6,6,42,87,100,101,0,42,55,56,6,6,8,42,100,87,102,0,55,42,57,6,6,7,42,102,87,89,0,57,42,44,7,6,6,42,79,103,104,0,34,58,59,6,6,8,42,103,79,105,0,58,34,60,6,6,7,42,105,79,81,0,60,34,36,7,6,6,42,169,170,171,0,61,62,63,9,9,10,42,170,169,172,0,62,61,64,9,9,10,42,178,179,180,0,65,66,67,11,11,11,42,179,178,181,0,66,65,68,11,11,11,42,187,188,189,0,69,70,71,10,10,10,42,188,187,190,0,70,69,72,10,10,10,42,12,13,14,1,0,0,0,8,8,8,42,14,13,15,1,0,0,0,8,8,8,42,15,13,16,1,0,0,0,8,8,8,42,13,17,16,1,0,0,0,8,8,8,42,18,19,17,1,0,0,0,8,8,8,42,16,17,19,1,0,0,0,8,8,8,42,13,12,20,1,0,0,0,8,8,8,42,12,21,20,1,0,0,0,8,8,8,42,21,22,20,1,0,0,0,8,8,8,42,20,22,18,1,0,0,0,8,8,8,42,22,23,18,1,0,0,0,8,12,8,42,19,18,23,1,0,0,0,8,8,12,42,40,41,42,1,0,0,0,6,6,6,42,43,42,41,1,0,0,0,6,6,6,42,50,51,52,1,0,0,0,10,10,10,42,53,52,51,1,0,0,0,10,10,10,42,59,60,61,1,0,0,0,13,13,13,42,62,61,60,1,0,0,0,13,13,13,42,68,69,70,1,0,0,0,10,9,9,42,71,70,69,1,0,0,0,10,9,9,42,106,107,108,1,0,0,0,2,2,14,42,108,107,109,1,0,0,0,14,2,2,42,110,109,107,1,0,0,0,8,2,2,42,111,112,113,1,0,0,0,2,2,14,42,113,112,114,1,0,0,0,14,2,2,42,115,114,112,1,0,0,0,8,2,2,42,116,117,118,1,0,0,0,14,2,2,42,117,119,118,1,0,0,0,2,2,2,42,119,120,118,1,0,0,0,2,2,2,42,121,122,120,1,0,0,0,2,2,2,42,120,122,118,1,0,0,0,2,2,2,42,122,123,118,1,0,0,0,2,2,2,42,124,125,123,1,0,0,0,8,2,2,42,125,126,123,1,0,0,0,2,14,2,42,126,127,123,1,0,0,0,14,2,2,42,123,127,118,1,0,0,0,2,2,2,42,127,128,118,1,0,0,0,2,2,2,42,129,130,128,1,0,0,0,2,2,2,42,128,130,118,1,0,0,0,2,2,2,42,130,131,118,1,0,0,0,2,2,2,42,132,118,131,1,0,0,0,2,2,2,42,117,116,133,1,0,0,0,2,14,2,42,111,133,112,1,0,0,0,2,2,2,42,133,116,112,1,0,0,0,2,14,2,42,112,116,134,1,0,0,0,2,14,2,42,120,134,121,1,0,0,0,2,2,2,42,134,116,121,1,0,0,0,2,14,2,42,121,116,135,1,0,0,0,2,14,2,42,128,135,129,1,0,0,0,2,2,2,42,129,135,136,1,0,0,0,2,2,2,42,106,136,107,1,0,0,0,2,2,2,42,136,135,107,1,0,0,0,2,2,2,42,107,135,137,1,0,0,0,2,2,2,42,131,137,132,1,0,0,0,2,2,2,42,116,138,135,1,0,0,0,14,2,2,42,135,138,137,1,0,0,0,2,2,2,42,132,137,138,1,0,0,0,2,2,2,42,173,174,175,1,0,0,0,3,5,5,42,176,175,174,1,0,0,0,3,5,5,42,182,183,184,1,0,0,0,15,15,15,42,185,184,183,1,0,0,0,15,15,15,42,191,192,193,1,0,0,0,3,3,3,42,194,193,192,1,0,0,0,3,3,3],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 126,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 195,
                    "normals": 16,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID25Geometry",
                "vertices": [0.285864,-0.015748,0.299213,0.263285,-0.059926,0.299213,0.048782,-0.015748,0.299213,0.285864,-0.074652,0.299213,0.263285,-0.103402,0.299213,0.30315,-0.091938,0.299213,0.30315,-0.137795,0.299213,0.071361,-0.103402,0.299213,0.071361,-0.059926,0.299213,0.048782,-0.074652,0.299213,0.031496,-0.091938,0.299213,0.031496,-0.137795,0.299213,0.30315,-0.137795,0.299213,0.071361,-0.103402,0.299213,0.031496,-0.137795,0.299213,0.031496,-0.091938,0.299213,0.048782,-0.074652,0.299213,0.071361,-0.059926,0.299213,0.263285,-0.059926,0.299213,0.048782,-0.015748,0.299213,0.263285,-0.103402,0.299213,0.30315,-0.091938,0.299213,0.285864,-0.074652,0.299213,0.285864,-0.015748,0.299213,0.048782,-0.015748,0.299213,0.285864,-0.015748,0.299213,0.285864,-0.074652,0.299213,0.30315,-0.091938,0.299213,0.30315,-0.137795,0.299213,0.031496,-0.137795,0.299213,0.031496,-0.091938,0.299213,0.048782,-0.074652,0.299213,0.263285,-0.103402,0.299213,0.263285,-0.059926,0.299213,0.071361,-0.059926,0.299213,0.071361,-0.103402,0.299213,0.285864,-0.015748,-0,0.048782,-0.015748,0.299213,0.048782,-0.015748,0,0.285864,-0.015748,0.299213,0.285864,-0.015748,0.299213,0.285864,-0.015748,-0,0.048782,-0.015748,0.299213,0.048782,-0.015748,0,0.048782,-0.015748,0,0.285864,-0.015748,-0,0.285864,-0.074652,0.299213,0.285864,-0.015748,-0,0.285864,-0.074652,-0,0.285864,-0.015748,0.299213,0.285864,-0.015748,0.299213,0.285864,-0.074652,0.299213,0.285864,-0.015748,-0,0.285864,-0.074652,-0,0.285864,-0.074652,-0,0.30315,-0.091938,0,0.285864,-0.074652,0.299213,0.285864,-0.074652,-0,0.30315,-0.091938,0.299213,0.30315,-0.091938,0.299213,0.30315,-0.091938,0,0.285864,-0.074652,0.299213,0.285864,-0.074652,-0,0.30315,-0.091938,0,0.30315,-0.137795,0.299213,0.30315,-0.091938,0,0.30315,-0.137795,0,0.30315,-0.091938,0.299213,0.30315,-0.091938,0.299213,0.30315,-0.137795,0.299213,0.30315,-0.091938,0,0.30315,-0.137795,0,0.30315,-0.137795,0,0.031496,-0.137795,0.299213,0.053642,-0.137795,0.165354,0.031496,-0.137795,0,0.129429,-0.137795,0.206693,0.30315,-0.137795,0.299213,0.053642,-0.137795,0.041339,0.061516,-0.137795,0.165354,0.083661,-0.137795,0.165354,0.083661,-0.137795,0.15748,0.091535,-0.137795,0.165354,0.129429,-0.137795,0.041339,0.205216,-0.137795,0.206693,0.24311,-0.137795,0.165354,0.24311,-0.137795,0.041339,0.250984,-0.137795,0.165354,0.27313,-0.137795,0.165354,0.27313,-0.137795,0.15748,0.281004,-0.137795,0.165354,0.30315,-0.137795,0,0.091535,-0.137795,0.041339,0.145177,-0.137795,0.041339,0.189469,-0.137795,0.041339,0.145177,-0.137795,0.190945,0.189469,-0.137795,0.190945,0.189469,-0.137795,0.057087,0.205216,-0.137795,0.041339,0.281004,-0.137795,0.041339,0.250984,-0.137795,0.049213,0.250984,-0.137795,0.15748,0.27313,-0.137795,0.049213,0.061516,-0.137795,0.049213,0.061516,-0.137795,0.15748,0.083661,-0.137795,0.049213,0.083661,-0.137795,0.15748,0.061516,-0.137795,0.165354,0.083661,-0.137795,0.049213,0.061516,-0.137795,0.049213,0.061516,-0.137795,0.15748,0.27313,-0.137795,0.15748,0.250984,-0.137795,0.165354,0.27313,-0.137795,0.049213,0.250984,-0.137795,0.049213,0.250984,-0.137795,0.15748,0.30315,-0.137795,0.299213,0.281004,-0.137795,0.165354,0.30315,-0.137795,0,0.281004,-0.137795,0.041339,0.24311,-0.137795,0.041339,0.205216,-0.137795,0.206693,0.205216,-0.137795,0.041339,0.189469,-0.137795,0.041339,0.189469,-0.137795,0.057087,0.189469,-0.137795,0.190945,0.145177,-0.137795,0.190945,0.145177,-0.137795,0.041339,0.129429,-0.137795,0.041339,0.091535,-0.137795,0.165354,0.091535,-0.137795,0.041339,0.053642,-0.137795,0.041339,0.031496,-0.137795,0,0.27313,-0.137795,0.165354,0.24311,-0.137795,0.165354,0.129429,-0.137795,0.206693,0.083661,-0.137795,0.165354,0.053642,-0.137795,0.165354,0.031496,-0.137795,0.299213,0.031496,-0.137795,0,0.083661,-0.137795,0.165354,0.091535,-0.137795,0.165354,0.083661,-0.137795,0.15748,0.083661,-0.137795,0.049213,0.061516,-0.137795,0.049213,0.061516,-0.137795,0.15748,0.061516,-0.137795,0.165354,0.053642,-0.137795,0.165354,0.053642,-0.137795,0.041339,0.091535,-0.137795,0.041339,0.129429,-0.137795,0.041339,0.145177,-0.137795,0.041339,0.145177,-0.137795,0.190945,0.189469,-0.137795,0.190945,0.189469,-0.137795,0.057087,0.189469,-0.137795,0.041339,0.205216,-0.137795,0.041339,0.205216,-0.137795,0.206693,0.129429,-0.137795,0.206693,0.27313,-0.137795,0.165354,0.281004,-0.137795,0.165354,0.27313,-0.137795,0.15748,0.27313,-0.137795,0.049213,0.250984,-0.137795,0.049213,0.250984,-0.137795,0.15748,0.250984,-0.137795,0.165354,0.24311,-0.137795,0.165354,0.24311,-0.137795,0.041339,0.281004,-0.137795,0.041339,0.031496,-0.091938,0.299213,0.031496,-0.137795,0,0.031496,-0.091938,0,0.031496,-0.137795,0.299213,0.031496,-0.137795,0.299213,0.031496,-0.091938,0.299213,0.031496,-0.137795,0,0.031496,-0.091938,0,0.031496,-0.091938,0,0.048782,-0.074652,0,0.031496,-0.091938,0.299213,0.031496,-0.091938,0,0.048782,-0.074652,0.299213,0.048782,-0.074652,0.299213,0.048782,-0.074652,0,0.031496,-0.091938,0.299213,0.031496,-0.091938,0,0.048782,-0.074652,0,0.048782,-0.015748,0.299213,0.048782,-0.074652,0,0.048782,-0.015748,0,0.048782,-0.074652,0.299213,0.048782,-0.074652,0.299213,0.048782,-0.015748,0.299213,0.048782,-0.074652,0,0.048782,-0.015748,0],
                "uvs": [[0.071466,0.003937,0.065821,0.014981,0.012195,0.003937,0.071466,0.018663,0.065821,0.025851,0.075787,0.022984,0.075787,0.034449,0.01784,0.025851,0.01784,0.014981,0.012195,0.018663,0.007874,0.022984,0.007874,0.034449,0.071466,-0,0.012195,0.074803,0.012195,0,0.071466,0.074803,-0.074803,0.018663,0,0.003937,0,0.018663,-0.074803,0.003937,0,0.069842,-0.074803,0.063731,0,0.063731,-0.074803,0.069842,-0.074803,0.034449,-0,0.022984,-0,0.034449,-0.074803,0.022984,-0.007874,0.074803,-0.01341,0.041339,-0.007874,0,-0.032357,0.051673,-0.075787,0.074803,-0.01341,0.010335,-0.015379,0.041339,-0.020915,0.041339,-0.020915,0.03937,-0.022884,0.041339,-0.032357,0.010335,-0.051304,0.051673,-0.060778,0.041339,-0.060778,0.010335,-0.062746,0.041339,-0.068282,0.041339,-0.068282,0.03937,-0.070251,0.041339,-0.075787,0,-0.022884,0.010335,-0.036294,0.010335,-0.047367,0.010335,-0.036294,0.047736,-0.047367,0.047736,-0.047367,0.014272,-0.051304,0.010335,-0.070251,0.010335,-0.062746,0.012303,-0.062746,0.03937,-0.068282,0.012303,-0.015379,0.012303,-0.015379,0.03937,-0.020915,0.012303,0.074803,0.022984,-0,0.034449,-0,0.022984,0.074803,0.034449,0,0.004573,0.074803,0.010685,0,0.010685,0.074803,0.004573,0.074803,0.003937,0,0.018663,0,0.003937,0.074803,0.018663]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Corrogated_Shiny_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Corrogated_Shiny_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.666667,0.690196,0.8],
                "DbgColor": 15597568,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.666667,0.690196,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "61BCB1C6-6F3A-31C7-B6BC-015007850159"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Aluminum_Anodized_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Aluminum_Anodized_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "A78FDF46-E524-37DE-ACC8-189CBBEF71CF"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.017Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.016",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "059CEAB2-9703-3685-B1BF-2405B2A4CF86"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.007Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default.006",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "E90A65DC-3E0D-3F1F-BCA2-4F1906068069"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [-0.999969,0,0,-1,0,0,0,0,-0.999969,0,0,-1,0.999969,0,0,1,0,0,0,0,1,0,0,0.999969],
                "faces": [42,0,1,2,0,0,1,2,0,0,1,42,1,0,3,0,1,0,3,0,0,1,42,12,13,14,0,4,5,6,2,2,3,42,13,12,15,0,5,4,7,2,2,3,42,22,23,24,0,8,9,10,4,4,5,42,23,22,25,0,9,8,11,4,4,5,42,4,5,6,1,12,13,14,5,4,4,42,7,6,5,1,15,14,13,5,4,4,42,16,17,18,1,16,17,18,6,7,7,42,19,18,17,1,19,18,17,6,7,7,42,26,27,28,1,20,21,22,1,0,0,42,29,28,27,1,23,22,21,1,0,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 12,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 32,
                    "normals": 8,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID649Geometry",
                "vertices": [0.41155,-0.306693,0.626908,0.41155,-0.256693,0.526908,0.41155,-0.306693,0.526908,0.41155,-0.256693,0.626908,0.41155,-0.256693,0.626908,0.41155,-0.306693,0.626908,0.41155,-0.256693,0.526908,0.41155,-0.306693,0.526908,0.41155,-0.306693,0.526908,0.41155,-0.306693,0.626908,0.41155,-0.256693,0.626908,0.41155,-0.256693,0.526908,0.51155,-0.306693,0.526908,0.41155,-0.256693,0.526908,0.51155,-0.256693,0.526908,0.41155,-0.306693,0.526908,0.41155,-0.306693,0.526908,0.51155,-0.306693,0.526908,0.41155,-0.256693,0.526908,0.51155,-0.256693,0.526908,0.51155,-0.306693,0.526908,0.51155,-0.256693,0.526908,0.51155,-0.256693,0.526908,0.51155,-0.306693,0.626908,0.51155,-0.306693,0.526908,0.51155,-0.256693,0.626908,0.51155,-0.256693,0.626908,0.51155,-0.256693,0.526908,0.51155,-0.306693,0.626908,0.51155,-0.306693,0.526908,0.51155,-0.306693,0.626908,0.51155,-0.256693,0.626908],
                "uvs": [[-1.22931,-0.002083,-1.22514,-0.004167,-1.22514,-0.002083,-1.22931,-0.004167,0.72044,-0.002083,0.716273,-0.004167,0.72044,-0.004167,0.716273,-0.002083,1.22514,-0.004167,1.22931,-0.002083,1.22514,-0.002083,1.22931,-0.004167,-40.4139,-0.058824,-40.4139,-0.029412,-40.2769,-0.058824,-40.2769,-0.029412,23.5477,-0.029412,23.6847,-0.029412,23.5477,-0.058824,23.6847,-0.058824,40.4139,-0.058824,40.2769,-0.058824,40.4139,-0.029412,40.2769,-0.029412]]
            },
            "materials": [{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Panel_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Panel_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "FB839AA1-AEF0-3F01-8674-60F0657AA29D"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.999969,-1,0,0,1,0,0,0,0,-0.999969],
                "faces": [34,0,1,2,0,0,0,0,34,1,0,3,0,0,0,0,34,4,5,6,0,1,1,1,34,7,6,5,0,1,1,1,34,12,13,14,0,2,2,2,34,13,12,15,0,2,2,2,34,15,12,16,0,2,2,2,34,15,16,17,0,2,2,3,34,17,16,18,0,3,2,3,34,19,13,15,0,2,2,2,34,20,21,22,0,3,3,3,34,23,24,25,0,3,4,3,34,25,24,20,0,3,4,3,34,24,26,20,0,4,3,3,34,20,26,21,0,3,3,3,34,27,21,26,0,3,3,3,34,34,35,36,0,5,5,5,34,35,34,37,0,5,5,5,34,38,39,40,0,6,6,6,34,41,40,39,0,6,6,6,34,43,44,45,0,3,3,3,34,44,43,46,0,3,3,3,34,46,43,47,0,3,3,2,34,47,43,48,0,2,3,3,34,47,48,49,0,2,3,4,34,46,47,50,0,3,2,3,34,51,52,53,0,2,4,2,34,54,55,52,0,4,7,4,34,55,56,52,0,7,2,4,34,52,56,53,0,4,2,2,34,53,56,57,0,2,2,2,34,58,57,56,0,2,2,2,34,64,65,66,0,6,6,6,34,65,64,67,0,6,6,6,34,68,69,70,0,5,5,5,34,71,70,69,0,5,5,5,34,72,73,74,0,1,1,1,34,73,72,75,0,1,1,1,34,76,77,78,0,0,0,0,34,79,78,77,0,0,0,0,34,80,81,82,0,1,1,1,34,81,80,83,0,1,1,1,34,84,85,86,0,0,0,0,34,87,86,85,0,0,0,0,34,88,89,90,0,1,1,1,34,89,88,91,0,1,1,1,34,92,93,94,0,0,0,0,34,95,94,93,0,0,0,0,34,96,97,98,0,1,1,1,34,97,96,99,0,1,1,1,34,100,101,102,0,0,0,0,34,103,102,101,0,0,0,0,34,104,105,106,0,1,1,1,34,105,104,107,0,1,1,1,34,108,109,110,0,0,0,0,34,111,110,109,0,0,0,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 56,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 112,
                    "normals": 8,
                    "uvs": 0
                },
                "influencesPerVertex": 2,
                "name": "ELEC_23_2Pins_2Geometry",
                "vertices": [0.756323,-0.137795,0.065772,-0.727929,-0.137795,-0.034228,-0.727929,-0.137795,0.065772,0.756323,-0.137795,-0.034228,0.756323,-0.137795,-0.034228,0.756323,-0.137795,0.065772,-0.727929,-0.137795,-0.034228,-0.727929,-0.137795,0.065772,-0.727929,-0.137795,-0.034228,0.756323,-0.137795,-0.034228,-0.727929,-0.137795,0.065772,0.756323,-0.137795,0.065772,0.756323,-0.237795,-0.034228,-0.727929,-0.137795,-0.034228,0.756323,-0.137795,-0.034228,-0.431078,-0.237795,-0.034228,0.459473,-0.237795,-0.034228,-0.134228,-0.237795,-0.034228,0.162623,-0.237795,-0.034228,-0.727929,-0.237795,-0.034228,-0.431078,-0.237795,-0.034228,-0.727929,-0.137795,-0.034228,-0.727929,-0.237795,-0.034228,0.162623,-0.237795,-0.034228,0.459473,-0.237795,-0.034228,-0.134228,-0.237795,-0.034228,0.756323,-0.237795,-0.034228,0.756323,-0.137795,-0.034228,-0.727929,-0.237795,-0.034228,0.756323,-0.237795,-0.034228,0.459473,-0.237795,-0.034228,0.162623,-0.237795,-0.034228,-0.134228,-0.237795,-0.034228,-0.431078,-0.237795,-0.034228,-0.727929,-0.237795,0.065772,-0.727929,-0.137795,-0.034228,-0.727929,-0.237795,-0.034228,-0.727929,-0.137795,0.065772,-0.727929,-0.137795,0.065772,-0.727929,-0.237795,0.065772,-0.727929,-0.137795,-0.034228,-0.727929,-0.237795,-0.034228,-0.727929,-0.237795,0.065772,-0.727929,-0.237795,0.065772,0.756323,-0.137795,0.065772,-0.727929,-0.137795,0.065772,0.756323,-0.237795,0.065772,0.162623,-0.237795,0.065772,-0.431078,-0.237795,0.065772,-0.134228,-0.237795,0.065772,0.459473,-0.237795,0.065772,0.459473,-0.237795,0.065772,0.162623,-0.237795,0.065772,0.756323,-0.237795,0.065772,-0.134228,-0.237795,0.065772,-0.431078,-0.237795,0.065772,-0.727929,-0.237795,0.065772,0.756323,-0.137795,0.065772,-0.727929,-0.137795,0.065772,-0.431078,-0.237795,0.065772,-0.134228,-0.237795,0.065772,0.162623,-0.237795,0.065772,0.459473,-0.237795,0.065772,0.756323,-0.237795,0.065772,0.756323,-0.137795,0.065772,0.756323,-0.237795,-0.034228,0.756323,-0.137795,-0.034228,0.756323,-0.237795,0.065772,0.756323,-0.237795,0.065772,0.756323,-0.137795,0.065772,0.756323,-0.237795,-0.034228,0.756323,-0.137795,-0.034228,0.756323,-0.237795,-0.034228,0.459473,-0.237795,0.065772,0.459473,-0.237795,-0.034228,0.756323,-0.237795,0.065772,0.756323,-0.237795,0.065772,0.756323,-0.237795,-0.034228,0.459473,-0.237795,0.065772,0.459473,-0.237795,-0.034228,0.459473,-0.237795,-0.034228,0.162623,-0.237795,0.065772,0.162623,-0.237795,-0.034228,0.459473,-0.237795,0.065772,0.459473,-0.237795,0.065772,0.459473,-0.237795,-0.034228,0.162623,-0.237795,0.065772,0.162623,-0.237795,-0.034228,0.162623,-0.237795,-0.034228,-0.134228,-0.237795,0.065772,-0.134228,-0.237795,-0.034228,0.162623,-0.237795,0.065772,0.162623,-0.237795,0.065772,0.162623,-0.237795,-0.034228,-0.134228,-0.237795,0.065772,-0.134228,-0.237795,-0.034228,-0.134228,-0.237795,-0.034228,-0.431078,-0.237795,0.065772,-0.431078,-0.237795,-0.034228,-0.134228,-0.237795,0.065772,-0.134228,-0.237795,0.065772,-0.134228,-0.237795,-0.034228,-0.431078,-0.237795,0.065772,-0.431078,-0.237795,-0.034228,-0.431078,-0.237795,-0.034228,-0.727929,-0.237795,0.065772,-0.727929,-0.237795,-0.034228,-0.431078,-0.237795,0.065772,-0.431078,-0.237795,0.065772,-0.431078,-0.237795,-0.034228,-0.727929,-0.237795,0.065772,-0.727929,-0.237795,-0.034228],
                "uvs": []
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.317647,0.317647,0.317647],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0135_DarkGray_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.317647,0.317647,0.317647],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "E7960076-46CF-3C6D-8706-D662CF402CD4"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.010Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default.009",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "37159F16-F3A7-369E-802A-3B97C9795804"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,-1,0,0,-0.999969,0,0,1,0,0,0.999969,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,2,1,4,0,2,1,4,0,0,0,42,5,6,7,0,5,6,7,1,0,0,42,6,5,8,0,6,5,8,0,1,0,42,6,8,9,0,6,8,9,0,0,0,42,9,8,10,0,9,8,10,0,0,0,42,9,10,11,0,9,10,11,0,0,0,42,9,11,12,0,9,11,12,0,0,0,42,12,11,13,0,12,11,13,0,0,1,42,12,13,14,0,12,13,14,0,1,0,42,14,13,15,0,14,13,15,0,1,0,42,15,13,16,0,15,13,16,0,1,0,42,15,16,17,0,15,16,17,0,0,0,42,15,17,18,0,15,17,18,0,0,0,42,18,17,19,0,18,17,19,0,0,0,42,19,17,20,0,19,17,20,0,0,0,42,19,20,21,0,19,20,21,0,0,0,42,19,21,22,0,19,21,22,0,0,0,42,22,21,23,0,22,21,23,0,0,0,42,23,21,24,0,23,21,24,0,0,1,42,23,24,25,0,23,24,25,0,1,0,42,23,25,26,0,23,25,26,0,0,0,42,26,25,27,0,26,25,27,0,0,0,42,26,27,28,0,26,27,28,0,0,1,42,28,27,29,0,28,27,29,1,0,0,42,29,27,30,0,29,27,30,0,0,0,42,31,32,33,0,31,32,33,0,0,0,42,32,31,34,0,32,31,34,0,0,0,42,34,31,35,0,34,31,35,0,0,0,42,35,31,36,0,35,31,36,0,0,1,42,36,31,37,0,36,31,37,1,0,0,42,37,31,38,0,37,31,38,0,0,0,42,38,31,39,0,38,31,39,0,0,0,42,39,31,40,0,39,31,40,0,0,0,42,39,40,41,0,39,40,41,0,0,0,42,41,40,42,0,41,40,42,0,0,1,42,42,40,43,0,42,40,43,1,0,0,42,43,40,44,0,43,40,44,0,0,0,42,44,40,45,0,44,40,45,0,0,0,42,45,40,46,0,45,40,46,0,0,0,42,46,40,47,0,46,40,47,0,0,1,42,46,47,48,0,46,47,48,0,1,0,42,46,48,49,0,46,48,49,0,0,0,42,46,49,3,0,46,49,3,0,0,0,42,46,3,50,0,46,3,50,0,0,1,42,50,3,0,0,50,3,0,1,0,0,42,50,0,51,0,50,0,51,1,0,0,42,3,49,52,0,3,49,52,0,0,0,42,3,52,53,0,3,52,53,0,0,0,42,3,53,5,0,3,53,5,0,0,1,42,3,5,54,0,3,5,54,0,1,0,42,54,5,4,0,54,5,4,0,1,0,42,4,5,7,0,4,5,7,0,1,0,42,47,40,55,0,47,40,55,1,0,1,42,55,40,56,0,55,40,56,1,0,0,42,56,40,57,0,56,40,57,0,0,0,42,57,40,58,0,57,40,58,0,0,0,42,58,40,59,0,58,40,59,0,0,0,42,59,40,60,0,59,40,60,0,0,0,42,60,40,30,0,60,40,30,0,0,0,42,33,61,62,0,33,61,62,0,0,0,42,61,33,63,0,61,33,63,0,0,0,42,63,33,64,0,63,33,64,0,0,0,42,64,33,65,0,64,33,65,0,0,0,42,65,33,66,0,65,33,66,0,0,0,42,66,33,67,0,66,33,67,0,0,0,42,67,33,68,0,67,33,68,0,0,1,42,68,33,32,0,68,33,32,1,0,0,42,62,61,69,0,62,61,69,0,0,0,42,62,69,70,0,62,69,70,0,0,0,42,62,70,71,0,62,70,71,0,0,0,42,62,71,72,0,62,71,72,0,0,1,42,62,72,73,0,62,72,73,0,1,0,42,62,73,50,0,62,73,50,0,0,1,42,62,50,74,0,62,50,74,0,1,0,42,74,50,75,0,74,50,75,0,1,0,42,75,50,51,0,75,50,51,0,1,0,42,75,51,76,0,75,51,76,0,0,1,42,76,51,77,0,76,51,77,1,0,0,42,76,77,78,0,76,77,78,1,0,0,42,78,77,79,0,78,77,79,0,0,0,42,79,77,2,0,79,77,2,0,0,0,42,79,2,7,0,79,2,7,0,0,0,42,7,2,4,0,7,2,4,0,0,0,42,62,74,80,0,62,74,80,0,0,1,42,62,80,81,0,62,80,81,0,1,1,42,62,81,82,0,62,81,82,0,1,0,42,62,82,83,0,62,82,83,0,0,0,42,62,83,84,0,62,83,84,0,0,0,42,62,84,85,0,62,84,85,0,0,0,42,62,85,29,0,62,85,29,0,0,0,42,62,29,30,0,62,29,30,0,0,0,42,62,30,40,0,62,30,40,0,0,0,42,86,68,32,0,86,68,32,0,1,0,42,68,86,87,0,68,86,87,1,0,0,42,87,86,88,0,87,86,88,0,0,0,42,87,88,89,0,87,88,89,0,0,0,42,89,88,90,0,89,88,90,0,0,0,42,89,90,91,0,89,90,91,0,0,0,42,91,90,92,0,91,90,92,0,0,0,42,92,90,93,0,92,90,93,0,0,0,42,92,93,94,0,92,93,94,0,0,0,42,94,93,95,0,94,93,95,0,0,0,42,94,95,96,0,94,95,96,0,0,0,42,96,95,97,0,96,95,97,0,0,0,42,96,97,98,0,96,97,98,0,0,0,42,98,97,99,0,98,97,99,0,0,0,42,98,99,100,0,98,99,100,0,0,0,42,98,100,101,0,98,100,101,0,0,0,42,101,100,102,0,101,100,102,0,0,0,42,102,100,103,0,102,100,103,0,0,0,42,102,103,104,0,102,103,104,0,0,0,42,102,104,105,0,102,104,105,0,0,0,42,105,104,106,0,105,104,106,0,0,0,42,106,104,107,0,106,104,107,0,0,0,42,106,107,50,0,106,107,50,0,0,1,42,50,107,46,0,50,107,46,1,0,0,42,108,109,110,1,46,107,50,2,2,2,42,110,109,111,1,50,107,106,2,2,2,42,109,112,111,1,107,104,106,2,3,2,42,111,112,113,1,106,104,105,2,3,2,42,113,112,114,1,105,104,102,2,3,2,42,112,115,114,1,104,103,102,3,2,2,42,115,116,114,1,103,100,102,2,2,2,42,114,116,117,1,102,100,101,2,2,2,42,117,116,118,1,101,100,98,2,2,2,42,116,119,118,1,100,99,98,2,2,2,42,119,120,118,1,99,97,98,2,2,2,42,118,120,121,1,98,97,96,2,2,2,42,120,122,121,1,97,95,96,2,2,2,42,121,122,123,1,96,95,94,2,2,2,42,122,124,123,1,95,93,94,2,2,2,42,123,124,125,1,94,93,92,2,2,2,42,124,126,125,1,93,90,92,2,2,2,42,125,126,127,1,92,90,91,2,2,2,42,127,126,128,1,91,90,89,2,2,2,42,126,129,128,1,90,88,89,2,2,2,42,128,129,130,1,89,88,87,2,2,2,42,129,131,130,1,88,86,87,2,2,2,42,130,131,132,1,87,86,68,2,2,2,42,133,132,131,1,32,68,86,2,2,2,42,134,135,136,1,40,30,62,2,3,2,42,135,137,136,1,30,29,62,3,2,2,42,137,138,136,1,29,85,62,2,2,2,42,138,139,136,1,85,84,62,2,2,2,42,139,140,136,1,84,83,62,2,2,2,42,140,141,136,1,83,82,62,2,2,2,42,141,142,136,1,82,81,62,2,3,2,42,142,143,136,1,81,80,62,3,3,2,42,143,144,136,1,80,74,62,3,2,2,42,145,146,147,1,4,2,7,2,2,2,42,147,146,148,1,7,2,79,2,2,2,42,146,149,148,1,2,77,79,2,2,2,42,148,149,150,1,79,77,78,2,2,2,42,150,149,151,1,78,77,76,2,2,3,42,149,152,151,1,77,51,76,2,2,3,42,151,152,153,1,76,51,75,3,2,3,42,152,110,153,1,51,50,75,2,2,3,42,153,110,144,1,75,50,74,3,2,2,42,144,110,136,1,74,50,62,2,2,2,42,110,154,136,1,50,73,62,2,2,2,42,154,155,136,1,73,72,62,2,3,2,42,155,156,136,1,72,71,62,3,2,2,42,156,157,136,1,71,70,62,2,2,2,42,157,158,136,1,70,69,62,2,2,2,42,158,159,136,1,69,61,62,2,2,2,42,133,160,132,1,32,33,68,2,2,2,42,132,160,161,1,68,33,67,2,2,2,42,161,160,162,1,67,33,66,2,2,2,42,162,160,163,1,66,33,65,2,2,2,42,163,160,164,1,65,33,64,2,2,2,42,164,160,165,1,64,33,63,2,2,2,42,165,160,159,1,63,33,61,2,2,2,42,136,159,160,1,62,61,33,2,2,2,42,135,134,166,1,30,40,60,3,2,2,42,166,134,167,1,60,40,59,2,2,2,42,167,134,168,1,59,40,58,2,2,2,42,168,134,169,1,58,40,57,2,2,2,42,169,134,170,1,57,40,56,2,2,2,42,170,134,171,1,56,40,55,2,2,3,42,171,134,172,1,55,40,47,3,2,3,42,147,173,145,1,7,5,4,2,3,2,42,145,173,174,1,4,5,54,2,3,2,42,174,173,175,1,54,5,3,2,3,2,42,173,176,175,1,5,53,3,3,2,2,42,176,177,175,1,53,52,3,2,2,2,42,177,178,175,1,52,49,3,2,2,2,42,152,179,110,1,51,0,50,2,2,2,42,179,175,110,1,0,3,50,2,2,2,42,110,175,108,1,50,3,46,2,2,2,42,175,178,108,1,3,49,46,2,2,2,42,178,180,108,1,49,48,46,2,2,2,42,180,172,108,1,48,47,46,2,3,2,42,172,134,108,1,47,40,46,3,2,2,42,108,134,181,1,46,40,45,2,2,2,42,181,134,182,1,45,40,44,2,2,2,42,182,134,183,1,44,40,43,2,2,2,42,183,134,184,1,43,40,42,2,2,3,42,184,134,185,1,42,40,41,3,2,2,42,185,134,186,1,41,40,39,2,2,2,42,134,187,186,1,40,31,39,2,3,2,42,186,187,188,1,39,31,38,2,3,2,42,188,187,189,1,38,31,37,2,3,2,42,189,187,190,1,37,31,36,2,3,2,42,190,187,191,1,36,31,35,2,3,2,42,191,187,192,1,35,31,34,2,3,2,42,192,187,133,1,34,31,32,2,3,2,42,160,133,187,1,33,32,31,2,2,3,42,135,193,137,1,30,27,29,3,2,2,42,137,193,194,1,29,27,28,2,2,3,42,194,193,195,1,28,27,26,3,2,2,42,193,196,195,1,27,25,26,2,2,2,42,195,196,197,1,26,25,23,2,2,2,42,196,198,197,1,25,24,23,2,3,2,42,198,199,197,1,24,21,23,3,2,2,42,197,199,200,1,23,21,22,2,2,2,42,200,199,201,1,22,21,19,2,2,2,42,199,202,201,1,21,20,19,2,2,2,42,202,203,201,1,20,17,19,2,3,2,42,201,203,204,1,19,17,18,2,3,2,42,204,203,205,1,18,17,15,2,3,2,42,203,206,205,1,17,16,15,3,3,2,42,206,207,205,1,16,13,15,3,2,2,42,205,207,208,1,15,13,14,2,2,2,42,208,207,209,1,14,13,12,2,2,2,42,207,210,209,1,13,11,12,2,3,2,42,209,210,211,1,12,11,9,2,3,2,42,210,212,211,1,11,10,9,3,2,2,42,212,213,211,1,10,8,9,2,2,2,42,211,213,214,1,9,8,6,2,2,2,42,213,173,214,1,8,5,6,2,3,2,42,147,214,173,1,7,6,5,2,2,3,42,145,215,146,1,4,1,2,2,2,2,42,175,179,215,1,3,0,1,2,2,2,42,146,215,179,1,2,1,0,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 236,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 324,
                    "normals": 4,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID599Geometry",
                "vertices": [0.298492,-0.356693,1.08828,0.359632,-0.356693,0.463159,0.498492,-0.356693,1.08828,0.359632,-0.356693,0.313159,0.602337,-0.356693,0.463159,0.635,-0.356693,0.06,0.636193,-0.356693,1.63005,0.635,-0.356693,1.63911,0.636193,-0.356693,0.069059,0.639689,-0.356693,1.62161,0.639689,-0.356693,0.0775,0.645251,-0.356693,0.084749,0.645251,-0.356693,1.61436,0.6525,-0.356693,0.090311,0.6525,-0.356693,1.6088,0.660941,-0.356693,1.6053,0.660941,-0.356693,0.093807,0.67,-0.356693,0.095,0.67,-0.356693,1.60411,0.679059,-0.356693,1.6053,0.679059,-0.356693,0.093807,0.6875,-0.356693,0.090311,0.6875,-0.356693,1.6088,0.694749,-0.356693,1.61436,0.694749,-0.356693,0.084749,0.700311,-0.356693,0.0775,0.700311,-0.356693,1.62161,0.703807,-0.356693,0.069059,0.703807,-0.356693,1.63005,0.705,-0.356693,1.63911,0.705,-0.356693,0.06,0,-0.356693,0,0.025,-0.356693,0.06,0,-0.356693,1.69911,0.026193,-0.356693,0.050941,0.029689,-0.356693,0.0425,0.035251,-0.356693,0.035251,0.0425,-0.356693,0.029689,0.050941,-0.356693,0.026193,0.06,-0.356693,0.025,0.73,-0.356693,0,0.069059,-0.356693,0.026193,0.0775,-0.356693,0.029689,0.084749,-0.356693,0.035251,0.090311,-0.356693,0.0425,0.093807,-0.356693,0.050941,0.095,-0.356693,0.06,0.660941,-0.356693,0.026193,0.6525,-0.356693,0.029689,0.645251,-0.356693,0.035251,0.095,-0.356693,1.63911,0.298492,-0.356693,1.48828,0.639689,-0.356693,0.0425,0.636193,-0.356693,0.050941,0.602337,-0.356693,0.313159,0.67,-0.356693,0.025,0.679059,-0.356693,0.026193,0.6875,-0.356693,0.029689,0.694749,-0.356693,0.035251,0.700311,-0.356693,0.0425,0.703807,-0.356693,0.050941,0.06,-0.356693,1.67411,0.73,-0.356693,1.69911,0.050941,-0.356693,1.67292,0.0425,-0.356693,1.66942,0.035251,-0.356693,1.66386,0.029689,-0.356693,1.65661,0.026193,-0.356693,1.64817,0.025,-0.356693,1.63911,0.069059,-0.356693,1.67292,0.0775,-0.356693,1.66942,0.084749,-0.356693,1.66386,0.090311,-0.356693,1.65661,0.093807,-0.356693,1.64817,0.660941,-0.356693,1.67292,0.6525,-0.356693,1.66942,0.645251,-0.356693,1.66386,0.498492,-0.356693,1.48828,0.639689,-0.356693,1.65661,0.636193,-0.356693,1.64817,0.67,-0.356693,1.67411,0.679059,-0.356693,1.67292,0.6875,-0.356693,1.66942,0.694749,-0.356693,1.66386,0.700311,-0.356693,1.65661,0.703807,-0.356693,1.64817,0.026193,-0.356693,0.069059,0.026193,-0.356693,1.63005,0.029689,-0.356693,0.0775,0.029689,-0.356693,1.62161,0.035251,-0.356693,0.084749,0.035251,-0.356693,1.61436,0.0425,-0.356693,1.6088,0.0425,-0.356693,0.090311,0.050941,-0.356693,1.6053,0.050941,-0.356693,0.093807,0.06,-0.356693,1.60411,0.06,-0.356693,0.095,0.069059,-0.356693,1.6053,0.069059,-0.356693,0.093807,0.0775,-0.356693,0.090311,0.0775,-0.356693,1.6088,0.084749,-0.356693,1.61436,0.084749,-0.356693,0.084749,0.090311,-0.356693,0.0775,0.090311,-0.356693,1.62161,0.093807,-0.356693,1.63005,0.093807,-0.356693,0.069059,0.095,-0.356693,0.06,0.093807,-0.356693,0.069059,0.095,-0.356693,1.63911,0.093807,-0.356693,1.63005,0.090311,-0.356693,0.0775,0.090311,-0.356693,1.62161,0.084749,-0.356693,1.61436,0.084749,-0.356693,0.084749,0.0775,-0.356693,0.090311,0.0775,-0.356693,1.6088,0.069059,-0.356693,1.6053,0.069059,-0.356693,0.093807,0.06,-0.356693,0.095,0.06,-0.356693,1.60411,0.050941,-0.356693,0.093807,0.050941,-0.356693,1.6053,0.0425,-0.356693,0.090311,0.0425,-0.356693,1.6088,0.035251,-0.356693,0.084749,0.035251,-0.356693,1.61436,0.029689,-0.356693,1.62161,0.029689,-0.356693,0.0775,0.026193,-0.356693,1.63005,0.026193,-0.356693,0.069059,0.025,-0.356693,1.63911,0.025,-0.356693,0.06,0.73,-0.356693,0,0.705,-0.356693,0.06,0.73,-0.356693,1.69911,0.705,-0.356693,1.63911,0.703807,-0.356693,1.64817,0.700311,-0.356693,1.65661,0.694749,-0.356693,1.66386,0.6875,-0.356693,1.66942,0.679059,-0.356693,1.67292,0.67,-0.356693,1.67411,0.660941,-0.356693,1.67292,0.602337,-0.356693,0.463159,0.498492,-0.356693,1.08828,0.635,-0.356693,1.63911,0.636193,-0.356693,1.64817,0.498492,-0.356693,1.48828,0.639689,-0.356693,1.65661,0.645251,-0.356693,1.66386,0.298492,-0.356693,1.48828,0.6525,-0.356693,1.66942,0.093807,-0.356693,1.64817,0.090311,-0.356693,1.65661,0.084749,-0.356693,1.66386,0.0775,-0.356693,1.66942,0.069059,-0.356693,1.67292,0.06,-0.356693,1.67411,0,-0.356693,1.69911,0.026193,-0.356693,1.64817,0.029689,-0.356693,1.65661,0.035251,-0.356693,1.66386,0.0425,-0.356693,1.66942,0.050941,-0.356693,1.67292,0.703807,-0.356693,0.050941,0.700311,-0.356693,0.0425,0.694749,-0.356693,0.035251,0.6875,-0.356693,0.029689,0.679059,-0.356693,0.026193,0.67,-0.356693,0.025,0.660941,-0.356693,0.026193,0.635,-0.356693,0.06,0.602337,-0.356693,0.313159,0.359632,-0.356693,0.313159,0.636193,-0.356693,0.050941,0.639689,-0.356693,0.0425,0.645251,-0.356693,0.035251,0.298492,-0.356693,1.08828,0.6525,-0.356693,0.029689,0.093807,-0.356693,0.050941,0.090311,-0.356693,0.0425,0.084749,-0.356693,0.035251,0.0775,-0.356693,0.029689,0.069059,-0.356693,0.026193,0.06,-0.356693,0.025,0,-0.356693,0,0.050941,-0.356693,0.026193,0.0425,-0.356693,0.029689,0.035251,-0.356693,0.035251,0.029689,-0.356693,0.0425,0.026193,-0.356693,0.050941,0.703807,-0.356693,0.069059,0.703807,-0.356693,1.63005,0.700311,-0.356693,1.62161,0.700311,-0.356693,0.0775,0.694749,-0.356693,1.61436,0.694749,-0.356693,0.084749,0.6875,-0.356693,0.090311,0.6875,-0.356693,1.6088,0.679059,-0.356693,1.6053,0.679059,-0.356693,0.093807,0.67,-0.356693,0.095,0.67,-0.356693,1.60411,0.660941,-0.356693,1.6053,0.660941,-0.356693,0.093807,0.6525,-0.356693,0.090311,0.6525,-0.356693,1.6088,0.645251,-0.356693,1.61436,0.645251,-0.356693,0.084749,0.639689,-0.356693,1.62161,0.639689,-0.356693,0.0775,0.636193,-0.356693,0.069059,0.636193,-0.356693,1.63005,0.359632,-0.356693,0.463159,0,-0.356693,0,0.73,-0.356693,0,0.73,-0.356693,1.69911,0,-0.356693,1.69911,0.029689,-0.356693,1.62161,0.035251,-0.356693,1.61436,0.026193,-0.356693,1.63005,0.025,-0.356693,1.63911,0.026193,-0.356693,1.64817,0.029689,-0.356693,1.65661,0.035251,-0.356693,1.66386,0.0425,-0.356693,1.66942,0.050941,-0.356693,1.67292,0.06,-0.356693,1.67411,0.069059,-0.356693,1.67292,0.0775,-0.356693,1.66942,0.084749,-0.356693,1.66386,0.090311,-0.356693,1.65661,0.093807,-0.356693,1.64817,0.095,-0.356693,1.63911,0.093807,-0.356693,1.63005,0.090311,-0.356693,1.62161,0.084749,-0.356693,1.61436,0.0775,-0.356693,1.6088,0.069059,-0.356693,1.6053,0.06,-0.356693,1.60411,0.050941,-0.356693,1.6053,0.0425,-0.356693,1.6088,0.660941,-0.356693,1.67292,0.6525,-0.356693,1.66942,0.67,-0.356693,1.67411,0.679059,-0.356693,1.67292,0.6875,-0.356693,1.66942,0.694749,-0.356693,1.66386,0.700311,-0.356693,1.65661,0.703807,-0.356693,1.64817,0.705,-0.356693,1.63911,0.703807,-0.356693,1.63005,0.700311,-0.356693,1.62161,0.694749,-0.356693,1.61436,0.6875,-0.356693,1.6088,0.679059,-0.356693,1.6053,0.67,-0.356693,1.60411,0.660941,-0.356693,1.6053,0.6525,-0.356693,1.6088,0.645251,-0.356693,1.61436,0.639689,-0.356693,1.62161,0.636193,-0.356693,1.63005,0.635,-0.356693,1.63911,0.636193,-0.356693,1.64817,0.639689,-0.356693,1.65661,0.645251,-0.356693,1.66386,0.0425,-0.356693,0.090311,0.035251,-0.356693,0.084749,0.050941,-0.356693,0.093807,0.06,-0.356693,0.095,0.069059,-0.356693,0.093807,0.0775,-0.356693,0.090311,0.084749,-0.356693,0.084749,0.090311,-0.356693,0.0775,0.093807,-0.356693,0.069059,0.095,-0.356693,0.06,0.093807,-0.356693,0.050941,0.090311,-0.356693,0.0425,0.084749,-0.356693,0.035251,0.0775,-0.356693,0.029689,0.069059,-0.356693,0.026193,0.06,-0.356693,0.025,0.050941,-0.356693,0.026193,0.0425,-0.356693,0.029689,0.035251,-0.356693,0.035251,0.029689,-0.356693,0.0425,0.026193,-0.356693,0.050941,0.025,-0.356693,0.06,0.026193,-0.356693,0.069059,0.029689,-0.356693,0.0775,0.660941,-0.356693,0.026193,0.67,-0.356693,0.025,0.6525,-0.356693,0.029689,0.645251,-0.356693,0.035251,0.639689,-0.356693,0.0425,0.636193,-0.356693,0.050941,0.635,-0.356693,0.06,0.636193,-0.356693,0.069059,0.639689,-0.356693,0.0775,0.645251,-0.356693,0.084749,0.6525,-0.356693,0.090311,0.660941,-0.356693,0.093807,0.67,-0.356693,0.095,0.679059,-0.356693,0.093807,0.6875,-0.356693,0.090311,0.694749,-0.356693,0.084749,0.700311,-0.356693,0.0775,0.703807,-0.356693,0.069059,0.705,-0.356693,0.06,0.703807,-0.356693,0.050941,0.700311,-0.356693,0.0425,0.694749,-0.356693,0.035251,0.6875,-0.356693,0.029689,0.679059,-0.356693,0.026193,0.498492,-0.356693,1.48828,0.498492,-0.356693,1.08828,0.298492,-0.356693,1.08828,0.298492,-0.356693,1.48828,0.359632,-0.356693,0.463159,0.602337,-0.356693,0.463159,0.602337,-0.356693,0.313159,0.359632,-0.356693,0.313159],
                "uvs": [[23.3929,17.6263,23.4766,17.2586,23.6668,17.6263,23.4766,17.1704,23.8091,17.2586,23.8538,17.0214,23.8555,17.945,23.8538,17.9503,23.8555,17.0268,23.8603,17.94,23.8603,17.0317,23.8679,17.036,23.8679,17.9358,23.8778,17.0393,23.8778,17.9325,23.8894,17.9304,23.8894,17.0413,23.9018,17.042,23.9018,17.9297,23.9142,17.9304,23.9142,17.0413,23.9257,17.0393,23.9257,17.9325,23.9357,17.9358,23.9357,17.036,23.9433,17.0317,23.9433,17.94,23.9481,17.0268,23.9481,17.945,23.9497,17.9503,23.9497,17.0214,22.984,16.9862,23.0182,17.0214,22.984,17.9856,23.0199,17.0161,23.0247,17.0112,23.0323,17.0069,23.0422,17.0036,23.0538,17.0016,23.0662,17.0009,23.984,16.9862,23.0786,17.0016,23.0902,17.0036,23.1001,17.0069,23.1077,17.0112,23.1125,17.0161,23.1141,17.0214,23.8894,17.0016,23.8778,17.0036,23.8679,17.0069,23.1141,17.9503,23.3929,17.8616,23.8603,17.0112,23.8555,17.0161,23.8091,17.1704,23.9018,17.0009,23.9142,17.0016,23.9257,17.0036,23.9357,17.0069,23.9433,17.0112,23.9481,17.0161,23.0662,17.9709,23.984,17.9856,23.0538,17.9702,23.0422,17.9682,23.0323,17.9649,23.0247,17.9606,23.0199,17.9557,23.0182,17.9503,23.0786,17.9702,23.0902,17.9682,23.1001,17.9649,23.1077,17.9606,23.1125,17.9557,23.8894,17.9702,23.8778,17.9682,23.8679,17.9649,23.6668,17.8616,23.8603,17.9606,23.8555,17.9557,23.9018,17.9709,23.9142,17.9702,23.9257,17.9682,23.9357,17.9649,23.9433,17.9606,23.9481,17.9557,23.0199,17.0268,23.0199,17.945,23.0247,17.0317,23.0247,17.94,23.0323,17.036,23.0323,17.9358,23.0422,17.9325,23.0422,17.0393,23.0538,17.9304,23.0538,17.0413,23.0662,17.9297,23.0662,17.042,23.0786,17.9304,23.0786,17.0413,23.0902,17.0393,23.0902,17.9325,23.1001,17.9358,23.1001,17.036,23.1077,17.0317,23.1077,17.94,23.1125,17.945,23.1125,17.0268]]
            },
            "materials": [{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_9",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_9.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "7A8ACABB-D06D-36B0-9DB2-F41A927C627A"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0.894406,-0.447188,0,0,-1,0,-1,0,0,-0.894406,0.447188,0,0,1,0,1,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,12,13,14,0,4,5,6,1,1,1,42,13,12,15,0,5,4,7,1,1,1,42,22,23,24,0,8,9,10,2,2,2,42,23,22,25,0,9,8,11,2,2,2,42,4,5,6,1,0,0,0,3,3,3,42,7,6,5,1,0,0,0,3,3,3,42,16,17,18,1,0,0,0,4,4,4,42,19,18,17,1,0,0,0,4,4,4,42,26,27,28,1,0,0,0,5,5,5,42,29,28,27,1,0,0,0,5,5,5],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 12,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 32,
                    "normals": 6,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID75Geometry",
                "vertices": [0.031496,-0.015748,0.362205,0.015748,-0.031496,0.330709,0.015748,-0.015748,0.362205,0.031496,-0.031496,0.330709,0.031496,-0.031496,0.330709,0.031496,-0.015748,0.362205,0.015748,-0.031496,0.330709,0.015748,-0.015748,0.362205,0.015748,-0.015748,0.362205,0.015748,-0.031496,0.330709,0.031496,-0.015748,0.362205,0.031496,-0.031496,0.330709,0.031496,-0.015748,0.362205,0.015748,0,0.362205,0.031496,0,0.362205,0.015748,-0.015748,0.362205,0.015748,-0.015748,0.362205,0.031496,-0.015748,0.362205,0.015748,0,0.362205,0.031496,0,0.362205,0.015748,0,0.362205,0.031496,0,0.362205,0.031496,-0,0.330709,0.015748,0,0.362205,0.015748,-0,0.330709,0.031496,0,0.362205,0.031496,0,0.362205,0.031496,-0,0.330709,0.015748,0,0.362205,0.015748,-0,0.330709,0.015748,-0,0.330709,0.031496,-0,0.330709],
                "uvs": [[0.007874,-0.079231,0.003937,-0.070427,0.003937,-0.079231,0.007874,-0.070427,0.007874,0.003937,0.003937,0,0.007874,0,0.003937,0.003937,0.007874,0.082677,0.003937,0.090551,0.003937,0.082677,0.007874,0.090551]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Corrogated_Shiny_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Corrogated_Shiny_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.666667,0.690196,0.8],
                "DbgColor": 15597568,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.666667,0.690196,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "71D1AF13-AF4E-3E4A-A8CB-62A7EF5D255D"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.999969,0,0,1,0,0,0,0,0.999969,0,0,1,0,0,-0.999969,0,0,-1,-0.999969,0,0,-1,0,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,1,42,1,0,3,0,3,2,1,0,0,1,42,12,13,14,0,4,5,6,2,2,3,42,13,12,15,0,7,6,5,2,2,3,42,22,23,24,0,8,9,10,4,4,5,42,23,22,25,0,11,10,9,4,4,5,42,32,33,34,0,12,13,14,6,6,7,42,33,32,35,0,15,14,13,6,6,7,42,4,5,6,1,0,0,0,7,6,6,42,7,6,5,1,0,0,0,7,6,6,42,16,17,18,1,0,0,0,5,4,4,42,19,18,17,1,0,0,0,5,4,4,42,26,27,28,1,0,0,0,3,2,2,42,29,28,27,1,0,0,0,3,2,2,42,36,37,38,1,0,0,0,1,0,0,42,39,38,37,1,0,0,0,1,0,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 16,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 40,
                    "normals": 8,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID530Geometry",
                "vertices": [0.498492,-0.356693,1.48828,0.498492,-0.406693,1.08828,0.498492,-0.356693,1.08828,0.498492,-0.406693,1.48828,0.498492,-0.406693,1.48828,0.498492,-0.356693,1.48828,0.498492,-0.406693,1.08828,0.498492,-0.356693,1.08828,0.498492,-0.356693,1.48828,0.498492,-0.356693,1.08828,0.498492,-0.406693,1.48828,0.498492,-0.406693,1.08828,0.298492,-0.406693,1.48828,0.498492,-0.356693,1.48828,0.298492,-0.356693,1.48828,0.498492,-0.406693,1.48828,0.498492,-0.406693,1.48828,0.298492,-0.406693,1.48828,0.498492,-0.356693,1.48828,0.298492,-0.356693,1.48828,0.298492,-0.356693,1.48828,0.298492,-0.406693,1.48828,0.498492,-0.406693,1.08828,0.298492,-0.356693,1.08828,0.498492,-0.356693,1.08828,0.298492,-0.406693,1.08828,0.298492,-0.406693,1.08828,0.498492,-0.406693,1.08828,0.298492,-0.356693,1.08828,0.498492,-0.356693,1.08828,0.298492,-0.356693,1.08828,0.298492,-0.406693,1.08828,0.298492,-0.406693,1.48828,0.298492,-0.356693,1.08828,0.298492,-0.406693,1.08828,0.298492,-0.356693,1.48828,0.298492,-0.356693,1.48828,0.298492,-0.406693,1.48828,0.298492,-0.356693,1.08828,0.298492,-0.406693,1.08828],
                "uvs": [[41.5938,0.029412,41.5938,-0,41.0459,0.029412,41.0459,0,-23.6668,0.029412,-23.3929,0.029412,-23.6668,-0,-23.3929,-0,23.3929,0.029412,23.6668,0.029412,23.3929,0,23.6668,0,-41.5938,-0,-41.5938,0.029412,-41.0459,0,-41.0459,0.029412]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.133333,0.133333,0.133333],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0136_Charcoal_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.133333,0.133333,0.133333],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "E29072AC-2015-3398-B90A-93A7735F8753"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0,1,-1,0,0,1,0,0,0,0,-1,0.999969,0,0,-0.999969,0,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,12,13,14,0,4,5,6,1,1,1,42,13,12,15,0,5,4,7,1,1,1,42,22,23,24,0,8,9,10,2,2,2,42,23,22,25,0,9,8,11,2,2,2,42,32,33,34,0,3,12,1,0,0,0,42,33,32,35,0,12,3,13,0,0,0,42,42,43,44,0,14,15,16,3,3,3,42,43,42,45,0,15,14,17,3,3,3,42,52,53,54,0,18,19,20,2,4,2,42,53,52,55,0,19,18,21,4,2,2,42,62,63,64,0,22,5,6,1,1,1,42,63,62,65,0,5,22,23,1,1,1,42,54,72,73,0,20,9,10,2,2,2,42,72,54,53,0,9,20,19,2,2,4,42,78,79,80,0,13,24,12,0,0,0,42,79,78,81,0,24,13,25,0,0,0,42,4,5,6,1,0,0,0,3,3,3,42,7,6,5,1,0,0,0,3,3,3,42,16,17,18,1,0,0,0,2,2,2,42,19,18,17,1,0,0,0,2,2,2,42,26,27,28,1,0,0,0,1,1,1,42,29,28,27,1,0,0,0,1,1,1,42,36,37,38,1,0,0,0,3,3,3,42,39,38,37,1,0,0,0,3,3,3,42,46,47,48,1,0,0,0,0,0,0,42,49,48,47,1,0,0,0,0,0,0,42,56,57,58,1,0,0,0,1,1,5,42,59,58,57,1,0,0,0,1,5,1,42,66,67,68,1,0,0,0,2,2,2,42,69,68,67,1,0,0,0,2,2,2,42,58,59,74,1,0,0,0,5,1,1,42,75,74,59,1,0,0,0,1,1,1,42,82,83,84,1,0,0,0,3,3,3,42,85,84,83,1,0,0,0,3,3,3],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 36,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 86,
                    "normals": 6,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID45Geometry",
                "vertices": [0.129429,-0.153543,0.041339,0.145177,-0.137795,0.041339,0.129429,-0.137795,0.041339,0.145177,-0.153543,0.041339,0.145177,-0.153543,0.041339,0.129429,-0.153543,0.041339,0.145177,-0.137795,0.041339,0.129429,-0.137795,0.041339,0.129429,-0.153543,0.041339,0.145177,-0.153543,0.041339,0.145177,-0.137795,0.041339,0.129429,-0.137795,0.041339,0.145177,-0.153543,0.190945,0.145177,-0.137795,0.041339,0.145177,-0.153543,0.041339,0.145177,-0.137795,0.190945,0.145177,-0.137795,0.190945,0.145177,-0.153543,0.190945,0.145177,-0.137795,0.041339,0.145177,-0.153543,0.041339,0.145177,-0.153543,0.190945,0.145177,-0.137795,0.190945,0.129429,-0.137795,0.206693,0.129429,-0.153543,0.041339,0.129429,-0.137795,0.041339,0.129429,-0.153543,0.206693,0.129429,-0.153543,0.206693,0.129429,-0.137795,0.206693,0.129429,-0.153543,0.041339,0.129429,-0.137795,0.041339,0.129429,-0.153543,0.206693,0.129429,-0.137795,0.206693,0.145177,-0.153543,0.190945,0.189469,-0.137795,0.190945,0.145177,-0.137795,0.190945,0.189469,-0.153543,0.190945,0.189469,-0.153543,0.190945,0.145177,-0.153543,0.190945,0.189469,-0.137795,0.190945,0.145177,-0.137795,0.190945,0.189469,-0.153543,0.190945,0.189469,-0.137795,0.190945,0.205216,-0.153543,0.206693,0.129429,-0.137795,0.206693,0.205216,-0.137795,0.206693,0.129429,-0.153543,0.206693,0.129429,-0.153543,0.206693,0.205216,-0.153543,0.206693,0.129429,-0.137795,0.206693,0.205216,-0.137795,0.206693,0.205216,-0.153543,0.206693,0.205216,-0.137795,0.206693,0.189469,-0.137795,0.190945,0.189469,-0.153543,0.057087,0.189469,-0.137795,0.057087,0.189469,-0.153543,0.190945,0.189469,-0.153543,0.190945,0.189469,-0.137795,0.190945,0.189469,-0.153543,0.057087,0.189469,-0.137795,0.057087,0.189469,-0.153543,0.057087,0.189469,-0.137795,0.057087,0.205216,-0.153543,0.206693,0.205216,-0.137795,0.041339,0.205216,-0.153543,0.041339,0.205216,-0.137795,0.206693,0.205216,-0.137795,0.206693,0.205216,-0.153543,0.206693,0.205216,-0.137795,0.041339,0.205216,-0.153543,0.041339,0.205216,-0.153543,0.041339,0.205216,-0.137795,0.041339,0.189469,-0.153543,0.041339,0.189469,-0.137795,0.041339,0.189469,-0.153543,0.041339,0.189469,-0.137795,0.041339,0.189469,-0.153543,0.041339,0.189469,-0.137795,0.041339,0.189469,-0.153543,0.041339,0.205216,-0.137795,0.041339,0.189469,-0.137795,0.041339,0.205216,-0.153543,0.041339,0.205216,-0.153543,0.041339,0.189469,-0.153543,0.041339,0.205216,-0.137795,0.041339,0.189469,-0.137795,0.041339],
                "uvs": [[-0.032357,0.038386,-0.036294,0.034449,-0.032357,0.034449,-0.036294,0.038386,-0.047736,0.038386,-0.010335,0.034449,-0.010335,0.038386,-0.047736,0.034449,0.051673,0.034449,0.010335,0.038386,0.010335,0.034449,0.051673,0.038386,-0.047367,0.034449,-0.047367,0.038386,0.051304,0.038386,0.032357,0.034449,0.051304,0.034449,0.032357,0.038386,0.047736,0.034449,0.014272,0.038386,0.014272,0.034449,0.047736,0.038386,-0.051673,0.038386,-0.051673,0.034449,-0.051304,0.034449,-0.051304,0.038386]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Corrogated_Shiny_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Corrogated_Shiny_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.666667,0.690196,0.8],
                "DbgColor": 15597568,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.666667,0.690196,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "DFC6DB66-ABF8-3623-87A5-E3548B01340D"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.016Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.015",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "B988BEE5-5F9E-3D39-A31F-605E61431FF9"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.004Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default.003",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "B0EC0887-9366-33F9-A485-4316189EE455"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.020Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.019",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "9929E54E-6440-3A3D-B6AB-46774A96106C"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [-0.258797,0,0.965911,-0.499985,0,0.866024,-0.707083,0,0.707083,0,0,1,-0.866024,0,0.499985,0.258797,0,0.965911,-0.965911,0,0.258797,0.499985,0,0.866024,-1,0,0,0.707083,0,0.707083,-0.965911,0,-0.258797,0.866024,0,0.499985,-0.866024,0,-0.499985,0.965911,0,0.258797,-0.707083,0,-0.707083,1,0,0,-0.499985,0,-0.866024,0.965911,0,-0.258797,-0.258797,0,-0.965911,0.866024,0,-0.499985,0,0,-1,0.707083,0,-0.707083,0.258797,0,-0.965911,0.499985,0,-0.866024,0,0,-0.999969,0,0,0.999969],
                "faces": [42,0,1,2,0,0,1,2,0,1,0,42,1,0,3,0,3,2,1,1,0,1,42,1,12,13,0,4,5,6,1,2,2,42,12,1,3,0,7,6,5,2,1,1,42,18,2,19,0,8,9,10,3,0,3,42,2,18,0,0,11,10,9,0,3,0,42,12,24,13,0,12,13,14,2,4,2,42,24,12,25,0,15,14,13,4,2,4,42,30,18,19,0,16,17,18,5,3,3,42,18,30,31,0,19,18,17,3,5,5,42,36,24,25,0,20,21,22,6,4,4,42,24,36,37,0,23,22,21,4,6,6,42,42,30,43,0,24,25,26,7,5,7,42,30,42,31,0,27,26,25,5,7,5,42,48,37,36,0,28,29,30,8,6,6,42,37,48,49,0,31,30,29,6,8,8,42,54,43,55,0,32,33,34,9,7,9,42,43,54,42,0,35,34,33,7,9,7,42,60,49,48,0,36,37,38,10,8,8,42,49,60,61,0,39,38,37,8,10,10,42,66,54,55,0,40,41,42,11,9,9,42,54,66,67,0,43,42,41,9,11,11,42,72,61,60,0,44,45,46,12,10,10,42,61,72,73,0,47,46,45,10,12,12,42,78,67,66,0,48,49,50,13,11,11,42,67,78,79,0,51,50,49,11,13,13,42,84,73,72,0,52,53,54,14,12,12,42,73,84,85,0,55,54,53,12,14,14,42,90,79,78,0,56,57,58,15,13,13,42,79,90,91,0,59,58,57,13,15,15,42,84,96,85,0,60,61,62,14,16,14,42,96,84,97,0,63,62,61,16,14,16,42,102,91,90,0,64,65,66,17,15,15,42,91,102,103,0,67,66,65,15,17,17,42,97,108,96,0,68,69,70,16,18,16,42,108,97,109,0,71,70,69,18,16,18,42,114,103,102,0,72,73,74,19,17,17,42,103,114,115,0,75,74,73,17,19,19,42,108,120,121,0,76,77,78,18,20,20,42,120,108,109,0,79,78,77,20,18,18,42,126,115,114,0,80,81,82,21,19,19,42,115,126,127,0,83,82,81,19,21,21,42,120,132,121,0,84,85,86,20,22,20,42,132,120,133,0,87,86,85,22,20,22,42,138,127,126,0,88,89,90,23,21,21,42,127,138,139,0,91,90,89,21,23,23,42,133,138,132,0,92,93,94,22,23,22,42,138,133,139,0,95,94,93,23,22,23,42,4,5,6,1,0,0,0,23,22,23,42,7,6,5,1,0,0,0,22,23,22,42,4,6,14,1,0,0,0,23,23,21,42,15,14,6,1,0,0,0,21,21,23,42,5,20,7,1,0,0,0,22,24,22,42,21,7,20,1,0,0,0,20,22,24,42,26,14,27,1,0,0,0,19,21,19,42,15,27,14,1,0,0,0,21,19,21,42,32,33,20,1,0,0,0,18,18,24,42,21,20,33,1,0,0,0,20,24,18,42,38,39,27,1,0,0,0,17,17,19,42,26,27,39,1,0,0,0,19,19,17,42,32,44,33,1,0,0,0,18,16,18,42,45,33,44,1,0,0,0,16,18,16,42,50,51,38,1,0,0,0,15,15,17,42,39,38,51,1,0,0,0,17,17,15,42,44,56,45,1,0,0,0,16,14,16,42,57,45,56,1,0,0,0,14,16,14,42,62,63,50,1,0,0,0,13,13,15,42,51,50,63,1,0,0,0,15,15,13,42,68,69,56,1,0,0,0,12,12,14,42,57,56,69,1,0,0,0,14,14,12,42,74,75,62,1,0,0,0,11,11,13,42,63,62,75,1,0,0,0,13,13,11,42,80,81,68,1,0,0,0,10,10,12,42,69,68,81,1,0,0,0,12,12,10,42,86,87,74,1,0,0,0,9,9,11,42,75,74,87,1,0,0,0,11,11,9,42,92,93,80,1,0,0,0,8,8,10,42,81,80,93,1,0,0,0,10,10,8,42,98,87,99,1,0,0,0,7,9,7,42,86,99,87,1,0,0,0,9,7,9,42,104,105,92,1,0,0,0,6,6,8,42,93,92,105,1,0,0,0,8,8,6,42,110,98,111,1,0,0,0,5,7,5,42,99,111,98,1,0,0,0,7,5,7,42,116,117,104,1,0,0,0,4,4,6,42,105,104,117,1,0,0,0,6,6,4,42,110,111,122,1,0,0,0,5,5,25,42,123,122,111,1,0,0,0,3,25,5,42,128,129,116,1,0,0,0,2,2,4,42,117,116,129,1,0,0,0,4,4,2,42,134,122,135,1,0,0,0,0,25,0,42,123,135,122,1,0,0,0,3,0,25,42,140,141,128,1,0,0,0,1,1,2,42,129,128,141,1,0,0,0,2,2,1,42,140,134,141,1,0,0,0,1,0,1,42,135,141,134,1,0,0,0,0,1,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 96,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 144,
                    "normals": 26,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "Arduino_NanoGeometry",
                "vertices": [0.069059,-0.356693,0.026193,0.0775,-0.306693,0.029689,0.069059,-0.306693,0.026193,0.0775,-0.356693,0.029689,0.0775,-0.356693,0.029689,0.069059,-0.356693,0.026193,0.0775,-0.306693,0.029689,0.069059,-0.306693,0.026193,0.069059,-0.356693,0.026193,0.0775,-0.356693,0.029689,0.0775,-0.306693,0.029689,0.069059,-0.306693,0.026193,0.084749,-0.356693,0.035251,0.084749,-0.306693,0.035251,0.084749,-0.356693,0.035251,0.084749,-0.306693,0.035251,0.084749,-0.356693,0.035251,0.084749,-0.306693,0.035251,0.06,-0.356693,0.025,0.06,-0.306693,0.025,0.06,-0.356693,0.025,0.06,-0.306693,0.025,0.06,-0.356693,0.025,0.06,-0.306693,0.025,0.090311,-0.306693,0.0425,0.090311,-0.356693,0.0425,0.090311,-0.356693,0.0425,0.090311,-0.306693,0.0425,0.090311,-0.356693,0.0425,0.090311,-0.306693,0.0425,0.050941,-0.306693,0.026193,0.050941,-0.356693,0.026193,0.050941,-0.356693,0.026193,0.050941,-0.306693,0.026193,0.050941,-0.356693,0.026193,0.050941,-0.306693,0.026193,0.093807,-0.356693,0.050941,0.093807,-0.306693,0.050941,0.093807,-0.306693,0.050941,0.093807,-0.356693,0.050941,0.093807,-0.356693,0.050941,0.093807,-0.306693,0.050941,0.0425,-0.356693,0.029689,0.0425,-0.306693,0.029689,0.0425,-0.356693,0.029689,0.0425,-0.306693,0.029689,0.0425,-0.356693,0.029689,0.0425,-0.306693,0.029689,0.095,-0.356693,0.06,0.095,-0.306693,0.06,0.095,-0.306693,0.06,0.095,-0.356693,0.06,0.095,-0.356693,0.06,0.095,-0.306693,0.06,0.035251,-0.356693,0.035251,0.035251,-0.306693,0.035251,0.035251,-0.356693,0.035251,0.035251,-0.306693,0.035251,0.035251,-0.356693,0.035251,0.035251,-0.306693,0.035251,0.093807,-0.356693,0.069059,0.093807,-0.306693,0.069059,0.093807,-0.306693,0.069059,0.093807,-0.356693,0.069059,0.093807,-0.356693,0.069059,0.093807,-0.306693,0.069059,0.029689,-0.306693,0.0425,0.029689,-0.356693,0.0425,0.029689,-0.356693,0.0425,0.029689,-0.306693,0.0425,0.029689,-0.356693,0.0425,0.029689,-0.306693,0.0425,0.090311,-0.356693,0.0775,0.090311,-0.306693,0.0775,0.090311,-0.306693,0.0775,0.090311,-0.356693,0.0775,0.090311,-0.356693,0.0775,0.090311,-0.306693,0.0775,0.026193,-0.306693,0.050941,0.026193,-0.356693,0.050941,0.026193,-0.356693,0.050941,0.026193,-0.306693,0.050941,0.026193,-0.356693,0.050941,0.026193,-0.306693,0.050941,0.084749,-0.356693,0.084749,0.084749,-0.306693,0.084749,0.084749,-0.306693,0.084749,0.084749,-0.356693,0.084749,0.084749,-0.356693,0.084749,0.084749,-0.306693,0.084749,0.025,-0.306693,0.06,0.025,-0.356693,0.06,0.025,-0.356693,0.06,0.025,-0.306693,0.06,0.025,-0.356693,0.06,0.025,-0.306693,0.06,0.0775,-0.306693,0.090311,0.0775,-0.356693,0.090311,0.0775,-0.356693,0.090311,0.0775,-0.306693,0.090311,0.0775,-0.356693,0.090311,0.0775,-0.306693,0.090311,0.026193,-0.306693,0.069059,0.026193,-0.356693,0.069059,0.026193,-0.356693,0.069059,0.026193,-0.306693,0.069059,0.026193,-0.356693,0.069059,0.026193,-0.306693,0.069059,0.069059,-0.306693,0.093807,0.069059,-0.356693,0.093807,0.069059,-0.356693,0.093807,0.069059,-0.306693,0.093807,0.069059,-0.356693,0.093807,0.069059,-0.306693,0.093807,0.029689,-0.306693,0.0775,0.029689,-0.356693,0.0775,0.029689,-0.356693,0.0775,0.029689,-0.306693,0.0775,0.029689,-0.356693,0.0775,0.029689,-0.306693,0.0775,0.06,-0.356693,0.095,0.06,-0.306693,0.095,0.06,-0.356693,0.095,0.06,-0.306693,0.095,0.06,-0.356693,0.095,0.06,-0.306693,0.095,0.035251,-0.306693,0.084749,0.035251,-0.356693,0.084749,0.035251,-0.356693,0.084749,0.035251,-0.306693,0.084749,0.035251,-0.356693,0.084749,0.035251,-0.306693,0.084749,0.050941,-0.306693,0.093807,0.050941,-0.356693,0.093807,0.050941,-0.356693,0.093807,0.050941,-0.306693,0.093807,0.050941,-0.356693,0.093807,0.050941,-0.306693,0.093807,0.0425,-0.306693,0.090311,0.0425,-0.356693,0.090311,0.0425,-0.356693,0.090311,0.0425,-0.306693,0.090311,0.0425,-0.356693,0.090311,0.0425,-0.306693,0.090311],
                "uvs": [[-36.4852,0,-36.4727,0,-36.4852,-0.029412,-36.4727,-0.029412,-42.4231,0,-42.4231,-0.029412,-42.4356,0,-42.4356,-0.029412,-28.0488,0,-28.0363,-0,-28.0488,-0.029412,-28.0363,-0.029412,-45.4945,-0,-45.482,-0,-45.4945,-0.029412,-45.482,-0.029412,-17.6889,-0,-17.6889,-0.029412,-17.7014,-0,-17.7014,-0.029412,-45.4534,-0.029412,-45.4534,0,-45.4409,-0.029412,-45.4409,0,-6.14808,0,-6.13556,0,-6.14808,-0.029412,-6.13556,-0.029412,-42.3152,-0.029412,-42.3152,-0,-42.3027,-0.029412,-42.3027,-0,5.82379,0,5.83631,0,5.82379,-0.029412,5.83631,-0.029412,-36.2938,-0.029412,-36.2938,-0,-36.2812,-0.029412,-36.2812,-0,17.4109,0,17.4109,-0.029412,17.3984,0,17.3984,-0.029412,-27.7993,-0.029412,-27.7993,-0,-27.7868,-0.029412,-27.7868,-0,27.7993,-0,27.7993,-0.029412,27.7868,-0,27.7868,-0.029412,-17.4109,-0.029412,-17.4109,-0,-17.3984,-0.029412,-17.3984,0,36.2938,0,36.2938,-0.029412,36.2812,0,36.2812,-0.029412,-5.83631,0,-5.82379,-0,-5.83631,-0.029412,-5.82379,-0.029412,42.3152,-0,42.3152,-0.029412,42.3027,-0,42.3027,-0.029412,6.13556,0,6.14808,0,6.13556,-0.029412,6.14808,-0.029412,45.4534,0,45.4534,-0.029412,45.4409,0,45.4409,-0.029412,17.7014,-0,17.7014,-0.029412,17.6889,-0,17.6889,-0.029412,45.4945,-0,45.4945,-0.029412,45.482,-0,45.482,-0.029412,28.0363,-0,28.0488,-0,28.0363,-0.029412,28.0488,-0.029412,42.4356,0,42.4356,-0.029412,42.4231,-0,42.4231,-0.029412,36.4727,0,36.4852,0,36.4727,-0.029412,36.4852,-0.029412]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.956863,0.956863,0.862745],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0049_Beige_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.956863,0.956863,0.862745],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "9A08F511-0964-3B76-B803-6271DABF9D8A"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.013Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.012",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "2E7FE112-D814-3AF1-950F-74ACEF387701"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0,-1,-1,0,0,1,0,0,0,0,1],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,3,2,1,0,0,0,42,12,13,14,0,4,5,6,1,1,1,42,13,12,15,0,7,6,5,1,1,1,42,22,23,24,0,8,9,10,2,2,2,42,23,22,25,0,11,10,9,2,2,2,42,32,33,34,0,12,13,14,3,3,3,42,33,32,35,0,15,14,13,3,3,3,42,4,5,6,1,0,0,0,3,3,3,42,7,6,5,1,0,0,0,3,3,3,42,16,17,18,1,0,0,0,2,2,2,42,19,18,17,1,0,0,0,2,2,2,42,26,27,28,1,0,0,0,1,1,1,42,29,28,27,1,0,0,0,1,1,1,42,36,37,38,1,0,0,0,0,0,0,42,39,38,37,1,0,0,0,0,0,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 16,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 40,
                    "normals": 4,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID639Geometry",
                "vertices": [0.520671,-0.306693,1.00891,0.240671,-0.256693,1.00891,0.520671,-0.256693,1.00891,0.240671,-0.306693,1.00891,0.240671,-0.306693,1.00891,0.520671,-0.306693,1.00891,0.240671,-0.256693,1.00891,0.520671,-0.256693,1.00891,0.240671,-0.306693,1.00891,0.520671,-0.306693,1.00891,0.240671,-0.256693,1.00891,0.520671,-0.256693,1.00891,0.240671,-0.306693,1.25891,0.240671,-0.256693,1.00891,0.240671,-0.306693,1.00891,0.240671,-0.256693,1.25891,0.240671,-0.256693,1.25891,0.240671,-0.306693,1.25891,0.240671,-0.256693,1.00891,0.240671,-0.306693,1.00891,0.240671,-0.306693,1.25891,0.240671,-0.256693,1.25891,0.520671,-0.256693,1.25891,0.520671,-0.306693,1.00891,0.520671,-0.256693,1.00891,0.520671,-0.306693,1.25891,0.520671,-0.306693,1.25891,0.520671,-0.256693,1.25891,0.520671,-0.306693,1.00891,0.520671,-0.256693,1.00891,0.520671,-0.306693,1.25891,0.520671,-0.256693,1.25891,0.240671,-0.306693,1.25891,0.520671,-0.256693,1.25891,0.240671,-0.256693,1.25891,0.520671,-0.306693,1.25891,0.520671,-0.306693,1.25891,0.240671,-0.306693,1.25891,0.520671,-0.256693,1.25891,0.240671,-0.256693,1.25891],
                "uvs": [[23.3137,-0.029412,23.6972,-0.029412,23.3137,-0.058824,23.6972,-0.058824,-41.2796,-0.058824,-41.2796,-0.029412,-40.9372,-0.058824,-40.9372,-0.029412,41.2796,-0.029412,41.2796,-0.058824,40.9372,-0.029412,40.9372,-0.058824,-23.6972,-0.029412,-23.3137,-0.029412,-23.6972,-0.058824,-23.3137,-0.058824]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.133333,0.133333,0.133333],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0136_Charcoal_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.133333,0.133333,0.133333],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "D1CC1563-A9A1-360D-8363-0D8E09A5B122"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.022Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.021",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "911254FF-0E72-34F0-9322-90AD7D547C6A"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.006Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.005",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "5DB34F46-BE6A-3743-8DD3-C5A7D82EDB03"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0,1,1,0,0,0.999969,0,0,0,1,0,-0.999969,0,0,-1,0,0,0,0,-1,0,-1,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,3,2,1,0,0,0,42,12,13,14,0,4,5,6,1,2,1,42,13,12,15,0,7,6,5,2,1,1,42,22,23,24,0,8,9,10,3,3,3,42,23,22,25,0,11,10,9,3,3,3,42,31,32,33,0,12,13,14,4,5,5,42,32,31,34,0,15,14,13,5,4,5,42,40,41,42,0,16,17,18,6,6,6,42,41,40,43,0,19,18,17,6,6,6,42,4,5,6,1,0,0,0,6,6,6,42,7,6,5,1,0,0,0,6,6,6,42,16,17,18,1,0,0,0,5,5,4,42,19,18,17,1,0,0,0,5,4,5,42,26,27,28,1,0,0,0,7,7,7,42,29,28,27,1,0,0,0,7,7,7,42,35,36,37,1,0,0,0,1,2,1,42,38,37,36,1,0,0,0,1,1,2,42,44,45,46,1,0,0,0,0,0,0,42,47,46,45,1,0,0,0,0,0,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 20,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 48,
                    "normals": 8,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID587Geometry",
                "vertices": [0.145996,-0.306693,0.611794,0.195996,-0.281693,0.611794,0.145996,-0.281693,0.611794,0.195996,-0.306693,0.611794,0.195996,-0.306693,0.611794,0.145996,-0.306693,0.611794,0.195996,-0.281693,0.611794,0.145996,-0.281693,0.611794,0.195996,-0.306693,0.611794,0.145996,-0.306693,0.611794,0.195996,-0.281693,0.611794,0.145996,-0.281693,0.611794,0.195996,-0.281693,0.536794,0.195996,-0.306693,0.611794,0.195996,-0.306693,0.536794,0.195996,-0.281693,0.611794,0.195996,-0.281693,0.611794,0.195996,-0.281693,0.536794,0.195996,-0.306693,0.611794,0.195996,-0.306693,0.536794,0.195996,-0.306693,0.536794,0.195996,-0.281693,0.536794,0.195996,-0.281693,0.611794,0.145996,-0.281693,0.536794,0.145996,-0.281693,0.611794,0.195996,-0.281693,0.536794,0.195996,-0.281693,0.536794,0.195996,-0.281693,0.611794,0.145996,-0.281693,0.536794,0.145996,-0.281693,0.611794,0.145996,-0.281693,0.536794,0.145996,-0.306693,0.611794,0.145996,-0.281693,0.536794,0.145996,-0.306693,0.536794,0.145996,-0.281693,0.611794,0.145996,-0.281693,0.611794,0.145996,-0.306693,0.611794,0.145996,-0.281693,0.536794,0.145996,-0.306693,0.536794,0.145996,-0.306693,0.536794,0.195996,-0.306693,0.536794,0.145996,-0.281693,0.536794,0.195996,-0.281693,0.536794,0.145996,-0.306693,0.536794,0.145996,-0.306693,0.536794,0.195996,-0.306693,0.536794,0.145996,-0.281693,0.536794,0.195996,-0.281693,0.536794],
                "uvs": [[-23.2525,-0.029412,-23.184,-0.029412,-23.2525,-0.044118,-23.184,-0.044118,40.3932,-0.044118,40.2905,-0.044118,40.3932,-0.029412,40.2905,-0.029412,-23.2525,17.3019,-23.2525,17.346,-23.184,17.3019,-23.184,17.346,-40.3932,-0.044118,-40.3932,-0.029412,-40.2905,-0.044118,-40.2905,-0.029412,23.184,-0.029412,23.2525,-0.029412,23.184,-0.044118,23.2525,-0.044118]]
            },
            "materials": [{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.933333,0.207843,0.168627],
                "DbgColor": 15597568,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_10",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.933333,0.207843,0.168627],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "A7D67BB3-C43E-311E-8FC9-A92E5068F33D"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,1,0,0,-1,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 4,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 12,
                    "normals": 2,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID664Geometry",
                "vertices": [0.240671,-0.256693,1.25891,0.520671,-0.256693,1.00891,0.240671,-0.256693,1.00891,0.520671,-0.256693,1.25891,0.520671,-0.256693,1.25891,0.240671,-0.256693,1.25891,0.520671,-0.256693,1.00891,0.240671,-0.256693,1.00891,0.520671,-0.256693,1.25891,0.240671,-0.256693,1.25891,0.520671,-0.256693,1.00891,0.240671,-0.256693,1.00891],
                "uvs": [[-23.3137,17.7267,-23.6972,17.5796,-23.3137,17.5796,-23.6972,17.7267]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "3C6A3809-796B-3CA7-B5EF-F2E04C2F8C48"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0.999969,0,0,1,0,1,0,0,0,0,-0.999969,0,0,-1,-1,0,0,0,-0.999969,0,0,-1,0,0,0,1,0,0,0.999969],
                "faces": [34,0,1,2,0,0,0,1,34,1,0,3,0,0,0,1,34,12,13,14,0,2,2,2,34,13,12,15,0,2,2,2,34,22,23,24,0,3,3,4,34,23,22,25,0,3,3,4,34,31,32,33,0,5,5,5,34,32,31,34,0,5,5,5,34,40,41,42,0,6,6,7,34,41,40,43,0,6,6,7,34,4,5,6,1,7,6,6,34,7,6,5,1,7,6,6,34,16,17,18,1,5,5,5,34,19,18,17,1,5,5,5,34,26,27,28,1,8,9,9,34,29,28,27,1,8,9,9,34,35,36,37,1,2,2,2,34,38,37,36,1,2,2,2,34,44,45,46,1,1,0,0,34,47,46,45,1,1,0,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 20,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 48,
                    "normals": 10,
                    "uvs": 0
                },
                "influencesPerVertex": 2,
                "name": "ID65Geometry",
                "vertices": [0.263285,-0.059926,0.299213,0.071361,-0.059926,0.041339,0.071361,-0.059926,0.299213,0.263285,-0.059926,0.041339,0.263285,-0.059926,0.041339,0.263285,-0.059926,0.299213,0.071361,-0.059926,0.041339,0.071361,-0.059926,0.299213,0.071361,-0.059926,0.299213,0.263285,-0.059926,0.299213,0.263285,-0.059926,0.041339,0.071361,-0.059926,0.041339,0.263285,-0.059926,0.299213,0.263285,-0.103402,0.041339,0.263285,-0.059926,0.041339,0.263285,-0.103402,0.299213,0.263285,-0.103402,0.299213,0.263285,-0.059926,0.299213,0.263285,-0.103402,0.041339,0.263285,-0.059926,0.041339,0.263285,-0.103402,0.299213,0.263285,-0.103402,0.041339,0.263285,-0.103402,0.041339,0.071361,-0.059926,0.041339,0.263285,-0.059926,0.041339,0.071361,-0.103402,0.041339,0.071361,-0.103402,0.041339,0.263285,-0.103402,0.041339,0.071361,-0.059926,0.041339,0.263285,-0.059926,0.041339,0.071361,-0.103402,0.041339,0.071361,-0.103402,0.299213,0.071361,-0.059926,0.041339,0.071361,-0.103402,0.041339,0.071361,-0.059926,0.299213,0.071361,-0.059926,0.299213,0.071361,-0.103402,0.299213,0.071361,-0.059926,0.041339,0.071361,-0.103402,0.041339,0.071361,-0.103402,0.299213,0.263285,-0.103402,0.041339,0.071361,-0.103402,0.299213,0.071361,-0.103402,0.041339,0.263285,-0.103402,0.299213,0.263285,-0.103402,0.299213,0.263285,-0.103402,0.041339,0.071361,-0.103402,0.299213,0.071361,-0.103402,0.041339],
                "uvs": []
            },
            "materials": [{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.133333,0.133333,0.133333],
                "DbgColor": 15597568,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0136_Charcoal_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.133333,0.133333,0.133333],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.666667,0.690196,0.8],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.666667,0.690196,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "60CB4A99-1DE8-33B7-B3A5-8E42B5FD4929"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.002Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default.001",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "19711DAF-357D-36AD-A97F-29C697D2B320"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,1,0,0,0.999969,0,0,-0.999969,0,0,-1,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,1,3,4,0,1,3,4,0,0,0,42,4,3,5,0,4,3,5,0,0,0,42,4,5,6,0,4,5,6,0,0,0,42,6,5,7,0,6,5,7,0,0,0,42,6,7,8,0,6,7,8,0,0,0,42,8,7,9,0,8,7,9,0,0,0,42,9,7,10,0,9,7,10,0,0,1,42,9,10,11,0,9,10,11,0,1,0,42,9,11,12,0,9,11,12,0,0,0,42,12,11,13,0,12,11,13,0,0,0,42,12,13,14,0,12,13,14,0,0,0,42,14,13,15,0,14,13,15,0,0,0,42,15,13,16,0,15,13,16,0,0,0,42,16,13,17,0,16,13,17,0,0,0,42,16,17,18,0,16,17,18,0,0,0,42,18,17,19,0,18,17,19,0,0,0,42,18,19,20,0,18,19,20,0,0,0,42,18,20,21,0,18,20,21,0,0,0,42,21,20,22,0,21,20,22,0,0,0,42,21,22,23,0,21,22,23,0,0,0,42,23,22,24,0,23,22,24,0,0,1,42,25,26,27,0,24,22,23,2,3,3,42,27,26,28,0,23,22,21,3,3,3,42,26,29,28,0,22,20,21,3,3,3,42,28,29,30,0,21,20,18,3,3,3,42,29,31,30,0,20,19,18,3,3,3,42,31,32,30,0,19,17,18,3,3,3,42,30,32,33,0,18,17,16,3,3,3,42,32,34,33,0,17,13,16,3,3,3,42,33,34,35,0,16,13,15,3,3,3,42,35,34,36,0,15,13,14,3,3,3,42,36,34,37,0,14,13,12,3,3,3,42,34,38,37,0,13,11,12,3,3,3,42,37,38,39,0,12,11,9,3,3,3,42,38,40,39,0,11,10,9,3,2,3,42,40,41,39,0,10,7,9,2,3,3,42,39,41,42,0,9,7,8,3,3,3,42,42,41,43,0,8,7,6,3,3,3,42,41,44,43,0,7,5,6,3,3,3,42,43,44,45,0,6,5,4,3,3,3,42,44,46,45,0,5,3,4,3,3,3,42,45,46,47,0,4,3,1,3,3,3,42,46,48,47,0,3,0,1,3,3,3,42,49,47,48,0,2,1,0,3,3,3],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 46,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 75,
                    "normals": 4,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID629Geometry",
                "vertices": [0.179715,-0.206693,0.824021,0.179715,-0.206693,0.792962,0.17767,-0.206693,0.808492,0.185709,-0.206693,0.838492,0.185709,-0.206693,0.778492,0.195244,-0.206693,0.850918,0.195244,-0.206693,0.766065,0.20767,-0.206693,0.860453,0.20767,-0.206693,0.75653,0.222141,-0.206693,0.750536,0.222141,-0.206693,0.866447,0.23767,-0.206693,0.868492,0.23767,-0.206693,0.74851,0.537736,-0.206693,0.866447,0.522207,-0.206693,0.74851,0.537736,-0.206693,0.750536,0.552207,-0.206693,0.75653,0.552207,-0.206693,0.860453,0.564633,-0.206693,0.766065,0.564633,-0.206693,0.850918,0.574168,-0.206693,0.838492,0.574168,-0.206693,0.778492,0.580162,-0.206693,0.824021,0.580162,-0.206693,0.792962,0.582207,-0.206693,0.808492,0.582207,-0.206693,0.808492,0.580162,-0.206693,0.824021,0.580162,-0.206693,0.792962,0.574168,-0.206693,0.778492,0.574168,-0.206693,0.838492,0.564633,-0.206693,0.766065,0.564633,-0.206693,0.850918,0.552207,-0.206693,0.860453,0.552207,-0.206693,0.75653,0.537736,-0.206693,0.866447,0.537736,-0.206693,0.750536,0.522207,-0.206693,0.74851,0.23767,-0.206693,0.74851,0.23767,-0.206693,0.868492,0.222141,-0.206693,0.750536,0.222141,-0.206693,0.866447,0.20767,-0.206693,0.860453,0.20767,-0.206693,0.75653,0.195244,-0.206693,0.766065,0.195244,-0.206693,0.850918,0.185709,-0.206693,0.778492,0.185709,-0.206693,0.838492,0.179715,-0.206693,0.792962,0.179715,-0.206693,0.824021,0.17767,-0.206693,0.808492,0.537736,-0.206693,0.866447,0.23767,-0.206693,0.868492,0.552207,-0.206693,0.860453,0.564633,-0.206693,0.850918,0.574168,-0.206693,0.838492,0.580162,-0.206693,0.824021,0.582207,-0.206693,0.808492,0.580162,-0.206693,0.792962,0.574168,-0.206693,0.778492,0.564633,-0.206693,0.766065,0.552207,-0.206693,0.75653,0.537736,-0.206693,0.750536,0.522207,-0.206693,0.74851,0.23767,-0.206693,0.74851,0.222141,-0.206693,0.750536,0.20767,-0.206693,0.75653,0.195244,-0.206693,0.766065,0.185709,-0.206693,0.778492,0.179715,-0.206693,0.792962,0.17767,-0.206693,0.808492,0.179715,-0.206693,0.824021,0.185709,-0.206693,0.838492,0.195244,-0.206693,0.850918,0.20767,-0.206693,0.860453,0.222141,-0.206693,0.866447],
                "uvs": [[-23.2302,17.4709,-23.2302,17.4526,-23.2274,17.4617,-23.2384,17.4794,-23.2384,17.4441,-23.2514,17.4867,-23.2514,17.4368,-23.2685,17.4923,-23.2685,17.4312,-23.2883,17.4276,-23.2883,17.4958,-23.3096,17.497,-23.3096,17.4265,-23.7206,17.4958,-23.6993,17.4265,-23.7206,17.4276,-23.7404,17.4312,-23.7404,17.4923,-23.7574,17.4368,-23.7574,17.4867,-23.7705,17.4794,-23.7705,17.4441,-23.7787,17.4709,-23.7787,17.4526,-23.7815,17.4617]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "F24BDE7E-2329-3FFE-A2CC-13777F6BED0B"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.011Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.010",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "100B103A-CF7B-3105-AFD0-F4A6C0241712"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [-0.258248,0,-0.966063,-0.499985,0,-0.865993,-0.707083,0,-0.707083,-0.129368,0,-0.991577,-0.866024,0,-0.499985,0,0,-1,-0.965911,0,-0.258797,0.258248,0,-0.966063,0.129368,0,-0.991577,-0.999969,0,0,-1,0,0,0.499985,0,-0.866024,-0.965911,0,0.258797,0.707083,0,-0.707083,-0.866024,0,0.499985,0.866024,0,-0.499985,-0.707083,0,0.707083,0.965911,0,-0.258797,-0.499985,0,0.866024,1,0,0,-0.258797,0,0.965911,0.965911,0,0.258797,-0.130497,0,0.991424,-0.130528,0,0.991424,0.866024,0,0.499985,0.006806,0,0.999969,0.707083,0,0.707083,0.382672,0,0.923856,0.499985,0,0.866024,0.258248,0,0.966063,0.499985,0,0.865993,0.129368,0,0.991577,0,0,1,-0.129368,0,0.991577,-0.258248,0,0.966063,0.999969,0,0,0.258797,0,-0.965911,0.130497,0,-0.991424,0.130528,0,-0.991424,-0.006806,0,-0.999969,-0.382672,0,-0.923856,-0.499985,0,-0.866024],
                "faces": [42,0,1,2,0,0,1,2,0,1,1,42,1,0,3,0,1,0,3,1,0,0,42,1,12,2,0,1,4,5,1,2,1,42,12,1,13,0,4,1,6,2,1,2,42,18,0,19,0,7,8,9,3,0,3,42,0,18,3,0,8,7,3,0,3,0,42,13,24,12,0,6,10,4,2,4,2,42,24,13,25,0,10,6,11,4,2,4,42,30,31,32,0,12,13,14,5,5,5,42,31,30,33,0,13,12,15,5,5,5,42,25,40,24,0,11,16,17,4,6,4,42,40,25,41,0,16,11,18,6,4,6,42,46,47,48,0,19,20,21,7,8,7,42,47,46,49,0,20,19,22,8,7,8,42,41,56,40,0,18,23,24,6,9,6,42,56,41,57,0,23,18,25,9,6,10,42,62,48,63,0,26,27,28,11,7,11,42,48,62,46,0,27,26,19,7,11,7,42,57,68,56,0,25,29,23,10,12,9,42,68,57,69,0,29,25,30,12,10,12,42,74,63,75,0,31,32,33,13,11,13,42,63,74,62,0,32,31,26,11,13,11,42,69,80,68,0,30,34,35,12,14,12,42,80,69,81,0,34,30,36,14,12,14,42,86,74,75,0,37,31,38,15,13,13,42,74,86,87,0,31,37,36,13,15,15,42,81,92,80,0,36,39,40,14,16,14,42,92,81,93,0,39,36,31,16,14,16,42,98,87,86,0,41,36,42,17,15,15,42,87,98,99,0,36,41,30,15,17,17,42,92,104,105,0,43,26,44,16,18,18,42,104,92,93,0,26,43,31,18,16,16,42,110,99,98,0,45,30,46,19,17,17,42,99,110,111,0,30,45,25,17,19,19,42,104,116,105,0,26,47,48,18,20,18,42,116,104,117,0,47,26,19,20,18,20,42,122,111,110,0,49,25,50,21,19,19,42,111,122,123,0,25,49,18,19,21,21,42,116,128,129,0,51,52,53,20,22,23,42,128,116,117,0,52,51,19,22,20,20,42,134,123,122,0,54,18,55,24,21,21,42,123,134,135,0,18,54,11,21,24,24,42,140,141,142,0,56,57,58,25,25,25,42,141,140,143,0,57,56,59,25,25,25,42,150,135,134,0,4,11,60,26,24,24,42,135,150,151,0,11,4,6,24,26,26,42,156,157,158,0,61,1,62,27,28,28,42,157,156,159,0,1,61,3,28,27,27,42,157,150,158,0,1,63,64,28,26,28,42,150,157,151,0,63,1,6,26,28,26,42,4,5,6,1,65,66,67,29,29,30,42,7,6,5,1,68,67,66,30,30,29,42,14,6,15,1,69,70,71,26,30,26,42,7,15,6,1,72,71,70,30,26,30,42,4,20,5,1,73,74,75,29,31,29,42,21,5,20,1,76,75,74,31,29,31,42,26,14,27,1,77,78,79,24,26,24,42,15,27,14,1,80,79,78,26,24,26,42,34,35,36,1,81,82,83,32,32,32,42,37,36,35,1,84,83,82,32,32,32,42,42,26,43,1,85,86,87,21,24,21,42,27,43,26,1,88,87,86,24,21,24,42,50,51,52,1,89,90,91,33,34,33,42,53,52,51,1,92,91,90,34,33,34,42,58,42,59,1,93,94,95,19,21,35,42,43,59,42,1,96,95,94,21,35,21,42,51,64,53,1,97,98,99,34,18,34,42,65,53,64,1,100,99,98,18,34,18,42,70,58,71,1,101,102,103,17,19,17,42,59,71,58,1,104,103,102,35,17,19,42,64,76,65,1,105,106,107,18,16,18,42,77,65,76,1,108,107,106,16,18,16,42,82,70,83,1,109,110,111,15,17,15,42,71,83,70,1,112,111,110,17,15,17,42,88,89,76,1,113,114,115,14,14,16,42,77,76,89,1,116,115,114,16,16,14,42,94,82,95,1,117,118,119,13,15,13,42,83,95,82,1,120,119,118,15,13,15,42,100,101,88,1,121,122,123,12,12,14,42,89,88,101,1,124,123,122,14,14,12,42,94,95,106,1,125,126,127,13,13,11,42,107,106,95,1,128,127,126,11,11,13,42,112,113,100,1,129,130,131,10,10,12,42,101,100,113,1,132,131,130,12,12,10,42,118,106,119,1,133,134,135,36,11,36,42,107,119,106,1,136,135,134,11,36,11,42,124,125,112,1,137,138,139,6,6,10,42,113,112,125,1,140,139,138,10,10,6,42,118,119,130,1,141,142,143,36,36,37,42,131,130,119,1,144,143,142,38,37,36,42,136,137,124,1,145,146,147,4,4,6,42,125,124,137,1,148,147,146,6,6,4,42,144,145,146,1,149,150,151,39,39,39,42,147,146,145,1,152,151,150,39,39,39,42,152,153,136,1,153,154,155,2,2,4,42,137,136,153,1,156,155,154,4,4,2,42,160,161,162,1,157,158,159,40,40,41,42,163,162,161,1,160,159,158,41,41,40,42,152,162,153,1,161,162,163,2,41,2,42,163,153,162,1,164,163,162,41,2,41],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 100,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 166,
                    "normals": 42,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID572Geometry",
                "vertices": [0.222141,-0.206693,0.750536,0.20767,-0.306693,0.75653,0.20767,-0.206693,0.75653,0.222141,-0.306693,0.750536,0.222141,-0.306693,0.750536,0.222141,-0.206693,0.750536,0.20767,-0.306693,0.75653,0.20767,-0.206693,0.75653,0.20767,-0.306693,0.75653,0.222141,-0.306693,0.750536,0.20767,-0.206693,0.75653,0.222141,-0.206693,0.750536,0.195244,-0.206693,0.766065,0.195244,-0.306693,0.766065,0.195244,-0.306693,0.766065,0.195244,-0.206693,0.766065,0.195244,-0.306693,0.766065,0.195244,-0.206693,0.766065,0.23767,-0.306693,0.74851,0.23767,-0.206693,0.74851,0.23767,-0.306693,0.74851,0.23767,-0.206693,0.74851,0.23767,-0.306693,0.74851,0.23767,-0.206693,0.74851,0.185709,-0.206693,0.778492,0.185709,-0.306693,0.778492,0.185709,-0.306693,0.778492,0.185709,-0.206693,0.778492,0.185709,-0.306693,0.778492,0.185709,-0.206693,0.778492,0.522207,-0.306693,0.74851,0.23767,-0.206693,0.74851,0.522207,-0.206693,0.74851,0.23767,-0.306693,0.74851,0.23767,-0.306693,0.74851,0.522207,-0.306693,0.74851,0.23767,-0.206693,0.74851,0.522207,-0.206693,0.74851,0.522207,-0.306693,0.74851,0.522207,-0.206693,0.74851,0.179715,-0.206693,0.792962,0.179715,-0.306693,0.792962,0.179715,-0.306693,0.792962,0.179715,-0.206693,0.792962,0.179715,-0.306693,0.792962,0.179715,-0.206693,0.792962,0.537736,-0.306693,0.750536,0.522207,-0.206693,0.74851,0.537736,-0.206693,0.750536,0.522207,-0.306693,0.74851,0.522207,-0.306693,0.74851,0.537736,-0.306693,0.750536,0.522207,-0.206693,0.74851,0.537736,-0.206693,0.750536,0.537736,-0.306693,0.750536,0.537736,-0.206693,0.750536,0.17767,-0.206693,0.808492,0.17767,-0.306693,0.808492,0.17767,-0.306693,0.808492,0.17767,-0.206693,0.808492,0.17767,-0.306693,0.808492,0.17767,-0.206693,0.808492,0.552207,-0.306693,0.75653,0.552207,-0.206693,0.75653,0.552207,-0.306693,0.75653,0.552207,-0.206693,0.75653,0.552207,-0.306693,0.75653,0.552207,-0.206693,0.75653,0.179715,-0.206693,0.824021,0.179715,-0.306693,0.824021,0.179715,-0.306693,0.824021,0.179715,-0.206693,0.824021,0.179715,-0.306693,0.824021,0.179715,-0.206693,0.824021,0.564633,-0.306693,0.766065,0.564633,-0.206693,0.766065,0.564633,-0.306693,0.766065,0.564633,-0.206693,0.766065,0.564633,-0.306693,0.766065,0.564633,-0.206693,0.766065,0.185709,-0.206693,0.838492,0.185709,-0.306693,0.838492,0.185709,-0.306693,0.838492,0.185709,-0.206693,0.838492,0.185709,-0.306693,0.838492,0.185709,-0.206693,0.838492,0.574168,-0.206693,0.778492,0.574168,-0.306693,0.778492,0.574168,-0.306693,0.778492,0.574168,-0.206693,0.778492,0.574168,-0.306693,0.778492,0.574168,-0.206693,0.778492,0.195244,-0.206693,0.850918,0.195244,-0.306693,0.850918,0.195244,-0.306693,0.850918,0.195244,-0.206693,0.850918,0.195244,-0.306693,0.850918,0.195244,-0.206693,0.850918,0.580162,-0.206693,0.792962,0.580162,-0.306693,0.792962,0.580162,-0.306693,0.792962,0.580162,-0.206693,0.792962,0.580162,-0.306693,0.792962,0.580162,-0.206693,0.792962,0.20767,-0.306693,0.860453,0.20767,-0.206693,0.860453,0.20767,-0.306693,0.860453,0.20767,-0.206693,0.860453,0.20767,-0.306693,0.860453,0.20767,-0.206693,0.860453,0.582207,-0.206693,0.808492,0.582207,-0.306693,0.808492,0.582207,-0.306693,0.808492,0.582207,-0.206693,0.808492,0.582207,-0.306693,0.808492,0.582207,-0.206693,0.808492,0.222141,-0.206693,0.866447,0.222141,-0.306693,0.866447,0.222141,-0.306693,0.866447,0.222141,-0.206693,0.866447,0.222141,-0.306693,0.866447,0.222141,-0.206693,0.866447,0.580162,-0.206693,0.824021,0.580162,-0.306693,0.824021,0.580162,-0.306693,0.824021,0.580162,-0.206693,0.824021,0.580162,-0.306693,0.824021,0.580162,-0.206693,0.824021,0.23767,-0.306693,0.868492,0.23767,-0.206693,0.868492,0.23767,-0.306693,0.868492,0.23767,-0.206693,0.868492,0.23767,-0.306693,0.868492,0.23767,-0.206693,0.868492,0.574168,-0.206693,0.838492,0.574168,-0.306693,0.838492,0.574168,-0.306693,0.838492,0.574168,-0.206693,0.838492,0.574168,-0.306693,0.838492,0.574168,-0.206693,0.838492,0.23767,-0.306693,0.868492,0.537736,-0.206693,0.866447,0.23767,-0.206693,0.868492,0.537736,-0.306693,0.866447,0.537736,-0.306693,0.866447,0.23767,-0.306693,0.868492,0.537736,-0.206693,0.866447,0.23767,-0.206693,0.868492,0.537736,-0.306693,0.866447,0.537736,-0.206693,0.866447,0.564633,-0.206693,0.850918,0.564633,-0.306693,0.850918,0.564633,-0.306693,0.850918,0.564633,-0.206693,0.850918,0.564633,-0.306693,0.850918,0.564633,-0.206693,0.850918,0.537736,-0.206693,0.866447,0.552207,-0.306693,0.860453,0.552207,-0.206693,0.860453,0.537736,-0.306693,0.866447,0.537736,-0.306693,0.866447,0.537736,-0.206693,0.866447,0.552207,-0.306693,0.860453,0.552207,-0.206693,0.860453,0.552207,-0.306693,0.860453,0.552207,-0.206693,0.860453],
                "uvs": [[0.021598,-0,0.019635,0.0125,0.019635,-0,0.021598,0.0125,0.017671,0,0.019635,0,0.017671,0.0125,0.023562,0.0125,0.021598,-0,0.023562,-0,0.015708,0,0.015708,0.0125,2.16265,-0.00625,2.12709,-0.01875,2.16265,-0.01875,2.12709,-0.00625,0.013744,0,0.015708,0,0.013744,0.0125,0.001963,0.0125,-0,-0,0.001963,-0,-0,0.0125,0.011781,-0,0.013744,-0,0.011781,0.0125,0.003927,0.0125,0.001963,-0,0.003927,-0,0.009817,-0,0.009817,0.0125,0.00589,0.0125,0.003927,-0,0.00589,-0,0.007854,0,0.009817,0,0.007854,0.0125,0.007854,-0,0.00589,-0,0.00589,0,0.007854,-0,0.009817,0,0.007854,0,0.00589,-0,0.003927,-0,0.011781,0,0.009817,0,0.001963,0,0.003927,0,0.013744,-0,0.011781,-0,0.001963,0,-0,0.0125,-0,0,0.015708,-0,0.013744,-0,-2.1017,-0.00625,-2.13921,-0.01875,-2.1017,-0.01875,-2.13921,-0.00625,0.015708,-0,0.021598,0,0.019635,0,0.017671,0,0.019635,0,5.98504,-0.029412,5.98504,-0.088235,5.96358,-0.029412,5.96358,-0.088235,-6.27185,-0.029412,-6.2504,-0.029412,-6.27185,-0.088235,-6.2504,-0.088235,17.8413,-0.029412,17.8627,-0.029412,17.8413,-0.088235,17.8627,-0.088235,-18.0806,-0.029412,-18.0591,-0.029412,-18.0806,-0.088235,-18.0591,-0.088235,23.3096,-0.029412,23.6993,-0.029412,23.3096,-0.088235,23.6993,-0.088235,-28.6579,-0.029412,-28.6365,-0.029412,-28.6579,-0.088235,-28.6365,-0.088235,28.751,-0.029412,28.7724,-0.029412,28.751,-0.088235,28.7724,-0.088235,-37.283,-0.029412,-37.2615,-0.029412,-37.283,-0.088235,-37.2615,-0.088235,37.4455,-0.029412,37.467,-0.029412,37.4455,-0.088235,37.467,-0.088235,-43.368,-0.029412,-43.3465,-0.029412,-43.368,-0.088235,-43.3465,-0.088235,43.545,-0.029412,43.5665,-0.029412,43.545,-0.088235,43.5665,-0.088235,-46.4983,-0.029412,-46.4768,-0.029412,-46.4983,-0.088235,-46.4768,-0.088235,46.6978,-0.029412,46.6978,-0.088235,46.6763,-0.029412,46.6763,-0.088235,-46.4605,-0.029412,-46.4391,-0.029412,-46.4605,-0.088235,-46.4391,-0.088235,46.6474,-0.029412,46.6474,-0.088235,46.626,-0.029412,46.626,-0.088235,-43.2358,-0.029412,-43.2358,-0.088235,-43.2573,-0.029412,-43.2573,-0.088235,43.4189,-0.029412,43.4189,-0.088235,43.3974,-0.029412,43.3974,-0.088235,-37.1069,-0.029412,-37.0854,-0.029412,-37.1069,-0.088235,-37.0854,-0.088235,37.2321,-0.029412,37.2321,-0.088235,37.2106,-0.029412,37.2106,-0.088235,-28.4069,-0.029412,-28.4069,-0.088235,-28.4284,-0.029412,-28.4284,-0.088235,28.5088,-0.029412,28.5088,-0.088235,28.4873,-0.029412,28.4873,-0.088235,-23.4425,-0.029412,-23.0314,-0.029412,-23.4425,-0.088235,-23.0314,-0.088235,17.8433,-0.029412,17.8433,-0.088235,17.8219,-0.029412,17.8219,-0.088235,-6.32367,-0.029412,-6.32367,-0.088235,-6.34513,-0.029412,-6.34513,-0.088235,5.94118,-0.029412,5.96263,-0.029412,5.94118,-0.088235,5.96263,-0.088235]]
            },
            "materials": [{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Rough_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Rough_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "1BDE687F-9DFE-3E5F-92FA-92352C94C7C0"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [1,0,0,0,0,-1,0,0,1,-1,0,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,3,2,1,0,0,0,42,12,13,14,0,4,5,6,1,1,1,42,13,12,15,0,7,6,5,1,1,1,42,22,23,24,0,8,9,10,2,2,2,42,23,22,25,0,11,10,9,2,2,2,42,32,33,34,0,12,13,14,3,3,3,42,33,32,35,0,15,14,13,3,3,3,42,4,5,6,1,0,0,0,3,3,3,42,7,6,5,1,0,0,0,3,3,3,42,16,17,18,1,0,0,0,2,2,2,42,19,18,17,1,0,0,0,2,2,2,42,26,27,28,1,0,0,0,1,1,1,42,29,28,27,1,0,0,0,1,1,1,42,36,37,38,1,0,0,0,0,0,0,42,39,38,37,1,0,0,0,0,0,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 16,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 40,
                    "normals": 4,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID609Geometry",
                "vertices": [0.73,-0.306693,0,0.73,-0.356693,1.69911,0.73,-0.356693,0,0.73,-0.306693,1.69911,0.73,-0.306693,1.69911,0.73,-0.306693,0,0.73,-0.356693,1.69911,0.73,-0.356693,0,0.73,-0.356693,0,0.73,-0.356693,1.69911,0.73,-0.306693,0,0.73,-0.306693,1.69911,0.73,-0.356693,0,0,-0.306693,0,0.73,-0.306693,0,0,-0.356693,0,0,-0.356693,0,0.73,-0.356693,0,0,-0.306693,0,0.73,-0.306693,0,0,-0.356693,0,0,-0.306693,0,0,-0.356693,1.69911,0.73,-0.306693,1.69911,0,-0.306693,1.69911,0.73,-0.356693,1.69911,0.73,-0.356693,1.69911,0,-0.356693,1.69911,0.73,-0.306693,1.69911,0,-0.306693,1.69911,0,-0.356693,1.69911,0,-0.306693,1.69911,0,-0.356693,1.69911,0,-0.306693,0,0,-0.356693,0,0,-0.306693,1.69911,0,-0.306693,1.69911,0,-0.356693,1.69911,0,-0.306693,0,0,-0.356693,0],
                "uvs": [[41.8826,-0.029412,39.5551,-0.029412,41.8826,-0,39.5551,0,22.984,0,23.984,0,22.984,-0.029412,23.984,-0.029412,-23.984,-0,-22.984,-0,-23.984,-0.029412,-22.984,-0.029412,-41.8826,-0.029412,-41.8826,-0,-39.5551,-0.029412,-39.5551,0]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.956863,0.956863,0.862745],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0049_Beige_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.956863,0.956863,0.862745],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "6231C51E-34FC-33F6-BB8D-7A3CC85F4840"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [-0.866024,0,0.499985,-0.707083,0,0.707083,-0.965911,0,0.258797,-0.499985,0,0.866024,-1,0,0,-0.258797,0,0.965911,-0.965911,0,-0.258797,0,0,1,-0.866024,0,-0.499985,0.258797,0,0.965911,-0.707083,0,-0.707083,0.499985,0,0.866024,-0.499985,0,-0.866024,0.707083,0,0.707083,-0.258797,0,-0.965911,0.866024,0,0.499985,0,0,-1,0.965911,0,0.258797,0.258797,0,-0.965911,1,0,0,0.499985,0,-0.866024,0.965911,0,-0.258797,0.707083,0,-0.707083,0.866024,0,-0.499985,-0.999969,0,0],
                "faces": [42,0,1,2,0,0,1,2,0,1,1,42,1,0,3,0,3,2,1,1,0,0,42,12,3,0,0,4,5,6,2,0,0,42,3,12,13,0,7,6,5,0,2,2,42,18,2,1,0,8,9,10,3,1,1,42,2,18,19,0,11,10,9,1,3,3,42,24,13,12,0,12,13,14,4,2,2,42,13,24,25,0,15,14,13,2,4,4,42,30,18,31,0,16,17,18,5,3,5,42,18,30,19,0,19,18,17,3,5,3,42,36,25,24,0,20,21,22,6,4,4,42,25,36,37,0,23,22,21,4,6,6,42,42,31,43,0,24,25,26,7,5,7,42,31,42,30,0,27,26,25,5,7,5,42,48,37,36,0,28,29,30,8,6,6,42,37,48,49,0,31,30,29,6,8,8,42,54,42,43,0,32,33,34,9,7,7,42,42,54,55,0,35,34,33,7,9,9,42,60,49,48,0,36,37,38,10,8,8,42,49,60,61,0,39,38,37,8,10,10,42,66,54,67,0,40,41,42,11,9,11,42,54,66,55,0,43,42,41,9,11,9,42,60,72,61,0,44,45,46,10,12,10,42,72,60,73,0,47,46,45,12,10,12,42,78,67,79,0,48,49,50,13,11,13,42,67,78,66,0,51,50,49,11,13,11,42,73,84,72,0,52,53,54,12,14,12,42,84,73,85,0,55,54,53,14,12,14,42,90,78,79,0,56,57,58,15,13,13,42,78,90,91,0,59,58,57,13,15,15,42,84,96,97,0,60,61,62,14,16,16,42,96,84,85,0,63,62,61,16,14,14,42,102,91,90,0,64,65,66,17,15,15,42,91,102,103,0,67,66,65,15,17,17,42,96,108,97,0,68,69,70,16,18,16,42,108,96,109,0,71,70,69,18,16,18,42,114,103,102,0,72,73,74,19,17,17,42,103,114,115,0,75,74,73,17,19,19,42,109,120,108,0,76,77,78,18,20,18,42,120,109,121,0,79,78,77,20,18,20,42,126,115,114,0,80,81,82,21,19,19,42,115,126,127,0,83,82,81,19,21,21,42,120,132,133,0,84,85,86,20,22,22,42,132,120,121,0,87,86,85,22,20,20,42,138,127,126,0,88,89,90,23,21,21,42,127,138,139,0,91,90,89,21,23,23,42,133,139,138,0,92,93,94,22,23,23,42,139,133,132,0,95,94,93,23,22,22,42,4,5,6,1,0,0,0,23,23,22,42,7,6,5,1,0,0,0,22,22,23,42,14,15,4,1,0,0,0,21,21,23,42,5,4,15,1,0,0,0,23,23,21,42,20,21,7,1,0,0,0,20,20,22,42,6,7,21,1,0,0,0,22,22,20,42,26,27,14,1,0,0,0,19,19,21,42,15,14,27,1,0,0,0,21,21,19,42,20,32,21,1,0,0,0,20,18,20,42,33,21,32,1,0,0,0,18,20,18,42,38,39,26,1,0,0,0,17,17,19,42,27,26,39,1,0,0,0,19,19,17,42,32,44,33,1,0,0,0,18,16,18,42,45,33,44,1,0,0,0,16,18,16,42,50,51,38,1,0,0,0,15,15,17,42,39,38,51,1,0,0,0,17,17,15,42,56,57,44,1,0,0,0,14,14,16,42,45,44,57,1,0,0,0,16,16,14,42,62,63,50,1,0,0,0,13,13,15,42,51,50,63,1,0,0,0,15,15,13,42,56,68,57,1,0,0,0,14,12,14,42,69,57,68,1,0,0,0,12,14,12,42,74,63,75,1,0,0,0,11,13,11,42,62,75,63,1,0,0,0,13,11,13,42,68,80,69,1,0,0,0,12,10,12,42,81,69,80,1,0,0,0,10,12,10,42,86,74,87,1,0,0,0,9,11,9,42,75,87,74,1,0,0,0,11,9,11,42,92,93,80,1,0,0,0,8,8,10,42,81,80,93,1,0,0,0,10,10,8,42,86,87,98,1,0,0,0,9,9,7,42,99,98,87,1,0,0,0,7,7,9,42,104,105,92,1,0,0,0,6,6,8,42,93,92,105,1,0,0,0,8,8,6,42,110,98,111,1,0,0,0,5,7,5,42,99,111,98,1,0,0,0,7,5,7,42,116,117,104,1,0,0,0,24,4,6,42,105,104,117,1,0,0,0,6,6,4,42,122,110,123,1,0,0,0,3,5,3,42,111,123,110,1,0,0,0,5,3,5,42,128,129,116,1,0,0,0,2,2,24,42,117,116,129,1,0,0,0,4,24,2,42,122,123,134,1,0,0,0,3,3,1,42,135,134,123,1,0,0,0,1,1,3,42,140,141,128,1,0,0,0,0,0,2,42,129,128,141,1,0,0,0,2,2,0,42,134,135,140,1,0,0,0,1,1,0,42,141,140,135,1,0,0,0,0,0,1],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 96,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 144,
                    "normals": 25,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID503Geometry",
                "vertices": [0.700311,-0.356693,0.0425,0.694749,-0.306693,0.035251,0.694749,-0.356693,0.035251,0.700311,-0.306693,0.0425,0.700311,-0.306693,0.0425,0.700311,-0.356693,0.0425,0.694749,-0.306693,0.035251,0.694749,-0.356693,0.035251,0.694749,-0.356693,0.035251,0.700311,-0.356693,0.0425,0.700311,-0.306693,0.0425,0.694749,-0.306693,0.035251,0.703807,-0.356693,0.050941,0.703807,-0.306693,0.050941,0.703807,-0.306693,0.050941,0.703807,-0.356693,0.050941,0.703807,-0.356693,0.050941,0.703807,-0.306693,0.050941,0.6875,-0.306693,0.029689,0.6875,-0.356693,0.029689,0.6875,-0.356693,0.029689,0.6875,-0.306693,0.029689,0.6875,-0.356693,0.029689,0.6875,-0.306693,0.029689,0.705,-0.356693,0.06,0.705,-0.306693,0.06,0.705,-0.306693,0.06,0.705,-0.356693,0.06,0.705,-0.356693,0.06,0.705,-0.306693,0.06,0.679059,-0.356693,0.026193,0.679059,-0.306693,0.026193,0.679059,-0.356693,0.026193,0.679059,-0.306693,0.026193,0.679059,-0.356693,0.026193,0.679059,-0.306693,0.026193,0.703807,-0.356693,0.069059,0.703807,-0.306693,0.069059,0.703807,-0.306693,0.069059,0.703807,-0.356693,0.069059,0.703807,-0.356693,0.069059,0.703807,-0.306693,0.069059,0.67,-0.356693,0.025,0.67,-0.306693,0.025,0.67,-0.356693,0.025,0.67,-0.306693,0.025,0.67,-0.356693,0.025,0.67,-0.306693,0.025,0.700311,-0.356693,0.0775,0.700311,-0.306693,0.0775,0.700311,-0.306693,0.0775,0.700311,-0.356693,0.0775,0.700311,-0.356693,0.0775,0.700311,-0.306693,0.0775,0.660941,-0.306693,0.026193,0.660941,-0.356693,0.026193,0.660941,-0.356693,0.026193,0.660941,-0.306693,0.026193,0.660941,-0.356693,0.026193,0.660941,-0.306693,0.026193,0.694749,-0.356693,0.084749,0.694749,-0.306693,0.084749,0.694749,-0.306693,0.084749,0.694749,-0.356693,0.084749,0.694749,-0.356693,0.084749,0.694749,-0.306693,0.084749,0.6525,-0.356693,0.029689,0.6525,-0.306693,0.029689,0.6525,-0.356693,0.029689,0.6525,-0.306693,0.029689,0.6525,-0.356693,0.029689,0.6525,-0.306693,0.029689,0.6875,-0.306693,0.090311,0.6875,-0.356693,0.090311,0.6875,-0.356693,0.090311,0.6875,-0.306693,0.090311,0.6875,-0.356693,0.090311,0.6875,-0.306693,0.090311,0.645251,-0.356693,0.035251,0.645251,-0.306693,0.035251,0.645251,-0.356693,0.035251,0.645251,-0.306693,0.035251,0.645251,-0.356693,0.035251,0.645251,-0.306693,0.035251,0.679059,-0.306693,0.093807,0.679059,-0.356693,0.093807,0.679059,-0.356693,0.093807,0.679059,-0.306693,0.093807,0.679059,-0.356693,0.093807,0.679059,-0.306693,0.093807,0.639689,-0.306693,0.0425,0.639689,-0.356693,0.0425,0.639689,-0.356693,0.0425,0.639689,-0.306693,0.0425,0.639689,-0.356693,0.0425,0.639689,-0.306693,0.0425,0.67,-0.356693,0.095,0.67,-0.306693,0.095,0.67,-0.356693,0.095,0.67,-0.306693,0.095,0.67,-0.356693,0.095,0.67,-0.306693,0.095,0.636193,-0.306693,0.050941,0.636193,-0.356693,0.050941,0.636193,-0.356693,0.050941,0.636193,-0.306693,0.050941,0.636193,-0.356693,0.050941,0.636193,-0.306693,0.050941,0.660941,-0.306693,0.093807,0.660941,-0.356693,0.093807,0.660941,-0.356693,0.093807,0.660941,-0.306693,0.093807,0.660941,-0.356693,0.093807,0.660941,-0.306693,0.093807,0.635,-0.306693,0.06,0.635,-0.356693,0.06,0.635,-0.356693,0.06,0.635,-0.306693,0.06,0.635,-0.356693,0.06,0.635,-0.306693,0.06,0.6525,-0.306693,0.090311,0.6525,-0.356693,0.090311,0.6525,-0.356693,0.090311,0.6525,-0.306693,0.090311,0.6525,-0.356693,0.090311,0.6525,-0.306693,0.090311,0.636193,-0.306693,0.069059,0.636193,-0.356693,0.069059,0.636193,-0.356693,0.069059,0.636193,-0.306693,0.069059,0.636193,-0.356693,0.069059,0.636193,-0.306693,0.069059,0.645251,-0.356693,0.084749,0.645251,-0.306693,0.084749,0.645251,-0.356693,0.084749,0.645251,-0.306693,0.084749,0.645251,-0.356693,0.084749,0.645251,-0.306693,0.084749,0.639689,-0.306693,0.0775,0.639689,-0.356693,0.0775,0.639689,-0.356693,0.0775,0.639689,-0.306693,0.0775,0.639689,-0.356693,0.0775,0.639689,-0.306693,0.0775],
                "uvs": [[-46.0032,-0.029412,-46.0032,-0,-45.9906,-0.029412,-45.9906,-0,-45.7732,-0.029412,-45.7732,0,-45.7607,-0.029412,-45.7607,0,-43.086,-0,-43.086,-0.029412,-43.0985,-0,-43.0985,-0.029412,-42.4243,-0.029412,-42.4243,0,-42.4118,-0.029412,-42.4118,0,-37.2572,-0,-37.2447,-0,-37.2572,-0.029412,-37.2447,-0.029412,-36.1847,-0.029412,-36.1847,-0,-36.1722,-0.029412,-36.1722,-0,-28.8773,-0,-28.8647,-0,-28.8773,-0.029412,-28.8647,-0.029412,-27.4796,-0.029412,-27.4796,-0,-27.4671,-0.029412,-27.4671,-0,-18.5173,-0,-18.5173,-0.029412,-18.5298,-0,-18.5298,-0.029412,-16.9022,-0.029412,-16.9022,-0,-16.8897,-0.029412,-16.8897,0,-6.92006,0,-6.90754,0,-6.92006,-0.029412,-6.90754,-0.029412,-5.1734,-0,-5.16088,-0,-5.1734,-0.029412,-5.16088,-0.029412,5.16088,-0,5.1734,-0,5.16088,-0.029412,5.1734,-0.029412,6.90754,0,6.92006,0,6.90754,-0.029412,6.92006,-0.029412,16.9022,0,16.9022,-0.029412,16.8897,0,16.8897,-0.029412,18.5298,-0,18.5298,-0.029412,18.5173,-0,18.5173,-0.029412,27.4796,-0,27.4796,-0.029412,27.4671,-0,27.4671,-0.029412,28.8647,0,28.8773,-0,28.8647,-0.029412,28.8773,-0.029412,36.1847,-0,36.1847,-0.029412,36.1722,-0,36.1722,-0.029412,37.2447,-0,37.2572,-0,37.2447,-0.029412,37.2572,-0.029412,42.4243,-0,42.4243,-0.029412,42.4118,-0,42.4118,-0.029412,43.0985,0,43.0985,-0.029412,43.086,-0,43.086,-0.029412,45.7732,0,45.7732,-0.029412,45.7607,0,45.7607,-0.029412,46.0032,-0,46.0032,-0.029412,45.9906,-0,45.9906,-0.029412]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.956863,0.956863,0.862745],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0049_Beige_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.956863,0.956863,0.862745],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "2999DB1F-9585-37AB-9B7D-45B5C56880A5"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.005Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.004",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "E3AA74C4-449B-3CF9-B64C-78CE8228911B"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.012Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.011",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "1A5C8DA6-0621-34A4-A259-7F17D89371ED"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.021Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.020",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "89AF8581-5073-3295-964D-B7923651B8FA"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0,-1,1,0,0,0.999969,0,0,-0.999969,0,0,-1,0,0,0,0,1,0,0,-0.999969,0,0,0.999969],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,12,13,14,0,4,5,6,1,1,2,42,13,12,15,0,5,4,7,1,1,1,42,22,23,24,0,8,9,10,3,3,4,42,23,22,25,0,9,8,11,3,3,4,42,14,32,33,0,6,12,13,2,1,1,42,32,14,13,0,12,6,5,1,2,1,42,38,39,40,0,14,15,16,5,5,5,42,39,38,41,0,15,14,17,5,5,5,42,48,49,50,0,3,18,1,6,6,0,42,49,48,51,0,18,3,19,6,6,0,42,58,59,60,0,4,20,21,2,2,1,42,59,58,61,0,20,4,7,2,2,1,42,68,69,70,0,22,23,24,3,4,4,42,69,68,71,0,23,22,25,4,3,3,42,78,79,80,0,19,26,18,0,0,0,42,79,78,81,0,26,19,27,0,0,0,42,88,71,68,0,8,25,22,4,3,3,42,71,88,89,0,25,8,11,3,4,4,42,4,5,6,1,0,0,0,5,5,5,42,7,6,5,1,0,0,0,5,5,5,42,16,17,18,1,0,0,0,4,4,4,42,19,18,17,1,0,0,0,4,4,4,42,26,27,28,1,0,0,0,1,2,2,42,29,28,27,1,0,0,0,1,2,2,42,18,19,34,1,0,0,0,4,4,4,42,35,34,19,1,0,0,0,4,4,4,42,42,43,44,1,0,0,0,0,0,0,42,45,44,43,1,0,0,0,0,0,0,42,52,53,54,1,0,0,0,5,7,7,42,55,54,53,1,0,0,0,5,7,7,42,62,63,64,1,0,0,0,4,3,3,42,65,64,63,1,0,0,0,4,3,3,42,72,73,74,1,0,0,0,1,2,1,42,75,74,73,1,0,0,0,1,1,2,42,82,83,84,1,0,0,0,5,5,5,42,85,84,83,1,0,0,0,5,5,5,42,90,91,72,1,0,0,0,1,1,1,42,73,72,91,1,0,0,0,2,1,1],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 40,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 92,
                    "normals": 8,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID55Geometry",
                "vertices": [0.281004,-0.153543,0.165354,0.27313,-0.137795,0.165354,0.281004,-0.137795,0.165354,0.27313,-0.153543,0.165354,0.27313,-0.153543,0.165354,0.281004,-0.153543,0.165354,0.27313,-0.137795,0.165354,0.281004,-0.137795,0.165354,0.27313,-0.153543,0.165354,0.281004,-0.153543,0.165354,0.27313,-0.137795,0.165354,0.281004,-0.137795,0.165354,0.27313,-0.137795,0.165354,0.27313,-0.153543,0.15748,0.27313,-0.137795,0.15748,0.27313,-0.153543,0.165354,0.27313,-0.153543,0.165354,0.27313,-0.137795,0.165354,0.27313,-0.153543,0.15748,0.27313,-0.137795,0.15748,0.27313,-0.153543,0.15748,0.27313,-0.137795,0.15748,0.281004,-0.153543,0.165354,0.281004,-0.137795,0.041339,0.281004,-0.153543,0.041339,0.281004,-0.137795,0.165354,0.281004,-0.137795,0.165354,0.281004,-0.153543,0.165354,0.281004,-0.137795,0.041339,0.281004,-0.153543,0.041339,0.281004,-0.153543,0.041339,0.281004,-0.137795,0.041339,0.27313,-0.153543,0.049213,0.27313,-0.137795,0.049213,0.27313,-0.153543,0.049213,0.27313,-0.137795,0.049213,0.27313,-0.153543,0.049213,0.27313,-0.137795,0.049213,0.24311,-0.153543,0.041339,0.281004,-0.137795,0.041339,0.24311,-0.137795,0.041339,0.281004,-0.153543,0.041339,0.281004,-0.153543,0.041339,0.24311,-0.153543,0.041339,0.281004,-0.137795,0.041339,0.24311,-0.137795,0.041339,0.24311,-0.153543,0.041339,0.24311,-0.137795,0.041339,0.27313,-0.153543,0.049213,0.250984,-0.137795,0.049213,0.27313,-0.137795,0.049213,0.250984,-0.153543,0.049213,0.250984,-0.153543,0.049213,0.27313,-0.153543,0.049213,0.250984,-0.137795,0.049213,0.27313,-0.137795,0.049213,0.250984,-0.153543,0.049213,0.250984,-0.137795,0.049213,0.24311,-0.137795,0.165354,0.24311,-0.153543,0.041339,0.24311,-0.137795,0.041339,0.24311,-0.153543,0.165354,0.24311,-0.153543,0.165354,0.24311,-0.137795,0.165354,0.24311,-0.153543,0.041339,0.24311,-0.137795,0.041339,0.24311,-0.153543,0.165354,0.24311,-0.137795,0.165354,0.250984,-0.153543,0.15748,0.250984,-0.137795,0.049213,0.250984,-0.153543,0.049213,0.250984,-0.137795,0.15748,0.250984,-0.137795,0.15748,0.250984,-0.153543,0.15748,0.250984,-0.137795,0.049213,0.250984,-0.153543,0.049213,0.250984,-0.153543,0.15748,0.250984,-0.137795,0.15748,0.250984,-0.153543,0.165354,0.24311,-0.137795,0.165354,0.250984,-0.137795,0.165354,0.24311,-0.153543,0.165354,0.24311,-0.153543,0.165354,0.250984,-0.153543,0.165354,0.24311,-0.137795,0.165354,0.250984,-0.137795,0.165354,0.250984,-0.153543,0.165354,0.250984,-0.137795,0.165354,0.250984,-0.153543,0.165354,0.250984,-0.137795,0.165354,0.250984,-0.137795,0.165354,0.250984,-0.153543,0.165354],
                "uvs": [[0.070251,0.038386,0.068282,0.034449,0.070251,0.034449,0.068282,0.038386,0.041339,0.034449,0.03937,0.038386,0.03937,0.034449,0.041339,0.038386,-0.041339,0.038386,-0.010335,0.034449,-0.010335,0.038386,-0.041339,0.034449,0.012303,0.038386,0.012303,0.034449,-0.060778,0.038386,-0.070251,0.034449,-0.060778,0.034449,-0.070251,0.038386,0.062746,0.034449,0.062746,0.038386,0.010335,0.038386,0.010335,0.034449,-0.03937,0.038386,-0.012303,0.034449,-0.012303,0.038386,-0.03937,0.034449,0.060778,0.034449,0.060778,0.038386]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Corrogated_Shiny_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Corrogated_Shiny_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.666667,0.690196,0.8],
                "DbgColor": 15597568,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.666667,0.690196,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "550D5815-AB70-3A0F-8DA9-F285BEC5AB95"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.001Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "F24808D6-9B74-3742-9B19-4D91984252B0"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.009Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default.008",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "889997B0-1A3A-3CD3-9972-FAB63A58AE88"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [-0.707053,0,-0.707114,-0.500015,0,-0.865993,-0.499985,0,-0.865993,-0.707083,0,-0.707114,-0.258858,0,-0.965911,-0.865993,0,-0.499985,-0.865993,0,-0.500015,0,0,-1,0,0,-0.999969,-0.965911,0,-0.258797,0.258858,0,-0.965911,-1,0,0,0.500015,0,-0.865993,0.499985,0,-0.865993,-0.965911,0,0.258797,0.707053,0,-0.707114,0.707083,0,-0.707114,-0.866024,0,0.499985,-0.865993,0,0.499985,0.865993,0,-0.499985,-0.707083,0,0.707083,0.965911,0,-0.258797,-0.500015,0,0.865993,1,0,0,-0.258797,0,0.965911,0.965911,0,0.258797,0,0,1,0.866024,0,0.499985,0.865993,0,0.499985,0.258797,0,0.965911,0.707083,0,0.707083,0.500015,0,0.865993,0.707083,0,0.707114,0.707053,0,0.707114,0.499985,0,0.865993,0.258858,0,0.965911,0.865993,0,0.500015,0,0,0.999969,-0.258858,0,0.965911,-0.499985,0,0.865993,-0.707083,0,0.707114,-0.707053,0,0.707114,0.866024,0,-0.499985,0.707083,0,-0.707083,0.258797,0,-0.965911,-0.866024,0,-0.499985,-0.258797,0,-0.965911,-0.707083,0,-0.707083],
                "faces": [42,0,1,2,0,0,1,2,0,1,2,42,1,0,3,0,3,2,1,1,0,3,42,1,12,2,0,4,5,6,1,4,2,42,12,1,13,0,7,6,5,4,1,4,42,3,18,19,0,8,9,10,3,5,6,42,18,3,0,0,11,10,9,5,3,0,42,13,24,12,0,12,13,14,4,7,4,42,24,13,25,0,15,14,13,7,4,8,42,19,30,31,0,16,17,18,6,9,9,42,30,19,18,0,19,18,17,9,6,5,42,25,36,24,0,20,21,22,8,10,7,42,36,25,37,0,23,22,21,10,8,10,42,31,42,43,0,24,25,26,9,11,11,42,42,31,30,0,27,26,25,11,9,9,42,36,48,49,0,28,29,30,10,12,13,42,48,36,37,0,31,30,29,12,10,10,42,43,54,55,0,32,33,34,11,14,14,42,54,43,42,0,35,34,33,14,11,11,42,48,60,49,0,36,37,38,12,15,13,42,60,48,61,0,39,38,37,15,12,16,42,55,66,67,0,40,41,42,14,17,18,42,66,55,54,0,43,42,41,17,14,14,42,60,72,73,0,44,45,46,15,19,19,42,72,60,61,0,47,46,45,19,15,16,42,67,78,79,0,48,49,50,18,20,20,42,78,67,66,0,51,50,49,20,18,17,42,73,84,85,0,52,53,54,19,21,21,42,84,73,72,0,55,54,53,21,19,19,42,90,78,91,0,56,57,58,22,20,22,42,78,90,79,0,59,58,57,20,22,20,42,85,96,97,0,60,61,62,21,23,23,42,96,85,84,0,63,62,61,23,21,21,42,102,91,103,0,64,65,66,24,22,24,42,91,102,90,0,67,66,65,22,24,22,42,97,108,109,0,68,69,70,23,25,25,42,108,97,96,0,71,70,69,25,23,23,42,114,102,103,0,72,73,74,26,24,24,42,102,114,115,0,75,74,73,24,26,26,42,109,120,121,0,76,77,78,25,27,28,42,120,109,108,0,79,78,77,27,25,25,42,126,114,127,0,80,81,82,29,26,29,42,114,126,115,0,83,82,81,26,29,26,42,121,132,133,0,84,85,86,28,30,30,42,132,121,120,0,87,86,85,30,28,27,42,138,126,127,0,88,89,90,31,29,29,42,126,138,139,0,91,90,89,29,31,31,42,132,138,133,0,92,93,94,30,31,30,42,138,132,139,0,95,94,93,31,30,31,42,4,5,6,1,0,0,0,32,33,31,42,7,6,5,1,0,0,0,34,31,33,42,14,6,15,1,0,0,0,35,31,35,42,7,15,6,1,0,0,0,34,35,31,42,5,4,20,1,0,0,0,33,32,28,42,21,20,4,1,0,0,0,36,28,32,42,26,14,27,1,0,0,0,37,35,26,42,15,27,14,1,0,0,0,35,26,35,42,20,21,32,1,0,0,0,28,36,25,42,33,32,21,1,0,0,0,25,25,36,42,38,26,39,1,0,0,0,38,37,38,42,27,39,26,1,0,0,0,26,38,37,42,32,33,44,1,0,0,0,25,25,23,42,45,44,33,1,0,0,0,23,23,25,42,38,39,50,1,0,0,0,38,38,22,42,51,50,39,1,0,0,0,39,22,38,42,44,45,56,1,0,0,0,23,23,21,42,57,56,45,1,0,0,0,21,21,23,42,62,50,63,1,0,0,0,40,22,41,42,51,63,50,1,0,0,0,39,41,22,42,56,57,68,1,0,0,0,21,21,42,42,69,68,57,1,0,0,0,19,42,21,42,62,63,74,1,0,0,0,40,41,18,42,75,74,63,1,0,0,0,18,18,41,42,68,69,80,1,0,0,0,42,19,43,42,81,80,69,1,0,0,0,43,43,19,42,74,75,86,1,0,0,0,18,18,14,42,87,86,75,1,0,0,0,14,14,18,42,81,92,80,1,0,0,0,43,12,43,42,93,80,92,1,0,0,0,12,43,12,42,86,87,98,1,0,0,0,14,14,11,42,99,98,87,1,0,0,0,11,11,14,42,92,104,93,1,0,0,0,12,44,12,42,105,93,104,1,0,0,0,44,12,44,42,98,99,110,1,0,0,0,11,11,9,42,111,110,99,1,0,0,0,9,9,11,42,116,117,104,1,0,0,0,7,7,44,42,105,104,117,1,0,0,0,44,44,7,42,110,111,122,1,0,0,0,9,9,45,42,123,122,111,1,0,0,0,5,45,9,42,116,128,117,1,0,0,0,7,46,7,42,129,117,128,1,0,0,0,46,7,46,42,122,123,134,1,0,0,0,45,5,47,42,135,134,123,1,0,0,0,47,47,5,42,140,141,128,1,0,0,0,1,1,46,42,129,128,141,1,0,0,0,46,46,1,42,140,134,141,1,0,0,0,1,47,1,42,135,141,134,1,0,0,0,47,1,47],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 96,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 144,
                    "normals": 48,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID540Geometry",
                "vertices": [0.694749,-0.306693,1.66386,0.6875,-0.356693,1.66942,0.6875,-0.306693,1.66942,0.694749,-0.356693,1.66386,0.694749,-0.356693,1.66386,0.694749,-0.306693,1.66386,0.6875,-0.356693,1.66942,0.6875,-0.306693,1.66942,0.694749,-0.356693,1.66386,0.6875,-0.356693,1.66942,0.6875,-0.306693,1.66942,0.694749,-0.306693,1.66386,0.679059,-0.306693,1.67292,0.679059,-0.356693,1.67292,0.679059,-0.356693,1.67292,0.679059,-0.306693,1.67292,0.679059,-0.356693,1.67292,0.679059,-0.306693,1.67292,0.700311,-0.306693,1.65661,0.700311,-0.356693,1.65661,0.700311,-0.306693,1.65661,0.700311,-0.356693,1.65661,0.700311,-0.356693,1.65661,0.700311,-0.306693,1.65661,0.67,-0.306693,1.67411,0.67,-0.356693,1.67411,0.67,-0.356693,1.67411,0.67,-0.306693,1.67411,0.67,-0.356693,1.67411,0.67,-0.306693,1.67411,0.703807,-0.306693,1.64817,0.703807,-0.356693,1.64817,0.703807,-0.306693,1.64817,0.703807,-0.356693,1.64817,0.703807,-0.356693,1.64817,0.703807,-0.306693,1.64817,0.660941,-0.306693,1.67292,0.660941,-0.356693,1.67292,0.660941,-0.356693,1.67292,0.660941,-0.306693,1.67292,0.660941,-0.356693,1.67292,0.660941,-0.306693,1.67292,0.705,-0.306693,1.63911,0.705,-0.356693,1.63911,0.705,-0.306693,1.63911,0.705,-0.356693,1.63911,0.705,-0.356693,1.63911,0.705,-0.306693,1.63911,0.6525,-0.356693,1.66942,0.6525,-0.306693,1.66942,0.6525,-0.356693,1.66942,0.6525,-0.306693,1.66942,0.6525,-0.356693,1.66942,0.6525,-0.306693,1.66942,0.703807,-0.306693,1.63005,0.703807,-0.356693,1.63005,0.703807,-0.306693,1.63005,0.703807,-0.356693,1.63005,0.703807,-0.356693,1.63005,0.703807,-0.306693,1.63005,0.645251,-0.306693,1.66386,0.645251,-0.356693,1.66386,0.645251,-0.356693,1.66386,0.645251,-0.306693,1.66386,0.645251,-0.356693,1.66386,0.645251,-0.306693,1.66386,0.700311,-0.306693,1.62161,0.700311,-0.356693,1.62161,0.700311,-0.306693,1.62161,0.700311,-0.356693,1.62161,0.700311,-0.356693,1.62161,0.700311,-0.306693,1.62161,0.639689,-0.356693,1.65661,0.639689,-0.306693,1.65661,0.639689,-0.356693,1.65661,0.639689,-0.306693,1.65661,0.639689,-0.356693,1.65661,0.639689,-0.306693,1.65661,0.694749,-0.306693,1.61436,0.694749,-0.356693,1.61436,0.694749,-0.306693,1.61436,0.694749,-0.356693,1.61436,0.694749,-0.356693,1.61436,0.694749,-0.306693,1.61436,0.636193,-0.356693,1.64817,0.636193,-0.306693,1.64817,0.636193,-0.356693,1.64817,0.636193,-0.306693,1.64817,0.636193,-0.356693,1.64817,0.636193,-0.306693,1.64817,0.6875,-0.356693,1.6088,0.6875,-0.306693,1.6088,0.6875,-0.356693,1.6088,0.6875,-0.306693,1.6088,0.6875,-0.356693,1.6088,0.6875,-0.306693,1.6088,0.635,-0.356693,1.63911,0.635,-0.306693,1.63911,0.635,-0.356693,1.63911,0.635,-0.306693,1.63911,0.635,-0.356693,1.63911,0.635,-0.306693,1.63911,0.679059,-0.356693,1.6053,0.679059,-0.306693,1.6053,0.679059,-0.356693,1.6053,0.679059,-0.306693,1.6053,0.679059,-0.356693,1.6053,0.679059,-0.306693,1.6053,0.636193,-0.356693,1.63005,0.636193,-0.306693,1.63005,0.636193,-0.356693,1.63005,0.636193,-0.306693,1.63005,0.636193,-0.356693,1.63005,0.636193,-0.306693,1.63005,0.67,-0.306693,1.60411,0.67,-0.356693,1.60411,0.67,-0.356693,1.60411,0.67,-0.306693,1.60411,0.67,-0.356693,1.60411,0.67,-0.306693,1.60411,0.639689,-0.356693,1.62161,0.639689,-0.306693,1.62161,0.639689,-0.356693,1.62161,0.639689,-0.306693,1.62161,0.639689,-0.356693,1.62161,0.639689,-0.306693,1.62161,0.660941,-0.356693,1.6053,0.660941,-0.306693,1.6053,0.660941,-0.356693,1.6053,0.660941,-0.306693,1.6053,0.660941,-0.356693,1.6053,0.660941,-0.306693,1.6053,0.645251,-0.356693,1.61436,0.645251,-0.306693,1.61436,0.645251,-0.356693,1.61436,0.645251,-0.306693,1.61436,0.645251,-0.356693,1.61436,0.645251,-0.306693,1.61436,0.6525,-0.306693,1.6088,0.6525,-0.356693,1.6088,0.6525,-0.356693,1.6088,0.6525,-0.306693,1.6088,0.6525,-0.356693,1.6088,0.6525,-0.306693,1.6088],
                "uvs": [[-6.47768,0,-6.47768,-0.029412,-6.49019,0,-6.49019,-0.029412,6.07977,0,6.09228,0,6.07977,-0.029412,6.09228,-0.029412,-18.6183,-0.029412,-18.6183,0,-18.6058,-0.029412,-18.6058,0,18.235,-0,18.2475,-0,18.235,-0.029412,18.2475,-0.029412,-29.478,-0.029412,-29.478,-0,-29.4655,-0.029412,-29.4655,-0,29.1471,-0,29.1596,-0,29.1471,-0.029412,29.1596,-0.029412,-38.3293,-0.029412,-38.3293,-0,-38.3167,-0.029412,-38.3167,-0,38.0849,-0,38.0849,-0.029412,38.0724,-0,38.0724,-0.029412,-44.5689,-0.029412,-44.5689,0,-44.5564,-0.029412,-44.5564,0,44.4028,0,44.4153,0,44.4028,-0.029412,44.4153,-0.029412,-47.7716,-0.029412,-47.7716,-0,-47.7591,-0.029412,-47.7591,-0,47.7192,-0,47.7192,-0.029412,47.7067,-0,47.7067,-0.029412,-47.7192,-0.029412,-47.7192,-0,-47.7067,-0.029412,-47.7067,-0,47.7716,0,47.7716,-0.029412,47.7591,0,47.7591,-0.029412,-44.4153,0,-44.4028,0,-44.4153,-0.029412,-44.4028,-0.029412,44.5689,-0,44.5689,-0.029412,44.5564,-0,44.5564,-0.029412,-38.0849,-0,-38.0724,-0,-38.0849,-0.029412,-38.0724,-0.029412,38.3293,-0,38.3293,-0.029412,38.3167,-0,38.3167,-0.029412,-29.1471,0,-29.1471,-0.029412,-29.1596,0,-29.1596,-0.029412,29.478,-0,29.478,-0.029412,29.4655,-0,29.4655,-0.029412,-18.2475,-0,-18.235,-0,-18.2475,-0.029412,-18.235,-0.029412,18.6183,0,18.6183,-0.029412,18.6058,0,18.6058,-0.029412,-6.07977,0,-6.07977,-0.029412,-6.09228,0,-6.09228,-0.029412,6.47768,0,6.49019,0,6.47768,-0.029412,6.49019,-0.029412]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.956863,0.956863,0.862745],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0049_Beige_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.956863,0.956863,0.862745],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "01431A4B-F789-370D-B767-8AB2E8E9083A"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0,-0.999969,0,0,-1,1,0,0,0.999969,0,0,-0.999969,0,0,-1,0,0,0,0,1,0,0,0.999969],
                "faces": [42,0,1,2,0,0,1,2,0,0,1,42,1,0,3,0,1,0,3,0,0,1,42,12,13,14,0,4,5,6,2,2,3,42,13,12,15,0,5,4,7,2,2,2,42,22,23,24,0,8,9,10,4,4,5,42,23,22,25,0,9,8,11,4,4,5,42,14,32,33,0,6,12,13,3,2,2,42,32,14,13,0,12,6,5,2,3,2,42,38,39,40,0,14,15,16,6,6,6,42,39,38,41,0,15,14,17,6,6,6,42,48,49,50,0,3,18,1,1,1,1,42,49,48,51,0,18,3,19,1,1,1,42,58,59,60,0,4,20,21,3,3,2,42,59,58,61,0,20,4,7,3,3,2,42,68,69,70,0,22,23,24,4,5,5,42,69,68,71,0,23,22,25,5,4,4,42,78,79,80,0,19,26,18,1,1,1,42,79,78,81,0,26,19,27,1,1,1,42,88,71,68,0,8,25,22,5,4,4,42,71,88,89,0,25,8,11,4,5,5,42,4,5,6,1,0,0,0,6,7,7,42,7,6,5,1,0,0,0,6,7,7,42,16,17,18,1,0,0,0,5,5,5,42,19,18,17,1,0,0,0,5,5,5,42,26,27,28,1,0,0,0,2,3,3,42,29,28,27,1,0,0,0,2,3,3,42,18,19,34,1,0,0,0,5,5,5,42,35,34,19,1,0,0,0,5,5,5,42,42,43,44,1,0,0,0,1,1,1,42,45,44,43,1,0,0,0,1,1,1,42,52,53,54,1,0,0,0,6,6,6,42,55,54,53,1,0,0,0,6,6,6,42,62,63,64,1,0,0,0,5,4,4,42,65,64,63,1,0,0,0,5,4,4,42,72,73,74,1,0,0,0,2,3,2,42,75,74,73,1,0,0,0,2,2,3,42,82,83,84,1,0,0,0,6,6,6,42,85,84,83,1,0,0,0,6,6,6,42,90,91,72,1,0,0,0,2,2,2,42,73,72,91,1,0,0,0,3,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 40,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 92,
                    "normals": 8,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID35Geometry",
                "vertices": [0.091535,-0.153543,0.165354,0.083661,-0.137795,0.165354,0.091535,-0.137795,0.165354,0.083661,-0.153543,0.165354,0.083661,-0.153543,0.165354,0.091535,-0.153543,0.165354,0.083661,-0.137795,0.165354,0.091535,-0.137795,0.165354,0.083661,-0.153543,0.165354,0.091535,-0.153543,0.165354,0.083661,-0.137795,0.165354,0.091535,-0.137795,0.165354,0.083661,-0.137795,0.165354,0.083661,-0.153543,0.15748,0.083661,-0.137795,0.15748,0.083661,-0.153543,0.165354,0.083661,-0.153543,0.165354,0.083661,-0.137795,0.165354,0.083661,-0.153543,0.15748,0.083661,-0.137795,0.15748,0.083661,-0.153543,0.15748,0.083661,-0.137795,0.15748,0.091535,-0.153543,0.165354,0.091535,-0.137795,0.041339,0.091535,-0.153543,0.041339,0.091535,-0.137795,0.165354,0.091535,-0.137795,0.165354,0.091535,-0.153543,0.165354,0.091535,-0.137795,0.041339,0.091535,-0.153543,0.041339,0.091535,-0.153543,0.041339,0.091535,-0.137795,0.041339,0.083661,-0.153543,0.049213,0.083661,-0.137795,0.049213,0.083661,-0.153543,0.049213,0.083661,-0.137795,0.049213,0.083661,-0.153543,0.049213,0.083661,-0.137795,0.049213,0.053642,-0.153543,0.041339,0.091535,-0.137795,0.041339,0.053642,-0.137795,0.041339,0.091535,-0.153543,0.041339,0.091535,-0.153543,0.041339,0.053642,-0.153543,0.041339,0.091535,-0.137795,0.041339,0.053642,-0.137795,0.041339,0.053642,-0.153543,0.041339,0.053642,-0.137795,0.041339,0.083661,-0.153543,0.049213,0.061516,-0.137795,0.049213,0.083661,-0.137795,0.049213,0.061516,-0.153543,0.049213,0.061516,-0.153543,0.049213,0.083661,-0.153543,0.049213,0.061516,-0.137795,0.049213,0.083661,-0.137795,0.049213,0.061516,-0.153543,0.049213,0.061516,-0.137795,0.049213,0.053642,-0.137795,0.165354,0.053642,-0.153543,0.041339,0.053642,-0.137795,0.041339,0.053642,-0.153543,0.165354,0.053642,-0.153543,0.165354,0.053642,-0.137795,0.165354,0.053642,-0.153543,0.041339,0.053642,-0.137795,0.041339,0.053642,-0.153543,0.165354,0.053642,-0.137795,0.165354,0.061516,-0.153543,0.15748,0.061516,-0.137795,0.049213,0.061516,-0.153543,0.049213,0.061516,-0.137795,0.15748,0.061516,-0.137795,0.15748,0.061516,-0.153543,0.15748,0.061516,-0.137795,0.049213,0.061516,-0.153543,0.049213,0.061516,-0.153543,0.15748,0.061516,-0.137795,0.15748,0.061516,-0.153543,0.165354,0.053642,-0.137795,0.165354,0.061516,-0.137795,0.165354,0.053642,-0.153543,0.165354,0.053642,-0.153543,0.165354,0.061516,-0.153543,0.165354,0.053642,-0.137795,0.165354,0.061516,-0.137795,0.165354,0.061516,-0.153543,0.165354,0.061516,-0.137795,0.165354,0.061516,-0.153543,0.165354,0.061516,-0.137795,0.165354,0.061516,-0.137795,0.165354,0.061516,-0.153543,0.165354],
                "uvs": [[0.022884,0.038386,0.020915,0.034449,0.022884,0.034449,0.020915,0.038386,0.041339,0.034449,0.03937,0.038386,0.03937,0.034449,0.041339,0.038386,-0.041339,0.038386,-0.010335,0.034449,-0.010335,0.038386,-0.041339,0.034449,0.012303,0.038386,0.012303,0.034449,-0.01341,0.038386,-0.022884,0.034449,-0.01341,0.034449,-0.022884,0.038386,0.015379,0.034449,0.015379,0.038386,0.010335,0.038386,0.010335,0.034449,-0.03937,0.038386,-0.012303,0.034449,-0.012303,0.038386,-0.03937,0.034449,0.01341,0.034449,0.01341,0.038386]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Corrogated_Shiny_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Corrogated_Shiny_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.666667,0.690196,0.8],
                "DbgColor": 15597568,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.666667,0.690196,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "627DAE5E-2C88-3384-BC90-5954B7283D07"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Aluminum_Anodized_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Aluminum_Anodized_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "D6CCECB4-C9D3-34D0-B275-2862DB722996"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.011Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default.010",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "9A52E88D-D34E-3A41-9C17-67ED9AA105CF"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.015Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.014",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "AD2E111C-985E-347E-9FC9-C14B83D4CFB6"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.005Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default.004",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "0F01A96E-B4D6-3D8F-ACC0-81E00569B642"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.004Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.003",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "82514B16-847C-30D3-972D-03A298E71186"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.014Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.013",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "DB28B6EA-28E8-36D3-9380-D313EB3967A8"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.018Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.017",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "26385B27-4430-35E6-BB05-AB7AE92E87B6"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,1,0,0,0.999969,0,0,-1,0,0,-0.999969,0,0,0,0.999969,0,0,1,0,0,-1,0,0,-0.999969],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,3,0,4,0,3,0,4,0,0,0,42,4,0,5,0,4,0,5,0,0,0,42,5,0,6,0,5,0,6,0,0,0,42,6,0,7,0,6,0,7,0,0,0,42,2,1,8,0,2,1,8,0,0,0,42,6,7,9,0,6,7,9,0,0,1,42,9,7,10,0,9,7,10,1,0,0,42,10,7,11,0,10,7,11,0,0,0,42,11,7,12,0,11,7,12,0,0,0,42,12,7,13,0,12,7,13,0,0,0,42,13,7,14,0,13,7,14,0,0,1,42,14,7,15,0,14,7,15,1,0,0,42,2,16,17,0,2,16,17,0,0,0,42,16,2,18,0,16,2,18,0,0,0,42,18,2,19,0,18,2,19,0,0,0,42,19,2,20,0,19,2,20,0,0,0,42,20,2,21,0,20,2,21,0,0,0,42,21,2,8,0,21,2,8,0,0,0,42,17,16,22,0,17,16,22,0,0,0,42,17,22,23,0,17,22,23,0,0,0,42,17,23,24,0,17,23,24,0,0,0,42,17,24,25,0,17,24,25,0,0,1,42,17,25,26,0,17,25,26,0,1,0,42,17,26,27,0,17,26,27,0,0,0,42,17,27,15,0,17,27,15,0,0,0,42,17,15,7,0,17,15,7,0,0,0,42,28,29,30,0,7,15,17,2,2,2,42,29,31,30,0,15,27,17,2,2,2,42,31,32,30,0,27,26,17,2,2,2,42,32,33,30,0,26,25,17,2,2,2,42,33,34,30,0,25,24,17,2,2,2,42,34,35,30,0,24,23,17,2,2,2,42,35,36,30,0,23,22,17,2,2,2,42,36,37,30,0,22,16,17,2,2,2,42,38,39,40,0,8,2,21,2,2,2,42,40,39,41,0,21,2,20,2,2,2,42,41,39,42,0,20,2,19,2,2,2,42,42,39,43,0,19,2,18,2,2,2,42,43,39,37,0,18,2,16,2,2,2,42,30,37,39,0,17,16,2,2,2,2,42,29,28,44,0,15,7,14,2,2,3,42,44,28,45,0,14,7,13,3,2,3,42,45,28,46,0,13,7,12,3,2,3,42,46,28,47,0,12,7,11,3,2,2,42,47,28,48,0,11,7,10,2,2,2,42,48,28,49,0,10,7,9,2,2,3,42,49,28,50,0,9,7,6,3,2,2,42,38,51,39,0,8,1,2,2,2,2,42,28,52,50,0,7,0,6,2,3,2,42,50,52,53,0,6,0,5,2,3,2,42,53,52,54,0,5,0,4,2,3,2,42,54,52,55,0,4,0,3,2,3,2,42,55,52,51,0,3,0,1,2,3,2,42,39,51,52,0,2,1,0,2,2,3,42,84,85,86,0,28,29,30,4,4,5,42,85,84,87,0,29,28,31,4,4,5,42,88,89,90,0,31,28,29,6,7,7,42,91,90,89,0,30,29,28,6,7,7],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 60,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 94,
                    "normals": 8,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID694Geometry",
                "vertices": [0.41155,-0.256693,0.626908,0.428558,-0.256693,0.581229,0.41155,-0.256693,0.526908,0.432054,-0.256693,0.58967,0.437617,-0.256693,0.596919,0.444865,-0.256693,0.602481,0.453307,-0.256693,0.605978,0.51155,-0.256693,0.626908,0.427365,-0.256693,0.57217,0.462365,-0.256693,0.60717,0.471424,-0.256693,0.605978,0.479865,-0.256693,0.602481,0.487114,-0.256693,0.596919,0.492676,-0.256693,0.58967,0.496173,-0.256693,0.581229,0.497365,-0.256693,0.57217,0.453307,-0.256693,0.538363,0.51155,-0.256693,0.526908,0.444865,-0.256693,0.54186,0.437617,-0.256693,0.547422,0.432054,-0.256693,0.55467,0.428558,-0.256693,0.563112,0.462365,-0.256693,0.53717,0.471424,-0.256693,0.538363,0.479865,-0.256693,0.54186,0.487114,-0.256693,0.547422,0.492676,-0.256693,0.55467,0.496173,-0.256693,0.563112,0.51155,-0.256693,0.626908,0.497365,-0.256693,0.57217,0.51155,-0.256693,0.526908,0.496173,-0.256693,0.563112,0.492676,-0.256693,0.55467,0.487114,-0.256693,0.547422,0.479865,-0.256693,0.54186,0.471424,-0.256693,0.538363,0.462365,-0.256693,0.53717,0.453307,-0.256693,0.538363,0.427365,-0.256693,0.57217,0.41155,-0.256693,0.526908,0.428558,-0.256693,0.563112,0.432054,-0.256693,0.55467,0.437617,-0.256693,0.547422,0.444865,-0.256693,0.54186,0.496173,-0.256693,0.581229,0.492676,-0.256693,0.58967,0.487114,-0.256693,0.596919,0.479865,-0.256693,0.602481,0.471424,-0.256693,0.605978,0.462365,-0.256693,0.60717,0.453307,-0.256693,0.605978,0.428558,-0.256693,0.581229,0.41155,-0.256693,0.626908,0.444865,-0.256693,0.602481,0.437617,-0.256693,0.596919,0.432054,-0.256693,0.58967,0.51155,-0.256693,0.626908,0.51155,-0.256693,0.526908,0.41155,-0.256693,0.526908,0.41155,-0.256693,0.626908,0.432054,-0.256693,0.55467,0.437617,-0.256693,0.547422,0.444865,-0.256693,0.54186,0.453307,-0.256693,0.538363,0.462365,-0.256693,0.53717,0.471424,-0.256693,0.538363,0.479865,-0.256693,0.54186,0.487114,-0.256693,0.547422,0.492676,-0.256693,0.55467,0.496173,-0.256693,0.563112,0.497365,-0.256693,0.57217,0.496173,-0.256693,0.581229,0.492676,-0.256693,0.58967,0.487114,-0.256693,0.596919,0.479865,-0.256693,0.602481,0.471424,-0.256693,0.605978,0.462365,-0.256693,0.60717,0.453307,-0.256693,0.605978,0.444865,-0.256693,0.602481,0.437617,-0.256693,0.596919,0.432054,-0.256693,0.58967,0.428558,-0.256693,0.581229,0.427365,-0.256693,0.57217,0.428558,-0.256693,0.563112,0.41155,-0.306693,0.626908,0.51155,-0.256693,0.626908,0.41155,-0.256693,0.626908,0.51155,-0.306693,0.626908,0.51155,-0.306693,0.626908,0.41155,-0.306693,0.626908,0.51155,-0.256693,0.626908,0.41155,-0.256693,0.626908,0.41155,-0.306693,0.626908,0.51155,-0.306693,0.626908],
                "uvs": [[-23.5477,17.3549,-23.571,17.3281,-23.5477,17.2961,-23.5758,17.333,-23.5834,17.3373,-23.5934,17.3405,-23.6049,17.3426,-23.6847,17.3549,-23.5694,17.3227,-23.6173,17.3433,-23.6298,17.3426,-23.6413,17.3405,-23.6513,17.3373,-23.6589,17.333,-23.6637,17.3281,-23.6653,17.3227,-23.6049,17.3028,-23.6847,17.2961,-23.5934,17.3049,-23.5834,17.3082,-23.5758,17.3124,-23.571,17.3174,-23.6173,17.3021,-23.6298,17.3028,-23.6413,17.3049,-23.6513,17.3082,-23.6589,17.3124,-23.6637,17.3174,-23.5477,-0.029412,-23.6847,-0.058824,-23.5477,-0.058824,-23.6847,-0.029412]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "37AD6ECE-D897-36C9-B21A-84755694786C"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0,-1,0,0,-0.999969,0.707083,0.707083,0,1,0,0,0.332377,0,0.943144,0.999969,0,0,0,-1,0,0,0,1,0,-0.999969,0,-1,0,0,-0.999969,0,0,-0.707083,0.707083,0,0,0.999969,0,0,1,0,0,-0.894406,0.447188,-0.000153,1,3.1e-05,0,0,0.999969,-1,0,0.000214,-0.332408,0,0.943114,-0.000397,0.999969,0,6.1e-05,0.999969,0,6.1e-05,1,0,-0.707083,-0.707083,0,-0.332377,0,0.943144,0.707083,-0.707083,0,0,0.894406,-0.447188,0.000153,-1,-3.1e-05,0.332408,0,0.943114,1,0,0.000214,0.000397,-0.999969,0,-6.1e-05,-1,0,-6.1e-05,-0.999969,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,1,3,4,0,1,3,4,0,0,1,42,4,3,5,0,4,3,5,1,0,1,42,4,5,6,0,4,5,6,1,1,0,42,6,5,7,0,6,5,7,0,1,0,42,6,7,8,0,6,7,8,0,0,0,42,8,7,9,0,8,7,9,0,0,0,42,2,10,11,0,2,10,11,0,0,0,42,10,2,1,0,10,2,1,0,0,0,42,11,10,12,0,11,10,12,0,0,0,42,11,12,13,0,11,12,13,0,0,0,42,13,12,14,0,13,12,14,0,0,0,42,13,14,15,0,13,14,15,0,0,0,42,15,14,9,0,15,14,9,0,0,0,42,15,9,7,0,15,9,7,0,0,0,42,48,49,50,0,16,17,18,2,2,2,42,49,48,51,0,17,16,19,2,2,2,42,58,59,60,0,20,21,22,3,4,3,42,59,58,61,0,21,20,23,4,3,3,42,60,62,63,0,22,24,25,3,3,3,42,62,60,64,0,24,22,26,3,3,3,42,64,60,65,0,26,22,27,3,3,3,42,65,60,59,0,27,22,21,3,3,4,42,62,66,67,0,24,28,29,3,5,3,42,66,62,68,0,28,24,30,5,3,5,42,68,62,69,0,30,24,31,5,3,3,42,69,62,64,0,31,24,26,3,3,3,42,68,69,70,0,30,31,32,5,3,3,42,94,95,96,0,33,34,35,6,6,6,42,95,94,97,0,34,33,36,6,6,6,42,97,94,98,0,36,33,37,6,6,6,42,99,100,101,0,38,39,40,6,6,7,42,100,99,102,0,39,38,41,6,6,8,42,100,102,103,0,39,41,42,6,8,6,42,104,105,106,0,43,44,45,8,6,6,42,105,104,107,0,44,43,46,6,8,6,42,105,107,108,0,44,46,47,6,6,6,42,108,107,109,0,47,46,48,6,6,6,42,108,109,110,0,47,48,49,6,6,6,42,109,107,111,0,48,46,50,6,6,6,42,111,107,112,0,50,46,51,6,6,6,42,111,112,113,0,50,51,52,6,6,8,42,112,107,114,0,51,46,53,6,6,6,42,114,107,115,0,53,46,54,6,6,6,42,114,115,116,0,53,54,55,6,6,6,42,115,107,117,0,54,46,56,6,6,6,42,117,107,118,0,56,46,57,6,6,6,42,106,119,120,0,45,58,59,6,6,6,42,119,106,105,0,58,45,44,6,6,6,42,120,119,97,0,59,58,36,6,6,6,42,120,97,121,0,59,36,60,6,6,6,42,121,97,122,0,60,36,61,6,6,6,42,122,97,98,0,61,36,37,6,6,6,42,121,122,110,0,60,61,49,6,6,6,42,121,110,109,0,60,49,48,6,6,6,42,120,121,116,0,59,60,55,6,6,6,42,120,116,123,0,59,55,62,6,6,6,42,123,116,115,0,62,55,54,6,6,6,42,120,123,100,0,59,62,39,6,6,6,42,120,100,124,0,59,39,63,6,6,6,42,124,100,103,0,63,39,42,6,6,6,42,120,124,118,0,59,63,57,6,6,6,42,120,118,107,0,59,57,46,6,6,6,42,112,125,113,0,51,64,52,6,6,8,42,125,112,126,0,64,51,65,6,6,6,42,190,191,192,0,66,67,68,9,9,9,42,191,190,193,0,67,66,69,9,9,9,42,193,190,194,0,69,66,70,9,9,9,42,194,190,195,0,70,66,71,9,9,9,42,195,190,196,0,71,66,72,9,9,10,42,194,197,198,0,70,73,74,9,9,9,42,197,194,195,0,73,70,71,9,9,9,42,198,197,199,0,74,73,75,9,9,9,42,198,199,200,0,74,75,76,9,9,9,42,198,200,201,0,74,76,77,9,9,9,42,198,201,202,0,74,77,78,9,9,9,42,226,227,228,0,79,80,81,11,11,11,42,227,226,229,0,80,79,82,11,11,11,42,235,236,237,0,83,84,85,9,9,9,42,236,235,238,0,84,83,70,9,9,9,42,244,245,246,0,86,87,88,12,13,13,42,245,244,247,0,87,86,89,13,12,13,42,245,247,248,0,87,89,90,13,13,13,42,248,247,249,0,90,89,91,13,13,13,42,250,251,252,0,92,93,94,13,13,13,42,251,253,254,0,93,95,96,13,13,13,42,253,251,255,0,95,93,97,13,13,13,42,255,251,250,0,97,93,92,13,13,13,42,248,256,257,0,90,98,99,13,13,13,42,256,248,249,0,98,90,91,13,13,13,42,256,249,258,0,98,91,100,13,13,13,42,256,258,259,0,98,100,101,13,13,13,42,256,259,260,0,98,101,102,13,13,13,42,256,260,261,0,98,102,103,13,13,13,42,256,261,262,0,98,103,104,13,13,13,42,256,262,263,0,98,104,105,13,13,13,42,256,263,264,0,98,105,106,13,13,13,42,256,264,265,0,98,106,107,13,13,13,42,256,265,254,0,98,107,96,13,13,13,42,256,254,253,0,98,96,95,13,13,13,42,303,304,305,0,25,108,109,3,3,3,42,304,303,306,0,108,25,110,3,3,3,42,311,312,313,0,5,0,46,0,0,0,42,312,311,314,0,0,5,3,0,0,0,42,319,320,321,0,111,112,113,7,7,7,42,320,319,322,0,112,111,114,7,7,7,42,329,330,331,0,115,116,117,14,14,14,42,330,329,332,0,116,115,118,14,14,14,42,332,329,333,0,118,115,119,14,14,14,42,341,342,343,0,120,121,122,7,7,7,42,342,341,344,0,121,120,123,7,7,7,42,344,341,345,0,123,120,124,7,7,7,42,344,345,346,0,123,124,125,7,7,7,42,344,346,347,0,123,125,126,7,7,7,42,347,346,348,0,126,125,127,7,7,7,42,349,350,351,0,128,129,130,7,7,7,42,350,349,352,0,129,128,131,7,7,7,42,352,349,353,0,131,128,132,7,7,7,42,353,349,354,0,132,128,133,7,7,7,42,354,349,348,0,133,128,127,7,7,7,42,354,348,346,0,133,127,125,7,7,7,42,65,69,64,0,27,31,26,3,3,3,42,69,65,70,0,31,27,32,3,3,3,42,374,375,376,0,134,135,136,13,12,13,42,375,374,377,0,135,134,137,12,13,13,42,375,377,378,0,135,137,138,12,13,13,42,378,377,379,0,138,137,139,13,13,13,42,379,377,380,0,139,137,140,13,13,13,42,380,377,381,0,140,137,141,13,13,13,42,381,377,382,0,141,137,142,13,13,13,42,381,383,380,0,141,143,140,13,7,13,42,376,384,385,0,136,144,145,13,15,13,42,384,376,375,0,144,136,135,15,13,12,42,406,407,408,0,146,147,148,1,1,0,42,407,406,409,0,147,146,149,1,1,0,42,415,416,417,0,150,45,151,6,6,6,42,418,419,420,0,152,153,59,6,6,7,42,421,422,423,0,154,155,156,6,8,6,42,422,421,417,0,155,154,151,8,6,6,42,422,417,416,0,155,151,45,8,6,6,42,423,422,424,0,156,155,157,6,8,6,42,423,424,425,0,156,157,158,6,6,6,42,423,425,419,0,156,158,153,6,6,6,42,423,419,418,0,156,153,152,6,6,6,42,423,418,426,0,156,152,159,6,6,6,42,446,447,448,0,11,43,2,0,0,0,42,447,446,449,0,43,11,13,0,0,0,42,196,197,195,0,72,73,71,10,9,9,42,197,196,199,0,73,72,75,9,10,9,42,454,455,456,0,160,161,162,0,0,0,42,455,454,457,0,161,160,163,0,0,0,42,462,463,464,0,164,21,165,3,9,3,42,463,462,465,0,21,164,23,9,3,3,42,464,466,467,0,165,166,167,3,3,3,42,466,464,468,0,166,165,168,3,3,3,42,468,464,463,0,168,165,21,3,3,9,42,479,480,481,0,123,169,170,7,7,7,42,480,479,482,0,169,123,171,7,7,7,42,482,479,483,0,171,123,172,7,7,7,42,483,479,484,0,172,123,173,7,7,7,42,484,479,485,0,173,123,174,7,7,7,42,485,479,486,0,174,123,175,7,7,7,42,486,479,487,0,175,123,176,7,7,7,42,487,479,488,0,176,123,177,7,7,7,42,488,479,489,0,177,123,178,7,7,7,42,489,479,490,0,178,123,179,7,7,7,42,490,479,491,0,179,123,180,7,7,7,42,491,492,493,0,180,181,182,7,7,7,42,492,491,494,0,181,180,128,7,7,7,42,494,491,479,0,128,180,123,7,7,7,42,494,479,495,0,128,123,126,7,7,16,42,494,495,496,0,128,126,127,7,16,16,42,489,497,498,0,178,183,184,7,7,7,42,497,489,490,0,183,178,179,7,7,7,42,487,499,500,0,176,185,186,7,7,7,42,499,487,488,0,185,176,177,7,7,7,42,485,501,502,0,174,187,188,7,7,7,42,501,485,486,0,187,174,175,7,7,7,42,483,503,504,0,172,189,190,7,7,7,42,503,483,484,0,189,172,173,7,7,7,42,482,504,480,0,171,190,169,7,7,7,42,504,482,483,0,190,171,172,7,7,7,42,484,502,503,0,173,188,189,7,7,7,42,502,484,485,0,188,173,174,7,7,7,42,486,500,501,0,175,186,187,7,7,7,42,500,486,487,0,186,175,176,7,7,7,42,488,498,499,0,177,184,185,7,7,7,42,498,488,489,0,184,177,178,7,7,7,42,497,491,493,0,183,180,182,7,7,7,42,491,497,490,0,180,183,179,7,7,7,42,544,545,546,0,191,192,193,17,9,9,42,545,544,547,0,192,191,194,9,17,9,42,547,544,548,0,194,191,76,9,17,18,42,547,548,549,0,194,76,195,9,18,9,42,547,549,550,0,194,195,78,9,9,9,42,550,549,551,0,78,195,77,9,9,9,42,560,561,562,0,196,197,198,19,19,19,42,561,560,563,0,197,196,199,19,19,19,42,568,569,570,0,200,201,202,13,13,13,42,569,568,571,0,201,200,203,13,13,13,42,576,577,578,0,204,205,206,20,20,21,42,577,576,579,0,205,204,207,20,20,21,42,584,585,586,0,208,209,210,0,0,0,42,585,584,587,0,209,208,211,0,0,0,42,592,593,594,0,212,73,71,9,9,9,42,593,592,595,0,73,212,213,9,9,9,42,600,601,602,0,214,31,26,3,3,3,42,601,600,603,0,31,214,215,3,3,3,42,608,609,610,0,216,217,218,3,3,3,42,609,608,611,0,217,216,219,3,3,3,42,618,619,620,0,220,91,221,13,13,13,42,619,618,621,0,91,220,100,13,13,13,42,627,628,629,0,222,223,224,9,9,9,42,628,627,630,0,223,222,225,9,9,9,42,636,637,638,0,216,217,218,3,3,3,42,637,636,639,0,217,216,219,3,3,3,42,646,647,648,0,226,101,227,13,13,13,42,647,646,649,0,101,226,102,13,13,13,42,655,656,657,0,222,223,224,9,9,9,42,656,655,658,0,223,222,225,9,9,9,42,664,665,666,0,216,217,218,3,3,3,42,665,664,667,0,217,216,219,3,3,3,42,674,675,676,0,228,103,229,13,12,13,42,675,674,677,0,103,228,104,12,13,13,42,683,684,685,0,222,223,224,9,9,9,42,684,683,686,0,223,222,225,9,9,9,42,692,693,694,0,216,217,218,3,3,3,42,693,692,695,0,217,216,219,3,3,3,42,702,703,704,0,230,105,231,13,13,13,42,703,702,705,0,105,230,106,13,13,13,42,711,712,713,0,222,223,224,9,9,9,42,712,711,714,0,223,222,225,9,9,9,42,720,721,722,0,216,217,218,3,3,3,42,721,720,723,0,217,216,219,3,3,3,42,730,731,732,0,232,107,233,13,13,13,42,731,730,733,0,107,232,96,13,13,13,42,739,740,741,0,222,192,224,9,9,9,42,740,739,742,0,192,222,225,9,9,9,42,748,749,750,0,234,235,236,0,0,0,42,749,748,751,0,235,234,237,0,0,0,42,756,757,758,0,238,239,240,0,0,0,42,757,756,759,0,239,238,241,0,0,0,42,764,765,766,0,242,243,244,0,0,0,42,765,764,767,0,243,242,245,0,0,0,42,772,773,774,0,246,247,248,0,0,0,42,773,772,775,0,247,246,249,0,0,0,42,780,781,782,0,250,251,252,0,0,0,42,781,780,783,0,251,250,253,0,0,0,42,16,17,18,1,0,0,0,7,7,7,42,17,19,18,1,0,0,0,7,7,7,42,18,19,20,1,0,0,0,7,7,7,42,19,21,20,1,0,0,0,7,7,7,42,20,21,22,1,0,0,0,7,7,7,42,21,23,22,1,0,0,0,7,7,7,42,24,25,23,1,0,0,0,7,7,7,42,22,23,25,1,0,0,0,7,7,7,42,17,16,26,1,0,0,0,7,7,7,42,26,16,27,1,0,0,0,7,7,7,42,16,28,27,1,0,0,0,7,16,7,42,27,28,29,1,0,0,0,7,16,16,42,28,30,29,1,0,0,0,16,7,16,42,29,30,24,1,0,0,0,16,7,7,42,30,31,24,1,0,0,0,7,7,7,42,25,24,31,1,0,0,0,7,7,7,42,52,53,54,1,0,0,0,22,22,22,42,55,54,53,1,0,0,0,22,22,22,42,71,72,73,1,0,0,0,9,9,10,42,74,75,72,1,0,0,0,9,9,9,42,72,75,73,1,0,0,0,9,9,10,42,73,75,76,1,0,0,0,10,9,10,42,77,76,75,1,0,0,0,9,10,9,42,78,79,80,1,0,0,0,23,9,9,42,80,79,74,1,0,0,0,9,9,9,42,74,79,75,1,0,0,0,9,9,9,42,81,75,79,1,0,0,0,9,9,9,42,82,83,78,1,0,0,0,9,9,23,42,79,78,83,1,0,0,0,9,23,9,42,127,128,129,1,0,0,0,7,13,13,42,130,129,128,1,0,0,0,12,13,13,42,131,132,133,1,0,0,0,13,13,13,42,132,134,133,1,0,0,0,13,13,13,42,135,136,134,1,0,0,0,13,13,13,42,134,136,133,1,0,0,0,13,13,13,42,136,137,133,1,0,0,0,13,13,13,42,138,139,137,1,0,0,0,13,13,13,42,137,139,133,1,0,0,0,13,13,13,42,139,140,133,1,0,0,0,13,13,13,42,141,142,140,1,0,0,0,13,13,13,42,142,143,140,1,0,0,0,13,13,13,42,144,145,143,1,0,0,0,13,13,13,42,143,145,140,1,0,0,0,13,13,13,42,140,145,133,1,0,0,0,13,13,13,42,145,146,133,1,0,0,0,13,13,13,42,147,148,146,1,0,0,0,13,13,13,42,133,146,148,1,0,0,0,13,13,13,42,132,131,149,1,0,0,0,13,13,13,42,149,131,138,1,0,0,0,13,13,13,42,139,138,150,1,0,0,0,13,13,13,42,138,131,150,1,0,0,0,13,13,13,42,150,131,128,1,0,0,0,13,13,13,42,130,128,151,1,0,0,0,12,13,13,42,128,131,151,1,0,0,0,13,13,13,42,151,131,141,1,0,0,0,13,13,13,42,142,141,152,1,0,0,0,13,13,13,42,141,131,152,1,0,0,0,13,13,13,42,152,131,147,1,0,0,0,13,13,13,42,131,153,147,1,0,0,0,13,12,13,42,148,147,153,1,0,0,0,13,13,12,42,135,154,136,1,0,0,0,13,12,13,42,154,155,136,1,0,0,0,12,13,13,42,156,136,155,1,0,0,0,7,13,13,42,144,157,145,1,0,0,0,13,13,13,42,145,157,158,1,0,0,0,13,13,13,42,159,158,157,1,0,0,0,13,13,13,42,203,204,205,1,0,0,0,3,3,3,42,204,206,205,1,0,0,0,3,4,3,42,206,207,205,1,0,0,0,4,3,3,42,207,208,205,1,0,0,0,3,5,3,42,209,210,208,1,0,0,0,3,3,5,42,205,208,210,1,0,0,0,3,5,3,42,211,212,209,1,0,0,0,3,3,3,42,209,212,210,1,0,0,0,3,3,3,42,210,212,213,1,0,0,0,3,3,3,42,213,212,214,1,0,0,0,3,3,3,42,215,214,212,1,0,0,0,3,3,3,42,230,231,232,1,0,0,0,24,24,24,42,233,232,231,1,0,0,0,24,24,24,42,239,240,241,1,0,0,0,3,3,3,42,242,241,240,1,0,0,0,3,3,3,42,266,267,268,1,0,0,0,6,6,6,42,267,269,268,1,0,0,0,6,6,6,42,269,270,268,1,0,0,0,6,6,6,42,270,271,268,1,0,0,0,6,6,6,42,271,272,268,1,0,0,0,6,6,6,42,272,273,268,1,0,0,0,6,6,6,42,273,274,268,1,0,0,0,6,6,6,42,274,275,268,1,0,0,0,6,6,6,42,275,276,268,1,0,0,0,6,6,6,42,276,277,268,1,0,0,0,6,6,6,42,277,278,268,1,0,0,0,6,6,6,42,279,268,278,1,0,0,0,6,6,6,42,280,281,282,1,0,0,0,6,6,6,42,282,281,266,1,0,0,0,6,6,6,42,267,266,281,1,0,0,0,6,6,6,42,283,281,280,1,0,0,0,6,6,6,42,277,284,278,1,0,0,0,6,6,6,42,278,284,285,1,0,0,0,6,6,6,42,284,286,285,1,0,0,0,6,8,6,42,287,285,286,1,0,0,0,6,6,8,42,307,308,309,1,0,0,0,9,9,9,42,310,309,308,1,0,0,0,9,9,9,42,315,316,317,1,0,0,0,7,7,7,42,318,317,316,1,0,0,0,7,7,7,42,323,324,325,1,0,0,0,0,0,0,42,326,325,324,1,0,0,0,0,0,0,42,334,335,336,1,0,0,0,25,25,25,42,336,335,337,1,0,0,0,25,25,25,42,338,337,335,1,0,0,0,25,25,25,42,355,356,357,1,0,0,0,0,0,0,42,356,358,357,1,0,0,0,0,0,0,42,357,358,359,1,0,0,0,0,0,0,42,359,358,360,1,0,0,0,0,0,0,42,360,358,361,1,0,0,0,0,0,0,42,362,361,358,1,0,0,0,0,0,0,42,356,355,363,1,0,0,0,0,0,0,42,363,355,364,1,0,0,0,0,0,0,42,355,365,364,1,0,0,0,0,0,0,42,365,366,364,1,0,0,0,0,0,0,42,364,366,367,1,0,0,0,0,0,0,42,368,367,366,1,0,0,0,0,0,0,42,71,80,72,1,0,0,0,9,9,9,42,74,72,80,1,0,0,0,9,9,9,42,386,387,388,1,0,0,0,8,6,26,42,389,388,387,1,0,0,0,6,26,6,42,390,391,392,1,0,0,0,6,7,6,42,393,394,392,1,0,0,0,6,6,6,42,392,394,390,1,0,0,0,6,6,6,42,390,394,395,1,0,0,0,6,6,6,42,395,394,396,1,0,0,0,6,6,6,42,396,394,386,1,0,0,0,6,6,8,42,394,397,386,1,0,0,0,6,6,8,42,387,386,397,1,0,0,0,6,8,6,42,410,411,412,1,0,0,0,7,16,16,42,413,412,411,1,0,0,0,7,16,16,42,427,428,429,1,0,0,0,13,13,13,42,428,430,429,1,0,0,0,13,13,13,42,430,431,429,1,0,0,0,13,13,13,42,431,432,429,1,0,0,0,13,13,13,42,432,433,429,1,0,0,0,13,12,13,42,434,435,433,1,0,0,0,13,13,12,42,435,436,433,1,0,0,0,13,13,12,42,429,433,436,1,0,0,0,13,12,13,42,437,430,428,1,0,0,0,7,13,13,42,435,434,438,1,0,0,0,13,13,13,42,450,451,452,1,0,0,0,7,7,7,42,453,452,451,1,0,0,0,7,7,7,42,207,211,208,1,0,0,0,3,3,5,42,209,208,211,1,0,0,0,3,5,3,42,458,459,460,1,0,0,0,7,7,7,42,461,460,459,1,0,0,0,7,7,7,42,469,470,471,1,0,0,0,18,9,17,42,471,470,472,1,0,0,0,17,9,9,42,473,472,470,1,0,0,0,9,9,9,42,474,475,469,1,0,0,0,9,9,18,42,470,469,475,1,0,0,0,9,18,9,42,505,506,507,1,0,0,0,0,0,0,42,508,507,506,1,0,0,0,0,0,0,42,509,510,511,1,0,0,0,0,0,0,42,512,511,510,1,0,0,0,0,0,0,42,513,514,515,1,0,0,0,0,0,0,42,516,515,514,1,0,0,0,0,0,0,42,517,518,519,1,0,0,0,0,0,0,42,520,519,518,1,0,0,0,0,0,0,42,521,522,523,1,0,0,0,1,1,0,42,522,524,523,1,0,0,0,1,0,0,42,524,525,523,1,0,0,0,0,0,0,42,523,525,526,1,0,0,0,0,0,0,42,527,526,525,1,0,0,0,0,0,0,42,525,524,517,1,0,0,0,0,0,0,42,517,524,518,1,0,0,0,0,0,0,42,518,524,513,1,0,0,0,0,0,0,42,513,524,514,1,0,0,0,0,0,0,42,514,524,509,1,0,0,0,0,0,0,42,509,524,510,1,0,0,0,0,0,0,42,510,524,505,1,0,0,0,0,0,0,42,505,524,506,1,0,0,0,0,0,0,42,506,524,528,1,0,0,0,0,0,0,42,528,524,529,1,0,0,0,0,0,0,42,530,529,524,1,0,0,0,0,0,0,42,506,528,508,1,0,0,0,0,0,0,42,529,508,528,1,0,0,0,0,0,0,42,510,505,512,1,0,0,0,0,0,0,42,507,512,505,1,0,0,0,0,0,0,42,514,509,516,1,0,0,0,0,0,0,42,511,516,509,1,0,0,0,0,0,0,42,518,513,520,1,0,0,0,0,0,0,42,515,520,513,1,0,0,0,0,0,0,42,517,519,525,1,0,0,0,0,0,0,42,527,525,519,1,0,0,0,0,0,0,42,552,553,554,1,0,0,0,3,3,3,42,554,553,555,1,0,0,0,3,3,3,42,553,556,555,1,0,0,0,3,27,3,42,556,557,555,1,0,0,0,27,28,3,42,555,557,558,1,0,0,0,3,28,3,42,559,558,557,1,0,0,0,3,3,28,42,564,565,566,1,0,0,0,29,29,29,42,567,566,565,1,0,0,0,29,29,29,42,572,573,574,1,0,0,0,6,6,6,42,575,574,573,1,0,0,0,6,6,6,42,580,581,582,1,0,0,0,30,31,31,42,583,582,581,1,0,0,0,30,31,31,42,588,589,590,1,0,0,0,7,7,7,42,591,590,589,1,0,0,0,7,7,7,42,596,597,598,1,0,0,0,3,3,3,42,599,598,597,1,0,0,0,3,3,3,42,604,605,606,1,0,0,0,9,9,9,42,607,606,605,1,0,0,0,9,9,9,42,612,613,614,1,0,0,0,9,9,9,42,615,614,613,1,0,0,0,9,9,9,42,622,623,624,1,0,0,0,6,6,6,42,625,624,623,1,0,0,0,6,6,6,42,631,632,633,1,0,0,0,3,3,3,42,634,633,632,1,0,0,0,3,3,3,42,640,641,642,1,0,0,0,9,9,9,42,643,642,641,1,0,0,0,9,9,9,42,650,651,652,1,0,0,0,6,6,6,42,653,652,651,1,0,0,0,6,6,6,42,659,660,661,1,0,0,0,3,3,3,42,662,661,660,1,0,0,0,3,3,3,42,668,669,670,1,0,0,0,9,9,9,42,671,670,669,1,0,0,0,9,9,9,42,678,679,680,1,0,0,0,6,6,8,42,681,680,679,1,0,0,0,6,8,6,42,687,688,689,1,0,0,0,3,3,3,42,690,689,688,1,0,0,0,3,3,3,42,696,697,698,1,0,0,0,9,9,9,42,699,698,697,1,0,0,0,9,9,9,42,706,707,708,1,0,0,0,6,6,6,42,709,708,707,1,0,0,0,6,6,6,42,715,716,717,1,0,0,0,3,3,3,42,718,717,716,1,0,0,0,3,3,3,42,724,725,726,1,0,0,0,9,9,9,42,727,726,725,1,0,0,0,9,9,9,42,734,735,736,1,0,0,0,6,6,6,42,737,736,735,1,0,0,0,6,6,6,42,743,744,745,1,0,0,0,3,3,3,42,746,745,744,1,0,0,0,3,3,3,42,752,753,754,1,0,0,0,7,7,7,42,755,754,753,1,0,0,0,7,7,7,42,760,761,762,1,0,0,0,7,7,7,42,763,762,761,1,0,0,0,7,7,7,42,768,769,770,1,0,0,0,7,7,7,42,771,770,769,1,0,0,0,7,7,7,42,776,777,778,1,0,0,0,7,7,7,42,779,778,777,1,0,0,0,7,7,7,42,784,785,786,1,0,0,0,7,7,7,42,787,786,785,1,0,0,0,7,7,7],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 498,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 788,
                    "normals": 32,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "group_0Geometry",
                "vertices": [0.301612,0,0,0.285864,-0.015748,-0,0.033034,0,0,0.301612,-0.068129,0,0.285864,-0.074652,-0,0.318898,-0.085415,0,0.30315,-0.091938,0,0.318898,-0.153543,0,0.30315,-0.137795,0,0.031496,-0.137795,0,0.048782,-0.015748,0,0.033034,-0.068129,0,0.048782,-0.074652,0,0.015748,-0.085415,0,0.031496,-0.091938,0,0.015748,-0.153543,0,0.318898,-0.153543,0,0.031496,-0.137795,0,0.015748,-0.153543,0,0.031496,-0.091938,0,0.015748,-0.085415,0,0.048782,-0.074652,0,0.033034,-0.068129,0,0.048782,-0.015748,0,0.285864,-0.015748,-0,0.033034,0,0,0.30315,-0.137795,0,0.30315,-0.091938,0,0.318898,-0.085415,0,0.285864,-0.074652,-0,0.301612,-0.068129,0,0.301612,0,0,0.301612,-0.068129,0,0.318898,-0.085415,0,0.318898,-0.153543,0,0.015748,-0.153543,0,0.015748,-0.085415,0,0.033034,-0.068129,0,0.033034,0,0,0.301612,0,0,0.30315,-0.137795,0,0.031496,-0.137795,0,0.30315,-0.091938,0,0.285864,-0.074652,-0,0.285864,-0.015748,-0,0.048782,-0.015748,0,0.048782,-0.074652,0,0.031496,-0.091938,0,0.301612,-0.068129,0.060103,0.318898,-0.085415,0,0.301612,-0.068129,0,0.318898,-0.085415,0.060103,0.318898,-0.085415,0.060103,0.301612,-0.068129,0.060103,0.318898,-0.085415,0,0.301612,-0.068129,0,0.301612,-0.068129,0.060103,0.318898,-0.085415,0.060103,0.318898,0,0.362205,0.318898,-0.031496,0.330709,0.318898,-0,0.330709,0.318898,-0.015748,0.362205,0.318898,-0.085415,0.060103,0.318898,0,0.060103,0.318898,-0.078264,0.283465,0.318898,-0.078264,0.330709,0.318898,-0.153543,0,0.318898,-0.085415,0,0.318898,-0.153543,0.330709,0.318898,-0.125031,0.283465,0.318898,-0.125031,0.330709,0.318898,-0.125031,0.330709,0.318898,-0.125031,0.283465,0.318898,-0.153543,0.330709,0.318898,-0.078264,0.283465,0.318898,-0.085415,0.060103,0.318898,-0.153543,0,0.318898,-0.085415,0,0.318898,-0.031496,0.330709,0.318898,-0,0.330709,0.318898,-0.078264,0.330709,0.318898,0,0.060103,0.318898,-0.015748,0.362205,0.318898,0,0.362205,0.318898,0,0.060103,0.318898,-0,0.330709,0.318898,0,0.362205,0.318898,-0.015748,0.362205,0.318898,-0.031496,0.330709,0.318898,-0.078264,0.330709,0.318898,-0.078264,0.283465,0.318898,-0.125031,0.283465,0.318898,-0.125031,0.330709,0.318898,-0.153543,0.330709,0.083661,-0.153543,0.049213,0.061516,-0.153543,0.15748,0.061516,-0.153543,0.049213,0.061516,-0.153543,0.165354,0.083661,-0.153543,0.15748,0.250984,-0.153543,0.049213,0.250984,-0.153543,0.165354,0.250984,-0.153543,0.15748,0.27313,-0.153543,0.049213,0.27313,-0.153543,0.15748,0.015748,-0.153543,0,0.053642,-0.153543,0.041339,0.015748,-0.153543,0.330709,0.318898,-0.153543,0,0.091535,-0.153543,0.041339,0.129429,-0.153543,0.041339,0.091535,-0.153543,0.165354,0.145177,-0.153543,0.041339,0.189469,-0.153543,0.041339,0.145177,-0.153543,0.190945,0.205216,-0.153543,0.041339,0.24311,-0.153543,0.041339,0.205216,-0.153543,0.206693,0.281004,-0.153543,0.041339,0.281004,-0.153543,0.165354,0.053642,-0.153543,0.165354,0.318898,-0.153543,0.330709,0.129429,-0.153543,0.206693,0.083661,-0.153543,0.165354,0.24311,-0.153543,0.165354,0.27313,-0.153543,0.165354,0.189469,-0.153543,0.190945,0.189469,-0.153543,0.057087,0.189469,-0.153543,0.057087,0.189469,-0.153543,0.041339,0.189469,-0.153543,0.190945,0.145177,-0.153543,0.190945,0.318898,-0.153543,0,0.281004,-0.153543,0.165354,0.318898,-0.153543,0.330709,0.27313,-0.153543,0.165354,0.27313,-0.153543,0.15748,0.250984,-0.153543,0.165354,0.24311,-0.153543,0.165354,0.24311,-0.153543,0.041339,0.205216,-0.153543,0.206693,0.129429,-0.153543,0.206693,0.129429,-0.153543,0.041339,0.091535,-0.153543,0.165354,0.083661,-0.153543,0.165354,0.083661,-0.153543,0.15748,0.061516,-0.153543,0.165354,0.053642,-0.153543,0.165354,0.053642,-0.153543,0.041339,0.015748,-0.153543,0.330709,0.281004,-0.153543,0.041339,0.205216,-0.153543,0.041339,0.145177,-0.153543,0.041339,0.091535,-0.153543,0.041339,0.015748,-0.153543,0,0.27313,-0.153543,0.049213,0.250984,-0.153543,0.049213,0.250984,-0.153543,0.15748,0.083661,-0.153543,0.049213,0.061516,-0.153543,0.15748,0.061516,-0.153543,0.049213,0.015748,-0.153543,0.330709,0.053642,-0.153543,0.165354,0.061516,-0.153543,0.165354,0.061516,-0.153543,0.15748,0.061516,-0.153543,0.049213,0.083661,-0.153543,0.049213,0.083661,-0.153543,0.15748,0.083661,-0.153543,0.165354,0.091535,-0.153543,0.165354,0.091535,-0.153543,0.041339,0.053642,-0.153543,0.041339,0.189469,-0.153543,0.041339,0.205216,-0.153543,0.041339,0.189469,-0.153543,0.057087,0.189469,-0.153543,0.190945,0.145177,-0.153543,0.190945,0.145177,-0.153543,0.041339,0.129429,-0.153543,0.041339,0.129429,-0.153543,0.206693,0.205216,-0.153543,0.206693,0.24311,-0.153543,0.165354,0.250984,-0.153543,0.165354,0.250984,-0.153543,0.15748,0.250984,-0.153543,0.049213,0.27313,-0.153543,0.049213,0.27313,-0.153543,0.15748,0.27313,-0.153543,0.165354,0.281004,-0.153543,0.165354,0.281004,-0.153543,0.041339,0.24311,-0.153543,0.041339,0.015748,-0.153543,0.330709,0.015748,-0.085415,0,0.015748,-0.153543,0,0.015748,-0.085415,0.060103,0.015748,0,0.060103,0.015748,-0.125031,0.283465,0.015748,-0.125031,0.330709,0.015748,-0.078264,0.283465,0.015748,-0,0.330709,0.015748,-0.078264,0.330709,0.015748,-0.031496,0.330709,0.015748,-0.015748,0.362205,0.015748,0,0.362205,0.015748,0,0.362205,0.015748,-0.015748,0.362205,0.015748,-0,0.330709,0.015748,-0.031496,0.330709,0.015748,-0.078264,0.330709,0.015748,-0.078264,0.283465,0.015748,-0.125031,0.283465,0.015748,0,0.060103,0.015748,-0.125031,0.330709,0.015748,-0.153543,0.330709,0.015748,-0.085415,0.060103,0.015748,-0.085415,0,0.015748,-0.153543,0,0.015748,-0.031496,0.330709,0.015748,-0.078264,0.330709,0.015748,-0.015748,0.362205,0.015748,0,0.362205,0.015748,-0,0.330709,0.015748,0,0.060103,0.015748,-0.085415,0.060103,0.015748,-0.125031,0.330709,0.015748,-0.125031,0.283465,0.015748,-0.078264,0.283465,0.033034,-0.068129,0.060103,0.015748,-0.085415,0,0.015748,-0.085415,0.060103,0.033034,-0.068129,0,0.033034,-0.068129,0,0.033034,-0.068129,0.060103,0.015748,-0.085415,0,0.015748,-0.085415,0.060103,0.033034,-0.068129,0.060103,0.033034,-0.068129,0.060103,0.033034,0,0,0.033034,-0.068129,0,0.033034,0,0.060103,0.033034,0,0.060103,0.033034,-0.068129,0.060103,0.033034,0,0,0.033034,-0.068129,0,0.033034,0,0.060103,0.031496,-0,0.330709,0.015748,0,0.060103,0.015748,-0,0.330709,0.031496,-0,0.318898,0.033034,0,0.060103,0.087602,-0,0.318898,0.318898,-0,0.330709,0.30315,-0,0.318898,0.30315,-0,0.330709,0.301612,0,0.060103,0.244641,-0,0.318898,0.318898,0,0.060103,0.301612,0,0,0.033034,0,0,0.107287,-0,0.318898,0.125738,-0,0.318898,0.145423,-0,0.318898,0.15748,-0,0.318898,0.177165,-0,0.318898,0.19108,-0,0.318898,0.210765,-0,0.318898,0.224956,-0,0.318898,0.301612,0,0.060103,0.244641,-0,0.318898,0.301612,0,0,0.224956,-0,0.318898,0.210765,-0,0.318898,0.19108,-0,0.318898,0.177165,-0,0.318898,0.15748,-0,0.318898,0.145423,-0,0.318898,0.125738,-0,0.318898,0.107287,-0,0.318898,0.087602,-0,0.318898,0.033034,0,0.060103,0.033034,0,0,0.318898,-0,0.330709,0.30315,-0,0.318898,0.318898,0,0.060103,0.30315,-0,0.330709,0.031496,-0,0.318898,0.015748,0,0.060103,0.031496,-0,0.330709,0.015748,-0,0.330709,0.301612,0,0.060103,0.031496,-0,0.330709,0.031496,-0,0.318898,0.087602,-0,0.318898,0.107287,-0,0.318898,0.125738,-0,0.318898,0.145423,-0,0.318898,0.15748,-0,0.318898,0.177165,-0,0.318898,0.19108,-0,0.318898,0.210765,-0,0.318898,0.224956,-0,0.318898,0.244641,-0,0.318898,0.30315,-0,0.318898,0.30315,-0,0.330709,0.301612,0,0.060103,0.301612,-0.068129,0,0.301612,0,0,0.301612,-0.068129,0.060103,0.301612,-0.068129,0.060103,0.301612,0,0.060103,0.301612,-0.068129,0,0.301612,0,0,0.318898,-0.085415,0.060103,0.301612,0,0.060103,0.318898,0,0.060103,0.301612,-0.068129,0.060103,0.301612,-0.068129,0.060103,0.318898,-0.085415,0.060103,0.301612,0,0.060103,0.318898,0,0.060103,0.30315,-0.015748,0.362205,0.318898,0,0.362205,0.30315,0,0.362205,0.318898,-0.015748,0.362205,0.318898,-0.015748,0.362205,0.30315,-0.015748,0.362205,0.318898,0,0.362205,0.30315,0,0.362205,0.30315,0,0.362205,0.30315,-0.015748,0.362205,0.318898,-0.031496,0.330709,0.30315,-0.023622,0.346457,0.30315,-0.031496,0.330709,0.30315,-0.015748,0.362205,0.318898,-0.015748,0.362205,0.318898,-0.015748,0.362205,0.318898,-0.031496,0.330709,0.30315,-0.015748,0.362205,0.30315,-0.023622,0.346457,0.30315,-0.031496,0.330709,0.30315,-0.023622,0.346457,0.30315,-0.031496,0.330709,0.015748,-0.078264,0.330709,0.031496,-0.031496,0.330709,0.015748,-0.031496,0.330709,0.031496,-0.137795,0.330709,0.015748,-0.125031,0.330709,0.015748,-0.153543,0.330709,0.24311,-0.13781,0.330709,0.266732,-0.13781,0.330709,0.30315,-0.137795,0.330709,0.318898,-0.031496,0.330709,0.30315,-0.031496,0.330709,0.318898,-0.078264,0.330709,0.318898,-0.125031,0.330709,0.318898,-0.153543,0.330709,0.015748,-0.153543,0.330709,0.266732,-0.13781,0.330709,0.318898,-0.153543,0.330709,0.30315,-0.137795,0.330709,0.318898,-0.125031,0.330709,0.318898,-0.078264,0.330709,0.318898,-0.031496,0.330709,0.30315,-0.031496,0.330709,0.24311,-0.13781,0.330709,0.031496,-0.137795,0.330709,0.015748,-0.125031,0.330709,0.015748,-0.078264,0.330709,0.031496,-0.031496,0.330709,0.015748,-0.031496,0.330709,0.30315,-0.137795,0.330709,0.266732,-0.13781,0.330709,0.24311,-0.13781,0.330709,0.031496,-0.137795,0.330709,0.031496,-0.031496,0.330709,0,-0.078264,0.362205,0.015748,-0.078264,0.346457,0,-0.078264,0.283465,0.334646,-0.078264,0.362205,0.031496,-0.078264,0.346457,0.30315,-0.078264,0.346457,0.318898,-0.078264,0.346457,0.318898,-0.078264,0.283465,0.334646,-0.078264,0.283465,0.318898,-0.078264,0.330709,0.015748,-0.078264,0.330709,0.015748,-0.078264,0.283465,0.015748,-0.078264,0.346457,0,-0.078264,0.283465,0.015748,-0.078264,0.330709,0.015748,-0.078264,0.283465,0.318898,-0.078264,0.346457,0.318898,-0.078264,0.330709,0.318898,-0.078264,0.283465,0.334646,-0.078264,0.283465,0.334646,-0.078264,0.362205,0.30315,-0.078264,0.346457,0.031496,-0.078264,0.346457,0,-0.078264,0.362205,0.30315,-0.078264,0.346457,0.031496,-0.078264,0.346457,0.015748,-0.078264,0.346457,0,-0.078264,0.283465,0,-0.078264,0.362205,0.334646,-0.078264,0.362205,0.334646,-0.078264,0.283465,0.318898,-0.078264,0.346457,0.334646,-0.125031,0.283465,0.318898,-0.078264,0.283465,0.334646,-0.078264,0.283465,0.318898,-0.125031,0.283465,0.318898,-0.125031,0.283465,0.334646,-0.125031,0.283465,0.318898,-0.078264,0.283465,0.334646,-0.078264,0.283465,0.334646,-0.125031,0.283465,0.015748,-0.125031,0.283465,0.015748,-0.125031,0.330709,0,-0.125031,0.283465,0.318898,-0.125031,0.283465,0.318898,-0.125031,0.346457,0.318898,-0.125031,0.330709,0,-0.125031,0.362205,0.015748,-0.125031,0.346457,0.334646,-0.125031,0.362205,0.031496,-0.125031,0.346457,0.30315,-0.125031,0.346457,0.334646,-0.125031,0.283465,0.334646,-0.125031,0.283465,0.318898,-0.125031,0.283465,0.334646,-0.125031,0.362205,0.318898,-0.125031,0.346457,0.30315,-0.125031,0.346457,0.031496,-0.125031,0.346457,0.015748,-0.125031,0.346457,0.015748,-0.125031,0.330709,0,-0.125031,0.283465,0,-0.125031,0.362205,0.318898,-0.125031,0.330709,0.015748,-0.125031,0.283465,0,-0.125031,0.362205,0,-0.125031,0.283465,0.015748,-0.125031,0.346457,0.031496,-0.125031,0.346457,0.30315,-0.125031,0.346457,0.318898,-0.125031,0.346457,0.334646,-0.125031,0.362205,0.033034,-0.068129,0.060103,0.015748,0,0.060103,0.033034,0,0.060103,0.015748,-0.085415,0.060103,0.015748,-0.085415,0.060103,0.033034,-0.068129,0.060103,0.015748,0,0.060103,0.033034,0,0.060103,0.015748,-0.125031,0.283465,0,-0.078264,0.283465,0.015748,-0.078264,0.283465,0,-0.125031,0.283465,0,-0.125031,0.283465,0.015748,-0.125031,0.283465,0,-0.078264,0.283465,0.015748,-0.078264,0.283465,0.031496,0,0.362205,0.031496,-0.031496,0.330709,0.031496,-0,0.330709,0.031496,-0.015748,0.362205,0.031496,-0.137795,0.318898,0.031496,-0,0.318898,0.031496,-0.137795,0.330709,0.031496,-0.031496,0.330709,0.031496,-0,0.330709,0.031496,-0.137795,0.330709,0.031496,-0.137795,0.318898,0.031496,-0,0.318898,0.031496,-0.015748,0.362205,0.031496,0,0.362205,0.031496,-0.015748,0.362205,0.031496,-0.137795,0.318898,0.031496,0,0.362205,0.031496,-0.137795,0.318898,0.087602,-0,0.318898,0.031496,-0,0.318898,0.087602,-0.003937,0.318898,0.107287,-0.003937,0.318898,0.125738,-0.003937,0.318898,0.145423,-0.003937,0.318898,0.15748,-0.003937,0.318898,0.177165,-0.003937,0.318898,0.19108,-0.003937,0.318898,0.210765,-0.003937,0.318898,0.224956,-0.003937,0.318898,0.244641,-0.003937,0.318898,0.30315,-0,0.318898,0.244641,-0,0.318898,0.30315,-0.137795,0.318898,0.24311,-0.13781,0.318898,0.266732,-0.13781,0.318898,0.224956,-0,0.318898,0.210765,-0,0.318898,0.19108,-0,0.318898,0.177165,-0,0.318898,0.15748,-0,0.318898,0.145423,-0,0.318898,0.125738,-0,0.318898,0.107287,-0,0.318898,0.125738,-0.003937,0.318898,0.107287,-0.003937,0.318898,0.125738,-0,0.318898,0.107287,-0,0.318898,0.15748,-0.003937,0.318898,0.145423,-0.003937,0.318898,0.15748,-0,0.318898,0.145423,-0,0.318898,0.19108,-0.003937,0.318898,0.177165,-0.003937,0.318898,0.19108,-0,0.318898,0.177165,-0,0.318898,0.224956,-0.003937,0.318898,0.210765,-0.003937,0.318898,0.224956,-0,0.318898,0.210765,-0,0.318898,0.266732,-0.13781,0.318898,0.24311,-0.13781,0.318898,0.30315,-0.137795,0.318898,0.031496,-0.137795,0.318898,0.244641,-0.003937,0.318898,0.30315,-0,0.318898,0.244641,-0,0.318898,0.087602,-0.003937,0.318898,0.087602,-0,0.318898,0.031496,-0,0.318898,0.244641,-0.003937,0.318898,0.224956,-0.003937,0.318898,0.210765,-0.003937,0.318898,0.19108,-0.003937,0.318898,0.177165,-0.003937,0.318898,0.15748,-0.003937,0.318898,0.145423,-0.003937,0.318898,0.125738,-0.003937,0.318898,0.107287,-0.003937,0.318898,0.087602,-0.003937,0.318898,0.24311,-0.13781,0.318898,0.266732,-0.13781,0.318898,0.30315,-0.137795,0.318898,0.30315,-0.137795,0.330709,0.30315,-0,0.318898,0.30315,-0.137795,0.318898,0.30315,-0,0.330709,0.30315,-0.031496,0.330709,0.30315,-0.023622,0.346457,0.30315,0,0.362205,0.30315,-0.015748,0.362205,0.30315,-0.015748,0.362205,0.30315,-0.023622,0.346457,0.30315,0,0.362205,0.30315,-0,0.330709,0.30315,-0.031496,0.330709,0.30315,-0.137795,0.330709,0.30315,-0,0.318898,0.30315,-0.137795,0.318898,0.30315,-0.137795,0.330709,0.266732,-0.13781,0.318898,0.266732,-0.13781,0.330709,0.30315,-0.137795,0.318898,0.30315,-0.137795,0.318898,0.30315,-0.137795,0.330709,0.266732,-0.13781,0.318898,0.266732,-0.13781,0.330709,0.266732,-0.13781,0.330709,0.24311,-0.13781,0.318898,0.24311,-0.13781,0.330709,0.266732,-0.13781,0.318898,0.266732,-0.13781,0.318898,0.266732,-0.13781,0.330709,0.24311,-0.13781,0.318898,0.24311,-0.13781,0.330709,0.24311,-0.13781,0.330709,0.031496,-0.137795,0.318898,0.031496,-0.137795,0.330709,0.24311,-0.13781,0.318898,0.24311,-0.13781,0.318898,0.24311,-0.13781,0.330709,0.031496,-0.137795,0.318898,0.031496,-0.137795,0.330709,0.30315,-0.125031,0.346457,0.031496,-0.078264,0.346457,0.30315,-0.078264,0.346457,0.031496,-0.125031,0.346457,0.031496,-0.125031,0.346457,0.30315,-0.125031,0.346457,0.031496,-0.078264,0.346457,0.30315,-0.078264,0.346457,0,-0.125031,0.362205,0,-0.078264,0.283465,0,-0.125031,0.283465,0,-0.078264,0.362205,0,-0.078264,0.362205,0,-0.125031,0.362205,0,-0.078264,0.283465,0,-0.125031,0.283465,0.334646,-0.078264,0.362205,0.334646,-0.125031,0.283465,0.334646,-0.078264,0.283465,0.334646,-0.125031,0.362205,0.334646,-0.125031,0.362205,0.334646,-0.078264,0.362205,0.334646,-0.125031,0.283465,0.334646,-0.078264,0.283465,0.087602,0,0.401575,0.087602,-0.003937,0.318898,0.087602,-0,0.318898,0.087602,-0.003937,0.401575,0.087602,-0.003937,0.401575,0.087602,0,0.401575,0.087602,-0.003937,0.318898,0.087602,-0,0.318898,0.087602,0,0.401575,0.087602,-0.003937,0.401575,0.107287,-0.003937,0.401575,0.087602,-0.003937,0.318898,0.087602,-0.003937,0.401575,0.107287,-0.003937,0.318898,0.107287,-0.003937,0.318898,0.107287,-0.003937,0.401575,0.087602,-0.003937,0.318898,0.087602,-0.003937,0.401575,0.107287,-0.003937,0.401575,0.107287,-0.003937,0.401575,0.107287,-0,0.318898,0.107287,-0.003937,0.318898,0.107287,0,0.401575,0.107287,0,0.401575,0.107287,-0.003937,0.401575,0.107287,-0,0.318898,0.107287,-0.003937,0.318898,0.107287,0,0.401575,0.125738,0,0.401575,0.125738,-0.003937,0.318898,0.125738,-0,0.318898,0.125738,-0.003937,0.401575,0.125738,-0.003937,0.401575,0.125738,0,0.401575,0.125738,-0.003937,0.318898,0.125738,-0,0.318898,0.125738,0,0.401575,0.125738,-0.003937,0.401575,0.145423,-0.003937,0.401575,0.125738,-0.003937,0.318898,0.125738,-0.003937,0.401575,0.145423,-0.003937,0.318898,0.145423,-0.003937,0.318898,0.145423,-0.003937,0.401575,0.125738,-0.003937,0.318898,0.125738,-0.003937,0.401575,0.145423,-0.003937,0.401575,0.145423,-0.003937,0.401575,0.145423,-0,0.318898,0.145423,-0.003937,0.318898,0.145423,0,0.401575,0.145423,0,0.401575,0.145423,-0.003937,0.401575,0.145423,-0,0.318898,0.145423,-0.003937,0.318898,0.145423,0,0.401575,0.15748,0,0.401575,0.15748,-0.003937,0.318898,0.15748,-0,0.318898,0.15748,-0.003937,0.401575,0.15748,-0.003937,0.401575,0.15748,0,0.401575,0.15748,-0.003937,0.318898,0.15748,-0,0.318898,0.15748,0,0.401575,0.15748,-0.003937,0.401575,0.177165,-0.003937,0.401575,0.15748,-0.003937,0.318898,0.15748,-0.003937,0.401575,0.177165,-0.003937,0.318898,0.177165,-0.003937,0.318898,0.177165,-0.003937,0.401575,0.15748,-0.003937,0.318898,0.15748,-0.003937,0.401575,0.177165,-0.003937,0.401575,0.177165,-0.003937,0.401575,0.177165,-0,0.318898,0.177165,-0.003937,0.318898,0.177165,0,0.401575,0.177165,0,0.401575,0.177165,-0.003937,0.401575,0.177165,-0,0.318898,0.177165,-0.003937,0.318898,0.177165,0,0.401575,0.19108,0,0.401575,0.19108,-0.003937,0.318898,0.19108,-0,0.318898,0.19108,-0.003937,0.401575,0.19108,-0.003937,0.401575,0.19108,0,0.401575,0.19108,-0.003937,0.318898,0.19108,-0,0.318898,0.19108,0,0.401575,0.19108,-0.003937,0.401575,0.210765,-0.003937,0.401575,0.19108,-0.003937,0.318898,0.19108,-0.003937,0.401575,0.210765,-0.003937,0.318898,0.210765,-0.003937,0.318898,0.210765,-0.003937,0.401575,0.19108,-0.003937,0.318898,0.19108,-0.003937,0.401575,0.210765,-0.003937,0.401575,0.210765,-0.003937,0.401575,0.210765,-0,0.318898,0.210765,-0.003937,0.318898,0.210765,0,0.401575,0.210765,0,0.401575,0.210765,-0.003937,0.401575,0.210765,-0,0.318898,0.210765,-0.003937,0.318898,0.210765,0,0.401575,0.224956,0,0.401575,0.224956,-0.003937,0.318898,0.224956,-0,0.318898,0.224956,-0.003937,0.401575,0.224956,-0.003937,0.401575,0.224956,0,0.401575,0.224956,-0.003937,0.318898,0.224956,-0,0.318898,0.224956,0,0.401575,0.224956,-0.003937,0.401575,0.244641,-0.003937,0.401575,0.224956,-0.003937,0.318898,0.224956,-0.003937,0.401575,0.244641,-0.003937,0.318898,0.244641,-0.003937,0.318898,0.244641,-0.003937,0.401575,0.224956,-0.003937,0.318898,0.224956,-0.003937,0.401575,0.244641,-0.003937,0.401575,0.244641,-0.003937,0.401575,0.244641,-0,0.318898,0.244641,-0.003937,0.318898,0.244641,0,0.401575,0.244641,0,0.401575,0.244641,-0.003937,0.401575,0.244641,-0,0.318898,0.244641,-0.003937,0.318898,0.244641,0,0.401575,0.107287,-0.003937,0.401575,0.087602,0,0.401575,0.107287,0,0.401575,0.087602,-0.003937,0.401575,0.087602,-0.003937,0.401575,0.107287,-0.003937,0.401575,0.087602,0,0.401575,0.107287,0,0.401575,0.145423,-0.003937,0.401575,0.125738,0,0.401575,0.145423,0,0.401575,0.125738,-0.003937,0.401575,0.125738,-0.003937,0.401575,0.145423,-0.003937,0.401575,0.125738,0,0.401575,0.145423,0,0.401575,0.177165,-0.003937,0.401575,0.15748,0,0.401575,0.177165,0,0.401575,0.15748,-0.003937,0.401575,0.15748,-0.003937,0.401575,0.177165,-0.003937,0.401575,0.15748,0,0.401575,0.177165,0,0.401575,0.210765,-0.003937,0.401575,0.19108,0,0.401575,0.210765,0,0.401575,0.19108,-0.003937,0.401575,0.19108,-0.003937,0.401575,0.210765,-0.003937,0.401575,0.19108,0,0.401575,0.210765,0,0.401575,0.244641,-0.003937,0.401575,0.224956,0,0.401575,0.244641,0,0.401575,0.224956,-0.003937,0.401575,0.224956,-0.003937,0.401575,0.244641,-0.003937,0.401575,0.224956,0,0.401575,0.244641,0,0.401575],
                "uvs": [[0.075403,0,0.071466,0.003937,0.008258,0,0.075403,0.017032,0.071466,0.018663,0.079724,0.021354,0.075787,0.022984,0.079724,0.038386,0.075787,0.034449,0.007874,0.034449,0.012195,0.003937,0.008258,0.017032,0.012195,0.018663,0.003937,0.021354,0.007874,0.022984,0.003937,0.038386,0.015026,0.065362,-0,0.071473,-0,0.065362,0.015026,0.071473,0.090551,0,0.082677,0.007874,0.082677,0,0.090551,0.003937,0.015026,0.021354,0.015026,0,0.070866,0.019566,0.082677,0.019566,0,0.038386,0,0.021354,0.082677,0.038386,0.070866,0.031258,0.082677,0.031258,0.020915,0.012303,0.015379,0.03937,0.015379,0.012303,0.015379,0.041339,0.020915,0.03937,0.062746,0.012303,0.062746,0.041339,0.062746,0.03937,0.068282,0.012303,0.068282,0.03937,0.003937,0,0.01341,0.010335,0.003937,0.082677,0.079724,0,0.022884,0.010335,0.032357,0.010335,0.022884,0.041339,0.036294,0.010335,0.047367,0.010335,0.036294,0.047736,0.051304,0.010335,0.060778,0.010335,0.051304,0.051673,0.070251,0.010335,0.070251,0.041339,0.01341,0.041339,0.079724,0.082677,0.032357,0.051673,0.020915,0.041339,0.060778,0.041339,0.068282,0.041339,0.047367,0.047736,0.047367,0.014272,-0.082677,0.038386,0,0.021354,0,0.038386,-0.015026,0.021354,-0.015026,0,-0.070866,0.031258,-0.082677,0.031258,-0.070866,0.019566,-0.082677,0,-0.082677,0.019566,-0.082677,0.007874,-0.090551,0.003937,-0.090551,0,-0.015026,0.006204,-0,0.012315,-0.015026,0.012315,-0,0.006204,-0.015026,0.017032,-0,0,-0,0.017032,-0.007874,0.082677,-0.003937,0.015026,-0.003937,0.082677,-0.007874,0.079724,-0.008258,0.015026,-0.021901,0.079724,-0.079724,0.082677,-0.075787,0.079724,-0.075787,0.082677,-0.075403,0.015026,-0.06116,0.079724,-0.079724,0.015026,-0.075403,0,-0.008258,0,-0.026822,0.079724,-0.031435,0.079724,-0.036356,0.079724,-0.03937,0.079724,-0.044291,0.079724,-0.04777,0.079724,-0.052691,0.079724,-0.056239,0.079724,0,0.017032,0,0,0.015026,0.017032,-0.075787,0.003937,-0.079724,0,-0.075787,0,-0.079724,0.003937,-0.079724,-0.070427,-0.075787,-0.074829,-0.075787,-0.070427,-0.075787,-0.079231,-0.079724,-0.079231,-0.003937,0.019566,-0.007874,0.007874,-0.003937,0.007874,-0.007874,0.034449,-0.003937,0.031258,-0.003937,0.038386,-0.060778,0.034453,-0.066683,0.034453,-0.075787,0.034449,-0.079724,0.007874,-0.075787,0.007874,-0.079724,0.019566,-0.079724,0.031258,-0.079724,0.038386,-0,0.090552,-0.003937,0.086615,-0,0.070866,-0.083661,0.090552,-0.007874,0.086615,-0.075787,0.086615,-0.079724,0.086615,-0.079724,0.070866,-0.083661,0.070866,-0.079724,0.082678,-0.003937,0.082678,-0.003937,0.070866,0.083661,0.031258,0.079724,0.019566,0.083661,0.019566,0.079724,0.031258,0.003937,0.070866,0,0.070866,0.079724,0.070866,0.079724,0.086614,0,0.090551,0.003937,0.086614,0.083661,0.090551,0.007874,0.086614,0.075787,0.086614,0.083661,0.070866,0.003937,0.031258,0,0.019566,0.003937,0.019566,0,0.031258,0.090551,-0,0.082677,0,0.079724,0.034449,0.079724,0,0.082677,0.034449,-0.021901,0,-0.007874,0,-0.021901,0.000984,-0.026822,0.000984,-0.031435,0.000984,-0.036356,0.000984,-0.03937,0.000984,-0.044291,0.000984,-0.04777,0.000984,-0.052691,0.000984,-0.056239,0.000984,-0.06116,0.000984,-0.075787,0,-0.06116,0,-0.056239,0,-0.052691,0,-0.04777,0,-0.044291,0,-0.03937,0,-0.036356,0,-0.031435,0,-0.026822,0,-0.082677,0.034449,-0.079724,0,-0.079724,0.034449,-0.082677,0,-0.086614,0.005906,-0.075773,0.082677,-0.066669,0.079724,-0.066669,0.082677,-0.075773,0.079724,-0.066683,0.082677,-0.060778,0.079724,-0.060778,0.082677,-0.066683,0.079724,-0.06078,0.082677,-0.007877,0.079724,-0.007877,0.082677,-0.06078,0.079724,0.075787,0.031258,0.007874,0.019566,0.075787,0.019566,0.007874,0.031258,-0.090551,0.031258,-0.090551,0.019566,0.090551,0.019566,0.090551,0.031258,0.100394,0,0.079724,0.000984,0.079724,0,0.100394,0.000984,-0.026822,0.100394,-0.021901,0.100394,-0.100394,0.000984,-0.079724,0,-0.079724,0.000984,-0.100394,0,-0.036356,0.100394,-0.031435,0.100394,-0.044291,0.100394,-0.03937,0.100394,-0.052691,0.100394,-0.04777,0.100394,-0.06116,0.100394,-0.056239,0.100394,0.026822,0.000984,0.021901,0,0.026822,0,0.021901,0.000984,0.036356,0.000984,0.031435,0,0.036356,0,0.031435,0.000984,0.044291,0.000984,0.03937,0,0.044291,0,0.03937,0.000984,0.052691,0.000984,0.04777,0,0.052691,0,0.04777,0.000984,0.06116,0.000984,0.056239,0,0.06116,0,0.056239,0.000984]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Corrogated_Shiny_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Corrogated_Shiny_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.666667,0.690196,0.8],
                "DbgColor": 15597568,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.666667,0.690196,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "4471B9EF-3A18-3BDC-B738-2490AC004F13"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.009Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.008",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "120C2C67-FBEE-327C-9E1F-0C67B2F38C52"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.019Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.018",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "FFA6F583-CF2B-3DEF-A493-FA262156A2DB"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.002Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.001",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "6950AF9B-3670-397C-9661-A803DB45AEC6"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0,-0.999969,0,0,-1,1,0,0,-1,0,0,0,0,0.999969,0,0,1],
                "faces": [42,0,1,2,0,0,1,2,0,1,1,42,1,0,3,0,3,2,1,1,0,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,7,6,5,2,2,2,42,22,23,24,0,8,9,10,3,3,3,42,23,22,25,0,11,10,9,3,3,3,42,32,33,34,0,12,13,14,4,5,5,42,33,32,35,0,15,14,13,5,4,5,42,4,5,6,1,0,0,0,5,4,5,42,7,6,5,1,0,0,0,5,5,4,42,16,17,18,1,0,0,0,3,3,3,42,19,18,17,1,0,0,0,3,3,3,42,26,27,28,1,0,0,0,2,2,2,42,29,28,27,1,0,0,0,2,2,2,42,36,37,38,1,0,0,0,1,0,1,42,39,38,37,1,0,0,0,1,1,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 16,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 40,
                    "normals": 6,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID674Geometry",
                "vertices": [0.602337,-0.406693,0.313159,0.359632,-0.356693,0.313159,0.602337,-0.356693,0.313159,0.359632,-0.406693,0.313159,0.359632,-0.406693,0.313159,0.602337,-0.406693,0.313159,0.359632,-0.356693,0.313159,0.602337,-0.356693,0.313159,0.602337,-0.356693,0.313159,0.359632,-0.356693,0.313159,0.602337,-0.406693,0.313159,0.359632,-0.406693,0.313159,0.602337,-0.356693,0.313159,0.602337,-0.406693,0.463159,0.602337,-0.406693,0.313159,0.602337,-0.356693,0.463159,0.602337,-0.356693,0.463159,0.602337,-0.356693,0.313159,0.602337,-0.406693,0.463159,0.602337,-0.406693,0.313159,0.602337,-0.356693,0.463159,0.602337,-0.406693,0.463159,0.359632,-0.406693,0.463159,0.359632,-0.356693,0.313159,0.359632,-0.406693,0.313159,0.359632,-0.356693,0.463159,0.359632,-0.356693,0.463159,0.359632,-0.406693,0.463159,0.359632,-0.356693,0.313159,0.359632,-0.406693,0.313159,0.359632,-0.356693,0.463159,0.359632,-0.406693,0.463159,0.359632,-0.406693,0.463159,0.602337,-0.356693,0.463159,0.359632,-0.356693,0.463159,0.602337,-0.406693,0.463159,0.602337,-0.406693,0.463159,0.359632,-0.406693,0.463159,0.602337,-0.356693,0.463159,0.359632,-0.356693,0.463159],
                "uvs": [[23.4766,0.029412,23.8091,0.029412,23.4766,-0,23.8091,-0,40.1896,0,39.9841,0,40.1896,0.029412,39.9841,0.029412,-40.1896,0,-40.1896,0.029412,-39.9841,0,-39.9841,0.029412,-23.8091,0.029412,-23.4766,0.029412,-23.8091,0,-23.4766,0]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.133333,0.133333,0.133333],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0136_Charcoal_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.133333,0.133333,0.133333],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "E03F1779-5F75-33B3-A281-71663F5FD063"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [-1,0,0,0,0,0.999969,0,0,1,0,1,0,0,0,-0.999969,0,0,-1,1,0,0,0,-1,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,3,2,1,0,0,0,42,12,13,14,0,4,5,6,1,1,2,42,13,12,15,0,7,6,5,1,1,2,42,22,23,24,0,8,9,10,3,3,3,42,23,22,25,0,11,10,9,3,3,3,42,31,32,33,0,12,13,14,4,4,5,42,32,31,34,0,15,14,13,4,4,5,42,40,41,42,0,16,17,18,6,6,6,42,41,40,43,0,19,18,17,6,6,6,42,4,5,6,1,0,0,0,6,6,6,42,7,6,5,1,0,0,0,6,6,6,42,16,17,18,1,0,0,0,5,4,4,42,19,18,17,1,0,0,0,5,4,4,42,26,27,28,1,0,0,0,7,7,7,42,29,28,27,1,0,0,0,7,7,7,42,35,36,37,1,0,0,0,2,1,1,42,38,37,36,1,0,0,0,2,1,1,42,44,45,46,1,0,0,0,0,0,0,42,47,46,45,1,0,0,0,0,0,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 20,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 48,
                    "normals": 8,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID560Geometry",
                "vertices": [0.24946,-0.306693,0.61482,0.24946,-0.281693,0.53982,0.24946,-0.306693,0.53982,0.24946,-0.281693,0.61482,0.24946,-0.281693,0.61482,0.24946,-0.306693,0.61482,0.24946,-0.281693,0.53982,0.24946,-0.306693,0.53982,0.24946,-0.306693,0.61482,0.24946,-0.306693,0.53982,0.24946,-0.281693,0.61482,0.24946,-0.281693,0.53982,0.24946,-0.306693,0.61482,0.29946,-0.281693,0.61482,0.24946,-0.281693,0.61482,0.29946,-0.306693,0.61482,0.29946,-0.306693,0.61482,0.24946,-0.306693,0.61482,0.29946,-0.281693,0.61482,0.24946,-0.281693,0.61482,0.29946,-0.306693,0.61482,0.29946,-0.281693,0.61482,0.29946,-0.281693,0.61482,0.24946,-0.281693,0.53982,0.24946,-0.281693,0.61482,0.29946,-0.281693,0.53982,0.29946,-0.281693,0.53982,0.29946,-0.281693,0.61482,0.24946,-0.281693,0.53982,0.24946,-0.281693,0.61482,0.29946,-0.281693,0.53982,0.29946,-0.306693,0.53982,0.24946,-0.281693,0.53982,0.29946,-0.281693,0.53982,0.24946,-0.306693,0.53982,0.24946,-0.306693,0.53982,0.29946,-0.306693,0.53982,0.24946,-0.281693,0.53982,0.29946,-0.281693,0.53982,0.29946,-0.306693,0.53982,0.29946,-0.281693,0.53982,0.29946,-0.306693,0.61482,0.29946,-0.306693,0.53982,0.29946,-0.281693,0.61482,0.29946,-0.281693,0.61482,0.29946,-0.281693,0.53982,0.29946,-0.306693,0.61482,0.29946,-0.306693,0.53982],
                "uvs": [[-40.3973,-0.044118,-40.3973,-0.029412,-40.2946,-0.044118,-40.2946,-0.029412,-23.3942,-0.029412,-23.3257,-0.029412,-23.3942,-0.044118,-23.3257,-0.044118,-23.3942,17.3037,-23.3942,17.3478,-23.3257,17.3037,-23.3257,17.3478,23.3257,-0.029412,23.3942,-0.029412,23.3257,-0.044118,23.3942,-0.044118,40.3973,-0.044118,40.2946,-0.044118,40.3973,-0.029412,40.2946,-0.029412]]
            },
            "materials": [{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.466667,0.843137,0.215686],
                "DbgColor": 15597568,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_11",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.466667,0.843137,0.215686],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "8AED80A9-BAC9-38AF-9781-EEB691C96440"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,1,0,0,0.999969,0,0,1,-3.1e-05,0,1,3.1e-05,0,-1,0,0,-0.999969,0,0,-0.999969,-3.1e-05,0,-1,3.1e-05],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,1,3,4,0,1,3,4,0,0,0,42,1,4,5,0,1,4,5,0,0,0,42,1,5,6,0,1,5,6,0,0,0,42,1,6,7,0,1,6,7,0,0,1,42,8,9,10,0,8,9,10,1,0,1,42,9,8,11,0,9,8,11,0,1,0,42,11,8,12,0,11,8,12,0,1,0,42,12,8,13,0,12,8,13,0,1,0,42,13,8,14,0,13,8,14,0,1,0,42,14,8,15,0,14,8,15,0,1,0,42,16,17,18,0,16,17,18,0,1,0,42,17,16,19,0,17,16,19,1,0,0,42,19,16,20,0,19,16,20,0,0,0,42,20,16,21,0,20,16,21,0,0,0,42,21,16,22,0,21,16,22,0,0,0,42,22,16,23,0,22,16,23,0,0,0,42,23,16,24,0,23,16,24,0,0,0,42,24,16,25,0,24,16,25,0,0,0,42,18,17,26,0,18,17,26,0,1,0,42,24,25,27,0,24,25,27,0,0,0,42,27,25,28,0,27,25,28,0,0,0,42,28,25,29,0,28,25,29,0,0,0,42,29,25,30,0,29,25,30,0,0,1,42,30,25,31,0,30,25,31,1,0,0,42,31,25,32,0,31,25,32,0,0,1,42,32,25,33,0,32,25,33,1,0,0,42,32,33,34,0,32,33,34,1,0,0,42,32,34,35,0,32,34,35,1,0,0,42,32,35,36,0,32,35,36,1,0,0,42,32,36,2,0,32,36,2,1,0,0,42,32,2,37,0,32,2,37,1,0,1,42,2,36,38,0,2,36,38,0,0,0,42,2,38,0,0,2,38,0,0,0,0,42,38,36,39,0,38,36,39,0,0,0,42,39,36,40,0,39,36,40,0,0,0,42,40,36,41,0,40,36,41,0,0,0,42,41,36,42,0,41,36,42,0,0,0,42,42,36,43,0,42,36,43,0,0,0,42,43,36,44,0,43,36,44,0,0,0,42,36,35,45,0,36,35,45,0,0,0,42,36,45,46,0,36,45,46,0,0,0,42,36,46,47,0,36,46,47,0,0,0,42,47,46,48,0,47,46,48,0,0,0,42,48,46,49,0,48,46,49,0,0,0,42,49,46,50,0,49,46,50,0,0,0,42,49,50,51,0,49,50,51,0,0,0,42,51,50,52,0,51,50,52,0,0,0,42,52,50,53,0,52,50,53,0,0,0,42,53,50,54,0,53,50,54,0,0,0,42,54,50,55,0,54,50,55,0,0,0,42,55,50,56,0,55,50,56,0,0,0,42,33,25,57,0,33,25,57,0,0,1,42,57,25,58,0,57,25,58,1,0,1,42,58,25,59,0,58,25,59,1,0,0,42,59,25,60,0,59,25,60,0,0,0,42,60,25,61,0,60,25,61,0,0,1,42,61,25,62,0,61,25,62,1,0,0,42,62,25,63,0,62,25,63,0,0,0,42,63,25,64,0,63,25,64,0,0,0,42,18,65,66,0,18,65,66,0,0,0,42,65,18,67,0,65,18,67,0,0,0,42,67,18,68,0,67,18,68,0,0,0,42,68,18,69,0,68,18,69,0,0,0,42,69,18,70,0,69,18,70,0,0,0,42,70,18,71,0,70,18,71,0,0,0,42,71,18,26,0,71,18,26,0,0,0,42,66,65,72,0,66,65,72,0,0,0,42,66,72,73,0,66,72,73,0,0,1,42,66,73,74,0,66,73,74,0,1,0,42,66,74,75,0,66,74,75,0,0,0,42,66,75,76,0,66,75,76,0,0,0,42,66,76,37,0,66,76,37,0,0,1,42,66,37,77,0,66,37,77,0,1,1,42,77,37,78,0,77,37,78,1,1,0,42,78,37,79,0,78,37,79,0,1,0,42,79,37,80,0,79,37,80,0,1,0,42,80,37,2,0,80,37,2,0,1,0,42,79,80,7,0,79,80,7,0,0,1,42,79,7,81,0,79,7,81,0,1,0,42,81,7,6,0,81,7,6,0,1,0,42,81,6,82,0,81,6,82,0,0,0,42,81,82,10,0,81,82,10,0,0,1,42,81,10,9,0,81,10,9,0,1,0,42,79,81,83,0,79,81,83,0,0,0,42,83,81,12,0,83,81,12,0,0,0,42,83,12,84,0,83,12,84,0,0,0,42,84,12,13,0,84,12,13,0,0,0,42,83,84,85,0,83,84,85,0,0,2,42,85,84,15,0,85,84,15,2,0,0,42,85,15,8,0,85,15,8,2,0,1,42,85,8,86,0,85,8,86,2,1,0,42,85,86,87,0,85,86,87,2,0,3,42,87,86,88,0,87,86,88,3,0,0,42,87,88,89,0,87,88,89,3,0,0,42,87,89,90,0,87,89,90,3,0,0,42,87,90,91,0,87,90,91,3,0,0,42,87,91,56,0,87,91,56,3,0,0,42,87,56,50,0,87,56,50,3,0,0,42,66,77,92,0,66,77,92,0,1,1,42,66,92,93,0,66,92,93,0,1,0,42,66,93,94,0,66,93,94,0,0,0,42,66,94,95,0,66,94,95,0,0,0,42,66,95,96,0,66,95,96,0,0,0,42,66,96,97,0,66,96,97,0,0,0,42,66,97,64,0,66,97,64,0,0,0,42,66,64,25,0,66,64,25,0,0,0,42,98,87,50,0,98,87,50,0,3,0,42,87,98,99,0,87,98,99,3,0,0,42,99,98,100,0,99,98,100,0,0,0,42,99,100,101,0,99,100,101,0,0,0,42,101,100,102,0,101,100,102,0,0,0,42,101,102,103,0,101,102,103,0,0,0,42,103,102,104,0,103,102,104,0,0,0,42,103,104,105,0,103,104,105,0,0,0,42,105,104,106,0,105,104,106,0,0,0,42,105,106,107,0,105,106,107,0,0,0,42,107,106,108,0,107,106,108,0,0,0,42,107,108,109,0,107,108,109,0,0,0,42,109,108,110,0,109,108,110,0,0,1,42,109,110,111,0,109,110,111,0,1,0,42,111,110,112,0,111,110,112,0,1,0,42,111,112,113,0,111,112,113,0,0,0,42,113,112,114,0,113,112,114,0,0,0,42,113,114,115,0,113,114,115,0,0,1,42,115,114,116,0,115,114,116,1,0,0,42,115,116,117,0,115,116,117,1,0,0,42,117,116,118,0,117,116,118,0,0,1,42,117,118,119,0,117,118,119,0,1,1,42,119,118,63,0,119,118,63,1,1,0,42,119,63,64,0,119,63,64,1,0,0,42,44,49,43,0,44,49,43,0,0,0,42,49,44,48,0,49,44,48,0,0,0,42,17,120,26,0,17,120,26,1,0,0,42,120,17,121,0,120,17,121,0,1,0,42,120,121,122,0,120,121,122,0,0,0,42,122,121,123,0,122,121,123,0,0,0,42,122,123,124,0,122,123,124,0,0,0,42,124,123,125,0,124,123,125,0,0,0,42,124,125,126,0,124,125,126,0,0,0,42,124,126,127,0,124,126,127,0,0,0,42,127,126,128,0,127,126,128,0,0,0,42,127,128,129,0,127,128,129,0,0,0,42,129,128,130,0,129,128,130,0,0,0,42,129,130,131,0,129,130,131,0,0,0,42,131,130,132,0,131,130,132,0,0,0,42,131,132,133,0,131,132,133,0,0,0,42,133,132,134,0,133,132,134,0,0,0,42,134,132,135,0,134,132,135,0,0,0,42,134,135,136,0,134,135,136,0,0,0,42,134,136,137,0,134,136,137,0,0,0,42,137,136,138,0,137,136,138,0,0,1,42,138,136,139,0,138,136,139,1,0,0,42,138,139,140,0,138,139,140,1,0,0,42,138,140,141,0,138,140,141,1,0,0,42,141,140,32,0,141,140,32,0,0,1,42,141,32,37,0,141,32,37,0,1,1,42,142,143,144,0,37,32,141,4,4,4,42,143,145,144,0,32,140,141,4,4,4,42,144,145,146,0,141,140,138,4,4,5,42,145,147,146,0,140,139,138,4,4,5,42,147,148,146,0,139,136,138,4,4,5,42,146,148,149,0,138,136,137,5,4,4,42,149,148,150,0,137,136,134,4,4,4,42,148,151,150,0,136,135,134,4,4,4,42,151,152,150,0,135,132,134,4,4,4,42,150,152,153,0,134,132,133,4,4,4,42,153,152,154,0,133,132,131,4,4,4,42,152,155,154,0,132,130,131,4,4,4,42,154,155,156,0,131,130,129,4,4,4,42,155,157,156,0,130,128,129,4,4,4,42,156,157,158,0,129,128,127,4,4,4,42,157,159,158,0,128,126,127,4,4,4,42,158,159,160,0,127,126,124,4,4,4,42,159,161,160,0,126,125,124,4,4,4,42,161,162,160,0,125,123,124,4,4,4,42,160,162,163,0,124,123,122,4,4,4,42,162,164,163,0,123,121,122,4,4,4,42,163,164,165,0,122,121,120,4,4,4,42,164,166,165,0,121,17,120,4,5,4,42,167,165,166,0,26,120,17,4,4,5,42,168,169,170,0,48,44,49,4,4,4,42,171,170,169,0,43,49,44,4,4,4,42,172,173,174,0,64,63,119,5,4,5,42,173,175,174,0,63,118,119,4,4,5,42,174,175,176,0,119,118,117,5,4,4,42,175,177,176,0,118,116,117,4,4,4,42,176,177,178,0,117,116,115,4,4,4,42,177,179,178,0,116,114,115,4,4,4,42,178,179,180,0,115,114,113,4,4,4,42,179,181,180,0,114,112,113,4,4,4,42,180,181,182,0,113,112,111,4,4,4,42,181,183,182,0,112,110,111,4,5,4,42,182,183,184,0,111,110,109,4,5,4,42,183,185,184,0,110,108,109,5,4,4,42,184,185,186,0,109,108,107,4,4,4,42,185,187,186,0,108,106,107,4,4,4,42,186,187,188,0,107,106,105,4,4,4,42,187,189,188,0,106,104,105,4,4,4,42,188,189,190,0,105,104,103,4,4,4,42,189,191,190,0,104,102,103,4,4,4,42,190,191,192,0,103,102,101,4,4,4,42,191,193,192,0,102,100,101,4,4,4,42,192,193,194,0,101,100,99,4,4,4,42,193,195,194,0,100,98,99,4,4,4,42,194,195,196,0,99,98,87,4,4,6,42,197,196,195,0,50,87,98,4,6,4,42,198,172,199,0,25,64,66,4,5,4,42,172,200,199,0,64,97,66,5,4,4,42,200,201,199,0,97,96,66,4,4,4,42,201,202,199,0,96,95,66,4,4,4,42,202,203,199,0,95,94,66,4,4,4,42,203,204,199,0,94,93,66,4,4,4,42,204,205,199,0,93,92,66,4,5,4,42,205,206,199,0,92,77,66,5,5,4,42,197,207,196,0,50,56,87,4,4,6,42,207,208,196,0,56,91,87,4,4,6,42,208,209,196,0,91,90,87,4,4,6,42,209,210,196,0,90,89,87,4,4,6,42,210,211,196,0,89,88,87,4,4,6,42,211,212,196,0,88,86,87,4,4,6,42,196,212,213,0,87,86,85,6,4,7,42,212,214,213,0,86,8,85,4,5,7,42,214,215,213,0,8,15,85,5,4,7,42,215,216,213,0,15,84,85,4,4,7,42,213,216,217,0,85,84,83,7,4,4,42,218,219,216,0,13,12,84,4,4,4,42,216,219,217,0,84,12,83,4,4,4,42,219,220,217,0,12,81,83,4,4,4,42,217,220,221,0,83,81,79,4,4,4,42,222,223,220,0,9,10,81,4,5,4,42,223,224,220,0,10,82,81,5,4,4,42,224,225,220,0,82,6,81,4,4,4,42,225,226,220,0,6,7,81,4,5,4,42,220,226,221,0,81,7,79,4,5,4,42,226,227,221,0,7,80,79,5,4,4,42,228,142,227,0,2,37,80,4,4,4,42,227,142,221,0,80,37,79,4,4,4,42,221,142,229,0,79,37,78,4,4,4,42,229,142,206,0,78,37,77,4,4,5,42,206,142,199,0,77,37,66,5,4,4,42,142,230,199,0,37,76,66,4,4,4,42,230,231,199,0,76,75,66,4,4,4,42,231,232,199,0,75,74,66,4,4,4,42,232,233,199,0,74,73,66,4,5,4,42,233,234,199,0,73,72,66,5,4,4,42,234,235,199,0,72,65,66,4,5,4,42,167,236,237,0,26,18,71,4,5,4,42,237,236,238,0,71,18,70,4,5,4,42,238,236,239,0,70,18,69,4,5,5,42,239,236,240,0,69,18,68,5,5,4,42,240,236,241,0,68,18,67,4,5,4,42,241,236,235,0,67,18,65,4,5,5,42,199,235,236,0,66,65,18,4,5,5,42,172,198,173,0,64,25,63,5,4,4,42,173,198,242,0,63,25,62,4,4,4,42,242,198,243,0,62,25,61,4,4,4,42,243,198,244,0,61,25,60,4,4,4,42,244,198,245,0,60,25,59,4,4,4,42,245,198,246,0,59,25,58,4,4,5,42,246,198,247,0,58,25,57,5,4,5,42,247,198,248,0,57,25,33,5,4,4,42,207,197,249,0,56,50,55,4,4,4,42,249,197,250,0,55,50,54,4,4,4,42,250,197,251,0,54,50,53,4,4,4,42,251,197,252,0,53,50,52,4,4,4,42,252,197,253,0,52,50,51,4,4,4,42,253,197,170,0,51,50,49,4,4,4,42,197,254,170,0,50,46,49,4,5,4,42,170,254,168,0,49,46,48,4,5,4,42,168,254,255,0,48,46,47,4,5,4,42,255,254,256,0,47,46,36,4,5,4,42,254,257,256,0,46,45,36,5,4,4,42,257,258,256,0,45,35,36,4,4,4,42,169,256,171,0,44,36,43,4,4,4,42,171,256,259,0,43,36,42,4,4,4,42,259,256,260,0,42,36,41,4,4,4,42,260,256,261,0,41,36,40,4,4,4,42,261,256,262,0,40,36,39,4,4,4,42,262,256,263,0,39,36,38,4,4,5,42,264,263,228,0,0,38,2,4,5,4,42,263,256,228,0,38,36,2,5,4,4,42,142,228,143,0,37,2,32,4,4,4,42,228,256,143,0,2,36,32,4,4,4,42,256,258,143,0,36,35,32,4,4,4,42,258,265,143,0,35,34,32,4,5,4,42,265,248,143,0,34,33,32,5,4,4,42,248,198,143,0,33,25,32,4,4,4,42,143,198,266,0,32,25,31,4,4,4,42,266,198,267,0,31,25,30,4,4,5,42,267,198,268,0,30,25,29,5,4,4,42,268,198,269,0,29,25,28,4,4,4,42,269,198,270,0,28,25,27,4,4,4,42,270,198,271,0,27,25,24,4,4,4,42,167,166,236,0,26,17,18,4,5,5,42,198,272,271,0,25,16,24,4,4,4,42,271,272,273,0,24,16,23,4,4,4,42,273,272,274,0,23,16,22,4,4,4,42,274,272,275,0,22,16,21,4,4,4,42,275,272,276,0,21,16,20,4,4,4,42,276,272,277,0,20,16,19,4,4,4,42,277,272,166,0,19,16,17,4,4,5,42,236,166,272,0,18,17,16,5,5,4,42,215,214,278,0,15,8,14,4,5,4,42,278,214,218,0,14,8,13,4,5,4,42,218,214,219,0,13,8,12,4,5,4,42,219,214,279,0,12,8,11,4,5,4,42,279,214,222,0,11,8,9,4,5,4,42,223,222,214,0,10,9,8,5,4,5,42,226,225,280,0,7,6,1,5,4,5,42,225,281,280,0,6,5,1,4,4,5,42,281,282,280,0,5,4,1,4,4,5,42,282,283,280,0,4,3,1,4,4,5,42,283,264,280,0,3,0,1,4,4,5,42,228,280,264,0,2,1,0,4,5,4],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 316,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 426,
                    "normals": 8,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID619Geometry",
                "vertices": [0.17767,-0.306693,0.808492,0.195996,-0.306693,0.611794,0.145996,-0.306693,0.611794,0.179715,-0.306693,0.792962,0.185709,-0.306693,0.778492,0.195244,-0.306693,0.766065,0.20767,-0.306693,0.75653,0.195996,-0.306693,0.536794,0.522207,-0.306693,0.74851,0.24946,-0.306693,0.61482,0.23767,-0.306693,0.74851,0.29946,-0.306693,0.61482,0.29946,-0.306693,0.53982,0.41155,-0.306693,0.626908,0.51155,-0.306693,0.626908,0.51155,-0.306693,0.526908,0,-0.306693,1.69911,0.025,-0.306693,1.63911,0,-0.306693,0,0.026193,-0.306693,1.64817,0.029689,-0.306693,1.65661,0.035251,-0.306693,1.66386,0.0425,-0.306693,1.66942,0.050941,-0.306693,1.67292,0.06,-0.306693,1.67411,0.73,-0.306693,1.69911,0.025,-0.306693,0.06,0.069059,-0.306693,1.67292,0.0775,-0.306693,1.66942,0.084749,-0.306693,1.66386,0.090311,-0.306693,1.65661,0.093807,-0.306693,1.64817,0.095,-0.306693,1.63911,0.660941,-0.306693,1.67292,0.6525,-0.306693,1.66942,0.645251,-0.306693,1.66386,0.240671,-0.306693,1.25891,0.095,-0.306693,0.06,0.179715,-0.306693,0.824021,0.185709,-0.306693,0.838492,0.195244,-0.306693,0.850918,0.20767,-0.306693,0.860453,0.222141,-0.306693,0.866447,0.23767,-0.306693,0.868492,0.240671,-0.306693,1.00891,0.639689,-0.306693,1.65661,0.636193,-0.306693,1.64817,0.520671,-0.306693,1.25891,0.520671,-0.306693,1.00891,0.522207,-0.306693,0.868492,0.635,-0.306693,1.63911,0.537736,-0.306693,0.866447,0.552207,-0.306693,0.860453,0.564633,-0.306693,0.850918,0.574168,-0.306693,0.838492,0.580162,-0.306693,0.824021,0.582207,-0.306693,0.808492,0.67,-0.306693,1.67411,0.679059,-0.306693,1.67292,0.6875,-0.306693,1.66942,0.694749,-0.306693,1.66386,0.700311,-0.306693,1.65661,0.703807,-0.306693,1.64817,0.705,-0.306693,1.63911,0.705,-0.306693,0.06,0.06,-0.306693,0.025,0.73,-0.306693,0,0.050941,-0.306693,0.026193,0.0425,-0.306693,0.029689,0.035251,-0.306693,0.035251,0.029689,-0.306693,0.0425,0.026193,-0.306693,0.050941,0.069059,-0.306693,0.026193,0.0775,-0.306693,0.029689,0.084749,-0.306693,0.035251,0.090311,-0.306693,0.0425,0.093807,-0.306693,0.050941,0.660941,-0.306693,0.026193,0.6525,-0.306693,0.029689,0.645251,-0.306693,0.035251,0.145996,-0.306693,0.536794,0.24946,-0.306693,0.53982,0.222141,-0.306693,0.750536,0.639689,-0.306693,0.0425,0.41155,-0.306693,0.526908,0.636193,-0.306693,0.050941,0.537736,-0.306693,0.750536,0.635,-0.306693,0.06,0.552207,-0.306693,0.75653,0.564633,-0.306693,0.766065,0.574168,-0.306693,0.778492,0.580162,-0.306693,0.792962,0.67,-0.306693,0.025,0.679059,-0.306693,0.026193,0.6875,-0.306693,0.029689,0.694749,-0.306693,0.035251,0.700311,-0.306693,0.0425,0.703807,-0.306693,0.050941,0.636193,-0.306693,1.63005,0.636193,-0.306693,0.069059,0.639689,-0.306693,1.62161,0.639689,-0.306693,0.0775,0.645251,-0.306693,1.61436,0.645251,-0.306693,0.084749,0.6525,-0.306693,1.6088,0.6525,-0.306693,0.090311,0.660941,-0.306693,1.6053,0.660941,-0.306693,0.093807,0.67,-0.306693,1.60411,0.67,-0.306693,0.095,0.679059,-0.306693,1.6053,0.679059,-0.306693,0.093807,0.6875,-0.306693,1.6088,0.6875,-0.306693,0.090311,0.694749,-0.306693,1.61436,0.694749,-0.306693,0.084749,0.700311,-0.306693,1.62161,0.700311,-0.306693,0.0775,0.703807,-0.306693,1.63005,0.703807,-0.306693,0.069059,0.026193,-0.306693,0.069059,0.026193,-0.306693,1.63005,0.029689,-0.306693,0.0775,0.029689,-0.306693,1.62161,0.035251,-0.306693,0.084749,0.035251,-0.306693,1.61436,0.0425,-0.306693,1.6088,0.0425,-0.306693,0.090311,0.050941,-0.306693,1.6053,0.050941,-0.306693,0.093807,0.06,-0.306693,1.60411,0.06,-0.306693,0.095,0.069059,-0.306693,1.6053,0.069059,-0.306693,0.093807,0.0775,-0.306693,0.090311,0.0775,-0.306693,1.6088,0.084749,-0.306693,1.61436,0.084749,-0.306693,0.084749,0.090311,-0.306693,0.0775,0.090311,-0.306693,1.62161,0.093807,-0.306693,1.63005,0.093807,-0.306693,0.069059,0.095,-0.306693,0.06,0.095,-0.306693,1.63911,0.093807,-0.306693,0.069059,0.093807,-0.306693,1.63005,0.090311,-0.306693,0.0775,0.090311,-0.306693,1.62161,0.084749,-0.306693,1.61436,0.084749,-0.306693,0.084749,0.0775,-0.306693,0.090311,0.0775,-0.306693,1.6088,0.069059,-0.306693,1.6053,0.069059,-0.306693,0.093807,0.06,-0.306693,0.095,0.06,-0.306693,1.60411,0.050941,-0.306693,0.093807,0.050941,-0.306693,1.6053,0.0425,-0.306693,0.090311,0.0425,-0.306693,1.6088,0.035251,-0.306693,0.084749,0.035251,-0.306693,1.61436,0.029689,-0.306693,1.62161,0.029689,-0.306693,0.0775,0.026193,-0.306693,1.63005,0.026193,-0.306693,0.069059,0.025,-0.306693,1.63911,0.025,-0.306693,0.06,0.520671,-0.306693,1.00891,0.240671,-0.306693,1.00891,0.522207,-0.306693,0.868492,0.23767,-0.306693,0.868492,0.705,-0.306693,0.06,0.705,-0.306693,1.63911,0.703807,-0.306693,0.069059,0.703807,-0.306693,1.63005,0.700311,-0.306693,0.0775,0.700311,-0.306693,1.62161,0.694749,-0.306693,0.084749,0.694749,-0.306693,1.61436,0.6875,-0.306693,0.090311,0.6875,-0.306693,1.6088,0.679059,-0.306693,0.093807,0.679059,-0.306693,1.6053,0.67,-0.306693,0.095,0.67,-0.306693,1.60411,0.660941,-0.306693,0.093807,0.660941,-0.306693,1.6053,0.6525,-0.306693,0.090311,0.6525,-0.306693,1.6088,0.645251,-0.306693,0.084749,0.645251,-0.306693,1.61436,0.639689,-0.306693,0.0775,0.639689,-0.306693,1.62161,0.636193,-0.306693,0.069059,0.636193,-0.306693,1.63005,0.635,-0.306693,0.06,0.635,-0.306693,1.63911,0.73,-0.306693,1.69911,0.73,-0.306693,0,0.703807,-0.306693,0.050941,0.700311,-0.306693,0.0425,0.694749,-0.306693,0.035251,0.6875,-0.306693,0.029689,0.679059,-0.306693,0.026193,0.67,-0.306693,0.025,0.660941,-0.306693,0.026193,0.582207,-0.306693,0.808492,0.580162,-0.306693,0.792962,0.574168,-0.306693,0.778492,0.564633,-0.306693,0.766065,0.552207,-0.306693,0.75653,0.537736,-0.306693,0.750536,0.636193,-0.306693,0.050941,0.522207,-0.306693,0.74851,0.51155,-0.306693,0.526908,0.41155,-0.306693,0.526908,0.639689,-0.306693,0.0425,0.41155,-0.306693,0.626908,0.29946,-0.306693,0.53982,0.24946,-0.306693,0.53982,0.645251,-0.306693,0.035251,0.24946,-0.306693,0.61482,0.23767,-0.306693,0.74851,0.222141,-0.306693,0.750536,0.20767,-0.306693,0.75653,0.195996,-0.306693,0.536794,0.145996,-0.306693,0.536794,0.145996,-0.306693,0.611794,0.6525,-0.306693,0.029689,0.093807,-0.306693,0.050941,0.090311,-0.306693,0.0425,0.084749,-0.306693,0.035251,0.0775,-0.306693,0.029689,0.069059,-0.306693,0.026193,0.06,-0.306693,0.025,0,-0.306693,0,0.026193,-0.306693,0.050941,0.029689,-0.306693,0.0425,0.035251,-0.306693,0.035251,0.0425,-0.306693,0.029689,0.050941,-0.306693,0.026193,0.703807,-0.306693,1.64817,0.700311,-0.306693,1.65661,0.694749,-0.306693,1.66386,0.6875,-0.306693,1.66942,0.679059,-0.306693,1.67292,0.67,-0.306693,1.67411,0.660941,-0.306693,1.67292,0.580162,-0.306693,0.824021,0.574168,-0.306693,0.838492,0.564633,-0.306693,0.850918,0.552207,-0.306693,0.860453,0.537736,-0.306693,0.866447,0.636193,-0.306693,1.64817,0.520671,-0.306693,1.25891,0.240671,-0.306693,1.25891,0.639689,-0.306693,1.65661,0.645251,-0.306693,1.66386,0.222141,-0.306693,0.866447,0.20767,-0.306693,0.860453,0.195244,-0.306693,0.850918,0.185709,-0.306693,0.838492,0.179715,-0.306693,0.824021,0.17767,-0.306693,0.808492,0.6525,-0.306693,1.66942,0.093807,-0.306693,1.64817,0.090311,-0.306693,1.65661,0.084749,-0.306693,1.66386,0.0775,-0.306693,1.66942,0.069059,-0.306693,1.67292,0.06,-0.306693,1.67411,0,-0.306693,1.69911,0.050941,-0.306693,1.67292,0.0425,-0.306693,1.66942,0.035251,-0.306693,1.66386,0.029689,-0.306693,1.65661,0.026193,-0.306693,1.64817,0.51155,-0.306693,0.626908,0.29946,-0.306693,0.61482,0.195996,-0.306693,0.611794,0.195244,-0.306693,0.766065,0.185709,-0.306693,0.778492,0.179715,-0.306693,0.792962,0,-0.306693,0,0.73,-0.306693,0,0,-0.306693,1.69911,0.73,-0.306693,1.69911,0.029689,-0.306693,1.62161,0.035251,-0.306693,1.61436,0.0425,-0.306693,1.6088,0.050941,-0.306693,1.6053,0.06,-0.306693,1.60411,0.069059,-0.306693,1.6053,0.0775,-0.306693,1.6088,0.084749,-0.306693,1.61436,0.090311,-0.306693,1.62161,0.093807,-0.306693,1.63005,0.095,-0.306693,1.63911,0.093807,-0.306693,1.64817,0.090311,-0.306693,1.65661,0.084749,-0.306693,1.66386,0.0775,-0.306693,1.66942,0.069059,-0.306693,1.67292,0.06,-0.306693,1.67411,0.050941,-0.306693,1.67292,0.0425,-0.306693,1.66942,0.035251,-0.306693,1.66386,0.029689,-0.306693,1.65661,0.026193,-0.306693,1.64817,0.025,-0.306693,1.63911,0.026193,-0.306693,1.63005,0.660941,-0.306693,1.67292,0.6525,-0.306693,1.66942,0.645251,-0.306693,1.66386,0.639689,-0.306693,1.65661,0.636193,-0.306693,1.64817,0.635,-0.306693,1.63911,0.636193,-0.306693,1.63005,0.639689,-0.306693,1.62161,0.645251,-0.306693,1.61436,0.6525,-0.306693,1.6088,0.660941,-0.306693,1.6053,0.67,-0.306693,1.60411,0.679059,-0.306693,1.6053,0.6875,-0.306693,1.6088,0.694749,-0.306693,1.61436,0.700311,-0.306693,1.62161,0.703807,-0.306693,1.63005,0.705,-0.306693,1.63911,0.703807,-0.306693,1.64817,0.700311,-0.306693,1.65661,0.694749,-0.306693,1.66386,0.6875,-0.306693,1.66942,0.679059,-0.306693,1.67292,0.67,-0.306693,1.67411,0.0425,-0.306693,0.090311,0.035251,-0.306693,0.084749,0.029689,-0.306693,0.0775,0.026193,-0.306693,0.069059,0.025,-0.306693,0.06,0.026193,-0.306693,0.050941,0.029689,-0.306693,0.0425,0.035251,-0.306693,0.035251,0.0425,-0.306693,0.029689,0.050941,-0.306693,0.026193,0.06,-0.306693,0.025,0.069059,-0.306693,0.026193,0.0775,-0.306693,0.029689,0.084749,-0.306693,0.035251,0.090311,-0.306693,0.0425,0.093807,-0.306693,0.050941,0.095,-0.306693,0.06,0.093807,-0.306693,0.069059,0.090311,-0.306693,0.0775,0.084749,-0.306693,0.084749,0.0775,-0.306693,0.090311,0.069059,-0.306693,0.093807,0.06,-0.306693,0.095,0.050941,-0.306693,0.093807,0.660941,-0.306693,0.026193,0.67,-0.306693,0.025,0.679059,-0.306693,0.026193,0.6875,-0.306693,0.029689,0.694749,-0.306693,0.035251,0.700311,-0.306693,0.0425,0.703807,-0.306693,0.050941,0.705,-0.306693,0.06,0.703807,-0.306693,0.069059,0.700311,-0.306693,0.0775,0.694749,-0.306693,0.084749,0.6875,-0.306693,0.090311,0.679059,-0.306693,0.093807,0.67,-0.306693,0.095,0.660941,-0.306693,0.093807,0.6525,-0.306693,0.090311,0.645251,-0.306693,0.084749,0.639689,-0.306693,0.0775,0.636193,-0.306693,0.069059,0.635,-0.306693,0.06,0.636193,-0.306693,0.050941,0.639689,-0.306693,0.0425,0.645251,-0.306693,0.035251,0.6525,-0.306693,0.029689,0.520671,-0.306693,1.25891,0.240671,-0.306693,1.25891,0.240671,-0.306693,1.00891,0.520671,-0.306693,1.00891,0.552207,-0.306693,0.860453,0.537736,-0.306693,0.866447,0.522207,-0.306693,0.868492,0.23767,-0.306693,0.868492,0.222141,-0.306693,0.866447,0.20767,-0.306693,0.860453,0.195244,-0.306693,0.850918,0.185709,-0.306693,0.838492,0.179715,-0.306693,0.824021,0.17767,-0.306693,0.808492,0.179715,-0.306693,0.792962,0.185709,-0.306693,0.778492,0.195244,-0.306693,0.766065,0.20767,-0.306693,0.75653,0.222141,-0.306693,0.750536,0.23767,-0.306693,0.74851,0.522207,-0.306693,0.74851,0.537736,-0.306693,0.750536,0.552207,-0.306693,0.75653,0.564633,-0.306693,0.766065,0.574168,-0.306693,0.778492,0.580162,-0.306693,0.792962,0.582207,-0.306693,0.808492,0.580162,-0.306693,0.824021,0.574168,-0.306693,0.838492,0.564633,-0.306693,0.850918,0.51155,-0.306693,0.626908,0.51155,-0.306693,0.526908,0.41155,-0.306693,0.626908,0.41155,-0.306693,0.526908,0.24946,-0.306693,0.53982,0.29946,-0.306693,0.53982,0.29946,-0.306693,0.61482,0.24946,-0.306693,0.61482,0.145996,-0.306693,0.536794,0.195996,-0.306693,0.536794,0.195996,-0.306693,0.611794,0.145996,-0.306693,0.611794],
                "uvs": [[-23.2274,17.4617,-23.2525,17.346,-23.184,17.346,-23.2302,17.4526,-23.2384,17.4441,-23.2514,17.4368,-23.2685,17.4312,-23.2525,17.3019,-23.6993,17.4265,-23.3257,17.3478,-23.3096,17.4265,-23.3942,17.3478,-23.3942,17.3037,-23.5477,17.3549,-23.6847,17.3549,-23.6847,17.2961,-22.984,17.9856,-23.0182,17.9503,-22.984,16.9862,-23.0199,17.9557,-23.0247,17.9606,-23.0323,17.9649,-23.0422,17.9682,-23.0538,17.9702,-23.0662,17.9709,-23.984,17.9856,-23.0182,17.0214,-23.0786,17.9702,-23.0902,17.9682,-23.1001,17.9649,-23.1077,17.9606,-23.1125,17.9557,-23.1141,17.9503,-23.8894,17.9702,-23.8778,17.9682,-23.8679,17.9649,-23.3137,17.7267,-23.1141,17.0214,-23.2302,17.4709,-23.2384,17.4794,-23.2514,17.4867,-23.2685,17.4923,-23.2883,17.4958,-23.3096,17.497,-23.3137,17.5796,-23.8603,17.9606,-23.8555,17.9557,-23.6972,17.7267,-23.6972,17.5796,-23.6993,17.497,-23.8538,17.9503,-23.7206,17.4958,-23.7404,17.4923,-23.7574,17.4867,-23.7705,17.4794,-23.7787,17.4709,-23.7815,17.4617,-23.9018,17.9709,-23.9142,17.9702,-23.9257,17.9682,-23.9357,17.9649,-23.9433,17.9606,-23.9481,17.9557,-23.9497,17.9503,-23.9497,17.0214,-23.0662,17.0009,-23.984,16.9862,-23.0538,17.0016,-23.0422,17.0036,-23.0323,17.0069,-23.0247,17.0112,-23.0199,17.0161,-23.0786,17.0016,-23.0902,17.0036,-23.1001,17.0069,-23.1077,17.0112,-23.1125,17.0161,-23.8894,17.0016,-23.8778,17.0036,-23.8679,17.0069,-23.184,17.3019,-23.3257,17.3037,-23.2883,17.4276,-23.8603,17.0112,-23.5477,17.2961,-23.8555,17.0161,-23.7206,17.4276,-23.8538,17.0214,-23.7404,17.4312,-23.7574,17.4368,-23.7705,17.4441,-23.7787,17.4526,-23.9018,17.0009,-23.9142,17.0016,-23.9257,17.0036,-23.9357,17.0069,-23.9433,17.0112,-23.9481,17.0161,-23.8555,17.945,-23.8555,17.0268,-23.8603,17.94,-23.8603,17.0317,-23.8679,17.9358,-23.8679,17.036,-23.8778,17.9325,-23.8778,17.0393,-23.8894,17.9304,-23.8894,17.0413,-23.9018,17.9297,-23.9018,17.042,-23.9142,17.9304,-23.9142,17.0413,-23.9257,17.9325,-23.9257,17.0393,-23.9357,17.9358,-23.9357,17.036,-23.9433,17.94,-23.9433,17.0317,-23.9481,17.945,-23.9481,17.0268,-23.0199,17.0268,-23.0199,17.945,-23.0247,17.0317,-23.0247,17.94,-23.0323,17.036,-23.0323,17.9358,-23.0422,17.9325,-23.0422,17.0393,-23.0538,17.9304,-23.0538,17.0413,-23.0662,17.9297,-23.0662,17.042,-23.0786,17.9304,-23.0786,17.0413,-23.0902,17.0393,-23.0902,17.9325,-23.1001,17.9358,-23.1001,17.036,-23.1077,17.0317,-23.1077,17.94,-23.1125,17.945,-23.1125,17.0268]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "F3C9A248-DB38-3EBB-BE90-58ECED44E2BF"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0,-1,0,0,1],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,1,0,0,0,1,1,1,42,7,6,5,1,0,0,0,1,1,1],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 4,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 12,
                    "normals": 2,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID85Geometry",
                "vertices": [0.334646,-0.125031,0.362205,0,-0.078264,0.362205,0.334646,-0.078264,0.362205,0,-0.125031,0.362205,0,-0.125031,0.362205,0.334646,-0.125031,0.362205,0,-0.078264,0.362205,0.334646,-0.078264,0.362205,0,-0.078264,0.362205,0.334646,-0.078264,0.362205,0.334646,-0.125031,0.362205,0,-0.125031,0.362205],
                "uvs": [[0.083661,0.031258,0,0.019566,0.083661,0.019566,0,0.031258]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__Metal_Corrogated_Shiny_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "__Metal_Corrogated_Shiny_.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.666667,0.690196,0.8],
                "DbgColor": 15597568,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.666667,0.690196,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "68FFE787-DE97-347C-B80E-EF543A72C76F"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.001Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "3B82A728-C110-396A-8217-94C100CE54A3"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,0,1,0,0,-1,0,1,0,0,-1,0,-1,0,0,1,0,0],
                "faces": [34,0,1,2,0,0,0,0,34,1,0,3,0,0,0,0,34,4,5,6,0,1,1,1,34,7,6,5,0,1,1,1,34,12,13,14,0,2,2,2,34,13,12,15,0,2,2,2,34,16,17,18,0,3,3,3,34,19,18,17,0,3,3,3,34,22,23,24,0,4,4,4,34,23,22,25,0,4,4,4,34,26,27,28,0,5,5,5,34,29,28,27,0,5,5,5,34,31,32,33,0,3,3,3,34,32,31,34,0,3,3,3,34,35,36,37,0,2,2,2,34,38,37,36,0,2,2,2,34,40,41,42,0,5,5,5,34,41,40,43,0,5,5,5,34,44,45,46,0,4,4,4,34,47,46,45,0,4,4,4,34,48,49,50,0,1,1,1,34,49,48,51,0,1,1,1,34,52,53,54,0,0,0,0,34,55,54,53,0,0,0,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 24,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 56,
                    "normals": 6,
                    "uvs": 0
                },
                "influencesPerVertex": 2,
                "name": "block_1Geometry",
                "vertices": [-10,-10,10,19.685,0,10,-10,0,10,19.685,-10,10,19.685,-10,10,-10,-10,10,19.685,0,10,-10,0,10,19.685,0,10,-10,0,10,-10,-10,10,19.685,-10,10,19.685,0,10,-10,0,0,-10,0,10,19.685,0,0,19.685,0,0,19.685,0,10,-10,0,0,-10,0,10,-10,0,0,19.685,0,0,-10,-10,10,-10,0,0,-10,-10,0,-10,0,10,-10,0,10,-10,-10,10,-10,0,0,-10,-10,0,-10,-10,0,19.685,-10,-0,-10,-10,10,-10,-10,0,19.685,-10,10,19.685,-10,10,19.685,-10,-0,-10,-10,10,-10,-10,0,19.685,-10,-0,19.685,0,0,19.685,-10,10,19.685,-10,-0,19.685,0,10,19.685,0,10,19.685,0,0,19.685,-10,10,19.685,-10,-0,19.685,-10,-0,-10,0,0,19.685,0,0,-10,-10,0,-10,-10,0,19.685,-10,-0,-10,0,0,19.685,0,0],
                "uvs": []
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.317647,0.317647,0.317647],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0135_DarkGray_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.317647,0.317647,0.317647],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "88554500-ACE7-3253-917C-D27FA91CB31B"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [-0.707053,0,-0.707114,-0.500015,0,-0.865993,-0.499985,0,-0.865993,-0.707083,0,-0.707114,-0.258858,0,-0.965911,-0.865993,0,-0.499985,0,0,-1,-0.965911,0,-0.258797,0.258858,0,-0.965911,-1,0,0,0.500015,0,-0.865993,0.499985,0,-0.865993,-0.965911,0,0.258797,0.707053,0,-0.707114,0.707083,0,-0.707114,-0.866024,0,0.499985,-0.865993,0,0.499985,0.865993,0,-0.499985,-0.707083,0,0.707083,0.965911,0,-0.258797,-0.500015,0,0.865993,1,0,0,-0.258797,0,0.965911,0.965911,0,0.258797,0,0,1,0.865993,0,0.499985,0.866024,0,0.499985,0.258797,0,0.965911,0.707083,0,0.707083,0.500015,0,0.865993,0.707083,0,0.707114,0.707053,0,0.707114,0.499985,0,0.865993,0.258858,0,0.965911,-0.258858,0,0.965911,-0.499985,0,0.865993,-0.707083,0,0.707114,-0.707053,0,0.707114,0.866024,0,-0.499985,0.707083,0,-0.707083,0.258797,0,-0.965911,-0.866024,0,-0.499985,-0.258797,0,-0.965911,-0.707083,0,-0.707083],
                "faces": [42,0,1,2,0,0,1,2,0,1,2,42,1,0,3,0,3,2,1,1,0,3,42,1,12,2,0,4,5,6,1,4,2,42,12,1,13,0,7,6,5,4,1,4,42,3,18,19,0,8,9,10,3,5,5,42,18,3,0,0,11,10,9,5,3,0,42,13,24,12,0,12,13,14,4,6,4,42,24,13,25,0,15,14,13,6,4,6,42,19,30,31,0,16,17,18,5,7,7,42,30,19,18,0,19,18,17,7,5,5,42,25,36,24,0,20,21,22,6,8,6,42,36,25,37,0,23,22,21,8,6,8,42,31,42,43,0,24,25,26,7,9,9,42,42,31,30,0,27,26,25,9,7,7,42,36,48,49,0,28,29,30,8,10,11,42,48,36,37,0,31,30,29,10,8,8,42,43,54,55,0,32,33,34,9,12,12,42,54,43,42,0,35,34,33,12,9,9,42,48,60,49,0,36,37,38,10,13,11,42,60,48,61,0,39,38,37,13,10,14,42,55,66,67,0,40,41,42,12,15,16,42,66,55,54,0,43,42,41,15,12,12,42,60,72,73,0,44,45,46,13,17,17,42,72,60,61,0,47,46,45,17,13,14,42,67,78,79,0,48,49,50,16,18,18,42,78,67,66,0,51,50,49,18,16,15,42,73,84,85,0,52,53,54,17,19,19,42,84,73,72,0,55,54,53,19,17,17,42,90,78,91,0,56,57,58,20,18,20,42,78,90,79,0,59,58,57,18,20,18,42,96,84,97,0,60,61,62,21,19,21,42,84,96,85,0,63,62,61,19,21,19,42,102,91,103,0,64,65,66,22,20,22,42,91,102,90,0,67,66,65,20,22,20,42,108,97,109,0,68,69,70,23,21,23,42,97,108,96,0,71,70,69,21,23,21,42,114,102,103,0,72,73,74,24,22,22,42,102,114,115,0,75,74,73,22,24,24,42,120,109,121,0,76,77,78,25,23,26,42,109,120,108,0,79,78,77,23,25,23,42,126,114,127,0,80,81,82,27,24,27,42,114,126,115,0,83,82,81,24,27,24,42,120,132,133,0,84,85,86,25,28,28,42,132,120,121,0,87,86,85,28,25,26,42,138,126,127,0,88,89,90,29,27,27,42,126,138,139,0,91,90,89,27,29,29,42,132,138,133,0,92,93,94,28,29,28,42,138,132,139,0,95,94,93,29,28,29,42,4,5,6,1,0,0,0,30,31,29,42,7,6,5,1,0,0,0,32,29,31,42,14,6,15,1,0,0,0,33,29,33,42,7,15,6,1,0,0,0,32,33,29,42,5,4,20,1,0,0,0,31,30,25,42,21,20,4,1,0,0,0,25,25,30,42,26,14,27,1,0,0,0,24,33,24,42,15,27,14,1,0,0,0,33,24,33,42,20,21,32,1,0,0,0,25,25,23,42,33,32,21,1,0,0,0,23,23,25,42,38,26,39,1,0,0,0,34,24,34,42,27,39,26,1,0,0,0,24,34,24,42,32,33,44,1,0,0,0,23,23,21,42,45,44,33,1,0,0,0,21,21,23,42,38,39,50,1,0,0,0,34,34,20,42,51,50,39,1,0,0,0,35,20,34,42,44,45,56,1,0,0,0,21,21,19,42,57,56,45,1,0,0,0,19,19,21,42,62,50,63,1,0,0,0,36,20,37,42,51,63,50,1,0,0,0,35,37,20,42,56,57,68,1,0,0,0,19,19,38,42,69,68,57,1,0,0,0,17,38,19,42,62,63,74,1,0,0,0,36,37,16,42,75,74,63,1,0,0,0,16,16,37,42,68,69,80,1,0,0,0,38,17,39,42,81,80,69,1,0,0,0,39,39,17,42,74,75,86,1,0,0,0,16,16,12,42,87,86,75,1,0,0,0,12,12,16,42,81,92,80,1,0,0,0,39,10,39,42,93,80,92,1,0,0,0,10,39,10,42,87,98,86,1,0,0,0,12,9,12,42,99,86,98,1,0,0,0,9,12,9,42,92,104,93,1,0,0,0,10,40,10,42,105,93,104,1,0,0,0,40,10,40,42,98,110,99,1,0,0,0,9,7,9,42,111,99,110,1,0,0,0,7,9,7,42,116,117,104,1,0,0,0,6,6,40,42,105,104,117,1,0,0,0,40,40,6,42,110,122,111,1,0,0,0,7,5,7,42,123,111,122,1,0,0,0,41,7,5,42,116,128,117,1,0,0,0,6,42,6,42,129,117,128,1,0,0,0,42,6,42,42,123,122,134,1,0,0,0,41,5,43,42,135,134,122,1,0,0,0,43,43,5,42,140,141,128,1,0,0,0,1,1,42,42,129,128,141,1,0,0,0,42,42,1,42,140,134,141,1,0,0,0,1,43,1,42,135,141,134,1,0,0,0,43,1,43],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 96,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 144,
                    "normals": 44,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID550Geometry",
                "vertices": [0.084749,-0.306693,1.66386,0.0775,-0.356693,1.66942,0.0775,-0.306693,1.66942,0.084749,-0.356693,1.66386,0.084749,-0.356693,1.66386,0.084749,-0.306693,1.66386,0.0775,-0.356693,1.66942,0.0775,-0.306693,1.66942,0.084749,-0.356693,1.66386,0.0775,-0.356693,1.66942,0.0775,-0.306693,1.66942,0.084749,-0.306693,1.66386,0.069059,-0.306693,1.67292,0.069059,-0.356693,1.67292,0.069059,-0.356693,1.67292,0.069059,-0.306693,1.67292,0.069059,-0.356693,1.67292,0.069059,-0.306693,1.67292,0.090311,-0.306693,1.65661,0.090311,-0.356693,1.65661,0.090311,-0.306693,1.65661,0.090311,-0.356693,1.65661,0.090311,-0.356693,1.65661,0.090311,-0.306693,1.65661,0.06,-0.306693,1.67411,0.06,-0.356693,1.67411,0.06,-0.356693,1.67411,0.06,-0.306693,1.67411,0.06,-0.356693,1.67411,0.06,-0.306693,1.67411,0.093807,-0.306693,1.64817,0.093807,-0.356693,1.64817,0.093807,-0.306693,1.64817,0.093807,-0.356693,1.64817,0.093807,-0.356693,1.64817,0.093807,-0.306693,1.64817,0.050941,-0.306693,1.67292,0.050941,-0.356693,1.67292,0.050941,-0.356693,1.67292,0.050941,-0.306693,1.67292,0.050941,-0.356693,1.67292,0.050941,-0.306693,1.67292,0.095,-0.306693,1.63911,0.095,-0.356693,1.63911,0.095,-0.306693,1.63911,0.095,-0.356693,1.63911,0.095,-0.356693,1.63911,0.095,-0.306693,1.63911,0.0425,-0.356693,1.66942,0.0425,-0.306693,1.66942,0.0425,-0.356693,1.66942,0.0425,-0.306693,1.66942,0.0425,-0.356693,1.66942,0.0425,-0.306693,1.66942,0.093807,-0.306693,1.63005,0.093807,-0.356693,1.63005,0.093807,-0.306693,1.63005,0.093807,-0.356693,1.63005,0.093807,-0.356693,1.63005,0.093807,-0.306693,1.63005,0.035251,-0.306693,1.66386,0.035251,-0.356693,1.66386,0.035251,-0.356693,1.66386,0.035251,-0.306693,1.66386,0.035251,-0.356693,1.66386,0.035251,-0.306693,1.66386,0.090311,-0.306693,1.62161,0.090311,-0.356693,1.62161,0.090311,-0.306693,1.62161,0.090311,-0.356693,1.62161,0.090311,-0.356693,1.62161,0.090311,-0.306693,1.62161,0.029689,-0.356693,1.65661,0.029689,-0.306693,1.65661,0.029689,-0.356693,1.65661,0.029689,-0.306693,1.65661,0.029689,-0.356693,1.65661,0.029689,-0.306693,1.65661,0.084749,-0.306693,1.61436,0.084749,-0.356693,1.61436,0.084749,-0.306693,1.61436,0.084749,-0.356693,1.61436,0.084749,-0.356693,1.61436,0.084749,-0.306693,1.61436,0.026193,-0.356693,1.64817,0.026193,-0.306693,1.64817,0.026193,-0.356693,1.64817,0.026193,-0.306693,1.64817,0.026193,-0.356693,1.64817,0.026193,-0.306693,1.64817,0.0775,-0.356693,1.6088,0.0775,-0.306693,1.6088,0.0775,-0.356693,1.6088,0.0775,-0.306693,1.6088,0.0775,-0.356693,1.6088,0.0775,-0.306693,1.6088,0.025,-0.306693,1.63911,0.025,-0.356693,1.63911,0.025,-0.306693,1.63911,0.025,-0.356693,1.63911,0.025,-0.356693,1.63911,0.025,-0.306693,1.63911,0.069059,-0.356693,1.6053,0.069059,-0.306693,1.6053,0.069059,-0.356693,1.6053,0.069059,-0.306693,1.6053,0.069059,-0.356693,1.6053,0.069059,-0.306693,1.6053,0.026193,-0.306693,1.63005,0.026193,-0.356693,1.63005,0.026193,-0.306693,1.63005,0.026193,-0.356693,1.63005,0.026193,-0.356693,1.63005,0.026193,-0.306693,1.63005,0.06,-0.306693,1.60411,0.06,-0.356693,1.60411,0.06,-0.356693,1.60411,0.06,-0.306693,1.60411,0.06,-0.356693,1.60411,0.06,-0.306693,1.60411,0.029689,-0.306693,1.62161,0.029689,-0.356693,1.62161,0.029689,-0.306693,1.62161,0.029689,-0.356693,1.62161,0.029689,-0.356693,1.62161,0.029689,-0.306693,1.62161,0.050941,-0.356693,1.6053,0.050941,-0.306693,1.6053,0.050941,-0.356693,1.6053,0.050941,-0.306693,1.6053,0.050941,-0.356693,1.6053,0.050941,-0.306693,1.6053,0.035251,-0.356693,1.61436,0.035251,-0.306693,1.61436,0.035251,-0.356693,1.61436,0.035251,-0.306693,1.61436,0.035251,-0.356693,1.61436,0.035251,-0.306693,1.61436,0.0425,-0.306693,1.6088,0.0425,-0.356693,1.6088,0.0425,-0.356693,1.6088,0.0425,-0.306693,1.6088,0.0425,-0.356693,1.6088,0.0425,-0.306693,1.6088],
                "uvs": [[-7.14059,-0,-7.14059,-0.029412,-7.15311,-0,-7.15311,-0.029412,5.30779,-0,5.32031,-0,5.30779,-0.029412,5.32031,-0.029412,-19.1269,-0.029412,-19.1269,0,-19.1144,-0.029412,-19.1144,0,17.4065,-0,17.4191,-0,17.4065,-0.029412,17.4191,-0.029412,-29.7978,-0.029412,-29.7978,-0,-29.7852,-0.029412,-29.7852,-0,28.3186,-0,28.3312,-0,28.3186,-0.029412,28.3312,-0.029412,-38.4383,-0.029412,-38.4383,-0,-38.4258,-0.029412,-38.4258,-0,37.313,0,37.313,-0.029412,37.3004,0,37.3004,-0.029412,-44.4598,-0.029412,-44.4598,-0,-44.4473,-0.029412,-44.4473,-0,43.7399,0,43.7524,0,43.7399,-0.029412,43.7524,-0.029412,-47.4519,-0.029412,-47.4519,0,-47.4393,-0.029412,-47.4393,0,47.2106,-0,47.2106,-0.029412,47.198,-0,47.198,-0.029412,-47.2106,-0.029412,-47.2106,-0,-47.198,-0.029412,-47.198,-0,47.4519,0,47.4519,-0.029412,47.4393,0,47.4393,-0.029412,-43.7524,-0,-43.7399,-0,-43.7524,-0.029412,-43.7399,-0.029412,44.4598,-0.029412,44.4473,-0.029412,44.4598,-0,44.4473,-0,-37.313,0,-37.3004,0,-37.313,-0.029412,-37.3004,-0.029412,38.4383,-0.029412,38.4258,-0.029412,38.4383,0,38.4258,0,-28.3186,-0,-28.3186,-0.029412,-28.3312,-0,-28.3312,-0.029412,29.7978,-0.029412,29.7852,-0.029412,29.7978,-0,29.7852,-0,-17.4191,-0,-17.4065,-0,-17.4191,-0.029412,-17.4065,-0.029412,19.1269,0,19.1269,-0.029412,19.1144,0,19.1144,-0.029412,-5.30779,-0,-5.30779,-0.029412,-5.32031,-0,-5.32031,-0.029412,7.14059,-0,7.15311,-0,7.14059,-0.029412,7.15311,-0.029412]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.956863,0.956863,0.862745],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0049_Beige_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.956863,0.956863,0.862745],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "FF35E6C7-DFA2-3092-8AC0-3BED4A410CA9"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,6,10,10,10,42,59,58,61,0,25,24,26,10,10,10,42,62,63,64,0,26,24,25,11,11,11,42,65,64,63,0,6,25,24,11,11,11,42,67,68,69,0,27,28,29,5,5,5,42,68,67,70,0,28,27,30,5,5,5,42,71,72,73,0,30,27,28,4,4,4,42,74,73,72,0,29,28,27,4,4,4,42,76,77,78,0,4,31,32,11,11,11,42,77,76,79,0,31,4,7,11,11,11,42,80,81,82,0,7,4,31,10,10,10,42,83,82,81,0,32,31,4,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,26,37,31,3,3,3,42,93,92,95,0,37,26,25,3,3,3,42,96,97,98,0,25,26,37,2,2,2,42,99,98,97,0,31,37,26,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_1.003Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,3.15445,4.92126,0,3.15445,4.92126,0,2.38887,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,4.92126,0,0,-33.7008,0,0,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.044238,-0.124051,0,-0.084937,0.014177,-0.124051,0.058416,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,0.624089,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_1Default.002",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "D19B81F0-1FB8-3CA4-9709-86D6D9F5EF2D"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.007Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.006",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "0E7F6C07-0036-3CF2-A61A-36FF9128BF73"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [-0.499985,0,-0.866024,-0.707083,0,-0.707083,-0.866024,0,-0.499985,-0.258797,0,-0.965911,-0.965911,0,-0.258797,0,0,-1,-1,0,0,0.258797,0,-0.965911,-0.965911,0,0.258797,0.499985,0,-0.866024,-0.866024,0,0.499985,0.707083,0,-0.707083,-0.707083,0,0.707083,0.866024,0,-0.499985,-0.499985,0,0.866024,0.965911,0,-0.258797,-0.258797,0,0.965911,1,0,0,0,0,1,0.965911,0,0.258797,0.258797,0,0.965911,0.866024,0,0.499985,0.499985,0,0.866024,0.707083,0,0.707083],
                "faces": [42,0,1,2,0,0,1,2,0,1,1,42,1,0,3,0,3,2,1,1,0,0,42,1,12,2,0,4,5,6,1,2,1,42,12,1,13,0,7,6,5,2,1,2,42,18,3,0,0,8,9,10,3,0,0,42,3,18,19,0,11,10,9,0,3,3,42,13,24,12,0,12,13,14,2,4,2,42,24,13,25,0,15,14,13,4,2,4,42,30,18,31,0,16,17,18,5,3,5,42,18,30,19,0,19,18,17,3,5,3,42,25,36,24,0,20,21,22,4,6,4,42,36,25,37,0,23,22,21,6,4,6,42,42,30,31,0,24,25,26,7,5,5,42,30,42,43,0,27,26,25,5,7,7,42,37,48,36,0,28,29,30,6,8,6,42,48,37,49,0,31,30,29,8,6,8,42,54,42,55,0,32,33,34,9,7,9,42,42,54,43,0,35,34,33,7,9,7,42,49,60,48,0,36,37,38,8,10,8,42,60,49,61,0,39,38,37,10,8,10,42,66,55,67,0,40,41,42,11,9,11,42,55,66,54,0,43,42,41,9,11,9,42,61,72,60,0,44,45,46,10,12,10,42,72,61,73,0,47,46,45,12,10,12,42,78,66,67,0,48,49,50,13,11,11,42,66,78,79,0,51,50,49,11,13,13,42,73,84,72,0,52,53,54,12,14,12,42,84,73,85,0,55,54,53,14,12,14,42,90,79,78,0,56,57,58,15,13,13,42,79,90,91,0,59,58,57,13,15,15,42,84,96,97,0,60,61,62,14,16,16,42,96,84,85,0,63,62,61,16,14,14,42,102,91,90,0,64,65,66,17,15,15,42,91,102,103,0,67,66,65,15,17,17,42,96,108,97,0,68,69,70,16,18,16,42,108,96,109,0,71,70,69,18,16,18,42,114,103,102,0,72,73,74,19,17,17,42,103,114,115,0,75,74,73,17,19,19,42,108,120,121,0,76,77,78,18,20,20,42,120,108,109,0,79,78,77,20,18,18,42,126,115,114,0,80,81,82,21,19,19,42,115,126,127,0,83,82,81,19,21,21,42,120,132,121,0,84,85,86,20,22,20,42,132,120,133,0,87,86,85,22,20,22,42,138,127,126,0,88,89,90,23,21,21,42,127,138,139,0,91,90,89,21,23,23,42,132,139,138,0,92,93,94,22,23,23,42,139,132,133,0,95,94,93,23,22,22,42,4,5,6,1,0,0,0,22,22,23,42,7,6,5,1,0,0,0,23,23,22,42,14,6,15,1,0,0,0,21,23,21,42,7,15,6,1,0,0,0,23,21,23,42,20,21,4,1,0,0,0,20,20,22,42,5,4,21,1,0,0,0,22,22,20,42,26,14,27,1,0,0,0,19,21,19,42,15,27,14,1,0,0,0,21,19,21,42,20,32,21,1,0,0,0,20,18,20,42,33,21,32,1,0,0,0,18,20,18,42,38,26,39,1,0,0,0,17,19,17,42,27,39,26,1,0,0,0,19,17,19,42,44,45,32,1,0,0,0,16,16,18,42,33,32,45,1,0,0,0,18,18,16,42,50,38,51,1,0,0,0,15,17,15,42,39,51,38,1,0,0,0,17,15,17,42,44,56,45,1,0,0,0,16,14,16,42,57,45,56,1,0,0,0,14,16,14,42,62,50,63,1,0,0,0,13,15,13,42,51,63,50,1,0,0,0,15,13,15,42,56,68,57,1,0,0,0,14,12,14,42,69,57,68,1,0,0,0,12,14,12,42,74,62,75,1,0,0,0,11,13,11,42,63,75,62,1,0,0,0,13,11,13,42,80,81,68,1,0,0,0,10,10,12,42,69,68,81,1,0,0,0,12,12,10,42,86,74,87,1,0,0,0,9,11,9,42,75,87,74,1,0,0,0,11,9,11,42,92,93,80,1,0,0,0,8,8,10,42,81,80,93,1,0,0,0,10,10,8,42,86,87,98,1,0,0,0,9,9,7,42,99,98,87,1,0,0,0,7,7,9,42,104,105,92,1,0,0,0,6,6,8,42,93,92,105,1,0,0,0,8,8,6,42,110,98,111,1,0,0,0,5,7,5,42,99,111,98,1,0,0,0,7,5,7,42,116,117,104,1,0,0,0,4,4,6,42,105,104,117,1,0,0,0,6,6,4,42,110,111,122,1,0,0,0,5,5,3,42,123,122,111,1,0,0,0,3,3,5,42,128,129,116,1,0,0,0,2,2,4,42,117,116,129,1,0,0,0,4,4,2,42,134,122,135,1,0,0,0,0,3,0,42,123,135,122,1,0,0,0,3,0,3,42,140,141,128,1,0,0,0,1,1,2,42,129,128,141,1,0,0,0,2,2,1,42,134,135,140,1,0,0,0,0,0,1,42,141,140,135,1,0,0,0,1,1,0],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 96,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 144,
                    "normals": 24,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID493Geometry",
                "vertices": [0.444865,-0.231693,0.54186,0.437617,-0.256693,0.547422,0.437617,-0.231693,0.547422,0.444865,-0.256693,0.54186,0.444865,-0.256693,0.54186,0.444865,-0.231693,0.54186,0.437617,-0.256693,0.547422,0.437617,-0.231693,0.547422,0.437617,-0.256693,0.547422,0.444865,-0.256693,0.54186,0.437617,-0.231693,0.547422,0.444865,-0.231693,0.54186,0.432054,-0.231693,0.55467,0.432054,-0.256693,0.55467,0.432054,-0.256693,0.55467,0.432054,-0.231693,0.55467,0.432054,-0.256693,0.55467,0.432054,-0.231693,0.55467,0.453307,-0.231693,0.538363,0.453307,-0.256693,0.538363,0.453307,-0.256693,0.538363,0.453307,-0.231693,0.538363,0.453307,-0.256693,0.538363,0.453307,-0.231693,0.538363,0.428558,-0.231693,0.563112,0.428558,-0.256693,0.563112,0.428558,-0.256693,0.563112,0.428558,-0.231693,0.563112,0.428558,-0.256693,0.563112,0.428558,-0.231693,0.563112,0.462365,-0.256693,0.53717,0.462365,-0.231693,0.53717,0.462365,-0.256693,0.53717,0.462365,-0.231693,0.53717,0.462365,-0.256693,0.53717,0.462365,-0.231693,0.53717,0.427365,-0.231693,0.57217,0.427365,-0.256693,0.57217,0.427365,-0.256693,0.57217,0.427365,-0.231693,0.57217,0.427365,-0.256693,0.57217,0.427365,-0.231693,0.57217,0.471424,-0.231693,0.538363,0.471424,-0.256693,0.538363,0.471424,-0.256693,0.538363,0.471424,-0.231693,0.538363,0.471424,-0.256693,0.538363,0.471424,-0.231693,0.538363,0.428558,-0.231693,0.581229,0.428558,-0.256693,0.581229,0.428558,-0.256693,0.581229,0.428558,-0.231693,0.581229,0.428558,-0.256693,0.581229,0.428558,-0.231693,0.581229,0.479865,-0.256693,0.54186,0.479865,-0.231693,0.54186,0.479865,-0.256693,0.54186,0.479865,-0.231693,0.54186,0.479865,-0.256693,0.54186,0.479865,-0.231693,0.54186,0.432054,-0.231693,0.58967,0.432054,-0.256693,0.58967,0.432054,-0.256693,0.58967,0.432054,-0.231693,0.58967,0.432054,-0.256693,0.58967,0.432054,-0.231693,0.58967,0.487114,-0.256693,0.547422,0.487114,-0.231693,0.547422,0.487114,-0.256693,0.547422,0.487114,-0.231693,0.547422,0.487114,-0.256693,0.547422,0.487114,-0.231693,0.547422,0.437617,-0.231693,0.596919,0.437617,-0.256693,0.596919,0.437617,-0.256693,0.596919,0.437617,-0.231693,0.596919,0.437617,-0.256693,0.596919,0.437617,-0.231693,0.596919,0.492676,-0.231693,0.55467,0.492676,-0.256693,0.55467,0.492676,-0.256693,0.55467,0.492676,-0.231693,0.55467,0.492676,-0.256693,0.55467,0.492676,-0.231693,0.55467,0.444865,-0.231693,0.602481,0.444865,-0.256693,0.602481,0.444865,-0.256693,0.602481,0.444865,-0.231693,0.602481,0.444865,-0.256693,0.602481,0.444865,-0.231693,0.602481,0.496173,-0.231693,0.563112,0.496173,-0.256693,0.563112,0.496173,-0.256693,0.563112,0.496173,-0.231693,0.563112,0.496173,-0.256693,0.563112,0.496173,-0.231693,0.563112,0.453307,-0.256693,0.605978,0.453307,-0.231693,0.605978,0.453307,-0.256693,0.605978,0.453307,-0.231693,0.605978,0.453307,-0.256693,0.605978,0.453307,-0.231693,0.605978,0.497365,-0.231693,0.57217,0.497365,-0.256693,0.57217,0.497365,-0.256693,0.57217,0.497365,-0.231693,0.57217,0.497365,-0.256693,0.57217,0.497365,-0.231693,0.57217,0.462365,-0.231693,0.60717,0.462365,-0.256693,0.60717,0.462365,-0.256693,0.60717,0.462365,-0.231693,0.60717,0.462365,-0.256693,0.60717,0.462365,-0.231693,0.60717,0.496173,-0.231693,0.581229,0.496173,-0.256693,0.581229,0.496173,-0.256693,0.581229,0.496173,-0.231693,0.581229,0.496173,-0.256693,0.581229,0.496173,-0.231693,0.581229,0.471424,-0.256693,0.605978,0.471424,-0.231693,0.605978,0.471424,-0.256693,0.605978,0.471424,-0.231693,0.605978,0.471424,-0.256693,0.605978,0.471424,-0.231693,0.605978,0.492676,-0.231693,0.58967,0.492676,-0.256693,0.58967,0.492676,-0.256693,0.58967,0.492676,-0.231693,0.58967,0.492676,-0.256693,0.58967,0.492676,-0.231693,0.58967,0.479865,-0.231693,0.602481,0.479865,-0.256693,0.602481,0.479865,-0.256693,0.602481,0.479865,-0.231693,0.602481,0.479865,-0.256693,0.602481,0.479865,-0.231693,0.602481,0.487114,-0.231693,0.596919,0.487114,-0.256693,0.596919,0.487114,-0.256693,0.596919,0.487114,-0.231693,0.596919,0.487114,-0.256693,0.596919,0.487114,-0.231693,0.596919],
                "uvs": [[-5.81362,-0.058824,-5.81362,-0.073529,-5.82613,-0.058824,-5.82613,-0.073529,-17.6319,-0.058824,-17.6194,-0.058824,-17.6319,-0.073529,-17.6194,-0.073529,6.38881,-0.058824,6.38881,-0.073529,6.37629,-0.058824,6.37629,-0.073529,-28.2366,-0.058824,-28.2241,-0.058824,-28.2366,-0.073529,-28.2241,-0.073529,18.1437,-0.058824,18.1563,-0.058824,18.1437,-0.073529,18.1563,-0.073529,-36.9174,-0.058824,-36.9049,-0.058824,-36.9174,-0.073529,-36.9049,-0.073529,28.6868,-0.058824,28.6868,-0.073529,28.6743,-0.058824,28.6743,-0.073529,-43.0827,-0.058824,-43.0702,-0.058824,-43.0827,-0.073529,-43.0702,-0.073529,37.2504,-0.058824,37.2629,-0.058824,37.2504,-0.073529,37.2629,-0.073529,-46.3125,-0.058824,-46.3,-0.058824,-46.3125,-0.073529,-46.3,-0.073529,43.2874,-0.058824,43.2999,-0.058824,43.2874,-0.073529,43.2999,-0.073529,-46.3866,-0.058824,-46.3741,-0.058824,-46.3866,-0.073529,-46.3741,-0.073529,46.3866,-0.058824,46.3866,-0.073529,46.3741,-0.058824,46.3741,-0.073529,-43.2999,-0.058824,-43.2874,-0.058824,-43.2999,-0.073529,-43.2874,-0.073529,46.3125,-0.058824,46.3125,-0.073529,46.3,-0.058824,46.3,-0.073529,-37.2504,-0.058824,-37.2504,-0.073529,-37.2629,-0.058824,-37.2629,-0.073529,43.0827,-0.058824,43.0827,-0.073529,43.0702,-0.058824,43.0702,-0.073529,-28.6868,-0.058824,-28.6743,-0.058824,-28.6868,-0.073529,-28.6743,-0.073529,36.9174,-0.058824,36.9174,-0.073529,36.9049,-0.058824,36.9049,-0.073529,-18.1437,-0.058824,-18.1437,-0.073529,-18.1563,-0.058824,-18.1563,-0.073529,28.2366,-0.058824,28.2366,-0.073529,28.2241,-0.058824,28.2241,-0.073529,-6.38881,-0.058824,-6.37629,-0.058824,-6.38881,-0.073529,-6.37629,-0.073529,17.6319,-0.058824,17.6319,-0.073529,17.6194,-0.058824,17.6194,-0.073529,5.82613,-0.058824,5.82613,-0.073529,5.81362,-0.058824,5.81362,-0.073529]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.133333,0.133333,0.133333],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "__0136_Charcoal_",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [0.133333,0.133333,0.133333],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "92351E03-DD6E-3789-BDFD-42EF2DBFAB61"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.023Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.022",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "3AE40213-F5F7-3055-97B3-41E0031483EA"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0.931974,0.362438,0,-0.931974,-0.362438,0,1,0,0,-1,0,0,0,-1,0,0,1,0,0,0.362438,-0.931974,0,-0.362438,0.931974,0,0.362438,0.931974,0,-0.362438,-0.931974,0,0,1,0,0,-1,-0.931974,0.362438,0,0.931974,-0.362438,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,0,42,1,0,3,0,1,0,3,0,0,0,42,4,5,6,0,3,0,1,1,1,1,42,7,6,5,0,2,1,0,1,1,1,42,12,13,14,0,4,5,6,2,2,2,42,13,12,15,0,5,4,7,2,2,2,42,16,17,18,0,7,4,5,3,3,3,42,19,18,17,0,6,5,4,3,3,3,42,22,23,24,0,8,9,10,4,4,4,42,23,22,25,0,9,8,11,4,4,4,42,26,27,28,0,11,8,9,5,5,5,42,29,28,27,0,10,9,8,5,5,5,42,32,33,34,0,12,13,14,6,6,6,42,33,32,35,0,13,12,15,6,6,6,42,36,37,38,0,15,12,13,7,7,7,42,39,38,37,0,14,13,12,7,7,7,42,41,42,43,0,16,17,18,4,4,4,42,42,41,44,0,17,16,19,4,4,4,42,45,46,47,0,19,16,17,5,5,5,42,48,47,46,0,18,17,16,5,5,5,42,50,51,52,0,20,21,22,8,8,8,42,51,50,53,0,21,20,23,8,8,8,42,54,55,56,0,23,20,21,9,9,9,42,57,56,55,0,22,21,20,9,9,9,42,58,59,60,0,24,25,26,10,10,10,42,59,58,61,0,25,24,27,10,10,10,42,62,63,64,0,27,24,25,11,11,11,42,65,64,63,0,26,25,24,11,11,11,42,67,68,69,0,28,29,30,5,5,5,42,68,67,70,0,29,28,31,5,5,5,42,71,72,73,0,31,28,29,4,4,4,42,74,73,72,0,30,29,28,4,4,4,42,76,77,78,0,7,32,4,11,11,11,42,77,76,79,0,32,7,5,11,11,11,42,80,81,82,0,5,7,32,10,10,10,42,83,82,81,0,4,32,7,10,10,10,42,84,85,86,0,33,34,35,12,12,12,42,85,84,87,0,34,33,36,12,12,12,42,88,89,90,0,36,33,34,13,13,13,42,91,90,89,0,35,34,33,13,13,13,42,92,93,94,0,27,37,5,3,3,3,42,93,92,95,0,37,27,25,3,3,3,42,96,97,98,0,25,27,37,2,2,2,42,99,98,97,0,5,37,27,2,2,2],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 44,
                    "bones": 0,
                    "materials": 1,
                    "morphTargets": 0,
                    "vertices": 100,
                    "normals": 14,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "pin_2.010Geometry",
                "vertices": [2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,3.15445,4.92126,3.15445,3.15445,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,0,2.38887,6.88976,0.765579,2.38887,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,3.15445,4.92126,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,3.15445,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,3.15445,4.92126,0,0,4.92126,3.15445,0,4.92126,0,0,4.92126,0,0,4.92126,3.15445,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0,4.92126,0,0,4.92126,0,3.15445,4.92126,0,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,0.765579,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,2.38887,6.88976,2.38887,2.38887,6.88976,2.38887,2.38887,6.88976,0.765579,0.765579,6.88976,2.38887,0.765579,6.88976,0.765579,0.765579,6.88976,2.38887,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,3.15445,4.92126,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,2.38887,6.88976,2.38887,0.765579,6.88976,2.38887,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,3.15445,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,3.15445,3.15445,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,3.15445,-33.7008,0,3.15445,-33.7008,0,3.15445,-33.7008,3.15445,0,-33.7008,0,0,-33.7008,3.15445,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,-33.7008,0,0,-33.7008,0,3.15445,-33.7008,0,0,4.92126,0,3.15445,4.92126,0,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0.765579,6.88976,2.38887,0.765579,6.88976,2.38887,0,4.92126,3.15445,0.765579,6.88976,0.765579,0,4.92126,0,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0,0,4.92126,3.15445,0,4.92126,3.15445,0,-33.7008,3.15445,0,4.92126,0,0,-33.7008,0],
                "uvs": [[0.014177,-0.102877,0.058416,-0.063763,-0,-0.063763,0.044238,-0.102877,0.058416,-0.091134,-0,0.624089,-0,-0.091134,0.058416,0.624089,0.058416,0,0,0.058416,0,0,0.058416,0.058416,0.058416,-0.084937,0.014177,-0.124051,0.044238,-0.124051,0,-0.084937,0.044238,0.014177,0.014177,0.044238,0.014177,0.014177,0.044238,0.044238,-0,-0.063763,-0.044238,-0.102877,-0.014177,-0.102877,-0.058416,-0.063763,-0,0.624089,-0.058416,-0.091134,-0,-0.091134,-0.058416,0.624089,-0.058416,0.058416,0,0,0,0.058416,-0.058416,0,0,-0.091134,-0.058416,-0.084937,-0.014177,-0.124051,0,-0.084937,-0.044238,-0.124051,0,-0.091134]]
            },
            "materials": [{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [1,1,1],
                "DbgColor": 15658734,
                "blending": "NormalBlending",
                "colorSpecular": [0.5,0.5,0.5],
                "DbgName": "pin_2Default.009",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "transparent": false,
                "shading": "phong",
                "colorDiffuse": [1,1,1],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "AB085745-896D-3AAB-A8C3-F04632A12CAC"
        },{
            "data": {
                "skinWeights": [],
                "skinIndices": [],
                "animations": [],
                "bones": [],
                "normals": [0,-0.999969,0,0,-1,0,0,1,0,0,0.999969,0],
                "faces": [42,0,1,2,0,0,1,2,0,0,1,42,1,0,3,0,1,0,3,0,0,1,42,4,5,6,1,3,0,1,2,3,3,42,7,6,5,1,2,1,0,2,3,3],
                "morphTargets": [],
                "metadata": {
                    "generator": "io_three",
                    "version": 3,
                    "faces": 4,
                    "bones": 0,
                    "materials": 2,
                    "morphTargets": 0,
                    "vertices": 12,
                    "normals": 4,
                    "uvs": 1
                },
                "influencesPerVertex": 2,
                "name": "ID684Geometry",
                "vertices": [0.602337,-0.406693,0.313159,0.359632,-0.406693,0.463159,0.359632,-0.406693,0.313159,0.602337,-0.406693,0.463159,0.602337,-0.406693,0.463159,0.602337,-0.406693,0.313159,0.359632,-0.406693,0.463159,0.359632,-0.406693,0.313159,0.359632,-0.406693,0.463159,0.602337,-0.406693,0.463159,0.359632,-0.406693,0.313159,0.602337,-0.406693,0.313159],
                "uvs": [[23.8091,17.1704,23.4766,17.2586,23.4766,17.1704,23.8091,17.2586]]
            },
            "materials": [{
                "DbgIndex": 1,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15597568,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_9",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_9.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            },{
                "DbgIndex": 0,
                "depthWrite": true,
                "colorEmissive": [0,0,0],
                "colorAmbient": [0.8,0.8,0.8],
                "DbgColor": 15658734,
                "mapDiffuseAnisotropy": 1,
                "blending": "NormalBlending",
                "colorSpecular": [0.01,0.01,0.01],
                "DbgName": "material_8",
                "depthTest": true,
                "specularCoef": 50,
                "wireframe": false,
                "mapDiffuse": "material_8.jpg",
                "mapDiffuseRepeat": [1,1],
                "transparent": false,
                "shading": "phong",
                "mapDiffuseWrap": ["RepeatWrapping","RepeatWrapping"],
                "colorDiffuse": [0.8,0.8,0.8],
                "opacity": 1,
                "visible": true
            }],
            "type": "Geometry",
            "uuid": "3FFE75C8-E21D-3A6D-AA2A-D26467E83391"
        }]
    };

    var s = store( a, true );
    var c = load( s );

    this.assert
        ( c )
        ( JSON.stringify(a) == JSON.stringify(c), JSON.stringify(c) )

});
*/