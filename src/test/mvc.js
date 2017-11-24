import {Model} from '../lib/mvc.js';
import {load, store} from '../lib/strldr.js';
import test from './test.js';

test("MVC");

test(function basicModelTest(){

    var m = new Model();
    m.load({a:1, b:[2,3,4], c:{x:5}});
    m.setItem("b.1",9);
    this.assert
        (m.dirty)
        (m.data['a']      == 1)
        (m.getItem("a")   == 1)
        (m.getItem("b.0") == 2)
        (m.getItem("b.1") == 9)
        (m.getItem("c.x") == 5)
        (m.getItem("c").x == 5)
        
});

test(function serializeModel(){

    var m = new Model();

    var a = {value:"a"};

    m.setItem( "a",   a );
    m.setItem( "b.a", a );
    m.setItem( "a.value", "A" );

    var clone1 = (new Model()).load( m.store() );
    clone1.setItem("a.other", "bacon");

    this.assert
        ( m.getItem("b.a.value")      === "A" )
        ( clone1.getItem("b.a.value") === "A" )
        ( clone1.getItem("b.a.other") === "bacon" )
        ( clone1.getModel("b.a").getItem("other") === "bacon" );
    
});


test(function objarrRoundTrip(){
    var bytes = new Uint8Array(5);
    bytes[1] = 20;

    var a = {data:bytes, stuff:{"ide":"js","project":{"files":[{"name":"main.itch","contents":bytes}]}}};
    var b = (new Model()).load(a);
    var c = (new Model()).load( JSON.stringify( b.store(false) ) );
    var d = (new Model()).load( b.store() );

    d.data.data[2] = 10;

    this.assert
        ( c.data.data[1] == 20 )
        ( c.data.data instanceof Uint8Array )
        ( d.data.data[1] == 20 )
        ( d.data.data instanceof Uint8Array )
        ( d.data.stuff.project.files[0].contents[2] == 10 )

});

test(function attachToModel(){

    var m = new Model();
    var raised = false,
        value = undefined,
        key = undefined;

    m.setItem("a.b.c", 1);
    m.attach("a.b.c", function( _value, _key ){
        raised = true;
        value = _value;
        key = _key;
    });
    m.setItem("a.b.c", 2);


    this.assert
        (raised)
        (value === 2)
        (key === "c");
});

test(function attachToFutureModel(){

    var m = new Model();
    var raised = false,
        value = undefined,
        key = undefined;

    m.attach("a.b.c", function( _value, _key ){
        raised = true;
        value = _value;
        key = _key;
    });
    m.setItem("a.b.c", 2);


    this.assert
        (raised)
        (value === 2)
        (key === "c");
});


test(function attachToModelThenAddChildModel(){

    var m = new Model();
    var raised = 0,
        value = undefined,
        key = undefined;

    m.attach("a", function( _value, _key ){
        raised++;
        value = _value;
        key = _key;
    });
    m.attach("a.b", function( _value, _key ){
        raised++;
    });
    m.setItem("a.b.c", 2);


    this.assert
        (raised === 2)
        (value)
        (value.b)
        (value.b.c === 2)
        (key === "a");
})


test(function removeItem(){

    var m = new Model();
    var raised = false,
        value = undefined,
        key = undefined;

    m.setItem("a.b.c", 1);
    m.attach("a.b.c", function( _value, _key ){
        raised = true;
        value = _value;
        key = _key;
    });
    m.removeItem("a.b.c");

    this.assert
        (raised)
        (value === undefined)
        (key === "c");

});



test(function removeModel(){

    var m = new Model();

    m.setItem("a.b.c", 1);
    var a = m.getModel("a");
    m.removeItem("a");

    this.assert
        ( Object.keys(a.parents).length === 0 )
        ( Object.keys(m.children).length === 0 )
        ( Object.keys(m.revChildren).length === 0 )
        
});


test(function attachToCircularModel(){

    var m = new Model();
    var raised = false,
        value = undefined,
        key = undefined;

    m.attach("a.b.c", function( _value, _key ){
        raised = true;
        value = _value;
        key = _key;
    });
    m.setItem("x", m.getItem("a.b"));
    m.setItem("x.a", m.getItem("a"));
    m.setItem("x.a.b.a.b.a.b.a.b.c", 2);

    this.assert
        (raised)
        (value === 2)
        (key === "c");

});

