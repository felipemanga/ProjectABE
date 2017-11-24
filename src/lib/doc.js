
var logContainer = null;

function __debugArgs(args) {
    var buf = "";
    for (var i = 0; i < args.length; i++) {
        var s = args[i];
        if (s === undefined) buf += "undefined";
        else if (s === null) buf += "null";
        else if (typeof s == "object") buf += "[object " + (s.constructor && (s.constructor.NAME || s.constructor.name)) + "]";
        else if (typeof s == "function") buf += "[function " + (s.NAME || s.name) + "]";
        else if (s && typeof s.toString == "function") buf += s.toString();
        else buf += s;
        buf += " ";
    }
    return buf;
}

function __debugAppend(e) {
    if (!logContainer) {
        logContainer = document.createElement("div");
        logContainer.style.position = "absolute";
        logContainer.style.top = 0;
        logContainer.style.pointerEvents = "none";
    }
    if (!logContainer.parentNode) document.body.appendChild(logContainer);
    var max = (document.body.innerHeight || document.body.clientHeight || 100) / 2;
    var lineHeight = 16;
    logContainer.appendChild(e);
    while (logContainer.children.length * lineHeight > max)
    logContainer.removeChild(logContainer.children[0]);
}

function LOG(txt) {
    var fulltext = __debugArgs(arguments);
    //if( !document.body )
    console.log(fulltext);
    /* FOR DEBUGGING ONLY * /
		var e = document.createElement("div");
		e.innerHTML = fulltext;
		__debugAppend(e);
	/* */
}

if (!self.window) self.window = self;

function ERROR(txt) {
    var fulltext = __debugArgs(arguments);
    console.warn(fulltext);
    /* FOR DEBUGGING ONLY */
    if (self.document && self.document.body) {
        var e = document.createElement("div");
        e.innerHTML = "<span style='color: red'>ERROR:</span>" + fulltext;
        __debugAppend(e);
    }
    /* */
}

self.onerror = function() {
    if (self.__ignoreErrors) return;
    ERROR.apply(self, Array.prototype.slice.call(arguments));
};

