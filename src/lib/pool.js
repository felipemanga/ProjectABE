var nextUID = 0;

function getUID(){
    return ++nextUID;
}

function Pool() {
    var methods = {
        constructor: []
    };
    var silence = {
        "onTick": 1,
        "onPostTick": 1,
        "onRender": 1
    };
    var debug = null;
    var proxies = [];
    var contents = {};

    function onEvent(e) {
        var target = e.target;
        var names = (target.className || "").split(/\s+/).filter(function(n) {
            return n.length > 0;
        });

        var event = e.type;
        event = event.substr(0, 1).toUpperCase() + event.substr(1);

        while (target) {
            var id = target.id;
            if (target.onclick) return;
            if (id) {
                id = id.substr(0, 1).toUpperCase() + id.substr(1);

                var i = 0,
                    name;
                if (names.length) {
                    while (name = names[i++]) {
                        name = name.substr(0, 1).toUpperCase() + name.substr(1);
                        $$("on" + event + id + name, target);
                    }
                } else {
                    $$("on" + event + id, target);
                }
                break;
            }
            target = target.parentNode;
        }
    }

    this.registerEvents = function(target, args) {
        if (!args && target && DOC.typeOf(target) == "array") {
            args = target;
            target = null;
        }
        if (!target) target = document.body;
        if (!args) {
            args = [];
            for (var k in target) {
                var m = k.match(/^on(.+)/);
                if (!m) continue;
                args.push(m[1]);
            }
        }
        args.forEach(function(arg) {
            target.addEventListener(arg, onEvent);
        });
    };

    this.debug = function(m) {
        debug = m;
    };

    this.silence = function(m) {
        silence[m] = 1;
    };

    this.addProxy = function(obj) {
        if (obj && obj.call) proxies.push(obj);
    };

    this.removeProxy = function(obj) {
        var i = proxies.indexOf(obj);
        if (i == -1) return;
        proxies.splice(i, 1);
    };

    this.add = function(obj, enableDirectMsg) {
        if (!obj) return;
        if (debug && obj.constructor.name == debug) console.log("add", obj);

        if (!("__uid" in obj)) obj.__uid = getUID();

        if (!("__uid" in obj)) console.warn("Could not add __uid to ", obj, obj.constructor.name);

        contents[obj.__uid] = obj;
        var clazz = obj.constructor;
        if (obj.methods || clazz.methods) {
            var arr = obj.methods || clazz.methods;
            if (!(arr instanceof Array)) arr = Object.keys(arr);
            var l = arr.length;
            for (var i = 0; i < l; ++i) {
                var m = arr[i];
                if (m && m[0] != "_") {
                    this.listen(obj, m, enableDirectMsg);
                    if (clazz.meta[m] && clazz.meta[m].silence) this.silence(m);
                }
            }
        } else {
            var properties = {}, cobj = obj;
            do{
                Object.assign( properties, Object.getOwnPropertyDescriptors(cobj) );
            }while( cobj = Object.getPrototypeOf(cobj) );

            for ( var k in properties ) {
                if (typeof obj[k] != "function") continue;
                if (k && k[0] != "_") this.listen(obj, k);
            }
        }
    };

    this.remove = function(obj) {
        if (obj.constructor.name == debug) console.log("remove", obj);

        delete contents[obj.__uid];

        for (var k in (obj.methods || obj.constructor.methods || obj))
        this.mute(obj, k);
    };

    this.poll = function(t) {
        if (!t) return contents;
        var keys = Object.keys(contents);
        var ret = [];
        var count = 0;
        for (; count < keys.length; ++count)
        ret.push(t(contents[keys[count]]));
        return ret;
    };

    this.listen = function(obj, name, enableDirectMsg) {
        var method = obj[name];
        if (typeof method != "function") return;

        var arr = methods[name];
        if (!arr) arr = methods[name] = {};
        arr[obj.__uid] = {
            THIS: obj,
            method: method
        };

        if (enableDirectMsg) {
            arr = methods[name + obj.__uid];
            if (!arr) arr = methods[name + obj.__uid] = {};
            arr[obj.__uid] = {
                THIS: obj,
                method: method
            };
        }
    };

    this.mute = function(obj, name) {
        var method = obj[name];
        var listeners = methods[name];
        if (!listeners) return;
        delete listeners[obj.__uid];
    };

    this.call = function(method) {
        if (method === undefined) {
            console.error("Undefined call");
            return;
        }

        var i, l;

        /* * /
    var args = Array.prototype.slice.call(arguments, 1);
    /*/
        var args = new Array(arguments.length - 1);
        for (i = 1, l = arguments.length; i < l; i++) args[i - 1] = arguments[i];
        /* */

        for (i = 0; i < proxies.length; ++i) {
            proxies[i].call(method, args);
        }

        var listeners = methods[method];
        if (!listeners) {
            if (!(method in silence)) console.log(method + ": 0");
            return;
        }

        var keys = Object.keys(listeners);
        var ret; //=undefined
        var count = 0,
            c;
        for (; count < keys.length; ++count) {
            c = listeners[keys[count]];

            // DEBUG
            if (debug && (method == debug || c.THIS.constructor.name == debug)) console.log(c.THIS, method, args);
            // END-DEBUG

            var lret = c && c.method.apply(c.THIS, args);
            if (lret !== undefined) ret = lret;
        }
        if (!(method in silence)) console.log(method + ": " + count);
        return ret;
    };
}

module.exports = Pool;