(function() {
    "use strict";

    self.RTCPeerConnection = self.RTCPeerConnection || self.mozRTCPeerConnection || self.webkitRTCPeerConnection;
    self.RTCSessionDescription = self.RTCSessionDescription || self.mozRTCSessionDescription;
    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

    Math.sign = Math.sign || function(s) {
        if (s < 0) return -1;
        if (s === 0) return 0;
        return 1;
    };

    Object.sort = function(obj, cb) {
        if (cb === undefined) cb = "priority";
        if (typeof cb == "string") {
            var key = cb;
            cb = function(obj, a, b) {
                return (obj[a][key] || 0) - (obj[b][key] || 0);
            };
        }
        return Object.keys(obj).sort(cb.bind(null, obj));
    };

    // Production steps of ECMA-262, Edition 5, 15.4.4.18
    // Reference: http://es5.github.io/#x15.4.4.18
    if (!Array.prototype.forEach) {

        Array.prototype.forEach = function(callback, thisArg) {

            var T, k;

            if (this === null) {
                throw new TypeError(' this is null or not defined');
            }

            // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If IsCallable(callback) is false, throw a TypeError exception.
            // See: http://es5.github.com/#x9.11
            if (typeof callback !== "function") {
                throw new TypeError(callback + ' is not a function');
            }

            // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (arguments.length > 1) {
                T = thisArg;
            }

            // 6. Let k be 0
            k = 0;

            // 7. Repeat, while k < len
            while (k < len) {

                var kValue;

                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                if (k in O) {

                    // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                    kValue = O[k];

                    // ii. Call the Call internal method of callback with T as the this value and
                    // argument list containing kValue, k, and O.
                    callback.call(T, kValue, k, O);
                }
                // d. Increase k by 1.
                k++;
            }
            // 8. return undefined
        };
    }


    if (!window.performance) {
        window.performance = window.performance || {};
        performance.now = (function() {
            return performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow || Date.now; /*none found - fallback to browser default */
        })();
    }

    RegExp.prototype.forEach = function(src, cb) {
        var match;
        while ((match = this.exec(src)))
        cb(match);
    };

    RegExp.prototype.replace = function(src, cb) {
        var match, acc = "",
            lmp = 0;
        while ((match = this.exec(src))) {
            acc += src.substr(lmp, match.index - lmp);
            lmp = match.index + match[0].length;
            acc += cb(match);
        }
        acc += src.substr(lmp);
        return acc;
    };

    var readyCB = [];
    window.need = function(deps, cb, url) {
        if (typeof deps == "string") deps = deps.split(" ");
        for (var i = 0; i < deps.length; ++i) {
            var dep = deps[i];
            if (typeof dep == "string") {
                deps[i] = {
                    FQCN: dep,
                    URL: dep.replace(/\./g, "/") + ".js",
                    NEEDS: null
                };
            } else if (!dep.FQCN) {
                var ext = dep.URL.match(/\.[a-zA-Z0-9]+$/);
                ext = (ext || [""])[0].toLowerCase();

                var path = dep.URL;
                if (ext != "css") path = path.replace(/\.[a-zA-Z0-9]+$/, '');

                dep.FQCN = path.replace(/[\\/]+/g, '.');
            }
        }
        readyCB.push({
            deps: deps,
            cb: cb,
            url: url
        });
    };

    function Resolve(name, ctx) {
        this.key = name;
        var setCB = [];
        this.get = function() {
            return DOC.resolve(name, ctx);
        };
        this.set = function(v) {
            for (var i = 0, f;
            (f = setCB[i]); ++i)
            f(v);

            return DOC.resolve(name, ctx, v);
        };
        this.onSet = function(f) {
            setCB.push(f);
            return this;
        };
    }

    function Loader() {
        var skip = {};

        var queueSize = 1;
        var parseQueue = [];
        var started = false;
        var THIS = this;

        this.onload = null;

        this.register = function(name, data) {
            if (typeof name == "string") {
                if (/^url:/.test(name)) name = name.replace(/^url:/, "").replace(/\//g, ".").replace(/\.[a-zA-Z0-9]+$/, "");
                name = new Resolve(name);
            }
            name.set(data);
            // DOC.resolve( name, null, data );
        };

        this.start = function(onload) {
            if (onload && !this.onload) this.onload = onload;

            if (started) return;
            started = true;
            popQueue("START");
        };

        this.getURL = getURL;

        this.skipped = false;

        this.load = function load(url, name) {
            if (!url || url in skip) {
                this.skipped = true;
                return this;
            }
            this.skipped = false;

            var THIS = this,
                se, args;
            queueSize++;
            url = url.replace(/\$nocache\$/i, Math.random() + "");
            if (!name) name = "url:" + url;
            var ext = url.match(/(\.[a-zA-Z0-9_]*)(?:$|\?)/);
            ext = (ext && ext[1]) || url;

            skip[url] = true;
            if (window.CACHE_KILL) {
                if (url.indexOf("?") != -1) url += "&";
                else url += "?CK=";
                url += window.CACHE_KILL;
            }

            if (ext.match(/\.js$/)) {
                skip[url] = true;

                if (arguments.length == 1) {
                    if (self.document) {
                        se = document.createElement("script");
                        se.addEventListener("load", popQueue.bind(null, url));
                        se.addEventListener("error", function() {});
                        se.src = url;
                        document.head.appendChild(se);
                    } else {
                        this.getURL(url, function(src) {
                            eval(src);
                            popQueue(url);
                        });
                    }
                } else {
                    var args = JSON.stringify(Array.prototype.slice.call(arguments, 1));
                    this.getURL(url, function(src) {
                        src = "need(" + args + ", function(){\n" + src + "\n}, \"" + url + "\");";
                        var s = document.createElement("script");
                        s.textContent = src;
                        document.head.appendChild(s);
                        popQueue(url);
                    });
                }
            } else if (ext.match(/\.css$/)) {
                var q = Array.prototype.slice.call(arguments, 1).join(" ");
                if (window.matchMedia(q).matches) {
                    se = document.createElement("link");
                    se.addEventListener("load", function() {
                        DOC.resolve(url.replace(/[\\/]+/g, '.'), null, se);
                        popQueue(url);
                    });
                    se.href = url;
                    se.rel = "stylesheet";
                    se.type = "text/css";
                    document.head.appendChild(se);
                } else {
                    popQueue(url);
                }
            } else if (ext.match(/\.woff2/)) {
                this.getURL(url, function(src) {
                    var s = document.createElement("style");
                    s.textContent = "@font-face{" + "font-family: '" + (name.key || name.replace(/^.*[\\\/]|\.[a-zA-Z0-9]+$/g, '')) + "';\n" + "font-style: normal;\n" + "font-weight: 400;\n" + "src: url(data:application/x-font-woff;charset=utf-8;base64," + btoa(src) + ") format('woff2');\n" + "}";
                    document.head.appendChild(s);
                    setTimeout(

                    function() {
                        THIS.register(name, true);
                        popQueue(url);
                    }, 100);
                }, {
                    binary: true
                });
            } else if (ext.match(/\.png$|\.jpg$|\.gif$/i)) {
                var ie = document.createElement("img");
                ie.addEventListener("load", function() {
                    THIS.register(name, ie);
                    DOC.remove(ie);
                    popQueue(url);
                });
                ie.src = url;
                document.head.appendChild(ie);
            } else if (ext.match(/\.wav|\.mp3|\.ogg$/i)) {
                var ae = new Audio();
                ae.preload = true;
                var CPT = ae.canPlayType("audio/" + ext.replace(/^\./, ""));
                var loaded = false;
                var onLoadSound = function() {
                    if (loaded) return;
                    loaded = true;
                    THIS.register(name, ae);
                    popQueue(url);
                    ae.removeEventListener("canplaythrough", onLoadSound);
                };
                ae.addEventListener("canplaythrough", onLoadSound);
                // if( CPT != "probably")
                setTimeout(onLoadSound, 1000);
                ae.addEventListener("error", function() {});
                ae.src = url;
            } else {
                args = arguments;
                this.getURL(url, function(data) {
                    if (Array.prototype.indexOf.call(args, "noparse") == -1) {
                        if (ext.match(/.*\.(json|scon)$/)) {
                            try {
                                data = JSON.parse(data);
                            } catch (e) {
                                console.warn(e, data);
                            }
                        }
                    }
                    THIS.register(name, data);
                    popQueue(name);
                });
            }
            return this;
        };

        function popQueue(name) {
            var i, j, obj, dep, hnd, fail;
            queueSize--;
            // if( queueSize < 4 )
            // LOG("queueSize:", queueSize, name);

            if (queueSize === 0) {
                parseQueue.forEach(function(f) {
                    f();
                });

                var tryAgain = true;
                while (readyCB.length && tryAgain) {
                    tryAgain = false;
                    for (i = 0;
                    (obj = readyCB[i]); ++i) {
                        fail = false;
                        for (j = 0; !fail && (dep = obj.deps[j]); ++j) {
                            hnd = DOC.resolve(dep.FQCN, null, false, true);
                            fail = !(hnd.obj && hnd.key in hnd.obj);
                            // if( fail ) LOG("Failed dep: ", dep.FQCN);
                        }
                        if (!fail) {
                            if (obj.cb) {
                                obj.cb.call(window);
                                obj.cb = null;
                            }
                            readyCB.splice(i--, 1);
                            tryAgain = true;
                        }
                    }
                }

                if (queueSize === 0) {
                    if (readyCB.length) {
                        var pending = false,
                            pendingFail;
                        for (i = 0;
                        (obj = readyCB[i]); ++i) {
                            for (j = 0;
                            (dep = obj.deps[j]); ++j) {
                                hnd = DOC.resolve(dep.FQCN, null, false, true);
                                fail = !(hnd.obj && hnd.key in hnd.obj);
                                if (fail) {
                                    if (dep.NEEDS) THIS.load.apply(THIS, [dep.URL].concat(dep.NEEDS));
                                    else THIS.load(dep.URL);
                                    pending |= !THIS.skipped;
                                    if (THIS.skipped) pendingFail = dep.FQCN;
                                }
                            }
                        }
                        if (!pending) {
                            console.log("Could not fulfill need:", pendingFail);
                            debugger;
                        }
                        return;
                    }

                    started = false;
                    queueSize = 1;
                    if (THIS.onload) THIS.onload();
                }
            }
        }
    }

    function resolve(strpath, octx, writeValue, returnHandle) {
        octx = octx || window;
        var i, ctx = octx;
        var path = strpath instanceof Array ? strpath : strpath.split(".");

        if (path[0] == "this") path.shift();

        path = path.map(function(s) {
            return s.replace(/\\_/g, ".");
        });

        if (writeValue === undefined && !returnHandle) {
            for (i = 0; i < path.length && ctx; ++i)
            ctx = ctx[path[i]];

            if (i < path.length && octx.parentCTX) ctx = resolve(path, octx.parentCTX);
        } else {
            var isNew = false;
            for (i = 0; i < path.length - 1; ++i) {
                if (!ctx) break;
                if (!(path[i] in ctx)) {
                    isNew = true;
                    if (writeValue) ctx[path[i]] = {};
                }
                ctx = ctx[path[i]];
            }
            if (returnHandle) {
                if (path.length) ctx = {
                    obj: ctx,
                    key: path[i],
                    value: ctx && ctx[path[i]],
                    isNew: isNew || (path.length && (!ctx || (ctx && !(path[i] in ctx)))),
                    parentIsNew: isNew
                };
                else {
                    ctx = {
                        obj: ctx,
                        key: "this",
                        value: ctx,
                        isNew: false,
                        parentIsNew: false
                    };
                }
            } else if (ctx) return ctx[path[i]] = writeValue;
        }

        return ctx;
    }

    function postURL(url, data, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status === 0)) cb(xhr.response || xhr.responseText);
        };
        var acc = "",
            v;
        for (var k in data) {
            v = data[k];
            if (typeof v != "string") v = JSON.stringify(v);
            acc += k + "=" + encodeURIComponent(v) + "&";
        }
        xhr.send(acc);
    }

    function postJSONURL(url, data, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var ret = xhr.response || xhr.responseText;
                try {
                    ret = JSON.parse(ret);
                } catch (e) {}
                cb(ret);
            }
        };
        xhr.send(JSON.stringify(data));
    }

    function getURL(url, cb, cfg) {
        function bindec(v) {
            var r = '',
                cc;
            for (var i = 0; i < v.length; ++i) {
                cc = v.charCodeAt(i);
                r += String.fromCharCode(cc & 0xFF);
            }
            return r;
        }

        var xhr = new XMLHttpRequest();
        cfg = cfg || {};
        if (cfg.binary) xhr.overrideMimeType("text/plain; charset=x-user-defined");

        if (/^blob:.*/.test(location.href) && !/^[a-z]+:.*/i.test(url)) url = location.origin + (DOC.locationPath || "/") + url;

        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status === 0 || cfg.anystate)) {
                var v = xhr.response || xhr.responseText;
                if (xhr.status == 0 && v == "" && cfg.proxy) {
                    var domain = url.match(/([^:]*\/\/[^\/]+).*/);
                    if (domain && domain[1].toLowerCase() != location.origin) {
                        var altcfg = DOC.mergeTo({}, cfg);
                        altcfg.proxy = null;
                        getURL(cfg.proxy + encodeURIComponent(url), function(obj) {
                            if (!obj) return;
                            obj = JSON.parse(obj);
                            var v = obj.contents;
                            if (cfg.binary) v = bindec(v);
                            cb(v);
                        }, altcfg);
                        return;
                    }
                }

                if (cfg.binary) v = bindec(v);
                cb(v, xhr.status);
            }
        };
        xhr.send();
    }

    function newApply(clazz, args) {
        return new(clazz.bind.apply(clazz, [null].concat(args)));
    }

    function TEXT(txt) {
        var html = null,
            i, l;
        if (txt instanceof HTMLElement) {
            html = txt;
            txt = txt.dataset.i18n || txt.textContent;
            if (txt.trim() == "") return;
            var param = [];
            for (i = 0, l = arguments.length; i < l; ++i) param[i] = arguments[i];

            for (i = 0, l = html.childNodes.length; i < l; ++i) {
                var child = html.childNodes[i];
                if (child instanceof Text) {
                    var old = child.i18n || child.nodeValue;
                    child.i18n = old;
                    param[0] = old;
                    child.nodeValue = TEXT.apply(null, param);
                }
            }
            return html;
        }

        if (typeof txt != "string") return;

        var dict = TEXT.languages[TEXT.language],
            prefix = "",
            suffix = "";
        if (dict) {
            if (dict[txt]) txt = dict[txt];
            else {
                var m = txt.match(/^([^a-z0-9]*)(.*?)([^a-z0-9]*)$/i);
                if (m && dict[m[2]]) {
                    prefix = m[1];
                    txt = dict[m[2]];
                    suffix = m[3];
                }
            }
        }

        for (i = 1; i < arguments.length; ++i)
        txt = txt.replace(new RegExp("%" + i, "g"), arguments[i]);

        var exp = /\{([a-zA-Z.]+)\}/;
        var pos = 0;
        while (m = txt.match(exp))
        txt = txt.substr(0, m.index) + DOC.resolve(m[1], DOC.TEXT.context) + txt.substr(m.index + m[0].length);

        txt = prefix + txt + suffix;
        return txt;
    }
    TEXT.context = null;
    TEXT.language = navigator.language;
    TEXT.languages = {};
    TEXT.addTexts = function(language, textObj) {
        if (!TEXT.languages[language]) TEXT.languages[language] = {};
        if (!textObj || typeof textObj != "object") return;
        DOC.mergeTo(TEXT.languages[language], textObj);
    };
    TEXT.chooseLanguage = function(available) {
        // return TEXT.language = "pt-BR";
        if (!available) return;

        var ai = {};
        available.forEach(function(v) {
            var l = v.replace(/^([a-z][a-z])-.*/i, "$1");
            ai[l.toLowerCase()] = v;
            ai[v] = v;
        });

        var languages = navigator.languages || [navigator.language];
        for (var i = 0, l = languages.length; i < l; ++i) {
            if (ai[languages[i]]) return TEXT.language = ai[languages[i]];
            var ulang = (languages[i] || "").replace(/^([a-z][a-z])-.*/i, "$1").toLowerCase();
            if (ai[ulang]) return TEXT.language = ai[ulang];
        }

        return TEXT.language = available[0];
    };
    TEXT.i18n = function(obj) {
        if (!obj) return;
        for (var k in obj) {
            TEXT.addTexts(k, obj[k]);
        }
    },
    TEXT.batch = function(el) {
        if (el instanceof Element) TEXT(el);
        if (el.children) for (var i = 0, c; c = el.children[i]; ++i) TEXT.batch(c);
    };

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
            if (debug && obj.constructor.name == debug) LOG("add", obj);

            if (!("__uid" in obj)) obj.__uid = DOC.getUID();

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
            if (obj.constructor.name == debug) LOG("remove", obj);

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

            var i;

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
                if (!(method in silence)) LOG(method + ": 0");
                return;
            }

            var keys = Object.keys(listeners);
            var ret; //=undefined
            var count = 0,
                c;
            for (; count < keys.length; ++count) {
                c = listeners[keys[count]];

                // DEBUG
                if (debug && (method == debug || c.THIS.constructor.name == debug)) LOG(c.THIS, method, args);
                // END-DEBUG

                var lret = c && c.method.apply(c.THIS, args);
                if (lret !== undefined) ret = lret;
            }
            if (!(method in silence)) LOG(method + ": " + count);
            return ret;
        };
    }

    var DOC = {

        Pool: Pool,

        // DOM FUNCTIONS

        locationPath: location.pathname,

        onTilt: function(cb) {
            if (window.DeviceOrientationEvent) {
                window.addEventListener("deviceorientation", function() {
                    cb(event.beta, event.gamma, event.alpha, event.absolute, event);
                }, true);
            } else return false;
            return true;
        },


        isPointerLocked: function() {
            return document.pointerLockElement != null;
        },

        lockPointer: function(lock, el) {
            el = el || document.documentElement;
            if (lock) {
                el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock;
                el.requestPointerLock();
            } else {
                document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
                document.exitPointerLock();
            }
        },

        isFullScreen: function() {
            var doc = window.document;
            return doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement || false;
        },

        toggleFullScreen: function(toggle) {
            var doc = window.document;
            var docEl = doc.documentElement;

            var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
            var state = this.isFullScreen();

            if (toggle == undefined) toggle = state;
            else if (toggle == state) return;

            if (toggle) requestFullScreen.call(docEl);
            else cancelFullScreen.call(doc);
        },

        getTextWidth: function(text, font) {
            // re-use canvas object for better performance
            var canvas = DOC.getTextWidth.canvas || (DOC.getTextWidth.canvas = document.createElement("canvas"));
            var context = canvas.getContext("2d");
            context.font = font || "12px arial";
            var metrics = context.measureText(text);
            return metrics.width;
        },

        auto: function(set, cfg) {
            if (!set) return;
            if (Array.isArray(set)) {
                for (var i = 0, l = set.length; i < l; ++i)
                this.auto(set[i], cfg);
                return;
            }

            cfg = cfg || {};
            var ctx = cfg.ctx || cfg.context;
            var filter = cfg.filter;

            set.__context = ctx = ctx || set.__context;
            set.__filter = filter = filter === undefined ? set.__filter : filter;
            set.__sort = "sort" in cfg ? cfg.sort : set.__sort;

            var src = DOC.resolve(set.dataset.array, ctx);
            var clazz = set.getAttribute("clazz") || set.dataset.clazz;

            if (!src || !clazz) return;

            var values;
            if (!Array.isArray(src)) values = Object.sort(src, set.__sort);

            if (!Array.isArray(set.__internal)) {
                set.__external = Array.prototype.slice.call(set.children, 0);
                set.__internal = [];
                set.controllers = function() {
                    return this.__internal.map((o) => o.controller)
                };
                set.values = function() {
                    return this.__internal.map((o) => o.value)
                };
            }

            var data = set.__internal;

            DOC.removeChildren(set);
            var assoc = [],
                i, j, l = (values || src).length,
                reverse = [];
            for (i = 0; i < l; ++i) {
                var val;
                if (values) val = src[values[i]];
                else val = src[i];

                if (filter && filter(val, src, i) === false) continue;

                for (j = 0; j < l; ++j) {
                    if (data[j] && data[j].value === val && assoc[j] === undefined) {
                        assoc[j] = i;
                        reverse[i] = j;
                        break;
                    }
                }

                if (j == l) {
                    var controller;
                    var clazzCfg = {
                        parent: set,
                        context: ctx,
                        data: val,
                        source: src,
                        inIndex: values ? values[i] : i,
                        outIndex: data.length
                    };

                    if( window.CLAZZ )
                        controller = CLAZZ.get(clazz, clazzCfg, null);
                    else
                        controller = new (DOC.resolve(clazz))( clazzCfg );

                    j = data.push({
                        controller: controller,
                        cfg: clazzCfg,
                        elements: Array.prototype.slice.call(set.children, 0)
                    }) - 1;

                    assoc[j] = i;
                    reverse[i] = j;
                    DOC.removeChildren(set);
                }
            }

            for (j = 0; j < set.__external.length; ++j)
                set.appendChild(set.__external[j]);

            var newData = [];
            for (i = 0; i < l; ++i) {
                if (reverse[i] === undefined) continue;

                var desc = data[reverse[i]];
                newData.push(desc);
                for (j = 0; j < desc.elements.length; ++j) {
                    set.appendChild(desc.elements[j]);
                    if (typeof desc.controller.update == "function"){
                        desc.cfg.inIndex = values ? values[i] : i;
                        desc.cfg.outIndex = newData.length - 1;
                        desc.controller.update(desc.cfg);
                    }
                }
            }

            set.__internal = newData;
        },

        create: function() {
            var tag, type;
            var prop = {};
            var children;
            var parent;
            for (var i = 0; i < arguments.length; ++i) {
                var arg = arguments[i];
                type = typeof arg;

                if (arg && type == "object") {
                    if (Array.isArray(arg)) type = "array";
                    else if (arg.constructor.name != "Object") {
                        if (arg.ownerDocument) type = "Element";
                        else type = arg.constructor.NAME;
                    }
                }

                switch (type) {
                    case "string":
                        tag = arg;
                        break;
                    case "object":
                        DOC.mergeTo(prop, arg);
                        break;
                    case "array":
                        children = arg;
                        break;
                    case "Element":
                        parent = arg;
                        break;
                }
            }

            parent = parent || prop.parent;

            tag = tag || prop.tag || {
                "select": "option",
                "ul": "li",
                "ol": "li",
                "table": "tr",
                "tr": "td",
            }[prop.parentTag || (parent && parent.tagName.toLowerCase())] || "span";

            children = children || [];
            if ("children" in prop) children = children.concat(prop.children);

            var doc = ((parent && parent.ownerDocument) || (this.__ROOT__ && this.__ROOT__.ownerDocument)) || document;
            var el = doc.createElement(tag);
            var f = {
                tag: function() {},
                style: DOC.mergeTo.bind(DOC, el.style),
                dataset: DOC.mergeTo.bind(DOC, el.dataset),
                children: function() {},
                attr: function(a) {
                    for (var k in a) el.setAttribute(k, a[k]);
                },
                html: function(s) {
                    el.innerHTML = s;
                },
                text: function(s) {
                    el.textContent = s;
                }
            };

            if ("max" in prop) el.max = prop.max;

            for (i in prop) {
                if (i in f) f[i](prop[i]);
                else el[i] = prop[i];
            }

            var before = prop.before;
            if (before) {
                if (typeof before == "string") before = DOC.qs(before) || DOC.byId(before);
                if (before && before.parentElement) parent = before.parentElement;
            }

            if (parent) {
                if (typeof parent == "string") parent = DOC.qs(parent) || DOC.byId(parent);
                try {
                    parent.insertBefore(el, before);
                } catch (ex) {
                    debugger;
                }
            }

            for (var k = 0, v; k < children.length; ++k) {
                v = children[k];
                if (v === undefined) continue;

                type = DOC.typeOf(v, Node);
                switch (type) {
                    case "Node":
                        break;
                    case "string":
                        v = {
                            html: v
                        };
                        // fallsthrough
                    case "object":
                        v = [v];
                    case "array":
                        v = DOC.create.apply(DOC, v.concat({
                            parentTag: tag
                        }));
                        break;
                    default:
                        console.error(type);
                        break;
                }

                if (!v.parentNode) el.appendChild(v);
            }

            return el;
        },

        indexOf: function(e) {
            if (!e || !e.parentNode) return -1;
            return Array.prototype.indexOf.call(e.parentNode.children, e);
        },

        swapChildren: function(a, b) {
            var p = a.parentNode;
            if (p != b.parentNode) {
                console.warn("Can't swap: not siblings.");
                return false;
            }
            var ai = DOC.indexOf(a),
                bi = DOC.indexOf(b),
                t;
            if (bi < ai) {
                t = bi;
                bi = ai;
                ai = t;
                t = b;
                b = a;
                a = t;
            }
            p.removeChild(b);
            p.insertBefore(b, a);
            p.removeChild(a);
            if (p.children[bi]) p.insertBefore(a, p.children[bi]);
            else p.appendChild(a);
        },

        addChildAt: function(e, i, p) {
            p = p || e.parentNode;
            if (!p) return;

            var anchor = p.children[i];
            if (anchor == e) return;

            DOC.remove(e);
            if (!anchor) p.appendChild(e);
            else p.insertBefore(e, anchor);
        },

        parentById: function(e, id) {
            while (e && e.id != id) e = e.parentNode;
            return e;
        },

        parentByClass: function(e, c) {
            e = e.parentNode;
            while (e && e.className.indexOf(c) == -1) e = e.parentNode;
            return e;
        },

        parentByTagName: function(e, c) {
            c = c.toUpperCase();
            e = e.parentNode;
            while (e && e.tagName != c) e = e.parentNode;
            return e;
        },

        byId: function(id) {
            var doc = (this.__ROOT__ && this.__ROOT__.ownerDocument) || document;
            return doc.getElementById(id);
        },

        qs: function(q) {
            var doc = (this.__ROOT__ && this.__ROOT__.ownerDocument) || document;
            return doc.querySelector(q);
        },

        attachPrefix: "$",

        index: function(root, pobj, attach, autoCfg) {
            var obj = {};
            pobj = pobj || Object.create(DOC, {});
            root = root || document.body;
            attach = attach || root.controller;
            autoCfg = autoCfg || {
                ctx: attach
            };

            function process(c, name, obj, type) {
                var a;

                if (!c.update && !c.controller && (a = c.getAttribute("clazz") || c.dataset.clazz) ) {
                    if (c.dataset.array) {
                        c.update = DOC.auto.bind(DOC, c);
                        c.update(autoCfg);
                    } else {
                        c.controller = CLAZZ.get(a, {
                            element: c,
                            DOM: obj,
                            context: autoCfg
                        });
                        attach = c.controller;
                    }
                }

                if (!name) return;
                name = name.trim();

                if (attach) {
                    var handler = DOC.attachPrefix;
                    if (typeof attach.attachPrefix == "string") handler = attach.attachPrefix;
                    DOC.attach(c, attach[handler + name], attach);
                }

                if (type == "class" || type == "tag") {
                    a = obj[name];
                    if (a && a.push) {
                        if (a.indexOf(c) == -1) a.push(c);
                    } else obj[name] = [c];
                } else obj[name] = c;

                if (type == "tag") {
                    var parts = name.split("-");
                    if (parts.length > 1) {
                        name = parts[0].toLowerCase();
                        for (var p = 1, l = parts.length; p < l; ++p)
                        name += parts[p].charAt(0).toUpperCase() + parts[p].substr(1).toLowerCase();

                        a = obj[name];
                        if (a && a.push) {
                            if (a.indexOf(c) == -1) a.push(c);
                        } else obj[name] = [c];
                    }
                }
            }

            if (!pobj.__ROOT__) {
                pobj.__ROOT__ = root;
                process(root, root.id, pobj);
                process(root, root.name, pobj);
                process(root, root.className, pobj, "class");
                process(root, root.tagName, pobj, "tag");
                root.className.trim().split(/\s+/).forEach(function(name) {
                    process(root, name, pobj, "class");
                });
            }
            obj.__ROOT__ = pobj.__ROOT__;

            if (root.children) {
                for (var i = 0, c; c = root.children[i]; ++i) {
                    process(c, c.id, obj);
                    process(c, c.name, obj);
                    process(c, c.className, obj, "class");
                    process(c, c.tagName, obj, "tag");
                    var parts = c.className.trim().split(/\s+/);
                    if (parts.length > 1) parts.forEach(function(n) {
                        process(c, n, obj, "class");
                    });
                    DOC.index(c, obj, attach, autoCfg);
                }
            }

            delete obj.__ROOT__;

            for (var k in obj) {
                var pobjk = pobj[k],
                    objk = obj[k];
                if (pobjk) {
                    if (pobjk.concat) pobj[k] = pobjk.concat(objk);
                    else if (objk.concat)(pobj[k] = objk).splice(0, 0, pobjk);
                    else if (k == objk.id || k == objk.tagName) pobj[k] = objk;
                    else pobj[k] = [pobjk, objk];
                } else pobj[k] = objk;
            }

            return pobj;
        },

        attach: function(objk, listener, ctx) {
            if (this.__ROOT__ && arguments.length == 1) {
                Object.getOwnPropertyNames(this).forEach(k => DOC.attach(this[k], objk[this.attachPrefix + k], objk));
                return;
            }
            var oldStyle;
            if (objk && listener) {
                if (Array.isArray(objk)) {
                    for (var e in listener) {
                        for (var j = 0, objkj; objkj = objk[j]; ++j) {
                            oldStyle = (objkj.dataset && objkj.dataset.oldevents) || objkj.tagName == "SCRIPT";
                            if (oldStyle) objkj[e] = listener[e].bind(ctx);
                            else objkj.addEventListener(e, listener[e].bind(ctx));
                        }
                    }
                } else {
                    oldStyle = (objk.dataset && objk.dataset.oldevents) || objk.tagName == "SCRIPT";
                    for (var e in listener) {
                        if (oldStyle) objk[e] = listener[e].bind(ctx);
                        else if (typeof listener[e] == "function") objk.addEventListener(e, listener[e].bind(ctx));
                        else debugger;
                    }
                }
            }
        },

        iterate: function(e, cb) {
            if (!cb) {
                cb = e;
                e = this.__ROOT__ || document.body;
            }
            if (!e || cb(e) === false) return;
            for (var i = 0, c; c = e.children[i]; ++i)
            DOC.iterate(c, cb);
        },

        remove: function(e) {
            if (!e) return;

            if (Array.isArray(e)) {
                e.forEach(this.remove.bind(this));
                return;
            }

            if (!e.parentNode) return;
            e.parentNode.removeChild(e);
        },

        removeChildren: function(e) {
            while (e.lastChild) e.removeChild(e.lastChild);
            return e;
        },

        getStyle: function(e, rule) {
            var strValue = "";
            if (document.defaultView && document.defaultView.getComputedStyle) {
                strValue = document.defaultView.getComputedStyle(e, "").getPropertyValue(rule);
            } else if (e.currentStyle) {
                rule = rule.replace(/\-(\w)/g, function(strMatch, p1) {
                    return p1.toUpperCase();
                });
                strValue = e.currentStyle[rule];
            }
            return strValue;
        },

        cssTween: function(style, property, target, step) {
            var cv = parseFloat(style[property]) || 0;
            cv -= (target - cv) * step;
            style[property] = cv + "px";
        },

        getGlobalXY: function(element) {
            var rect = {
                x: 0,
                y: 0
            };
            while (element && element.getBoundingClientRect && element.tagName != "html") {
                var r = element.getBoundingClientRect();
                var y = r.top;
                var x = r.left;
                y -= parseInt(DOC.getStyle(element, "margin-top")) || 0;
                x -= parseInt(DOC.getStyle(element, "margin-left")) || 0;
                rect.x += x;
                rect.y += y;
                element = element.parentNode;
            }
            return rect;
        },

        // OBJECT FUNCTIONS

        __uid: 0,
        getUID: function() {
            if (window.CLAZZ) return CLAZZ.getUID();
            return DOC.__uid++;
        },

        seed: 0,
        rand32: function() {
            return (this.rand16() << 16) | this.rand16();
        },

        rand16: function() {
            this.seed = (214013 * this.seed + 2531011) & 0x7FFFFFFF;
            return ((this.seed >> 16) ^ (this.seed >> 2)) & 0x7FFF;
        },

        rand8: function() {
            var r = this.rand16();
            return (r ^ (r >> 8)) & 0xF;
        },

        rand: function() {
            this.seed = (214013 * this.seed + 2531011) & 0x7FFFFFFF;
            return ((this.seed >> 16) & 0x7FFF) / 0x8000;
        },

        typeOf: function(obj, inst) {
            var ret = typeof obj;
            if (obj == "null") return "null";
            if (obj instanceof Array) return "array";
            if (inst && obj instanceof inst) return inst.NAME || inst.name;
            return ret;
        },

        toArray: function(alike) {
            return Array.prototype.slice.call(alike, 0);
        },

        appendFunction: function(object, name, func, pool) {
            if (!object[name]) {
                object[name] = func;
                if (object.constructor.methods) object.constructor.methods[name] = object[name];
                if (pool) pool.listen(object, name, false);
            } else if (object[name].proxy) object[name].proxy.push(func);
            else {
                var proxy = [object[name].bind(object), func];
                func = function() {
                    var args = Array.prototype.slice.call(arguments);
                    var ret = undefined;
                    for (var i = 0, c; c = proxy[i]; ++i) {
                        var altret = c.apply(null, args);
                        if (altret !== undefined) ret = altret;
                    }
                    return ret;
                };

                func.proxy = proxy;
                object[name] = func;
                if (object.constructor.methods) object.constructor.methods[name] = func;
                if (pool) pool.listen(object, name, false);
            }
        },

        mergeToEx: function(r, a) {
            for (var i = 0; i < a.length; ++i) {
                var o = a[i];
                for (var k in o)
                r[k] = o[k];
            }
            return r;
        },

        mergeToDeep: function(out, inp) {
            for (var k in inp) {
                var v = inp[k];
                var outk = out[k];
                if (v) {
                    var typeofv = typeof v;
                    if (v instanceof Array) typeofv = "array";
                    if (typeofv == "object" && v.constructor == Object) {
                        if (!outk) out[k] = outk = {};
                        DOC.mergeToDeep(outk, v);
                        continue;
                    } else if (typeofv == "array") {
                        if (!(outk instanceof Array)) outk = null;
                        if (!outk) out[k] = outk = [];
                        for (var i = 0; i < v.length; ++i)
                        if (outk.indexOf(v[i]) == -1) outk.push(v[i]);
                        continue;
                    }
                }
                out[k] = v;
            }
            return out;
        },

        mergeTo: function(r) {
            return DOC.mergeToEx(r, Array.prototype.slice.call(arguments, 1));
        },

        merge: function() {
            return DOC.mergeToEx({}, arguments);
        },

        extend: function() {
            var o = {};
            for (var i = 0; i < arguments.length; ++i) {
                var src = arguments[i];
                if (typeof src == "string") src = DOC.resolve(src);
                DOC.mergeToDeep(o, src);
            }

            return o;
        },

        TEXT: TEXT,
        resolve: resolve,
        Resolve: Resolve,
        postURL: postURL,
        postJSONURL: postJSONURL,
        getURL: getURL,
        Loader: Loader,

        GET: {},

        app: function(path, cfg) {
            path = path || "";
            cfg = cfg || {};
            var ext = ".js";
            if (cfg.zip) ext = ".jz";
            if (cfg.wire) ext = ".wire";

            var protocol = cfg.protocol;
            if (protocol) {
                if (!/:$/.test(protocol)) protocol += ":";
                if (location.protocol != protocol) {
                    open(location.toString().replace(/^[^:]*:/, protocol), "_top");
                }
            }

            var file = path.replace(/\./g, '/') + ext,
                event = cfg.event || "DOMContentLoaded";
            document.addEventListener(event, function() {
                var ldr = new DOC.Loader();
                if (path == "") {
                    var files = {};
                    DOC.iterate(document.body, (e) => {
                        if (e.clazz && !files[e.clazz] && !resolve(e.clazz)) {
                            ldr.load(e.clazz.replace(/\./g, '/') + ".js");
                            files[e.clazz] = true;
                        }
                    });
                    ldr.start(function() {
                        self.DOM = DOC.index(document.body);
                    });
                } else ldr.load(file).start(function() {
                    var clazz = DOC.resolve(path);

                    if (ext == ".js") return clazz.NEW();
                    if (ext == ".wire") {
                        var src = "",
                            wire = DOC.resolve(path);
                        src += "(function(){\n";
                        if (cfg.debug) src += "debugger;";
                        src += ["var __queue=0, __onReadyCB = [];", "var singleton = function(a, b){ __queue++; need(b, __cb); return singleton; },", "\tmulti = singleton,", "\timplements = singleton,", "\tfactory = singleton,", "\tmethod = function(a, b){ __queue++; need(b, __cb ); return method; },", "\tjson = function(a, b){ __queue++; need([{URL:b.replace(/\\./g, '/') + '.json'}], function(){ ", "\t\tif(a) DOC.resolve(a, null, DOC.resolve(b));", "\t\t__cb();", "\t} ); return json; },\n", "\tset = function(){},", "\tget = function(){},", "\tonready = function( cb ){ __onReadyCB.push(cb); },", "\toninit = function( cb ){ cb(); };",
                        wire, "\n\nfunction __cb(){", "__queue--;", "if( __queue ) return;", "var singleton = CLAZZ.singleton,", "\timplements = CLAZZ.implements,", "\tmulti = CLAZZ.multi,\n", "\tfactory = CLAZZ.factory,", "\tmethod = function(a, b){ if(a){ CLAZZ.set(a, self[a] = DOC.resolve(b)); } return method; },", "\tjson = method,", "\tset = CLAZZ.set,", "\tget = CLAZZ.get,", "\tonready = function(){},", "\toninit = function(){};", "__onReadyCB.forEach(cb => cb());",
                        wire, "\n}\n", "})();"].join("\n");
                        DOC.create("script", {
                            text: src
                        }, document.head);
                        (new DOC.Loader()).start(function() {});
                    }
                });
            });
        }
    };

    window.DOC = DOC;

    // http://localhost:8080/starcranes/src/main/webapp//?pair=8caa4545-b145-46e6-8efa-aae9fd5e44c1
    if (location.search && location.search[0] == "?") {
        var search = location.search.substr(1).split("&");
        for (var i = 0, l = search.length; i < l; ++i) {
            var eq = search[i].indexOf("=");
            var key, value;
            if (eq == -1) {
                key = search[i];
                value = "";
            } else {
                key = search[i].substr(0, eq);
                value = decodeURIComponent(search[i].substr(eq + 1));
            }
            DOC.GET[key] = value;
        }
    }

})(); 