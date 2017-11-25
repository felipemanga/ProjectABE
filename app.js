(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = { bind: bind, inject: inject, getInstanceOf: getInstanceOf, getPolicy: getPolicy };

/*

Welcome to DRY-DI.

*/

var knownInterfaces = [];
var interfaces = {};
var concretions = {};

var context = [{}];

var Ref = function () {
    function Ref(provider, ifid, scope) {
        _classCallCheck(this, Ref);

        this.ifid = ifid;
        this.count = provider.dependencyCount;
        this.dependencyCount = provider.dependencyCount;
        this.scope = scope;

        this.binds = {};
        this.injections = null;
        this.provider = provider;

        var pslot = scope[ifid] || (scope[ifid] = new Slot());

        if (provider.injections) {
            this.injections = {};
            Object.assign(this.injections, provider.injections);

            for (var key in this.injections) {
                var _ifid = this.injections[key];
                var slot = scope[_ifid] || (scope[_ifid] = new Slot());
                slot.addInjector(this);
            }
        }

        pslot.addProvider(this);
    }

    _createClass(Ref, [{
        key: "bindInjections",
        value: function bindInjections(injections) {
            var _this = this;

            injections.forEach(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                    clazz = _ref2[0],
                    _interface = _ref2[1];

                var key = knownInterfaces.indexOf(_interface);
                var injection = injections[key];

                if (!(key in _this.binds)) {
                    var ifid = _this.injections[key];
                    _this.scope[_this.ifid].removeInjector(_this);
                    _this.satisfy();
                    _this.dependencyCount--;
                }

                _this.binds[key] = clazz;
            });
        }
    }, {
        key: "satisfy",
        value: function satisfy() {

            this.count--;

            if (this.count == 0) this.scope[this.ifid].addViable();
        }
    }]);

    return Ref;
}();

var Slot = function () {
    function Slot() {
        _classCallCheck(this, Slot);

        this.viableProviders = 0;
        this.providers = [];
        this.injectors = [];
    }

    _createClass(Slot, [{
        key: "addInjector",
        value: function addInjector(ref) {

            this.injectors.push(ref);
            if (this.viableProviders > 0) ref.satisfy();
        }
    }, {
        key: "removeInjector",
        value: function removeInjector(ref) {

            var index = this.injectors.indexOf(ref);
            if (index > -1) this.injectors.splice(index, 1);
        }
    }, {
        key: "addProvider",
        value: function addProvider(ref) {

            this.providers.push(ref);
            if (ref.count == 0) this.addViable();
        }
    }, {
        key: "addViable",
        value: function addViable() {

            this.viableProviders++;
            if (this.viableProviders == 1) {

                var injectors = this.injectors;
                for (var i = 0, l = injectors.length; i < l; ++i) {
                    injectors[i].satisfy();
                }
            }
        }
    }, {
        key: "getViable",
        value: function getViable(clazz, tags, multiple) {

            if (this.viableProviders == 0) {
                if (!multiple) throw new Error("No viable providers for " + clazz + ". #126");
                return [];
            }

            var ret = multiple ? [] : null;

            var mostViable = null;
            var maxPoints = -1;
            notViable: for (var i = 0, c; c = this.providers[i]; ++i) {
                if (c.count) continue;
                var points = c.dependencyCount;
                if (tags && c.tags) {
                    for (var tag in tags) {
                        if (c.tags[tag] !== tags[tag]) continue notViable;
                        points++;
                    }
                }
                if (multiple) ret[ret.length] = c.provider.policy.bind(c.provider, c.binds);else {
                    if (points > maxPoints) {
                        maxPoints = points;
                        mostViable = c;
                    }
                }
            }

            if (!multiple) {
                if (!mostViable) throw new Error("No viable providers for " + clazz + ". Tag mismatch.");

                return mostViable.provider.policy.bind(mostViable.provider, mostViable.binds);
            } else return ret;
        }
    }]);

    return Slot;
}();

function registerInterface(ifc) {

    var props = {},
        currifc = void 0;

    if (typeof ifc == "function") currifc = ifc.prototype;else if ((typeof ifc === "undefined" ? "undefined" : _typeof(ifc)) == "object") currifc = ifc;

    while (currifc && currifc !== Object.prototype) {

        var names = Object.getOwnPropertyNames(ifc.prototype);

        for (var i = 0, l = names.length; i < l; ++i) {
            var name = names[i];

            if (!props[name]) props[name] = _typeof(ifc.prototype[name]);
        }

        currifc = currifc.prototype;
    }

    var len = knownInterfaces.length;
    interfaces[len] = props;
    knownInterfaces[len] = ifc;

    return len;
}

var Provide = function () {
    function Provide() {
        _classCallCheck(this, Provide);

        this.injections = null;
        this.dependencyCount = 0;
        this.clazz = null;
        this.ctor = null;
        this.binds = null;

        // default policy is to create a new instance for each injection
        this.policy = function (binds, args) {
            return new this.ctor(binds, args);
        };
    }

    _createClass(Provide, [{
        key: "clone",
        value: function clone() {

            var ret = new Provide();

            ret.injections = this.injections;
            ret.dependencyCount = this.dependencyCount;
            ret.clazz = this.clazz;
            ret.policy = this.policy;
            ret.ctor = this.ctor;
            ret.binds = this.binds;

            return ret;
        }
    }, {
        key: "bindInjections",
        value: function bindInjections(injections) {

            var binds = this.binds = this.binds || [];
            var bindCount = this.binds.length;

            injections.forEach(function (_ref3) {
                var _ref4 = _slicedToArray(_ref3, 2),
                    clazz = _ref4[0],
                    _interface = _ref4[1];

                for (var i = 0; i < bindCount; ++i) {
                    if (binds[i][0] == clazz) return;
                }
                binds[binds.length] = [clazz, _interface];
            });

            return this;
        }
    }, {
        key: "getRef",
        value: function getRef(ifid, _interface) {

            var map = interfaces[ifid],
                clazz = this.clazz;

            for (var key in map) {
                if (_typeof(clazz.prototype[key]) == map[key]) continue;
                throw new Error("Class " + clazz.name + " can't provide to interface " + _interface.name + " because " + key + " is " + _typeof(clazz[key]) + " instead of " + map[key] + ".");
            }

            return new Ref(this, ifid, context[context.length - 1]);
        }
    }, {
        key: "setConcretion",
        value: function setConcretion(clazz) {

            this.clazz = clazz;
            if (typeof clazz == "function") {
                this.ctor = function (_clazz) {
                    _inherits(_class, _clazz);

                    function _class(binds, args) {
                        var _ref5;

                        _classCallCheck(this, _class);

                        return _possibleConstructorReturn(this, (_ref5 = _class.__proto__ || Object.getPrototypeOf(_class)).call.apply(_ref5, [this].concat(_toConsumableArray(args))));
                    }

                    return _class;
                }(clazz);
                // this.ctor.prototype = Object.create(clazz.prototype);
            } else {
                this.policy = function () {
                    return clazz;
                };
            }

            var cid = knownInterfaces.indexOf(clazz);
            if (cid == -1) cid = registerInterface(clazz);

            if (!concretions[cid]) concretions[cid] = [this];else concretions[cid].push(this);

            return this;
        }
    }, {
        key: "factory",
        value: function factory() {

            this.policy = function (binds, args) {
                var THIS = this;

                return function () {
                    for (var _len = arguments.length, args2 = Array(_len), _key = 0; _key < _len; _key++) {
                        args2[_key] = arguments[_key];
                    }

                    return new THIS.ctor(binds, args.concat(args2));
                };
            };

            return this;
        }
    }, {
        key: "singleton",
        value: function singleton() {

            var instance = null;
            this.policy = function (binds, args) {

                if (instance) return instance;

                instance = Object.create(this.ctor.prototype);
                instance.constructor = this.ctor;
                this.ctor.call(instance, binds, args);

                // new (class extends this.ctor{
                //     constructor( args ){
                //         instance = this; // cant do this :(
                //         super(args);
                //     }
                // }

                return instance;
            };

            return this;
        }
    }]);

    return Provide;
}();

function bind(clazz) {

    var cid = knownInterfaces.indexOf(clazz);
    if (cid == -1) {
        cid = registerInterface(clazz);
    }

    var providers = concretions[cid];
    var localProviders = [];

    if (!providers) {

        if (clazz && clazz["@inject"]) inject(clazz["@inject"]).into(clazz);else new Provide().setConcretion(clazz);

        providers = concretions[cid];
    }

    localProviders = providers.map(function (partial) {
        return partial.clone();
    });

    var refs = [];
    var tags = null;
    var ifid = void 0;

    var partialBind = {
        to: function to(_interface) {

            var ifid = knownInterfaces.indexOf(_interface);
            if (ifid == -1) ifid = registerInterface(_interface);

            localProviders.forEach(function (provider) {

                var ref = provider.getRef(ifid, _interface);
                ref.tags = tags;
                refs.push(ref);
            });

            return this;
        },

        withTags: function withTags(tags) {
            refs.forEach(function (ref) {
                return ref.tags = tags;
            });
            return this;
        },

        singleton: function singleton() {
            localProviders.forEach(function (provider) {
                return provider.singleton();
            });
            return this;
        },
        factory: function factory() {
            localProviders.forEach(function (provider) {
                return provider.factory();
            });
            return this;
        },
        inject: function inject(map) {
            return this.injecting(map);
        },
        injecting: function injecting() {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            refs.forEach(function (ref) {
                return ref.bindInjections(args);
            });
            localProviders.forEach(function (provider) {
                return provider.bindInjections(args);
            });
            return this;
        }

    };

    return partialBind;
}

var Inject = function () {
    function Inject(dependencies) {
        _classCallCheck(this, Inject);

        this.dependencies = dependencies;
        var tags = this.tags = {};
        for (var key in dependencies) {
            tags[key] = {};
        }
    }

    _createClass(Inject, [{
        key: "into",
        value: function into(clazz) {

            var cid = knownInterfaces.indexOf(clazz);
            if (cid == -1) cid = registerInterface(clazz);

            var injections = {},
                map = this.dependencies,
                dependencyCount = 0,
                tags = this.tags,
                multiple = {};

            for (var key in map) {

                var _interface = map[key];
                var dependency = _interface;
                if (Array.isArray(dependency)) {

                    _interface = _interface[0];
                    for (var i = 1; i < dependency.length; ++i) {

                        if (typeof dependency[i] == "string") tags[key][dependency[i]] = true;else if (Array.isArray(dependency[i])) multiple[key] = true;else if (dependency[i]) Object.assign(tags[key], dependency[i]);
                    }
                }

                var ifid = knownInterfaces.indexOf(_interface);

                if (ifid == -1) ifid = registerInterface(_interface);

                injections[key] = ifid;

                dependencyCount++;
            }

            var provider = new Provide().setConcretion(clazz),
                proto = clazz.prototype;
            var providers = concretions[cid];

            provider.injections = injections;
            provider.dependencyCount = dependencyCount;

            provider.ctor = function (binds, args) {
                resolveDependencies(binds, this);
                clazz.apply(this, args);
            };
            provider.ctor.prototype = Object.create(clazz.prototype);
            provider.ctor.prototype.constructor = clazz;

            // provider.ctor = class extends clazz {
            //     constructor( args ){
            //         resolveDependencies( this ); // *sigh*
            //         super(...args);
            //     }
            // };

            function resolveDependencies(binds, obj) {
                var slotset = context[context.length - 1];
                for (var _key3 in injections) {
                    if (binds && injections[_key3] in binds) {
                        obj[_key3] = binds[injections[_key3]];
                        continue;
                    }

                    var slot = slotset[injections[_key3]];
                    var policy = slot.getViable(_key3, tags[_key3], multiple[_key3]);
                    if (!multiple[_key3]) obj[_key3] = policy([]);else {
                        var out = obj[_key3] = [];
                        for (var _i2 = 0; _i2 < policy.length; ++_i2) {
                            out[_i2] = policy[_i2]([]);
                        }
                    }
                }
            }
        }
    }]);

    return Inject;
}();

function inject(dependencies) {

    return new Inject(dependencies);
}

function getInstanceOf(_interface) {
    for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key4 = 1; _key4 < _len3; _key4++) {
        args[_key4 - 1] = arguments[_key4];
    }

    // let ifid = knownInterfaces.indexOf( _interface );
    // let slot = context[ context.length-1 ][ ifid ];

    // if( !slot )
    //     throw new Error("No providers for " + (_interface.name || _interface) + ". #467");

    // let policy = slot.getViable( _interface.name || _interface );

    // return policy.call( null, args );
    return getPolicy({ _interface: _interface, args: args });
}

function getPolicy(desc) {
    desc = desc || {};
    if (!desc._interface) throw new Error("Policy descriptor has no interface.");
    var name = desc._interface.name || desc._interface;
    var tags = desc.tags;
    var multiple = desc.multiple;
    var args = desc.args;

    var ifid = knownInterfaces.indexOf(desc._interface);
    var slot = context[context.length - 1][ifid];

    if (!slot) throw new Error("No providers for " + name + ". #467");

    var policy = slot.getViable(name, tags, multiple);
    if (args) {
        if (multiple) policy = policy.map(function (p) {
            return p.call(null, args);
        });else policy = policy.call(null, args);
    }
    return policy;
}

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
        value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require('./lib/mvc.js');

var _IStore = require('./store/IStore.js');

var _IStore2 = _interopRequireDefault(_IStore);

var _dryDom = require('./lib/dry-dom.js');

var _dryDom2 = _interopRequireDefault(_dryDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

window.strldr = require("./lib/strldr.js");

var App = function () {
        function App() {
                _classCallCheck(this, App);

                window.store = this.store;

                this.pool.add(this);

                this.models = [];

                this.store.onload = this.init.bind(this);
        }

        _createClass(App, [{
                key: 'init',
                value: function init() {
                        var _this = this;

                        document.body.addEventListener("keydown", function (evt) {
                                _this.pool.call("onPress" + evt.code);
                                // console.log(evt);
                        });

                        document.body.addEventListener("keyup", function (evt) {
                                _this.pool.call("onRelease" + evt.code);
                                // console.log(evt);
                        });

                        this.controllers.forEach(function (controller) {
                                _this.pool.add(controller);
                        });

                        this.pool.call("enterSplash");

                        setInterval(this.commit.bind(this), 3000);

                        var pending = 2;
                        this.openModel("app", done.bind(this));
                        setTimeout(done.bind(this), 1000);

                        function done() {
                                pending--;
                                if (!pending) this.pool.call("exitSplash");
                        }
                }
        }, {
                key: 'openModel',
                value: function openModel(name, cb, model) {
                        var _this2 = this;

                        var oldModel = this.models.find(function (obj) {
                                return obj.name == name;
                        });

                        if (oldModel) {

                                if (oldModel == model) return;
                                this.closeModel(name);
                        }

                        var path = name;

                        if (typeof model == "string") {
                                path = model;
                                model = null;
                        }

                        if (!model) model = new _mvc.Model();

                        this.root.setItem(name, model.data);

                        this.models[this.models.length] = {
                                model: model,
                                name: name,
                                path: path,
                                dirty: false
                        };

                        this.store.getTextItem(path, function (data) {

                                if (data) {
                                        model.load(JSON.parse(data));
                                        if (model.getItem("expires") > new Date().getTime()) {
                                                model.dirty = false;
                                                cb.call();
                                                return;
                                        }
                                }

                                _this2.pool.call(name + "ModelInit", model, cb);
                        });
                }
        }, {
                key: 'closeModel',
                value: function closeModel(name) {
                        // to-do: find, commit, remove from this.models
                }
        }, {
                key: 'appModelInit',
                value: function appModelInit(model, cb) {

                        var repoURL = ["http://www.crait.net/arduboy/repo2.json", "http://arduboy.ried.cl/repo.json"];

                        if (navigator.userAgent.indexOf("Electron") == -1 && typeof cordova == "undefined") {
                                // model.setItem("proxy", "https://crossorigin.me/");
                                model.setItem("proxy", "https://cors-anywhere.herokuapp.com/");
                                repoURL = repoURL.map(function (url) {
                                        return model.getItem("proxy") + url;
                                });
                        } else {
                                model.setItem("proxy", "");
                        }

                        var items = [];
                        var pending = 2;

                        repoURL.forEach(function (url) {
                                return fetch(url).then(function (rsp) {
                                        return rsp.json();
                                }).then(function (json) {
                                        return json && json.items && json.items.forEach(function (item) {
                                                item.author = item.author || "<<unknown>>";
                                                if (item.banner && (!item.screenshots || !item.screenshots[0] || !item.screenshots[0].filename)) item.screenshots = [{ filename: item.banner }];

                                                items.push(item);
                                        }) || done();
                                }).catch(function (err) {
                                        console.log(err);
                                        done();
                                });
                        });

                        function done() {
                                pending--;

                                if (!pending) {
                                        items = items.sort(function (a, b) {
                                                if (a.title > b.title) return 1;
                                                if (a.title < b.title) return -1;
                                                return 0;
                                        });
                                        model.removeItem("repo");
                                        model.setItem("repo", items);
                                        model.setItem("expires", new Date().getTime() + 60 * 60 * 1000);
                                        cb();
                                }
                        }
                }
        }, {
                key: 'commit',
                value: function commit() {

                        for (var i = 0; i < this.models.length; ++i) {

                                var obj = this.models[i];
                                if (!obj.dirty && obj.model.dirty) {

                                        obj.dirty = true;
                                        obj.model.dirty = false;
                                } else if (obj.dirty && !obj.model.dirty) {

                                        obj.dirty = false;
                                        this.store.setItem(obj.path, JSON.stringify(obj.model.data));
                                } else if (obj.dirty && obj.model.dirty) {

                                        obj.model.dirty = false;
                                }
                        }
                }
        }, {
                key: 'setActiveView',
                value: function setActiveView(view) {
                        [].concat(_toConsumableArray(this.DOM.element.children)).forEach(function (node) {
                                return node.parentElement.removeChild(node);
                        });
                }
        }]);

        return App;
}();

App["@inject"] = {
        DOM: _dryDom2.default,
        store: _IStore2.default,
        pool: "pool",
        controllers: [_mvc.IController, []],
        root: [_mvc.Model, { scope: "root" }]
};
exports.default = App;

},{"./lib/dry-dom.js":20,"./lib/mvc.js":22,"./lib/strldr.js":24,"./store/IStore.js":26}],3:[function(require,module,exports){
"use strict";

var _write, _read;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

module.exports = {

    write: (_write = {}, _defineProperty(_write, 0x15 + 0x20, function (value) {

        this.TOV0 = value & 1;
        this.OCF0A = value >> 1 & 1;
        this.OCF0B = value >> 2 & 1;
    }), _defineProperty(_write, 0x24 + 0x20, function (value) {

        this.WGM00 = value >> 0 & 1;
        this.WGM01 = value >> 1 & 1;
        this.COM0B0 = value >> 4 & 1;
        this.COM0B1 = value >> 5 & 1;
        this.COM0A0 = value >> 6 & 1;
        this.COM0A1 = value >> 7 & 1;

        this.updateState();

        // console.log(`TCCR0A:\n  WGM00:${this.WGM00}\n  WGM01:${this.WGM01}\n  COM0B0:${this.COM0B0}\n  COM0B1:${this.COM0B1}\n  COM0A0:${this.COM0A0}\n  COM0A1:${this.COM0A1}`);
    }), _defineProperty(_write, 0x25 + 0x20, function (value) {

        this.FOC0A = value >> 7 & 1;
        this.FOC0B = value >> 6 & 1;
        this.WGM02 = value >> 3 & 1;
        this.CS = value & 7;

        this.updateState();

        // console.log(`TCCR0B:\n  FOC0A:${this.FOC0A}\n  FOC0B:${this.FOC0B}\n  WGM02:${this.WGM02}`);

        // console.log( "PC=" + (this.core.pc<<1).toString(16) + " WRITE TCCR0B: #" + value.toString(16) + " : " + value );
    }), _defineProperty(_write, 0x27 + 0x20, function (value) {
        this.OCR0A = value;
        // console.log( "OCR0A = " + value );
    }), _defineProperty(_write, 0x28 + 0x20, function (value) {
        this.OCR0B = value;
        // console.log( "OCR0B = " + value );
    }), _defineProperty(_write, 0x6E, function _(value) {
        this.TOIE0 = value & 1;
        this.OCIE0A = value >> 1 & 1;
        this.OCIE0B = value >> 2 & 1;
    }), _write),

    init: function init() {
        this.tick = 0;
        this.WGM00 = 0;
        this.WGM01 = 0;
        this.COM0B0 = 0;
        this.COM0B1 = 0;
        this.COM0A0 = 0;
        this.COM0A1 = 0;
        this.FOC0A = 0;
        this.FOC0B = 0;
        this.WGM02 = 0;
        this.CS = 0;
        this.TOV0 = 0;

        this.TOIE0 = 0;
        this.OCIE0A = 0;
        this.OCIE0B = 0;

        this.time = 0;

        this.updateState = function () {

            var MAX = 0xFF,
                BOTTOM = 0,
                WGM00 = this.WGM00,
                WGM01 = this.WGM01,
                WGM02 = this.WGM02;

            if (WGM02 == 0 && WGM01 == 0 && WGM00 == 0) {
                this.mode = 0;
                console.log("Timer Mode: Normal (" + this.mode + ")");
            } else if (WGM02 == 0 && WGM01 == 0 && WGM00 == 1) {
                this.mode = 1;
                console.log("Timer Mode: PWM, phase correct (" + this.mode + ")");
            } else if (WGM02 == 0 && WGM01 == 1 && WGM00 == 0) {
                this.mode = 2;
                console.log("Timer Mode: CTC (" + this.mode + ")");
            } else if (WGM02 == 0 && WGM01 == 1 && WGM00 == 1) {
                this.mode = 3;
                console.log("Timer Mode: Fast PWM (" + this.mode + ")");
            } else if (WGM02 == 1 && WGM01 == 0 && WGM00 == 0) {
                this.mode = 4;
                console.log("Timer Mode: Reserved (" + this.mode + ")");
            } else if (WGM02 == 1 && WGM01 == 0 && WGM00 == 1) {
                this.mode = 5;
                console.log("Timer Mode: PWM, phase correct (" + this.mode + ")");
            } else if (WGM02 == 1 && WGM01 == 1 && WGM00 == 0) {
                this.mode = 6;
                console.log("Timer Mode: Reserved (" + this.mode + ")");
            } else if (WGM02 == 1 && WGM01 == 1 && WGM00 == 1) {
                this.mode = 7;
                console.log("Timer Mode: Fast PWM (" + this.mode + ")");
            }

            switch (this.CS) {
                case 0:
                    this.prescale = 0;break;
                case 1:
                    this.prescale = 1;break;
                case 2:
                    this.prescale = 8;break;
                case 3:
                    this.prescale = 64;break;
                case 4:
                    this.prescale = 256;break;
                case 5:
                    this.prescale = 1024;break;
                default:
                    this.prescale = 1;break;
            }
        };
    },

    read: (_read = {}, _defineProperty(_read, 0x15 + 0x20, function () {
        return !!this.TOV0 & 1 | this.OCF0A << 1 | this.OCF0B << 2;
    }), _defineProperty(_read, 0x26 + 0x20, function () {

        var tick = this.core.tick;

        var ticksSinceOVF = tick - this.tick;
        var interval = ticksSinceOVF / this.prescale | 0;
        if (!interval) return;

        var TCNT0 = 0x26 + 0x20;
        var cnt = this.core.memory[TCNT0] + interval;

        this.core.memory[TCNT0] += interval;

        this.tick += interval * this.prescale;

        this.TOV0 += cnt / 0xFF | 0;
    }), _read),

    update: function update(tick, ie) {

        var ticksSinceOVF = tick - this.tick;
        var interval = ticksSinceOVF / this.prescale | 0;

        if (interval) {
            var TCNT0 = 0x26 + 0x20;
            var cnt = this.core.memory[TCNT0] + interval;

            this.core.memory[TCNT0] += interval;

            this.tick += interval * this.prescale;

            this.TOV0 += cnt / 0xFF | 0;
        }

        if (this.TOV0 > 0 && ie) {
            this.TOV0--;
            return "TIMER0O";
        }
    }

};

},{}],4:[function(require,module,exports){
"use strict";

module.exports = {

    write: {
        0xC0: function _(value) {
            return this.UCSR0A = this.UCSR0A & 188 | value & 67;
        },
        0xC1: function _(value) {
            return this.UCSR0B = value;
        },
        0xC2: function _(value) {
            return this.UCSR0C = value;
        },
        0xC4: function _(value) {
            return this.UBRR0L = value;
        },
        0xC5: function _(value) {
            return this.UBRR0H = value;
        },
        0xC6: function _(value) {
            this.core.pins.serial0 = (this.core.pins.serial0 || "") + String.fromCharCode(value);return this.UDR0 = value;
        }
    },

    read: {
        0xC0: function _() {
            return this.UCSR0A;
        },
        0xC1: function _() {
            return this.UCSR0B;
        },
        0xC2: function _() {
            return this.UCSR0C;
        },
        0xC4: function _() {
            return this.UBRR0L;
        },
        0xC5: function _() {
            return this.UBRR0H & 0x0F;
        },
        0xC6: function _() {
            return this.UDR0;
        }
    },

    init: function init() {
        this.UCSR0A = 0x20;
        this.UCSR0B = 0;
        this.UCSR0C = 0x06;
        this.UBRR0L = 0; // USART Baud Rate 0 Register Low
        this.UBRR0H = 0; // USART Baud Rate 0 Register High            
        this.UDR0 = 0;
    },

    update: function update(tick, ie) {}

};

},{}],5:[function(require,module,exports){
'use strict';

var _write, _write2, _write3;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

module.exports = {

    PORTB: {
        write: (_write = {}, _defineProperty(_write, 0x04 + 0x20, function (value) {
            this.core.pins.DDRB = value;
        }), _defineProperty(_write, 0x05 + 0x20, function (value, oldValue) {

            if (oldValue == value) return;

            /*
                          if( typeof document != "undefined" ){
                              if( value & 0x20 ) document.body.style.backgroundColor = "black";
                              else document.body.style.backgroundColor = "white";
                          }else if( typeof WorkerGlobalScope == "undefined" ){
                              if( value & 0x20 ) console.log( "LED ON #", (this.core.pc<<1).toString(16) );
                              else console.log( "LED OFF #", (this.core.pc<<1).toString(16) );
                          }
            */

            this.core.pins.PORTB = value;

            // console.log("worker@" + this.core.pc.toString(16) + "[tick " + (this.core.tick / this.core.clock * 1000).toFixed(3) + "]", " PORTB = ", value.toString(2));
        }), _write),
        read: _defineProperty({}, 0x03 + 0x20, function () {
            return this.PINB & 0xFF | 0;
        }),
        init: function init() {
            var _this = this;

            this.PINB = 0;
            Object.defineProperty(this.core.pins, "PINB", {
                set: function set(v) {
                    return _this.PINB = v >>> 0 & 0xFF;
                },
                get: function get() {
                    return _this.PINB;
                }
            });
        }
    },

    PORTC: {
        write: (_write2 = {}, _defineProperty(_write2, 0x07 + 0x20, function (value) {
            this.core.pins.DDRC = value;
        }), _defineProperty(_write2, 0x08 + 0x20, function (value) {
            this.core.pins.PORTC = value;
        }), _write2),
        read: _defineProperty({}, 0x06 + 0x20, function () {
            return this.core.pins.PINC = this.core.pins.PINC & 0xFF || 0;
        })
    },

    PORTD: {
        write: (_write3 = {}, _defineProperty(_write3, 0x0A + 0x20, function (value) {
            this.core.pins.DDRD = value;
        }), _defineProperty(_write3, 0x0B + 0x20, function (value) {
            this.core.pins.PORTD = value;
        }), _write3),
        read: _defineProperty({}, 0x09 + 0x20, function () {
            return this.core.pins.PIND = this.core.pins.PIND & 0xFF || 0;
        })
    },

    TC: require('./At328P-TC.js'),

    USART: require('./At328P-USART.js')

};

},{"./At328P-TC.js":3,"./At328P-USART.js":4}],6:[function(require,module,exports){
"use strict";

module.exports = {
			init: function init() {
						this.SPDR = 0;
						this.SPIF = 0;
						this.WCOL = 0;
						this.SPI2X = 0;
						this.SPIE = 0;
						this.SPE = 0;
						this.DORD = 0;
						this.MSTR = 0;
						this.CPOL = 0;
						this.CPHA = 0;
						this.SPR1 = 0;
						this.SPR0 = 0;
						this.core.pins.spiOut = this.core.pins.spiOut || [];
			},

			write: {
						0x4C: function _(value, oldValue) {
									this.SPIE = value >> 7;
									this.SPE = value >> 6;
									this.DORD = value >> 5;
									this.MSTR = value >> 4;
									this.CPOL = value >> 3;
									this.CPHA = value >> 2;
									this.SPR1 = value >> 1;
									this.SPR0 = value >> 0;
						},

						0x4D: function _(value, oldValue) {
									this.SPI2X = value & 1;
									return this.SPIF << 7 | this.WCOL << 6 | this.SPI2X;
						},
						0x4E: function _(value) {
									this.SPDR = value;
									this.core.pins.spiOut.push(value);
									this.SPIF = 1;
						}
			},

			read: {
						0x4D: function _() {
									this.SPIF = !!this.core.pins.spiIn.length | 0;
									return this.SPIF << 7 | this.WCOL << 6 | this.SPI2X;
						},
						0x4E: function _() {
									var spiIn = this.core.pins.spiIn;
									if (spiIn.length) return this.SPDR = spiIn.shift();
									return this.SPDR;
						}
			},

			update: function update(tick, ie) {

						if (this.SPIF && this.SPIE && ie) {
									this.SPIF = 0;
									return "SPI";
						}
			}
};

},{}],7:[function(require,module,exports){
'use strict';

function port(obj) {

	var out = { write: {}, read: {}, init: null };

	for (var k in obj) {

		var addr = obj[k];
		if (/DDR.|PORT./.test(k)) {

			out.write[addr] = setter(k);
		} else {

			out.read[addr] = getter(k);
			out.init = init(k);
		}
	}

	function setter(k) {
		return function (value, oldValue) {
			if (value != oldValue) this.core.pins[k] = value;
		};
	}

	function getter(k) {
		return function () {
			return this[k] & 0xFF | 0;
		};
	}

	function init(k) {
		return function () {
			this[k] = 0;
			var _this = this;
			Object.defineProperty(this.core.pins, k, {
				set: function set(v) {
					return _this[k] = v >>> 0 & 0xFF;
				},
				get: function get() {
					return _this[k];
				}
			});
		};
	}

	return out;
}

module.exports = {

	PORTB: port({ PINB: 0x23, DDRB: 0x24, PORTB: 0x25 }),
	PORTC: port({ PINC: 0x26, DDRC: 0x27, PORTC: 0x28 }),
	PORTD: port({ PIND: 0x29, DDRD: 0x2A, PORTD: 0x2B }),
	PORTE: port({ PINE: 0x2C, DDRE: 0x2D, PORTE: 0x2E }),
	PORTF: port({ PINF: 0x2F, DDRF: 0x30, PORTF: 0x31 }),

	TC: require('./At328P-TC.js'),

	USART: require('./At328P-USART.js'),

	PLL: {
		read: {
			0x49: function _(value) {
				return this.PINDIV << 4 | this.PLLE << 1 | this.PLOCK;
			}
		},
		write: {
			0x49: function _(value, oldValue) {
				if (value === oldValue) return;
				this.PINDIV = value >> 4 & 1;
				this.PLLE = value >> 1 & 1;
				this.PLOCK = 1;
			}
		},
		init: function init() {
			this.PINDIV = 0;
			this.PLLE = 0;
			this.PLOCK = 0;
		}
	},

	SPI: require('./At32u4-SPI.js'),

	EEPROM: {
		write: {
			0x3F: function _(value, oldValue) {
				value &= ~2;
				return value;
			}
		},
		read: {},
		init: function init() {}
	},

	ADCSRA: {

		write: {
			0x7A: function _(value, oldValue) {
				this.ADEN = value >> 7 & 1;
				this.ADSC = value >> 6 & 1;
				this.ADATE = value >> 5 & 1;
				this.ADIF = value >> 4 & 1;
				this.ADIE = value >> 3 & 1;
				this.ADPS2 = value >> 2 & 1;
				this.ADPS1 = value >> 1 & 1;
				this.ADPS0 = value & 1;
				if (this.ADEN) {
					if (this.ADSC) {
						this.ADCH = Math.random() * 0xFF >>> 0;
						this.ADCL = Math.random() * 0xFF >>> 0;
						this.ADSC = 0;
						value &= ~(1 << 6);
					}
				}
				return value;
			}
		},

		read: {
			0x79: function _() {
				return this.ADCH;
			},
			0x78: function _() {
				return this.ADCL;
			}
		},

		init: function init() {
			this.ADEN = 0;
			this.ADSC = 0;
			this.ADATE = 0;
			this.ADIF = 0;
			this.ADIE = 0;
			this.ADPS2 = 0;
			this.ADPS1 = 0;
			this.ADPS0 = 0;
		},

		update: function update(tick, ie) {
			if (this.ADEN && this.ADIE) {
				this.ADIF = 1;
				this.ADSC = 0;
				this.ADCH = Math.random() * 0xFF >>> 0;
				this.ADCL = Math.random() * 0xFF >>> 0;
			}

			if (this.ADIF && this.ADIE && ie) {
				this.ADIF = 0;
				return "ADC";
			}
		}

	}

};

},{"./At328P-TC.js":3,"./At328P-USART.js":4,"./At32u4-SPI.js":6}],8:[function(require,module,exports){
(function (global){
"use strict";

// http://www.atmel.com/webdoc/avrassembler/avrassembler.wb_instruction_list.html

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function bin(bytes, size) {

    var s = (bytes >>> 0).toString(2);
    while (s.length < size) {
        s = "0" + s;
    }return s.replace(/([01]{4,4})/g, "$1 ") + "  #" + (bytes >>> 0).toString(16).toUpperCase();
}

if (typeof performance === "undefined") {
    if (Date.now) global.performance = { now: function now() {
            return Date.now();
        } };else global.performance = { now: function now() {
            return new Date().getTime();
        } };
}

var Atcore = function () {
    function Atcore(desc) {
        var _this = this;

        _classCallCheck(this, Atcore);

        if (!desc) return;

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
        this.time = performance.now();

        this.i8a = new Int8Array(4);

        self.BREAKPOINTS = { 0: 0 };
        self.DUMP = function () {
            console.log('PC: #' + (_this.pc << 1).toString(16) + '\nSR: ' + _this.memory[0x5F].toString(2) + '\nSP: #' + _this.sp.toString(16) + '\n' + Array.prototype.map.call(_this.reg, function (v, i) {
                return 'R' + (i + '') + ' ' + (i < 10 ? ' ' : '') + '=\t#' + v.toString(16) + '\t' + v;
            }).join('\n'));
        };

        /*
        The I/O memory space contains 64 addresses for CPU peripheral functions as control registers, SPI, and other I/O functions.
        The I/O memory can be accessed directly, or as the data space locations following those of the register file, 0x20 - 0x5F. In
        addition, the ATmega328P has extended I/O space from 0x60 - 0xFF in SRAM where only the ST/STS/STD and
        LD/LDS/LDD instructions can be used.        
        */
        this.memory = new Uint8Array(32 // register file
        + (0xFF - 0x1F) // io
        + desc.sram);

        this.flash = new Uint8Array(desc.flash);
        this.eeprom = new Uint8Array(desc.eeprom);

        this.initMapping();
        this.instruction = null;
        this.periferals = {};
        this.pins = {};

        for (var periferalName in desc.periferals) {

            var addr = void 0,
                periferal = desc.periferals[periferalName];
            var obj = this.periferals[periferalName] = { core: this };

            for (addr in periferal.write) {
                this.writeMap[addr] = periferal.write[addr].bind(obj);
            }for (addr in periferal.read) {
                this.readMap[addr] = periferal.read[addr].bind(obj);
            }if (periferal.update) this.updateList.push(periferal.update.bind(obj));

            if (periferal.init) periferal.init.call(obj);
        }
    }

    _createClass(Atcore, [{
        key: "initMapping",
        value: function initMapping() {
            Object.defineProperties(this, {
                writeMap: { value: {}, enumerable: false, writable: false },
                readMap: { value: {}, enumerable: false, writable: false },
                updateList: { value: [], enumerable: false, writable: false },
                reg: { value: new Uint8Array(this.memory.buffer, 0, 0x20), enumerable: false },
                wreg: { value: new Uint16Array(this.memory.buffer, 0x20 - 8, 4), enumerable: false },
                sram: { value: new Uint8Array(this.memory.buffer, 0x100), enumerable: false },
                io: { value: new Uint8Array(this.memory.buffer, 0x20, 0xFF - 0x20), enumerable: false },
                prog: { value: new Uint16Array(this.flash.buffer), enumerable: false },
                native: { value: {}, enumerable: false }
            });

            this.codec.forEach(function (op) {
                if (op.str) parse(op);
                op.argv = Object.assign({}, op.args);
                op.bytes = op.bytes || 2;
                op.cycles = op.cycles || 1;
            });
        }
    }, {
        key: "read",
        value: function read(addr, pc) {
            var value = this.memory[addr];

            var periferal = this.readMap[addr];
            if (periferal) {
                var ret = periferal(value);
                if (ret !== undefined) value = ret;
            }

            // if( !({
            //     0x5d:1, // Stack Pointer Low
            //     0x5e:1, // Stack Pointer High
            //     0x5f:1, // status register
            //     0x25:1, // PORTB
            //     0x35:1, // TOV0
            //     0x23:1,  // PINB
            //     0x14B:1 // verbose USART stuff
            // })[addr] )
            // console.log( "READ: #", addr.toString(16) );

            return value;
        }
    }, {
        key: "readBit",
        value: function readBit(addr, bit, pc) {

            // if( !({
            //     0x5d:1, // Stack Pointer Low
            //     0x5e:1, // Stack Pointer High
            //     0x5f:1, // status register
            //     0x25:1, // PORTB
            //     0x35:1, // TOV0
            //     0x23:1  // PINB
            // })[addr] )
            // console.log( "PC=" + (pc<<1).toString(16) + " READ #" + (addr !== undefined ? addr.toString(16) : 'undefined') + " @ " + bit );

            var value = this.memory[addr];

            var periferal = this.readMap[addr];
            if (periferal) {
                var ret = periferal(value);
                if (ret !== undefined) value = ret;
            }

            return value >>> bit & 1;
        }
    }, {
        key: "write",
        value: function write(addr, value) {

            var periferal = this.writeMap[addr];

            if (periferal) {
                var ret = periferal(value, this.memory[addr]);
                if (ret === false) return;
                if (ret !== undefined) value = ret;
            }

            return this.memory[addr] = value;
        }
    }, {
        key: "writeBit",
        value: function writeBit(addr, bit, bvalue) {
            bvalue = !!bvalue | 0;
            var value = this.memory[addr];
            value = value & ~(1 << bit) | bvalue << bit;

            var periferal = this.writeMap[addr];

            if (periferal) {
                var ret = periferal(value, this.memory[addr]);
                if (ret === false) return;
                if (ret !== undefined) value = ret;
            }

            return this.memory[addr] = value;
        }
    }, {
        key: "exec",
        value: function exec(time) {
            var cycles = time * this.clock | 0;

            var start = this.tick;
            this.endTick = this.startTick + cycles;
            this.execTime = time;
            var lastUpdate = start;

            try {

                while (this.tick < this.endTick) {
                    if (!this.sleeping) {

                        if (this.pc > 0xFFFF) break;

                        var func = this.native[this.pc];
                        // if( !func ) 		    console.log( this.pc );
                        if (func) func.call(this);else if (!this.getBlock()) break;
                    } else {
                        this.tick += 100;
                    }

                    if (this.tick >= this.endTick || this.tick - lastUpdate > 1000) {
                        lastUpdate = this.tick;
                        this.updatePeriferals();
                    }
                }
            } finally {

                this.startTick = this.endTick;
            }
        }
    }, {
        key: "updatePeriferals",
        value: function updatePeriferals() {

            var interruptsEnabled = this.memory[0x5F] & 1 << 7;

            var updateList = this.updateList;

            for (var i = 0, l = updateList.length; i < l; ++i) {

                var ret = updateList[i](this.tick, interruptsEnabled);

                if (ret && interruptsEnabled) {
                    interruptsEnabled = 0;
                    this.sleeping = false;
                    this.interrupt(ret);
                }
            }
        }
    }, {
        key: "update",
        value: function update() {
            var now = performance.now();
            var delta = now - this.time;

            delta = Math.max(0, Math.min(33, delta));

            this.exec(delta / 1000);

            this.time = now;
        }
    }, {
        key: "getBlock",
        value: function getBlock() {
            var _this2 = this;

            var startPC = this.pc;

            var skip = false,
                prev = false;
            var nop = { name: 'NOP', cycles: 1, end: true, argv: {} };
            var cacheList = ['reg', 'wreg', 'io', 'memory', 'sram', 'flash'];
            var code = '"use strict";\nvar sp=this.sp, r, t1, i8a=this.i8a, SKIP=false, ';
            code += cacheList.map(function (c) {
                return c + " = this." + c;
            }).join(', ');
            code += ';\n';
            code += 'var sr = memory[0x5F]';
            for (var i = 0; i < 8; ++i) {
                code += ", sr" + i + " = (sr>>" + i + ")&1";
            }code += ';\n';

            // code += "console.log('\\nENTER BLOCK: " + (this.pc<<1).toString(16).toUpperCase() + " @ ', (this.pc<<1).toString(16).toUpperCase() );\n";
            // console.log('CREATE BLOCK: ', (this.pc<<1).toString(16).toUpperCase() );
            code += 'switch( this.pc ){\n';

            do {

                var inst = this.identify();
                if (!inst) {
                    // inst = nop;
                    console.warn(this.error);
                    (function () {
                        debugger;
                    })();
                    return;
                }

                code += "\ncase " + this.pc + ": // #" + (this.pc << 1).toString(16) + ": " + inst.name + ' [' + inst.decbytes.toString(2).padStart(16, "0") + ']' + '\n';

                var chunk = "\n                this.pc = " + this.pc + ";\n                if( (this.tick += " + inst.cycles + ") >= this.endTick ) break;\n                ";

                // BREAKPOINTS
                if (self.BREAKPOINTS && self.BREAKPOINTS[this.pc << 1] || inst.debug) {
                    chunk += "console.log('PC: #'+(this.pc<<1).toString(16)+'\\nSR: ' + memory[0x5F].toString(2) + '\\nSP: #' + sp.toString(16) + '\\n' + Array.prototype.map.call( reg, (v,i) => 'R'+(i+'')+' '+(i<10?' ':'')+'=\\t#'+v.toString(16) + '\\t' + v ).join('\\n') );\n";
                    chunk += '  debugger;\n';
                }

                var op = this.getOpcodeImpl(inst, inst.impl);
                var srDirty = op.srDirty;
                var line = op.begin,
                    endline = op.end;
                if (inst.flags) {
                    for (var i = 0, l = inst.flags.length; i < l; ++i) {
                        var flagOp = this.getOpcodeImpl(inst, this.flags[inst.flags[i]]);
                        line += flagOp.begin;
                        endline += flagOp.end;
                        srDirty |= flagOp.srDirty;
                    }
                }

                if (srDirty) {
                    var pres = (~srDirty >>> 0 & 0xFF).toString(2);
                    endline += "sr = (sr&0b" + pres + ") ";
                    for (var i = 0; i < 8; i++) {
                        if (srDirty & 1 << i) endline += " | (sr" + i + "<<" + i + ")";
                    }endline += ';\nmemory[0x5F] = sr;\n';
                }

                chunk += line + endline;

                if (skip) code += "  if( !SKIP ){\n    " + chunk + "\n  }\nSKIP = false;\n";else code += chunk;

                prev = skip;
                skip = inst.skip;

                this.pc += inst.bytes >> 1;
            } while (this.pc < this.prog.length && (!inst.end || skip || prev));

            code += "\nthis.pc = " + this.pc + ";\n";
            code += "\n\n}";
            // code += cacheList.map(c=>`this.${c} = ${c};`).join('\n');
            code += 'this.sp = sp;\n';

            var endPC = this.pc;
            this.pc = startPC;

            code = "return (function _" + (startPC << 1).toString(16) + "(){\n" + code + "});";

            try {
                var func = new Function(code)();

                for (var i = startPC; i < endPC; ++i) {
                    this.native[i] = func;
                }func.call(this);
            } catch (ex) {

                setTimeout(function () {
                    debugger;
                    var func = new Function(code);
                    func.call(_this2);
                }, 1);
                throw ex;
            }

            return true;
        }
    }, {
        key: "identify",
        value: function identify() {

            // if( this.pc<<1 == 0x966 ) debugger;

            var prog = this.prog,
                codec = this.codec,
                bytes = void 0,
                h = void 0,
                j = void 0,
                i = 0,
                l = codec.length,
                pc = this.pc;

            var bytes2 = void 0,
                bytes4 = void 0;
            bytes2 = prog[pc] >>> 0;
            bytes4 = (bytes2 << 16 | prog[pc + 1]) >>> 0;

            var verbose = 1;

            for (; i < l; ++i) {

                var desc = codec[i];
                var opcode = desc.opcode >>> 0;
                var mask = desc.mask >>> 0;
                var size = desc.bytes;

                if (size === 4) {

                    if (verbose == 2 || verbose == desc.name) console.log(desc.name + "\n" + bin(bytes4 & mask, 8 * 4) + "\n" + bin(opcode, 8 * 4));

                    if ((bytes4 & mask) >>> 0 !== opcode) continue;
                    bytes = bytes4;
                } else {

                    if (verbose == 2 || verbose == desc.name) console.log(desc.name + "\n" + bin(bytes2 & mask, 8 * 2) + "\n" + bin(opcode, 8 * 2));

                    if ((bytes2 & mask) >>> 0 !== opcode) continue;
                    bytes = bytes2;
                }

                this.instruction = desc;

                // var log = desc.name + " ";

                for (var k in desc.args) {
                    mask = desc.args[k];
                    var value = 0;
                    h = 0;
                    j = 0;
                    while (mask) {
                        if (mask & 1) {
                            value |= (bytes >> h & 1) << j;
                            j++;
                        }
                        mask = mask >>> 1;
                        h++;
                    }
                    desc.argv[k] = value;
                    // log += k + ":" + value + "  "
                }
                desc.decbytes = bytes;
                // console.log(log);

                return this.instruction;
            }

            this.error = "#" + (this.pc << 1).toString(16).toUpperCase() + " opcode: " + bin(bytes2, 16);

            return null;
        }
    }, {
        key: "interrupt",
        value: function interrupt(source) {

            // console.log("INTERRUPT " + source);

            var addr = this.interruptMap[source];
            var pc = this.pc;
            this.memory[this.sp--] = pc >> 8;
            this.memory[this.sp--] = pc;
            this.memory[0x5F] &= ~(1 << 7); // disable interrupts
            this.pc = addr;
        }
    }, {
        key: "getOpcodeImpl",
        value: function getOpcodeImpl(inst, str) {
            var i,
                l,
                op = { begin: "", end: "", srDirty: 0 };

            if (Array.isArray(str)) {
                for (i = 0, l = str.length; i < l; ++i) {
                    var tmp = this.getOpcodeImpl(inst, str[i]);
                    op.begin += tmp.begin + "\n";
                    op.end += tmp.end + "\n";
                    op.srDirty |= tmp.srDirty;
                }
                return op;
            }

            var src = str,
                argv = inst.argv;

            for (var k in argv) {
                str = str.split(k.toLowerCase()).join(argv[k]);
            }var SRSync = "",
                SRDirty = 0;

            str = str.replace(/SR@([0-9]+)\s*←\s*1;?\s*$/g, function (m, bit, assign) {
                SRDirty |= 1 << bit;
                return "sr" + bit + " = 1;\n";
            });
            str = str.replace(/SR@([0-9]+)\s*←\s*0;?\s*$/g, function (m, bit, assign) {
                SRDirty |= 1 << bit;
                return "sr" + bit + " = 0;\n";
            });
            str = str.replace(/SR([0-9]+)\s*=(.*)/g, function (m, bit, assign) {
                SRDirty |= 1 << bit;
                return "sr" + bit + " = " + assign + ";\n";
            });
            str = str.replace(/SR\s*←/g, function () {
                SRSync = 'memory[0x5F] = sr; sr0=sr&1; sr1=(sr>>1)&1; sr2=(sr>>2)&1; sr3=(sr>>3)&1; sr4=(sr>>4)&1; sr5=(sr>>5)&1; sr6=(sr>>6)&1; sr7=(sr>>7)&1;';
                return 'sr =';
            });
            str = str.replace(/SR@([0-9]+)\s*←(.*)$/g, function (m, bit, assign) {
                SRDirty |= 1 << bit;
                return "sr" + bit + " = (!!(" + assign + "))|0;";
            });
            str = str.replace(/SR\s*¯/g, '(~sr)');
            str = str.replace(/SR@([0-9]+)\s*¯/g, '(~sr$1) ');
            str = str.replace(/SR@([0-9]+)\s*/g, '(sr$1) ');
            str = str.replace(/SR/g, 'sr');

            str = str.replace(/WR([0-9]+)\s*←/g, 'r = wreg[$1] =');
            str = str.replace(/WR([0-9]+)@([0-9]+)\s*←(.*)$/g, function (m, num, bit, assign) {
                return "r = wreg[" + num + "] = (wreg[" + num + "] & ~(1<<" + bit + ")) | (((!!(" + assign + "))|0)<<" + bit + ");";
            });
            str = str.replace(/WR([0-9]+)\s*¯/g, '(~wreg[$1]) ');
            str = str.replace(/WR([0-9]+)@([0-9]+)\s*¯/g, '(~(wreg[$1]>>>$2)&1) ');
            str = str.replace(/WR([0-9]+)@([0-9]+)\s*/g, '((wreg[$1]>>>$2)&1) ');
            str = str.replace(/WR([0-9]+)/g, 'wreg[$1]');

            str = str.replace(/R([0-9<]+)(\+[0-9]+)?\s*←/g, function (m, num, numadd) {
                numadd = numadd || "";
                op.end += "reg[(" + num + ")" + numadd + "] = r;\n";
                return 'r = ';
            });
            str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*←(.*)$/g, function (m, num, numadd, bit, assign) {
                numadd = numadd || "";
                op.end += "reg[(" + num + ")" + numadd + "] = r;\n";
                return "r = (reg[(" + num + ")" + numadd + "] & ~(1<<" + bit + ")) | (((!!(" + assign + "))|0)<<" + bit + ");";
            });

            str = str.replace(/R([0-9<]+)(\+[0-9]+)?\s*=\s+/g, function (m, num, numadd) {
                numadd = numadd || "";
                return "r = reg[(" + num + ")" + numadd + "] = ";
            });
            str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*=\s+(.*)$/g, function (m, num, numadd, bit, assign) {
                numadd = numadd || "";
                return "r = reg[(" + num + ")" + numadd + "] = (reg[(" + num + ")" + numadd + "] & ~(1<<" + bit + ")) | (((!!(" + assign + "))|0)<<" + bit + ");";
            });

            str = str.replace(/R([0-9<]+)(\+[0-9]+)?\s*¯/g, '(~reg[($1)$2]) ');
            str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*¯/g, '(~(reg[($1)$2]>>>$3)&1) ');
            str = str.replace(/R([0-9<]+)(\+[0-9]+)?@([0-9]+)\s*/g, '((reg[($1)$2]>>>$3)&1) ');
            str = str.replace(/R([0-9<]+)(\+[0-9]+)?/g, '(reg[($1)$2]>>>0)');

            str = str.replace(/R@([0-9]+)\s*¯/g, '(~(r>>>$1)&1) ');
            str = str.replace(/R@([0-9]+)\s*/g, '((r>>>$1)&1) ');
            str = str.replace(/I\/O/g, 'io');
            str = str.replace(/R/g, 'r');

            str = str.replace(/FLASH\(([XYZ])\)\s*←(.*);?$/g, function (m, n, v) {
                return 'flash[ wreg[' + (n.charCodeAt(0) - 87) + '] ] = ' + v + ';';
            });
            str = str.replace(/FLASH\(([XYZ])\)/g, function (m, n) {
                return 'flash[ wreg[' + (n.charCodeAt(0) - 87) + '] ]';
            });
            str = str.replace(/\(([XYZ])(\+[0-9]+)?\)\s*←(.*);?$/g, function (m, n, off, v) {
                return 'this.write( wreg[' + (n.charCodeAt(0) - 87) + ']' + (off || '') + ', ' + v + ');';
            });
            str = str.replace(/\(([XYZ])(\+[0-9]+)?\)/g, function (m, n, off) {
                return 'this.read( wreg[' + (n.charCodeAt(0) - 87) + ']' + (off || '') + ', this.pc )';
            });

            str = str.replace(/\(STACK\)\s*←/g, function (m, n) {
                return 'memory[sp--] =';
            });
            str = str.replace(/\((STACK)\)/g, function (m, n) {
                return 'memory[++sp]';
            });
            str = str.replace(/\(STACK2\)\s*←(.*)/g, 't1 = $1;\nmemory[sp--] = t1>>8;\nmemory[sp--] = t1;\n');
            str = str.replace(/\((STACK2)\)/g, '(memory[++sp] + (memory[++sp]<<8))');

            str = str.replace(/⊕/g, '^');
            str = str.replace(/•/g, '&');

            str = str.replace(/io\[([0-9]+)\]\s*←(.*?);?$/g, 'this.write( 32+$1, $2 )');
            str = str.replace(/io\[([0-9]+)@([0-9]+)\]\s*←(.*?);?$/g, 'this.writeBit( 32+$1, $2, $3 )');
            str = str.replace(/io\[([0-9+<]+)@([0-9]+)\]/g, 'this.readBit( 32+$1, $2, this.pc )');
            str = str.replace(/io\[([0-9+<]+)\]/g, 'this.read( 32+$1, this.pc )');
            str = str.replace(/SP/g, 'sp');
            str = str.replace(/PC\s*←(.*)$/g, 't1 = $1;\nif( !t1 ) (function(){debugger;})(); this.pc = t1; break;\n');
            str = str.replace(/PC/g, 'this.pc');
            str = str.replace(/←/g, '=');

            str = '// ' + src.replace(/[\n\r]+\s*/g, '\n\t// ') + "\n" + str + "\n";

            op.srDirty = SRDirty;

            op.begin = str;
            op.end += SRSync;

            return op;
        }
    }, {
        key: "statusI",
        get: function get() {
            return this.sreg & 1 << 7;
        }
    }, {
        key: "statusT",
        get: function get() {
            return this.sreg & 1 << 6;
        }
    }, {
        key: "statusH",
        get: function get() {
            return this.sreg & 1 << 5;
        }
    }, {
        key: "statusS",
        get: function get() {
            return this.sreg & 1 << 4;
        }
    }, {
        key: "statusV",
        get: function get() {
            return this.sreg & 1 << 3;
        }
    }, {
        key: "statusN",
        get: function get() {
            return this.sreg & 1 << 2;
        }
    }, {
        key: "statusZ",
        get: function get() {
            return this.sreg & 1 << 1;
        }
    }, {
        key: "statusC",
        get: function get() {
            return this.sreg & 1 << 0;
        }
    }], [{
        key: "ATmega328P",
        value: function ATmega328P() {

            var core = new Atcore({
                flash: 32 * 1024,
                eeprom: 1 * 1024,
                sram: 2 * 1024,
                codec: AtCODEC,
                flags: AtFlags,
                clock: 16 * 1000 * 1000, // speed in kHz
                periferals: require('./At328P-periferals.js'),
                interrupt: {
                    RESET: 0x0000, //  External pin, power-on reset, brown-out reset and watchdog system reset
                    INT0: 0x002, //  External interrupt request 0
                    INT1: 0x0004, //  External interrupt request 1
                    PCINT0: 0x0006, //  Pin change interrupt request 0
                    PCINT1: 0x0008, //  Pin change interrupt request 1
                    PCINT2: 0x000A, //  Pin change interrupt request 2
                    WDT: 0x000C, //  Watchdog time-out interrupt
                    TIMER2A: 0x000E, //  COMPA Timer/Counter2 compare match A
                    TIMER2B: 0x0010, //  COMPB Timer/Counter2 compare match B
                    TIMER2O: 0x0012, //  OVF Timer/Counter2 overflow
                    TIMER1C: 0x0014, //  CAPT Timer/Counter1 capture event
                    TIMER1A: 0x0016, //  COMPA Timer/Counter1 compare match A
                    TIMER1B: 0x0018, //  COMPB Timer/Counter1 compare match B
                    TIMER1O: 0x001A, //  OVF Timer/Counter1 overflow
                    TIMER0A: 0x001C, //  COMPA Timer/Counter0 compare match A
                    TIMER0B: 0x001E, //  COMPB Timer/Counter0 compare match B
                    TIMER0O: 0x0020, //  OVF Timer/Counter0 overflow
                    SPI: 0x0022, // , STC SPI serial transfer complete
                    USARTRX: 0x0024, // , RX USART Rx complete
                    USARTE: 0x0026, // , UDRE USART, data register empty
                    USARTTX: 0x0028, // , TX USART, Tx complete
                    ADC: 0x002A, //  ADC conversion complete
                    EEREADY: 0x002C, //  READY EEPROM ready
                    ANALOG: 0x002E, //  COMP Analog comparator
                    TWI: 0x0030, //  2-wire serial interface
                    SPM: 0x0032 //  READY Store program memory ready                
                }
            });

            return core;
        }
    }, {
        key: "ATmega32u4",
        value: function ATmega32u4() {
            var _interrupt;

            var core = new Atcore({
                flash: 32 * 1024,
                eeprom: 1 * 1024,
                sram: 2 * 1024 + 512,
                codec: AtCODEC,
                flags: AtFlags,
                clock: 16 * 1000 * 1000, // speed in kHz
                periferals: require('./At32u4-periferals.js'),
                interrupt: (_interrupt = {
                    RESET: 0x0000, //  External pin, power-on reset, brown-out reset and watchdog system reset
                    INT0: 0x002, //  External interrupt request 0
                    INT1: 0x0004, //  External interrupt request 1
                    INT2: 0x0006, //  External interrupt request 2
                    INT3: 0x0008, //  External interrupt request 3
                    RESERVED0: 0x000A,
                    RESERVED1: 0x000C,
                    INT6: 0x000E, //  External interrupt request 6
                    PCINT0: 0x0012, //  Pin change interrupt request 0
                    USBGEN: 0x0014, // USB General Interrupt request
                    USBEND: 0x0016, // USB Endpoint Interrupt request
                    WDT: 0x0018, //  Watchdog time-out interrupt

                    TIMER1C: 0x0020, //  CAPT Timer/Counter1 capture event
                    TIMER1A: 0x0022, //  COMPA Timer/Counter1 compare match A
                    TIMER1B: 0x0024 }, _defineProperty(_interrupt, "TIMER1C", 0x0026), _defineProperty(_interrupt, "TIMER1O", 0x0028), _defineProperty(_interrupt, "TIMER0A", 0x002A), _defineProperty(_interrupt, "TIMER0B", 0x002C), _defineProperty(_interrupt, "TIMER0O", 0x002E), _defineProperty(_interrupt, "SPI", 0x0030), _defineProperty(_interrupt, "USARTRX", 0x0032), _defineProperty(_interrupt, "USARTE", 0x0034), _defineProperty(_interrupt, "USARTTX", 0x0036), _defineProperty(_interrupt, "ANALOG", 0x0038), _defineProperty(_interrupt, "ADC", 0x003A), _defineProperty(_interrupt, "EEREADY", 0x003C), _defineProperty(_interrupt, "TIMER3C", 0x003E), _defineProperty(_interrupt, "TIMER3A", 0x0040), _defineProperty(_interrupt, "TIMER3B", 0x0042), _defineProperty(_interrupt, "TIMER3C", 0x0044), _defineProperty(_interrupt, "TIMER3O", 0x0046), _defineProperty(_interrupt, "TWI", 0x0048), _defineProperty(_interrupt, "SPM", 0x004A), _defineProperty(_interrupt, "TIMER4A", 0x004C), _defineProperty(_interrupt, "TIMER4B", 0x004E), _defineProperty(_interrupt, "TIMER4D", 0x0050), _defineProperty(_interrupt, "TIMER4O", 0x0052), _defineProperty(_interrupt, "TIMER4FPF", 0x0054), _interrupt)
            });

            return core;
        }
    }]);

    return Atcore;
}();

function parse(out) {
    var opcode = 0;
    var mask = 0;
    var args = {};

    var str = out.str,
        l = str.length;
    for (var i = 0; i < l; ++i) {
        var chr = str[i];
        var bit = l - i - 1 >>> 0;
        if (chr == '0') {
            mask |= 1 << bit;
        } else if (chr == '1') {
            mask |= 1 << bit;
            opcode |= 1 << bit;
        } else {
            if (!(chr in args)) args[chr] = 0;
            args[chr] |= 1 << bit;
        }
    }

    out.opcode = opcode;
    out.mask = mask;
    out.args = args;
    out.bytes = l / 8 | 0;
}

var AtCODEC = [{
    name: 'ADC',
    str: '000111rdddddrrrr',
    impl: 'Rd ← Rd + Rr + SR@0;',
    flags: 'hzvnsc'
}, {
    name: 'ADD',
    str: '000011rdddddrrrr',
    impl: 'Rd ← Rd + Rr;',
    flags: 'hzvnsc'
}, {
    name: 'MUL',
    str: '100111rdddddrrrr',
    impl: ['t1 = Rd * Rr', 'R0 = t1', 'R1 = t1 >> 8', 'SR1 = !t1|0', 'SR0 = (t1>>15)&1'],
    flags: 'hvnsc'
}, {
    name: 'ADIW',
    str: '10010110KKddKKKK',
    impl: ['WRd ← WRd + k;'],
    flags: 'ZVNSC'
}, {
    name: 'AND',
    str: '001000rdddddrrrr',
    impl: ['Rd ← Rd • Rr;', 'SR@3 ← 0'],
    flags: 'zns'
}, {
    name: 'ANDI',
    str: '0111KKKKddddKKKK',
    impl: ['Rd+16 ← Rd+16 • k;', 'SR@3 ← 0'],
    flags: 'zns'
}, {
    name: 'ASR',
    str: '1001010ddddd0101',
    impl: ['SR@0 ← Rd • 1', 'Rd ← Rd >> 1;'],
    flags: 'zns'
}, {
    name: 'BCLRi',
    str: '1001010011111000',
    impl: 'SR@7 ← 0'
}, {
    name: 'BCLRt',
    str: '1001010011101000',
    impl: 'SR@6 ← 0'
}, {
    name: 'BCLRh',
    str: '1001010011011000',
    impl: 'SR@5 ← 0'
}, {
    name: 'BCLRs',
    str: '1001010011001000',
    impl: 'SR@4 ← 0'
}, {
    name: 'BCLRv',
    str: '1001010010111000',
    impl: 'SR@3 ← 0'
}, {
    name: 'BCLRn',
    str: '1001010010101000',
    impl: 'SR@2 ← 0'
}, {
    name: 'BCLRz',
    str: '1001010010011000',
    impl: 'SR@1 ← 0'
}, {
    name: 'BCLRc',
    str: '1001010010001000',
    impl: 'SR@0 ← 0'
}, {
    name: 'BRCC',
    str: '111101kkkkkkk000',
    impl: ['if( !SR@0 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BRBS',
    str: '111100kkkkkkksss',
    impl: ['if( SR@s ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BRCS',
    str: '111100kkkkkkk000',
    impl: ['if( SR@0 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BREQ',
    str: '111100kkkkkkk001',
    impl: ['if( SR@1 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 3
}, {
    name: 'BRLT',
    str: '111100kkkkkkk100',
    impl: ['if( SR@4 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 3
}, {
    name: 'BRGE',
    str: '111101kkkkkkk100',
    impl: ['if( !SR@4 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 3
}, {
    name: 'BRNE',
    str: '111101kkkkkkk001',
    impl: ['if( !SR@1 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 3
}, {
    name: 'BRPL',
    str: '111101kkkkkkk010',
    impl: ['if( !SR@2 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BRMI',
    str: '111100kkkkkkk010',
    impl: ['if( SR@2 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 2
}, {
    name: 'BRTC',
    str: '111101kkkkkkk110',
    impl: ['if( !SR@6 ){', '  PC ← PC + (k << 25 >> 25) + 1;', '}'],
    cycles: 3
}, {
    name: 'BST',
    str: '1111101ddddd0bbb',
    impl: 'SR6 = Rd@b'
    //,debug: true
}, {
    name: 'BLD',
    str: '1111100ddddd0bbb',
    impl: 'Rd@b ← SR@6'
}, {
    name: 'CALL',
    str: '1001010kkkkk111kkkkkkkkkkkkkkkkk',
    cycles: 4,
    impl: ['(STACK2) ← PC + 2', 'PC ← k']
}, {
    name: 'CBI',
    str: '10011000AAAAAbbb',
    impl: 'I/O[a@b] ← 0;'
}, {
    name: 'COM',
    str: '1001010ddddd0000',
    impl: ['Rd ← ~ Rd;', 'SR@3 ← 0', 'SR@0 ← 1'],
    flags: 'zns'
}, {
    name: 'FMUL',
    str: '000000110ddd1rrr',
    impl: ['t1 = Rd+16 * Rr+16 << 1', 'R0 = t1', 'R1 = t1 >> 8', 'SR1 = !t1|0', 'SR0 = (t1>>15)&1']
}, {
    name: 'NOP',
    str: '0000000000000000',
    impl: ''
}, {
    name: 'NEG',
    str: '1001010ddddd0001',
    impl: ['Rd ← - Rd;', 'SR3 = R@7 • R@6 ¯ • R@5 ¯ • R@4 ¯ • R@3 ¯ • R@2 ¯ • R@1 ¯ • R@0 ¯', 'SR0 = (!!R)|0', 'SR@5 ← R@3 | Rd3 ¯'],
    flags: 'zns'
}, {
    name: 'CP',
    str: '000101rdddddrrrr',
    impl: ['R = ((Rd - Rr) >>> 0) & 0xFF;', 'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)', 'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)', 'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) + (Rd@7 ¯ • Rr@7 • R@7)'],
    flags: 'zns'
}, {
    name: 'CPI',
    str: '0011KKKKddddKKKK',
    impl: ['R = ((Rd+16 - k) >>> 0) & 0xFF;', 'SR@5 ← (Rd+16@3 ¯ • ((k>>3)&1)) | (((k>>3)&1) • R@3) | (R@3 • Rd+16@3 ¯)', 'SR@0 ← (Rd+16@7 ¯ • ((k>>7)&1)) | (((k>>7)&1) • R@7) | (R@7 • Rd+16@7 ¯)', 'SR@3 ← (Rd+16@7 • ((k>>7)&1^1) • R@7 ¯) + (Rd+16@7 ¯ • ((k>>7)&1) • R@7)'],
    flags: 'zns'
}, {
    name: 'CPC',
    str: '000001rdddddrrrr',
    impl: ['R = (Rd - Rr - SR@0) & 0xFF', 'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)', 'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)', 'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) | (Rd@7 ¯ • Rr@7 • R@7)', 'SR@1 ← (!R) & SR@1'],
    flags: 'ns'
}, {
    name: 'CPSE',
    str: '000100rdddddrrrr',
    impl: 'SKIP ← Rr == Rd',
    skip: true
}, {
    name: 'DEC',
    str: '1001010ddddd1010',
    impl: ['Rd ← Rd - 1', 'SR@3 ← R@7 ¯ • R@6 • R@5 • R@4 • R@3 • R@2 • R@1 • R@0'],
    flags: 'zns'
}, {
    name: 'EOR',
    str: '001001rdddddrrrr',
    impl: ['Rd ← Rd ⊕ Rr;', 'SR@3 ← 0'],
    flags: 'zns'
}, {
    name: 'ICALL',
    str: '1001010100001001',
    cycles: 3,
    impl: ['(STACK2) ← PC + 2', 'PC ← WR3']
    // end:true
}, {
    name: 'INSR',
    str: '1011011ddddd1111',
    impl: "Rd \u2190 SR",
    cycles: 1
    // debug: true
}, {
    name: 'IN',
    str: '10110AAddddd1110',
    impl: "Rd \u2190 sp>>>8",
    cycles: 1
}, {
    name: 'IN',
    str: '10110AAddddd1101',
    impl: "Rd \u2190 sp&0xFF",
    cycles: 1
}, {
    name: 'IN',
    str: '10110AAdddddAAAA',
    impl: "Rd \u2190 I/O[a]",
    cycles: 1
}, {
    name: 'INC',
    str: '1001010ddddd0011',
    impl: ['Rd ← Rd + 1;', 'SR@3 ← R@7 • R@6 ¯ • R@5 ¯ • R@4 ¯ • R@3 ¯ • R@2 ¯ • R@1 ¯ • R@0 ¯'],
    flags: 'zns'
}, {
    name: 'IJMP',
    str: '1001010000001001',
    impl: "PC \u2190 WR3",
    cycles: 2,
    end: true
}, {
    name: 'JMP',
    str: '1001010kkkkk110kkkkkkkkkkkkkkkkk',
    impl: "PC \u2190 k",
    cycles: 3,
    end: true
}, {
    name: 'LDI',
    str: '1110KKKKddddKKKK',
    impl: 'Rd+16 ← k'
}, {
    name: 'LDS',
    str: '1001000xxxxx0000kkkkkkkkkkkkkkkk',
    impl: 'Rx ← this.read(k)',
    bytes: 4
}, {
    name: 'LDX',
    str: '1001000ddddd1100',
    impl: "Rd \u2190 (X);",
    cycles: 2
}, {
    name: 'LDX+',
    str: '1001000ddddd1101',
    impl: ["Rd \u2190 (X);", "WR1 ++;"],
    cycles: 2
}, {
    name: 'LDX-',
    str: '1001000ddddd1110',
    impl: ["WR1 --;", "Rd \u2190 (X);"],
    cycles: 2
}, {
    name: 'LDY',
    str: '1000000ddddd1000',
    impl: "Rd \u2190 (Y)",
    cycles: 2
}, {
    name: 'LDY+',
    str: '1001000ddddd1001',
    impl: ["Rd \u2190 (Y);", "WR3 ++;"],
    cycles: 2
}, {
    name: 'LDY-',
    str: '1001000ddddd1010',
    impl: ["WR3 --;", "Rd \u2190 (Y);"],
    cycles: 2
}, {
    name: 'LDYQ',
    str: '10q0qq0ddddd1qqq',
    impl: ["Rd \u2190 (Y+q);"],
    cycles: 2
}, {
    name: 'LDZ',
    str: '1000000ddddd0000',
    impl: "Rd \u2190 (Z);",
    cycles: 2
}, {
    name: 'LDZ+',
    str: '1001000ddddd0001',
    impl: ["Rd \u2190 (Z);", "WR3 ++;"],
    cycles: 2
}, {
    name: 'LDZ-',
    str: '1001000ddddd0010',
    impl: ["WR3 --;", "Rd \u2190 (Z);"],
    cycles: 2
}, {
    name: 'LDZQ',
    str: '10q0qq0ddddd0qqq',
    impl: ["Rd \u2190 (Z+q);"],
    cycles: 2
}, {
    name: 'LPMi',
    str: '1001010111001000',
    impl: 'R0 ← FLASH(Z)'
}, {
    name: 'LPMii',
    str: '1001000ddddd0100',
    impl: 'Rd ← FLASH(Z)'
}, {
    name: 'LPMiii',
    str: '1001000ddddd0101',
    impl: ['Rd ← FLASH(Z);', 'WR3 ++;']
}, {
    name: 'LSR',
    str: '1001010ddddd0110',
    // debug:true,
    impl: ['SR0 = Rd@0', 'Rd ← Rd >>> 1', 'SR2 = 0', 'SR3 = SR@2 ^ SR0'],
    flags: 'zs'
}, {
    name: 'MOV',
    str: '001011rdddddrrrr',
    impl: ['Rd ← Rr;']
}, {
    name: 'MOVW',
    str: '00000001ddddrrrr',
    impl: ['Rd<<1 = Rr<<1', 'Rd<<1+1 = Rr<<1+1']
}, {
    name: 'MULSU',
    str: '000000110ddd0rrr',
    impl: ['i8a[0] = Rd+16', 't1 = i8a[0] * Rr+16', 'R0 = t1', 'R1 = t1 >> 8', 'SR1 = !t1|0', 'SR0 = (t1>>15)&1']
}, {
    name: 'MULS',
    str: '00000010ddddrrrr',
    impl: ['i8a[0] = Rd+16', 'i8a[1] = Rr+16', 't1 = i8a[0] * i8a[1]', 'R0 = t1', 'R1 = t1 >> 8', 'SR1 = !t1|0', 'SR0 = (t1>>15)&1']
}, {
    name: 'OR',
    str: '001010rdddddrrrr',
    impl: ['Rd ← Rd | Rr;', 'SR@3 ← 0'],
    flags: 'zns'
}, {
    name: 'ORI',
    str: '0110KKKKddddKKKK',
    impl: ['Rd+16 ← Rd+16 | k;', 'SR@3 ← 0'],
    flags: 'zns'
}, {
    name: 'OUTsr',
    str: '1011111rrrrr1111',
    impl: 'I/O[63] ← SR ← Rr',
    cycles: 1
}, {
    name: 'OUTsph',
    str: '1011111rrrrr1110',
    impl: ['I/O[62] ← Rr;', 'sp = (io[62]<<8) | (sp&0xFF);'],
    cycles: 1
}, {
    name: 'OUTspl',
    str: '1011111rrrrr1101',
    impl: ['I/O[61] ← Rr;', 'sp = (sp&0xFF00) | io[61];'],
    cycles: 1
}, {
    name: 'OUT',
    str: '10111AArrrrrAAAA',
    impl: "I/O[a] \u2190 Rr",
    cycles: 1
}, {
    name: 'PUSH',
    str: '1001001ddddd1111',
    impl: '(STACK) ← Rd',
    cycles: 2
}, {
    name: 'POP',
    str: '1001000ddddd1111',
    impl: 'Rd ← (STACK)',
    cycles: 2
}, {
    name: 'RET',
    str: '1001010100001000',
    cycles: 4,
    end: true,
    impl: 'PC ← (STACK2)'
}, {
    name: 'RETI',
    str: '1001010100011000',
    cycles: 4,
    end: true,
    impl: ['memory[0x5F] = (SR |= 1<<7);', 'PC ← (STACK2)']
}, {
    name: 'ROR',
    str: '1001010ddddd0111',
    impl: ['SR0 = Rd@0', 'Rd ← Rd >>> 1 | (SR<<7&0x80)', 'SR2 = R>>7', 'SR3 = SR@2 ^ SR0'],
    flags: 'zs'
}, {
    name: 'HALT',
    str: '1100111111111111',
    impl: "PC \u2190 PC - 1",
    end: true
}, {
    name: 'RCALL',
    str: '1101kkkkkkkkkkkk',
    cycles: 3,
    impl: ['(STACK2) ← PC + 1', "PC \u2190 PC + (k << 20 >> 20) + 1"],
    end: false
}, {
    name: 'RJMP',
    str: '1100kkkkkkkkkkkk',
    impl: "PC \u2190 PC + (k << 20 >> 20) + 1",
    end: true
}, {
    name: 'SEC',
    str: '1001010000001000',
    impl: "SR@0 \u2190 1"
}, {
    name: 'SET',
    str: '1001010001101000',
    impl: "SR@6 \u2190 1"
}, {
    name: 'SEI',
    str: '1001010001111000',
    impl: "SR@7 \u2190 1"
}, {
    name: 'SFMUL',
    str: '000000111ddd0rrr',
    impl: ['i8a[0] = Rd+16', 'i8a[1] = Rr+16', 't1 = i8a[0] * i8a[1] << 1', 'R0 = t1', 'R1 = t1 >> 8', 'SR1 = !t1|0', 'SR0 = (t1>>15)&1']
}, {
    name: 'STS',
    str: '1001001ddddd0000kkkkkkkkkkkkkkkk',
    impl: "this.write( k, Rd )",
    bytes: 4
}, {
    name: 'STX',
    str: '1001001rrrrr1100',
    impl: "(X) \u2190 Rr"
}, {
    name: 'STX+',
    str: '1001001rrrrr1101',
    impl: ["(X) \u2190 Rr", "WR1 ++;"]
}, {
    name: 'STX-',
    str: '1001001rrrrr1110',
    impl: ["WR1 --;", "(X) \u2190 Rr"]
}, {
    name: 'STY',
    str: '1000001rrrrr1000',
    impl: "(Y) \u2190 Rr"
}, {
    name: 'STY+',
    str: '1001001rrrrr1001',
    impl: ["(Y) \u2190 Rr", "WR1 ++;"]
}, {
    name: 'STY-',
    str: '1001001rrrrr1010',
    impl: ["WR1 --;", "(Y) \u2190 Rr"]
}, {
    name: 'STYQ',
    str: '10q0qq1rrrrr1qqq',
    impl: ["(Y+q) \u2190 Rr"]
}, {
    name: 'STZ',
    str: '1000001rrrrr0000',
    impl: "(Z) \u2190 Rr"
}, {
    name: 'STZ+',
    str: '1001001rrrrr0001',
    impl: ["(Z) \u2190 Rr", "WR3 ++;"]
}, {
    name: 'STZ-',
    str: '1001001rrrrr0010',
    impl: ["WR3 --;", "(Z) \u2190 Rr"]
}, {
    name: 'STZQ',
    str: '10q0qq1rrrrr0qqq',
    impl: ["(Z+q) \u2190 Rr"]
}, {
    name: 'SBC',
    str: '000010rdddddrrrr',
    impl: ['Rd ← (Rd - Rr - SR@0) & 0xFF;', 'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)', 'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)', 'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) | (Rd@7 ¯ • Rr@7 • R@7)', 'SR@1 ← (!R) & SR@1'],
    flags: 'ns'
}, {
    name: 'SUB',
    str: '000110rdddddrrrr',
    impl: ['Rd ← (Rd - Rr)&0xFF;', 'SR@5 ← (Rd@3 ¯ • Rr@3) | (Rr@3 • R@3) | (R@3 • Rd@3 ¯)', 'SR@0 ← (Rd@7 ¯ • Rr@7) | (Rr@7 • R@7) | (R@7 • Rd@7 ¯)', 'SR@3 ← (Rd@7 • Rr@7 ¯ • R@7 ¯) | (Rd@7 ¯ • Rr@7 • R@7)'],
    flags: 'zns'
}, {
    name: 'SBCI',
    str: '0100KKKKddddKKKK',
    impl: ['Rd+16 ← (Rd+16 - k - SR@0)&0xFF;', 'SR@5 ← (Rd+16@3 ¯ • ((k>>3)&1)) | (((k>>3)&1) • R@3) | (R@3 • Rd+16@3 ¯)', 'SR@0 ← (Rd+16@7 ¯ • ((k>>7)&1)) | (((k>>7)&1) • R@7) | (R@7 • Rd+16@7 ¯)', 'SR@3 ← (Rd+16@7 • ((k>>7)&1^1) • R@7 ¯) | (Rd+16@7 ¯ • ((k>>7)&1) • R@7)', 'SR@1 ← (!R) & SR@1'],
    flags: 'ns'
}, {
    name: 'SUBI',
    str: '0101KKKKddddKKKK',
    impl: ['Rd+16 ← Rd+16 - k;', 'SR@5 ← (Rd+16@3 ¯ • ((k>>3)&1)) | (((k>>3)&1) • R@3) | (R@3 • Rd+16@3 ¯)', 'SR@0 ← (Rd+16@7 ¯ • ((k>>7)&1)) | (((k>>7)&1) • R@7) | (R@7 • Rd+16@7 ¯)', 'SR@3 ← (Rd+16@7 • ((k>>7)&1^1) • R@7 ¯) | (Rd+16@7 ¯ • ((k>>7)&1) • R@7)'],
    flags: 'zns'
}, {
    name: 'SBI',
    str: '10011010AAAAAbbb',
    impl: 'I/O[a@b] ← 1;'
}, {
    name: 'SBIW',
    str: '10010111KKddKKKK',
    impl: ['WRd ← WRd - k;'],
    flags: 'ZVNS'
}, {
    name: 'SBIC',
    str: '10011001AAAAAbbb',
    impl: 'SKIP ← !I/O[a@b]',
    skip: true
}, {
    name: 'SBIS',
    str: '10011011AAAAAbbb',
    impl: 'SKIP ← I/O[a@b]',
    skip: true
}, {
    name: 'SBRC',
    str: '1111110rrrrr0bbb',
    // debug: true,
    impl: 'SKIP ← !(Rr & (1<<b))',
    skip: true
}, {
    name: 'SBRS',
    str: '1111111rrrrr0bbb',
    // debug: true,
    impl: 'SKIP ← Rr & (1<<b)',
    skip: true
}, {
    name: 'SLEEP',
    str: '1001010110001000',
    impl: ['this.sleeping = true', 'PC ← PC + 1'],
    // debug: true,
    cycles: 0
}, {
    name: 'SWAP',
    str: '1001010ddddd0010',
    impl: ['Rd ← (Rd >>> 4) | (Rd << 4)']
}];

var AtFlags = {

    h: 'SR@5 ← (Rd@3 • Rr@3) + (Rr@3 • R@3 ¯) | (R@3 ¯ • Rd@3)',
    H: '',
    z: 'SR1 = !(R&0xFF)|0',
    Z: 'SR1 = !(R&0xFF)|0',
    v: 'SR3 = (Rd@7 • Rr@7 • R@7 ¯) | (Rd@7 ¯ • Rr@7 ¯ • R@7)',
    V: 'SR3 = WRd@15 ¯ • R@15',
    n: 'SR2 = R@7',
    N: 'SR2 = R@15',
    s: 'SR4 = SR@2 ⊕ SR@3',
    S: 'SR4 = SR@2 ⊕ SR@3',
    c: 'SR0 = (Rd@7 • Rr@7) | (Rr@7 • R@7 ¯) | (R@7 ¯ • Rd@7)',
    C: 'SR0 = (R@15 ¯ • WRd@15)',

    /*
    Bit 7 – I: Global Interrupt Enable
    The global interrupt enable bit must be set for the interrupts to be enabled. The individual interrupt enable control is then
    performed in separate control registers. If the global interrupt enable register is cleared, none of the interrupts are enabled
    independent of the individual interrupt enable settings. The I-bit is cleared by hardware after an interrupt has occurred, and is
    set by the RETI instruction to enable subsequent interrupts. The I-bit can also be set and cleared by the application with the
    SEI and CLI instructions, as described in the instruction set reference    
    */
    SEI: function SEI() {
        this.sreg |= 1 << 7;
    },
    CLI: function CLI() {
        this.sreg &= ~(1 << 7);
    },


    /*
    Bit 6 – T: Bit Copy Storage
    The bit copy instructions BLD (bit LoaD) and BST (Bit STore) use the T-bit as source or destination for the operated bit. A bit
    from a register in the register file can be copied into T by the BST instruction, and a bit in T can be copied into a bit in a
    register in the register file by the BLD instruction.
    */
    BLD: function BLD(REG, BIT) {
        if (this.reg & 1 << 6) this.reg[REG] |= 1 << BIT;else this.reg[REG] &= ~(1 << BIT);
    },
    BST: function BST(REG, BIT) {
        var v = this.reg[REG] >> BIT & 1;
        if (v) this.sreg |= 1 << 6;else this.sreg &= ~(1 << 6);
    }
};

module.exports = Atcore;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./At328P-periferals.js":5,"./At32u4-periferals.js":7}],9:[function(require,module,exports){
'use strict';

var Hex = {
    parseURL: function parseURL(url, buffer, cb) {

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                try {
                    Hex.parse(xhr.responseText, buffer);
                } catch (ex) {
                    cb(false);
                    return;
                }
                cb(true);
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    },
    parse: function parse(src, buffer) {

        var state = 0,
            size = 0,
            num = void 0,
            byte = void 0,
            offset = void 0,
            sum = 0;

        for (var i = 0, l = src.length; i < l;) {

            byte = src.charCodeAt(i++);

            if (byte === 58) {
                state = 0;
                continue;
            }

            if (byte >= 65 && byte <= 70) {
                num = byte - 55 << 4;
            } else if (byte >= 48 && byte <= 57) {
                num = byte - 48 << 4;
            } else continue;

            while (i < l) {
                byte = src.charCodeAt(i++);
                if (byte >= 65 && byte <= 70) {
                    num += byte - 55;
                    break;
                } else if (byte >= 48 && byte <= 57) {
                    num += byte - 48;
                    break;
                } else continue;
            }

            switch (state) {
                case 0:
                    size = num;
                    state++;
                    sum = num;
                    break;

                case 1:
                    offset = num << 8;
                    state++;
                    sum += num;
                    break;

                case 2:
                    offset += num;
                    state++;
                    sum += num;
                    break;

                case 3:
                    if (num === 1) return;
                    if (num === 3 || num === 5) {
                        state++;
                    } else if (num !== 0) throw 'Unsupported record type: ' + num;
                    state++;
                    sum += num;
                    break;

                case 4:
                    buffer[offset++] = num;
                case 5:
                    sum += num;
                    if (! --size) state = 6;
                    break;

                case 6:
                    sum += num;
                    sum = -sum & 0xFF;
                    if (!sum) state++;else throw 'Checksum mismatch: ' + sum;
                    break;

                case 7:
                default:
                    throw 'Illegal state ' + state;
            }
        }
    }
};

module.exports = Hex;

},{}],10:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BTN = function () {
			function BTN(DOM) {
						var _this = this;

						_classCallCheck(this, BTN);

						this.on = {
									connect: null,
									init: function init() {
												this.on.value = !this.active;
									}
						};


						DOM.element.controller = this;
						DOM.element.dispatchEvent(new Event("addperiferal", { bubbles: true }));
						this.on.connect = DOM.element.getAttribute("pin-on");
						this.active = DOM.element.getAttribute("active") != "low";

						DOM.element.addEventListener("mousedown", function (_) {
									return _this.on.value = _this.active;
						});
						DOM.element.addEventListener("mouseup", function (_) {
									return _this.on.value = !_this.active;
						});
						DOM.element.addEventListener("touchstart", function (_) {
									return _this.on.value = _this.active;
						});
						DOM.element.addEventListener("touchend", function (_) {
									return _this.on.value = !_this.active;
						});

						(DOM.element.getAttribute("bind-key") || "").split(/\s*,\s*/).forEach(function (k) {
									_this["onPress" + k] = function (_) {
												return _this.on.value = _this.active;
									};
									_this["onRelease" + k] = function (_) {
												return _this.on.value = !_this.active;
									};
						});

						this.pool.add(this);
			}

			_createClass(BTN, [{
						key: "setActiveView",
						value: function setActiveView() {
									this.pool.remove(this);
						}
			}]);

			return BTN;
}();

BTN["@inject"] = {
			pool: "pool"
};


module.exports = BTN;

},{}],11:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LED = function LED(DOM) {
			_classCallCheck(this, LED);

			this.on = {

						connect: null,

						onLowToHigh: function onLowToHigh() {
									this.el.style.opacity = "0";
						},
						onHighToLow: function onHighToLow() {
									this.el.style.opacity = "1";
						}
			};


			this.el = DOM.element;
			DOM.element.controller = this;
			DOM.element.dispatchEvent(new Event("addperiferal", { bubbles: true }));
			this.on.connect = DOM.element.getAttribute("pin-on");
			this.el.style.opacity = 0;
};

module.exports = LED;

},{}],12:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SCREEN = function () {
			function SCREEN(DOM) {
						_classCallCheck(this, SCREEN);

						this.state = function (data) {
									// console.log( "DATA: " + data.toString(16) );
									var p = this.pos++;
									var x = p % 128;
									var y = (p / 128 | 0) * 8;
									for (var i = 0; i < 8; ++i) {
												var offset = ((y + i) * 128 + x) * 4;
												var bit = (data >>> i & 1) * 0xE0;
												this.fb.data[offset++] = bit;
												this.fb.data[offset++] = bit;
												this.fb.data[offset++] = bit;
												this.fb.data[offset++] = bit;
									}

									if (this.pos >= 128 * 64 / 8) this.pos = 0;

									this.dirty = true;
						};

						this.sck = {
									connect: null
						};
						this.sda = {
									connect: null,
									MOSI: function MOSI(data) {

												if (this.mode == 0) {
															// data is a command
															var cmd = "cmd" + data.toString(16).toUpperCase();
															if (this.cmd.length) {
																		this.cmd.push(data);
																		cmd = this.cmd[0];
															} else this.cmd.push(cmd);

															var fnc = this[cmd];

															if (!fnc) return console.warn("Unknown SSD1306 command: " + cmd.toString(16));

															if (fnc.length == this.cmd.length - 1) {
																		this.cmd.shift();
																		this[cmd].apply(this, this.cmd);
																		this.cmd.length = 0;
															}
												} else {
															this.state(data);
												}
									}
						};
						this.res = {
									connect: null,
									onLowToHigh: function onLowToHigh() {
												this.reset();
									}
						};
						this.dc = {
									connect: null,
									onLowToHigh: function onLowToHigh() {
												this.mode = 1; // data
									},
									onHighToLow: function onHighToLow() {
												this.mode = 0; // command
									}

									// Set Lower Column Start Address for
									// Page Addressing Mode 
						};


						var canvas = this.canvas = DOM.screen;
						if (!canvas) throw "No canvas in Arduboy element";

						this.pool.add(this);

						canvas.width = 128;
						canvas.height = 64;

						this.ctx = canvas.getContext("2d");
						this.ctx.imageSmoothingEnabled = false;
						this.ctx.msImageSmoothingEnabled = false;

						this.fb = this.createBuffer();
						this.fbON = this.createBuffer();
						this.fbOFF = this.createBuffer();
						this.activeBuffer = this.fbON;
						this.dirty = true;

						this.fbON.data.fill(0xFF);

						DOM.element.controller = this;
						DOM.element.dispatchEvent(new Event("addperiferal", { bubbles: true }));

						this.sck.connect = DOM.element.getAttribute("pin-sck");
						this.sda.connect = DOM.element.getAttribute("pin-sda");
						this.res.connect = DOM.element.getAttribute("pin-res");
						this.dc.connect = DOM.element.getAttribute("pin-dc");

						this.reset();
			}

			_createClass(SCREEN, [{
						key: "setActiveView",
						value: function setActiveView() {
									this.pool.remove(this);
						}
			}, {
						key: "onPressKeyF",
						value: function onPressKeyF() {
									var docEl = this.canvas; // doc.documentElement;

									toggleFullScreen();

									return;

									function isFullScreen() {
												var doc = window.document;
												return doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement || false;
									}

									function toggleFullScreen(toggle) {
												var doc = window.document;

												var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
												var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
												var state = isFullScreen();

												if (toggle == undefined) toggle = !state;else if (toggle == state) return;

												if (toggle) requestFullScreen.call(docEl);else cancelFullScreen.call(doc);
									}
						}
			}, {
						key: "tick",
						value: function tick() {
									if (this.dirty) {
												this.ctx.putImageData(this.activeBuffer, 0, 0);
												this.dirty = false;
									}
						}
			}, {
						key: "createBuffer",
						value: function createBuffer() {
									var canvas = this.canvas;
									try {
												return new ImageData(new Uint8ClampedArray(canvas.width * canvas.height * 4), canvas.width, canvas.height);
									} catch (e) {
												return this.ctx.createImageData(canvas.width, canvas.height);
									}
						}
			}, {
						key: "reset",
						value: function reset() {
									this.mode = 0;
									this.clockDivisor = 0x80;
									this.cmd = [];
									this.pos = 0;
									this.fb.data.fill(0);
						}
			}, {
						key: "cmd0",
						value: function cmd0() {}
			}, {
						key: "cmd1",
						value: function cmd1() {}
			}, {
						key: "cmd2",
						value: function cmd2() {} // etc

			}, {
						key: "cmdF",
						value: function cmdF() {}

						// Display Off

			}, {
						key: "cmdAE",
						value: function cmdAE() {
									this.activeBuffer = this.fbOFF;
						}

						// Set Display Clock Divisor v = 0xF0

			}, {
						key: "cmdD5",
						value: function cmdD5(v) {
									this.clockDivisor = v;
						}

						// Charge Pump Setting v = enable (0x14)

			}, {
						key: "cmd8D",
						value: function cmd8D(v) {
									this.chargePumpEnabled = v;
						}

						// Set Segment Re-map (A0) | (b0001)

			}, {
						key: "cmdA0",
						value: function cmdA0() {
									this.segmentRemap = 0;
						}
			}, {
						key: "cmdA1",
						value: function cmdA1() {
									this.segmentRemap = 1;
						}
			}, {
						key: "cmdA5",
						value: function cmdA5() {}
			}, {
						key: "cmdC8",
						// multiplex something or other

						// Set COM Output Scan Direction
						value: function cmdC8() {}

						// Set COM Pins v

			}, {
						key: "cmdDA",
						value: function cmdDA(v) {}

						// Set Contrast v = 0xCF

			}, {
						key: "cmd81",
						value: function cmd81(v) {}

						// Set Precharge = 0xF1

			}, {
						key: "cmdD9",
						value: function cmdD9(v) {}

						// Set VCom Detect

			}, {
						key: "cmdDB",
						value: function cmdDB(v) {}

						// Entire Display ON

			}, {
						key: "cmdA4",
						value: function cmdA4(v) {
									this.activeBuffer = v ? this.fbON : this.fb;
						}

						// Set normal/inverse display

			}, {
						key: "cmdA6",
						value: function cmdA6(v) {}

						// Display On

			}, {
						key: "cmdAF",
						value: function cmdAF(v) {
									this.activeBuffer = this.fb;
						}

						// set display mode = horizontal addressing mode (0x00)

			}, {
						key: "cmd20",
						value: function cmd20(v) {}

						// set col address range

			}, {
						key: "cmd21",
						value: function cmd21(v, e) {}

						// set page address range

			}, {
						key: "cmd22",
						value: function cmd22(v, e) {}
			}]);

			return SCREEN;
}();

SCREEN["@inject"] = {
			pool: "pool"
};


module.exports = SCREEN;

},{}],13:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require('../lib/mvc.js');

var _dryDi = require('dry-di');

var _Atcore = require('../atcore/Atcore.js');

var _Atcore2 = _interopRequireDefault(_Atcore);

var _Hex = require('../atcore/Hex.js');

var _Hex2 = _interopRequireDefault(_Hex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Arduboy = function () {
										function Arduboy(DOM) {
																				var _this = this;

																				_classCallCheck(this, Arduboy);

																				this.tick = [];


																				this.pool.add(this);

																				this.DOM = DOM;
																				this.parent = DOM.element.parentElement;
																				this.width = 0;
																				this.height = 0;
																				this.dead = false;

																				DOM.element.addEventListener("addperiferal", function (evt) {
																														return _this.addPeriferal(evt.target.controller);
																				});

																				this.periferals = [];

																				this.update = this._update.bind(this);
																				this.resize();

																				var url = this.root.getItem("app.AT328P.url", null);
																				if (url) {

																														this.core = _Atcore2.default.ATmega328P();

																														_Hex2.default.parseURL(url, this.core.flash, function (success) {
																																								if (success) _this.initCore();
																														});
																														return;
																				}

																				var hex = this.root.getItem("app.AT328P.hex", null);
																				if (hex) {

																														this.core = _Atcore2.default.ATmega328P();
																														_Hex2.default.parse(hex, this.core.flash);
																														this.initCore();
																														return;
																				}

																				url = this.root.getItem("app.AT32u4.url", null);
																				if (url) {

																														this.core = _Atcore2.default.ATmega32u4();
																														_Hex2.default.parseURL(url, this.core.flash, function (success) {
																																								if (success) _this.initCore();
																														});
																														return;
																				}

																				hex = this.root.getItem("app.AT32u4.hex", null);
																				if (hex) {

																														this.core = _Atcore2.default.ATmega32u4();
																														_Hex2.default.parse(hex, this.core.flash);
																														this.initCore();
																														return;
																				}

																				console.error("Nothing to load");
										}

										_createClass(Arduboy, [{
																				key: 'onPressEscape',
																				value: function onPressEscape() {
																														this.powerOff();
																				}
										}, {
																				key: 'setActiveView',
																				value: function setActiveView() {
																														this.pool.remove(this);
																				}
										}, {
																				key: 'powerOff',
																				value: function powerOff() {
																														this.pool.remove(this);
																														this.dead = true;
																														this.DOM.element.dispatchEvent(new Event("poweroff", { bubbles: true }));
																				}
										}, {
																				key: 'initCore',
																				value: function initCore() {
																														var _this2 = this;

																														var core = this.core,
																														    oldValues = {},
																														    DDRB = void 0,
																														    serial0Buffer = "",
																														    callbacks = {
																																								DDRB: {},
																																								DDRC: {},
																																								DDRD: {},
																																								PORTB: {},
																																								PORTC: {},
																																								PORTD: {},
																																								PORTE: {},
																																								PORTF: {}
																														};

																														Object.keys(callbacks).forEach(function (k) {
																																								return Object.assign(callbacks[k], {
																																																		onHighToLow: [],
																																																		onLowToHigh: []
																																								});
																														});

																														Object.defineProperties(core.pins, {

																																								onHighToLow: { value: function value(port, bit, cb) {
																																																												(callbacks[port].onHighToLow[bit] = callbacks[port][bit] || []).push(cb);
																																																		} },

																																								onLowToHigh: { value: function value(port, bit, cb) {
																																																												(callbacks[port].onLowToHigh[bit] = callbacks[port][bit] || []).push(cb);
																																																		} },

																																								0: { value: { out: { port: "PORTD", bit: 2 }, in: { port: "PIND", bit: 2 } } },
																																								1: { value: { out: { port: "PORTD", bit: 3 }, in: { port: "PIND", bit: 3 } } },
																																								2: { value: { out: { port: "PORTD", bit: 1 }, in: { port: "PIND", bit: 1 } } },
																																								3: { value: { out: { port: "PORTD", bit: 0 }, in: { port: "PIND", bit: 0 } } },
																																								4: { value: { out: { port: "PORTD", bit: 4 }, in: { port: "PIND", bit: 4 } } },
																																								5: { value: { out: { port: "PORTC", bit: 6 }, in: { port: "PINC", bit: 6 } } },
																																								6: { value: { out: { port: "PORTD", bit: 7 }, in: { port: "PIND", bit: 7 } } },
																																								7: { value: { out: { port: "PORTE", bit: 6 }, in: { port: "PINE", bit: 6 } } },
																																								8: { value: { out: { port: "PORTB", bit: 4 }, in: { port: "PINB", bit: 4 } } },
																																								9: { value: { out: { port: "PORTB", bit: 5 }, in: { port: "PINB", bit: 5 } } },
																																								10: { value: { out: { port: "PORTB", bit: 6 }, in: { port: "PINB", bit: 6 } } },
																																								11: { value: { out: { port: "PORTB", bit: 7 }, in: { port: "PINB", bit: 7 } } },

																																								16: { value: { out: { port: "PORTB", bit: 2 }, in: { port: "PINB", bit: 2 } } },
																																								14: { value: { out: { port: "PORTB", bit: 3 }, in: { port: "PINB", bit: 3 } } },
																																								15: { value: { out: { port: "PORTB", bit: 1 }, in: { port: "PINB", bit: 1 } } },
																																								17: { value: { out: { port: "PORTB", bit: 0 }, in: { port: "PINB", bit: 0 } } },

																																								18: { value: { out: { port: "PORTF", bit: 7 }, in: { port: "PINF", bit: 7 } } },
																																								A0: { value: { out: { port: "PORTF", bit: 7 }, in: { port: "PINF", bit: 7 } } },
																																								19: { value: { out: { port: "PORTF", bit: 6 }, in: { port: "PINF", bit: 6 } } },
																																								A1: { value: { out: { port: "PORTF", bit: 6 }, in: { port: "PINF", bit: 6 } } },
																																								20: { value: { out: { port: "PORTF", bit: 5 }, in: { port: "PINF", bit: 5 } } },
																																								A2: { value: { out: { port: "PORTF", bit: 5 }, in: { port: "PINF", bit: 5 } } },
																																								21: { value: { out: { port: "PORTF", bit: 4 }, in: { port: "PINF", bit: 4 } } },
																																								A3: { value: { out: { port: "PORTF", bit: 4 }, in: { port: "PINF", bit: 4 } } },

																																								MOSI: { value: {} },
																																								MISO: { value: {} },

																																								spiIn: {
																																																		value: []
																																								},

																																								spiOut: {
																																																		value: {
																																																												listeners: [],
																																																												push: function push(data) {
																																																																						var i = 0,
																																																																						    listeners = this.listeners,
																																																																						    l = listeners.length;
																																																																						for (; i < l; ++i) {
																																																																																listeners[i](data);
																																																																						}
																																																												}
																																																		}
																																								},

																																								serial0: {
																																																		set: function set(str) {
																																																												str = (str || "").replace(/\r\n?/, '\n');
																																																												serial0Buffer += str;

																																																												var br = serial0Buffer.indexOf("\n");
																																																												if (br != -1) {

																																																																						var parts = serial0Buffer.split("\n");
																																																																						while (parts.length > 1) {
																																																																																console.log('SERIAL: ', parts.shift());
																																																																						}serial0Buffer = parts[0];
																																																												}
																																																		}
																																								},

																																								DDRB: {
																																																		set: setDDR.bind(null, "DDRB"),
																																																		get: function get() {
																																																												return oldValues.DDRB | 0;
																																																		}
																																								},
																																								DDRC: {
																																																		set: setDDR.bind(null, "DDRC")
																																								},
																																								DDRD: {
																																																		set: setDDR.bind(null, "DDRD")
																																								},
																																								DDRE: {
																																																		set: setDDR.bind(null, "DDRD")
																																								},
																																								DDRF: {
																																																		set: setDDR.bind(null, "DDRD")
																																								},
																																								PORTB: {
																																																		set: setPort.bind(null, "PORTB")
																																								},
																																								PORTC: {
																																																		set: setPort.bind(null, "PORTC")
																																								},
																																								PORTD: {
																																																		set: setPort.bind(null, "PORTD")
																																								},
																																								PORTE: {
																																																		set: setPort.bind(null, "PORTE")
																																								},
																																								PORTF: {
																																																		set: setPort.bind(null, "PORTF")
																																								}

																														});

																														setTimeout(function (_) {
																																								_this2.setupPeriferals();
																																								_this2._update();
																														}, 5);

																														function setDDR(name, cur) {
																																								var old = oldValues[name];
																																								if (old === cur) return;
																																								oldValues[name] = cur;
																														}

																														function setPort(name, cur) {
																																								var old = oldValues[name];

																																								if (old === cur) return;
																																								var s,
																																								    j,
																																								    l,
																																								    lth = callbacks[name].onLowToHigh,
																																								    htl = callbacks[name].onHighToLow,
																																								    tick = core.tick;

																																								for (var i = 0; i < 8; ++i) {

																																																		var ob = old >>> i & 1,
																																																		    nb = cur >>> i & 1;
																																																		if (lth[i] && !ob && nb) {
																																																												for (j = 0, s = lth[i], l = s.length; j < l; ++j) {
																																																																						s[j](tick);
																																																												}
																																																		}
																																																		if (htl[i] && ob && !nb) {
																																																												for (j = 0, s = htl[i], l = s.length; j < l; ++j) {
																																																																						s[j](tick);
																																																												}
																																																		}
																																								}

																																								oldValues[name] = cur;
																														}
																				}
										}, {
																				key: 'addPeriferal',
																				value: function addPeriferal(ctrl) {

																														this.periferals.push(ctrl);
																				}
										}, {
																				key: 'setupPeriferals',
																				value: function setupPeriferals() {
																														var _this3 = this;

																														var pins = this.core.pins;
																														var map = { cpu: this.core.pins };

																														this.periferals.forEach(function (ctrl) {

																																								if (ctrl.tick) _this3.tick.push(ctrl);

																																								for (var k in ctrl) {

																																																		var v = ctrl[k];
																																																		if (!v || !v.connect) continue;

																																																		var target = v.connect;
																																																		if (typeof target == "number") target = "cpu." + target;

																																																		var tobj = map;
																																																		var tparts = target.split(".");
																																																		while (tparts.length && tobj) {
																																																												tobj = tobj[tparts.shift()];
																																																		}if (v.MOSI) pins.spiOut.listeners.push(v.MOSI.bind(ctrl));

																																																		if (!tobj) {
																																																												console.warn("Could not attach wire from ", k, " to ", target);
																																																												continue;
																																																		}

																																																		if (v.onLowToHigh) pins.onLowToHigh(tobj.out.port, tobj.out.bit, v.onLowToHigh.bind(ctrl));

																																																		if (v.onHighToLow) pins.onHighToLow(tobj.out.port, tobj.out.bit, v.onHighToLow.bind(ctrl));

																																																		var setter = function (tobj, nv) {

																																																												if (nv) pins[tobj.in.port] |= 1 << tobj.in.bit;else pins[tobj.in.port] &= ~(1 << tobj.in.bit);
																																																		}.bind(_this3, tobj);

																																																		var getter = function (tobj) {
																																																												return pins[tobj.out.port] >>> tobj.out.bit & 1;
																																																		}.bind(_this3, tobj);

																																																		Object.defineProperty(v, "value", {
																																																												set: setter,
																																																												get: getter
																																																		});

																																																		if (v.init) v.init.call(ctrl);
																																								}
																														});
																				}
										}, {
																				key: '_update',
																				value: function _update() {
																														if (this.dead) return;

																														requestAnimationFrame(this.update);
																														this.core.update();
																														this.resize();
																														for (var i = 0, l = this.tick.length; i < l; ++i) {
																																								this.tick[i].tick();
																														}
																				}
										}, {
																				key: 'resize',
																				value: function resize() {

																														var maxHeight = this.parent.clientHeight;
																														var maxWidth = this.parent.clientWidth;

																														if (this.width == maxWidth && this.height == maxHeight) return;

																														this.width = maxWidth;
																														this.height = maxHeight;

																														var ratio = 393 / 624;

																														if (this.height * ratio > this.width) {
																																								this.DOM.element.style.width = this.width + "px";
																																								this.DOM.element.style.height = this.width / ratio + "px";
																														} else {
																																								this.DOM.element.style.width = this.height * ratio + "px";
																																								this.DOM.element.style.height = this.height + "px";
																														}
																				}
										}]);

										return Arduboy;
}();

Arduboy["@inject"] = {
										root: [_mvc.Model, { scope: "root" }],
										pool: "pool"
};


module.exports = Arduboy;

},{"../atcore/Atcore.js":8,"../atcore/Hex.js":9,"../lib/mvc.js":22,"dry-di":1}],14:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Config = function Config(DOM) {
    _classCallCheck(this, Config);

    DOM.element.innerHTML = "C O N F I G";
};

module.exports = Config;

},{}],15:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Files = function Files(DOM) {
    _classCallCheck(this, Files);

    DOM.element.innerHTML = "C O N F I G";
};

module.exports = Files;

},{}],16:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require("../lib/mvc.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Market = function () {
    function Market(DOM) {
        _classCallCheck(this, Market);
    }

    _createClass(Market, [{
        key: "run",
        value: function run() {
            this.pool.call("runSim");
        }
    }]);

    return Market;
}();

Market["@inject"] = {
    root: [_mvc.Model, { scope: "root" }]
};


module.exports = Market;

},{"../lib/mvc.js":22}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _IStore = require('../store/IStore.js');

var _IStore2 = _interopRequireDefault(_IStore);

var _mvc = require('../lib/mvc.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Env = function (_IController) {
    _inherits(Env, _IController);

    function Env() {
        _classCallCheck(this, Env);

        return _possibleConstructorReturn(this, (Env.__proto__ || Object.getPrototypeOf(Env)).apply(this, arguments));
    }

    _createClass(Env, [{
        key: 'exitSplash',
        value: function exitSplash() {
            /* */
            this._show();
            /*/
            this.model.setItem("app.AT32u4.url", "HelloWorld32u4.hex");
            this.pool.call("runSim");
            /* */
        }
    }, {
        key: 'exitSim',
        value: function exitSim() {
            this._show();
        }
    }, {
        key: 'play',
        value: function play(opt) {
            this.model.setItem("app.AT32u4.url", this.model.getItem("app.proxy") + opt.element.dataset.url);
            this.pool.call("runSim");
        }
    }]);

    return Env;
}(_mvc.IController);

Env["@inject"] = {
    store: _IStore2.default,
    pool: "pool",
    viewFactory: [_mvc.IView, { controller: Env }],
    model: [_mvc.Model, { scope: "root" }]
};
exports.default = Env;

},{"../lib/mvc.js":22,"../store/IStore.js":26}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require("../lib/mvc.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Sim = function (_IController) {
    _inherits(Sim, _IController);

    function Sim() {
        _classCallCheck(this, Sim);

        return _possibleConstructorReturn(this, (Sim.__proto__ || Object.getPrototypeOf(Sim)).apply(this, arguments));
    }

    _createClass(Sim, [{
        key: "runSim",
        value: function runSim() {
            this._show();
        }
    }, {
        key: "onEndSim",
        value: function onEndSim() {
            this.pool.call("exitSim");
        }
    }]);

    return Sim;
}(_mvc.IController);

Sim["@inject"] = {
    pool: "pool",
    viewFactory: [_mvc.IView, { controller: Sim }],
    model: [_mvc.Model, { scope: "root" }]
};
exports.default = Sim;

},{"../lib/mvc.js":22}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mvc = require("../lib/mvc.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // import IStore from '../store/IStore.js';


var Splash = function (_IController) {
    _inherits(Splash, _IController);

    function Splash() {
        var _ref;

        var _temp, _this, _ret;

        _classCallCheck(this, Splash);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Splash.__proto__ || Object.getPrototypeOf(Splash)).call.apply(_ref, [this].concat(args))), _this), _this.BODY = {
            bound: function bound(evt) {
                var target = evt.target;
            }
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(Splash, [{
        key: "enterSplash",
        value: function enterSplash() {
            this._show();
        }
    }]);

    return Splash;
}(_mvc.IController);

Splash["@inject"] = {
    pool: "pool",
    viewFactory: [_mvc.IView, { controller: Splash }]
};
exports.default = Splash;

},{"../lib/mvc.js":22}],20:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

module.exports = DOM;

function DOM(element) {

    if (!element && document && document.body) element = document.body;

    this.element = element;
}

var spare = null;
function getThis(that) {

    if (!that || typeof that == "function") return spare = spare || new DOM();

    return that;
}

function prototype(obj) {

    var desc = {};
    for (var k in obj) {
        desc[k] = {
            enumerable: false,
            value: obj[k]
        };
    }

    var ret = {};
    Object.defineProperties(ret, desc);

    return ret;
}

var impl = {

    create: function create(strTagName, objProperties, arrChildren, elParent) {
        var args = Array.from(arguments);
        strTagName = objProperties = arrChildren = elParent = undefined;

        for (var i = 0, l = args.length; i < l; ++i) {
            var arg = args[i];
            if (typeof arg == "string") strTagName = arg;else if ((typeof arg === "undefined" ? "undefined" : _typeof(arg)) == "object") {
                if (Array.isArray(arg)) arrChildren = arg;else if (arg instanceof Element) elParent = arg;else objProperties = arg;
            }
        }

        if (!elParent && this.element) elParent = this.element;

        if (!strTagName) {
            if (!elParent) strTagName = "span";else strTagName = {
                table: "tr",
                tr: "td",
                select: "option",
                ul: "li",
                ol: "li",
                dl: "dt",
                optgroup: "option",
                datalist: "option"
            }[elParent.tagName] || elParent.tagName;
        }

        var element = document.createElement(strTagName);
        if (elParent) elParent.appendChild(element);

        var listener;

        for (var key in objProperties) {
            var value = objProperties[key];
            if (key == "text") element.appendChild(document.createTextNode(value));else if (key == "listener") listener = value;else if (key == "attr") {
                for (var attr in value) {
                    element.setAttribute(attr, value[attr]);
                }
            } else if (element[key] && _typeof(element[key]) == "object" && (typeof value === "undefined" ? "undefined" : _typeof(value)) == "object") Object.assign(element[key], value);else element[key] = value;
        }

        if (this.element && element.id) this[element.id] = element;

        for (i = 0, l = arrChildren && arrChildren.length; i < l; ++i) {
            this.create.apply(this, arrChildren[i].concat(element));
        }

        if (listener) new DOM(element).listen(listener);

        return element;
    },

    listen: function listen(listeners, that, prefix) {
        prefix = prefix || "";
        if (that === undefined) that = listeners;

        var THIS = getThis(this);

        var keys = Object.keys(listeners);

        THIS.forEach(function (element) {

            if (listeners[prefix + element.tagName]) bind(listeners[prefix + element.tagName], element);

            if (listeners[prefix + element.id]) bind(listeners[prefix + element.id], element);

            if (listeners[prefix + element.className]) bind(listeners[prefix + element.className], element);

            if (listeners[prefix + element.name]) bind(listeners[prefix + element.name], element);
        });

        return THIS;

        function bind(obj, element) {

            for (var event in obj) {
                var func = obj[event];
                if (!func.call) continue;
                element.addEventListener(event, that ? func.bind(that) : func);
            }
        }
    },

    index: function index(keys, multiple, property) {
        var THIS = getThis(this);

        var index = Object.create(DOM.prototype);

        if (typeof keys == "string") keys = [keys];

        for (var i = 0, l = keys.length; i < l; ++i) {

            var key = keys[i];
            if (typeof key != "string") continue;

            if (!property && !multiple) {

                THIS.forEach(function (child) {
                    return child[key] !== undefined && (index[child[key]] = child);
                });
            } else if (property && !multiple) {

                THIS.forEach(function (child) {
                    if (child[property] && _typeof(child[property]) == "object" && child[property][key] !== undefined) index[child[property][key]] = child;
                });
            } else if (!property && typeof multiple == "function") {

                THIS.forEach(function (child) {
                    if (child[key] !== undefined) multiple(child[key], child);
                });
            } else if (property && typeof multiple == "function") {

                THIS.forEach(function (child) {

                    if (!child[property] || _typeof(child[property]) != "object") return;

                    var v = child[property][key];
                    if (v !== undefined) multiple(v, child);
                });
            } else if (!property && multiple) {

                THIS.forEach(function (child) {
                    if (child[key] !== undefined) {
                        if (!index[child[key]]) index[child[key]] = [child];else index[child[key]].push(child);
                    }
                });
            } else if (property && multiple) {

                THIS.forEach(function (child) {

                    if (!child[property] || _typeof(child[property]) != "object") return;

                    var v = child[property][key];
                    if (v !== undefined) {
                        if (!index[v]) index[v] = [child];else index[v].push(child);
                    }
                });
            }
        }

        return index;
    },

    forEach: function forEach(cb, element) {
        var THIS = getThis(this);

        element = element || THIS.element;

        if (!element) return;

        if (cb(element) === false) return;

        if (!element.children) return;

        for (var i = 0, l = element.children.length; i < l; ++i) {
            THIS.forEach(cb, element.children[i]);
        }
    }

};

Object.assign(DOM, impl);
DOM.prototype = prototype(impl);

},{}],21:[function(require,module,exports){
"use strict";

/*
  I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
  so it's better encapsulated. Now you can have multiple random number generators
  and they won't stomp all over eachother's state.
  
  If you want to use this as a substitute for Math.random(), use the random()
  method like so:
  
  var m = new MersenneTwister();
  var randomNumber = m.random();
  
  You can also call the other genrand_{foo}() methods on the instance.
  If you want to use a specific seed in order to get a repeatable random
  sequence, pass an integer into the constructor:
  var m = new MersenneTwister(123);
  and that will always produce the same random sequence.
  Sean McCullough (banksean@gmail.com)
*/

/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:
 
     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
 
     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
 
     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.
 
   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 
   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

var MersenneTwister = function MersenneTwister(seed) {
  if (seed == undefined) {
    seed = new Date().getTime();
  }
  /* Period parameters */
  this.N = 624;
  this.M = 397;
  this.MATRIX_A = 0x9908b0df; /* constant vector a */
  this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
  this.LOWER_MASK = 0x7fffffff; /* least significant r bits */

  this.mt = new Array(this.N); /* the array for the state vector */
  this.mti = this.N + 1; /* mti==N+1 means mt[N] is not initialized */

  this.init_genrand(seed);
};

/* initializes mt[N] with a seed */
MersenneTwister.prototype.init_genrand = function (s) {
  this.mt[0] = s >>> 0;
  for (this.mti = 1; this.mti < this.N; this.mti++) {
    var s = this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30;
    this.mt[this.mti] = (((s & 0xffff0000) >>> 16) * 1812433253 << 16) + (s & 0x0000ffff) * 1812433253 + this.mti;
    /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
    /* In the previous versions, MSBs of the seed affect   */
    /* only MSBs of the array mt[].                        */
    /* 2002/01/09 modified by Makoto Matsumoto             */
    this.mt[this.mti] >>>= 0;
    /* for >32 bit machines */
  }
};

/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
/* slight change for C++, 2004/2/26 */
MersenneTwister.prototype.init_by_array = function (init_key, key_length) {
  var i, j, k;
  this.init_genrand(19650218);
  i = 1;j = 0;
  k = this.N > key_length ? this.N : key_length;
  for (; k; k--) {
    var s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;
    this.mt[i] = (this.mt[i] ^ (((s & 0xffff0000) >>> 16) * 1664525 << 16) + (s & 0x0000ffff) * 1664525) + init_key[j] + j; /* non linear */
    this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
    i++;j++;
    if (i >= this.N) {
      this.mt[0] = this.mt[this.N - 1];i = 1;
    }
    if (j >= key_length) j = 0;
  }
  for (k = this.N - 1; k; k--) {
    var s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;
    this.mt[i] = (this.mt[i] ^ (((s & 0xffff0000) >>> 16) * 1566083941 << 16) + (s & 0x0000ffff) * 1566083941) - i; /* non linear */
    this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
    i++;
    if (i >= this.N) {
      this.mt[0] = this.mt[this.N - 1];i = 1;
    }
  }

  this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
};

/* generates a random number on [0,0xffffffff]-interval */
MersenneTwister.prototype.genrand_int32 = function () {
  var y;
  var mag01 = new Array(0x0, this.MATRIX_A);
  /* mag01[x] = x * MATRIX_A  for x=0,1 */

  if (this.mti >= this.N) {
    /* generate N words at one time */
    var kk;

    if (this.mti == this.N + 1) /* if init_genrand() has not been called, */
      this.init_genrand(5489); /* a default initial seed is used */

    for (kk = 0; kk < this.N - this.M; kk++) {
      y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
      this.mt[kk] = this.mt[kk + this.M] ^ y >>> 1 ^ mag01[y & 0x1];
    }
    for (; kk < this.N - 1; kk++) {
      y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
      this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ y >>> 1 ^ mag01[y & 0x1];
    }
    y = this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK;
    this.mt[this.N - 1] = this.mt[this.M - 1] ^ y >>> 1 ^ mag01[y & 0x1];

    this.mti = 0;
  }

  y = this.mt[this.mti++];

  /* Tempering */
  y ^= y >>> 11;
  y ^= y << 7 & 0x9d2c5680;
  y ^= y << 15 & 0xefc60000;
  y ^= y >>> 18;

  return y >>> 0;
};

/* generates a random number on [0,0x7fffffff]-interval */
MersenneTwister.prototype.genrand_int31 = function () {
  return this.genrand_int32() >>> 1;
};

/* generates a random number on [0,1]-real-interval */
MersenneTwister.prototype.genrand_real1 = function () {
  return this.genrand_int32() * (1.0 / 4294967295.0);
  /* divided by 2^32-1 */
};

/* generates a random number on [0,1)-real-interval */
MersenneTwister.prototype.random = function () {
  return this.genrand_int32() * (1.0 / 4294967296.0);
  /* divided by 2^32 */
};

/* generates a random number on (0,1)-real-interval */
MersenneTwister.prototype.genrand_real3 = function () {
  return (this.genrand_int32() + 0.5) * (1.0 / 4294967296.0);
  /* divided by 2^32 */
};

/* generates a random number on [0,1) with 53-bit resolution*/
MersenneTwister.prototype.genrand_res53 = function () {
  var a = this.genrand_int32() >>> 5,
      b = this.genrand_int32() >>> 6;
  return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
};

/* These real versions are due to Isaku Wada, 2002/01/09 added */

module.exports = MersenneTwister;

},{}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.boot = exports.IController = exports.IView = exports.Model = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dryDi = require('dry-di');

var _strldr = require('./strldr.js');

var _strldr2 = _interopRequireDefault(_strldr);

var _IStore = require('../store/IStore.js');

var _IStore2 = _interopRequireDefault(_IStore);

var _dryDom = require('./dry-dom.js');

var _dryDom2 = _interopRequireDefault(_dryDom);

var _pool = require('./pool.js');

var _pool2 = _interopRequireDefault(_pool);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function read(str, ctx) {

    var parts = str.split("."),
        i = 0;

    while (i < parts.length && ctx) {
        ctx = ctx[parts[i++]];
    }return ctx;
}

function readMethod(str, ctx) {
    var _ctx;

    var parts = str.split("."),
        i = 0;

    var pctx = ctx;

    while (i < parts.length && ctx) {
        pctx = ctx;
        ctx = ctx[parts[i++]];
    }

    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
    }

    if (ctx && typeof ctx === "function") return (_ctx = ctx).bind.apply(_ctx, [pctx].concat(args));

    return null;
}

function write(str, value, ctx) {

    var parts = str.split("."),
        i = 0;

    while (parts.length - 1 && ctx) {
        if (!(parts[i] in ctx)) ctx[parts[i]] = {};
        ctx = ctx[parts[i++]];
    }

    if (ctx) ctx[parts[i]] = value;

    return !!ctx;
}

var pending = [];
var nextModelId = 0;

var Model = function () {
    function Model() {
        var _this = this;

        _classCallCheck(this, Model);

        var listeners = {};
        var data = {};
        var children = {};
        var revChildren = {};
        var parents = {};

        Object.defineProperty(data, "__model__", { value: this, writable: false, enumerable: false });

        Object.defineProperties(this, {
            root: { value: this, enumerable: false, writable: true },
            listeners: { value: listeners, enumerable: false, writable: false },
            data: { value: data, enumerable: false, writable: true },
            children: { value: children, enumerable: false, writable: false },
            revChildren: { value: revChildren, enumerable: false, writable: false },
            parents: { value: parents, enumerable: false, writable: false },
            id: { value: ++nextModelId, enumerable: false, writable: false },
            dirty: {
                get: function get() {
                    return _this.root.__dirty;
                },
                set: function set(v) {
                    return _this.root.__dirty = v;
                }
            }
        });
    }

    _createClass(Model, [{
        key: 'store',
        value: function store() {
            var binary = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            return _strldr2.default.store(this.data, binary);
        }
    }, {
        key: 'load',
        value: function load(data) {
            var doRaise = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;


            if (typeof data === "string") {
                try {
                    data = JSON.parse(data);
                    data = _strldr2.default.load(data);
                } catch (ex) {}
            }

            if (data && data.buffer && data.buffer instanceof ArrayBuffer) {
                if (!(data instanceof Uint8Array)) data = new Uint8Array(data.buffer);
                data = _strldr2.default.load(data, true);
            }

            for (var k in data) {
                this.setItem(k, data[k], doRaise);
            }

            return this;
        }
    }, {
        key: 'setItem',
        value: function setItem(k, v) {
            var doRaise = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;


            if (k.charCodeAt) k = k.split(".");
            var prop = k.shift(),
                child;
            var data = this.data,
                children = this.children,
                revChildren = this.revChildren;

            if (k.length) {

                child = children[prop];
                if (!child) {
                    child = children[prop] = new Model();
                    child.root = this.root;
                    child.parents[this.id] = this;
                    data[prop] = child.data;
                    this.dirty = true;
                    revChildren[child.id] = [prop];
                    this.raise(prop, false);
                }

                return children[prop].setItem(k, v, doRaise);
            }

            if (children[prop]) {

                if (children[prop].data !== v) return;

                child = children[prop];

                var index = revChildren[child.id].indexOf(prop);
                if (index === -1) throw new Error("Integrity compromised");

                revChildren[child.id].splice(index, 1);

                delete child.parents[this.id];
            }

            if (v && (typeof v === 'undefined' ? 'undefined' : _typeof(v)) == "object") {

                var doLoad = false;
                if (!v.__model__) {
                    child = new Model();
                    child.root = this.root;
                    doLoad = true;
                } else {
                    child = v.__model__;
                }

                if (!revChildren[child.id]) revChildren[child.id] = [prop];else revChildren[child.id].push(prop);
                children[prop] = child;
                child.parents[this.id] = this;

                if (doLoad) {
                    child.load(v, false);
                    child.data = v;
                    Object.defineProperty(v, "__model__", { value: child, writable: false });
                }
            }

            data[prop] = v;

            this.dirty = true;
            this.raise(prop, doRaise);

            return this;
        }
    }, {
        key: 'getModel',
        value: function getModel(k, create) {

            if (k.charCodeAt) k = k.split(".");

            var ctx = this,
                i = 0;
            if (create) {
                while (ctx && i < k.length) {
                    if (!ctx.children[k[i]]) ctx.setItem(k[i], {});
                    ctx = ctx.children[k[i++]];
                }
            } else {
                while (ctx && i < k.length) {
                    ctx = ctx.children[k[i++]];
                }
            }

            return ctx;
        }
    }, {
        key: 'getItem',
        value: function getItem(k, defaultValue) {
            var v = read(k, this.data);
            if (v === undefined) v = defaultValue;
            return v;
        }
    }, {
        key: 'removeItem',
        value: function removeItem(k, cb) {

            var parent = k.split(".");
            var key = parent.pop();

            var model = this.getModel(parent);
            var data = model.data,
                children = model.children;

            if (!(key in data)) return;

            if (children[key]) {

                var child = children[key],
                    revChildren = model.revChildren[child.id];

                var index = revChildren.indexOf(key);
                if (index == -1) throw "Integrity compromised";

                revChildren.splice(index, 1);

                if (revChildren.length == 0) {
                    delete child.parents[model.id];
                    delete model.revChildren[child.id];
                }

                delete children[key];
            }

            delete data[key];

            model.raise(key, true);
        }
    }, {
        key: 'raise',
        value: function raise(k, doRaise) {

            pending[pending.length++] = { model: this, key: k };

            if (!doRaise) return;

            for (var i = 0, l = pending.length; i < l; ++i) {

                k = pending[i].key;
                var model = pending[i].model;

                if (k) {

                    dispatch(model.listeners[k], model.data[k], k);
                } else {

                    for (var pid in model.parents) {

                        var parent = model.parents[pid];
                        var revChildren = parent.revChildren[model.id];
                        if (!revChildren) throw "Integrity compromised";

                        for (var j = 0, rcl = revChildren.length; j < rcl; ++j) {

                            dispatch(parent.listeners[revChildren[j]], parent.data, revChildren[j]);
                        }
                    }
                }
            }

            pending.length = 0;

            function dispatch(listeners, value, key) {

                if (!listeners) return;

                for (var i = 0, l = listeners.length; i < l; ++i) {
                    listeners[i](value, key);
                }
            }
        }

        // attach( k:String, cb:Function )
        // listen to notifications from a particular key
        // attach( cb:Function )
        // listen to key additions/removals

    }, {
        key: 'attach',
        value: function attach(k, cb) {
            var key = k.split(".");
            var model;
            if (key.length == 1) {
                key = k;
                model = this;
            } else {
                k = key.pop();
                model = this.getModel(key, true);
                key = k;
            }

            if (!model.listeners[key]) model.listeners[key] = [cb];else model.listeners[key].push(cb);
        }

        // stop listening

    }, {
        key: 'detach',
        value: function detach(k, cb) {

            var index, listeners;

            if (typeof k == "function") {
                cb = k;
                k = "";
            }

            listeners = this.listeners[k];
            if (!listeners[k]) return;

            index = listeners.indexOf(cb);
            if (index == -1) return;

            listeners.splice(index, 1);
        }
    }]);

    return Model;
}();

var cache = {};

var IView = function () {
    function IView(controller) {
        var _this2 = this;

        _classCallCheck(this, IView);

        var layout = "layouts/" + controller.constructor.name + ".html";
        this.controller = controller;
        this.dom = null;

        if (!cache[layout]) {

            fetch(layout).then(function (rsp) {

                if (!rsp.ok && rsp.status !== 0) throw new Error("Not OK!");
                return rsp.text();
            }).then(function (text) {
                return new window.DOMParser().parseFromString(text, "text/html");
            }).then(function (html) {
                cache[layout] = html;
                _this2.loadLayout(html);
            }).catch(function (ex) {

                _this2.parentElement.innerHTML = '<div>' + (ex.message || ex) + (': ' + layout + '!</div>');
            });
        } else this.loadLayout(cache[layout]);
    }

    _createClass(IView, [{
        key: 'loadLayout',
        value: function loadLayout(doc) {
            var _this3 = this;

            doc = doc.cloneNode(true);
            [].concat(_toConsumableArray(doc.body.children)).forEach(function (child) {
                return _this3.parentElement.appendChild(child);
            });

            var dom = new _dryDom2.default(this.parentElement);
            this.dom = dom;

            prepareDOM(dom, this.controller, this.model);
        }
    }]);

    return IView;
}();

IView["@inject"] = {
    parentElement: "ParentElement",
    model: [Model, { scope: 'root' }]
};


function prepareDOM(dom, controller, _model) {

    dom.forEach(function (element) {

        if (element.dataset.src && !element.dataset.inject) {
            switch (element.tagName) {
                case 'UL':
                case 'OL':
                    var template = element.cloneNode(true);
                    _model.attach(element.dataset.src, renderList.bind(element, template));
                    renderList(element, template, _model.getItem(element.dataset.src));
                    break;

                default:
                    break;
            }
            return false;
        }

        for (var i = 0; i < element.attributes.length; ++i) {
            var key = element.attributes[i].name;
            var value = element.attributes[i].value;

            var parts = key.split("-");

            if (parts.length == 2) switch (parts[1]) {
                case "call":
                    var target = readMethod(value, controller, dom);
                    if (target) element.addEventListener(parts[0], target);else console.warn("Could not bind event to " + controller.constructor.name + "." + name);

                    break;

                case "toggle":
                    var vparts = value.match(/^([^@]+)\@([^=]+)\=(.+)$/);

                    if (vparts) bindToggle(element, parts[0], vparts);else console.warn("Could not parse toggle: " + value);
                    break;

            }

            var memo = { __src: value, __hnd: 0 };
            value.replace(/\{\{([^\}]+)\}\}/g, bindAttribute.bind(null, element.attributes[i], memo));
            updateAttribute(element.attributes[i], memo);
        }

        if (element.dataset.inject && element != dom.element) {

            var childDom = new _dryDom2.default(element);
            Object.assign(childDom, childDom.index("id"));

            var ctrl = (0, _dryDi.getInstanceOf)(element.dataset.inject, childDom);
            dom[element.dataset.inject] = ctrl;

            prepareDOM(childDom, ctrl);

            return false;
        }
    });

    function bindToggle(element, event, cmd) {
        element.addEventListener(event, function () {
            [].concat(_toConsumableArray(dom.element.querySelectorAll(cmd[1]))).forEach(function (target) {
                return target.setAttribute(cmd[2], cmd[3]);
            });
        });
    }

    function renderList(element, template, arr) {

        while (element.children.length) {
            element.removeChild(element.children[0]);
        }for (var key in arr) {

            var childModel = new Model();
            childModel.load(_model.data);
            childModel.setItem("key", key);
            childModel.setItem("value", arr[key]);
            childModel.root = _model.root;

            [].concat(_toConsumableArray(template.cloneNode(true).children)).forEach(function (child) {

                element.appendChild(child);
                prepareDOM(new _dryDom2.default(child), controller, childModel);
            });
        }
    }

    function bindAttribute(attr, memo, match, inner) {

        if (inner in memo) return "";

        _model.attach(inner, function (value) {
            memo[inner] = value;
            if (memo.__hnd) return;
            memo.__hnd = setTimeout(updateAttribute.bind(null, attr, memo), 1);
        });

        memo[inner] = _model.getItem(inner);

        return "";
    }

    function updateAttribute(attr, memo) {
        memo.__hnd = 0;
        attr.value = memo.__src.replace(/\{\{([^\}]+)\}\}/g, function (match, path) {
            return _typeof(memo[path]) == "object" ? JSON.stringify(memo[path]) : memo[path];
        });
    }
}

var defaultModel = null;

var IController = function () {
    function IController() {
        _classCallCheck(this, IController);

        this.pool.add(this);
    }

    _createClass(IController, [{
        key: '_show',
        value: function _show() {
            console.log("created view");
            this.pool.call("setActiveView", null);
            var view = this.viewFactory(this);
            return view;
        }
    }]);

    return IController;
}();

IController["@inject"] = {
    viewFactory: IView,
    pool: "pool",
    model: Model
};


function boot(_ref) {
    var main = _ref.main,
        element = _ref.element,
        components = _ref.components,
        entities = _ref.entities;


    (0, _dryDi.bind)(_pool2.default).to('pool').singleton();
    (0, _dryDi.bind)(Model).to(Model).withTags({ scope: 'root' }).singleton();

    for (var k in components) {
        (0, _dryDi.bind)(components[k]).to(k);
    }for (var k in entities) {
        var ctrl = entities[k];
        // console.log( "Adding entity " + k, ctrl );
        (0, _dryDi.bind)(ctrl).to(IController);
        (0, _dryDi.bind)(IView).to(IView).injecting([document.body, 'ParentElement']).withTags({ controller: ctrl }).factory();
    }

    (0, _dryDi.bind)(main).to(main).injecting([new _dryDom2.default(element), _dryDom2.default]);
    (0, _dryDi.getInstanceOf)(main);
}

exports.Model = Model;
exports.IView = IView;
exports.IController = IController;
exports.boot = boot;

},{"../store/IStore.js":26,"./dry-dom.js":20,"./pool.js":23,"./strldr.js":24,"dry-di":1}],23:[function(require,module,exports){
"use strict";

var nextUID = 0;

function getUID() {
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
        var names = (target.className || "").split(/\s+/).filter(function (n) {
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

    this.registerEvents = function (target, args) {
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
        args.forEach(function (arg) {
            target.addEventListener(arg, onEvent);
        });
    };

    this.debug = function (m) {
        debug = m;
    };

    this.silence = function (m) {
        silence[m] = 1;
    };

    this.addProxy = function (obj) {
        if (obj && obj.call) proxies.push(obj);
    };

    this.removeProxy = function (obj) {
        var i = proxies.indexOf(obj);
        if (i == -1) return;
        proxies.splice(i, 1);
    };

    this.add = function (obj, enableDirectMsg) {
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
            var properties = {},
                cobj = obj;
            do {
                Object.assign(properties, Object.getOwnPropertyDescriptors(cobj));
            } while (cobj = Object.getPrototypeOf(cobj));

            for (var k in properties) {
                if (typeof obj[k] != "function") continue;
                if (k && k[0] != "_") this.listen(obj, k);
            }
        }
    };

    this.remove = function (obj) {
        if (obj.constructor.name == debug) console.log("remove", obj);

        delete contents[obj.__uid];

        if (obj.methods || obj.constructor.methods) {
            for (var k in obj.methods || obj.constructor.methods) {
                this.mute(obj, k);
            }
        } else {
            var properties = {},
                cobj = obj;
            do {
                Object.assign(properties, Object.getOwnPropertyDescriptors(cobj));
            } while (cobj = Object.getPrototypeOf(cobj));

            for (var k in properties) {
                this.mute(obj, k);
            }
        }
    };

    this.poll = function (t) {
        if (!t) return contents;
        var keys = Object.keys(contents);
        var ret = [];
        var count = 0;
        for (; count < keys.length; ++count) {
            ret.push(t(contents[keys[count]]));
        }return ret;
    };

    this.listen = function (obj, name, enableDirectMsg) {
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

    this.mute = function (obj, name) {
        var method = obj[name];
        var listeners = methods[name];
        if (!listeners) return;
        delete listeners[obj.__uid];
    };

    this.call = function (method) {
        if (method === undefined) {
            console.error("Undefined call");
            return;
        }

        var i, l;

        /* * /
        var args = Array.prototype.slice.call(arguments, 1);
        /*/
        var args = new Array(arguments.length - 1);
        for (i = 1, l = arguments.length; i < l; i++) {
            args[i - 1] = arguments[i];
        } /* */

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

},{}],24:[function(require,module,exports){
(function (global){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function store(obj, asBuffer) {

    if (typeof obj == "function") obj = undefined;
    if (!obj || (typeof obj === "undefined" ? "undefined" : _typeof(obj)) != "object") return obj;

    var inst = [],
        strIndex = { "Object": -2, "Array": -3 },
        arrIndex = {},
        objIndex = [];

    add(obj);

    if (asBuffer) return toBuffer(inst);

    return inst;

    function add(obj) {
        var type = typeof obj === "undefined" ? "undefined" : _typeof(obj);
        if (type == "function") {
            obj = undefined;
            type = typeof obj === "undefined" ? "undefined" : _typeof(obj);
        }

        var index;
        if (obj === undefined) {
            index = -4;
        } else if (type == "string") {
            index = strIndex[obj];
            if (index === undefined) index = -1;
        } else index = inst.indexOf(obj);

        if (index != -1) return index;

        if (type == "object") {
            index = objIndex.indexOf(obj);
            if (index != -1) return index;
        }

        index = inst.length;
        inst[index] = obj;

        if (type == "string") strIndex[obj] = index;

        if (!obj || type != "object") return index;

        objIndex[index] = obj;

        var ctorIndex = add(obj.constructor.fullName || obj.constructor.name);

        if (obj.buffer && obj.buffer instanceof ArrayBuffer) {

            if (!asBuffer) obj = Array.from(obj);

            inst[index] = [ctorIndex, -3, obj];
            return index;
        }

        var key,
            keySet = [];
        for (key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                var keyIndex = strIndex[key];
                if (keyIndex === undefined) {
                    keyIndex = inst.length;
                    inst[keyIndex] = key;
                    strIndex[key] = keyIndex;
                    keyIndex = -1;
                }
                keySet[keySet.length] = keyIndex;
            }
        }

        var strKeySet = JSON.stringify(keySet);
        keyIndex = arrIndex[strKeySet];
        if (keyIndex === undefined) {
            keyIndex = inst.length;
            inst[keyIndex] = keySet;
            arrIndex[strKeySet] = keyIndex;
        }

        var valueSet = [ctorIndex, keyIndex];

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                var valueIndex = add(value);
                valueSet[valueSet.length] = valueIndex;
            }
        }

        strKeySet = JSON.stringify(valueSet);
        keyIndex = arrIndex[strKeySet];
        if (keyIndex === undefined) {
            arrIndex[strKeySet] = index;
            inst[index] = valueSet;
        } else {
            inst[index] = [keyIndex];
        }

        return index;
    }
}

function load(arr, isBuffer) {

    if (isBuffer || arr && arr.buffer) arr = fromBuffer(arr);

    var SELF = null;

    if (!arr || (typeof arr === "undefined" ? "undefined" : _typeof(arr)) !== "object") return arr;

    if (!Array.isArray(arr)) return undefined;

    (function () {
        try {
            SELF = window;
        } catch (ex) {}
    })();
    if (!SELF) (function () {
        try {
            SELF = global;
        } catch (ex) {}
    })();

    var objects = [];

    var cursor = 0;
    return read(-1);

    function read(pos) {

        switch (pos) {
            case -1:
                pos = cursor;
                break;
            case -2:
                return "Object";
            case -3:
                return "Array";
            default:
                if (objects[pos]) return objects[pos];

                break;
        }

        if (pos == cursor) cursor++;

        var value = arr[pos];
        if (!value) return value;

        var type = typeof value === "undefined" ? "undefined" : _typeof(value);
        if (type != "object") return value;

        if (value.length == 1) value = arr[value[0]];

        var className = read(value[0]);

        if (!className.split) console.log(className, value[0]);

        var ctor = SELF,
            obj;
        className.split(".").forEach(function (part) {
            return ctor = ctor[part];
        });

        if (value[1] !== -3) {
            obj = new ctor();
            objects[pos] = obj;

            var fieldRefList,
                mustAdd = value[1] > pos;

            fieldRefList = arr[value[1]];

            var fieldList = fieldRefList.map(function (ref) {
                return read(ref);
            });

            if (mustAdd) cursor++;

            for (var i = 2; i < value.length; ++i) {
                var vi = value[i];
                if (vi !== -4) obj[fieldList[i - 2]] = read(vi);
            }
        } else {

            obj = value[2];
            if (!isBuffer) objects[pos] = obj = ctor.from(obj);else objects[pos] = obj = new ctor(obj);

            cursor++;
        }

        return obj;
    }
}

function toBuffer(src) {
    var out = [];

    var dab = new Float64Array(1);
    var bab = new Uint8Array(dab.buffer);
    var sab = new Int32Array(dab.buffer);
    var fab = new Float32Array(dab.buffer);

    var p = 0;

    for (var i = 0, l = src.length; i < l; ++i) {
        var value = src[i],
            type = typeof value === "undefined" ? "undefined" : _typeof(value);

        switch (type) {
            case "boolean":
                // 1, 2
                out[p++] = 1 + (value | 0);
                break;

            case "number":
                var isFloat = Math.floor(value) !== value;
                if (isFloat) {

                    fab[0] = value;

                    if (fab[0] === value || isNaN(value)) {
                        out[p++] = 3;
                        out[p++] = bab[0];out[p++] = bab[1];
                        out[p++] = bab[2];out[p++] = bab[3];
                    } else {
                        dab[0] = value;
                        out[p++] = 4;
                        out[p++] = bab[0];out[p++] = bab[1];
                        out[p++] = bab[2];out[p++] = bab[3];
                        out[p++] = bab[4];out[p++] = bab[5];
                        out[p++] = bab[6];out[p++] = bab[7];
                    }
                } else {
                    saveInt(0, value);
                }
                break;

            case "string":
                var start = p,
                    restart = false;
                saveInt(1, value.length);
                for (var bi = 0, bl = value.length; bi < bl; ++bi) {
                    var byte = value.charCodeAt(bi);
                    if (byte > 0xFF) {
                        restart = true;
                        break;
                    }
                    out[p++] = byte;
                }

                if (!restart) break;

                p = start;
                saveInt(2, value.length);

                for (var bi = 0, bl = value.length; bi < bl; ++bi) {
                    var byte = value.charCodeAt(bi);
                    out[p++] = byte & 0xFF;
                    out[p++] = byte >> 8 & 0xFF;
                }

                break;

            case "object":
                if (_typeof(value[2]) == "object") {
                    var typed = new Uint8Array(value[2].buffer);

                    saveInt(3, -typed.length);
                    saveInt(0, value[0]);

                    for (var bi = 0, bl = typed.length; bi < bl; ++bi) {
                        out[p++] = typed[bi];
                    }
                } else {
                    saveInt(3, value.length);
                    for (var bi = 0, bl = value.length; bi < bl; ++bi) {
                        saveInt(0, value[bi]);
                    }
                }

                break;
        }
    }

    return Uint8Array.from(out);

    function saveInt(type, value) {

        var bitCount = Math.ceil(Math.log2(Math.abs(value)));
        var byte = type << 6;

        if (bitCount < 3 || value === -8) {
            byte |= 0x30;
            byte |= value & 0xF;
            out[p++] = byte;
            return;
        }

        if (bitCount <= 8 + 3 || value === -2048) {
            byte |= 0x10;
            byte |= value >>> 8 & 0xF;
            out[p++] = byte;
            out[p++] = value & 0xFF;
            return;
        }

        if (bitCount <= 16 + 3 || value === -524288) {
            byte |= 0x20;
            byte |= value >>> 16 & 0xF;
            out[p++] = byte;
            out[p++] = value >>> 8 & 0xFF;
            out[p++] = value & 0xFF;
            return;
        }

        sab[0] = value;
        out[p++] = byte;
        out[p++] = bab[0];out[p++] = bab[1];
        out[p++] = bab[2];out[p++] = bab[3];
        return;
    }
}

function fromBuffer(src) {
    var out = [];
    var dab = new Float64Array(1);
    var bab = new Uint8Array(dab.buffer);
    var sab = new Int32Array(dab.buffer);
    var fab = new Float32Array(dab.buffer);

    var pos = 0;

    for (var l = src.length; pos < l;) {
        out[out.length] = read();
    }return out;

    function read() {
        var tmp;
        var byte = src[pos++];
        switch (byte) {
            case 0:
                break;
            case 1:
                return false;
            case 2:
                return true;
            case 3:
                return decodeFloat32();
            case 4:
                return decodeFloat64();
        }

        var hb = byte >>> 4;
        var lb = byte & 0xF;
        switch (hb & 3) {
            case 0:
                // 32 bit int
                tmp = decodeInt32();
                break;
            case 1:
                // 12 bit int
                tmp = src[pos++] | lb << 28 >> 20;
                break;
            case 2:
                // 19 bit int
                tmp = lb << 28 >> 12 | src[pos] | src[pos + 1] << 8;
                pos += 2;
                break;
            case 3:
                // 4-bit int
                tmp = lb << 28 >> 28;
        }

        switch (hb >> 2) {
            case 0:
                return tmp;
            case 1:
                return decodeStr8(tmp);
            case 2:
                return decodeStr16(tmp);
            case 3:
                return decodeArray(tmp);
        }
    }

    function decodeStr8(size) {
        var acc = "";
        for (var i = 0; i < size; ++i) {
            acc += String.fromCharCode(src[pos++]);
        }return acc;
    }

    function decodeStr16(size) {
        var acc = "";
        for (var i = 0; i < size; ++i) {
            var h = src[pos++];
            acc += String.fromCharCode(h << 8 | src[pos++]);
        }
        return acc;
    }

    function decodeArray(size) {

        var ret = [];
        if (size < 0) {

            ret[0] = read(); // type
            ret[1] = -3;

            size = -size;

            var bytes = new Uint8Array(size);

            for (var i = 0; i < size; ++i) {
                bytes[i] = src[pos++];
            }ret[2] = bytes.buffer;
        } else {

            for (var i = 0; i < size; ++i) {
                ret[i] = read();
            }
        }

        return ret;
    }

    function decodeInt32() {
        bab[0] = src[pos++];bab[1] = src[pos++];
        bab[2] = src[pos++];bab[3] = src[pos++];
        return sab[0];
    }

    function decodeFloat32() {
        bab[0] = src[pos++];bab[1] = src[pos++];
        bab[2] = src[pos++];bab[3] = src[pos++];
        return fab[0];
    }

    function decodeFloat64() {
        bab[0] = src[pos++];bab[1] = src[pos++];
        bab[2] = src[pos++];bab[3] = src[pos++];
        bab[4] = src[pos++];bab[5] = src[pos++];
        bab[6] = src[pos++];bab[7] = src[pos++];
        return dab[0];
    }
}

module.exports = { store: store, load: load };

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],25:[function(require,module,exports){
'use strict';

var _dryDi = require('dry-di');

var _App = require('./App.js');

var _App2 = _interopRequireDefault(_App);

var _IStore = require('./store/IStore.js');

var _IStore2 = _interopRequireDefault(_IStore);

var _Node = require('./store/Node.js');

var _Node2 = _interopRequireDefault(_Node);

var _mt = require('./lib/mt.js');

var _mt2 = _interopRequireDefault(_mt);

var _mvc = require('./lib/mvc.js');

var _Env = require('./entities\\Env.js');

var _Env2 = _interopRequireDefault(_Env);

var _Sim = require('./entities\\Sim.js');

var _Sim2 = _interopRequireDefault(_Sim);

var _Splash = require('./entities\\Splash.js');

var _Splash2 = _interopRequireDefault(_Splash);

var _arduboy = require('./components\\arduboy.js');

var _arduboy2 = _interopRequireDefault(_arduboy);

var _BTN = require('./components\\BTN.js');

var _BTN2 = _interopRequireDefault(_BTN);

var _config = require('./components\\config.js');

var _config2 = _interopRequireDefault(_config);

var _files = require('./components\\files.js');

var _files2 = _interopRequireDefault(_files);

var _LED = require('./components\\LED.js');

var _LED2 = _interopRequireDefault(_LED);

var _market = require('./components\\market.js');

var _market2 = _interopRequireDefault(_market);

var _SCREEN = require('./components\\SCREEN.js');

var _SCREEN2 = _interopRequireDefault(_SCREEN);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var entities = {
    Env: _Env2.default,
    Sim: _Sim2.default,
    Splash: _Splash2.default
}; // let {bind, inject, getInstanceOf} = require('./lib/dry-di.js');

Object.freeze(entities);
var components = {
    arduboy: _arduboy2.default,
    BTN: _BTN2.default,
    config: _config2.default,
    files: _files2.default,
    LED: _LED2.default,
    market: _market2.default,
    SCREEN: _SCREEN2.default
};
Object.freeze(components);
var scenecomponents = {};
Object.freeze(scenecomponents);
var scenecontrollers = {};
Object.freeze(scenecontrollers);


function makeRNG(seed) {
    var rng = new _mt2.default(Math.round(seed || 0));
    return rng.random.bind(rng);
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {

        (0, _dryDi.bind)(_Node2.default).to(_IStore2.default).singleton();
        (0, _dryDi.bind)(makeRNG).to("RNG").factory();

        for (var k in scenecomponents) {
            (0, _dryDi.bind)(scenecomponents[k]).to(k).withTags({ scenecomponent: true });
        }for (var _k in scenecontrollers) {
            (0, _dryDi.bind)(scenecontrollers[_k]).to(_k).withTags({ scenecontroller: true });
        }(0, _mvc.boot)({
            main: _App2.default,
            element: document.body,
            components: components,
            entities: entities,
            modelName: 'default'
        });
    }, 2000);
});

},{"./App.js":2,"./components\\BTN.js":10,"./components\\LED.js":11,"./components\\SCREEN.js":12,"./components\\arduboy.js":13,"./components\\config.js":14,"./components\\files.js":15,"./components\\market.js":16,"./entities\\Env.js":17,"./entities\\Sim.js":18,"./entities\\Splash.js":19,"./lib/mt.js":21,"./lib/mvc.js":22,"./store/IStore.js":26,"./store/Node.js":27,"dry-di":1}],26:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = null;

function mkdirp(base, path, callback) {
    var acc = base || "";
    var paths = path.split(/[\/\\]+/);
    paths.pop(); // remove last file/empty entry
    work();
    return;

    function work() {
        if (!paths.length) return callback(true);
        var current = paths.shift();
        fs.mkdir(acc + current, function (err) {
            if (err && err.code != 'EEXIST') {
                callback(false);
            } else {
                acc += current + '/';
                work();
            }
        });
    }
}

var onload = [],
    wasInit = false;
var lock = {};

var IStore = function () {
    function IStore() {
        _classCallCheck(this, IStore);
    }

    _createClass(IStore, [{
        key: 'getTextItem',
        value: function getTextItem(k, cb) {

            if (lock[k]) cb(lock[k]);else fs.readFile(this.root + k, "utf-8", function (err, data) {
                return cb(data);
            });
        }
    }, {
        key: 'getItemBuffer',
        value: function getItemBuffer(k, cb) {

            if (lock[k]) cb(lock[k]);else {
                console.log("Reading ", k);
                fs.readFile(this.root + k, function (err, data) {
                    console.log("Read ", k, err);
                    cb(data);
                });
            }
        }
    }, {
        key: 'setItem',
        value: function setItem(k, v, cb) {
            var _this = this;

            mkdirp(this.root, k, function (success) {

                if (!success) {
                    cb(false);
                } else if (lock[k]) {
                    setTimeout(_this.setItem.bind(_this, k, v, cb), 200);
                } else {
                    lock[k] = v;
                    fs.writeFile(_this.root + k, v, function (err) {

                        delete lock[k];
                        if (cb) cb(!err);
                    });
                }
            });
        }
    }, {
        key: 'onload',
        set: function set(cb) {
            if (wasInit) cb();else onload.push(cb);
        }
    }, {
        key: 'fs',
        set: function set(_fs) {
            var _this2 = this;

            if (fs) return;

            fs = _fs;

            mkdirp(this.root, "store/", function () {

                _this2.root += "store/";

                wasInit = true;

                for (var i = 0, cb; cb = onload[i]; ++i) {
                    cb();
                }
            });
        }
    }]);

    return IStore;
}();

module.exports = IStore;

},{}],27:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var IStore = require('./IStore.js');

if (window.require) {

    var fs = window.require('fs');

    var _window$require = window.require('electron'),
        app = _window$require.remote.app;

    var _window$require2 = window.require('electron'),
        webFrame = _window$require2.webFrame;

    webFrame.registerURLSchemeAsPrivileged('file', {});
} else {

    fs = {
        mkdir: function mkdir(path, cb) {
            cb();
        },
        readFile: function readFile(path, enc, cb) {

            var data = localStorage.getItem(path);

            if (typeof enc === "function") {

                cb = enc;
                if (data === null) return cb("ENOENT");

                data = data.split(",");
                var buffer = new Uint8Array(data.length);
                for (var i = 0, l = data.length; i < l; ++i) {
                    buffer[i] = data[i] | 0;
                }data = buffer;
            } else if (data === null) return cb("ENOENT");

            cb(undefined, data);
        },
        writeFile: function writeFile(path, data, cb) {

            localStorage.setItem(path, data);
            cb(true);
        }
    };
}

var NodeStore = function (_IStore) {
    _inherits(NodeStore, _IStore);

    function NodeStore() {
        _classCallCheck(this, NodeStore);

        var _this = _possibleConstructorReturn(this, (NodeStore.__proto__ || Object.getPrototypeOf(NodeStore)).call(this));

        if (app) _this.root = app.getPath("userData") + "/";else _this.root = "";

        _this.fs = fs;

        return _this;
    }

    return NodeStore;
}(IStore);

module.exports = NodeStore;

},{"./IStore.js":26}]},{},[25])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvZHJ5LWRpL2luZGV4LmpzIiwiLi5cXHNyY1xcQXBwLmpzIiwiLi5cXHNyY1xcYXRjb3JlXFxBdDMyOFAtVEMuanMiLCIuLlxcc3JjXFxhdGNvcmVcXEF0MzI4UC1VU0FSVC5qcyIsIi4uXFxzcmNcXGF0Y29yZVxcQXQzMjhQLXBlcmlmZXJhbHMuanMiLCIuLlxcc3JjXFxhdGNvcmVcXEF0MzJ1NC1TUEkuanMiLCIuLlxcc3JjXFxhdGNvcmVcXEF0MzJ1NC1wZXJpZmVyYWxzLmpzIiwiLi5cXHNyY1xcYXRjb3JlXFxzcmNcXGF0Y29yZVxcQXRjb3JlLmpzIiwiLi5cXHNyY1xcYXRjb3JlXFxIZXguanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxCVE4uanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxMRUQuanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxTQ1JFRU4uanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxhcmR1Ym95LmpzIiwiLi5cXHNyY1xcY29tcG9uZW50c1xcY29uZmlnLmpzIiwiLi5cXHNyY1xcY29tcG9uZW50c1xcZmlsZXMuanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxtYXJrZXQuanMiLCIuLlxcc3JjXFxlbnRpdGllc1xcRW52LmpzIiwiLi5cXHNyY1xcZW50aXRpZXNcXFNpbS5qcyIsIi4uXFxzcmNcXGVudGl0aWVzXFxTcGxhc2guanMiLCIuLlxcc3JjXFxsaWJcXGRyeS1kb20uanMiLCIuLlxcc3JjXFxsaWJcXG10LmpzIiwiLi5cXHNyY1xcbGliXFxtdmMuanMiLCIuLlxcc3JjXFxsaWJcXHBvb2wuanMiLCIuLlxcc3JjXFxsaWJcXHNyY1xcbGliXFxzdHJsZHIuanMiLCIuLlxcc3JjXFxwYy5qcyIsIi4uXFxzcmNcXHN0b3JlXFxJU3RvcmUuanMiLCIuLlxcc3JjXFxzdG9yZVxcTm9kZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LFlBQUksR0FBSixFQUNJLE1BQUssSUFBTCxHQUFZLElBQUksT0FBSixDQUFZLFVBQVosSUFBMEIsR0FBdEMsQ0FESixLQUdJLE1BQUssSUFBTCxHQUFZLEVBQVo7O0FBRUosY0FBSyxFQUFMLEdBQVUsRUFBVjs7QUFSUztBQVVaOzs7RUFabUIsTTs7QUFpQnhCLE9BQU8sT0FBUCxHQUFpQixTQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBfdHlwZW9mID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9IDogZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTtcclxuXHJcbnZhciBfc2xpY2VkVG9BcnJheSA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbXCJyZXR1cm5cIl0pIF9pW1wicmV0dXJuXCJdKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlXCIpOyB9IH07IH0oKTtcclxuXHJcbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XHJcblxyXG5mdW5jdGlvbiBfdG9Db25zdW1hYmxlQXJyYXkoYXJyKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBBcnJheShhcnIubGVuZ3RoKTsgaSA8IGFyci5sZW5ndGg7IGkrKykgeyBhcnIyW2ldID0gYXJyW2ldOyB9IHJldHVybiBhcnIyOyB9IGVsc2UgeyByZXR1cm4gQXJyYXkuZnJvbShhcnIpOyB9IH1cclxuXHJcbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKCFzZWxmKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gY2FsbCAmJiAodHlwZW9mIGNhbGwgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjsgfVxyXG5cclxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XHJcblxyXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IGJpbmQ6IGJpbmQsIGluamVjdDogaW5qZWN0LCBnZXRJbnN0YW5jZU9mOiBnZXRJbnN0YW5jZU9mLCBnZXRQb2xpY3k6IGdldFBvbGljeSB9O1xyXG5cclxuLypcclxuXHJcbldlbGNvbWUgdG8gRFJZLURJLlxyXG5cclxuKi9cclxuXHJcbnZhciBrbm93bkludGVyZmFjZXMgPSBbXTtcclxudmFyIGludGVyZmFjZXMgPSB7fTtcclxudmFyIGNvbmNyZXRpb25zID0ge307XHJcblxyXG52YXIgY29udGV4dCA9IFt7fV07XHJcblxyXG52YXIgUmVmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gUmVmKHByb3ZpZGVyLCBpZmlkLCBzY29wZSkge1xyXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBSZWYpO1xyXG5cclxuICAgICAgICB0aGlzLmlmaWQgPSBpZmlkO1xyXG4gICAgICAgIHRoaXMuY291bnQgPSBwcm92aWRlci5kZXBlbmRlbmN5Q291bnQ7XHJcbiAgICAgICAgdGhpcy5kZXBlbmRlbmN5Q291bnQgPSBwcm92aWRlci5kZXBlbmRlbmN5Q291bnQ7XHJcbiAgICAgICAgdGhpcy5zY29wZSA9IHNjb3BlO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmRzID0ge307XHJcbiAgICAgICAgdGhpcy5pbmplY3Rpb25zID0gbnVsbDtcclxuICAgICAgICB0aGlzLnByb3ZpZGVyID0gcHJvdmlkZXI7XHJcblxyXG4gICAgICAgIHZhciBwc2xvdCA9IHNjb3BlW2lmaWRdIHx8IChzY29wZVtpZmlkXSA9IG5ldyBTbG90KCkpO1xyXG5cclxuICAgICAgICBpZiAocHJvdmlkZXIuaW5qZWN0aW9ucykge1xyXG4gICAgICAgICAgICB0aGlzLmluamVjdGlvbnMgPSB7fTtcclxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLmluamVjdGlvbnMsIHByb3ZpZGVyLmluamVjdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5qZWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdmFyIF9pZmlkID0gdGhpcy5pbmplY3Rpb25zW2tleV07XHJcbiAgICAgICAgICAgICAgICB2YXIgc2xvdCA9IHNjb3BlW19pZmlkXSB8fCAoc2NvcGVbX2lmaWRdID0gbmV3IFNsb3QoKSk7XHJcbiAgICAgICAgICAgICAgICBzbG90LmFkZEluamVjdG9yKHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwc2xvdC5hZGRQcm92aWRlcih0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlQ2xhc3MoUmVmLCBbe1xyXG4gICAgICAgIGtleTogXCJiaW5kSW5qZWN0aW9uc1wiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kSW5qZWN0aW9ucyhpbmplY3Rpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICBpbmplY3Rpb25zLmZvckVhY2goZnVuY3Rpb24gKF9yZWYpIHtcclxuICAgICAgICAgICAgICAgIHZhciBfcmVmMiA9IF9zbGljZWRUb0FycmF5KF9yZWYsIDIpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsYXp6ID0gX3JlZjJbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgX2ludGVyZmFjZSA9IF9yZWYyWzFdO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBrbm93bkludGVyZmFjZXMuaW5kZXhPZihfaW50ZXJmYWNlKTtcclxuICAgICAgICAgICAgICAgIHZhciBpbmplY3Rpb24gPSBpbmplY3Rpb25zW2tleV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIF90aGlzLmJpbmRzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZmlkID0gX3RoaXMuaW5qZWN0aW9uc1trZXldO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNjb3BlW190aGlzLmlmaWRdLnJlbW92ZUluamVjdG9yKF90aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5zYXRpc2Z5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGVwZW5kZW5jeUNvdW50LS07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgX3RoaXMuYmluZHNba2V5XSA9IGNsYXp6O1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcInNhdGlzZnlcIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2F0aXNmeSgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY291bnQtLTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvdW50ID09IDApIHRoaXMuc2NvcGVbdGhpcy5pZmlkXS5hZGRWaWFibGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XSk7XHJcblxyXG4gICAgcmV0dXJuIFJlZjtcclxufSgpO1xyXG5cclxudmFyIFNsb3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBTbG90KCkge1xyXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBTbG90KTtcclxuXHJcbiAgICAgICAgdGhpcy52aWFibGVQcm92aWRlcnMgPSAwO1xyXG4gICAgICAgIHRoaXMucHJvdmlkZXJzID0gW107XHJcbiAgICAgICAgdGhpcy5pbmplY3RvcnMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlQ2xhc3MoU2xvdCwgW3tcclxuICAgICAgICBrZXk6IFwiYWRkSW5qZWN0b3JcIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYWRkSW5qZWN0b3IocmVmKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluamVjdG9ycy5wdXNoKHJlZik7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZpYWJsZVByb3ZpZGVycyA+IDApIHJlZi5zYXRpc2Z5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJyZW1vdmVJbmplY3RvclwiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVJbmplY3RvcihyZWYpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuaW5qZWN0b3JzLmluZGV4T2YocmVmKTtcclxuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHRoaXMuaW5qZWN0b3JzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJhZGRQcm92aWRlclwiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRQcm92aWRlcihyZWYpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucHJvdmlkZXJzLnB1c2gocmVmKTtcclxuICAgICAgICAgICAgaWYgKHJlZi5jb3VudCA9PSAwKSB0aGlzLmFkZFZpYWJsZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgICBrZXk6IFwiYWRkVmlhYmxlXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZFZpYWJsZSgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudmlhYmxlUHJvdmlkZXJzKys7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZpYWJsZVByb3ZpZGVycyA9PSAxKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGluamVjdG9ycyA9IHRoaXMuaW5qZWN0b3JzO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBpbmplY3RvcnMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5qZWN0b3JzW2ldLnNhdGlzZnkoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgICBrZXk6IFwiZ2V0VmlhYmxlXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFZpYWJsZShjbGF6eiwgdGFncywgbXVsdGlwbGUpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZpYWJsZVByb3ZpZGVycyA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW11bHRpcGxlKSB0aHJvdyBuZXcgRXJyb3IoXCJObyB2aWFibGUgcHJvdmlkZXJzIGZvciBcIiArIGNsYXp6ICsgXCIuICMxMjZcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciByZXQgPSBtdWx0aXBsZSA/IFtdIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHZhciBtb3N0VmlhYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgdmFyIG1heFBvaW50cyA9IC0xO1xyXG4gICAgICAgICAgICBub3RWaWFibGU6IGZvciAodmFyIGkgPSAwLCBjOyBjID0gdGhpcy5wcm92aWRlcnNbaV07ICsraSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGMuY291bnQpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBvaW50cyA9IGMuZGVwZW5kZW5jeUNvdW50O1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhZ3MgJiYgYy50YWdzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgdGFnIGluIHRhZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGMudGFnc1t0YWddICE9PSB0YWdzW3RhZ10pIGNvbnRpbnVlIG5vdFZpYWJsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzKys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG11bHRpcGxlKSByZXRbcmV0Lmxlbmd0aF0gPSBjLnByb3ZpZGVyLnBvbGljeS5iaW5kKGMucHJvdmlkZXIsIGMuYmluZHMpO2Vsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwb2ludHMgPiBtYXhQb2ludHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4UG9pbnRzID0gcG9pbnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3N0VmlhYmxlID0gYztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghbXVsdGlwbGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbW9zdFZpYWJsZSkgdGhyb3cgbmV3IEVycm9yKFwiTm8gdmlhYmxlIHByb3ZpZGVycyBmb3IgXCIgKyBjbGF6eiArIFwiLiBUYWcgbWlzbWF0Y2guXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBtb3N0VmlhYmxlLnByb3ZpZGVyLnBvbGljeS5iaW5kKG1vc3RWaWFibGUucHJvdmlkZXIsIG1vc3RWaWFibGUuYmluZHMpO1xyXG4gICAgICAgICAgICB9IGVsc2UgcmV0dXJuIHJldDtcclxuICAgICAgICB9XHJcbiAgICB9XSk7XHJcblxyXG4gICAgcmV0dXJuIFNsb3Q7XHJcbn0oKTtcclxuXHJcbmZ1bmN0aW9uIHJlZ2lzdGVySW50ZXJmYWNlKGlmYykge1xyXG5cclxuICAgIHZhciBwcm9wcyA9IHt9LFxyXG4gICAgICAgIGN1cnJpZmMgPSB2b2lkIDA7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBpZmMgPT0gXCJmdW5jdGlvblwiKSBjdXJyaWZjID0gaWZjLnByb3RvdHlwZTtlbHNlIGlmICgodHlwZW9mIGlmYyA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKGlmYykpID09IFwib2JqZWN0XCIpIGN1cnJpZmMgPSBpZmM7XHJcblxyXG4gICAgd2hpbGUgKGN1cnJpZmMgJiYgY3VycmlmYyAhPT0gT2JqZWN0LnByb3RvdHlwZSkge1xyXG5cclxuICAgICAgICB2YXIgbmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhpZmMucHJvdG90eXBlKTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBuYW1lc1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmICghcHJvcHNbbmFtZV0pIHByb3BzW25hbWVdID0gX3R5cGVvZihpZmMucHJvdG90eXBlW25hbWVdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN1cnJpZmMgPSBjdXJyaWZjLnByb3RvdHlwZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbGVuID0ga25vd25JbnRlcmZhY2VzLmxlbmd0aDtcclxuICAgIGludGVyZmFjZXNbbGVuXSA9IHByb3BzO1xyXG4gICAga25vd25JbnRlcmZhY2VzW2xlbl0gPSBpZmM7XHJcblxyXG4gICAgcmV0dXJuIGxlbjtcclxufVxyXG5cclxudmFyIFByb3ZpZGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBQcm92aWRlKCkge1xyXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBQcm92aWRlKTtcclxuXHJcbiAgICAgICAgdGhpcy5pbmplY3Rpb25zID0gbnVsbDtcclxuICAgICAgICB0aGlzLmRlcGVuZGVuY3lDb3VudCA9IDA7XHJcbiAgICAgICAgdGhpcy5jbGF6eiA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5jdG9yID0gbnVsbDtcclxuICAgICAgICB0aGlzLmJpbmRzID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gZGVmYXVsdCBwb2xpY3kgaXMgdG8gY3JlYXRlIGEgbmV3IGluc3RhbmNlIGZvciBlYWNoIGluamVjdGlvblxyXG4gICAgICAgIHRoaXMucG9saWN5ID0gZnVuY3Rpb24gKGJpbmRzLCBhcmdzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5jdG9yKGJpbmRzLCBhcmdzKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVDbGFzcyhQcm92aWRlLCBbe1xyXG4gICAgICAgIGtleTogXCJjbG9uZVwiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjbG9uZSgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXQgPSBuZXcgUHJvdmlkZSgpO1xyXG5cclxuICAgICAgICAgICAgcmV0LmluamVjdGlvbnMgPSB0aGlzLmluamVjdGlvbnM7XHJcbiAgICAgICAgICAgIHJldC5kZXBlbmRlbmN5Q291bnQgPSB0aGlzLmRlcGVuZGVuY3lDb3VudDtcclxuICAgICAgICAgICAgcmV0LmNsYXp6ID0gdGhpcy5jbGF6ejtcclxuICAgICAgICAgICAgcmV0LnBvbGljeSA9IHRoaXMucG9saWN5O1xyXG4gICAgICAgICAgICByZXQuY3RvciA9IHRoaXMuY3RvcjtcclxuICAgICAgICAgICAgcmV0LmJpbmRzID0gdGhpcy5iaW5kcztcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJiaW5kSW5qZWN0aW9uc1wiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kSW5qZWN0aW9ucyhpbmplY3Rpb25zKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgYmluZHMgPSB0aGlzLmJpbmRzID0gdGhpcy5iaW5kcyB8fCBbXTtcclxuICAgICAgICAgICAgdmFyIGJpbmRDb3VudCA9IHRoaXMuYmluZHMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgaW5qZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChfcmVmMykge1xyXG4gICAgICAgICAgICAgICAgdmFyIF9yZWY0ID0gX3NsaWNlZFRvQXJyYXkoX3JlZjMsIDIpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsYXp6ID0gX3JlZjRbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgX2ludGVyZmFjZSA9IF9yZWY0WzFdO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmluZENvdW50OyArK2kpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmluZHNbaV1bMF0gPT0gY2xhenopIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJpbmRzW2JpbmRzLmxlbmd0aF0gPSBbY2xhenosIF9pbnRlcmZhY2VdO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgICBrZXk6IFwiZ2V0UmVmXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFJlZihpZmlkLCBfaW50ZXJmYWNlKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbWFwID0gaW50ZXJmYWNlc1tpZmlkXSxcclxuICAgICAgICAgICAgICAgIGNsYXp6ID0gdGhpcy5jbGF6ejtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgIGlmIChfdHlwZW9mKGNsYXp6LnByb3RvdHlwZVtrZXldKSA9PSBtYXBba2V5XSkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDbGFzcyBcIiArIGNsYXp6Lm5hbWUgKyBcIiBjYW4ndCBwcm92aWRlIHRvIGludGVyZmFjZSBcIiArIF9pbnRlcmZhY2UubmFtZSArIFwiIGJlY2F1c2UgXCIgKyBrZXkgKyBcIiBpcyBcIiArIF90eXBlb2YoY2xhenpba2V5XSkgKyBcIiBpbnN0ZWFkIG9mIFwiICsgbWFwW2tleV0gKyBcIi5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVmKHRoaXMsIGlmaWQsIGNvbnRleHRbY29udGV4dC5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJzZXRDb25jcmV0aW9uXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldENvbmNyZXRpb24oY2xhenopIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2xhenogPSBjbGF6ejtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjbGF6eiA9PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3RvciA9IGZ1bmN0aW9uIChfY2xhenopIHtcclxuICAgICAgICAgICAgICAgICAgICBfaW5oZXJpdHMoX2NsYXNzLCBfY2xhenopO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBfY2xhc3MoYmluZHMsIGFyZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF9yZWY1O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIF9jbGFzcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgKF9yZWY1ID0gX2NsYXNzLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoX2NsYXNzKSkuY2FsbC5hcHBseShfcmVmNSwgW3RoaXNdLmNvbmNhdChfdG9Db25zdW1hYmxlQXJyYXkoYXJncykpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2NsYXNzO1xyXG4gICAgICAgICAgICAgICAgfShjbGF6eik7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShjbGF6ei5wcm90b3R5cGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2xpY3kgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNsYXp6O1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGNpZCA9IGtub3duSW50ZXJmYWNlcy5pbmRleE9mKGNsYXp6KTtcclxuICAgICAgICAgICAgaWYgKGNpZCA9PSAtMSkgY2lkID0gcmVnaXN0ZXJJbnRlcmZhY2UoY2xhenopO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFjb25jcmV0aW9uc1tjaWRdKSBjb25jcmV0aW9uc1tjaWRdID0gW3RoaXNdO2Vsc2UgY29uY3JldGlvbnNbY2lkXS5wdXNoKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJmYWN0b3J5XCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGZhY3RvcnkoKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvbGljeSA9IGZ1bmN0aW9uIChiaW5kcywgYXJncykge1xyXG4gICAgICAgICAgICAgICAgdmFyIFRISVMgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MyID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MyW19rZXldID0gYXJndW1lbnRzW19rZXldO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUSElTLmN0b3IoYmluZHMsIGFyZ3MuY29uY2F0KGFyZ3MyKSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJzaW5nbGV0b25cIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2luZ2xldG9uKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gbnVsbDtcclxuICAgICAgICAgICAgdGhpcy5wb2xpY3kgPSBmdW5jdGlvbiAoYmluZHMsIGFyZ3MpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaW5zdGFuY2UpIHJldHVybiBpbnN0YW5jZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IE9iamVjdC5jcmVhdGUodGhpcy5jdG9yLnByb3RvdHlwZSk7XHJcbiAgICAgICAgICAgICAgICBpbnN0YW5jZS5jb25zdHJ1Y3RvciA9IHRoaXMuY3RvcjtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3Rvci5jYWxsKGluc3RhbmNlLCBiaW5kcywgYXJncyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbmV3IChjbGFzcyBleHRlbmRzIHRoaXMuY3RvcntcclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25zdHJ1Y3RvciggYXJncyApe1xyXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBpbnN0YW5jZSA9IHRoaXM7IC8vIGNhbnQgZG8gdGhpcyA6KFxyXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBzdXBlcihhcmdzKTtcclxuICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfV0pO1xyXG5cclxuICAgIHJldHVybiBQcm92aWRlO1xyXG59KCk7XHJcblxyXG5mdW5jdGlvbiBiaW5kKGNsYXp6KSB7XHJcblxyXG4gICAgdmFyIGNpZCA9IGtub3duSW50ZXJmYWNlcy5pbmRleE9mKGNsYXp6KTtcclxuICAgIGlmIChjaWQgPT0gLTEpIHtcclxuICAgICAgICBjaWQgPSByZWdpc3RlckludGVyZmFjZShjbGF6eik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHByb3ZpZGVycyA9IGNvbmNyZXRpb25zW2NpZF07XHJcbiAgICB2YXIgbG9jYWxQcm92aWRlcnMgPSBbXTtcclxuXHJcbiAgICBpZiAoIXByb3ZpZGVycykge1xyXG5cclxuICAgICAgICBpZiAoY2xhenogJiYgY2xhenpbXCJAaW5qZWN0XCJdKSBpbmplY3QoY2xhenpbXCJAaW5qZWN0XCJdKS5pbnRvKGNsYXp6KTtlbHNlIG5ldyBQcm92aWRlKCkuc2V0Q29uY3JldGlvbihjbGF6eik7XHJcblxyXG4gICAgICAgIHByb3ZpZGVycyA9IGNvbmNyZXRpb25zW2NpZF07XHJcbiAgICB9XHJcblxyXG4gICAgbG9jYWxQcm92aWRlcnMgPSBwcm92aWRlcnMubWFwKGZ1bmN0aW9uIChwYXJ0aWFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnRpYWwuY2xvbmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciByZWZzID0gW107XHJcbiAgICB2YXIgdGFncyA9IG51bGw7XHJcbiAgICB2YXIgaWZpZCA9IHZvaWQgMDtcclxuXHJcbiAgICB2YXIgcGFydGlhbEJpbmQgPSB7XHJcbiAgICAgICAgdG86IGZ1bmN0aW9uIHRvKF9pbnRlcmZhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBpZmlkID0ga25vd25JbnRlcmZhY2VzLmluZGV4T2YoX2ludGVyZmFjZSk7XHJcbiAgICAgICAgICAgIGlmIChpZmlkID09IC0xKSBpZmlkID0gcmVnaXN0ZXJJbnRlcmZhY2UoX2ludGVyZmFjZSk7XHJcblxyXG4gICAgICAgICAgICBsb2NhbFByb3ZpZGVycy5mb3JFYWNoKGZ1bmN0aW9uIChwcm92aWRlcikge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZWYgPSBwcm92aWRlci5nZXRSZWYoaWZpZCwgX2ludGVyZmFjZSk7XHJcbiAgICAgICAgICAgICAgICByZWYudGFncyA9IHRhZ3M7XHJcbiAgICAgICAgICAgICAgICByZWZzLnB1c2gocmVmKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB3aXRoVGFnczogZnVuY3Rpb24gd2l0aFRhZ3ModGFncykge1xyXG4gICAgICAgICAgICByZWZzLmZvckVhY2goZnVuY3Rpb24gKHJlZikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlZi50YWdzID0gdGFncztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNpbmdsZXRvbjogZnVuY3Rpb24gc2luZ2xldG9uKCkge1xyXG4gICAgICAgICAgICBsb2NhbFByb3ZpZGVycy5mb3JFYWNoKGZ1bmN0aW9uIChwcm92aWRlcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3ZpZGVyLnNpbmdsZXRvbigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmYWN0b3J5OiBmdW5jdGlvbiBmYWN0b3J5KCkge1xyXG4gICAgICAgICAgICBsb2NhbFByb3ZpZGVycy5mb3JFYWNoKGZ1bmN0aW9uIChwcm92aWRlcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3ZpZGVyLmZhY3RvcnkoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5qZWN0OiBmdW5jdGlvbiBpbmplY3QobWFwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluamVjdGluZyhtYXApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5qZWN0aW5nOiBmdW5jdGlvbiBpbmplY3RpbmcoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4yKSwgX2tleTIgPSAwOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XHJcbiAgICAgICAgICAgICAgICBhcmdzW19rZXkyXSA9IGFyZ3VtZW50c1tfa2V5Ml07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlZnMuZm9yRWFjaChmdW5jdGlvbiAocmVmKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVmLmJpbmRJbmplY3Rpb25zKGFyZ3MpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgbG9jYWxQcm92aWRlcnMuZm9yRWFjaChmdW5jdGlvbiAocHJvdmlkZXIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm92aWRlci5iaW5kSW5qZWN0aW9ucyhhcmdzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBwYXJ0aWFsQmluZDtcclxufVxyXG5cclxudmFyIEluamVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEluamVjdChkZXBlbmRlbmNpZXMpIHtcclxuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSW5qZWN0KTtcclxuXHJcbiAgICAgICAgdGhpcy5kZXBlbmRlbmNpZXMgPSBkZXBlbmRlbmNpZXM7XHJcbiAgICAgICAgdmFyIHRhZ3MgPSB0aGlzLnRhZ3MgPSB7fTtcclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGVwZW5kZW5jaWVzKSB7XHJcbiAgICAgICAgICAgIHRhZ3Nba2V5XSA9IHt9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlQ2xhc3MoSW5qZWN0LCBbe1xyXG4gICAgICAgIGtleTogXCJpbnRvXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGludG8oY2xhenopIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjaWQgPSBrbm93bkludGVyZmFjZXMuaW5kZXhPZihjbGF6eik7XHJcbiAgICAgICAgICAgIGlmIChjaWQgPT0gLTEpIGNpZCA9IHJlZ2lzdGVySW50ZXJmYWNlKGNsYXp6KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpbmplY3Rpb25zID0ge30sXHJcbiAgICAgICAgICAgICAgICBtYXAgPSB0aGlzLmRlcGVuZGVuY2llcyxcclxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY3lDb3VudCA9IDAsXHJcbiAgICAgICAgICAgICAgICB0YWdzID0gdGhpcy50YWdzLFxyXG4gICAgICAgICAgICAgICAgbXVsdGlwbGUgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBtYXApIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgX2ludGVyZmFjZSA9IG1hcFtrZXldO1xyXG4gICAgICAgICAgICAgICAgdmFyIGRlcGVuZGVuY3kgPSBfaW50ZXJmYWNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGVwZW5kZW5jeSkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgX2ludGVyZmFjZSA9IF9pbnRlcmZhY2VbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBkZXBlbmRlbmN5Lmxlbmd0aDsgKytpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlcGVuZGVuY3lbaV0gPT0gXCJzdHJpbmdcIikgdGFnc1trZXldW2RlcGVuZGVuY3lbaV1dID0gdHJ1ZTtlbHNlIGlmIChBcnJheS5pc0FycmF5KGRlcGVuZGVuY3lbaV0pKSBtdWx0aXBsZVtrZXldID0gdHJ1ZTtlbHNlIGlmIChkZXBlbmRlbmN5W2ldKSBPYmplY3QuYXNzaWduKHRhZ3Nba2V5XSwgZGVwZW5kZW5jeVtpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpZmlkID0ga25vd25JbnRlcmZhY2VzLmluZGV4T2YoX2ludGVyZmFjZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlmaWQgPT0gLTEpIGlmaWQgPSByZWdpc3RlckludGVyZmFjZShfaW50ZXJmYWNlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpbmplY3Rpb25zW2tleV0gPSBpZmlkO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY3lDb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvdmlkZXIgPSBuZXcgUHJvdmlkZSgpLnNldENvbmNyZXRpb24oY2xhenopLFxyXG4gICAgICAgICAgICAgICAgcHJvdG8gPSBjbGF6ei5wcm90b3R5cGU7XHJcbiAgICAgICAgICAgIHZhciBwcm92aWRlcnMgPSBjb25jcmV0aW9uc1tjaWRdO1xyXG5cclxuICAgICAgICAgICAgcHJvdmlkZXIuaW5qZWN0aW9ucyA9IGluamVjdGlvbnM7XHJcbiAgICAgICAgICAgIHByb3ZpZGVyLmRlcGVuZGVuY3lDb3VudCA9IGRlcGVuZGVuY3lDb3VudDtcclxuXHJcbiAgICAgICAgICAgIHByb3ZpZGVyLmN0b3IgPSBmdW5jdGlvbiAoYmluZHMsIGFyZ3MpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmVEZXBlbmRlbmNpZXMoYmluZHMsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgY2xhenouYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHByb3ZpZGVyLmN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShjbGF6ei5wcm90b3R5cGUpO1xyXG4gICAgICAgICAgICBwcm92aWRlci5jdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGNsYXp6O1xyXG5cclxuICAgICAgICAgICAgLy8gcHJvdmlkZXIuY3RvciA9IGNsYXNzIGV4dGVuZHMgY2xhenoge1xyXG4gICAgICAgICAgICAvLyAgICAgY29uc3RydWN0b3IoIGFyZ3MgKXtcclxuICAgICAgICAgICAgLy8gICAgICAgICByZXNvbHZlRGVwZW5kZW5jaWVzKCB0aGlzICk7IC8vICpzaWdoKlxyXG4gICAgICAgICAgICAvLyAgICAgICAgIHN1cGVyKC4uLmFyZ3MpO1xyXG4gICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAvLyB9O1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gcmVzb2x2ZURlcGVuZGVuY2llcyhiaW5kcywgb2JqKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2xvdHNldCA9IGNvbnRleHRbY29udGV4dC5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIF9rZXkzIGluIGluamVjdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmluZHMgJiYgaW5qZWN0aW9uc1tfa2V5M10gaW4gYmluZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqW19rZXkzXSA9IGJpbmRzW2luamVjdGlvbnNbX2tleTNdXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2xvdCA9IHNsb3RzZXRbaW5qZWN0aW9uc1tfa2V5M11dO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwb2xpY3kgPSBzbG90LmdldFZpYWJsZShfa2V5MywgdGFnc1tfa2V5M10sIG11bHRpcGxlW19rZXkzXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtdWx0aXBsZVtfa2V5M10pIG9ialtfa2V5M10gPSBwb2xpY3koW10pO2Vsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3V0ID0gb2JqW19rZXkzXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaTIgPSAwOyBfaTIgPCBwb2xpY3kubGVuZ3RoOyArK19pMikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0W19pMl0gPSBwb2xpY3lbX2kyXShbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XSk7XHJcblxyXG4gICAgcmV0dXJuIEluamVjdDtcclxufSgpO1xyXG5cclxuZnVuY3Rpb24gaW5qZWN0KGRlcGVuZGVuY2llcykge1xyXG5cclxuICAgIHJldHVybiBuZXcgSW5qZWN0KGRlcGVuZGVuY2llcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEluc3RhbmNlT2YoX2ludGVyZmFjZSkge1xyXG4gICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbjMgPiAxID8gX2xlbjMgLSAxIDogMCksIF9rZXk0ID0gMTsgX2tleTQgPCBfbGVuMzsgX2tleTQrKykge1xyXG4gICAgICAgIGFyZ3NbX2tleTQgLSAxXSA9IGFyZ3VtZW50c1tfa2V5NF07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbGV0IGlmaWQgPSBrbm93bkludGVyZmFjZXMuaW5kZXhPZiggX2ludGVyZmFjZSApO1xyXG4gICAgLy8gbGV0IHNsb3QgPSBjb250ZXh0WyBjb250ZXh0Lmxlbmd0aC0xIF1bIGlmaWQgXTtcclxuXHJcbiAgICAvLyBpZiggIXNsb3QgKVxyXG4gICAgLy8gICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHByb3ZpZGVycyBmb3IgXCIgKyAoX2ludGVyZmFjZS5uYW1lIHx8IF9pbnRlcmZhY2UpICsgXCIuICM0NjdcIik7XHJcblxyXG4gICAgLy8gbGV0IHBvbGljeSA9IHNsb3QuZ2V0VmlhYmxlKCBfaW50ZXJmYWNlLm5hbWUgfHwgX2ludGVyZmFjZSApO1xyXG5cclxuICAgIC8vIHJldHVybiBwb2xpY3kuY2FsbCggbnVsbCwgYXJncyApO1xyXG4gICAgcmV0dXJuIGdldFBvbGljeSh7IF9pbnRlcmZhY2U6IF9pbnRlcmZhY2UsIGFyZ3M6IGFyZ3MgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFBvbGljeShkZXNjKSB7XHJcbiAgICBkZXNjID0gZGVzYyB8fCB7fTtcclxuICAgIGlmICghZGVzYy5faW50ZXJmYWNlKSB0aHJvdyBuZXcgRXJyb3IoXCJQb2xpY3kgZGVzY3JpcHRvciBoYXMgbm8gaW50ZXJmYWNlLlwiKTtcclxuICAgIHZhciBuYW1lID0gZGVzYy5faW50ZXJmYWNlLm5hbWUgfHwgZGVzYy5faW50ZXJmYWNlO1xyXG4gICAgdmFyIHRhZ3MgPSBkZXNjLnRhZ3M7XHJcbiAgICB2YXIgbXVsdGlwbGUgPSBkZXNjLm11bHRpcGxlO1xyXG4gICAgdmFyIGFyZ3MgPSBkZXNjLmFyZ3M7XHJcblxyXG4gICAgdmFyIGlmaWQgPSBrbm93bkludGVyZmFjZXMuaW5kZXhPZihkZXNjLl9pbnRlcmZhY2UpO1xyXG4gICAgdmFyIHNsb3QgPSBjb250ZXh0W2NvbnRleHQubGVuZ3RoIC0gMV1baWZpZF07XHJcblxyXG4gICAgaWYgKCFzbG90KSB0aHJvdyBuZXcgRXJyb3IoXCJObyBwcm92aWRlcnMgZm9yIFwiICsgbmFtZSArIFwiLiAjNDY3XCIpO1xyXG5cclxuICAgIHZhciBwb2xpY3kgPSBzbG90LmdldFZpYWJsZShuYW1lLCB0YWdzLCBtdWx0aXBsZSk7XHJcbiAgICBpZiAoYXJncykge1xyXG4gICAgICAgIGlmIChtdWx0aXBsZSkgcG9saWN5ID0gcG9saWN5Lm1hcChmdW5jdGlvbiAocCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcC5jYWxsKG51bGwsIGFyZ3MpO1xyXG4gICAgICAgIH0pO2Vsc2UgcG9saWN5ID0gcG9saWN5LmNhbGwobnVsbCwgYXJncyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcG9saWN5O1xyXG59XHJcbiIsImltcG9ydCB7IE1vZGVsLCBJQ29udHJvbGxlciB9IGZyb20gJy4vbGliL212Yy5qcyc7XHJcbmltcG9ydCBJU3RvcmUgIGZyb20gJy4vc3RvcmUvSVN0b3JlLmpzJztcclxuaW1wb3J0IERPTSBmcm9tICcuL2xpYi9kcnktZG9tLmpzJztcclxuXHJcbndpbmRvdy5zdHJsZHIgPSByZXF1aXJlKFwiLi9saWIvc3RybGRyLmpzXCIpO1xyXG5cclxuY2xhc3MgQXBwIHtcclxuXHJcbiAgICBzdGF0aWMgXCJAaW5qZWN0XCIgPSB7XHJcbiAgICAgICAgRE9NOkRPTSxcclxuICAgICAgICBzdG9yZTpJU3RvcmUsXHJcbiAgICAgICAgcG9vbDpcInBvb2xcIixcclxuICAgICAgICBjb250cm9sbGVyczpbSUNvbnRyb2xsZXIsW11dLFxyXG4gICAgICAgIHJvb3Q6IFtNb2RlbCwge3Njb3BlOlwicm9vdFwifV1cclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuXHJcbiAgICAgICAgd2luZG93LnN0b3JlID0gdGhpcy5zdG9yZTtcclxuXHJcbiAgICAgICAgdGhpcy5wb29sLmFkZCh0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2RlbHMgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZS5vbmxvYWQgPSB0aGlzLmluaXQuYmluZCh0aGlzKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCgpe1xyXG5cclxuXHRkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGV2dCA9PiB7XHJcblx0ICAgIHRoaXMucG9vbC5jYWxsKFwib25QcmVzc1wiICsgZXZ0LmNvZGUpO1xyXG5cdCAgICAvLyBjb25zb2xlLmxvZyhldnQpO1xyXG5cdH0pO1xyXG5cclxuXHRkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBldnQgPT4ge1xyXG5cdCAgICB0aGlzLnBvb2wuY2FsbChcIm9uUmVsZWFzZVwiICsgZXZ0LmNvZGUpO1xyXG5cdCAgICAvLyBjb25zb2xlLmxvZyhldnQpO1xyXG5cdH0pO1xyXG5cclxuICAgICAgICB0aGlzLmNvbnRyb2xsZXJzLmZvckVhY2goKGNvbnRyb2xsZXIpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wb29sLmFkZCggY29udHJvbGxlciApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLnBvb2wuY2FsbChcImVudGVyU3BsYXNoXCIpO1xyXG5cclxuXHJcbiAgICAgICAgc2V0SW50ZXJ2YWwoIHRoaXMuY29tbWl0LmJpbmQodGhpcyksIDMwMDAgKTtcclxuXHJcbiAgICAgICAgdmFyIHBlbmRpbmcgPSAyO1xyXG4gICAgICAgIHRoaXMub3Blbk1vZGVsKCBcImFwcFwiLCBkb25lLmJpbmQodGhpcykgKTtcclxuICAgICAgICBzZXRUaW1lb3V0KCBkb25lLmJpbmQodGhpcyksIDEwMDAgKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZG9uZSgpe1xyXG4gICAgICAgICAgICBwZW5kaW5nLS07XHJcbiAgICAgICAgICAgIGlmKCAhcGVuZGluZyApXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvb2wuY2FsbCggXCJleGl0U3BsYXNoXCIgKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBvcGVuTW9kZWwoIG5hbWUsIGNiLCBtb2RlbCApe1xyXG5cclxuICAgICAgICB2YXIgb2xkTW9kZWwgPSB0aGlzLm1vZGVscy5maW5kKChvYmopID0+IG9iai5uYW1lID09IG5hbWUgKTtcclxuXHJcbiAgICAgICAgaWYoIG9sZE1vZGVsICl7XHJcblxyXG4gICAgICAgICAgICBpZiggb2xkTW9kZWwgPT0gbW9kZWwgKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2VNb2RlbCggbmFtZSApO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBwYXRoID0gbmFtZTtcclxuXHJcbiAgICAgICAgaWYoIHR5cGVvZiBtb2RlbCA9PSBcInN0cmluZ1wiICl7XHJcbiAgICAgICAgICAgIHBhdGggPSBtb2RlbDtcclxuICAgICAgICAgICAgbW9kZWwgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoICFtb2RlbCApIG1vZGVsID0gbmV3IE1vZGVsKCk7XHJcblxyXG4gICAgICAgIHRoaXMucm9vdC5zZXRJdGVtKCBuYW1lLCBtb2RlbC5kYXRhICk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kZWxzWyB0aGlzLm1vZGVscy5sZW5ndGggXSA9IHtcclxuICAgICAgICAgICAgbW9kZWwsXHJcbiAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgIHBhdGgsXHJcbiAgICAgICAgICAgIGRpcnR5OiBmYWxzZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc3RvcmUuZ2V0VGV4dEl0ZW0oIHBhdGgsIChkYXRhKT0+e1xyXG5cclxuICAgICAgICAgICAgaWYoIGRhdGEgKXtcclxuXHRcdG1vZGVsLmxvYWQoIEpTT04ucGFyc2UoZGF0YSkgKTtcclxuXHRcdGlmKCBtb2RlbC5nZXRJdGVtKFwiZXhwaXJlc1wiKSA+IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgKXtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5kaXJ0eSA9IGZhbHNlO1xyXG5cdFx0ICAgIGNiLmNhbGwoKTtcclxuXHRcdCAgICByZXR1cm47XHJcblx0XHR9XHJcbiAgICAgICAgICAgIH1cclxuXHQgICAgXHJcbiAgICAgICAgICAgIHRoaXMucG9vbC5jYWxsKCBuYW1lICsgXCJNb2RlbEluaXRcIiwgbW9kZWwsIGNiICk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjbG9zZU1vZGVsKCBuYW1lICl7XHJcbiAgICAgICAgLy8gdG8tZG86IGZpbmQsIGNvbW1pdCwgcmVtb3ZlIGZyb20gdGhpcy5tb2RlbHNcclxuICAgIH1cclxuXHJcbiAgICBhcHBNb2RlbEluaXQoIG1vZGVsLCBjYiApe1xyXG5cclxuXHRsZXQgcmVwb1VSTCA9IFtcclxuXHQgICAgXCJodHRwOi8vd3d3LmNyYWl0Lm5ldC9hcmR1Ym95L3JlcG8yLmpzb25cIixcclxuXHQgICAgXCJodHRwOi8vYXJkdWJveS5yaWVkLmNsL3JlcG8uanNvblwiXHJcblx0XTtcclxuXHJcblx0aWYoIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIkVsZWN0cm9uXCIpID09IC0xICYmIHR5cGVvZiBjb3Jkb3ZhID09IFwidW5kZWZpbmVkXCIgKXtcclxuXHQgICAgLy8gbW9kZWwuc2V0SXRlbShcInByb3h5XCIsIFwiaHR0cHM6Ly9jcm9zc29yaWdpbi5tZS9cIik7XHJcblx0ICAgIG1vZGVsLnNldEl0ZW0oXCJwcm94eVwiLCBcImh0dHBzOi8vY29ycy1hbnl3aGVyZS5oZXJva3VhcHAuY29tL1wiKTtcclxuXHQgICAgcmVwb1VSTCA9IHJlcG9VUkwubWFwKCB1cmwgPT4gbW9kZWwuZ2V0SXRlbShcInByb3h5XCIpICsgdXJsICk7XHJcblx0fWVsc2V7XHJcblx0ICAgIG1vZGVsLnNldEl0ZW0oXCJwcm94eVwiLCBcIlwiKTtcclxuXHR9XHJcblxyXG5cdGxldCBpdGVtcyA9IFtdO1xyXG5cdGxldCBwZW5kaW5nID0gMjtcclxuXHJcblx0cmVwb1VSTC5mb3JFYWNoKCB1cmwgPT5cdFxyXG5cdFx0XHQgZmV0Y2goIHVybCApXHJcblx0XHRcdCAudGhlbiggcnNwID0+IHJzcC5qc29uKCkgKVxyXG5cdFx0XHQgLnRoZW4oIFxyXG5cdFx0XHQgICAgIGpzb24gPT4gXHJcblx0XHRcdFx0IGpzb24gJiYgXHJcblx0XHRcdFx0IGpzb24uaXRlbXMgJiYgXHJcblx0XHRcdFx0IGpzb24uaXRlbXMuZm9yRWFjaCggaXRlbSA9PiB7XHJcblx0XHRcdFx0ICAgICBpdGVtLmF1dGhvciA9IGl0ZW0uYXV0aG9yIHx8IFwiPDx1bmtub3duPj5cIjtcclxuXHRcdFx0XHQgICAgIGlmKFxyXG5cdFx0XHRcdFx0IGl0ZW0uYmFubmVyICYmIChcclxuXHRcdFx0XHRcdCAhaXRlbS5zY3JlZW5zaG90cyB8fFxyXG5cdFx0XHRcdFx0ICFpdGVtLnNjcmVlbnNob3RzWzBdIHx8XHJcblx0XHRcdFx0XHQgIWl0ZW0uc2NyZWVuc2hvdHNbMF0uZmlsZW5hbWVcclxuXHRcdFx0XHRcdCApKVxyXG5cdFx0XHRcdCBcdCBpdGVtLnNjcmVlbnNob3RzID0gW3tmaWxlbmFtZTppdGVtLmJhbm5lcn1dO1xyXG5cdFx0XHRcdCAgICAgXHJcblx0XHRcdFx0ICAgICBpdGVtcy5wdXNoKGl0ZW0pO1xyXG5cdFx0XHRcdCB9KSB8fCBcclxuXHRcdFx0XHQgZG9uZSgpXHJcblx0XHRcdCApXHJcblx0XHRcdCAuY2F0Y2goIGVyciA9PiB7XHJcblx0XHRcdCAgICAgY29uc29sZS5sb2coIGVyciApO1xyXG5cdFx0XHQgICAgIGRvbmUoKTtcclxuXHRcdFx0IH0pXHRcclxuXHRcdCAgICAgICApO1xyXG5cclxuXHRmdW5jdGlvbiBkb25lKCl7XHJcblx0ICAgIHBlbmRpbmctLTtcclxuXHJcblx0ICAgIGlmKCAhcGVuZGluZyApe1xyXG5cdFx0aXRlbXMgPSBpdGVtcy5zb3J0KChhLCBiKSA9PiB7XHJcblx0XHQgICAgaWYoIGEudGl0bGUgPiBiLnRpdGxlICkgcmV0dXJuIDE7XHJcblx0XHQgICAgaWYoIGEudGl0bGUgPCBiLnRpdGxlICkgcmV0dXJuIC0xO1xyXG5cdFx0ICAgIHJldHVybiAwO1xyXG5cdFx0fSk7XHJcblx0XHRtb2RlbC5yZW1vdmVJdGVtKFwicmVwb1wiKTtcclxuXHRcdG1vZGVsLnNldEl0ZW0oXCJyZXBvXCIsIGl0ZW1zKTtcclxuXHRcdG1vZGVsLnNldEl0ZW0oXCJleHBpcmVzXCIsIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgKyA2MCAqIDYwICogMTAwMCApO1xyXG5cdFx0Y2IoKTtcclxuXHQgICAgfVxyXG5cdH1cclxuICAgIH1cclxuXHJcbiAgICBjb21taXQoKXtcclxuXHJcbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLm1vZGVscy5sZW5ndGg7ICsraSApe1xyXG5cclxuICAgICAgICAgICAgdmFyIG9iaiA9IHRoaXMubW9kZWxzW2ldO1xyXG4gICAgICAgICAgICBpZiggIW9iai5kaXJ0eSAmJiBvYmoubW9kZWwuZGlydHkgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBvYmouZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgb2JqLm1vZGVsLmRpcnR5ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggb2JqLmRpcnR5ICYmICFvYmoubW9kZWwuZGlydHkgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBvYmouZGlydHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RvcmUuc2V0SXRlbSggb2JqLnBhdGgsIEpTT04uc3RyaW5naWZ5KG9iai5tb2RlbC5kYXRhKSApO1xyXG5cclxuICAgICAgICAgICAgfWVsc2UgaWYoIG9iai5kaXJ0eSAmJiBvYmoubW9kZWwuZGlydHkgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBvYmoubW9kZWwuZGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXRBY3RpdmVWaWV3KCB2aWV3ICl7XHJcbiAgICAgICAgWy4uLnRoaXMuRE9NLmVsZW1lbnQuY2hpbGRyZW5dLmZvckVhY2goIG5vZGUgPT4gbm9kZS5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKG5vZGUpICk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQXBwO1xyXG4iLCJcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgd3JpdGU6e1xyXG5cclxuICAgICAgICBbMHgxNSArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5UT1YwID0gdmFsdWUgJiAxO1xyXG4gICAgICAgICAgICB0aGlzLk9DRjBBID0gKHZhbHVlPj4xKSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuT0NGMEIgPSAodmFsdWU+PjIpICYgMTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgWzB4MjQgKyAweDIwXTpmdW5jdGlvbiggdmFsdWUgKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuV0dNMDAgID0gKHZhbHVlPj4wKSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuV0dNMDEgID0gKHZhbHVlPj4xKSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuQ09NMEIwID0gKHZhbHVlPj40KSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuQ09NMEIxID0gKHZhbHVlPj41KSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuQ09NMEEwID0gKHZhbHVlPj42KSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuQ09NMEExID0gKHZhbHVlPj43KSAmIDE7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgVENDUjBBOlxcbiAgV0dNMDA6JHt0aGlzLldHTTAwfVxcbiAgV0dNMDE6JHt0aGlzLldHTTAxfVxcbiAgQ09NMEIwOiR7dGhpcy5DT00wQjB9XFxuICBDT00wQjE6JHt0aGlzLkNPTTBCMX1cXG4gIENPTTBBMDoke3RoaXMuQ09NMEEwfVxcbiAgQ09NMEExOiR7dGhpcy5DT00wQTF9YCk7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIFsweDI1ICsgMHgyMF06ZnVuY3Rpb24oIHZhbHVlICl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLkZPQzBBID0gKHZhbHVlPj43KSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuRk9DMEIgPSAodmFsdWU+PjYpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5XR00wMiA9ICh2YWx1ZT4+MykgJiAxO1xyXG4gICAgICAgICAgICB0aGlzLkNTID0gdmFsdWUgJiA3O1xyXG5cclxuICAgICAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFRDQ1IwQjpcXG4gIEZPQzBBOiR7dGhpcy5GT0MwQX1cXG4gIEZPQzBCOiR7dGhpcy5GT0MwQn1cXG4gIFdHTTAyOiR7dGhpcy5XR00wMn1gKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCBcIlBDPVwiICsgKHRoaXMuY29yZS5wYzw8MSkudG9TdHJpbmcoMTYpICsgXCIgV1JJVEUgVENDUjBCOiAjXCIgKyB2YWx1ZS50b1N0cmluZygxNikgKyBcIiA6IFwiICsgdmFsdWUgKTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgWzB4MjcgKyAweDIwXTpmdW5jdGlvbiggdmFsdWUgKXtcclxuICAgICAgICAgICAgdGhpcy5PQ1IwQSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggXCJPQ1IwQSA9IFwiICsgdmFsdWUgKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBbMHgyOCArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xyXG4gICAgICAgICAgICB0aGlzLk9DUjBCID0gdmFsdWU7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCBcIk9DUjBCID0gXCIgKyB2YWx1ZSApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIFsweDZFXTpmdW5jdGlvbiggdmFsdWUgKXtcclxuICAgICAgICAgICAgdGhpcy5UT0lFMCA9IHZhbHVlICYgMTtcclxuICAgICAgICAgICAgdGhpcy5PQ0lFMEEgPSAodmFsdWU+PjEpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5PQ0lFMEIgPSAodmFsdWU+PjIpICYgMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9LFxyXG5cclxuICAgIGluaXQ6ZnVuY3Rpb24oKXtcclxuICAgICAgICB0aGlzLnRpY2sgPSAwO1xyXG4gICAgICAgIHRoaXMuV0dNMDAgID0gMDtcclxuICAgICAgICB0aGlzLldHTTAxICA9IDA7XHJcbiAgICAgICAgdGhpcy5DT00wQjAgPSAwO1xyXG4gICAgICAgIHRoaXMuQ09NMEIxID0gMDtcclxuICAgICAgICB0aGlzLkNPTTBBMCA9IDA7XHJcbiAgICAgICAgdGhpcy5DT00wQTEgPSAwO1xyXG4gICAgICAgIHRoaXMuRk9DMEEgPSAwO1xyXG4gICAgICAgIHRoaXMuRk9DMEIgPSAwO1xyXG4gICAgICAgIHRoaXMuV0dNMDIgPSAwO1xyXG4gICAgICAgIHRoaXMuQ1MgPSAwO1xyXG4gICAgICAgIHRoaXMuVE9WMCA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuVE9JRTAgPSAwO1xyXG4gICAgICAgIHRoaXMuT0NJRTBBID0gMDtcclxuICAgICAgICB0aGlzLk9DSUUwQiA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMudGltZSA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMudXBkYXRlU3RhdGUgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdmFyIE1BWCA9IDB4RkYsIEJPVFRPTSA9IDAsIFdHTTAwID0gdGhpcy5XR00wMCwgV0dNMDEgPSB0aGlzLldHTTAxLCBXR00wMiA9IHRoaXMuV0dNMDI7XHJcblxyXG4gICAgICAgICAgICBpZiggICAgICAgV0dNMDIgPT0gMCAmJiBXR00wMSA9PSAwICYmIFdHTTAwID09IDAgKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRpbWVyIE1vZGU6IE5vcm1hbCAoXCIgKyB0aGlzLm1vZGUgKyBcIilcIik7XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBXR00wMiA9PSAwICYmIFdHTTAxID09IDAgJiYgV0dNMDAgPT0gMSApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGltZXIgTW9kZTogUFdNLCBwaGFzZSBjb3JyZWN0IChcIiArIHRoaXMubW9kZSArIFwiKVwiKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIFdHTTAyID09IDAgJiYgV0dNMDEgPT0gMSAmJiBXR00wMCA9PSAwICl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSAyO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBNb2RlOiBDVEMgKFwiICsgdGhpcy5tb2RlICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZiggV0dNMDIgPT0gMCAmJiBXR00wMSA9PSAxICYmIFdHTTAwID09IDEgKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IDM7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRpbWVyIE1vZGU6IEZhc3QgUFdNIChcIiArIHRoaXMubW9kZSArIFwiKVwiKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIFdHTTAyID09IDEgJiYgV0dNMDEgPT0gMCAmJiBXR00wMCA9PSAwICl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSA0O1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBNb2RlOiBSZXNlcnZlZCAoXCIgKyB0aGlzLm1vZGUgKyBcIilcIik7XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBXR00wMiA9PSAxICYmIFdHTTAxID09IDAgJiYgV0dNMDAgPT0gMSApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gNTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGltZXIgTW9kZTogUFdNLCBwaGFzZSBjb3JyZWN0IChcIiArIHRoaXMubW9kZSArIFwiKVwiKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIFdHTTAyID09IDEgJiYgV0dNMDEgPT0gMSAmJiBXR00wMCA9PSAwICl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSA2O1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBNb2RlOiBSZXNlcnZlZCAoXCIgKyB0aGlzLm1vZGUgKyBcIilcIik7XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBXR00wMiA9PSAxICYmIFdHTTAxID09IDEgJiYgV0dNMDAgPT0gMSApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gNztcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGltZXIgTW9kZTogRmFzdCBQV00gKFwiICsgdGhpcy5tb2RlICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2goIHRoaXMuQ1MgKXtcclxuICAgICAgICAgICAgY2FzZSAwOiB0aGlzLnByZXNjYWxlID0gMDsgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMTogdGhpcy5wcmVzY2FsZSA9IDE7IGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDI6IHRoaXMucHJlc2NhbGUgPSA4OyBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAzOiB0aGlzLnByZXNjYWxlID0gNjQ7IGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDQ6IHRoaXMucHJlc2NhbGUgPSAyNTY7IGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDU6IHRoaXMucHJlc2NhbGUgPSAxMDI0OyBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDogdGhpcy5wcmVzY2FsZSA9IDE7IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICByZWFkOntcclxuXHJcbiAgICAgICAgWzB4MTUgKyAweDIwXTpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICByZXR1cm4gKCghIXRoaXMuVE9WMCkmMSkgfCAodGhpcy5PQ0YwQTw8MSkgfCAodGhpcy5PQ0YwQjw8Mik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgWzB4MjYgKyAweDIwXTpmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgdmFyIHRpY2sgPSB0aGlzLmNvcmUudGljaztcclxuXHJcbiAgICAgICAgICAgIHZhciB0aWNrc1NpbmNlT1ZGID0gdGljayAtIHRoaXMudGljaztcclxuICAgICAgICAgICAgdmFyIGludGVydmFsID0gKHRpY2tzU2luY2VPVkYgLyB0aGlzLnByZXNjYWxlKSB8IDA7XHJcbiAgICAgICAgICAgIGlmKCAhaW50ZXJ2YWwgKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdmFyIFRDTlQwID0gMHgyNiArIDB4MjA7XHJcbiAgICAgICAgICAgIHZhciBjbnQgPSB0aGlzLmNvcmUubWVtb3J5WyBUQ05UMCBdICsgaW50ZXJ2YWw7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvcmUubWVtb3J5WyBUQ05UMCBdICs9IGludGVydmFsO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy50aWNrICs9IGludGVydmFsKnRoaXMucHJlc2NhbGU7XHJcblxyXG4gICAgICAgICAgICB0aGlzLlRPVjAgKz0gKGNudCAvIDB4RkYpIHwgMDtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlOmZ1bmN0aW9uKCB0aWNrLCBpZSApe1xyXG5cclxuICAgICAgICB2YXIgdGlja3NTaW5jZU9WRiA9IHRpY2sgLSB0aGlzLnRpY2s7XHJcbiAgICAgICAgdmFyIGludGVydmFsID0gKHRpY2tzU2luY2VPVkYgLyB0aGlzLnByZXNjYWxlKSB8IDA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoIGludGVydmFsICl7XHJcbiAgICAgICAgICAgIHZhciBUQ05UMCA9IDB4MjYgKyAweDIwO1xyXG4gICAgICAgICAgICB2YXIgY250ID0gdGhpcy5jb3JlLm1lbW9yeVsgVENOVDAgXSArIGludGVydmFsO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb3JlLm1lbW9yeVsgVENOVDAgXSArPSBpbnRlcnZhbDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMudGljayArPSBpbnRlcnZhbCp0aGlzLnByZXNjYWxlO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5UT1YwICs9IChjbnQgLyAweEZGKSB8IDA7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIHRoaXMuVE9WMCA+IDAgJiYgaWUgKXtcclxuICAgICAgICAgICAgdGhpcy5UT1YwLS07XHJcbiAgICAgICAgICAgIHJldHVybiBcIlRJTUVSME9cIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgd3JpdGU6e1xyXG4gICAgICAgIDB4QzAoIHZhbHVlICl7IHJldHVybiB0aGlzLlVDU1IwQSA9ICh0aGlzLlVDU1IwQSAmIDBiMTAxMTExMDApIHwgKHZhbHVlICYgMGIwMTAwMDAxMSk7IH0sXHJcbiAgICAgICAgMHhDMSggdmFsdWUgKXsgcmV0dXJuIHRoaXMuVUNTUjBCID0gdmFsdWU7IH0sXHJcbiAgICAgICAgMHhDMiggdmFsdWUgKXsgcmV0dXJuIHRoaXMuVUNTUjBDID0gdmFsdWU7IH0sXHJcbiAgICAgICAgMHhDNCggdmFsdWUgKXsgcmV0dXJuIHRoaXMuVUJSUjBMID0gdmFsdWU7IH0sXHJcbiAgICAgICAgMHhDNSggdmFsdWUgKXsgcmV0dXJuIHRoaXMuVUJSUjBIID0gdmFsdWU7IH0sXHJcbiAgICAgICAgMHhDNiggdmFsdWUgKXsgdGhpcy5jb3JlLnBpbnMuc2VyaWFsMCA9ICh0aGlzLmNvcmUucGlucy5zZXJpYWwwfHxcIlwiKSArIFN0cmluZy5mcm9tQ2hhckNvZGUodmFsdWUpOyByZXR1cm4gdGhpcy5VRFIwID0gdmFsdWU7IH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVhZDp7XHJcbiAgICAgICAgMHhDMCgpeyByZXR1cm4gdGhpcy5VQ1NSMEE7IH0sXHJcbiAgICAgICAgMHhDMSgpeyByZXR1cm4gdGhpcy5VQ1NSMEI7IH0sXHJcbiAgICAgICAgMHhDMigpeyByZXR1cm4gdGhpcy5VQ1NSMEM7IH0sXHJcbiAgICAgICAgMHhDNCgpeyByZXR1cm4gdGhpcy5VQlJSMEw7IH0sXHJcbiAgICAgICAgMHhDNSgpeyByZXR1cm4gdGhpcy5VQlJSMEggJiAweDBGOyB9LFxyXG4gICAgICAgIDB4QzYoKXsgcmV0dXJuIHRoaXMuVURSMDsgfVxyXG4gICAgfSxcclxuXHJcbiAgICBpbml0OmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdGhpcy5VQ1NSMEEgPSAweDIwO1xyXG4gICAgICAgIHRoaXMuVUNTUjBCID0gMDtcclxuICAgICAgICB0aGlzLlVDU1IwQyA9IDB4MDY7XHJcbiAgICAgICAgdGhpcy5VQlJSMEwgPSAwOyAvLyBVU0FSVCBCYXVkIFJhdGUgMCBSZWdpc3RlciBMb3dcclxuICAgICAgICB0aGlzLlVCUlIwSCA9IDA7IC8vIFVTQVJUIEJhdWQgUmF0ZSAwIFJlZ2lzdGVyIEhpZ2ggICAgICAgICAgICBcclxuICAgICAgICB0aGlzLlVEUjAgPSAwO1xyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGU6ZnVuY3Rpb24oIHRpY2ssIGllICl7XHJcblxyXG4gICAgfVxyXG5cclxufTtcclxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIFBPUlRCOntcbiAgICAgICAgd3JpdGU6e1xuICAgICAgICAgICAgWzB4MDQgKyAweDIwXTpmdW5jdGlvbiggdmFsdWUgKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNvcmUucGlucy5ERFJCID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWzB4MDUgKyAweDIwXTpmdW5jdGlvbiggdmFsdWUsIG9sZFZhbHVlICl7XG5cbiAgICAgICAgICAgICAgICBpZiggb2xkVmFsdWUgPT0gdmFsdWUgKSByZXR1cm47XG5cblx0XHQvKlxuICAgICAgICAgICAgICAgIGlmKCB0eXBlb2YgZG9jdW1lbnQgIT0gXCJ1bmRlZmluZWRcIiApe1xuICAgICAgICAgICAgICAgICAgICBpZiggdmFsdWUgJiAweDIwICkgZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImJsYWNrXCI7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIndoaXRlXCI7XG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoIHR5cGVvZiBXb3JrZXJHbG9iYWxTY29wZSA9PSBcInVuZGVmaW5lZFwiICl7XG4gICAgICAgICAgICAgICAgICAgIGlmKCB2YWx1ZSAmIDB4MjAgKSBjb25zb2xlLmxvZyggXCJMRUQgT04gI1wiLCAodGhpcy5jb3JlLnBjPDwxKS50b1N0cmluZygxNikgKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBjb25zb2xlLmxvZyggXCJMRUQgT0ZGICNcIiwgKHRoaXMuY29yZS5wYzw8MSkudG9TdHJpbmcoMTYpICk7XG4gICAgICAgICAgICAgICAgfVxuXHRcdCovXG5cbiAgICAgICAgICAgICAgICB0aGlzLmNvcmUucGlucy5QT1JUQiA9IHZhbHVlO1xuXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJ3b3JrZXJAXCIgKyB0aGlzLmNvcmUucGMudG9TdHJpbmcoMTYpICsgXCJbdGljayBcIiArICh0aGlzLmNvcmUudGljayAvIHRoaXMuY29yZS5jbG9jayAqIDEwMDApLnRvRml4ZWQoMykgKyBcIl1cIiwgXCIgUE9SVEIgPSBcIiwgdmFsdWUudG9TdHJpbmcoMikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZWFkOntcbiAgICAgICAgICAgIFsweDAzICsgMHgyMF06ZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMuUElOQiAmIDB4RkYpIHwgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW5pdDpmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGhpcy5QSU5CID0gMDtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLmNvcmUucGlucywgXCJQSU5CXCIsIHtcbiAgICAgICAgICAgICAgICBzZXQ6KCB2ICk9PnRoaXMuUElOQiA9ICh2Pj4+MCkmMHhGRixcbiAgICAgICAgICAgICAgICBnZXQ6KCk9PnRoaXMuUElOQlxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgUE9SVEM6e1xuICAgICAgICB3cml0ZTp7XG4gICAgICAgICAgICBbMHgwNyArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xuICAgICAgICAgICAgICAgIHRoaXMuY29yZS5waW5zLkREUkMgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbMHgwOCArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xuICAgICAgICAgICAgICAgIHRoaXMuY29yZS5waW5zLlBPUlRDID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlYWQ6e1xuICAgICAgICAgICAgWzB4MDYgKyAweDIwXTpmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvcmUucGlucy5QSU5DID0gKHRoaXMuY29yZS5waW5zLlBJTkMgJiAweEZGKSB8fCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIFBPUlREOntcbiAgICAgICAgd3JpdGU6e1xuICAgICAgICAgICAgWzB4MEEgKyAweDIwXTpmdW5jdGlvbiggdmFsdWUgKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNvcmUucGlucy5ERFJEID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWzB4MEIgKyAweDIwXTpmdW5jdGlvbiggdmFsdWUgKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNvcmUucGlucy5QT1JURCA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZWFkOntcbiAgICAgICAgICAgIFsweDA5ICsgMHgyMF06ZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb3JlLnBpbnMuUElORCA9ICh0aGlzLmNvcmUucGlucy5QSU5EICYgMHhGRikgfHwgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBUQzpyZXF1aXJlKCcuL0F0MzI4UC1UQy5qcycpLFxuXG4gICAgVVNBUlQ6cmVxdWlyZSgnLi9BdDMyOFAtVVNBUlQuanMnKVxuXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5pdDpmdW5jdGlvbigpe1xuXHR0aGlzLlNQRFIgPSAwO1xuXHR0aGlzLlNQSUYgPSAwO1xuXHR0aGlzLldDT0wgPSAwO1xuXHR0aGlzLlNQSTJYID0gMDtcblx0dGhpcy5TUElFID0gMDtcblx0dGhpcy5TUEUgPSAwO1xuXHR0aGlzLkRPUkQgPSAwO1xuXHR0aGlzLk1TVFIgPSAwO1xuXHR0aGlzLkNQT0wgPSAwO1xuXHR0aGlzLkNQSEEgPSAwO1xuXHR0aGlzLlNQUjEgPSAwO1xuXHR0aGlzLlNQUjAgPSAwO1xuXHR0aGlzLmNvcmUucGlucy5zcGlPdXQgPSB0aGlzLmNvcmUucGlucy5zcGlPdXQgfHwgW107XG4gICAgfSxcbiAgICBcbiAgICB3cml0ZTp7XG5cdDB4NEM6ZnVuY3Rpb24oIHZhbHVlLCBvbGRWYWx1ZSApe1xuXHQgICAgdGhpcy5TUElFID0gdmFsdWUgPj4gNztcblx0ICAgIHRoaXMuU1BFICA9IHZhbHVlID4+IDY7XG5cdCAgICB0aGlzLkRPUkQgPSB2YWx1ZSA+PiA1O1xuXHQgICAgdGhpcy5NU1RSID0gdmFsdWUgPj4gNDtcblx0ICAgIHRoaXMuQ1BPTCA9IHZhbHVlID4+IDM7XG5cdCAgICB0aGlzLkNQSEEgPSB2YWx1ZSA+PiAyO1xuXHQgICAgdGhpcy5TUFIxID0gdmFsdWUgPj4gMTtcblx0ICAgIHRoaXMuU1BSMCA9IHZhbHVlID4+IDA7XG5cdH0sXG5cdFxuXHQweDREOmZ1bmN0aW9uKCB2YWx1ZSwgb2xkVmFsdWUgKXtcblx0ICAgIHRoaXMuU1BJMlggPSB2YWx1ZSAmIDE7XG5cdCAgICByZXR1cm4gKHRoaXMuU1BJRiA8PCA3KSB8ICh0aGlzLldDT0wgPDwgNikgfCB0aGlzLlNQSTJYO1xuXHR9LFxuXHQweDRFOmZ1bmN0aW9uKCB2YWx1ZSApe1xuXHQgICAgdGhpcy5TUERSID0gdmFsdWU7XG5cdCAgICB0aGlzLmNvcmUucGlucy5zcGlPdXQucHVzaCggdmFsdWUgKTtcblx0ICAgIHRoaXMuU1BJRiA9IDE7XG5cdH1cbiAgICB9LFxuICAgIFxuICAgIHJlYWQ6e1xuXHQweDREOmZ1bmN0aW9uKCl7XG5cdCAgICB0aGlzLlNQSUYgPSAoISF0aGlzLmNvcmUucGlucy5zcGlJbi5sZW5ndGgpIHwgMDtcblx0ICAgIHJldHVybiAodGhpcy5TUElGIDw8IDcpIHwgKHRoaXMuV0NPTCA8PCA2KSB8IHRoaXMuU1BJMlg7XG5cdH0sXG5cdDB4NEU6ZnVuY3Rpb24oKXtcblx0ICAgIGxldCBzcGlJbiA9IHRoaXMuY29yZS5waW5zLnNwaUluO1xuXHQgICAgaWYoIHNwaUluLmxlbmd0aCApXG5cdFx0cmV0dXJuIHRoaXMuU1BEUiA9IHNwaUluLnNoaWZ0KCk7XHQgXG5cdCAgICByZXR1cm4gdGhpcy5TUERSO1xuXHR9XG4gICAgfSxcbiAgICBcbiAgICB1cGRhdGU6ZnVuY3Rpb24oIHRpY2ssIGllICl7XG5cdFxuXHRpZiggdGhpcy5TUElGICYmIHRoaXMuU1BJRSAmJiBpZSApe1xuXHQgICAgdGhpcy5TUElGID0gMDtcblx0ICAgIHJldHVybiBcIlNQSVwiO1xuXHR9XG5cdCAgICBcbiAgICB9XG59O1xuIiwiXG5mdW5jdGlvbiBwb3J0KCBvYmogKXtcbiAgICBcbiAgICBsZXQgb3V0ID0geyB3cml0ZTp7fSwgcmVhZDp7fSwgaW5pdDpudWxsIH07XG5cbiAgICBmb3IoIGxldCBrIGluIG9iaiApe1xuXHRcblx0bGV0IGFkZHIgPSBvYmpba107XG5cdGlmKCAvRERSLnxQT1JULi8udGVzdChrKSApe1xuXHQgICAgXG5cdCAgICBvdXQud3JpdGVbIGFkZHIgXSA9IHNldHRlcihrKTtcblx0ICAgIFxuXHR9ZWxzZXtcblxuXHQgICAgb3V0LnJlYWRbIGFkZHIgXSA9IGdldHRlcihrKTtcblx0ICAgIG91dC5pbml0ID0gaW5pdChrKTtcblx0ICAgIFxuXHR9XG5cdFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldHRlciggayApe1xuXHRyZXR1cm4gZnVuY3Rpb24oIHZhbHVlLCBvbGRWYWx1ZSApe1xuXHQgICAgaWYoIHZhbHVlICE9IG9sZFZhbHVlIClcblx0XHR0aGlzLmNvcmUucGluc1trXSA9IHZhbHVlO1x0ICAgIFxuXHR9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldHRlciggayApe1xuXHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0ICAgIHJldHVybiAodGhpc1trXSAmIDB4RkYpIHwgMDtcblx0fTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbml0KCBrICl7XG5cdHJldHVybiBmdW5jdGlvbigpe1xuXHQgICAgdGhpc1trXSA9IDA7XG5cdCAgICBsZXQgX3RoaXMgPSB0aGlzO1xuXHQgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB0aGlzLmNvcmUucGlucywgaywge1xuXHRcdHNldDpmdW5jdGlvbih2KXsgcmV0dXJuIF90aGlzW2tdID0gKHY+Pj4wKSAmIDB4RkYgfSxcblx0XHRnZXQ6ZnVuY3Rpb24oICl7IHJldHVybiBfdGhpc1trXSB9XG5cdCAgICB9KTtcblx0fVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0O1xuICAgIFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIFBPUlRCOnBvcnQoeyBQSU5COjB4MjMsIEREUkI6MHgyNCwgUE9SVEI6MHgyNSB9KSxcbiAgICBQT1JUQzpwb3J0KHsgUElOQzoweDI2LCBERFJDOjB4MjcsIFBPUlRDOjB4MjggfSksXG4gICAgUE9SVEQ6cG9ydCh7IFBJTkQ6MHgyOSwgRERSRDoweDJBLCBQT1JURDoweDJCIH0pLFxuICAgIFBPUlRFOnBvcnQoeyBQSU5FOjB4MkMsIEREUkU6MHgyRCwgUE9SVEU6MHgyRSB9KSxcbiAgICBQT1JURjpwb3J0KHsgUElORjoweDJGLCBERFJGOjB4MzAsIFBPUlRGOjB4MzEgfSksXG5cbiAgICBUQzpyZXF1aXJlKCcuL0F0MzI4UC1UQy5qcycpLFxuXG4gICAgVVNBUlQ6cmVxdWlyZSgnLi9BdDMyOFAtVVNBUlQuanMnKSxcblxuICAgIFBMTDp7XG5cdHJlYWQ6e1xuXHQgICAgMHg0OTpmdW5jdGlvbiggdmFsdWUgKXtcblx0XHRyZXR1cm4gKHRoaXMuUElORElWIDw8IDQpIHwgKHRoaXMuUExMRSA8PCAxKSB8IHRoaXMuUExPQ0s7XG5cdCAgICB9XG5cdH0sXG5cdHdyaXRlOntcblx0ICAgIDB4NDk6ZnVuY3Rpb24oIHZhbHVlLCBvbGRWYWx1ZSApe1xuXHRcdGlmKCB2YWx1ZSA9PT0gb2xkVmFsdWUgKSByZXR1cm47XG5cdFx0dGhpcy5QSU5ESVYgPSAodmFsdWUgPj4gNCkgJiAxO1xuXHRcdHRoaXMuUExMRSAgID0gKHZhbHVlID4+IDEpICYgMTtcblx0XHR0aGlzLlBMT0NLICA9IDE7XG5cdCAgICB9XG5cdH0sXG5cdGluaXQ6ZnVuY3Rpb24oKXtcblx0ICAgIHRoaXMuUElORElWID0gMDtcblx0ICAgIHRoaXMuUExMRSA9IDA7XG5cdCAgICB0aGlzLlBMT0NLID0gMDtcblx0fVxuICAgIH0sXG5cbiAgICBTUEk6cmVxdWlyZSgnLi9BdDMydTQtU1BJLmpzJyksXG5cbiAgICBFRVBST006e1xuXHR3cml0ZTp7XG5cdCAgICAweDNGOmZ1bmN0aW9uKCB2YWx1ZSwgb2xkVmFsdWUgKXtcblx0XHR2YWx1ZSAmPSB+Mjtcblx0XHRyZXR1cm4gdmFsdWU7XG5cdCAgICB9XG5cdH0sXG5cdHJlYWQ6e30sXG5cdGluaXQ6ZnVuY3Rpb24oKXtcblx0ICAgIFxuXHR9XG4gICAgfSxcblxuICAgIEFEQ1NSQTp7XG5cdFxuXHR3cml0ZTp7XG5cdCAgICAweDdBOmZ1bmN0aW9uKHZhbHVlLCBvbGRWYWx1ZSl7XG5cdFx0dGhpcy5BREVOID0gdmFsdWU+PjcgJiAxO1xuXHRcdHRoaXMuQURTQyA9IHZhbHVlPj42ICYgMTtcblx0XHR0aGlzLkFEQVRFID0gdmFsdWU+PjUgJiAxO1xuXHRcdHRoaXMuQURJRiA9IHZhbHVlPj40ICYgMTtcblx0XHR0aGlzLkFESUUgPSB2YWx1ZT4+MyAmIDE7XG5cdFx0dGhpcy5BRFBTMiA9IHZhbHVlPj4yICYgMTtcblx0XHR0aGlzLkFEUFMxID0gdmFsdWU+PjEgJiAxO1xuXHRcdHRoaXMuQURQUzAgPSB2YWx1ZSAmIDE7XG5cdFx0aWYoIHRoaXMuQURFTiApe1xuXHRcdCAgICBpZiggdGhpcy5BRFNDICl7XG5cdFx0XHR0aGlzLkFEQ0ggPSAoTWF0aC5yYW5kb20oKSAqIDB4RkYpID4+PiAwO1xuXHRcdFx0dGhpcy5BRENMID0gKE1hdGgucmFuZG9tKCkgKiAweEZGKSA+Pj4gMDtcblx0XHRcdHRoaXMuQURTQyA9IDA7XG5cdFx0XHR2YWx1ZSAmPSB+KDE8PDYpO1xuXHRcdCAgICB9XG5cdFx0fVxuXHRcdHJldHVybiB2YWx1ZTtcblx0ICAgIH1cblx0fSxcblxuXHRyZWFkOntcblx0ICAgIDB4Nzk6ZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5BRENIO1xuXHQgICAgfSxcblx0ICAgIDB4Nzg6ZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5BRENMO1xuXHQgICAgfVxuXHR9LFxuXHRcdFxuXHRpbml0OmZ1bmN0aW9uKCl7XG5cdCAgICB0aGlzLkFERU4gPSAwO1xuXHQgICAgdGhpcy5BRFNDID0gMDtcblx0ICAgIHRoaXMuQURBVEUgPSAwO1xuXHQgICAgdGhpcy5BRElGID0gMDtcblx0ICAgIHRoaXMuQURJRSA9IDA7XG5cdCAgICB0aGlzLkFEUFMyID0gMDtcblx0ICAgIHRoaXMuQURQUzEgPSAwO1xuXHQgICAgdGhpcy5BRFBTMCA9IDA7XG5cdH0sXG5cblx0dXBkYXRlOmZ1bmN0aW9uKCB0aWNrLCBpZSApe1xuXHQgICAgaWYoIHRoaXMuQURFTiAmJiB0aGlzLkFESUUgKXtcblx0XHR0aGlzLkFESUYgPSAxO1xuXHRcdHRoaXMuQURTQyA9IDA7XG5cdFx0dGhpcy5BRENIID0gKE1hdGgucmFuZG9tKCkgKiAweEZGKSA+Pj4gMDtcblx0XHR0aGlzLkFEQ0wgPSAoTWF0aC5yYW5kb20oKSAqIDB4RkYpID4+PiAwO1xuXHQgICAgfVxuXG5cdCAgICBpZiggdGhpcy5BRElGICYmIHRoaXMuQURJRSAmJiBpZSApe1xuXHRcdHRoaXMuQURJRiA9IDA7XG5cdFx0cmV0dXJuIFwiQURDXCI7XG5cdCAgICB9XG5cdH1cblx0XG4gICAgfVxuXG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIGh0dHA6Ly93d3cuYXRtZWwuY29tL3dlYmRvYy9hdnJhc3NlbWJsZXIvYXZyYXNzZW1ibGVyLndiX2luc3RydWN0aW9uX2xpc3QuaHRtbFxuXG5mdW5jdGlvbiBiaW4oIGJ5dGVzLCBzaXplICl7XG5cbiAgICB2YXIgcyA9IChieXRlcz4+PjApLnRvU3RyaW5nKDIpO1xuICAgIHdoaWxlKCBzLmxlbmd0aCA8IHNpemUgKSBzID0gXCIwXCIrcztcbiAgICByZXR1cm4gcy5yZXBsYWNlKC8oWzAxXXs0LDR9KS9nLCBcIiQxIFwiKSArIFwiICAjXCIgKyAoYnl0ZXM+Pj4wKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcbiAgICBcbn1cblxuaWYoIHR5cGVvZiBwZXJmb3JtYW5jZSA9PT0gXCJ1bmRlZmluZWRcIiApe1xuICAgIGlmKCBEYXRlLm5vdyApIGdsb2JhbC5wZXJmb3JtYW5jZSA9IHsgbm93OigpPT5EYXRlLm5vdygpIH07XG4gICAgZWxzZSBnbG9iYWwucGVyZm9ybWFuY2UgPSB7IG5vdzooKT0+KG5ldyBEYXRlKCkpLmdldFRpbWUoKSB9O1xufVxuXG5jbGFzcyBBdGNvcmUge1xuXG4gICAgY29uc3RydWN0b3IoIGRlc2MgKXtcblxuICAgICAgICBpZiggIWRlc2MgKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG5cdHRoaXMuc2xlZXBpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zcmVnID0gMDtcbiAgICAgICAgdGhpcy5wYyA9IDA7XG4gICAgICAgIHRoaXMuc3AgPSAwO1xuICAgICAgICB0aGlzLmNsb2NrID0gZGVzYy5jbG9jaztcbiAgICAgICAgdGhpcy5jb2RlYyA9IGRlc2MuY29kZWM7XG4gICAgICAgIHRoaXMuaW50ZXJydXB0TWFwID0gZGVzYy5pbnRlcnJ1cHQ7XG4gICAgICAgIHRoaXMuZXJyb3IgPSAwO1xuICAgICAgICB0aGlzLmZsYWdzID0gZGVzYy5mbGFncztcbiAgICAgICAgdGhpcy50aWNrID0gMDtcbiAgICAgICAgdGhpcy5zdGFydFRpY2sgPSAwO1xuICAgICAgICB0aGlzLmVuZFRpY2sgPSAwO1xuICAgICAgICB0aGlzLmV4ZWNUaW1lID0gMDtcbiAgICAgICAgdGhpcy50aW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cblx0dGhpcy5pOGEgPSBuZXcgSW50OEFycmF5KDQpO1xuXG4gICAgICAgIHNlbGYuQlJFQUtQT0lOVFMgPSB7IDA6MCB9O1xuICAgICAgICBzZWxmLkRVTVAgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAnUEM6ICMnKyh0aGlzLnBjPDwxKS50b1N0cmluZygxNikrXG4gICAgICAgICAgICAgICAgJ1xcblNSOiAnICsgdGhpcy5tZW1vcnlbMHg1Rl0udG9TdHJpbmcoMikrXG4gICAgICAgICAgICAgICAgJ1xcblNQOiAjJyArIHRoaXMuc3AudG9TdHJpbmcoMTYpICtcbiAgICAgICAgICAgICAgICAnXFxuJyArIFxuICAgICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCggdGhpcy5yZWcsIFxuICAgICAgICAgICAgICAgICAgICAodixpKSA9PiAnUicrKGkrJycpKycgJysoaTwxMD8nICc6JycpKyc9XFx0Iycrdi50b1N0cmluZygxNikgKyAnXFx0JyArIHYgXG4gICAgICAgICAgICAgICAgKS5qb2luKCdcXG4nKSBcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgVGhlIEkvTyBtZW1vcnkgc3BhY2UgY29udGFpbnMgNjQgYWRkcmVzc2VzIGZvciBDUFUgcGVyaXBoZXJhbCBmdW5jdGlvbnMgYXMgY29udHJvbCByZWdpc3RlcnMsIFNQSSwgYW5kIG90aGVyIEkvTyBmdW5jdGlvbnMuXG4gICAgICAgIFRoZSBJL08gbWVtb3J5IGNhbiBiZSBhY2Nlc3NlZCBkaXJlY3RseSwgb3IgYXMgdGhlIGRhdGEgc3BhY2UgbG9jYXRpb25zIGZvbGxvd2luZyB0aG9zZSBvZiB0aGUgcmVnaXN0ZXIgZmlsZSwgMHgyMCAtIDB4NUYuIEluXG4gICAgICAgIGFkZGl0aW9uLCB0aGUgQVRtZWdhMzI4UCBoYXMgZXh0ZW5kZWQgSS9PIHNwYWNlIGZyb20gMHg2MCAtIDB4RkYgaW4gU1JBTSB3aGVyZSBvbmx5IHRoZSBTVC9TVFMvU1REIGFuZFxuICAgICAgICBMRC9MRFMvTEREIGluc3RydWN0aW9ucyBjYW4gYmUgdXNlZC4gICAgICAgIFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1lbW9yeSA9IG5ldyBVaW50OEFycmF5KCBcbiAgICAgICAgICAgIDMyIC8vIHJlZ2lzdGVyIGZpbGVcbiAgICAgICAgICAgICsgKDB4RkYgLSAweDFGKSAvLyBpb1xuICAgICAgICAgICAgKyBkZXNjLnNyYW1cbiAgICAgICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmZsYXNoID0gbmV3IFVpbnQ4QXJyYXkoIGRlc2MuZmxhc2ggKTtcbiAgICAgICAgdGhpcy5lZXByb20gPSBuZXcgVWludDhBcnJheSggZGVzYy5lZXByb20gKTtcblxuICAgICAgICB0aGlzLmluaXRNYXBwaW5nKCk7XG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb24gPSBudWxsO1xuICAgICAgICB0aGlzLnBlcmlmZXJhbHMgPSB7fTtcbiAgICAgICAgdGhpcy5waW5zID0ge307XG5cbiAgICAgICAgZm9yKCB2YXIgcGVyaWZlcmFsTmFtZSBpbiBkZXNjLnBlcmlmZXJhbHMgKXtcblxuICAgICAgICAgICAgbGV0IGFkZHIsIHBlcmlmZXJhbCA9IGRlc2MucGVyaWZlcmFsc1sgcGVyaWZlcmFsTmFtZSBdO1xuICAgICAgICAgICAgbGV0IG9iaiA9IHRoaXMucGVyaWZlcmFsc1sgcGVyaWZlcmFsTmFtZSBdID0geyBjb3JlOnRoaXMgfTtcblxuICAgICAgICAgICAgZm9yKCBhZGRyIGluIHBlcmlmZXJhbC53cml0ZSApXG4gICAgICAgICAgICAgICAgdGhpcy53cml0ZU1hcFsgYWRkciBdID0gcGVyaWZlcmFsLndyaXRlWyBhZGRyIF0uYmluZCggb2JqICk7XG5cbiAgICAgICAgICAgIGZvciggYWRkciBpbiBwZXJpZmVyYWwucmVhZCApXG4gICAgICAgICAgICAgICAgdGhpcy5yZWFkTWFwWyBhZGRyIF0gPSBwZXJpZmVyYWwucmVhZFsgYWRkciBdLmJpbmQoIG9iaiApO1xuXG4gICAgICAgICAgICBpZiggcGVyaWZlcmFsLnVwZGF0ZSApXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMaXN0LnB1c2goIHBlcmlmZXJhbC51cGRhdGUuYmluZCggb2JqICkgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYoIHBlcmlmZXJhbC5pbml0IClcbiAgICAgICAgICAgICAgICBwZXJpZmVyYWwuaW5pdC5jYWxsKCBvYmogKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBpbml0TWFwcGluZygpe1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyggdGhpcywge1xuICAgICAgICAgICAgd3JpdGVNYXA6eyB2YWx1ZTp7fSwgZW51bWVyYWJsZTpmYWxzZSwgd3JpdGFibGU6ZmFsc2UgfSxcbiAgICAgICAgICAgIHJlYWRNYXA6eyB2YWx1ZTp7fSwgZW51bWVyYWJsZTpmYWxzZSwgd3JpdGFibGU6ZmFsc2UgfSxcbiAgICAgICAgICAgIHVwZGF0ZUxpc3Q6eyB2YWx1ZTpbXSwgZW51bWVyYWJsZTpmYWxzZSwgd3JpdGFibGU6ZmFsc2UgfSxcbiAgICAgICAgICAgIHJlZzp7IHZhbHVlOiBuZXcgVWludDhBcnJheSggdGhpcy5tZW1vcnkuYnVmZmVyLCAwLCAweDIwICksIGVudW1lcmFibGU6ZmFsc2UgfSxcbiAgICAgICAgICAgIHdyZWc6eyB2YWx1ZTogbmV3IFVpbnQxNkFycmF5KCB0aGlzLm1lbW9yeS5idWZmZXIsIDB4MjAtOCwgNCApLCBlbnVtZXJhYmxlOiBmYWxzZSB9LFxuICAgICAgICAgICAgc3JhbTp7IHZhbHVlOiBuZXcgVWludDhBcnJheSggdGhpcy5tZW1vcnkuYnVmZmVyLCAweDEwMCApLCBlbnVtZXJhYmxlOmZhbHNlIH0sXG4gICAgICAgICAgICBpbzp7IHZhbHVlOiBuZXcgVWludDhBcnJheSggdGhpcy5tZW1vcnkuYnVmZmVyLCAweDIwLCAweEZGIC0gMHgyMCApLCBlbnVtZXJhYmxlOmZhbHNlIH0sXG4gICAgICAgICAgICBwcm9nOnsgdmFsdWU6IG5ldyBVaW50MTZBcnJheSggdGhpcy5mbGFzaC5idWZmZXIgKSwgZW51bWVyYWJsZTpmYWxzZSB9LFxuICAgICAgICAgICAgbmF0aXZlOnsgdmFsdWU6e30sIGVudW1lcmFibGU6ZmFsc2UgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmNvZGVjLmZvckVhY2goIG9wID0+e1xuICAgICAgICAgICAgaWYoIG9wLnN0ciApIHBhcnNlKCBvcCApO1xuICAgICAgICAgICAgb3AuYXJndiA9IE9iamVjdC5hc3NpZ24oe30sIG9wLmFyZ3MpIFxuICAgICAgICAgICAgb3AuYnl0ZXMgPSBvcC5ieXRlcyB8fCAyO1xuICAgICAgICAgICAgb3AuY3ljbGVzID0gb3AuY3ljbGVzIHx8IDE7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlYWQoIGFkZHIsIHBjICl7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMubWVtb3J5WyBhZGRyIF07XG5cbiAgICAgICAgdmFyIHBlcmlmZXJhbCA9IHRoaXMucmVhZE1hcFsgYWRkciBdO1xuICAgICAgICBpZiggcGVyaWZlcmFsICl7XG4gICAgICAgICAgICB2YXIgcmV0ID0gcGVyaWZlcmFsKCB2YWx1ZSApO1xuICAgICAgICAgICAgaWYoIHJldCAhPT0gdW5kZWZpbmVkICkgdmFsdWUgPSByZXQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiggISh7XG4gICAgICAgIC8vICAgICAweDVkOjEsIC8vIFN0YWNrIFBvaW50ZXIgTG93XG4gICAgICAgIC8vICAgICAweDVlOjEsIC8vIFN0YWNrIFBvaW50ZXIgSGlnaFxuICAgICAgICAvLyAgICAgMHg1ZjoxLCAvLyBzdGF0dXMgcmVnaXN0ZXJcbiAgICAgICAgLy8gICAgIDB4MjU6MSwgLy8gUE9SVEJcbiAgICAgICAgLy8gICAgIDB4MzU6MSwgLy8gVE9WMFxuICAgICAgICAvLyAgICAgMHgyMzoxLCAgLy8gUElOQlxuICAgICAgICAvLyAgICAgMHgxNEI6MSAvLyB2ZXJib3NlIFVTQVJUIHN0dWZmXG4gICAgICAgIC8vIH0pW2FkZHJdIClcbiAgICAgICAgLy8gY29uc29sZS5sb2coIFwiUkVBRDogI1wiLCBhZGRyLnRvU3RyaW5nKDE2KSApO1xuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICByZWFkQml0KCBhZGRyLCBiaXQsIHBjICl7XG5cbiAgICAgICAgLy8gaWYoICEoe1xuICAgICAgICAvLyAgICAgMHg1ZDoxLCAvLyBTdGFjayBQb2ludGVyIExvd1xuICAgICAgICAvLyAgICAgMHg1ZToxLCAvLyBTdGFjayBQb2ludGVyIEhpZ2hcbiAgICAgICAgLy8gICAgIDB4NWY6MSwgLy8gc3RhdHVzIHJlZ2lzdGVyXG4gICAgICAgIC8vICAgICAweDI1OjEsIC8vIFBPUlRCXG4gICAgICAgIC8vICAgICAweDM1OjEsIC8vIFRPVjBcbiAgICAgICAgLy8gICAgIDB4MjM6MSAgLy8gUElOQlxuICAgICAgICAvLyB9KVthZGRyXSApXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBcIlBDPVwiICsgKHBjPDwxKS50b1N0cmluZygxNikgKyBcIiBSRUFEICNcIiArIChhZGRyICE9PSB1bmRlZmluZWQgPyBhZGRyLnRvU3RyaW5nKDE2KSA6ICd1bmRlZmluZWQnKSArIFwiIEAgXCIgKyBiaXQgKTtcblxuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLm1lbW9yeVsgYWRkciBdO1xuXG4gICAgICAgIHZhciBwZXJpZmVyYWwgPSB0aGlzLnJlYWRNYXBbIGFkZHIgXTtcbiAgICAgICAgaWYoIHBlcmlmZXJhbCApe1xuICAgICAgICAgICAgdmFyIHJldCA9IHBlcmlmZXJhbCggdmFsdWUgKTtcbiAgICAgICAgICAgIGlmKCByZXQgIT09IHVuZGVmaW5lZCApIHZhbHVlID0gcmV0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICh2YWx1ZSA+Pj4gYml0KSAmIDE7XG4gICAgfVxuXG4gICAgd3JpdGUoIGFkZHIsIHZhbHVlICl7XG5cbiAgICAgICAgdmFyIHBlcmlmZXJhbCA9IHRoaXMud3JpdGVNYXBbIGFkZHIgXTtcblxuICAgICAgICBpZiggcGVyaWZlcmFsICl7XG4gICAgICAgICAgICB2YXIgcmV0ID0gcGVyaWZlcmFsKCB2YWx1ZSwgdGhpcy5tZW1vcnlbIGFkZHIgXSApO1xuICAgICAgICAgICAgaWYoIHJldCA9PT0gZmFsc2UgKSByZXR1cm47XG4gICAgICAgICAgICBpZiggcmV0ICE9PSB1bmRlZmluZWQgKSB2YWx1ZSA9IHJldDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm1lbW9yeVsgYWRkciBdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgd3JpdGVCaXQoIGFkZHIsIGJpdCwgYnZhbHVlICl7XG5cdGJ2YWx1ZSA9ICghIWJ2YWx1ZSkgfCAwO1xuXHR2YXIgdmFsdWUgPSB0aGlzLm1lbW9yeVsgYWRkciBdO1xuXHR2YWx1ZSA9ICh2YWx1ZSAmIH4oMTw8Yml0KSkgfCAoYnZhbHVlPDxiaXQpO1xuXHRcbiAgICAgICAgdmFyIHBlcmlmZXJhbCA9IHRoaXMud3JpdGVNYXBbIGFkZHIgXTtcblxuICAgICAgICBpZiggcGVyaWZlcmFsICl7XG4gICAgICAgICAgICB2YXIgcmV0ID0gcGVyaWZlcmFsKCB2YWx1ZSwgdGhpcy5tZW1vcnlbIGFkZHIgXSApO1xuICAgICAgICAgICAgaWYoIHJldCA9PT0gZmFsc2UgKSByZXR1cm47XG4gICAgICAgICAgICBpZiggcmV0ICE9PSB1bmRlZmluZWQgKSB2YWx1ZSA9IHJldDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm1lbW9yeVsgYWRkciBdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZXhlYyggdGltZSApe1xuICAgICAgICB2YXIgY3ljbGVzID0gKHRpbWUgKiB0aGlzLmNsb2NrKXwwO1xuICAgICAgICBcbiAgICAgICAgdmFyIHN0YXJ0ID0gdGhpcy50aWNrO1xuICAgICAgICB0aGlzLmVuZFRpY2sgPSB0aGlzLnN0YXJ0VGljayArIGN5Y2xlcztcbiAgICAgICAgdGhpcy5leGVjVGltZSA9IHRpbWU7XG5cdHZhciBsYXN0VXBkYXRlID0gc3RhcnQ7XG5cbiAgICAgICAgdHJ5e1xuXG5cdCAgICB3aGlsZSggdGhpcy50aWNrIDwgdGhpcy5lbmRUaWNrICl7XG5cdFx0aWYoICF0aGlzLnNsZWVwaW5nICl7XG5cblx0XHQgICAgaWYoIHRoaXMucGMgPiAweEZGRkYgKSBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZnVuYyA9IHRoaXMubmF0aXZlWyB0aGlzLnBjIF07XG5cdFx0ICAgIC8vIGlmKCAhZnVuYyApIFx0XHQgICAgY29uc29sZS5sb2coIHRoaXMucGMgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYoIGZ1bmMgKSBmdW5jLmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYoICF0aGlzLmdldEJsb2NrKCkgKVxuXHRcdFx0YnJlYWs7XG5cdFx0fWVsc2V7XG5cdFx0ICAgIHRoaXMudGljayArPSAxMDA7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKCB0aGlzLnRpY2sgPj0gdGhpcy5lbmRUaWNrIHx8IHRoaXMudGljayAtIGxhc3RVcGRhdGUgPiAxMDAwICl7XG5cdFx0ICAgIGxhc3RVcGRhdGUgPSB0aGlzLnRpY2s7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUGVyaWZlcmFscygpO1xuXHRcdH1cblxuXHQgICAgfVxuXG5cdFx0XG4gICAgICAgIH1maW5hbGx5e1xuXG5cdCAgICB0aGlzLnN0YXJ0VGljayA9IHRoaXMuZW5kVGljaztcblxuXHR9XG5cbiAgICB9XG5cbiAgICB1cGRhdGVQZXJpZmVyYWxzKCl7XG5cbiAgICAgICAgdmFyIGludGVycnVwdHNFbmFibGVkID0gdGhpcy5tZW1vcnlbMHg1Rl0gJiAoMTw8Nyk7XG5cbiAgICAgICAgdmFyIHVwZGF0ZUxpc3QgPSB0aGlzLnVwZGF0ZUxpc3Q7XG5cbiAgICAgICAgZm9yKCB2YXIgaT0wLCBsPXVwZGF0ZUxpc3QubGVuZ3RoOyBpPGw7ICsraSApe1xuXG4gICAgICAgICAgICB2YXIgcmV0ID0gdXBkYXRlTGlzdFtpXSggdGhpcy50aWNrLCBpbnRlcnJ1cHRzRW5hYmxlZCApO1xuXG4gICAgICAgICAgICBpZiggcmV0ICYmIGludGVycnVwdHNFbmFibGVkICl7XG4gICAgICAgICAgICAgICAgaW50ZXJydXB0c0VuYWJsZWQgPSAwO1xuXHRcdHRoaXMuc2xlZXBpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLmludGVycnVwdCggcmV0ICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgdXBkYXRlKCl7XG4gICAgICAgIHZhciBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgdmFyIGRlbHRhID0gbm93IC0gdGhpcy50aW1lO1xuXG4gICAgICAgIGRlbHRhID0gTWF0aC5tYXgoIDAsIE1hdGgubWluKCAzMywgZGVsdGEgKSApO1xuXG4gICAgICAgIHRoaXMuZXhlYyggZGVsdGEvMTAwMCApO1xuXG4gICAgICAgIHRoaXMudGltZSA9IG5vdztcbiAgICB9XG5cbiAgICBnZXRCbG9jaygpe1xuXG5cbiAgICAgICAgdmFyIHN0YXJ0UEMgPSB0aGlzLnBjO1xuXG4gICAgICAgIHZhciBza2lwID0gZmFsc2UsIHByZXYgPSBmYWxzZTtcbiAgICAgICAgdmFyIG5vcCA9IHtuYW1lOidOT1AnLCBjeWNsZXM6MSwgZW5kOnRydWUsIGFyZ3Y6e319O1xuICAgICAgICB2YXIgY2FjaGVMaXN0ID0gWydyZWcnLCAnd3JlZycsICdpbycsICdtZW1vcnknLCAnc3JhbScsICdmbGFzaCddXG4gICAgICAgIHZhciBjb2RlID0gJ1widXNlIHN0cmljdFwiO1xcbnZhciBzcD10aGlzLnNwLCByLCB0MSwgaThhPXRoaXMuaThhLCBTS0lQPWZhbHNlLCAnO1xuICAgICAgICBjb2RlICs9IGNhY2hlTGlzdC5tYXAoYz0+IGAke2N9ID0gdGhpcy4ke2N9YCkuam9pbignLCAnKTtcbiAgICAgICAgY29kZSArPSAnO1xcbic7XG4gICAgICAgIGNvZGUgKz0gJ3ZhciBzciA9IG1lbW9yeVsweDVGXSc7XG4gICAgICAgIGZvciggdmFyIGk9MDsgaTw4OyArK2kgKVxuICAgICAgICAgICAgY29kZSArPSBgLCBzciR7aX0gPSAoc3I+PiR7aX0pJjFgO1xuICAgICAgICBjb2RlICs9ICc7XFxuJztcblxuICAgICAgICAvLyBjb2RlICs9IFwiY29uc29sZS5sb2coJ1xcXFxuRU5URVIgQkxPQ0s6IFwiICsgKHRoaXMucGM8PDEpLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpICsgXCIgQCAnLCAodGhpcy5wYzw8MSkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkgKTtcXG5cIjtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ0NSRUFURSBCTE9DSzogJywgKHRoaXMucGM8PDEpLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpICk7XG4gICAgICAgIGNvZGUgKz0gJ3N3aXRjaCggdGhpcy5wYyApe1xcbic7XG5cbiAgICAgICAgZG97XG5cbiAgICAgICAgICAgIHZhciBpbnN0ID0gdGhpcy5pZGVudGlmeSgpO1xuICAgICAgICAgICAgaWYoICFpbnN0ICl7XG4gICAgICAgICAgICAgICAgLy8gaW5zdCA9IG5vcDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oIHRoaXMuZXJyb3IgKTtcbiAgICAgICAgICAgICAgICAoZnVuY3Rpb24oKXtkZWJ1Z2dlcjt9KSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29kZSArPSBgXFxuY2FzZSAke3RoaXMucGN9OiAvLyAjYCArICh0aGlzLnBjPDwxKS50b1N0cmluZygxNikgKyBcIjogXCIgKyBpbnN0Lm5hbWUgKyAnIFsnICsgaW5zdC5kZWNieXRlcy50b1N0cmluZygyKS5wYWRTdGFydCgxNiwgXCIwXCIpICsgJ10nICsgJ1xcbic7XG5cblxuICAgICAgICAgICAgdmFyIGNodW5rID0gYFxuICAgICAgICAgICAgICAgIHRoaXMucGMgPSAke3RoaXMucGN9O1xuICAgICAgICAgICAgICAgIGlmKCAodGhpcy50aWNrICs9ICR7aW5zdC5jeWNsZXN9KSA+PSB0aGlzLmVuZFRpY2sgKSBicmVhaztcbiAgICAgICAgICAgICAgICBgO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBCUkVBS1BPSU5UU1xuICAgICAgICAgICAgaWYoIChzZWxmLkJSRUFLUE9JTlRTICYmIHNlbGYuQlJFQUtQT0lOVFNbIHRoaXMucGM8PDEgXSkgfHwgaW5zdC5kZWJ1ZyApe1xuICAgICAgICAgICAgICAgIGNodW5rICs9IFwiY29uc29sZS5sb2coJ1BDOiAjJysodGhpcy5wYzw8MSkudG9TdHJpbmcoMTYpKydcXFxcblNSOiAnICsgbWVtb3J5WzB4NUZdLnRvU3RyaW5nKDIpICsgJ1xcXFxuU1A6ICMnICsgc3AudG9TdHJpbmcoMTYpICsgJ1xcXFxuJyArIEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCggcmVnLCAodixpKSA9PiAnUicrKGkrJycpKycgJysoaTwxMD8nICc6JycpKyc9XFxcXHQjJyt2LnRvU3RyaW5nKDE2KSArICdcXFxcdCcgKyB2ICkuam9pbignXFxcXG4nKSApO1xcblwiO1xuICAgICAgICAgICAgICAgIGNodW5rICs9ICcgIGRlYnVnZ2VyO1xcbic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBvcCA9IHRoaXMuZ2V0T3Bjb2RlSW1wbCggaW5zdCwgaW5zdC5pbXBsICk7XG4gICAgICAgICAgICB2YXIgc3JEaXJ0eSA9IG9wLnNyRGlydHk7XG4gICAgICAgICAgICB2YXIgbGluZSA9IG9wLmJlZ2luLCBlbmRsaW5lID0gb3AuZW5kO1xuICAgICAgICAgICAgaWYoIGluc3QuZmxhZ3MgKXtcbiAgICAgICAgICAgICAgICBmb3IoIHZhciBpPTAsIGw9aW5zdC5mbGFncy5sZW5ndGg7IGk8bDsgKytpICl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbGFnT3AgPSB0aGlzLmdldE9wY29kZUltcGwoIGluc3QsIHRoaXMuZmxhZ3NbaW5zdC5mbGFnc1tpXV0gKTtcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSBmbGFnT3AuYmVnaW47XG4gICAgICAgICAgICAgICAgICAgIGVuZGxpbmUgKz0gZmxhZ09wLmVuZDtcbiAgICAgICAgICAgICAgICAgICAgc3JEaXJ0eSB8PSBmbGFnT3Auc3JEaXJ0eTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCBzckRpcnR5ICl7XG4gICAgICAgICAgICAgICAgdmFyIHByZXMgPSAoKH5zckRpcnR5KT4+PjAmMHhGRikudG9TdHJpbmcoMik7XG4gICAgICAgICAgICAgICAgZW5kbGluZSArPSBgc3IgPSAoc3ImMGIke3ByZXN9KSBgO1xuICAgICAgICAgICAgICAgIGZvciggdmFyIGk9MDsgaTw4OyBpKysgKVxuICAgICAgICAgICAgICAgICAgICBpZiggc3JEaXJ0eSYoMTw8aSkgKVxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kbGluZSArPSBgIHwgKHNyJHtpfTw8JHtpfSlgO1xuICAgICAgICAgICAgICAgIGVuZGxpbmUgKz0gJztcXG5tZW1vcnlbMHg1Rl0gPSBzcjtcXG4nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjaHVuayArPSBsaW5lICsgZW5kbGluZTtcblxuICAgICAgICAgICAgaWYoIHNraXAgKVxuICAgICAgICAgICAgICAgIGNvZGUgKz0gXCIgIGlmKCAhU0tJUCApe1xcbiAgICBcIiArIGNodW5rICsgXCJcXG4gIH1cXG5TS0lQID0gZmFsc2U7XFxuXCI7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY29kZSArPSBjaHVuaztcblxuICAgICAgICAgICAgcHJldiA9IHNraXA7XG4gICAgICAgICAgICBza2lwID0gaW5zdC5za2lwO1xuXG4gICAgICAgICAgICB0aGlzLnBjICs9IGluc3QuYnl0ZXMgPj4gMTtcblxuICAgICAgICB9d2hpbGUoIHRoaXMucGMgPCB0aGlzLnByb2cubGVuZ3RoICYmICghaW5zdC5lbmQgfHwgc2tpcCB8fCBwcmV2KSApXG5cbiAgICAgICAgY29kZSArPSBgXFxudGhpcy5wYyA9ICR7dGhpcy5wY307XFxuYFxuICAgICAgICBjb2RlICs9IGBcXG5cXG59YDtcbiAgICAgICAgLy8gY29kZSArPSBjYWNoZUxpc3QubWFwKGM9PmB0aGlzLiR7Y30gPSAke2N9O2ApLmpvaW4oJ1xcbicpO1xuICAgICAgICBjb2RlICs9ICd0aGlzLnNwID0gc3A7XFxuJztcblxuICAgICAgICB2YXIgZW5kUEMgPSB0aGlzLnBjO1xuICAgICAgICB0aGlzLnBjID0gc3RhcnRQQztcblxuICAgICAgICBjb2RlID0gXCJyZXR1cm4gKGZ1bmN0aW9uIF9cIiArIChzdGFydFBDPDwxKS50b1N0cmluZygxNikgKyBcIigpe1xcblwiXG4gICAgICAgICAgICAgKyBjb2RlXG4gICAgICAgICAgICAgKyBcIn0pO1wiO1xuXG4gICAgICAgIHRyeXtcbiAgICAgICAgICAgIHZhciBmdW5jID0gKG5ldyBGdW5jdGlvbiggY29kZSApKSgpO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpPXN0YXJ0UEM7IGk8ZW5kUEM7ICsraSApXG4gICAgICAgICAgICAgICAgdGhpcy5uYXRpdmVbIGkgXSA9IGZ1bmM7XG5cbiAgICAgICAgICAgIGZ1bmMuY2FsbCggdGhpcyApO1xuICAgICAgICB9Y2F0Y2goZXgpe1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpPT57XG4gICAgICAgICAgICAgICAgZGVidWdnZXI7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmMgPSBuZXcgRnVuY3Rpb24oIGNvZGUgKTtcbiAgICAgICAgICAgICAgICBmdW5jLmNhbGwoIHRoaXMgKTtcbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIH1cblxuICAgIGlkZW50aWZ5KCl7XG5cbiAgICAgICAgLy8gaWYoIHRoaXMucGM8PDEgPT0gMHg5NjYgKSBkZWJ1Z2dlcjtcblxuICAgICAgICBsZXQgcHJvZyA9IHRoaXMucHJvZywgXG4gICAgICAgICAgICBjb2RlYyA9IHRoaXMuY29kZWMsIFxuICAgICAgICAgICAgYnl0ZXMsXG4gICAgICAgICAgICBoLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGk9MCwgXG4gICAgICAgICAgICBsID0gY29kZWMubGVuZ3RoLFxuICAgICAgICAgICAgcGMgPSB0aGlzLnBjO1xuXG4gICAgICAgIGxldCBieXRlczIsIGJ5dGVzNDtcbiAgICAgICAgYnl0ZXMyID0gcHJvZ1twY10gPj4+IDA7XG4gICAgICAgIGJ5dGVzNCA9ICgoYnl0ZXMyIDw8IDE2KSB8IChwcm9nW3BjKzFdKSkgPj4+IDA7XG5cbiAgICAgICAgbGV0IHZlcmJvc2UgPSAxO1xuXG4gICAgICAgIGZvciggOyBpPGw7ICsraSApe1xuXG4gICAgICAgICAgICB2YXIgZGVzYyA9IGNvZGVjW2ldO1xuICAgICAgICAgICAgdmFyIG9wY29kZSA9IGRlc2Mub3Bjb2RlPj4+MDtcbiAgICAgICAgICAgIHZhciBtYXNrID0gZGVzYy5tYXNrPj4+MDtcbiAgICAgICAgICAgIHZhciBzaXplID0gZGVzYy5ieXRlcztcblxuICAgICAgICAgICAgaWYoIHNpemUgPT09IDQgKXtcblxuICAgICAgICAgICAgICAgIGlmKCB2ZXJib3NlPT0yIHx8IHZlcmJvc2UgPT0gZGVzYy5uYW1lIClcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGRlc2MubmFtZSArIFwiXFxuXCIgKyBiaW4oYnl0ZXM0ICYgbWFzaywgOCo0KSArIFwiXFxuXCIgKyBiaW4ob3Bjb2RlLCA4KjQpICk7XG5cbiAgICAgICAgICAgICAgICBpZiggKGJ5dGVzNCAmIG1hc2spPj4+MCAhPT0gb3Bjb2RlIClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgYnl0ZXMgPSBieXRlczQ7XG5cbiAgICAgICAgICAgIH1lbHNle1xuXG5cbiAgICAgICAgICAgICAgICBpZiggdmVyYm9zZT09MiB8fCB2ZXJib3NlID09IGRlc2MubmFtZSApXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBkZXNjLm5hbWUgKyBcIlxcblwiICsgYmluKGJ5dGVzMiAmIG1hc2ssIDgqMikgKyBcIlxcblwiICsgYmluKG9wY29kZSwgOCoyKSApO1xuXG4gICAgICAgICAgICAgICAgaWYoIChieXRlczIgJiBtYXNrKT4+PjAgIT09IG9wY29kZSApXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGJ5dGVzID0gYnl0ZXMyO1xuXG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgdGhpcy5pbnN0cnVjdGlvbiA9IGRlc2M7XG5cbiAgICAgICAgICAgIC8vIHZhciBsb2cgPSBkZXNjLm5hbWUgKyBcIiBcIjtcblxuICAgICAgICAgICAgZm9yKCB2YXIgayBpbiBkZXNjLmFyZ3MgKXtcbiAgICAgICAgICAgICAgICBtYXNrID0gZGVzYy5hcmdzW2tdO1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgaCA9IDA7XG4gICAgICAgICAgICAgICAgaiA9IDA7XG4gICAgICAgICAgICAgICAgd2hpbGUoIG1hc2sgKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoIG1hc2smMSApe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgfD0gKChieXRlcz4+aCkmMSkgPDwgajtcbiAgICAgICAgICAgICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtYXNrID0gbWFzayA+Pj4gMTtcbiAgICAgICAgICAgICAgICAgICAgaCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZXNjLmFyZ3Zba10gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAvLyBsb2cgKz0gayArIFwiOlwiICsgdmFsdWUgKyBcIiAgXCJcbiAgICAgICAgICAgIH1cblx0ICAgIGRlc2MuZGVjYnl0ZXMgPSBieXRlcztcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGxvZyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RydWN0aW9uO1xuXG4gICAgICAgIH1cblxuXG4gICAgICAgIHRoaXMuZXJyb3IgPSBcIiNcIiArICh0aGlzLnBjPDwxKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKSArIGAgb3Bjb2RlOiBgICsgYmluKGJ5dGVzMiwgMTYpO1xuXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgfVxuXG4gICAgZ2V0IHN0YXR1c0koKXsgcmV0dXJuIHRoaXMuc3JlZyAmICgxPDw3KTsgfVxuICAgIGdldCBzdGF0dXNUKCl7IHJldHVybiB0aGlzLnNyZWcgJiAoMTw8Nik7IH1cbiAgICBnZXQgc3RhdHVzSCgpeyByZXR1cm4gdGhpcy5zcmVnICYgKDE8PDUpOyB9XG4gICAgZ2V0IHN0YXR1c1MoKXsgcmV0dXJuIHRoaXMuc3JlZyAmICgxPDw0KTsgfVxuICAgIGdldCBzdGF0dXNWKCl7IHJldHVybiB0aGlzLnNyZWcgJiAoMTw8Myk7IH1cbiAgICBnZXQgc3RhdHVzTigpeyByZXR1cm4gdGhpcy5zcmVnICYgKDE8PDIpOyB9XG4gICAgZ2V0IHN0YXR1c1ooKXsgcmV0dXJuIHRoaXMuc3JlZyAmICgxPDwxKTsgfVxuICAgIGdldCBzdGF0dXNDKCl7IHJldHVybiB0aGlzLnNyZWcgJiAoMTw8MCk7IH1cblxuXG4gICAgaW50ZXJydXB0KCBzb3VyY2UgKXtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIklOVEVSUlVQVCBcIiArIHNvdXJjZSk7XG5cbiAgICAgICAgbGV0IGFkZHIgPSB0aGlzLmludGVycnVwdE1hcFtzb3VyY2VdO1xuICAgICAgICB2YXIgcGMgPSB0aGlzLnBjO1xuICAgICAgICB0aGlzLm1lbW9yeVt0aGlzLnNwLS1dID0gcGM+Pjg7XG4gICAgICAgIHRoaXMubWVtb3J5W3RoaXMuc3AtLV0gPSBwYztcbiAgICAgICAgdGhpcy5tZW1vcnlbMHg1Rl0gJj0gfigxPDw3KTsgLy8gZGlzYWJsZSBpbnRlcnJ1cHRzXG4gICAgICAgIHRoaXMucGMgPSBhZGRyO1xuXG4gICAgfVxuXG4gICAgZ2V0T3Bjb2RlSW1wbCggaW5zdCwgc3RyICl7XG4gICAgICAgIHZhciBpLCBsLCBvcCA9IHtiZWdpbjpcIlwiLCBlbmQ6XCJcIiwgc3JEaXJ0eTowfTtcblxuICAgICAgICBpZiggQXJyYXkuaXNBcnJheShzdHIpICl7XG4gICAgICAgICAgICBmb3IoIGkgPSAwLCBsPXN0ci5sZW5ndGg7IGk8bDsgKytpICl7XG4gICAgICAgICAgICAgICAgdmFyIHRtcCA9IHRoaXMuZ2V0T3Bjb2RlSW1wbCggaW5zdCwgc3RyW2ldICk7XG4gICAgICAgICAgICAgICAgb3AuYmVnaW4gKz0gdG1wLmJlZ2luICsgXCJcXG5cIjtcbiAgICAgICAgICAgICAgICBvcC5lbmQgKz0gdG1wLmVuZCArIFwiXFxuXCI7XG4gICAgICAgICAgICAgICAgb3Auc3JEaXJ0eSB8PSB0bXAuc3JEaXJ0eTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvcDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzcmMgPSBzdHIsIGFyZ3YgPSBpbnN0LmFyZ3Y7XG5cbiAgICAgICAgZm9yKCB2YXIgayBpbiBhcmd2IClcbiAgICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdChrLnRvTG93ZXJDYXNlKCkpLmpvaW4oYXJndltrXSk7XG5cbiAgICAgICAgdmFyIFNSU3luYyA9IFwiXCIsIFNSRGlydHkgPSAwO1xuXG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUkAoWzAtOV0rKVxccyrihpBcXHMqMTs/XFxzKiQvZywgKG0sIGJpdCwgYXNzaWduKT0+e1xuICAgICAgICAgICAgU1JEaXJ0eSB8PSAxIDw8IGJpdDtcbiAgICAgICAgICAgIHJldHVybiBgc3Ike2JpdH0gPSAxO1xcbmA7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvU1JAKFswLTldKylcXHMq4oaQXFxzKjA7P1xccyokL2csIChtLCBiaXQsIGFzc2lnbik9PntcbiAgICAgICAgICAgIFNSRGlydHkgfD0gMSA8PCBiaXQ7XG4gICAgICAgICAgICByZXR1cm4gYHNyJHtiaXR9ID0gMDtcXG5gO1xuICAgICAgICB9KTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1NSKFswLTldKylcXHMqPSguKikvZywgKG0sIGJpdCwgYXNzaWduKT0+e1xuICAgICAgICAgICAgU1JEaXJ0eSB8PSAxIDw8IGJpdDtcbiAgICAgICAgICAgIHJldHVybiBgc3Ike2JpdH0gPSAke2Fzc2lnbn07XFxuYDtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUlxccyrihpAvZywgKCkgPT4ge1xuICAgICAgICAgICAgU1JTeW5jID0gJ21lbW9yeVsweDVGXSA9IHNyOyBzcjA9c3ImMTsgc3IxPShzcj4+MSkmMTsgc3IyPShzcj4+MikmMTsgc3IzPShzcj4+MykmMTsgc3I0PShzcj4+NCkmMTsgc3I1PShzcj4+NSkmMTsgc3I2PShzcj4+NikmMTsgc3I3PShzcj4+NykmMTsnO1xuICAgICAgICAgICAgcmV0dXJuICdzciA9JztcbiAgICAgICAgfSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUkAoWzAtOV0rKVxccyrihpAoLiopJC9nLCAobSwgYml0LCBhc3NpZ24pPT57XG4gICAgICAgICAgICBTUkRpcnR5IHw9IDEgPDwgYml0O1xuICAgICAgICAgICAgcmV0dXJuIGBzciR7Yml0fSA9ICghISgke2Fzc2lnbn0pKXwwO2A7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvU1JcXHMqwq8vZywgJyh+c3IpJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUkAoWzAtOV0rKVxccyrCry9nLCAnKH5zciQxKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1NSQChbMC05XSspXFxzKi9nLCAnKHNyJDEpICcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvU1IvZywgJ3NyJyk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1dSKFswLTldKylcXHMq4oaQL2csICdyID0gd3JlZ1skMV0gPScpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvV1IoWzAtOV0rKUAoWzAtOV0rKVxccyrihpAoLiopJC9nLCAobSwgbnVtLCBiaXQsIGFzc2lnbik9PmByID0gd3JlZ1ske251bX1dID0gKHdyZWdbJHtudW19XSAmIH4oMTw8JHtiaXR9KSkgfCAoKCghISgke2Fzc2lnbn0pKXwwKTw8JHtiaXR9KTtgKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1dSKFswLTldKylcXHMqwq8vZywgJyh+d3JlZ1skMV0pICcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvV1IoWzAtOV0rKUAoWzAtOV0rKVxccyrCry9nLCAnKH4od3JlZ1skMV0+Pj4kMikmMSkgJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9XUihbMC05XSspQChbMC05XSspXFxzKi9nLCAnKCh3cmVnWyQxXT4+PiQyKSYxKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1dSKFswLTldKykvZywgJ3dyZWdbJDFdJyk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1IoWzAtOTxdKykoXFwrWzAtOV0rKT9cXHMq4oaQL2csIChtLCBudW0sIG51bWFkZCkgPT57IFxuICAgICAgICAgICAgbnVtYWRkID0gbnVtYWRkIHx8IFwiXCI7XG4gICAgICAgICAgICBvcC5lbmQgKz0gYHJlZ1soJHtudW19KSR7bnVtYWRkfV0gPSByO1xcbmA7IFxuICAgICAgICAgICAgcmV0dXJuICdyID0gJzsgXG4gICAgICAgIH0pO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUihbMC05PF0rKShcXCtbMC05XSspP0AoWzAtOV0rKVxccyrihpAoLiopJC9nLCAobSwgbnVtLCBudW1hZGQsIGJpdCwgYXNzaWduKT0+e1xuICAgICAgICAgICAgbnVtYWRkID0gbnVtYWRkIHx8IFwiXCI7XG4gICAgICAgICAgICBvcC5lbmQgKz0gYHJlZ1soJHtudW19KSR7bnVtYWRkfV0gPSByO1xcbmBcbiAgICAgICAgICAgIHJldHVybiBgciA9IChyZWdbKCR7bnVtfSkke251bWFkZH1dICYgfigxPDwke2JpdH0pKSB8ICgoKCEhKCR7YXNzaWdufSkpfDApPDwke2JpdH0pO2A7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9SKFswLTk8XSspKFxcK1swLTldKyk/XFxzKj1cXHMrL2csIChtLCBudW0sIG51bWFkZCkgPT57IFxuICAgICAgICAgICAgbnVtYWRkID0gbnVtYWRkIHx8IFwiXCI7XG4gICAgICAgICAgICByZXR1cm4gYHIgPSByZWdbKCR7bnVtfSkke251bWFkZH1dID0gYDsgXG4gICAgICAgIH0pO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUihbMC05PF0rKShcXCtbMC05XSspP0AoWzAtOV0rKVxccyo9XFxzKyguKikkL2csIChtLCBudW0sIG51bWFkZCwgYml0LCBhc3NpZ24pPT57XG4gICAgICAgICAgICBudW1hZGQgPSBudW1hZGQgfHwgXCJcIjtcbiAgICAgICAgICAgIHJldHVybiBgciA9IHJlZ1soJHtudW19KSR7bnVtYWRkfV0gPSAocmVnWygke251bX0pJHtudW1hZGR9XSAmIH4oMTw8JHtiaXR9KSkgfCAoKCghISgke2Fzc2lnbn0pKXwwKTw8JHtiaXR9KTtgO1xuICAgICAgICB9KTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUihbMC05PF0rKShcXCtbMC05XSspP1xccyrCry9nLCAnKH5yZWdbKCQxKSQyXSkgJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9SKFswLTk8XSspKFxcK1swLTldKyk/QChbMC05XSspXFxzKsKvL2csICcofihyZWdbKCQxKSQyXT4+PiQzKSYxKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1IoWzAtOTxdKykoXFwrWzAtOV0rKT9AKFswLTldKylcXHMqL2csICcoKHJlZ1soJDEpJDJdPj4+JDMpJjEpICcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUihbMC05PF0rKShcXCtbMC05XSspPy9nLCAnKHJlZ1soJDEpJDJdPj4+MCknKTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUkAoWzAtOV0rKVxccyrCry9nLCAnKH4ocj4+PiQxKSYxKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1JAKFswLTldKylcXHMqL2csICcoKHI+Pj4kMSkmMSkgJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9JXFwvTy9nLCAnaW8nKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1IvZywgJ3InKTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvRkxBU0hcXCgoW1hZWl0pXFwpXFxzKuKGkCguKik7PyQvZywgKG0sIG4sIHYpID0+ICdmbGFzaFsgd3JlZ1snICsgKG4uY2hhckNvZGVBdCgwKS04NykgKyAnXSBdID0gJyArIHYgKyAnOycpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvRkxBU0hcXCgoW1hZWl0pXFwpL2csIChtLCBuKSA9PiAnZmxhc2hbIHdyZWdbJyArIChuLmNoYXJDb2RlQXQoMCktODcpICsgJ10gXScpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvXFwoKFtYWVpdKShcXCtbMC05XSspP1xcKVxccyrihpAoLiopOz8kL2csIChtLCBuLCBvZmYsIHYpID0+ICd0aGlzLndyaXRlKCB3cmVnWycgKyAobi5jaGFyQ29kZUF0KDApLTg3KSArICddJyArIChvZmZ8fCcnKSArICcsICcgKyB2ICsgJyk7Jyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9cXCgoW1hZWl0pKFxcK1swLTldKyk/XFwpL2csIChtLCBuLCBvZmYpID0+ICd0aGlzLnJlYWQoIHdyZWdbJyArIChuLmNoYXJDb2RlQXQoMCktODcpICsgJ10nICsgKG9mZnx8JycpICsgJywgdGhpcy5wYyApJyk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcKFNUQUNLXFwpXFxzKuKGkC9nLCAobSwgbikgPT4gJ21lbW9yeVtzcC0tXSA9Jyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9cXCgoU1RBQ0spXFwpL2csIChtLCBuKSA9PiAnbWVtb3J5Wysrc3BdJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9cXChTVEFDSzJcXClcXHMq4oaQKC4qKS9nLCAndDEgPSAkMTtcXG5tZW1vcnlbc3AtLV0gPSB0MT4+ODtcXG5tZW1vcnlbc3AtLV0gPSB0MTtcXG4nKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcKChTVEFDSzIpXFwpL2csICcobWVtb3J5Wysrc3BdICsgKG1lbW9yeVsrK3NwXTw8OCkpJyk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL+KKlS9nLCAnXicpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgv4oCiL2csICcmJyk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL2lvXFxbKFswLTldKylcXF1cXHMq4oaQKC4qPyk7PyQvZywgJ3RoaXMud3JpdGUoIDMyKyQxLCAkMiApJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9pb1xcWyhbMC05XSspQChbMC05XSspXFxdXFxzKuKGkCguKj8pOz8kL2csICd0aGlzLndyaXRlQml0KCAzMiskMSwgJDIsICQzICknKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL2lvXFxbKFswLTkrPF0rKUAoWzAtOV0rKVxcXS9nLCAndGhpcy5yZWFkQml0KCAzMiskMSwgJDIsIHRoaXMucGMgKScpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvaW9cXFsoWzAtOSs8XSspXFxdL2csICd0aGlzLnJlYWQoIDMyKyQxLCB0aGlzLnBjICknKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1NQL2csICdzcCcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUENcXHMq4oaQKC4qKSQvZywgJ3QxID0gJDE7XFxuaWYoICF0MSApIChmdW5jdGlvbigpe2RlYnVnZ2VyO30pKCk7IHRoaXMucGMgPSB0MTsgYnJlYWs7XFxuJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9QQy9nLCAndGhpcy5wYycpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgv4oaQL2csICc9Jyk7XG5cblxuICAgICAgICBzdHIgPSAnLy8gJyArIHNyYy5yZXBsYWNlKC9bXFxuXFxyXStcXHMqL2csICdcXG5cXHQvLyAnKSArIFwiXFxuXCIgKyBzdHIgKyBcIlxcblwiO1xuICAgICAgICBcbiAgICAgICAgb3Auc3JEaXJ0eSA9IFNSRGlydHk7XG5cbiAgICAgICAgb3AuYmVnaW4gPSBzdHI7XG4gICAgICAgIG9wLmVuZCArPSBTUlN5bmM7XG5cbiAgICAgICAgcmV0dXJuIG9wO1xuICAgIH1cblxuICAgIHN0YXRpYyBBVG1lZ2EzMjhQKCl7XG5cbiAgICAgICAgbGV0IGNvcmUgPSBuZXcgQXRjb3JlKHtcbiAgICAgICAgICAgIGZsYXNoOiAzMiAqIDEwMjQsXG4gICAgICAgICAgICBlZXByb206IDEgKiAxMDI0LFxuICAgICAgICAgICAgc3JhbTogMiAqIDEwMjQsXG4gICAgICAgICAgICBjb2RlYzogQXRDT0RFQyxcbiAgICAgICAgICAgIGZsYWdzOiBBdEZsYWdzLFxuICAgICAgICAgICAgY2xvY2s6IDE2ICogMTAwMCAqIDEwMDAsIC8vIHNwZWVkIGluIGtIelxuICAgICAgICAgICAgcGVyaWZlcmFsczpyZXF1aXJlKCcuL0F0MzI4UC1wZXJpZmVyYWxzLmpzJyksXG4gICAgICAgICAgICBpbnRlcnJ1cHQ6e1xuICAgICAgICAgICAgICAgIFJFU0VUOiAweDAwMDAsICAvLyAgRXh0ZXJuYWwgcGluLCBwb3dlci1vbiByZXNldCwgYnJvd24tb3V0IHJlc2V0IGFuZCB3YXRjaGRvZyBzeXN0ZW0gcmVzZXRcbiAgICAgICAgICAgICAgICBJTlQwOiAweDAwMiAsICAvLyAgRXh0ZXJuYWwgaW50ZXJydXB0IHJlcXVlc3QgMFxuICAgICAgICAgICAgICAgIElOVDE6IDB4MDAwNCwgIC8vICBFeHRlcm5hbCBpbnRlcnJ1cHQgcmVxdWVzdCAxXG4gICAgICAgICAgICAgICAgUENJTlQwOiAweDAwMDYsICAvLyAgUGluIGNoYW5nZSBpbnRlcnJ1cHQgcmVxdWVzdCAwXG4gICAgICAgICAgICAgICAgUENJTlQxOiAweDAwMDgsICAvLyAgUGluIGNoYW5nZSBpbnRlcnJ1cHQgcmVxdWVzdCAxXG4gICAgICAgICAgICAgICAgUENJTlQyOiAweDAwMEEsICAvLyAgUGluIGNoYW5nZSBpbnRlcnJ1cHQgcmVxdWVzdCAyXG4gICAgICAgICAgICAgICAgV0RUOiAweDAwMEMsICAvLyAgV2F0Y2hkb2cgdGltZS1vdXQgaW50ZXJydXB0XG4gICAgICAgICAgICAgICAgVElNRVIyQTogMHgwMDBFLCAgLy8gIENPTVBBIFRpbWVyL0NvdW50ZXIyIGNvbXBhcmUgbWF0Y2ggQVxuICAgICAgICAgICAgICAgIFRJTUVSMkI6IDB4MDAxMCwgIC8vICBDT01QQiBUaW1lci9Db3VudGVyMiBjb21wYXJlIG1hdGNoIEJcbiAgICAgICAgICAgICAgICBUSU1FUjJPOiAweDAwMTIsICAvLyAgT1ZGIFRpbWVyL0NvdW50ZXIyIG92ZXJmbG93XG4gICAgICAgICAgICAgICAgVElNRVIxQzogMHgwMDE0LCAgLy8gIENBUFQgVGltZXIvQ291bnRlcjEgY2FwdHVyZSBldmVudFxuICAgICAgICAgICAgICAgIFRJTUVSMUE6IDB4MDAxNiwgIC8vICBDT01QQSBUaW1lci9Db3VudGVyMSBjb21wYXJlIG1hdGNoIEFcbiAgICAgICAgICAgICAgICBUSU1FUjFCOiAweDAwMTgsICAvLyAgQ09NUEIgVGltZXIvQ291bnRlcjEgY29tcGFyZSBtYXRjaCBCXG4gICAgICAgICAgICAgICAgVElNRVIxTzogMHgwMDFBLCAgLy8gIE9WRiBUaW1lci9Db3VudGVyMSBvdmVyZmxvd1xuICAgICAgICAgICAgICAgIFRJTUVSMEE6IDB4MDAxQywgIC8vICBDT01QQSBUaW1lci9Db3VudGVyMCBjb21wYXJlIG1hdGNoIEFcbiAgICAgICAgICAgICAgICBUSU1FUjBCOiAweDAwMUUsICAvLyAgQ09NUEIgVGltZXIvQ291bnRlcjAgY29tcGFyZSBtYXRjaCBCXG4gICAgICAgICAgICAgICAgVElNRVIwTzogMHgwMDIwLCAgLy8gIE9WRiBUaW1lci9Db3VudGVyMCBvdmVyZmxvd1xuICAgICAgICAgICAgICAgIFNQSTogMHgwMDIyLCAgLy8gLCBTVEMgU1BJIHNlcmlhbCB0cmFuc2ZlciBjb21wbGV0ZVxuICAgICAgICAgICAgICAgIFVTQVJUUlg6IDB4MDAyNCwgIC8vICwgUlggVVNBUlQgUnggY29tcGxldGVcbiAgICAgICAgICAgICAgICBVU0FSVEU6IDB4MDAyNiwgIC8vICwgVURSRSBVU0FSVCwgZGF0YSByZWdpc3RlciBlbXB0eVxuICAgICAgICAgICAgICAgIFVTQVJUVFg6IDB4MDAyOCwgIC8vICwgVFggVVNBUlQsIFR4IGNvbXBsZXRlXG4gICAgICAgICAgICAgICAgQURDOiAweDAwMkEsICAvLyAgQURDIGNvbnZlcnNpb24gY29tcGxldGVcbiAgICAgICAgICAgICAgICBFRVJFQURZOiAweDAwMkMsICAvLyAgUkVBRFkgRUVQUk9NIHJlYWR5XG4gICAgICAgICAgICAgICAgQU5BTE9HOiAweDAwMkUsICAvLyAgQ09NUCBBbmFsb2cgY29tcGFyYXRvclxuICAgICAgICAgICAgICAgIFRXSTogMHgwMDMwLCAgLy8gIDItd2lyZSBzZXJpYWwgaW50ZXJmYWNlXG4gICAgICAgICAgICAgICAgU1BNOiAweDAwMzIgIC8vICBSRUFEWSBTdG9yZSBwcm9ncmFtIG1lbW9yeSByZWFkeSAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGNvcmU7XG5cbiAgICB9XG5cbiAgICBzdGF0aWMgQVRtZWdhMzJ1NCgpe1xuXG5cdGxldCBjb3JlID0gbmV3IEF0Y29yZSh7XG4gICAgICAgICAgICBmbGFzaDogMzIgKiAxMDI0LFxuICAgICAgICAgICAgZWVwcm9tOiAxICogMTAyNCxcbiAgICAgICAgICAgIHNyYW06IDIgKiAxMDI0ICsgNTEyLFxuICAgICAgICAgICAgY29kZWM6IEF0Q09ERUMsXG4gICAgICAgICAgICBmbGFnczogQXRGbGFncyxcbiAgICAgICAgICAgIGNsb2NrOiAxNiAqIDEwMDAgKiAxMDAwLCAvLyBzcGVlZCBpbiBrSHpcbiAgICAgICAgICAgIHBlcmlmZXJhbHM6cmVxdWlyZSgnLi9BdDMydTQtcGVyaWZlcmFscy5qcycpLFxuICAgICAgICAgICAgaW50ZXJydXB0Ontcblx0XHRSRVNFVDogMHgwMDAwLCAgLy8gIEV4dGVybmFsIHBpbiwgcG93ZXItb24gcmVzZXQsIGJyb3duLW91dCByZXNldCBhbmQgd2F0Y2hkb2cgc3lzdGVtIHJlc2V0XG5cdFx0SU5UMDogMHgwMDIgLCAgLy8gIEV4dGVybmFsIGludGVycnVwdCByZXF1ZXN0IDBcblx0XHRJTlQxOiAweDAwMDQsICAvLyAgRXh0ZXJuYWwgaW50ZXJydXB0IHJlcXVlc3QgMVxuXHRcdElOVDI6IDB4MDAwNiwgIC8vICBFeHRlcm5hbCBpbnRlcnJ1cHQgcmVxdWVzdCAyXG5cdFx0SU5UMzogMHgwMDA4LCAgLy8gIEV4dGVybmFsIGludGVycnVwdCByZXF1ZXN0IDNcblx0XHRSRVNFUlZFRDA6IDB4MDAwQSxcblx0XHRSRVNFUlZFRDE6IDB4MDAwQyxcblx0XHRJTlQ2OiAweDAwMEUsICAgIC8vICBFeHRlcm5hbCBpbnRlcnJ1cHQgcmVxdWVzdCA2XG5cdFx0UENJTlQwOiAweDAwMTIsICAvLyAgUGluIGNoYW5nZSBpbnRlcnJ1cHQgcmVxdWVzdCAwXG5cdFx0VVNCR0VOOiAweDAwMTQsICAvLyBVU0IgR2VuZXJhbCBJbnRlcnJ1cHQgcmVxdWVzdFxuXHRcdFVTQkVORDogMHgwMDE2LCAgLy8gVVNCIEVuZHBvaW50IEludGVycnVwdCByZXF1ZXN0XG5cdFx0V0RUOiAweDAwMTgsICAgICAvLyAgV2F0Y2hkb2cgdGltZS1vdXQgaW50ZXJydXB0XG5cdFx0XG5cdFx0VElNRVIxQzogMHgwMDIwLCAgLy8gIENBUFQgVGltZXIvQ291bnRlcjEgY2FwdHVyZSBldmVudFxuXHRcdFRJTUVSMUE6IDB4MDAyMiwgIC8vICBDT01QQSBUaW1lci9Db3VudGVyMSBjb21wYXJlIG1hdGNoIEFcblx0XHRUSU1FUjFCOiAweDAwMjQsICAvLyAgQ09NUEIgVGltZXIvQ291bnRlcjEgY29tcGFyZSBtYXRjaCBCXG5cdFx0VElNRVIxQzogMHgwMDI2LCAgLy8gIENPTVBDIFRpbWVyL0NvdW50ZXIxIGNvbXBhcmUgbWF0Y2ggQ1xuXHRcdFRJTUVSMU86IDB4MDAyOCwgIC8vICBPVkYgVGltZXIvQ291bnRlcjEgb3ZlcmZsb3dcblx0XHRUSU1FUjBBOiAweDAwMkEsICAvLyAgQ09NUEEgVGltZXIvQ291bnRlcjAgY29tcGFyZSBtYXRjaCBBXG5cdFx0VElNRVIwQjogMHgwMDJDLCAgLy8gIENPTVBCIFRpbWVyL0NvdW50ZXIwIGNvbXBhcmUgbWF0Y2ggQlxuXHRcdFRJTUVSME86IDB4MDAyRSwgIC8vICBPVkYgVGltZXIvQ291bnRlcjAgb3ZlcmZsb3dcblx0XHRcblx0XHRTUEk6IDB4MDAzMCwgIC8vICwgU1RDIFNQSSBzZXJpYWwgdHJhbnNmZXIgY29tcGxldGVcblx0XHRcblx0XHRVU0FSVFJYOiAweDAwMzIsICAvLyAsIFJYIFVTQVJUIFJ4IGNvbXBsZXRlXG5cdFx0VVNBUlRFOiAweDAwMzQsICAvLyAsIFVEUkUgVVNBUlQsIGRhdGEgcmVnaXN0ZXIgZW1wdHlcblx0XHRVU0FSVFRYOiAweDAwMzYsICAvLyAsIFRYIFVTQVJULCBUeCBjb21wbGV0ZVxuXG5cdFx0QU5BTE9HOiAweDAwMzgsIC8vIEFuYWxvZyBDb21wYXJhdG9yXG5cdFx0QURDOiAweDAwM0EsICAvLyAgQURDIGNvbnZlcnNpb24gY29tcGxldGVcblx0XHRcblx0XHRFRVJFQURZOiAweDAwM0MsICAvLyAgRUVQUk9NIHJlYWR5XG5cblx0XHRUSU1FUjNDOiAweDAwM0UsICAvLyAgQ0FQVCBUaW1lci9Db3VudGVyMSBjYXB0dXJlIGV2ZW50XG5cdFx0VElNRVIzQTogMHgwMDQwLCAgLy8gIENPTVBBIFRpbWVyL0NvdW50ZXIxIGNvbXBhcmUgbWF0Y2ggQVxuXHRcdFRJTUVSM0I6IDB4MDA0MiwgIC8vICBDT01QQiBUaW1lci9Db3VudGVyMSBjb21wYXJlIG1hdGNoIEJcblx0XHRUSU1FUjNDOiAweDAwNDQsICAvLyAgQ09NUEMgVGltZXIvQ291bnRlcjEgY29tcGFyZSBtYXRjaCBDXG5cdFx0VElNRVIzTzogMHgwMDQ2LCAgLy8gIE9WRiBUaW1lci9Db3VudGVyMSBvdmVyZmxvd1xuXHRcdFxuXHRcdFxuXHRcdFRXSTogMHgwMDQ4LCAgLy8gIDItd2lyZSBzZXJpYWwgaW50ZXJmYWNlXG5cdFx0XG5cdFx0U1BNOiAweDAwNEEsICAvLyAgUkVBRFkgU3RvcmUgcHJvZ3JhbSBtZW1vcnkgcmVhZHlcblx0XHRcblx0XHRUSU1FUjRBOiAweDAwNEMsXG5cdFx0VElNRVI0QjogMHgwMDRFLFxuXHRcdFRJTUVSNEQ6IDB4MDA1MCxcblx0XHRUSU1FUjRPOiAweDAwNTIsXG5cdFx0VElNRVI0RlBGOiAweDAwNTRcbiAgICAgICAgICAgIH1cblx0fSk7XG5cblx0cmV0dXJuIGNvcmU7XG5cbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gcGFyc2UoIG91dCApe1xuICAgIHZhciBvcGNvZGUgPSAwO1xuICAgIHZhciBtYXNrID0gMDtcbiAgICB2YXIgYXJncyA9IHt9O1xuXG4gICAgdmFyIHN0ciA9IG91dC5zdHIsIGw9c3RyLmxlbmd0aDtcbiAgICBmb3IoIHZhciBpPTA7IGk8bDsgKytpICl7XG4gICAgICAgIHZhciBjaHIgPSBzdHJbaV07XG4gICAgICAgIHZhciBiaXQgPSAobC1pLTEpPj4+MDtcbiAgICAgICAgaWYoIGNociA9PSAnMCcgKXtcbiAgICAgICAgICAgIG1hc2sgfD0gMTw8Yml0O1xuICAgICAgICB9ZWxzZSBpZiggY2hyID09ICcxJyApe1xuICAgICAgICAgICAgbWFzayB8PSAxPDxiaXQ7XG4gICAgICAgICAgICBvcGNvZGUgfD0gMTw8Yml0OyAgICAgICAgICAgIFxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGlmKCAhKGNociBpbiBhcmdzKSApXG4gICAgICAgICAgICAgICAgYXJnc1tjaHJdID0gMDtcbiAgICAgICAgICAgIGFyZ3NbY2hyXSB8PSAxPDxiaXQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvdXQub3Bjb2RlID0gb3Bjb2RlO1xuICAgIG91dC5tYXNrID0gbWFzaztcbiAgICBvdXQuYXJncyA9IGFyZ3M7XG4gICAgb3V0LmJ5dGVzID0gKGwvOCl8MDtcbn1cblxuY29uc3QgQXRDT0RFQyA9IFtcbiAgICB7XG4gICAgICAgIG5hbWU6ICdBREMnLFxuICAgICAgICBzdHI6ICcwMDAxMTFyZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogJ1JkIOKGkCBSZCArIFJyICsgU1JAMDsnLFxuICAgICAgICBmbGFnczonaHp2bnNjJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQUREJyxcbiAgICAgICAgc3RyOiAnMDAwMDExcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6ICdSZCDihpAgUmQgKyBScjsnLFxuICAgICAgICBmbGFnczonaHp2bnNjJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTVVMJyxcbiAgICAgICAgc3RyOiAnMTAwMTExcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICd0MSA9IFJkICogUnInLFxuICAgICAgICAgICAgJ1IwID0gdDEnLFxuICAgICAgICAgICAgJ1IxID0gdDEgPj4gOCcsXG4gICAgICAgICAgICAnU1IxID0gIXQxfDAnLFxuICAgICAgICAgICAgJ1NSMCA9ICh0MT4+MTUpJjEnXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOidodm5zYydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0FESVcnLFxuICAgICAgICBzdHI6ICcxMDAxMDExMEtLZGRLS0tLJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1dSZCDihpAgV1JkICsgazsnLFxuICAgICAgICBdLFxuICAgICAgICBmbGFnczonWlZOU0MnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdBTkQnLFxuICAgICAgICBzdHI6ICcwMDEwMDByZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCBSZCDigKIgUnI7JyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAwJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQU5ESScsXG4gICAgICAgIHN0cjogJzAxMTFLS0tLZGRkZEtLS0snLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQrMTYg4oaQIFJkKzE2IOKAoiBrOycsXG4gICAgICAgICAgICAnU1JAMyDihpAgMCdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0FTUicsXG4gICAgICAgIHN0cjogJzEwMDEwMTBkZGRkZDAxMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnU1JAMCDihpAgUmQg4oCiIDEnLFxuICAgICAgICAgICAgJ1JkIOKGkCBSZCA+PiAxOydcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JDTFJpJyxcbiAgICAgICAgc3RyOiAnMTAwMTAxMDAxMTExMTAwMCcsXG4gICAgICAgIGltcGw6ICdTUkA3IOKGkCAwJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkNMUnQnLFxuICAgICAgICBzdHI6ICcxMDAxMDEwMDExMTAxMDAwJyxcbiAgICAgICAgaW1wbDogJ1NSQDYg4oaQIDAnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCQ0xSaCcsXG4gICAgICAgIHN0cjogJzEwMDEwMTAwMTEwMTEwMDAnLFxuICAgICAgICBpbXBsOiAnU1JANSDihpAgMCdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JDTFJzJyxcbiAgICAgICAgc3RyOiAnMTAwMTAxMDAxMTAwMTAwMCcsXG4gICAgICAgIGltcGw6ICdTUkA0IOKGkCAwJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkNMUnYnLFxuICAgICAgICBzdHI6ICcxMDAxMDEwMDEwMTExMDAwJyxcbiAgICAgICAgaW1wbDogJ1NSQDMg4oaQIDAnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCQ0xSbicsXG4gICAgICAgIHN0cjogJzEwMDEwMTAwMTAxMDEwMDAnLFxuICAgICAgICBpbXBsOiAnU1JAMiDihpAgMCdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JDTFJ6JyxcbiAgICAgICAgc3RyOiAnMTAwMTAxMDAxMDAxMTAwMCcsXG4gICAgICAgIGltcGw6ICdTUkAxIOKGkCAwJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkNMUmMnLFxuICAgICAgICBzdHI6ICcxMDAxMDEwMDEwMDAxMDAwJyxcbiAgICAgICAgaW1wbDogJ1NSQDAg4oaQIDAnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUkNDJyxcbiAgICAgICAgc3RyOicxMTExMDFra2tra2trMDAwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCAhU1JAMCApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSQlMnLFxuICAgICAgICBzdHI6JzExMTEwMGtra2tra2tzc3MnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoIFNSQHMgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUkNTJyxcbiAgICAgICAgc3RyOicxMTExMDBra2tra2trMDAwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCBTUkAwICl7JyxcbiAgICAgICAgICAgICcgIFBDIOKGkCBQQyArIChrIDw8IDI1ID4+IDI1KSArIDE7JyxcbiAgICAgICAgICAgICd9J10sXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQlJFUScsXG4gICAgICAgIHN0cjonMTExMTAwa2tra2trazAwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdpZiggU1JAMSApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDNcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSTFQnLFxuICAgICAgICBzdHI6JzExMTEwMGtra2tra2sxMDAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoIFNSQDQgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAzXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUkdFJyxcbiAgICAgICAgc3RyOicxMTExMDFra2tra2trMTAwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCAhU1JANCApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDNcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSTkUnLFxuICAgICAgICBzdHI6JzExMTEwMWtra2tra2swMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoICFTUkAxICl7JyxcbiAgICAgICAgICAgICcgIFBDIOKGkCBQQyArIChrIDw8IDI1ID4+IDI1KSArIDE7JyxcbiAgICAgICAgICAgICd9J10sXG4gICAgICAgIGN5Y2xlczogM1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQlJQTCcsXG4gICAgICAgIHN0cjonMTExMTAxa2tra2trazAxMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdpZiggIVNSQDIgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUk1JJyxcbiAgICAgICAgc3RyOicxMTExMDBra2tra2trMDEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCBTUkAyICl7JyxcbiAgICAgICAgICAgICcgIFBDIOKGkCBQQyArIChrIDw8IDI1ID4+IDI1KSArIDE7JyxcbiAgICAgICAgICAgICd9J10sXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQlJUQycsXG4gICAgICAgIHN0cjonMTExMTAxa2tra2trazExMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdpZiggIVNSQDYgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAzXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCU1QnLFxuICAgICAgICBzdHI6JzExMTExMDFkZGRkZDBiYmInLFxuICAgICAgICBpbXBsOiAnU1I2ID0gUmRAYidcbiAgICAgICAgLy8sZGVidWc6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JMRCcsXG4gICAgICAgIHN0cjonMTExMTEwMGRkZGRkMGJiYicsXG4gICAgICAgIGltcGw6ICdSZEBiIOKGkCBTUkA2J1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQ0FMTCcsXG4gICAgICAgIHN0cjonMTAwMTAxMGtra2trMTExa2tra2tra2tra2tra2tra2snLFxuICAgICAgICBjeWNsZXM6NCxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJyhTVEFDSzIpIOKGkCBQQyArIDInLFxuICAgICAgICAgICAgJ1BDIOKGkCBrJ1xuICAgICAgICAgICAgXVxuICAgIH0sXG4gICAge1xuXHRuYW1lOiAnQ0JJJyxcblx0c3RyOiAnMTAwMTEwMDBBQUFBQWJiYicsXG5cdGltcGw6ICdJL09bYUBiXSDihpAgMDsnXG4gICAgfSwgICAgXG4gICAge1xuICAgICAgICBuYW1lOiAnQ09NJyxcbiAgICAgICAgc3RyOicxMDAxMDEwZGRkZGQwMDAwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCB+IFJkOycsXG4gICAgICAgICAgICAnU1JAMyDihpAgMCcsXG4gICAgICAgICAgICAnU1JAMCDihpAgMSdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6ICd6bnMnXG4gICAgfSxcbiAgICB7XG5cdG5hbWU6ICdGTVVMJyxcblx0c3RyOicwMDAwMDAxMTBkZGQxcnJyJyxcblx0aW1wbDpbXG5cdCAgICAndDEgPSBSZCsxNiAqIFJyKzE2IDw8IDEnLFxuICAgICAgICAgICAgJ1IwID0gdDEnLFxuICAgICAgICAgICAgJ1IxID0gdDEgPj4gOCcsXG4gICAgICAgICAgICAnU1IxID0gIXQxfDAnLFxuICAgICAgICAgICAgJ1NSMCA9ICh0MT4+MTUpJjEnXG5cdF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ05PUCcsXG4gICAgICAgIHN0cjonMDAwMDAwMDAwMDAwMDAwMCcsXG4gICAgICAgIGltcGw6JydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ05FRycsXG4gICAgICAgIHN0cjonMTAwMTAxMGRkZGRkMDAwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSZCDihpAgLSBSZDsnLFxuICAgICAgICAgICAgJ1NSMyA9IFJANyDigKIgUkA2IMKvIOKAoiBSQDUgwq8g4oCiIFJANCDCryDigKIgUkAzIMKvIOKAoiBSQDIgwq8g4oCiIFJAMSDCryDigKIgUkAwIMKvJyxcbiAgICAgICAgICAgICdTUjAgPSAoISFSKXwwJyxcbiAgICAgICAgICAgICdTUkA1IOKGkCBSQDMgfCBSZDMgwq8nXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOiAnem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQ1AnLFxuICAgICAgICBzdHI6JzAwMDEwMXJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUiA9ICgoUmQgLSBScikgPj4+IDApICYgMHhGRjsnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIChSZEAzIMKvIOKAoiBSckAzKSB8IChSckAzIOKAoiBSQDMpIHwgKFJAMyDigKIgUmRAMyDCryknLFxuICAgICAgICAgICAgJ1NSQDAg4oaQIChSZEA3IMKvIOKAoiBSckA3KSB8IChSckA3IOKAoiBSQDcpIHwgKFJANyDigKIgUmRANyDCryknLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIChSZEA3IOKAoiBSckA3IMKvIOKAoiBSQDcgwq8pICsgKFJkQDcgwq8g4oCiIFJyQDcg4oCiIFJANyknXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOiAnem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQ1BJJyxcbiAgICAgICAgc3RyOicwMDExS0tLS2RkZGRLS0tLJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1IgPSAoKFJkKzE2IC0gaykgPj4+IDApICYgMHhGRjsnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIChSZCsxNkAzIMKvIOKAoiAoKGs+PjMpJjEpKSB8ICgoKGs+PjMpJjEpIOKAoiBSQDMpIHwgKFJAMyDigKIgUmQrMTZAMyDCryknLFxuICAgICAgICAgICAgJ1NSQDAg4oaQIChSZCsxNkA3IMKvIOKAoiAoKGs+PjcpJjEpKSB8ICgoKGs+PjcpJjEpIOKAoiBSQDcpIHwgKFJANyDigKIgUmQrMTZANyDCryknLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIChSZCsxNkA3IOKAoiAoKGs+PjcpJjFeMSkg4oCiIFJANyDCrykgKyAoUmQrMTZANyDCryDigKIgKChrPj43KSYxKSDigKIgUkA3KSdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6ICd6bnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdDUEMnLFxuICAgICAgICBzdHI6JzAwMDAwMXJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUiA9IChSZCAtIFJyIC0gU1JAMCkgJiAweEZGJyxcbiAgICAgICAgICAgICdTUkA1IOKGkCAoUmRAMyDCryDigKIgUnJAMykgfCAoUnJAMyDigKIgUkAzKSB8IChSQDMg4oCiIFJkQDMgwq8pJyxcbiAgICAgICAgICAgICdTUkAwIOKGkCAoUmRANyDCryDigKIgUnJANykgfCAoUnJANyDigKIgUkA3KSB8IChSQDcg4oCiIFJkQDcgwq8pJyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAoUmRANyDigKIgUnJANyDCryDigKIgUkA3IMKvKSB8IChSZEA3IMKvIOKAoiBSckA3IOKAoiBSQDcpJyxcbiAgICAgICAgICAgICdTUkAxIOKGkCAoIVIpICYgU1JAMSdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6ICducydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0NQU0UnLFxuICAgICAgICBzdHI6ICcwMDAxMDByZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogJ1NLSVAg4oaQIFJyID09IFJkJyxcbiAgICAgICAgc2tpcDogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnREVDJyxcbiAgICAgICAgc3RyOicxMDAxMDEwZGRkZGQxMDEwJyxcbiAgICAgICAgaW1wbDpbXG4gICAgICAgICAgICAnUmQg4oaQIFJkIC0gMScsXG4gICAgICAgICAgICAnU1JAMyDihpAgUkA3IMKvIOKAoiBSQDYg4oCiIFJANSDigKIgUkA0IOKAoiBSQDMg4oCiIFJAMiDigKIgUkAxIOKAoiBSQDAnXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOiAnem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnRU9SJyxcbiAgICAgICAgc3RyOicwMDEwMDFyZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCBSZCDiipUgUnI7JyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAwJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczogJ3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0lDQUxMJyxcbiAgICAgICAgc3RyOicxMDAxMDEwMTAwMDAxMDAxJyxcbiAgICAgICAgY3ljbGVzOjMsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICcoU1RBQ0syKSDihpAgUEMgKyAyJyxcbiAgICAgICAgICAgICdQQyDihpAgV1IzJ1xuICAgICAgICAgICAgXVxuICAgICAgICAvLyBlbmQ6dHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSU5TUicsXG4gICAgICAgIHN0cjonMTAxMTAxMWRkZGRkMTExMScsXG4gICAgICAgIGltcGw6IGBSZCDihpAgU1JgLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICAgICAgLy8gZGVidWc6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0lOJyxcbiAgICAgICAgc3RyOicxMDExMEFBZGRkZGQxMTEwJyxcbiAgICAgICAgaW1wbDogYFJkIOKGkCBzcD4+PjhgLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0lOJyxcbiAgICAgICAgc3RyOicxMDExMEFBZGRkZGQxMTAxJyxcbiAgICAgICAgaW1wbDogYFJkIOKGkCBzcCYweEZGYCxcbiAgICAgICAgY3ljbGVzOiAxXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdJTicsXG4gICAgICAgIHN0cjonMTAxMTBBQWRkZGRkQUFBQScsXG4gICAgICAgIGltcGw6IGBSZCDihpAgSS9PW2FdYCxcbiAgICAgICAgY3ljbGVzOiAxXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdJTkMnLFxuICAgICAgICBzdHI6ICcxMDAxMDEwZGRkZGQwMDExJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCBSZCArIDE7JyxcbiAgICAgICAgICAgICdTUkAzIOKGkCBSQDcg4oCiIFJANiDCryDigKIgUkA1IMKvIOKAoiBSQDQgwq8g4oCiIFJAMyDCryDigKIgUkAyIMKvIOKAoiBSQDEgwq8g4oCiIFJAMCDCrydcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0lKTVAnLFxuICAgICAgICBzdHI6JzEwMDEwMTAwMDAwMDEwMDEnLFxuICAgICAgICBpbXBsOiBgUEMg4oaQIFdSM2AsXG4gICAgICAgIGN5Y2xlczogMixcbiAgICAgICAgZW5kOnRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0pNUCcsXG4gICAgICAgIHN0cjonMTAwMTAxMGtra2trMTEwa2tra2tra2tra2tra2tra2snLFxuICAgICAgICBpbXBsOiBgUEMg4oaQIGtgLFxuICAgICAgICBjeWNsZXM6IDMsXG4gICAgICAgIGVuZDp0cnVlXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMREknLFxuICAgICAgICBzdHI6JzExMTBLS0tLZGRkZEtLS0snLFxuICAgICAgICBpbXBsOidSZCsxNiDihpAgaydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEUycsXG4gICAgICAgIHN0cjonMTAwMTAwMHh4eHh4MDAwMGtra2tra2tra2tra2tra2snLFxuICAgICAgICBpbXBsOidSeCDihpAgdGhpcy5yZWFkKGspJyxcbiAgICAgICAgYnl0ZXM6IDRcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWCcsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMTEwMCcsXG4gICAgICAgIGltcGw6IGBSZCDihpAgKFgpO2AsXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERYKycsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMTEwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBSZCDihpAgKFgpO2AsXG4gICAgICAgICAgICBgV1IxICsrO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFgtJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQxMTEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYFdSMSAtLTtgLFxuICAgICAgICAgICAgYFJkIOKGkCAoWCk7YFxuICAgICAgICBdLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuXG4gICAge1xuICAgICAgICBuYW1lOiAnTERZJyxcbiAgICAgICAgc3RyOicxMDAwMDAwZGRkZGQxMDAwJyxcbiAgICAgICAgaW1wbDogYFJkIOKGkCAoWSlgLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWSsnLFxuICAgICAgICBzdHI6JzEwMDEwMDBkZGRkZDEwMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgUmQg4oaQIChZKTtgLFxuICAgICAgICAgICAgYFdSMyArKztgXG4gICAgICAgIF0sXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERZLScsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMTAxMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBXUjMgLS07YCxcbiAgICAgICAgICAgIGBSZCDihpAgKFkpO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFlRJyxcbiAgICAgICAgc3RyOicxMHEwcXEwZGRkZGQxcXFxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYFJkIOKGkCAoWStxKTtgXG4gICAgICAgIF0sXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG5cbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFonLFxuICAgICAgICBzdHI6JzEwMDAwMDBkZGRkZDAwMDAnLFxuICAgICAgICBpbXBsOiBgUmQg4oaQIChaKTtgLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWisnLFxuICAgICAgICBzdHI6JzEwMDEwMDBkZGRkZDAwMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgUmQg4oaQIChaKTtgLFxuICAgICAgICAgICAgYFdSMyArKztgXG4gICAgICAgIF0sXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERaLScsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMDAxMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBXUjMgLS07YCxcbiAgICAgICAgICAgIGBSZCDihpAgKFopO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFpRJyxcbiAgICAgICAgc3RyOicxMHEwcXEwZGRkZGQwcXFxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYFJkIOKGkCAoWitxKTtgXG4gICAgICAgIF0sXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG5cbiAgICB7XG4gICAgICAgIG5hbWU6ICdMUE1pJyxcbiAgICAgICAgc3RyOicxMDAxMDEwMTExMDAxMDAwJyxcbiAgICAgICAgaW1wbDonUjAg4oaQIEZMQVNIKFopJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTFBNaWknLFxuICAgICAgICBzdHI6JzEwMDEwMDBkZGRkZDAxMDAnLFxuICAgICAgICBpbXBsOidSZCDihpAgRkxBU0goWiknXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMUE1paWknLFxuICAgICAgICBzdHI6JzEwMDEwMDBkZGRkZDAxMDEnLFxuICAgICAgICBpbXBsOltcbiAgICAgICAgICAgICdSZCDihpAgRkxBU0goWik7JyxcbiAgICAgICAgICAgICdXUjMgKys7J1xuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMU1InLFxuICAgICAgICBzdHI6JzEwMDEwMTBkZGRkZDAxMTAnLFxuICAgICAgICAvLyBkZWJ1Zzp0cnVlLFxuICAgICAgICBpbXBsOltcbiAgICAgICAgICAgICdTUjAgPSBSZEAwJyxcbiAgICAgICAgICAgICdSZCDihpAgUmQgPj4+IDEnLFxuICAgICAgICAgICAgJ1NSMiA9IDAnLFxuICAgICAgICAgICAgJ1NSMyA9IFNSQDIgXiBTUjAnXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOid6cydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ01PVicsXG4gICAgICAgIHN0cjogJzAwMTAxMXJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQg4oaQIFJyOydcbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTU9WVycsXG4gICAgICAgIHN0cjonMDAwMDAwMDFkZGRkcnJycicsXG4gICAgICAgIGltcGw6W1xuICAgICAgICAgICAgJ1JkPDwxID0gUnI8PDEnLFxuICAgICAgICAgICAgJ1JkPDwxKzEgPSBScjw8MSsxJ1xuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG5cdG5hbWU6ICdNVUxTVScsXG5cdHN0cjonMDAwMDAwMTEwZGRkMHJycicsXG5cdGltcGw6W1xuXHQgICAgJ2k4YVswXSA9IFJkKzE2Jyxcblx0ICAgICd0MSA9IGk4YVswXSAqIFJyKzE2JyxcbiAgICAgICAgICAgICdSMCA9IHQxJyxcbiAgICAgICAgICAgICdSMSA9IHQxID4+IDgnLFxuICAgICAgICAgICAgJ1NSMSA9ICF0MXwwJyxcbiAgICAgICAgICAgICdTUjAgPSAodDE+PjE1KSYxJ1xuXHRdXG4gICAgfSxcbiAgICB7XG5cdG5hbWU6ICdNVUxTJyxcblx0c3RyOicwMDAwMDAxMGRkZGRycnJyJyxcblx0aW1wbDpbXG5cdCAgICAnaThhWzBdID0gUmQrMTYnLFxuXHQgICAgJ2k4YVsxXSA9IFJyKzE2Jyxcblx0ICAgICd0MSA9IGk4YVswXSAqIGk4YVsxXScsXG4gICAgICAgICAgICAnUjAgPSB0MScsXG4gICAgICAgICAgICAnUjEgPSB0MSA+PiA4JyxcbiAgICAgICAgICAgICdTUjEgPSAhdDF8MCcsXG4gICAgICAgICAgICAnU1IwID0gKHQxPj4xNSkmMSdcblx0XVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnT1InLFxuICAgICAgICBzdHI6ICcwMDEwMTByZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCBSZCB8IFJyOycsXG4gICAgICAgICAgICAnU1JAMyDihpAgMCdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ09SSScsXG4gICAgICAgIHN0cjogJzAxMTBLS0tLZGRkZEtLS0snLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQrMTYg4oaQIFJkKzE2IHwgazsnLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIDAnXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOid6bnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdPVVRzcicsXG4gICAgICAgIHN0cjonMTAxMTExMXJycnJyMTExMScsXG4gICAgICAgIGltcGw6ICdJL09bNjNdIOKGkCBTUiDihpAgUnInLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICB9LCAgICBcbiAgICB7XG4gICAgICAgIG5hbWU6ICdPVVRzcGgnLFxuICAgICAgICBzdHI6JzEwMTExMTFycnJycjExMTAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnSS9PWzYyXSDihpAgUnI7JyxcbiAgICAgICAgICAgICdzcCA9IChpb1s2Ml08PDgpIHwgKHNwJjB4RkYpOydcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAxXG4gICAgfSwgICAgXG4gICAge1xuICAgICAgICBuYW1lOiAnT1VUc3BsJyxcbiAgICAgICAgc3RyOicxMDExMTExcnJycnIxMTAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ0kvT1s2MV0g4oaQIFJyOycsXG4gICAgICAgICAgICAnc3AgPSAoc3AmMHhGRjAwKSB8IGlvWzYxXTsnXG4gICAgICAgIF0sXG4gICAgICAgIGN5Y2xlczogMVxuICAgIH0sICAgIFxuICAgIHtcbiAgICAgICAgbmFtZTogJ09VVCcsXG4gICAgICAgIHN0cjonMTAxMTFBQXJycnJyQUFBQScsXG4gICAgICAgIGltcGw6IGBJL09bYV0g4oaQIFJyYCxcbiAgICAgICAgY3ljbGVzOiAxXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdQVVNIJyxcbiAgICAgICAgc3RyOicxMDAxMDAxZGRkZGQxMTExJyxcbiAgICAgICAgaW1wbDonKFNUQUNLKSDihpAgUmQnLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1BPUCcsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMTExMScsXG4gICAgICAgIGltcGw6J1JkIOKGkCAoU1RBQ0spJyxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdSRVQnLFxuICAgICAgICBzdHI6JzEwMDEwMTAxMDAwMDEwMDAnLFxuICAgICAgICBjeWNsZXM6NCxcbiAgICAgICAgZW5kOnRydWUsXG4gICAgICAgIGltcGw6ICdQQyDihpAgKFNUQUNLMiknXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdSRVRJJyxcbiAgICAgICAgc3RyOicxMDAxMDEwMTAwMDExMDAwJyxcbiAgICAgICAgY3ljbGVzOjQsXG4gICAgICAgIGVuZDp0cnVlLFxuICAgICAgICBpbXBsOltcbiAgICAgICAgICAgICdtZW1vcnlbMHg1Rl0gPSAoU1IgfD0gMTw8Nyk7JyxcbiAgICAgICAgICAgICdQQyDihpAgKFNUQUNLMiknXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1JPUicsXG4gICAgICAgIHN0cjonMTAwMTAxMGRkZGRkMDExMScsXG4gICAgICAgIGltcGw6W1xuICAgICAgICAgICAgJ1NSMCA9IFJkQDAnLFxuICAgICAgICAgICAgJ1JkIOKGkCBSZCA+Pj4gMSB8IChTUjw8NyYweDgwKScsXG4gICAgICAgICAgICAnU1IyID0gUj4+NycsXG4gICAgICAgICAgICAnU1IzID0gU1JAMiBeIFNSMCdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pzJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSEFMVCcsXG4gICAgICAgIHN0cjonMTEwMDExMTExMTExMTExMScsXG4gICAgICAgIGltcGw6IGBQQyDihpAgUEMgLSAxYCxcbiAgICAgICAgZW5kOnRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1JDQUxMJyxcbiAgICAgICAgc3RyOicxMTAxa2tra2tra2tra2trJyxcbiAgICAgICAgY3ljbGVzOjMsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICcoU1RBQ0syKSDihpAgUEMgKyAxJyxcbiAgICAgICAgICAgIGBQQyDihpAgUEMgKyAoayA8PCAyMCA+PiAyMCkgKyAxYFxuICAgICAgICBdLFxuICAgICAgICBlbmQ6ZmFsc2VcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1JKTVAnLFxuICAgICAgICBzdHI6JzExMDBra2tra2tra2tra2snLFxuICAgICAgICBpbXBsOiBgUEMg4oaQIFBDICsgKGsgPDwgMjAgPj4gMjApICsgMWAsXG4gICAgICAgIGVuZDp0cnVlXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTRUMnLFxuICAgICAgICBzdHI6JzEwMDEwMTAwMDAwMDEwMDAnLFxuICAgICAgICBpbXBsOiBgU1JAMCDihpAgMWBcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NFVCcsXG4gICAgICAgIHN0cjonMTAwMTAxMDAwMTEwMTAwMCcsXG4gICAgICAgIGltcGw6IGBTUkA2IOKGkCAxYFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU0VJJyxcbiAgICAgICAgc3RyOicxMDAxMDEwMDAxMTExMDAwJyxcbiAgICAgICAgaW1wbDogYFNSQDcg4oaQIDFgXG4gICAgfSxcbiAgICB7XG5cdG5hbWU6ICdTRk1VTCcsXG5cdHN0cjonMDAwMDAwMTExZGRkMHJycicsXG5cdGltcGw6W1xuXHQgICAgJ2k4YVswXSA9IFJkKzE2Jyxcblx0ICAgICdpOGFbMV0gPSBScisxNicsXG5cdCAgICAndDEgPSBpOGFbMF0gKiBpOGFbMV0gPDwgMScsXG4gICAgICAgICAgICAnUjAgPSB0MScsXG4gICAgICAgICAgICAnUjEgPSB0MSA+PiA4JyxcbiAgICAgICAgICAgICdTUjEgPSAhdDF8MCcsXG4gICAgICAgICAgICAnU1IwID0gKHQxPj4xNSkmMSdcblx0XVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RTJyxcbiAgICAgICAgc3RyOicxMDAxMDAxZGRkZGQwMDAwa2tra2tra2tra2tra2traycsXG4gICAgICAgIGltcGw6IGB0aGlzLndyaXRlKCBrLCBSZCApYCxcbiAgICAgICAgYnl0ZXM6IDRcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NUWCcsXG4gICAgICAgIHN0cjonMTAwMTAwMXJycnJyMTEwMCcsXG4gICAgICAgIGltcGw6IGAoWCkg4oaQIFJyYFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RYKycsXG4gICAgICAgIHN0cjonMTAwMTAwMXJycnJyMTEwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGAoWCkg4oaQIFJyYCxcbiAgICAgICAgICAgIGBXUjEgKys7YFxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFgtJyxcbiAgICAgICAgc3RyOicxMDAxMDAxcnJycnIxMTEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYFdSMSAtLTtgLFxuICAgICAgICAgICAgYChYKSDihpAgUnJgXG4gICAgICAgIF1cbiAgICB9LFxuXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RZJyxcbiAgICAgICAgc3RyOicxMDAwMDAxcnJycnIxMDAwJyxcbiAgICAgICAgaW1wbDogYChZKSDihpAgUnJgXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFkrJyxcbiAgICAgICAgc3RyOicxMDAxMDAxcnJycnIxMDAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYChZKSDihpAgUnJgLFxuICAgICAgICAgICAgYFdSMSArKztgXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NUWS0nLFxuICAgICAgICBzdHI6JzEwMDEwMDFycnJycjEwMTAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgV1IxIC0tO2AsXG4gICAgICAgICAgICBgKFkpIOKGkCBScmBcbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RZUScsXG4gICAgICAgIHN0cjonMTBxMHFxMXJycnJyMXFxcScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGAoWStxKSDihpAgUnJgXG4gICAgICAgIF1cbiAgICB9LFxuXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RaJyxcbiAgICAgICAgc3RyOicxMDAwMDAxcnJycnIwMDAwJyxcbiAgICAgICAgaW1wbDogYChaKSDihpAgUnJgXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVForJyxcbiAgICAgICAgc3RyOicxMDAxMDAxcnJycnIwMDAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYChaKSDihpAgUnJgLFxuICAgICAgICAgICAgYFdSMyArKztgXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NUWi0nLFxuICAgICAgICBzdHI6JzEwMDEwMDFycnJycjAwMTAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgV1IzIC0tO2AsXG4gICAgICAgICAgICBgKFopIOKGkCBScmBcbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RaUScsXG4gICAgICAgIHN0cjonMTBxMHFxMXJycnJyMHFxcScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGAoWitxKSDihpAgUnJgXG4gICAgICAgIF1cbiAgICB9LFxuXG4gICAge1xuICAgICAgICBuYW1lOiAnU0JDJyxcbiAgICAgICAgc3RyOiAnMDAwMDEwcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSZCDihpAgKFJkIC0gUnIgLSBTUkAwKSAmIDB4RkY7JyxcbiAgICAgICAgICAgICdTUkA1IOKGkCAoUmRAMyDCryDigKIgUnJAMykgfCAoUnJAMyDigKIgUkAzKSB8IChSQDMg4oCiIFJkQDMgwq8pJyxcbiAgICAgICAgICAgICdTUkAwIOKGkCAoUmRANyDCryDigKIgUnJANykgfCAoUnJANyDigKIgUkA3KSB8IChSQDcg4oCiIFJkQDcgwq8pJyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAoUmRANyDigKIgUnJANyDCryDigKIgUkA3IMKvKSB8IChSZEA3IMKvIOKAoiBSckA3IOKAoiBSQDcpJyxcbiAgICAgICAgICAgICdTUkAxIOKGkCAoIVIpICYgU1JAMSdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J25zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1VCJyxcbiAgICAgICAgc3RyOiAnMDAwMTEwcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSZCDihpAgKFJkIC0gUnIpJjB4RkY7JyxcbiAgICAgICAgICAgICdTUkA1IOKGkCAoUmRAMyDCryDigKIgUnJAMykgfCAoUnJAMyDigKIgUkAzKSB8IChSQDMg4oCiIFJkQDMgwq8pJyxcbiAgICAgICAgICAgICdTUkAwIOKGkCAoUmRANyDCryDigKIgUnJANykgfCAoUnJANyDigKIgUkA3KSB8IChSQDcg4oCiIFJkQDcgwq8pJyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAoUmRANyDigKIgUnJANyDCryDigKIgUkA3IMKvKSB8IChSZEA3IMKvIOKAoiBSckA3IOKAoiBSQDcpJ1xuXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOid6bnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTQkNJJyxcbiAgICAgICAgc3RyOiAnMDEwMEtLS0tkZGRkS0tLSycsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSZCsxNiDihpAgKFJkKzE2IC0gayAtIFNSQDApJjB4RkY7JyxcbiAgICAgICAgICAgICdTUkA1IOKGkCAoUmQrMTZAMyDCryDigKIgKChrPj4zKSYxKSkgfCAoKChrPj4zKSYxKSDigKIgUkAzKSB8IChSQDMg4oCiIFJkKzE2QDMgwq8pJyxcbiAgICAgICAgICAgICdTUkAwIOKGkCAoUmQrMTZANyDCryDigKIgKChrPj43KSYxKSkgfCAoKChrPj43KSYxKSDigKIgUkA3KSB8IChSQDcg4oCiIFJkKzE2QDcgwq8pJyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAoUmQrMTZANyDigKIgKChrPj43KSYxXjEpIOKAoiBSQDcgwq8pIHwgKFJkKzE2QDcgwq8g4oCiICgoaz4+NykmMSkg4oCiIFJANyknLFxuICAgICAgICAgICAgJ1NSQDEg4oaQICghUikgJiBTUkAxJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonbnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVUJJJyxcbiAgICAgICAgc3RyOiAnMDEwMUtLS0tkZGRkS0tLSycsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSZCsxNiDihpAgUmQrMTYgLSBrOycsXG4gICAgICAgICAgICAnU1JANSDihpAgKFJkKzE2QDMgwq8g4oCiICgoaz4+MykmMSkpIHwgKCgoaz4+MykmMSkg4oCiIFJAMykgfCAoUkAzIOKAoiBSZCsxNkAzIMKvKScsXG4gICAgICAgICAgICAnU1JAMCDihpAgKFJkKzE2QDcgwq8g4oCiICgoaz4+NykmMSkpIHwgKCgoaz4+NykmMSkg4oCiIFJANykgfCAoUkA3IOKAoiBSZCsxNkA3IMKvKScsXG4gICAgICAgICAgICAnU1JAMyDihpAgKFJkKzE2QDcg4oCiICgoaz4+NykmMV4xKSDigKIgUkA3IMKvKSB8IChSZCsxNkA3IMKvIOKAoiAoKGs+PjcpJjEpIOKAoiBSQDcpJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonem5zJ1xuICAgIH0sXG4gICAge1xuXHRuYW1lOiAnU0JJJyxcblx0c3RyOiAnMTAwMTEwMTBBQUFBQWJiYicsXG5cdGltcGw6ICdJL09bYUBiXSDihpAgMTsnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTQklXJyxcbiAgICAgICAgc3RyOiAnMTAwMTAxMTFLS2RkS0tLSycsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdXUmQg4oaQIFdSZCAtIGs7JyxcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J1pWTlMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTQklDJyxcbiAgICAgICAgc3RyOiAnMTAwMTEwMDFBQUFBQWJiYicsXG4gICAgICAgIGltcGw6ICdTS0lQIOKGkCAhSS9PW2FAYl0nLFxuICAgICAgICBza2lwOiB0cnVlXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTQklTJyxcbiAgICAgICAgc3RyOiAnMTAwMTEwMTFBQUFBQWJiYicsXG4gICAgICAgIGltcGw6ICdTS0lQIOKGkCBJL09bYUBiXScsXG4gICAgICAgIHNraXA6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NCUkMnLFxuICAgICAgICBzdHI6ICcxMTExMTEwcnJycnIwYmJiJyxcbiAgICAgICAgLy8gZGVidWc6IHRydWUsXG4gICAgICAgIGltcGw6ICdTS0lQIOKGkCAhKFJyICYgKDE8PGIpKScsXG4gICAgICAgIHNraXA6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NCUlMnLFxuICAgICAgICBzdHI6ICcxMTExMTExcnJycnIwYmJiJyxcbiAgICAgICAgLy8gZGVidWc6IHRydWUsXG4gICAgICAgIGltcGw6ICdTS0lQIOKGkCBSciAmICgxPDxiKScsXG4gICAgICAgIHNraXA6IHRydWVcbiAgICB9LFxuICAgIHtcblx0bmFtZTogJ1NMRUVQJyxcblx0c3RyOiAnMTAwMTAxMDExMDAwMTAwMCcsXG5cdGltcGw6IFtcblx0ICAgICd0aGlzLnNsZWVwaW5nID0gdHJ1ZScsXG5cdCAgICAnUEMg4oaQIFBDICsgMSdcblx0XSxcblx0Ly8gZGVidWc6IHRydWUsXG5cdGN5Y2xlczogMFxuICAgIH0sXG4gICAge1xuXHRuYW1lOiAnU1dBUCcsXG5cdHN0cjogJzEwMDEwMTBkZGRkZDAwMTAnLFxuXHRpbXBsOltcblx0ICAgICdSZCDihpAgKFJkID4+PiA0KSB8IChSZCA8PCA0KSdcblx0ICAgIF1cbiAgICB9XG5dO1xuXG5jb25zdCBBdEZsYWdzID0ge1xuXG4gICAgaDogJ1NSQDUg4oaQIChSZEAzIOKAoiBSckAzKSArIChSckAzIOKAoiBSQDMgwq8pIHwgKFJAMyDCryDigKIgUmRAMyknLFxuICAgIEg6ICcnLFxuICAgIHo6ICdTUjEgPSAhKFImMHhGRil8MCcsXG4gICAgWjogJ1NSMSA9ICEoUiYweEZGKXwwJyxcbiAgICB2OiAnU1IzID0gKFJkQDcg4oCiIFJyQDcg4oCiIFJANyDCrykgfCAoUmRANyDCryDigKIgUnJANyDCryDigKIgUkA3KScsXG4gICAgVjogJ1NSMyA9IFdSZEAxNSDCryDigKIgUkAxNScsXG4gICAgbjogJ1NSMiA9IFJANycsXG4gICAgTjogJ1NSMiA9IFJAMTUnLFxuICAgIHM6ICdTUjQgPSBTUkAyIOKKlSBTUkAzJyxcbiAgICBTOiAnU1I0ID0gU1JAMiDiipUgU1JAMycsXG4gICAgYzogJ1NSMCA9IChSZEA3IOKAoiBSckA3KSB8IChSckA3IOKAoiBSQDcgwq8pIHwgKFJANyDCryDigKIgUmRANyknLFxuICAgIEM6ICdTUjAgPSAoUkAxNSDCryDigKIgV1JkQDE1KScsXG5cbiAgICAvKlxuICAgIEJpdCA3IOKAkyBJOiBHbG9iYWwgSW50ZXJydXB0IEVuYWJsZVxuICAgIFRoZSBnbG9iYWwgaW50ZXJydXB0IGVuYWJsZSBiaXQgbXVzdCBiZSBzZXQgZm9yIHRoZSBpbnRlcnJ1cHRzIHRvIGJlIGVuYWJsZWQuIFRoZSBpbmRpdmlkdWFsIGludGVycnVwdCBlbmFibGUgY29udHJvbCBpcyB0aGVuXG4gICAgcGVyZm9ybWVkIGluIHNlcGFyYXRlIGNvbnRyb2wgcmVnaXN0ZXJzLiBJZiB0aGUgZ2xvYmFsIGludGVycnVwdCBlbmFibGUgcmVnaXN0ZXIgaXMgY2xlYXJlZCwgbm9uZSBvZiB0aGUgaW50ZXJydXB0cyBhcmUgZW5hYmxlZFxuICAgIGluZGVwZW5kZW50IG9mIHRoZSBpbmRpdmlkdWFsIGludGVycnVwdCBlbmFibGUgc2V0dGluZ3MuIFRoZSBJLWJpdCBpcyBjbGVhcmVkIGJ5IGhhcmR3YXJlIGFmdGVyIGFuIGludGVycnVwdCBoYXMgb2NjdXJyZWQsIGFuZCBpc1xuICAgIHNldCBieSB0aGUgUkVUSSBpbnN0cnVjdGlvbiB0byBlbmFibGUgc3Vic2VxdWVudCBpbnRlcnJ1cHRzLiBUaGUgSS1iaXQgY2FuIGFsc28gYmUgc2V0IGFuZCBjbGVhcmVkIGJ5IHRoZSBhcHBsaWNhdGlvbiB3aXRoIHRoZVxuICAgIFNFSSBhbmQgQ0xJIGluc3RydWN0aW9ucywgYXMgZGVzY3JpYmVkIGluIHRoZSBpbnN0cnVjdGlvbiBzZXQgcmVmZXJlbmNlICAgIFxuICAgICovXG4gICAgU0VJKCl7XG4gICAgICAgIHRoaXMuc3JlZyB8PSAxIDw8IDc7XG4gICAgfSxcblxuICAgIENMSSgpe1xuICAgICAgICB0aGlzLnNyZWcgJj0gfigxPDw3KTtcbiAgICB9LFxuXG5cblxuICAgIC8qXG4gICAgQml0IDYg4oCTIFQ6IEJpdCBDb3B5IFN0b3JhZ2VcbiAgICBUaGUgYml0IGNvcHkgaW5zdHJ1Y3Rpb25zIEJMRCAoYml0IExvYUQpIGFuZCBCU1QgKEJpdCBTVG9yZSkgdXNlIHRoZSBULWJpdCBhcyBzb3VyY2Ugb3IgZGVzdGluYXRpb24gZm9yIHRoZSBvcGVyYXRlZCBiaXQuIEEgYml0XG4gICAgZnJvbSBhIHJlZ2lzdGVyIGluIHRoZSByZWdpc3RlciBmaWxlIGNhbiBiZSBjb3BpZWQgaW50byBUIGJ5IHRoZSBCU1QgaW5zdHJ1Y3Rpb24sIGFuZCBhIGJpdCBpbiBUIGNhbiBiZSBjb3BpZWQgaW50byBhIGJpdCBpbiBhXG4gICAgcmVnaXN0ZXIgaW4gdGhlIHJlZ2lzdGVyIGZpbGUgYnkgdGhlIEJMRCBpbnN0cnVjdGlvbi5cbiAgICAqL1xuICAgIEJMRCggUkVHLCBCSVQgKXtcbiAgICAgICAgaWYoIHRoaXMucmVnICYgKDE8PDYpICkgdGhpcy5yZWdbUkVHXSB8PSAxPDxCSVQ7XG4gICAgICAgIGVsc2UgdGhpcy5yZWdbUkVHXSAmPSB+KDE8PEJJVCk7XG4gICAgfSxcblxuICAgIEJTVCggUkVHLCBCSVQgKXtcbiAgICAgICAgbGV0IHYgPSAodGhpcy5yZWdbUkVHXSA+PiBCSVQpICYgMTtcbiAgICAgICAgaWYoIHYgKSB0aGlzLnNyZWcgfD0gMSA8PCA2O1xuICAgICAgICBlbHNlIHRoaXMuc3JlZyAmPSB+KDE8PDYpO1xuICAgIH1cblxuXG4gICAgXG59O1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBBdGNvcmU7XG4iLCJjb25zdCBIZXggPSB7XG5cbiAgICBwYXJzZVVSTCggdXJsLCBidWZmZXIsIGNiICl7XG5cbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYoICB4aHIucmVhZHlTdGF0ZSA9PT0gNCApe1xuICAgICAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICAgICAgSGV4LnBhcnNlKCB4aHIucmVzcG9uc2VUZXh0LCBidWZmZXIgKTtcbiAgICAgICAgICAgICAgICB9Y2F0Y2goZXgpe1xuICAgICAgICAgICAgICAgICAgICBjYihmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2IoIHRydWUgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgdXJsLCB0cnVlKTtcbiAgICAgICAgeGhyLnNlbmQoKTtcbiAgICAgICAgXG4gICAgfSxcblxuICAgIHBhcnNlKCBzcmMsIGJ1ZmZlciApe1xuXG4gICAgICAgIGxldCBzdGF0ZSA9IDAsIHNpemUgPSAwLCBudW0sIGJ5dGUsIG9mZnNldCwgc3VtID0gMDtcblxuICAgICAgICBmb3IoIGxldCBpPTAsIGw9c3JjLmxlbmd0aDsgaTxsOyApe1xuXG4gICAgICAgICAgICBieXRlID0gc3JjLmNoYXJDb2RlQXQoaSsrKTtcblxuICAgICAgICAgICAgaWYoIGJ5dGUgPT09IDU4ICl7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSAwO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiggYnl0ZSA+PSA2NSAmJiBieXRlIDw9IDcwICl7XG4gICAgICAgICAgICAgICAgbnVtID0gKGJ5dGUgLSA1NSkgPDwgNDtcbiAgICAgICAgICAgIH1lbHNlIGlmKCBieXRlID49IDQ4ICYmIGJ5dGUgPD0gNTcgKXtcbiAgICAgICAgICAgICAgICBudW0gPSAoYnl0ZSAtIDQ4KSA8PCA0O1xuICAgICAgICAgICAgfWVsc2UgY29udGludWU7XG5cbiAgICAgICAgICAgIHdoaWxlKCBpPGwgKXtcbiAgICAgICAgICAgICAgICBieXRlID0gc3JjLmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgICAgICAgICAgICBpZiggYnl0ZSA+PSA2NSAmJiBieXRlIDw9IDcwICl7XG4gICAgICAgICAgICAgICAgICAgIG51bSArPSBieXRlIC0gNTU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1lbHNlIGlmKCBieXRlID49IDQ4ICYmIGJ5dGUgPD0gNTcgKXtcbiAgICAgICAgICAgICAgICAgICAgbnVtICs9IGJ5dGUgLSA0ODtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfWVsc2UgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCggc3RhdGUgKXtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICBzaXplID0gbnVtO1xuICAgICAgICAgICAgICAgIHN0YXRlKys7XG4gICAgICAgICAgICAgICAgc3VtID0gbnVtO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gbnVtIDw8IDg7XG4gICAgICAgICAgICAgICAgc3RhdGUrKztcbiAgICAgICAgICAgICAgICBzdW0gKz0gbnVtO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IG51bTtcbiAgICAgICAgICAgICAgICBzdGF0ZSsrO1xuICAgICAgICAgICAgICAgIHN1bSArPSBudW07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICBpZiggbnVtID09PSAxICkgcmV0dXJuO1xuXHRcdGlmKCBudW0gPT09IDMgfHwgbnVtID09PSA1ICl7XG5cdFx0ICAgIHN0YXRlKys7XG5cdFx0fWVsc2UgaWYoIG51bSAhPT0gMCApIHRocm93ICdVbnN1cHBvcnRlZCByZWNvcmQgdHlwZTogJyArIG51bTtcbiAgICAgICAgICAgICAgICBzdGF0ZSsrO1xuICAgICAgICAgICAgICAgIHN1bSArPSBudW07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gbnVtO1xuXHQgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgIHN1bSArPSBudW07XG4gICAgICAgICAgICAgICAgaWYoICEtLXNpemUgKSBzdGF0ZSA9IDY7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgICAgICBzdW0gKz0gbnVtO1xuICAgICAgICAgICAgICAgIHN1bSA9ICgtc3VtKSAmIDB4RkY7XG4gICAgICAgICAgICAgICAgaWYoICFzdW0gKSBzdGF0ZSsrO1xuICAgICAgICAgICAgICAgIGVsc2UgdGhyb3cgKCAnQ2hlY2tzdW0gbWlzbWF0Y2g6ICcgKyBzdW0gKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyAnSWxsZWdhbCBzdGF0ZSAnICsgc3RhdGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBIZXg7XG4iLCJjbGFzcyBCVE4ge1xuICAgIHN0YXRpYyBcIkBpbmplY3RcIiA9IHtcbiAgICAgICAgcG9vbDpcInBvb2xcIlxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKCBET00gKXtcblxuXHRET00uZWxlbWVudC5jb250cm9sbGVyID0gdGhpcztcblx0RE9NLmVsZW1lbnQuZGlzcGF0Y2hFdmVudCggbmV3IEV2ZW50KFwiYWRkcGVyaWZlcmFsXCIsIHtidWJibGVzOnRydWV9KSApO1xuXHR0aGlzLm9uLmNvbm5lY3QgPSBET00uZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJwaW4tb25cIik7XG5cdHRoaXMuYWN0aXZlID0gRE9NLmVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiYWN0aXZlXCIpICE9IFwibG93XCI7XG5cdFxuXHRET00uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBcIm1vdXNlZG93blwiLCAgXyA9PiB0aGlzLm9uLnZhbHVlID0gIHRoaXMuYWN0aXZlICk7XG5cdERPTS5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwibW91c2V1cFwiLCAgICBfID0+IHRoaXMub24udmFsdWUgPSAhdGhpcy5hY3RpdmUgKTtcblx0RE9NLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggXCJ0b3VjaHN0YXJ0XCIsIF8gPT4gdGhpcy5vbi52YWx1ZSA9ICB0aGlzLmFjdGl2ZSApO1xuXHRET00uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBcInRvdWNoZW5kXCIsICAgXyA9PiB0aGlzLm9uLnZhbHVlID0gIXRoaXMuYWN0aXZlICk7XG5cblx0KERPTS5lbGVtZW50LmdldEF0dHJpYnV0ZShcImJpbmQta2V5XCIpIHx8IFwiXCIpLnNwbGl0KC9cXHMqLFxccyovKS5mb3JFYWNoKCBrID0+IHtcblx0ICAgIHRoaXNbXCJvblByZXNzXCIgKyBrXSA9IF8gPT4gdGhpcy5vbi52YWx1ZSA9IHRoaXMuYWN0aXZlO1xuXHQgICAgdGhpc1tcIm9uUmVsZWFzZVwiICsga10gPSBfID0+IHRoaXMub24udmFsdWUgPSAhdGhpcy5hY3RpdmU7XG5cdH0pO1xuXG5cdHRoaXMucG9vbC5hZGQodGhpcyk7XG5cdFxuICAgIH1cblxuICAgIHNldEFjdGl2ZVZpZXcoKXtcblx0dGhpcy5wb29sLnJlbW92ZSh0aGlzKTtcbiAgICB9XG5cbiAgICBvbiA9IHtcblx0Y29ubmVjdDogbnVsbCxcblx0aW5pdDpmdW5jdGlvbigpe1xuXHQgICAgdGhpcy5vbi52YWx1ZSA9ICF0aGlzLmFjdGl2ZTtcblx0fVxuICAgIH1cbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCVE47XG4iLCJjbGFzcyBMRUQge1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKCBET00gKXtcblx0XG5cdHRoaXMuZWwgPSBET00uZWxlbWVudDtcblx0RE9NLmVsZW1lbnQuY29udHJvbGxlciA9IHRoaXM7XG5cdERPTS5lbGVtZW50LmRpc3BhdGNoRXZlbnQoIG5ldyBFdmVudChcImFkZHBlcmlmZXJhbFwiLCB7YnViYmxlczp0cnVlfSkgKTtcblx0dGhpcy5vbi5jb25uZWN0ID0gRE9NLmVsZW1lbnQuZ2V0QXR0cmlidXRlKFwicGluLW9uXCIpO1xuXHR0aGlzLmVsLnN0eWxlLm9wYWNpdHkgPSAwO1xuXHRcbiAgICB9XG5cbiAgICBvbiA9IHtcblx0XG5cdGNvbm5lY3Q6bnVsbCxcblx0XG5cdG9uTG93VG9IaWdoKCl7XG5cdCAgICB0aGlzLmVsLnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcblx0fSxcblx0XG5cdG9uSGlnaFRvTG93KCl7XG5cdCAgICB0aGlzLmVsLnN0eWxlLm9wYWNpdHkgPSBcIjFcIjtcblx0fVxuXHRcbiAgICB9XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTEVEO1xuIiwiY2xhc3MgU0NSRUVOIHtcbiAgICBzdGF0aWMgXCJAaW5qZWN0XCIgPSB7XG5cdHBvb2w6XCJwb29sXCJcbiAgICB9XG4gICAgXG4gICAgY29uc3RydWN0b3IoIERPTSApe1xuXHRcblx0bGV0IGNhbnZhcyA9IHRoaXMuY2FudmFzID0gRE9NLnNjcmVlbjtcblx0aWYoICFjYW52YXMgKSB0aHJvdyBcIk5vIGNhbnZhcyBpbiBBcmR1Ym95IGVsZW1lbnRcIjtcblxuXHR0aGlzLnBvb2wuYWRkKHRoaXMpO1xuXHRcblx0Y2FudmFzLndpZHRoID0gMTI4O1xuXHRjYW52YXMuaGVpZ2h0ID0gNjQ7XG5cblx0dGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICB0aGlzLmN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcblx0dGhpcy5jdHgubXNJbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcblxuXHR0aGlzLmZiID0gdGhpcy5jcmVhdGVCdWZmZXIoKTtcblx0dGhpcy5mYk9OID0gdGhpcy5jcmVhdGVCdWZmZXIoKTtcblx0dGhpcy5mYk9GRiA9IHRoaXMuY3JlYXRlQnVmZmVyKCk7XG5cdHRoaXMuYWN0aXZlQnVmZmVyID0gdGhpcy5mYk9OO1xuXHR0aGlzLmRpcnR5ID0gdHJ1ZTtcblxuXHR0aGlzLmZiT04uZGF0YS5maWxsKDB4RkYpO1xuXG5cdERPTS5lbGVtZW50LmNvbnRyb2xsZXIgPSB0aGlzO1xuXHRET00uZWxlbWVudC5kaXNwYXRjaEV2ZW50KCBuZXcgRXZlbnQoXCJhZGRwZXJpZmVyYWxcIiwge2J1YmJsZXM6dHJ1ZX0pICk7XG5cdFxuXHR0aGlzLnNjay5jb25uZWN0ID0gRE9NLmVsZW1lbnQuZ2V0QXR0cmlidXRlKFwicGluLXNja1wiKTtcblx0dGhpcy5zZGEuY29ubmVjdCA9IERPTS5lbGVtZW50LmdldEF0dHJpYnV0ZShcInBpbi1zZGFcIik7XG5cdHRoaXMucmVzLmNvbm5lY3QgPSBET00uZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJwaW4tcmVzXCIpO1xuXHR0aGlzLmRjLmNvbm5lY3QgPSBET00uZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJwaW4tZGNcIik7XG5cblxuXHR0aGlzLnJlc2V0KCk7XG5cdFxuICAgIH1cblxuICAgIHNldEFjdGl2ZVZpZXcoKXtcblx0dGhpcy5wb29sLnJlbW92ZSh0aGlzKTtcbiAgICB9XG5cbiAgICBvblByZXNzS2V5Rigpe1xuXHR2YXIgZG9jRWwgPSB0aGlzLmNhbnZhczsgLy8gZG9jLmRvY3VtZW50RWxlbWVudDtcblx0XG5cdHRvZ2dsZUZ1bGxTY3JlZW4oKTtcblxuXHRyZXR1cm47XG5cblx0ZnVuY3Rpb24gaXNGdWxsU2NyZWVuKCl7XG5cdFx0dmFyIGRvYyA9IHdpbmRvdy5kb2N1bWVudDtcblx0XHRyZXR1cm4gZG9jLmZ1bGxzY3JlZW5FbGVtZW50IHx8IGRvYy5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fCBkb2Mud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgfHwgZG9jLm1zRnVsbHNjcmVlbkVsZW1lbnQgfHwgZmFsc2U7XG5cdH1cblxuXHRmdW5jdGlvbiB0b2dnbGVGdWxsU2NyZWVuKHRvZ2dsZSkge1xuXHRcdHZhciBkb2MgPSB3aW5kb3cuZG9jdW1lbnQ7XG5cdCAgICAgICAgXG5cblx0XHR2YXIgcmVxdWVzdEZ1bGxTY3JlZW4gPSBkb2NFbC5yZXF1ZXN0RnVsbHNjcmVlbiB8fCBkb2NFbC5tb3pSZXF1ZXN0RnVsbFNjcmVlbiB8fCBkb2NFbC53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbiB8fCBkb2NFbC5tc1JlcXVlc3RGdWxsc2NyZWVuO1xuXHRcdHZhciBjYW5jZWxGdWxsU2NyZWVuID0gZG9jLmV4aXRGdWxsc2NyZWVuIHx8IGRvYy5tb3pDYW5jZWxGdWxsU2NyZWVuIHx8IGRvYy53ZWJraXRFeGl0RnVsbHNjcmVlbiB8fCBkb2MubXNFeGl0RnVsbHNjcmVlbjtcblx0XHR2YXIgc3RhdGUgPSBpc0Z1bGxTY3JlZW4oKTtcblxuXHRcdGlmKCB0b2dnbGUgPT0gdW5kZWZpbmVkICkgdG9nZ2xlID0gIXN0YXRlO1xuXHRcdGVsc2UgaWYoIHRvZ2dsZSA9PSBzdGF0ZSApIHJldHVybjtcblxuXHRcdGlmKCB0b2dnbGUgKSByZXF1ZXN0RnVsbFNjcmVlbi5jYWxsKGRvY0VsKTtcblx0XHRlbHNlIGNhbmNlbEZ1bGxTY3JlZW4uY2FsbChkb2MpO1xuXHR9XG4gICAgfVxuICAgIFxuICAgIFxuICAgIHRpY2soKXtcblx0aWYoIHRoaXMuZGlydHkgKXtcblx0ICAgIHRoaXMuY3R4LnB1dEltYWdlRGF0YSggdGhpcy5hY3RpdmVCdWZmZXIsIDAsIDAgKTtcblx0ICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcblx0fVxuICAgIH1cblxuICAgIGNyZWF0ZUJ1ZmZlcigpe1xuXHRsZXQgY2FudmFzID0gdGhpcy5jYW52YXM7XG5cdHRyeXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgSW1hZ2VEYXRhKFxuXHRcdG5ldyBVaW50OENsYW1wZWRBcnJheShjYW52YXMud2lkdGgqY2FudmFzLmhlaWdodCo0KSxcblx0XHRjYW52YXMud2lkdGgsXG5cdFx0Y2FudmFzLmhlaWdodFxuXHQgICAgKTtcblx0fWNhdGNoKGUpe1xuXHQgICAgcmV0dXJuIHRoaXMuY3R4LmNyZWF0ZUltYWdlRGF0YShjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHR9XG5cdFxuICAgIH1cblxuICAgIHJlc2V0KCl7XG5cdHRoaXMubW9kZSA9IDA7XG5cdHRoaXMuY2xvY2tEaXZpc29yID0gMHg4MDtcblx0dGhpcy5jbWQgPSBbXTtcblx0dGhpcy5wb3MgPSAwO1xuXHR0aGlzLmZiLmRhdGEuZmlsbCgwKTtcbiAgICB9XG5cbiAgICBzdGF0ZSA9IGZ1bmN0aW9uKCBkYXRhICl7XG5cdC8vIGNvbnNvbGUubG9nKCBcIkRBVEE6IFwiICsgZGF0YS50b1N0cmluZygxNikgKTtcblx0bGV0IHAgPSB0aGlzLnBvcysrO1xuXHRsZXQgeCA9IHAgJSAxMjg7XG5cdGxldCB5ID0gKChwIC8gMTI4KXwwKSAqIDg7XG5cdGZvciggbGV0IGk9MDsgaTw4OyArK2kgKXtcblx0ICAgIGxldCBvZmZzZXQgPSAoKHkraSkqMTI4ICsgeCkgKiA0O1xuXHQgICAgbGV0IGJpdCA9ICgoZGF0YSA+Pj4gaSkgJiAxKSAqIDB4RTA7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdH1cblxuXHRpZiggdGhpcy5wb3MgPj0gMTI4KjY0LzggKVxuXHQgICAgdGhpcy5wb3MgPSAwO1xuXG5cdHRoaXMuZGlydHkgPSB0cnVlO1xuXHRcdCBcbiAgICB9XG5cbiAgICBzY2sgPSB7XG5cdGNvbm5lY3Q6bnVsbFxuICAgIH1cblxuICAgIHNkYSA9IHtcblx0Y29ubmVjdDpudWxsLFxuXHRNT1NJOmZ1bmN0aW9uKCBkYXRhICl7XG5cblx0ICAgIGlmKCB0aGlzLm1vZGUgPT0gMCApeyAvLyBkYXRhIGlzIGEgY29tbWFuZFxuXHRcdGxldCBjbWQgPSBcImNtZFwiICsgZGF0YS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcblx0XHRpZiggdGhpcy5jbWQubGVuZ3RoICl7XG5cdFx0ICAgIHRoaXMuY21kLnB1c2goIGRhdGEgKTtcblx0XHQgICAgY21kID0gdGhpcy5jbWRbMF07XG5cdFx0fWVsc2UgdGhpcy5jbWQucHVzaCggY21kICk7XG5cblx0XHRsZXQgZm5jID0gdGhpc1tjbWRdO1xuXHRcdFxuXHRcdGlmKCAhZm5jIClcblx0XHQgICAgcmV0dXJuIGNvbnNvbGUud2FybihcIlVua25vd24gU1NEMTMwNiBjb21tYW5kOiBcIiArIGNtZC50b1N0cmluZygxNikpO1xuXHRcdFxuXHRcdGlmKCBmbmMubGVuZ3RoID09IHRoaXMuY21kLmxlbmd0aC0xICl7XG5cdFx0ICAgIHRoaXMuY21kLnNoaWZ0KCk7XG5cdFx0ICAgIHRoaXNbY21kXS5hcHBseSggdGhpcywgdGhpcy5jbWQgKTtcblx0XHQgICAgdGhpcy5jbWQubGVuZ3RoID0gMDtcblx0XHR9XG5cblx0ICAgIH1lbHNle1xuXHRcdHRoaXMuc3RhdGUoIGRhdGEgKTtcblx0ICAgIH1cblx0fVxuICAgIH1cblxuICAgIHJlcyA9IHtcblx0Y29ubmVjdDpudWxsLFxuXHRvbkxvd1RvSGlnaDpmdW5jdGlvbigpe1xuXHQgICAgdGhpcy5yZXNldCgpO1xuXHR9XG4gICAgfVxuXG4gICAgZGMgPSB7XG5cdGNvbm5lY3Q6bnVsbCxcblx0b25Mb3dUb0hpZ2g6ZnVuY3Rpb24oKXtcblx0ICAgIHRoaXMubW9kZSA9IDE7IC8vIGRhdGFcblx0fSxcblx0b25IaWdoVG9Mb3c6ZnVuY3Rpb24oKXtcblx0ICAgIHRoaXMubW9kZSA9IDA7IC8vIGNvbW1hbmRcblx0fSBcbiAgICB9XG5cbiAgICAvLyBTZXQgTG93ZXIgQ29sdW1uIFN0YXJ0IEFkZHJlc3MgZm9yXG4gICAgLy8gUGFnZSBBZGRyZXNzaW5nIE1vZGUgXG4gICAgY21kMCgpe1xuICAgIH1cbiAgICBjbWQxKCl7XG4gICAgfVxuICAgIGNtZDIoKXtcbiAgICB9Ly8gZXRjXG4gICAgY21kRigpe1xuICAgIH1cblxuXG5cbiAgICAvLyBEaXNwbGF5IE9mZlxuICAgIGNtZEFFKCl7XG5cdHRoaXMuYWN0aXZlQnVmZmVyID0gdGhpcy5mYk9GRjtcbiAgICB9XG5cbiAgICAvLyBTZXQgRGlzcGxheSBDbG9jayBEaXZpc29yIHYgPSAweEYwXG4gICAgY21kRDUoIHYgKXtcblx0dGhpcy5jbG9ja0Rpdmlzb3IgPSB2O1xuICAgIH1cblxuICAgIC8vIENoYXJnZSBQdW1wIFNldHRpbmcgdiA9IGVuYWJsZSAoMHgxNClcbiAgICBjbWQ4RCggdiApe1xuXHR0aGlzLmNoYXJnZVB1bXBFbmFibGVkID0gdjtcbiAgICB9XG5cbiAgICAvLyBTZXQgU2VnbWVudCBSZS1tYXAgKEEwKSB8IChiMDAwMSlcbiAgICBjbWRBMCgpeyB0aGlzLnNlZ21lbnRSZW1hcCA9IDAgfTtcbiAgICBjbWRBMSgpeyB0aGlzLnNlZ21lbnRSZW1hcCA9IDEgfTtcblxuICAgIGNtZEE1KCl7ICB9OyAvLyBtdWx0aXBsZXggc29tZXRoaW5nIG9yIG90aGVyXG5cbiAgICAvLyBTZXQgQ09NIE91dHB1dCBTY2FuIERpcmVjdGlvblxuICAgIGNtZEM4KCl7XG4gICAgfVxuXG4gIC8vIFNldCBDT00gUGlucyB2XG4gICAgY21kREEoIHYgKXtcbiAgICB9XG5cbiAgLy8gU2V0IENvbnRyYXN0IHYgPSAweENGXG4gICAgY21kODEoIHYgKXtcbiAgICB9XG5cbiAgLy8gU2V0IFByZWNoYXJnZSA9IDB4RjFcbiAgICBjbWREOSggdiApe1xuICAgIH1cblxuICAvLyBTZXQgVkNvbSBEZXRlY3RcbiAgICBjbWREQiggdiApe1xuICAgIH1cblxuICAvLyBFbnRpcmUgRGlzcGxheSBPTlxuICAgIGNtZEE0KCB2ICl7XG5cdHRoaXMuYWN0aXZlQnVmZmVyID0gdiA/IHRoaXMuZmJPTiA6IHRoaXMuZmI7XG4gICAgfVxuICAgIFxuICAvLyBTZXQgbm9ybWFsL2ludmVyc2UgZGlzcGxheVxuICAgIGNtZEE2KCB2ICl7XG4gICAgfVxuICAgIFxuICAvLyBEaXNwbGF5IE9uXG4gICAgY21kQUYoIHYgKXtcblx0dGhpcy5hY3RpdmVCdWZmZXIgPSB0aGlzLmZiO1xuICAgIH1cblxuICAvLyBzZXQgZGlzcGxheSBtb2RlID0gaG9yaXpvbnRhbCBhZGRyZXNzaW5nIG1vZGUgKDB4MDApXG4gICAgY21kMjAoIHYgKXtcbiAgICB9XG5cbiAgLy8gc2V0IGNvbCBhZGRyZXNzIHJhbmdlXG4gICAgY21kMjEoIHYsIGUgKXtcbiAgICB9XG5cbiAgLy8gc2V0IHBhZ2UgYWRkcmVzcyByYW5nZVxuICAgIGNtZDIyKCB2LCBlICl7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNDUkVFTjtcbiIsImltcG9ydCB7IElDb250cm9sbGVyLCBNb2RlbCwgSVZpZXcgfSBmcm9tICcuLi9saWIvbXZjLmpzJztcbmltcG9ydCB7IGdldFBvbGljeSB9IGZyb20gJ2RyeS1kaSc7XG5pbXBvcnQgQXRjb3JlIGZyb20gJy4uL2F0Y29yZS9BdGNvcmUuanMnO1xuaW1wb3J0IEhleCBmcm9tICcuLi9hdGNvcmUvSGV4LmpzJztcblxuY2xhc3MgQXJkdWJveSB7XG5cbiAgICBzdGF0aWMgXCJAaW5qZWN0XCIgPSB7XG4gICAgICAgIHJvb3Q6IFtNb2RlbCwge3Njb3BlOlwicm9vdFwifV0sXG5cdHBvb2w6XCJwb29sXCJcbiAgICB9XG5cbiAgICB0aWNrID0gW11cblxuICAgIGNvbnN0cnVjdG9yKCBET00gKXtcblxuXHR0aGlzLnBvb2wuYWRkKHRoaXMpO1xuXG5cdHRoaXMuRE9NID0gRE9NO1xuXHR0aGlzLnBhcmVudCA9IERPTS5lbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cdHRoaXMud2lkdGggPSAwO1xuXHR0aGlzLmhlaWdodCA9IDA7XG5cdHRoaXMuZGVhZCA9IGZhbHNlO1xuXG5cdERPTS5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwiYWRkcGVyaWZlcmFsXCIsIGV2dCA9PiB0aGlzLmFkZFBlcmlmZXJhbCggZXZ0LnRhcmdldC5jb250cm9sbGVyICkgKTtcblxuXG5cdHRoaXMucGVyaWZlcmFscyA9IFtdO1xuXG5cdHRoaXMudXBkYXRlID0gdGhpcy5fdXBkYXRlLmJpbmQoIHRoaXMgKTtcblx0dGhpcy5yZXNpemUoKTtcblx0XG5cdGxldCB1cmwgPSB0aGlzLnJvb3QuZ2V0SXRlbShcImFwcC5BVDMyOFAudXJsXCIsIG51bGwpO1xuXHRpZiggdXJsICl7XG5cdCAgICBcblx0ICAgIHRoaXMuY29yZSA9IEF0Y29yZS5BVG1lZ2EzMjhQKCk7XG5cdCAgICBcblx0ICAgIEhleC5wYXJzZVVSTCggdXJsLCB0aGlzLmNvcmUuZmxhc2gsIChzdWNjZXNzKSA9PiB7XG5cdFx0aWYoIHN1Y2Nlc3MgKVxuXHRcdCAgICB0aGlzLmluaXRDb3JlKCk7XG5cdCAgICB9KTtcblx0ICAgIHJldHVybjtcblx0ICAgIFxuXHR9XG5cblx0bGV0IGhleCA9IHRoaXMucm9vdC5nZXRJdGVtKFwiYXBwLkFUMzI4UC5oZXhcIiwgbnVsbCk7XG5cdGlmKCBoZXggKXtcblx0XHRcblx0ICAgIHRoaXMuY29yZSA9IEF0Y29yZS5BVG1lZ2EzMjhQKCk7XG5cdCAgICBIZXgucGFyc2UoIGhleCwgdGhpcy5jb3JlLmZsYXNoICk7XG5cdCAgICB0aGlzLmluaXRDb3JlKCk7XG5cdCAgICByZXR1cm47XG5cdCAgICBcblx0fVxuXHQgICAgXG5cdHVybCA9IHRoaXMucm9vdC5nZXRJdGVtKFwiYXBwLkFUMzJ1NC51cmxcIiwgbnVsbCk7XG5cdGlmKCB1cmwgKXtcblxuXHQgICAgdGhpcy5jb3JlID0gQXRjb3JlLkFUbWVnYTMydTQoKTtcblx0ICAgIEhleC5wYXJzZVVSTCggdXJsLCB0aGlzLmNvcmUuZmxhc2gsIHN1Y2Nlc3MgPT4ge1xuXHRcdGlmKCBzdWNjZXNzICkgdGhpcy5pbml0Q29yZSgpO1xuXHQgICAgfSk7XG5cdCAgICByZXR1cm47XG5cdCAgICBcblx0fVxuXG5cdGhleCA9IHRoaXMucm9vdC5nZXRJdGVtKFwiYXBwLkFUMzJ1NC5oZXhcIiwgbnVsbCk7XG5cdGlmKCBoZXggKXtcblx0ICAgIFxuXHQgICAgdGhpcy5jb3JlID0gQXRjb3JlLkFUbWVnYTMydTQoKTtcblx0ICAgIEhleC5wYXJzZSggaGV4LCB0aGlzLmNvcmUuZmxhc2ggKTtcblx0ICAgIHRoaXMuaW5pdENvcmUoKTtcblx0ICAgIHJldHVybjtcblx0ICAgIFxuXHR9XG5cblx0Y29uc29sZS5lcnJvcihcIk5vdGhpbmcgdG8gbG9hZFwiKTtcbiAgICB9XG5cbiAgICBvblByZXNzRXNjYXBlKCl7XG5cdHRoaXMucG93ZXJPZmYoKTtcbiAgICB9XG5cbiAgICBzZXRBY3RpdmVWaWV3KCl7XG5cdHRoaXMucG9vbC5yZW1vdmUodGhpcyk7XG4gICAgfVxuXG4gICAgcG93ZXJPZmYoKXtcblx0dGhpcy5wb29sLnJlbW92ZSh0aGlzKTtcblx0dGhpcy5kZWFkID0gdHJ1ZTtcblx0dGhpcy5ET00uZWxlbWVudC5kaXNwYXRjaEV2ZW50KCBuZXcgRXZlbnQoXCJwb3dlcm9mZlwiLCB7YnViYmxlczp0cnVlfSkgKTtcbiAgICB9XG5cbiAgICBpbml0Q29yZSgpe1xuXHRsZXQgY29yZSA9IHRoaXMuY29yZSwgb2xkVmFsdWVzID0ge30sIEREUkIsIHNlcmlhbDBCdWZmZXIgPSBcIlwiLCBjYWxsYmFja3MgPSB7XG4gICAgICAgICAgICBERFJCOnt9LFxuICAgICAgICAgICAgRERSQzp7fSxcbiAgICAgICAgICAgIEREUkQ6e30sXG4gICAgICAgICAgICBQT1JUQjp7fSxcbiAgICAgICAgICAgIFBPUlRDOnt9LFxuICAgICAgICAgICAgUE9SVEQ6e30sXG4gICAgICAgICAgICBQT1JURTp7fSxcbiAgICAgICAgICAgIFBPUlRGOnt9XG5cdH07XG5cblx0T2JqZWN0LmtleXMoY2FsbGJhY2tzKS5mb3JFYWNoKCBrID0+XG5cdFx0XHRcdFx0T2JqZWN0LmFzc2lnbihjYWxsYmFja3Nba10se1xuXHRcdFx0XHRcdCAgICBvbkhpZ2hUb0xvdzpbXSwgXG5cdFx0XHRcdFx0ICAgIG9uTG93VG9IaWdoOltdXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0ICAgICAgKTtcblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydGllcyggY29yZS5waW5zLCB7XG5cbiAgICAgICAgICAgIG9uSGlnaFRvTG93Ont2YWx1ZTpmdW5jdGlvbiggcG9ydCwgYml0LCBjYiApe1xuXHRcdChjYWxsYmFja3NbIHBvcnQgXS5vbkhpZ2hUb0xvd1sgYml0IF0gPSBjYWxsYmFja3NbIHBvcnQgXVsgYml0IF0gfHwgW10pLnB1c2goIGNiICk7XG4gICAgICAgICAgICB9fSxcblxuICAgICAgICAgICAgb25Mb3dUb0hpZ2g6e3ZhbHVlOmZ1bmN0aW9uKCBwb3J0LCBiaXQsIGNiICl7XG5cdFx0KGNhbGxiYWNrc1sgcG9ydCBdLm9uTG93VG9IaWdoWyBiaXQgXSA9IGNhbGxiYWNrc1sgcG9ydCBdWyBiaXQgXSB8fCBbXSkucHVzaCggY2IgKTtcbiAgICAgICAgICAgIH19LFxuXG4gICAgICAgICAgICAwOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlREXCIsIGJpdDoyIH0sIGluOntwb3J0OlwiUElORFwiLCBiaXQ6Mn0gfSB9LFxuICAgICAgICAgICAgMTp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURFwiLCBiaXQ6MyB9LCBpbjp7cG9ydDpcIlBJTkRcIiwgYml0OjN9IH0gfSxcbiAgICAgICAgICAgIDI6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVERcIiwgYml0OjEgfSwgaW46e3BvcnQ6XCJQSU5EXCIsIGJpdDoxfSB9IH0sXG4gICAgICAgICAgICAzOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlREXCIsIGJpdDowIH0sIGluOntwb3J0OlwiUElORFwiLCBiaXQ6MH0gfSB9LFxuICAgICAgICAgICAgNDp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURFwiLCBiaXQ6NCB9LCBpbjp7cG9ydDpcIlBJTkRcIiwgYml0OjR9IH0gfSxcbiAgICAgICAgICAgIDU6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVENcIiwgYml0OjYgfSwgaW46e3BvcnQ6XCJQSU5DXCIsIGJpdDo2fSB9IH0sXG4gICAgICAgICAgICA2Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlREXCIsIGJpdDo3IH0sIGluOntwb3J0OlwiUElORFwiLCBiaXQ6N30gfSB9LFxuICAgICAgICAgICAgNzp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURVwiLCBiaXQ6NiB9LCBpbjp7cG9ydDpcIlBJTkVcIiwgYml0OjZ9IH0gfSxcbiAgICAgICAgICAgIDg6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEJcIiwgYml0OjQgfSwgaW46e3BvcnQ6XCJQSU5CXCIsIGJpdDo0fSB9IH0sXG4gICAgICAgICAgICA5Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRCXCIsIGJpdDo1IH0sIGluOntwb3J0OlwiUElOQlwiLCBiaXQ6NX0gfSB9LFxuICAgICAgICAgICAgMTA6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEJcIiwgYml0OjYgfSwgaW46e3BvcnQ6XCJQSU5CXCIsIGJpdDo2fSB9IH0sXG4gICAgICAgICAgICAxMTp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JUQlwiLCBiaXQ6NyB9LCBpbjp7cG9ydDpcIlBJTkJcIiwgYml0Ojd9IH0gfSxcblxuXHQgICAgMTY6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEJcIiwgYml0OjIgfSwgaW46e3BvcnQ6XCJQSU5CXCIsIGJpdDoyfSB9IH0sXG4gICAgICAgICAgICAxNDp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JUQlwiLCBiaXQ6MyB9LCBpbjp7cG9ydDpcIlBJTkJcIiwgYml0OjN9IH0gfSxcbiAgICAgICAgICAgIDE1Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRCXCIsIGJpdDoxIH0sIGluOntwb3J0OlwiUElOQlwiLCBiaXQ6MX0gfSB9LFxuICAgICAgICAgICAgMTc6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEJcIiwgYml0OjAgfSwgaW46e3BvcnQ6XCJQSU5CXCIsIGJpdDowfSB9IH0sXG5cbiAgICAgICAgICAgIDE4Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRGXCIsIGJpdDo3IH0sIGluOntwb3J0OlwiUElORlwiLCBiaXQ6N30gfSB9LFxuICAgICAgICAgICAgQTA6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEZcIiwgYml0OjcgfSwgaW46e3BvcnQ6XCJQSU5GXCIsIGJpdDo3fSB9IH0sXG4gICAgICAgICAgICAxOTp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURlwiLCBiaXQ6NiB9LCBpbjp7cG9ydDpcIlBJTkZcIiwgYml0OjZ9IH0gfSxcbiAgICAgICAgICAgIEExOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRGXCIsIGJpdDo2IH0sIGluOntwb3J0OlwiUElORlwiLCBiaXQ6Nn0gfSB9LFxuICAgICAgICAgICAgMjA6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEZcIiwgYml0OjUgfSwgaW46e3BvcnQ6XCJQSU5GXCIsIGJpdDo1fSB9IH0sXG4gICAgICAgICAgICBBMjp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURlwiLCBiaXQ6NSB9LCBpbjp7cG9ydDpcIlBJTkZcIiwgYml0OjV9IH0gfSxcbiAgICAgICAgICAgIDIxOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRGXCIsIGJpdDo0IH0sIGluOntwb3J0OlwiUElORlwiLCBiaXQ6NH0gfSB9LFxuICAgICAgICAgICAgQTM6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEZcIiwgYml0OjQgfSwgaW46e3BvcnQ6XCJQSU5GXCIsIGJpdDo0fSB9IH0sXG5cdCAgICBcblx0ICAgIE1PU0k6e3ZhbHVlOnt9fSxcblx0ICAgIE1JU086e3ZhbHVlOnt9fSxcblxuXHQgICAgc3BpSW46e1xuXHRcdHZhbHVlOltdXG5cdCAgICB9LFxuXHQgICAgXG5cdCAgICBzcGlPdXQ6e1xuXHRcdHZhbHVlOntcblx0XHQgICAgbGlzdGVuZXJzOltdLFxuXHRcdCAgICBwdXNoKCBkYXRhICl7XG5cdFx0XHRsZXQgaT0wLCBsaXN0ZW5lcnM9dGhpcy5saXN0ZW5lcnMsIGw9bGlzdGVuZXJzLmxlbmd0aDtcblx0XHRcdGZvcig7aTxsOysraSlcblx0XHRcdCAgICBsaXN0ZW5lcnNbaV0oIGRhdGEgKTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH0sXG5cdCAgICBcbiAgICAgICAgICAgIHNlcmlhbDA6e1xuXHRcdHNldDpmdW5jdGlvbiggc3RyICl7XG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IChzdHIgfHwgXCJcIikucmVwbGFjZSgvXFxyXFxuPy8sJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICBzZXJpYWwwQnVmZmVyICs9IHN0cjtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgYnIgPSBzZXJpYWwwQnVmZmVyLmluZGV4T2YoXCJcXG5cIik7XG4gICAgICAgICAgICAgICAgICAgIGlmKCBiciAhPSAtMSApe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFydHMgPSBzZXJpYWwwQnVmZmVyLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUoIHBhcnRzLmxlbmd0aD4xIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggJ1NFUklBTDogJywgcGFydHMuc2hpZnQoKSApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpYWwwQnVmZmVyID0gcGFydHNbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcblx0XHR9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBERFJCOiB7XG5cdFx0c2V0OiBzZXRERFIuYmluZChudWxsLCBcIkREUkJcIiksXG5cdFx0Z2V0OmZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvbGRWYWx1ZXMuRERSQnwwO1xuXHRcdH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBERFJDOiB7XG5cdFx0c2V0OiBzZXRERFIuYmluZChudWxsLCBcIkREUkNcIiksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRERSRDoge1xuXHRcdHNldDogc2V0RERSLmJpbmQobnVsbCwgXCJERFJEXCIpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEREUkU6IHtcblx0XHRzZXQ6IHNldEREUi5iaW5kKG51bGwsIFwiRERSRFwiKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBERFJGOiB7XG5cdFx0c2V0OiBzZXRERFIuYmluZChudWxsLCBcIkREUkRcIiksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUE9SVEI6IHtcblx0XHRzZXQ6IHNldFBvcnQuYmluZChudWxsLCBcIlBPUlRCXCIpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUE9SVEM6IHtcblx0XHRzZXQ6IHNldFBvcnQuYmluZChudWxsLCBcIlBPUlRDXCIpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUE9SVEQ6IHtcblx0XHRzZXQ6IHNldFBvcnQuYmluZChudWxsLCBcIlBPUlREXCIpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUE9SVEU6IHtcblx0XHRzZXQ6IHNldFBvcnQuYmluZChudWxsLCBcIlBPUlRFXCIpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUE9SVEY6IHtcblx0XHRzZXQ6IHNldFBvcnQuYmluZChudWxsLCBcIlBPUlRGXCIpXG4gICAgICAgICAgICB9XG5cblx0fSk7XG5cblx0c2V0VGltZW91dCggXyA9PiB7XG5cdCAgICB0aGlzLnNldHVwUGVyaWZlcmFscygpO1xuXHQgICAgdGhpcy5fdXBkYXRlKCk7XG5cdH0sIDUpO1xuXG5cdGZ1bmN0aW9uIHNldEREUiggbmFtZSwgY3VyICl7ICAgXG4gICAgICAgICAgICB2YXIgb2xkID0gb2xkVmFsdWVzW25hbWVdOyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiggb2xkID09PSBjdXIgKSByZXR1cm47XG4gICAgICAgICAgICBvbGRWYWx1ZXNbbmFtZV0gPSBjdXI7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRQb3J0KCBuYW1lLCBjdXIgKXtcbiAgICAgICAgICAgIHZhciBvbGQgPSBvbGRWYWx1ZXNbbmFtZV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKCBvbGQgPT09IGN1ciApIHJldHVybjtcbiAgICAgICAgICAgIHZhciBzLCBqLCBsLCBsdGggPSBjYWxsYmFja3NbbmFtZV0ub25Mb3dUb0hpZ2gsIGh0bCA9IGNhbGxiYWNrc1tuYW1lXS5vbkhpZ2hUb0xvdywgdGljayA9IGNvcmUudGljaztcblxuICAgICAgICAgICAgZm9yKCB2YXIgaT0wOyBpPDg7ICsraSApe1xuXG5cdFx0dmFyIG9iID0gb2xkPj4+aSYxLCBuYiA9IGN1cj4+PmkmMTtcblx0XHRpZiggbHRoW2ldICYmICFvYiAmJiBuYiApe1xuICAgICAgICAgICAgICAgICAgICBmb3IoIGo9MCwgcz1sdGhbaV0sIGw9cy5sZW5ndGg7IGo8bDsgKytqIClcblx0XHRcdHNbal0oIHRpY2sgKTtcblx0XHR9XG5cdFx0aWYoIGh0bFtpXSAmJiBvYiAmJiAhbmIgKXtcbiAgICAgICAgICAgICAgICAgICAgZm9yKCBqPTAsIHM9aHRsW2ldLCBsPXMubGVuZ3RoOyBqPGw7ICsraiApXG5cdFx0XHRzW2pdKCB0aWNrICk7XG5cdFx0fVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9sZFZhbHVlc1tuYW1lXSA9IGN1cjtcblxuXHR9XG4gICAgfVxuXG4gICAgXG5cbiAgICBhZGRQZXJpZmVyYWwoIGN0cmwgKXtcblx0XG5cdHRoaXMucGVyaWZlcmFscy5wdXNoKCBjdHJsICk7XG5cdFxuICAgIH1cblxuICAgIHNldHVwUGVyaWZlcmFscygpe1xuXHRsZXQgcGlucyA9IHRoaXMuY29yZS5waW5zO1xuXHRsZXQgbWFwID0geyBjcHU6dGhpcy5jb3JlLnBpbnMgfTtcblx0XG5cdHRoaXMucGVyaWZlcmFscy5mb3JFYWNoKCBjdHJsID0+IHtcblxuXHQgICAgaWYoIGN0cmwudGljayApXG5cdFx0dGhpcy50aWNrLnB1c2goIGN0cmwgKTtcblx0ICAgIFxuXHQgICAgZm9yKCBsZXQgayBpbiBjdHJsICl7XG5cblx0XHRsZXQgdiA9IGN0cmxba107XG5cdFx0aWYoICF2IHx8ICF2LmNvbm5lY3QgKSBjb250aW51ZTtcblxuXHRcdGxldCB0YXJnZXQgPSB2LmNvbm5lY3Q7XG5cdFx0aWYodHlwZW9mIHRhcmdldCA9PSBcIm51bWJlclwiIClcblx0XHQgICAgdGFyZ2V0ID0gXCJjcHUuXCIgKyB0YXJnZXQ7XG5cblx0XHRsZXQgdG9iaiA9IG1hcDtcblx0XHRsZXQgdHBhcnRzID0gdGFyZ2V0LnNwbGl0KFwiLlwiKTtcblx0XHR3aGlsZSggdHBhcnRzLmxlbmd0aCAmJiB0b2JqIClcblx0XHQgICAgdG9iaiA9IHRvYmpbIHRwYXJ0cy5zaGlmdCgpIF07XG5cblx0XHRpZiggdi5NT1NJIClcblx0XHQgICAgcGlucy5zcGlPdXQubGlzdGVuZXJzLnB1c2goIHYuTU9TSS5iaW5kKCBjdHJsICkgKTtcblxuXHRcdGlmKCAhdG9iaiApe1xuXHRcdCAgICBjb25zb2xlLndhcm4oXCJDb3VsZCBub3QgYXR0YWNoIHdpcmUgZnJvbSBcIiwgaywgXCIgdG8gXCIsIHRhcmdldCk7XG5cdFx0ICAgIGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGlmKCB2Lm9uTG93VG9IaWdoIClcblx0XHQgICAgcGlucy5vbkxvd1RvSGlnaCggdG9iai5vdXQucG9ydCwgdG9iai5vdXQuYml0LCB2Lm9uTG93VG9IaWdoLmJpbmQoIGN0cmwgKSApO1xuXHRcdFxuXHRcdGlmKCB2Lm9uSGlnaFRvTG93IClcblx0XHQgICAgcGlucy5vbkhpZ2hUb0xvdyggdG9iai5vdXQucG9ydCwgdG9iai5vdXQuYml0LCB2Lm9uSGlnaFRvTG93LmJpbmQoIGN0cmwgKSApO1xuXG5cblx0XHRsZXQgc2V0dGVyID0gKGZ1bmN0aW9uKCB0b2JqLCBudiApe1xuXHRcdCAgICBcblx0XHQgICAgaWYoIG52ICkgcGluc1sgdG9iai5pbi5wb3J0IF0gfD0gMSA8PCB0b2JqLmluLmJpdDtcblx0XHQgICAgZWxzZSBwaW5zWyB0b2JqLmluLnBvcnQgXSAmPSB+KDEgPDwgdG9iai5pbi5iaXQpO1xuXHRcdCAgICBcblx0XHR9KS5iaW5kKHRoaXMsIHRvYmopO1xuXG5cdFx0bGV0IGdldHRlciA9IChmdW5jdGlvbiggdG9iaiApe1xuXHRcdCAgICByZXR1cm4gKHBpbnNbIHRvYmoub3V0LnBvcnQgXSA+Pj4gdG9iai5vdXQuYml0KSAmIDE7XG5cdFx0fSkuYmluZCh0aGlzLCB0b2JqKTtcblxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2LCBcInZhbHVlXCIsIHtcblx0XHQgICAgc2V0OnNldHRlcixcblx0XHQgICAgZ2V0OmdldHRlclxuXHRcdH0pO1xuXG5cdFx0aWYoIHYuaW5pdCApXG5cdFx0ICAgIHYuaW5pdC5jYWxsKCBjdHJsICk7XG5cblx0ICAgIH1cblx0ICAgIFxuXHR9KTtcblx0XG4gICAgfVxuXG4gICAgX3VwZGF0ZSgpe1xuXHRpZiggdGhpcy5kZWFkICkgcmV0dXJuO1xuXHRcblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCB0aGlzLnVwZGF0ZSApO1xuXHR0aGlzLmNvcmUudXBkYXRlKCk7XG5cdHRoaXMucmVzaXplKCk7XG5cdGZvciggbGV0IGk9MCwgbD10aGlzLnRpY2subGVuZ3RoOyBpPGw7ICsraSApXG5cdCAgICB0aGlzLnRpY2tbaV0udGljaygpO1xuICAgIH1cblxuICAgIHJlc2l6ZSgpe1xuXHRcblx0bGV0IG1heEhlaWdodCA9IHRoaXMucGFyZW50LmNsaWVudEhlaWdodDtcblx0bGV0IG1heFdpZHRoICA9IHRoaXMucGFyZW50LmNsaWVudFdpZHRoO1xuXG5cdGlmKCB0aGlzLndpZHRoID09IG1heFdpZHRoICYmIHRoaXMuaGVpZ2h0ID09IG1heEhlaWdodCApXG5cdCAgICByZXR1cm47XG5cdFxuXHR0aGlzLndpZHRoID0gbWF4V2lkdGg7XG5cdHRoaXMuaGVpZ2h0ID0gbWF4SGVpZ2h0O1xuXG5cdGxldCByYXRpbyA9IDM5MyAvIDYyNDtcblxuXHRpZiggdGhpcy5oZWlnaHQgKiByYXRpbyA+IHRoaXMud2lkdGggKXtcblx0ICAgIHRoaXMuRE9NLmVsZW1lbnQuc3R5bGUud2lkdGggPSB0aGlzLndpZHRoICsgXCJweFwiO1xuXHQgICAgdGhpcy5ET00uZWxlbWVudC5zdHlsZS5oZWlnaHQgPSAodGhpcy53aWR0aCAvIHJhdGlvKSArIFwicHhcIjtcblx0fWVsc2V7XG5cdCAgICB0aGlzLkRPTS5lbGVtZW50LnN0eWxlLndpZHRoID0gKHRoaXMuaGVpZ2h0ICogcmF0aW8pICsgXCJweFwiO1xuXHQgICAgdGhpcy5ET00uZWxlbWVudC5zdHlsZS5oZWlnaHQgPSB0aGlzLmhlaWdodCArIFwicHhcIjtcblx0fVxuXHRcbiAgICB9XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXJkdWJveTtcbiIsImNsYXNzIENvbmZpZ3tcclxuXHJcbiAgICBjb25zdHJ1Y3RvciggRE9NICl7XHJcbiAgICAgICAgRE9NLmVsZW1lbnQuaW5uZXJIVE1MID0gXCJDIE8gTiBGIEkgR1wiO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb25maWc7IiwiY2xhc3MgRmlsZXN7XHJcblxyXG4gICAgY29uc3RydWN0b3IoIERPTSApe1xyXG4gICAgICAgIERPTS5lbGVtZW50LmlubmVySFRNTCA9IFwiQyBPIE4gRiBJIEdcIjtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmlsZXM7IiwiaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuLi9saWIvbXZjLmpzJztcblxuY2xhc3MgTWFya2V0e1xuXG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xuICAgICAgICByb290OiBbTW9kZWwsIHtzY29wZTpcInJvb3RcIn1dXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoIERPTSApe1xuICAgIH1cblxuICAgIHJ1bigpe1xuICAgICAgICB0aGlzLnBvb2wuY2FsbChcInJ1blNpbVwiKTtcbiAgICB9XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFya2V0O1xuIiwiaW1wb3J0IElTdG9yZSBmcm9tICcuLi9zdG9yZS9JU3RvcmUuanMnO1xyXG5pbXBvcnQgeyBJQ29udHJvbGxlciwgTW9kZWwsIElWaWV3IH0gZnJvbSAnLi4vbGliL212Yy5qcyc7XHJcblxyXG5jbGFzcyBFbnYgZXh0ZW5kcyBJQ29udHJvbGxlciB7XHJcblxyXG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xyXG4gICAgICAgIHN0b3JlOklTdG9yZSxcclxuICAgICAgICBwb29sOlwicG9vbFwiLFxyXG4gICAgICAgIHZpZXdGYWN0b3J5OltJVmlldywge2NvbnRyb2xsZXI6RW52fV0sXHJcbiAgICAgICAgbW9kZWw6IFtNb2RlbCwge3Njb3BlOlwicm9vdFwifV1cclxuICAgIH1cclxuXHJcbiAgICBleGl0U3BsYXNoKCl7XHJcblx0LyogKi9cclxuICAgICAgICB0aGlzLl9zaG93KCk7XHJcblx0LyovXHJcblx0dGhpcy5tb2RlbC5zZXRJdGVtKFwiYXBwLkFUMzJ1NC51cmxcIiwgXCJIZWxsb1dvcmxkMzJ1NC5oZXhcIik7XHJcblx0dGhpcy5wb29sLmNhbGwoXCJydW5TaW1cIik7XHJcblx0LyogKi9cdFxyXG4gICAgfVxyXG5cclxuICAgIGV4aXRTaW0oKXtcclxuXHR0aGlzLl9zaG93KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheSggb3B0ICl7XHJcblx0dGhpcy5tb2RlbC5zZXRJdGVtKFwiYXBwLkFUMzJ1NC51cmxcIiwgdGhpcy5tb2RlbC5nZXRJdGVtKFwiYXBwLnByb3h5XCIpICsgb3B0LmVsZW1lbnQuZGF0YXNldC51cmwpO1xyXG5cdHRoaXMucG9vbC5jYWxsKFwicnVuU2ltXCIpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEVudjtcclxuIiwiaW1wb3J0IHsgSUNvbnRyb2xsZXIsIE1vZGVsLCBJVmlldyB9IGZyb20gJy4uL2xpYi9tdmMuanMnO1xuXG5jbGFzcyBTaW0gZXh0ZW5kcyBJQ29udHJvbGxlciB7XG5cbiAgICBzdGF0aWMgXCJAaW5qZWN0XCIgPSB7XG4gICAgICAgIHBvb2w6XCJwb29sXCIsXG4gICAgICAgIHZpZXdGYWN0b3J5OltJVmlldywge2NvbnRyb2xsZXI6U2ltfV0sXG4gICAgICAgIG1vZGVsOiBbTW9kZWwsIHtzY29wZTpcInJvb3RcIn1dXG4gICAgfVxuXG4gICAgcnVuU2ltKCl7XG4gICAgICAgIHRoaXMuX3Nob3coKTtcbiAgICB9XG5cbiAgICBvbkVuZFNpbSgpe1xuXHR0aGlzLnBvb2wuY2FsbChcImV4aXRTaW1cIik7XG4gICAgfVxuXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgU2ltO1xuIiwiLy8gaW1wb3J0IElTdG9yZSBmcm9tICcuLi9zdG9yZS9JU3RvcmUuanMnO1xyXG5pbXBvcnQgeyBJQ29udHJvbGxlciwgSVZpZXcgfSBmcm9tICcuLi9saWIvbXZjLmpzJztcclxuXHJcblxyXG5jbGFzcyBTcGxhc2ggZXh0ZW5kcyBJQ29udHJvbGxlciB7XHJcblxyXG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xyXG4gICAgICAgIHBvb2w6XCJwb29sXCIsXHJcbiAgICAgICAgdmlld0ZhY3Rvcnk6W0lWaWV3LCB7Y29udHJvbGxlcjpTcGxhc2h9XVxyXG4gICAgfTtcclxuXHJcbiAgICBlbnRlclNwbGFzaCgpe1xyXG4gICAgICAgIHRoaXMuX3Nob3coKTtcclxuICAgIH1cclxuXHJcbiAgICBCT0RZID0ge1xyXG4gICAgICAgIGJvdW5kOmZ1bmN0aW9uKCBldnQgKXtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IGV2dC50YXJnZXQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufVxyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFNwbGFzaDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBET007XHJcblxyXG5mdW5jdGlvbiBET00oIGVsZW1lbnQgKXtcclxuXHJcbiAgICBpZiggIWVsZW1lbnQgJiYgZG9jdW1lbnQgJiYgZG9jdW1lbnQuYm9keSApXHJcbiAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XHJcblxyXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuXHJcbn1cclxuXHJcbnZhciBzcGFyZSA9IG51bGw7XHJcbmZ1bmN0aW9uIGdldFRoaXMoIHRoYXQgKXtcclxuXHJcbiAgICBpZiggIXRoYXQgfHwgdHlwZW9mIHRoYXQgPT0gXCJmdW5jdGlvblwiIClcclxuICAgICAgICByZXR1cm4gc3BhcmUgPSBzcGFyZSB8fCBuZXcgRE9NKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoYXQ7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBwcm90b3R5cGUoIG9iaiApe1xyXG4gICAgXHJcbiAgICB2YXIgZGVzYyA9IHt9O1xyXG4gICAgZm9yKCB2YXIgayBpbiBvYmogKXtcclxuICAgICAgICBkZXNjW2tdID0ge1xyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOmZhbHNlLFxyXG4gICAgICAgICAgICB2YWx1ZTogb2JqW2tdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciByZXQgPSB7fTtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHJldCwgZGVzYyk7XHJcblxyXG4gICAgcmV0dXJuIHJldDtcclxuXHJcbn1cclxuXHJcbnZhciBpbXBsID0ge1xyXG5cclxuICAgIGNyZWF0ZTpmdW5jdGlvbiggc3RyVGFnTmFtZSwgb2JqUHJvcGVydGllcywgYXJyQ2hpbGRyZW4sIGVsUGFyZW50ICl7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgc3RyVGFnTmFtZSA9IG9ialByb3BlcnRpZXMgPSBhcnJDaGlsZHJlbiA9IGVsUGFyZW50ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBmb3IoIHZhciBpPTAsIGw9YXJncy5sZW5ndGg7IGk8bDsgKytpICl7XHJcbiAgICAgICAgICAgIHZhciBhcmcgPSBhcmdzW2ldO1xyXG4gICAgICAgICAgICBpZiggdHlwZW9mIGFyZyA9PSBcInN0cmluZ1wiIClcclxuICAgICAgICAgICAgICAgIHN0clRhZ05hbWUgPSBhcmc7XHJcbiAgICAgICAgICAgIGVsc2UgaWYoIHR5cGVvZiBhcmcgPT0gXCJvYmplY3RcIiApe1xyXG4gICAgICAgICAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoYXJnKSApXHJcbiAgICAgICAgICAgICAgICAgICAgYXJyQ2hpbGRyZW4gPSBhcmc7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBhcmcgaW5zdGFuY2VvZiBFbGVtZW50IClcclxuICAgICAgICAgICAgICAgICAgICBlbFBhcmVudCA9IGFyZztcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBvYmpQcm9wZXJ0aWVzID0gYXJnO1xyXG4gICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoICFlbFBhcmVudCAmJiB0aGlzLmVsZW1lbnQgKVxyXG4gICAgICAgICAgICBlbFBhcmVudCA9IHRoaXMuZWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYoICFzdHJUYWdOYW1lICl7XHJcbiAgICAgICAgICAgIGlmKCAhZWxQYXJlbnQgKVxyXG4gICAgICAgICAgICAgICAgc3RyVGFnTmFtZSA9IFwic3BhblwiO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBzdHJUYWdOYW1lID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhYmxlOlwidHJcIixcclxuICAgICAgICAgICAgICAgICAgICB0cjpcInRkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0Olwib3B0aW9uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdWw6XCJsaVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG9sOlwibGlcIixcclxuICAgICAgICAgICAgICAgICAgICBkbDpcImR0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0Z3JvdXA6XCJvcHRpb25cIixcclxuICAgICAgICAgICAgICAgICAgICBkYXRhbGlzdDpcIm9wdGlvblwiXHJcbiAgICAgICAgICAgICAgICB9W2VsUGFyZW50LnRhZ05hbWVdIHx8IGVsUGFyZW50LnRhZ05hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIHN0clRhZ05hbWUgKTtcclxuICAgICAgICBpZiggZWxQYXJlbnQgKVxyXG4gICAgICAgICAgICBlbFBhcmVudC5hcHBlbmRDaGlsZCggZWxlbWVudCApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBsaXN0ZW5lcjtcclxuXHJcbiAgICAgICAgZm9yKCB2YXIga2V5IGluIG9ialByb3BlcnRpZXMgKXtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gb2JqUHJvcGVydGllc1trZXldO1xyXG4gICAgICAgICAgICBpZigga2V5ID09IFwidGV4dFwiIClcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKSApO1xyXG4gICAgICAgICAgICBlbHNlIGlmKCBrZXkgPT0gXCJsaXN0ZW5lclwiIClcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGVsc2UgaWYoIGtleSA9PSBcImF0dHJcIiApe1xyXG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgYXR0ciBpbiB2YWx1ZSApXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoIGF0dHIsIHZhbHVlW2F0dHJdICk7XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBlbGVtZW50W2tleV0gJiYgdHlwZW9mIGVsZW1lbnRba2V5XSA9PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiIClcclxuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oIGVsZW1lbnRba2V5XSwgdmFsdWUgKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgZWxlbWVudFtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggdGhpcy5lbGVtZW50ICYmIGVsZW1lbnQuaWQgKVxyXG4gICAgICAgICAgICB0aGlzW2VsZW1lbnQuaWRdID0gZWxlbWVudDtcclxuXHJcbiAgICAgICAgZm9yKCBpPTAsIGw9YXJyQ2hpbGRyZW4gJiYgYXJyQ2hpbGRyZW4ubGVuZ3RoOyBpPGw7ICsraSApe1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZS5hcHBseSggdGhpcywgYXJyQ2hpbGRyZW5baV0uY29uY2F0KGVsZW1lbnQpICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggbGlzdGVuZXIgKVxyXG4gICAgICAgICAgICAobmV3IERPTShlbGVtZW50KSkubGlzdGVuKCBsaXN0ZW5lciApO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgIH0sXHJcblxyXG4gICAgbGlzdGVuOmZ1bmN0aW9uKCBsaXN0ZW5lcnMsIHRoYXQsIHByZWZpeCApe1xyXG4gICAgICAgIHByZWZpeCA9IHByZWZpeCB8fCBcIlwiO1xyXG4gICAgICAgIGlmKCB0aGF0ID09PSB1bmRlZmluZWQgKSB0aGF0ID0gbGlzdGVuZXJzO1xyXG5cclxuICAgICAgICB2YXIgVEhJUyA9IGdldFRoaXMoIHRoaXMgKTtcclxuXHJcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyggbGlzdGVuZXJzICk7XHJcblxyXG4gICAgICAgIFRISVMuZm9yRWFjaCggZWxlbWVudCA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiggbGlzdGVuZXJzW3ByZWZpeCArIGVsZW1lbnQudGFnTmFtZV0gKSBcclxuICAgICAgICAgICAgICAgIGJpbmQoIGxpc3RlbmVyc1twcmVmaXggKyBlbGVtZW50LnRhZ05hbWVdLCBlbGVtZW50ICk7XHJcblxyXG4gICAgICAgICAgICBpZiggbGlzdGVuZXJzW3ByZWZpeCArIGVsZW1lbnQuaWRdICkgXHJcbiAgICAgICAgICAgICAgICBiaW5kKCBsaXN0ZW5lcnNbcHJlZml4ICsgZWxlbWVudC5pZF0sIGVsZW1lbnQgKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCBsaXN0ZW5lcnNbcHJlZml4ICsgZWxlbWVudC5jbGFzc05hbWVdICkgXHJcbiAgICAgICAgICAgICAgICBiaW5kKCBsaXN0ZW5lcnNbcHJlZml4ICsgZWxlbWVudC5jbGFzc05hbWVdLCBlbGVtZW50ICk7XHJcblxyXG4gICAgICAgICAgICBpZiggbGlzdGVuZXJzW3ByZWZpeCArIGVsZW1lbnQubmFtZV0gKSBcclxuICAgICAgICAgICAgICAgIGJpbmQoIGxpc3RlbmVyc1twcmVmaXggKyBlbGVtZW50Lm5hbWVdLCBlbGVtZW50ICk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gVEhJUztcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYmluZCggb2JqLCBlbGVtZW50ICl7XHJcblxyXG4gICAgICAgICAgICBmb3IoIHZhciBldmVudCBpbiBvYmogKXtcclxuICAgICAgICAgICAgICAgIHZhciBmdW5jID0gb2JqW2V2ZW50XTtcclxuICAgICAgICAgICAgICAgIGlmKCAhZnVuYy5jYWxsICkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50LCB0aGF0ID8gZnVuYy5iaW5kKHRoYXQpIDogZnVuYyApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGluZGV4OmZ1bmN0aW9uKCBrZXlzLCBtdWx0aXBsZSwgcHJvcGVydHkgKXtcclxuICAgICAgICB2YXIgVEhJUyA9IGdldFRoaXModGhpcyk7XHJcblxyXG4gICAgICAgIHZhciBpbmRleCA9IE9iamVjdC5jcmVhdGUoRE9NLnByb3RvdHlwZSk7XHJcblxyXG4gICAgICAgIGlmKCB0eXBlb2Yga2V5cyA9PSBcInN0cmluZ1wiICkga2V5cyA9IFtrZXlzXTtcclxuXHJcbiAgICAgICAgZm9yKCB2YXIgaT0wLCBsPWtleXMubGVuZ3RoOyBpPGw7ICsraSApe1xyXG5cclxuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2Yga2V5ICE9IFwic3RyaW5nXCIgKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBpZiggIXByb3BlcnR5ICYmICFtdWx0aXBsZSApe1xyXG5cclxuICAgICAgICAgICAgICAgIFRISVMuZm9yRWFjaCggY2hpbGQgPT4gY2hpbGRba2V5XSAhPT0gdW5kZWZpbmVkICYmIChpbmRleFsgY2hpbGRba2V5XSBdID0gY2hpbGQpICk7XHJcblxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggcHJvcGVydHkgJiYgIW11bHRpcGxlICl7XHJcblxyXG4gICAgICAgICAgICAgICAgVEhJUy5mb3JFYWNoKCBjaGlsZCA9PntcclxuICAgICAgICAgICAgICAgICAgICBpZiggY2hpbGRbcHJvcGVydHldICYmIHR5cGVvZiBjaGlsZFtwcm9wZXJ0eV0gPT0gXCJvYmplY3RcIiAmJiBjaGlsZFtwcm9wZXJ0eV1ba2V5XSAhPT0gdW5kZWZpbmVkICkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4WyBjaGlsZFtwcm9wZXJ0eV1ba2V5XSBdID0gY2hpbGQ7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCAhcHJvcGVydHkgJiYgdHlwZW9mIG11bHRpcGxlID09IFwiZnVuY3Rpb25cIiApe1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBUSElTLmZvckVhY2goIGNoaWxkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiggY2hpbGRba2V5XSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGUoIGNoaWxkW2tleV0sIGNoaWxkICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBwcm9wZXJ0eSAmJiB0eXBlb2YgbXVsdGlwbGUgPT0gXCJmdW5jdGlvblwiICl7XHJcblxyXG4gICAgICAgICAgICAgICAgVEhJUy5mb3JFYWNoKCBjaGlsZCA9PntcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoICFjaGlsZFtwcm9wZXJ0eV0gfHwgdHlwZW9mIGNoaWxkW3Byb3BlcnR5XSAhPSBcIm9iamVjdFwiICkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHYgPSBjaGlsZFtwcm9wZXJ0eV1ba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiggdiAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGUoIHYsIGNoaWxkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggIXByb3BlcnR5ICYmIG11bHRpcGxlICl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIFRISVMuZm9yRWFjaCggY2hpbGQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCBjaGlsZFtrZXldICE9PSB1bmRlZmluZWQgKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoICFpbmRleFsgY2hpbGRba2V5XSBdIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4WyBjaGlsZFtrZXldIF0gPSBbY2hpbGRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFsgY2hpbGRba2V5XSBdLnB1c2goIGNoaWxkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggcHJvcGVydHkgJiYgbXVsdGlwbGUgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBUSElTLmZvckVhY2goIGNoaWxkID0+e1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiggIWNoaWxkW3Byb3BlcnR5XSB8fCB0eXBlb2YgY2hpbGRbcHJvcGVydHldICE9IFwib2JqZWN0XCIgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IGNoaWxkW3Byb3BlcnR5XVtrZXldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCB2ICE9PSB1bmRlZmluZWQgKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoICFpbmRleFsgdiBdIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4WyB2IF0gPSBbY2hpbGRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFsgdiBdLnB1c2goIGNoaWxkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbmRleDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZvckVhY2g6ZnVuY3Rpb24oIGNiLCBlbGVtZW50ICl7XHJcbiAgICAgICAgdmFyIFRISVMgPSBnZXRUaGlzKHRoaXMpO1xyXG5cclxuICAgICAgICBlbGVtZW50ID0gZWxlbWVudCB8fCBUSElTLmVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGlmKCAhZWxlbWVudCApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYoIGNiKGVsZW1lbnQpID09PSBmYWxzZSApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYoICFlbGVtZW50LmNoaWxkcmVuIClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBmb3IoIHZhciBpPTAsIGw9ZWxlbWVudC5jaGlsZHJlbi5sZW5ndGg7IGk8bDsgKytpICl7XHJcbiAgICAgICAgICAgIFRISVMuZm9yRWFjaCggY2IsIGVsZW1lbnQuY2hpbGRyZW5baV0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbk9iamVjdC5hc3NpZ24oRE9NLCBpbXBsKTtcclxuRE9NLnByb3RvdHlwZSA9IHByb3RvdHlwZShpbXBsKTtcclxuIiwiLypcclxuICBJJ3ZlIHdyYXBwZWQgTWFrb3RvIE1hdHN1bW90byBhbmQgVGFrdWppIE5pc2hpbXVyYSdzIGNvZGUgaW4gYSBuYW1lc3BhY2VcclxuICBzbyBpdCdzIGJldHRlciBlbmNhcHN1bGF0ZWQuIE5vdyB5b3UgY2FuIGhhdmUgbXVsdGlwbGUgcmFuZG9tIG51bWJlciBnZW5lcmF0b3JzXHJcbiAgYW5kIHRoZXkgd29uJ3Qgc3RvbXAgYWxsIG92ZXIgZWFjaG90aGVyJ3Mgc3RhdGUuXHJcbiAgXHJcbiAgSWYgeW91IHdhbnQgdG8gdXNlIHRoaXMgYXMgYSBzdWJzdGl0dXRlIGZvciBNYXRoLnJhbmRvbSgpLCB1c2UgdGhlIHJhbmRvbSgpXHJcbiAgbWV0aG9kIGxpa2Ugc286XHJcbiAgXHJcbiAgdmFyIG0gPSBuZXcgTWVyc2VubmVUd2lzdGVyKCk7XHJcbiAgdmFyIHJhbmRvbU51bWJlciA9IG0ucmFuZG9tKCk7XHJcbiAgXHJcbiAgWW91IGNhbiBhbHNvIGNhbGwgdGhlIG90aGVyIGdlbnJhbmRfe2Zvb30oKSBtZXRob2RzIG9uIHRoZSBpbnN0YW5jZS5cclxuICBJZiB5b3Ugd2FudCB0byB1c2UgYSBzcGVjaWZpYyBzZWVkIGluIG9yZGVyIHRvIGdldCBhIHJlcGVhdGFibGUgcmFuZG9tXHJcbiAgc2VxdWVuY2UsIHBhc3MgYW4gaW50ZWdlciBpbnRvIHRoZSBjb25zdHJ1Y3RvcjpcclxuICB2YXIgbSA9IG5ldyBNZXJzZW5uZVR3aXN0ZXIoMTIzKTtcclxuICBhbmQgdGhhdCB3aWxsIGFsd2F5cyBwcm9kdWNlIHRoZSBzYW1lIHJhbmRvbSBzZXF1ZW5jZS5cclxuICBTZWFuIE1jQ3VsbG91Z2ggKGJhbmtzZWFuQGdtYWlsLmNvbSlcclxuKi9cclxuXHJcbi8qIFxyXG4gICBBIEMtcHJvZ3JhbSBmb3IgTVQxOTkzNywgd2l0aCBpbml0aWFsaXphdGlvbiBpbXByb3ZlZCAyMDAyLzEvMjYuXHJcbiAgIENvZGVkIGJ5IFRha3VqaSBOaXNoaW11cmEgYW5kIE1ha290byBNYXRzdW1vdG8uXHJcbiBcclxuICAgQmVmb3JlIHVzaW5nLCBpbml0aWFsaXplIHRoZSBzdGF0ZSBieSB1c2luZyBpbml0X2dlbnJhbmQoc2VlZCkgIFxyXG4gICBvciBpbml0X2J5X2FycmF5KGluaXRfa2V5LCBrZXlfbGVuZ3RoKS5cclxuIFxyXG4gICBDb3B5cmlnaHQgKEMpIDE5OTcgLSAyMDAyLCBNYWtvdG8gTWF0c3Vtb3RvIGFuZCBUYWt1amkgTmlzaGltdXJhLFxyXG4gICBBbGwgcmlnaHRzIHJlc2VydmVkLiAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiBcclxuICAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XHJcbiAgIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uc1xyXG4gICBhcmUgbWV0OlxyXG4gXHJcbiAgICAgMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcclxuICAgICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXHJcbiBcclxuICAgICAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxyXG4gICAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcclxuICAgICAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxyXG4gXHJcbiAgICAgMy4gVGhlIG5hbWVzIG9mIGl0cyBjb250cmlidXRvcnMgbWF5IG5vdCBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBcclxuICAgICAgICBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZSB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gXHJcbiAgICAgICAgcGVybWlzc2lvbi5cclxuIFxyXG4gICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTXHJcbiAgIFwiQVMgSVNcIiBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1RcclxuICAgTElNSVRFRCBUTywgVEhFIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SXHJcbiAgIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELiAgSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBPV05FUiBPUlxyXG4gICBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCxcclxuICAgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLFxyXG4gICBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1JcclxuICAgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRlxyXG4gICBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElOR1xyXG4gICBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVNcclxuICAgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXHJcbiBcclxuIFxyXG4gICBBbnkgZmVlZGJhY2sgaXMgdmVyeSB3ZWxjb21lLlxyXG4gICBodHRwOi8vd3d3Lm1hdGguc2NpLmhpcm9zaGltYS11LmFjLmpwL35tLW1hdC9NVC9lbXQuaHRtbFxyXG4gICBlbWFpbDogbS1tYXQgQCBtYXRoLnNjaS5oaXJvc2hpbWEtdS5hYy5qcCAocmVtb3ZlIHNwYWNlKVxyXG4qL1xyXG5cclxudmFyIE1lcnNlbm5lVHdpc3RlciA9IGZ1bmN0aW9uKHNlZWQpIHtcclxuICBpZiAoc2VlZCA9PSB1bmRlZmluZWQpIHtcclxuICAgIHNlZWQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICB9IFxyXG4gIC8qIFBlcmlvZCBwYXJhbWV0ZXJzICovICBcclxuICB0aGlzLk4gPSA2MjQ7XHJcbiAgdGhpcy5NID0gMzk3O1xyXG4gIHRoaXMuTUFUUklYX0EgPSAweDk5MDhiMGRmOyAgIC8qIGNvbnN0YW50IHZlY3RvciBhICovXHJcbiAgdGhpcy5VUFBFUl9NQVNLID0gMHg4MDAwMDAwMDsgLyogbW9zdCBzaWduaWZpY2FudCB3LXIgYml0cyAqL1xyXG4gIHRoaXMuTE9XRVJfTUFTSyA9IDB4N2ZmZmZmZmY7IC8qIGxlYXN0IHNpZ25pZmljYW50IHIgYml0cyAqL1xyXG4gXHJcbiAgdGhpcy5tdCA9IG5ldyBBcnJheSh0aGlzLk4pOyAvKiB0aGUgYXJyYXkgZm9yIHRoZSBzdGF0ZSB2ZWN0b3IgKi9cclxuICB0aGlzLm10aT10aGlzLk4rMTsgLyogbXRpPT1OKzEgbWVhbnMgbXRbTl0gaXMgbm90IGluaXRpYWxpemVkICovXHJcblxyXG4gIHRoaXMuaW5pdF9nZW5yYW5kKHNlZWQpO1xyXG59ICBcclxuIFxyXG4vKiBpbml0aWFsaXplcyBtdFtOXSB3aXRoIGEgc2VlZCAqL1xyXG5NZXJzZW5uZVR3aXN0ZXIucHJvdG90eXBlLmluaXRfZ2VucmFuZCA9IGZ1bmN0aW9uKHMpIHtcclxuICB0aGlzLm10WzBdID0gcyA+Pj4gMDtcclxuICBmb3IgKHRoaXMubXRpPTE7IHRoaXMubXRpPHRoaXMuTjsgdGhpcy5tdGkrKykge1xyXG4gICAgICB2YXIgcyA9IHRoaXMubXRbdGhpcy5tdGktMV0gXiAodGhpcy5tdFt0aGlzLm10aS0xXSA+Pj4gMzApO1xyXG4gICB0aGlzLm10W3RoaXMubXRpXSA9ICgoKCgocyAmIDB4ZmZmZjAwMDApID4+PiAxNikgKiAxODEyNDMzMjUzKSA8PCAxNikgKyAocyAmIDB4MDAwMGZmZmYpICogMTgxMjQzMzI1MylcclxuICArIHRoaXMubXRpO1xyXG4gICAgICAvKiBTZWUgS251dGggVEFPQ1AgVm9sMi4gM3JkIEVkLiBQLjEwNiBmb3IgbXVsdGlwbGllci4gKi9cclxuICAgICAgLyogSW4gdGhlIHByZXZpb3VzIHZlcnNpb25zLCBNU0JzIG9mIHRoZSBzZWVkIGFmZmVjdCAgICovXHJcbiAgICAgIC8qIG9ubHkgTVNCcyBvZiB0aGUgYXJyYXkgbXRbXS4gICAgICAgICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAvKiAyMDAyLzAxLzA5IG1vZGlmaWVkIGJ5IE1ha290byBNYXRzdW1vdG8gICAgICAgICAgICAgKi9cclxuICAgICAgdGhpcy5tdFt0aGlzLm10aV0gPj4+PSAwO1xyXG4gICAgICAvKiBmb3IgPjMyIGJpdCBtYWNoaW5lcyAqL1xyXG4gIH1cclxufVxyXG4gXHJcbi8qIGluaXRpYWxpemUgYnkgYW4gYXJyYXkgd2l0aCBhcnJheS1sZW5ndGggKi9cclxuLyogaW5pdF9rZXkgaXMgdGhlIGFycmF5IGZvciBpbml0aWFsaXppbmcga2V5cyAqL1xyXG4vKiBrZXlfbGVuZ3RoIGlzIGl0cyBsZW5ndGggKi9cclxuLyogc2xpZ2h0IGNoYW5nZSBmb3IgQysrLCAyMDA0LzIvMjYgKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5pbml0X2J5X2FycmF5ID0gZnVuY3Rpb24oaW5pdF9rZXksIGtleV9sZW5ndGgpIHtcclxuICB2YXIgaSwgaiwgaztcclxuICB0aGlzLmluaXRfZ2VucmFuZCgxOTY1MDIxOCk7XHJcbiAgaT0xOyBqPTA7XHJcbiAgayA9ICh0aGlzLk4+a2V5X2xlbmd0aCA/IHRoaXMuTiA6IGtleV9sZW5ndGgpO1xyXG4gIGZvciAoOyBrOyBrLS0pIHtcclxuICAgIHZhciBzID0gdGhpcy5tdFtpLTFdIF4gKHRoaXMubXRbaS0xXSA+Pj4gMzApXHJcbiAgICB0aGlzLm10W2ldID0gKHRoaXMubXRbaV0gXiAoKCgoKHMgJiAweGZmZmYwMDAwKSA+Pj4gMTYpICogMTY2NDUyNSkgPDwgMTYpICsgKChzICYgMHgwMDAwZmZmZikgKiAxNjY0NTI1KSkpXHJcbiAgICAgICsgaW5pdF9rZXlbal0gKyBqOyAvKiBub24gbGluZWFyICovXHJcbiAgICB0aGlzLm10W2ldID4+Pj0gMDsgLyogZm9yIFdPUkRTSVpFID4gMzIgbWFjaGluZXMgKi9cclxuICAgIGkrKzsgaisrO1xyXG4gICAgaWYgKGk+PXRoaXMuTikgeyB0aGlzLm10WzBdID0gdGhpcy5tdFt0aGlzLk4tMV07IGk9MTsgfVxyXG4gICAgaWYgKGo+PWtleV9sZW5ndGgpIGo9MDtcclxuICB9XHJcbiAgZm9yIChrPXRoaXMuTi0xOyBrOyBrLS0pIHtcclxuICAgIHZhciBzID0gdGhpcy5tdFtpLTFdIF4gKHRoaXMubXRbaS0xXSA+Pj4gMzApO1xyXG4gICAgdGhpcy5tdFtpXSA9ICh0aGlzLm10W2ldIF4gKCgoKChzICYgMHhmZmZmMDAwMCkgPj4+IDE2KSAqIDE1NjYwODM5NDEpIDw8IDE2KSArIChzICYgMHgwMDAwZmZmZikgKiAxNTY2MDgzOTQxKSlcclxuICAgICAgLSBpOyAvKiBub24gbGluZWFyICovXHJcbiAgICB0aGlzLm10W2ldID4+Pj0gMDsgLyogZm9yIFdPUkRTSVpFID4gMzIgbWFjaGluZXMgKi9cclxuICAgIGkrKztcclxuICAgIGlmIChpPj10aGlzLk4pIHsgdGhpcy5tdFswXSA9IHRoaXMubXRbdGhpcy5OLTFdOyBpPTE7IH1cclxuICB9XHJcblxyXG4gIHRoaXMubXRbMF0gPSAweDgwMDAwMDAwOyAvKiBNU0IgaXMgMTsgYXNzdXJpbmcgbm9uLXplcm8gaW5pdGlhbCBhcnJheSAqLyBcclxufVxyXG4gXHJcbi8qIGdlbmVyYXRlcyBhIHJhbmRvbSBudW1iZXIgb24gWzAsMHhmZmZmZmZmZl0taW50ZXJ2YWwgKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5nZW5yYW5kX2ludDMyID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHk7XHJcbiAgdmFyIG1hZzAxID0gbmV3IEFycmF5KDB4MCwgdGhpcy5NQVRSSVhfQSk7XHJcbiAgLyogbWFnMDFbeF0gPSB4ICogTUFUUklYX0EgIGZvciB4PTAsMSAqL1xyXG5cclxuICBpZiAodGhpcy5tdGkgPj0gdGhpcy5OKSB7IC8qIGdlbmVyYXRlIE4gd29yZHMgYXQgb25lIHRpbWUgKi9cclxuICAgIHZhciBraztcclxuXHJcbiAgICBpZiAodGhpcy5tdGkgPT0gdGhpcy5OKzEpICAgLyogaWYgaW5pdF9nZW5yYW5kKCkgaGFzIG5vdCBiZWVuIGNhbGxlZCwgKi9cclxuICAgICAgdGhpcy5pbml0X2dlbnJhbmQoNTQ4OSk7IC8qIGEgZGVmYXVsdCBpbml0aWFsIHNlZWQgaXMgdXNlZCAqL1xyXG5cclxuICAgIGZvciAoa2s9MDtrazx0aGlzLk4tdGhpcy5NO2trKyspIHtcclxuICAgICAgeSA9ICh0aGlzLm10W2trXSZ0aGlzLlVQUEVSX01BU0spfCh0aGlzLm10W2trKzFdJnRoaXMuTE9XRVJfTUFTSyk7XHJcbiAgICAgIHRoaXMubXRba2tdID0gdGhpcy5tdFtrayt0aGlzLk1dIF4gKHkgPj4+IDEpIF4gbWFnMDFbeSAmIDB4MV07XHJcbiAgICB9XHJcbiAgICBmb3IgKDtrazx0aGlzLk4tMTtraysrKSB7XHJcbiAgICAgIHkgPSAodGhpcy5tdFtra10mdGhpcy5VUFBFUl9NQVNLKXwodGhpcy5tdFtraysxXSZ0aGlzLkxPV0VSX01BU0spO1xyXG4gICAgICB0aGlzLm10W2trXSA9IHRoaXMubXRba2srKHRoaXMuTS10aGlzLk4pXSBeICh5ID4+PiAxKSBeIG1hZzAxW3kgJiAweDFdO1xyXG4gICAgfVxyXG4gICAgeSA9ICh0aGlzLm10W3RoaXMuTi0xXSZ0aGlzLlVQUEVSX01BU0spfCh0aGlzLm10WzBdJnRoaXMuTE9XRVJfTUFTSyk7XHJcbiAgICB0aGlzLm10W3RoaXMuTi0xXSA9IHRoaXMubXRbdGhpcy5NLTFdIF4gKHkgPj4+IDEpIF4gbWFnMDFbeSAmIDB4MV07XHJcblxyXG4gICAgdGhpcy5tdGkgPSAwO1xyXG4gIH1cclxuXHJcbiAgeSA9IHRoaXMubXRbdGhpcy5tdGkrK107XHJcblxyXG4gIC8qIFRlbXBlcmluZyAqL1xyXG4gIHkgXj0gKHkgPj4+IDExKTtcclxuICB5IF49ICh5IDw8IDcpICYgMHg5ZDJjNTY4MDtcclxuICB5IF49ICh5IDw8IDE1KSAmIDB4ZWZjNjAwMDA7XHJcbiAgeSBePSAoeSA+Pj4gMTgpO1xyXG5cclxuICByZXR1cm4geSA+Pj4gMDtcclxufVxyXG4gXHJcbi8qIGdlbmVyYXRlcyBhIHJhbmRvbSBudW1iZXIgb24gWzAsMHg3ZmZmZmZmZl0taW50ZXJ2YWwgKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5nZW5yYW5kX2ludDMxID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuICh0aGlzLmdlbnJhbmRfaW50MzIoKT4+PjEpO1xyXG59XHJcbiBcclxuLyogZ2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBvbiBbMCwxXS1yZWFsLWludGVydmFsICovXHJcbk1lcnNlbm5lVHdpc3Rlci5wcm90b3R5cGUuZ2VucmFuZF9yZWFsMSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmdlbnJhbmRfaW50MzIoKSooMS4wLzQyOTQ5NjcyOTUuMCk7IFxyXG4gIC8qIGRpdmlkZWQgYnkgMl4zMi0xICovIFxyXG59XHJcblxyXG4vKiBnZW5lcmF0ZXMgYSByYW5kb20gbnVtYmVyIG9uIFswLDEpLXJlYWwtaW50ZXJ2YWwgKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5yYW5kb20gPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5nZW5yYW5kX2ludDMyKCkqKDEuMC80Mjk0OTY3Mjk2LjApOyBcclxuICAvKiBkaXZpZGVkIGJ5IDJeMzIgKi9cclxufVxyXG4gXHJcbi8qIGdlbmVyYXRlcyBhIHJhbmRvbSBudW1iZXIgb24gKDAsMSktcmVhbC1pbnRlcnZhbCAqL1xyXG5NZXJzZW5uZVR3aXN0ZXIucHJvdG90eXBlLmdlbnJhbmRfcmVhbDMgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gKHRoaXMuZ2VucmFuZF9pbnQzMigpICsgMC41KSooMS4wLzQyOTQ5NjcyOTYuMCk7IFxyXG4gIC8qIGRpdmlkZWQgYnkgMl4zMiAqL1xyXG59XHJcbiBcclxuLyogZ2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBvbiBbMCwxKSB3aXRoIDUzLWJpdCByZXNvbHV0aW9uKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5nZW5yYW5kX3JlczUzID0gZnVuY3Rpb24oKSB7IFxyXG4gIHZhciBhPXRoaXMuZ2VucmFuZF9pbnQzMigpPj4+NSwgYj10aGlzLmdlbnJhbmRfaW50MzIoKT4+PjY7IFxyXG4gIHJldHVybihhKjY3MTA4ODY0LjArYikqKDEuMC85MDA3MTk5MjU0NzQwOTkyLjApOyBcclxufSBcclxuXHJcbi8qIFRoZXNlIHJlYWwgdmVyc2lvbnMgYXJlIGR1ZSB0byBJc2FrdSBXYWRhLCAyMDAyLzAxLzA5IGFkZGVkICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lcnNlbm5lVHdpc3RlcjsiLCJpbXBvcnQgeyBpbmplY3QsIGJpbmQsIGdldEluc3RhbmNlT2YgfSBmcm9tICdkcnktZGknO1xyXG5pbXBvcnQgU3RyTGRyIGZyb20gJy4vc3RybGRyLmpzJztcclxuaW1wb3J0IElTdG9yZSBmcm9tICcuLi9zdG9yZS9JU3RvcmUuanMnO1xyXG5pbXBvcnQgRE9NIGZyb20gXCIuL2RyeS1kb20uanNcIjtcclxuaW1wb3J0IFBvb2wgZnJvbSAnLi9wb29sLmpzJztcclxuXHJcblxyXG5mdW5jdGlvbiByZWFkKCBzdHIsIGN0eCApe1xyXG5cclxuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdChcIi5cIiksIGk9MDtcclxuXHJcbiAgICB3aGlsZSggaTxwYXJ0cy5sZW5ndGggJiYgY3R4IClcclxuICAgICAgICBjdHggPSBjdHhbIHBhcnRzW2krK10gXTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGN0eDtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRNZXRob2QoIHN0ciwgY3R4LCAuLi5hcmdzICl7XHJcblxyXG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KFwiLlwiKSwgaT0wO1xyXG5cclxuICAgIHZhciBwY3R4ID0gY3R4O1xyXG5cclxuICAgIHdoaWxlKCBpPHBhcnRzLmxlbmd0aCAmJiBjdHggKXtcclxuICAgICAgICBwY3R4ID0gY3R4O1xyXG4gICAgICAgIGN0eCA9IGN0eFsgcGFydHNbaSsrXSBdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCBjdHggJiYgdHlwZW9mIGN0eCA9PT0gXCJmdW5jdGlvblwiIClcclxuICAgICAgICByZXR1cm4gY3R4LmJpbmQoIHBjdHgsIC4uLmFyZ3MgKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIG51bGw7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZSggc3RyLCB2YWx1ZSwgY3R4ICl7XHJcblxyXG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KFwiLlwiKSwgaT0wO1xyXG5cclxuICAgIHdoaWxlKHBhcnRzLmxlbmd0aC0xICYmIGN0eCl7XHJcbiAgICAgICAgaWYoICEocGFydHNbaV0gaW4gY3R4KSApXHJcbiAgICAgICAgICAgIGN0eFtwYXJ0c1tpXV0gPSB7fTtcclxuICAgICAgICBjdHggPSBjdHhbIHBhcnRzW2krK10gXTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYoIGN0eCApXHJcbiAgICAgICAgY3R4WyBwYXJ0c1tpXSBdID0gdmFsdWU7XHJcbiAgICBcclxuICAgIHJldHVybiAhIWN0eDtcclxuICAgIFxyXG59XHJcblxyXG5jb25zdCBwZW5kaW5nID0gW107XHJcbmxldCBuZXh0TW9kZWxJZCA9IDA7XHJcblxyXG5jbGFzcyBNb2RlbCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgbGlzdGVuZXJzID0ge307XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcclxuICAgICAgICB2YXIgY2hpbGRyZW4gPSB7fTtcclxuICAgICAgICB2YXIgcmV2Q2hpbGRyZW4gPSB7fTtcclxuICAgICAgICB2YXIgcGFyZW50cyA9IHt9O1xyXG5cclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIGRhdGEsIFwiX19tb2RlbF9fXCIsIHsgdmFsdWU6dGhpcywgd3JpdGFibGU6IGZhbHNlLCBlbnVtZXJhYmxlOiBmYWxzZSB9KTtcclxuICAgICAgICBcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyggdGhpcywge1xyXG4gICAgICAgICAgICByb290OnsgdmFsdWU6dGhpcywgZW51bWVyYWJsZTpmYWxzZSwgd3JpdGFibGU6dHJ1ZSB9LFxyXG4gICAgICAgICAgICBsaXN0ZW5lcnM6eyB2YWx1ZTpsaXN0ZW5lcnMsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UgfSxcclxuICAgICAgICAgICAgZGF0YTp7IHZhbHVlOmRhdGEsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICBjaGlsZHJlbjp7IHZhbHVlOmNoaWxkcmVuLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IGZhbHNlIH0sXHJcbiAgICAgICAgICAgIHJldkNoaWxkcmVuOnsgdmFsdWU6cmV2Q2hpbGRyZW4sIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UgfSxcclxuICAgICAgICAgICAgcGFyZW50czp7IHZhbHVlOnBhcmVudHMsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UgfSxcclxuICAgICAgICAgICAgaWQ6eyB2YWx1ZTogKytuZXh0TW9kZWxJZCwgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZSB9LFxyXG4gICAgICAgICAgICBkaXJ0eTp7XHJcbiAgICAgICAgICAgICAgICBnZXQ6KCkgPT4gdGhpcy5yb290Ll9fZGlydHksXHJcbiAgICAgICAgICAgICAgICBzZXQ6KCB2ICkgPT4gdGhpcy5yb290Ll9fZGlydHkgPSB2XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RvcmUoIGJpbmFyeT10cnVlICl7XHJcbiAgICAgICAgcmV0dXJuIFN0ckxkci5zdG9yZSggdGhpcy5kYXRhLCBiaW5hcnkgKTtcclxuICAgIH1cclxuXHJcbiAgICBsb2FkKCBkYXRhLCBkb1JhaXNlID0gdHJ1ZSApe1xyXG5cclxuICAgICAgICBpZiggdHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgKXtcclxuICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0gU3RyTGRyLmxvYWQoZGF0YSk7XHJcbiAgICAgICAgICAgIH1jYXRjaChleCl7fVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIGRhdGEgJiYgZGF0YS5idWZmZXIgJiYgZGF0YS5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciApe1xyXG4gICAgICAgICAgICBpZiggIShkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkgKVxyXG4gICAgICAgICAgICAgICAgZGF0YSA9IG5ldyBVaW50OEFycmF5KGRhdGEuYnVmZmVyKTtcclxuICAgICAgICAgICAgZGF0YSA9IFN0ckxkci5sb2FkKCBkYXRhLCB0cnVlICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IoIHZhciBrIGluIGRhdGEgKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRJdGVtKCBrLCBkYXRhW2tdLCBkb1JhaXNlICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0SXRlbSggaywgdiwgZG9SYWlzZSA9IHRydWUgKXtcclxuXHJcbiAgICAgICAgaWYoIGsuY2hhckNvZGVBdCApIGsgPSBrLnNwbGl0KFwiLlwiKTtcclxuICAgICAgICB2YXIgcHJvcCA9IGsuc2hpZnQoKSwgY2hpbGQ7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLmRhdGEsIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbiwgcmV2Q2hpbGRyZW4gPSB0aGlzLnJldkNoaWxkcmVuO1xyXG5cclxuICAgICAgICBpZiggay5sZW5ndGggKXtcclxuXHJcbiAgICAgICAgICAgIGNoaWxkID0gY2hpbGRyZW5bcHJvcF07XHJcbiAgICAgICAgICAgIGlmKCAhY2hpbGQgKXtcclxuICAgICAgICAgICAgICAgIGNoaWxkID0gY2hpbGRyZW5bcHJvcF0gPSBuZXcgTW9kZWwoKTtcclxuICAgICAgICAgICAgICAgIGNoaWxkLnJvb3QgPSB0aGlzLnJvb3Q7XHJcbiAgICAgICAgICAgICAgICBjaGlsZC5wYXJlbnRzWyB0aGlzLmlkIF0gPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgZGF0YVtwcm9wXSA9IGNoaWxkLmRhdGE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldkNoaWxkcmVuWyBjaGlsZC5pZCBdID0gW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yYWlzZSggcHJvcCwgZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuW3Byb3BdLnNldEl0ZW0oIGssIHYsIGRvUmFpc2UgKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggY2hpbGRyZW5bcHJvcF0gKXtcclxuXHJcbiAgICAgICAgICAgIGlmKCBjaGlsZHJlbltwcm9wXS5kYXRhICE9PSB2IClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGNoaWxkID0gY2hpbGRyZW5bcHJvcF07XHJcblxyXG4gICAgICAgICAgICBsZXQgaW5kZXggPSByZXZDaGlsZHJlblsgY2hpbGQuaWQgXS5pbmRleE9mKHByb3ApO1xyXG4gICAgICAgICAgICBpZiggaW5kZXggPT09IC0xIClcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludGVncml0eSBjb21wcm9taXNlZFwiKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldkNoaWxkcmVuWyBjaGlsZC5pZCBdLnNwbGljZSggaW5kZXgsIDEgKTtcclxuXHJcbiAgICAgICAgICAgIGRlbGV0ZSBjaGlsZC5wYXJlbnRzWyB0aGlzLmlkIF07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIHYgJiYgdHlwZW9mIHYgPT0gXCJvYmplY3RcIiApe1xyXG5cclxuICAgICAgICAgICAgdmFyIGRvTG9hZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiggIXYuX19tb2RlbF9fICl7XHJcbiAgICAgICAgICAgICAgICBjaGlsZCA9IG5ldyBNb2RlbCgpO1xyXG4gICAgICAgICAgICAgICAgY2hpbGQucm9vdCA9IHRoaXMucm9vdDtcclxuICAgICAgICAgICAgICAgIGRvTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgY2hpbGQgPSB2Ll9fbW9kZWxfXztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYoICFyZXZDaGlsZHJlblsgY2hpbGQuaWQgXSApIHJldkNoaWxkcmVuWyBjaGlsZC5pZCBdID0gWyBwcm9wIF07XHJcbiAgICAgICAgICAgIGVsc2UgcmV2Q2hpbGRyZW5bIGNoaWxkLmlkIF0ucHVzaCggcHJvcCApO1xyXG4gICAgICAgICAgICBjaGlsZHJlblsgcHJvcCBdID0gY2hpbGQ7XHJcbiAgICAgICAgICAgIGNoaWxkLnBhcmVudHNbIHRoaXMuaWQgXSA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICBpZiggZG9Mb2FkICl7XHJcbiAgICAgICAgICAgICAgICBjaGlsZC5sb2FkKCB2LCBmYWxzZSApO1xyXG4gICAgICAgICAgICAgICAgY2hpbGQuZGF0YSA9IHY7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHYsIFwiX19tb2RlbF9fXCIsIHsgdmFsdWU6Y2hpbGQsIHdyaXRhYmxlOiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGF0YVsgcHJvcCBdID0gdjtcclxuXHJcbiAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5yYWlzZSggcHJvcCwgZG9SYWlzZSApO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TW9kZWwoIGssIGNyZWF0ZSApe1xyXG5cclxuICAgICAgICBpZiggay5jaGFyQ29kZUF0IClcclxuICAgICAgICAgICAgayA9IGsuc3BsaXQoXCIuXCIpO1xyXG5cclxuICAgICAgICB2YXIgY3R4ID0gdGhpcywgaSA9IDA7XHJcbiAgICAgICAgaWYoIGNyZWF0ZSApe1xyXG4gICAgICAgICAgICB3aGlsZSggY3R4ICYmIGk8ay5sZW5ndGggKXtcclxuICAgICAgICAgICAgICAgIGlmKCAhY3R4LmNoaWxkcmVuW2tbaV1dIClcclxuICAgICAgICAgICAgICAgICAgICBjdHguc2V0SXRlbShrW2ldLCB7fSk7XHJcbiAgICAgICAgICAgICAgICBjdHggPSBjdHguY2hpbGRyZW5bIGtbaSsrXSBdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHdoaWxlKCBjdHggJiYgaTxrLmxlbmd0aCApXHJcbiAgICAgICAgICAgICAgICBjdHggPSBjdHguY2hpbGRyZW5bIGtbaSsrXSBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGN0eDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0SXRlbSggaywgZGVmYXVsdFZhbHVlICl7XHJcbiAgICAgICAgdmFyIHYgPSByZWFkKCBrLCB0aGlzLmRhdGEgKTtcclxuICAgICAgICBpZiggdiA9PT0gdW5kZWZpbmVkICkgdiA9IGRlZmF1bHRWYWx1ZTtcclxuICAgICAgICByZXR1cm4gdjtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVJdGVtKGssIGNiKXtcclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IGsuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIHZhciBrZXkgPSBwYXJlbnQucG9wKCk7XHJcblxyXG4gICAgICAgIHZhciBtb2RlbCA9IHRoaXMuZ2V0TW9kZWwoIHBhcmVudCApO1xyXG4gICAgICAgIHZhciBkYXRhID0gbW9kZWwuZGF0YSwgY2hpbGRyZW4gPSBtb2RlbC5jaGlsZHJlbjtcclxuXHJcbiAgICAgICAgaWYoICEoa2V5IGluIGRhdGEpICkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiggY2hpbGRyZW5ba2V5XSApe1xyXG5cclxuICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5ba2V5XSwgXHJcbiAgICAgICAgICAgICAgICByZXZDaGlsZHJlbiA9IG1vZGVsLnJldkNoaWxkcmVuW2NoaWxkLmlkXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHJldkNoaWxkcmVuLmluZGV4T2YoIGtleSApO1xyXG4gICAgICAgICAgICBpZiggaW5kZXggPT0gLTEgKSB0aHJvdyBcIkludGVncml0eSBjb21wcm9taXNlZFwiO1xyXG5cclxuICAgICAgICAgICAgcmV2Q2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCByZXZDaGlsZHJlbi5sZW5ndGggPT0gMCApe1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNoaWxkLnBhcmVudHNbIG1vZGVsLmlkIF07XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgbW9kZWwucmV2Q2hpbGRyZW5bY2hpbGQuaWRdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkZWxldGUgY2hpbGRyZW5ba2V5XTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkZWxldGUgZGF0YVtrZXldO1xyXG5cclxuICAgICAgICBtb2RlbC5yYWlzZSgga2V5LCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmFpc2UoaywgZG9SYWlzZSl7XHJcblxyXG4gICAgICAgIHBlbmRpbmdbcGVuZGluZy5sZW5ndGgrK10gPSB7bW9kZWw6dGhpcywga2V5Omt9O1xyXG5cclxuICAgICAgICBpZiggIWRvUmFpc2UgKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGZvciggdmFyIGkgPSAwLCBsPXBlbmRpbmcubGVuZ3RoOyBpPGw7ICsraSApe1xyXG5cclxuICAgICAgICAgICAgayA9IHBlbmRpbmdbaV0ua2V5O1xyXG4gICAgICAgICAgICB2YXIgbW9kZWwgPSBwZW5kaW5nW2ldLm1vZGVsO1xyXG5cclxuICAgICAgICAgICAgaWYoIGsgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBkaXNwYXRjaCggbW9kZWwubGlzdGVuZXJzW2tdLCBtb2RlbC5kYXRhW2tdLCBrICk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciggdmFyIHBpZCBpbiBtb2RlbC5wYXJlbnRzICl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBtb2RlbC5wYXJlbnRzWyBwaWQgXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmV2Q2hpbGRyZW4gPSBwYXJlbnQucmV2Q2hpbGRyZW5bIG1vZGVsLmlkIF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoICFyZXZDaGlsZHJlbiApIHRocm93IFwiSW50ZWdyaXR5IGNvbXByb21pc2VkXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciggdmFyIGogPSAwLCByY2wgPSByZXZDaGlsZHJlbi5sZW5ndGg7IGo8cmNsOyArK2ogKXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKCBwYXJlbnQubGlzdGVuZXJzWyByZXZDaGlsZHJlbltqXSBdLCBwYXJlbnQuZGF0YSwgcmV2Q2hpbGRyZW5bal0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBlbmRpbmcubGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZGlzcGF0Y2goIGxpc3RlbmVycywgdmFsdWUsIGtleSApe1xyXG5cclxuICAgICAgICAgICAgaWYoICFsaXN0ZW5lcnMgKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgZm9yKCB2YXIgaT0wLCBsPWxpc3RlbmVycy5sZW5ndGg7IGk8bDsgKytpIClcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tpXSggdmFsdWUsIGtleSApO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBhdHRhY2goIGs6U3RyaW5nLCBjYjpGdW5jdGlvbiApXHJcbiAgICAvLyBsaXN0ZW4gdG8gbm90aWZpY2F0aW9ucyBmcm9tIGEgcGFydGljdWxhciBrZXlcclxuICAgIC8vIGF0dGFjaCggY2I6RnVuY3Rpb24gKVxyXG4gICAgLy8gbGlzdGVuIHRvIGtleSBhZGRpdGlvbnMvcmVtb3ZhbHNcclxuICAgIGF0dGFjaChrLCBjYil7XHJcbiAgICAgICAgdmFyIGtleSA9IGsuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIHZhciBtb2RlbDtcclxuICAgICAgICBpZigga2V5Lmxlbmd0aCA9PSAxICl7XHJcbiAgICAgICAgICAgIGtleSA9IGs7XHJcbiAgICAgICAgICAgIG1vZGVsID0gdGhpcztcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgayA9IGtleS5wb3AoKTtcclxuICAgICAgICAgICAgbW9kZWwgPSB0aGlzLmdldE1vZGVsKCBrZXksIHRydWUgKTtcclxuICAgICAgICAgICAga2V5ID0gaztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoICFtb2RlbC5saXN0ZW5lcnNba2V5XSApXHJcbiAgICAgICAgICAgIG1vZGVsLmxpc3RlbmVyc1trZXldID0gWyBjYiBdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgbW9kZWwubGlzdGVuZXJzW2tleV0ucHVzaChjYik7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIHN0b3AgbGlzdGVuaW5nXHJcbiAgICBkZXRhY2goaywgY2Ipe1xyXG5cclxuICAgICAgICB2YXIgaW5kZXgsIGxpc3RlbmVycztcclxuXHJcbiAgICAgICAgaWYoIHR5cGVvZiBrID09IFwiZnVuY3Rpb25cIiApe1xyXG4gICAgICAgICAgICBjYiA9IGs7XHJcbiAgICAgICAgICAgIGsgPSBcIlwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnNba107XHJcbiAgICAgICAgaWYoICFsaXN0ZW5lcnNba10gKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2IpO1xyXG4gICAgICAgIGlmKCBpbmRleCA9PSAtMSApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBcclxuICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKCBpbmRleCwgMSApO1xyXG5cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmNvbnN0IGNhY2hlID0ge307XHJcblxyXG5jbGFzcyBJVmlldyB7XHJcblxyXG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xyXG4gICAgICAgIHBhcmVudEVsZW1lbnQ6XCJQYXJlbnRFbGVtZW50XCIsXHJcbiAgICAgICAgbW9kZWw6W01vZGVsLHtzY29wZToncm9vdCd9XVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCBjb250cm9sbGVyICl7XHJcblxyXG4gICAgICAgIHZhciBsYXlvdXQgPSBcImxheW91dHMvXCIgKyBjb250cm9sbGVyLmNvbnN0cnVjdG9yLm5hbWUgKyBcIi5odG1sXCI7XHJcbiAgICAgICAgdGhpcy5jb250cm9sbGVyID0gY29udHJvbGxlcjtcclxuICAgICAgICB0aGlzLmRvbSA9IG51bGw7XHJcblxyXG4gICAgICAgIGlmKCAhY2FjaGVbbGF5b3V0XSApe1xyXG5cclxuICAgICAgICAgICAgZmV0Y2goIGxheW91dCApXHJcbiAgICAgICAgICAgIC50aGVuKCAocnNwKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoICFyc3Aub2sgJiYgcnNwLnN0YXR1cyAhPT0gMCApIHRocm93IG5ldyBFcnJvcihcIk5vdCBPSyFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcnNwLnRleHQoKTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKCB0ZXh0ID0+IChuZXcgd2luZG93LkRPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcodGV4dCwgXCJ0ZXh0L2h0bWxcIikpXHJcbiAgICAgICAgICAgIC50aGVuKChodG1sKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZVsgbGF5b3V0IF0gPSBodG1sO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkTGF5b3V0KCBodG1sICk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKCAoZXgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQuaW5uZXJIVE1MID0gYDxkaXY+YCArIChleC5tZXNzYWdlIHx8IGV4KSArIGA6ICR7bGF5b3V0fSE8L2Rpdj5gO1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH1lbHNlIFxyXG4gICAgICAgICAgICB0aGlzLmxvYWRMYXlvdXQoIGNhY2hlW2xheW91dF0gKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbG9hZExheW91dCggZG9jICl7XHJcbiAgICAgICAgZG9jID0gZG9jLmNsb25lTm9kZSh0cnVlKTtcclxuICAgICAgICBbLi4uZG9jLmJvZHkuY2hpbGRyZW5dLmZvckVhY2goIGNoaWxkID0+IHRoaXMucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZChjaGlsZCkgKTtcclxuXHJcbiAgICAgICAgdmFyIGRvbSA9IG5ldyBET00oIHRoaXMucGFyZW50RWxlbWVudCApO1xyXG4gICAgICAgIHRoaXMuZG9tID0gZG9tO1xyXG5cclxuICAgICAgICBwcmVwYXJlRE9NKCBkb20sIHRoaXMuY29udHJvbGxlciwgdGhpcy5tb2RlbCApO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZURPTSggZG9tLCBjb250cm9sbGVyLCBfbW9kZWwgKXtcclxuXHJcbiAgICBkb20uZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xyXG5cclxuICAgICAgICBpZiggZWxlbWVudC5kYXRhc2V0LnNyYyAmJiAhZWxlbWVudC5kYXRhc2V0LmluamVjdCApe1xyXG4gICAgICAgICAgICBzd2l0Y2goIGVsZW1lbnQudGFnTmFtZSApe1xyXG4gICAgICAgICAgICBjYXNlICdVTCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ09MJzpcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IGVsZW1lbnQuY2xvbmVOb2RlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgX21vZGVsLmF0dGFjaCggZWxlbWVudC5kYXRhc2V0LnNyYywgcmVuZGVyTGlzdC5iaW5kKCBlbGVtZW50LCB0ZW1wbGF0ZSApICk7XHJcbiAgICAgICAgICAgICAgICByZW5kZXJMaXN0KCBlbGVtZW50LCB0ZW1wbGF0ZSwgX21vZGVsLmdldEl0ZW0oIGVsZW1lbnQuZGF0YXNldC5zcmMgKSApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yKCB2YXIgaT0wOyBpPGVsZW1lbnQuYXR0cmlidXRlcy5sZW5ndGg7ICsraSApe1xyXG4gICAgICAgICAgICB2YXIga2V5ID0gZWxlbWVudC5hdHRyaWJ1dGVzW2ldLm5hbWU7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVsZW1lbnQuYXR0cmlidXRlc1tpXS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IGtleS5zcGxpdChcIi1cIik7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiggcGFydHMubGVuZ3RoID09IDIgKVxyXG4gICAgICAgICAgICAgICAgc3dpdGNoKCBwYXJ0c1sxXSApe1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNhbGxcIjpcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gcmVhZE1ldGhvZCggdmFsdWUsIGNvbnRyb2xsZXIsIGRvbSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCB0YXJnZXQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIHBhcnRzWzBdLCB0YXJnZXQgKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkNvdWxkIG5vdCBiaW5kIGV2ZW50IHRvIFwiICsgY29udHJvbGxlci5jb25zdHJ1Y3Rvci5uYW1lICsgXCIuXCIgKyBuYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInRvZ2dsZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2cGFydHMgPSB2YWx1ZS5tYXRjaCgvXihbXkBdKylcXEAoW149XSspXFw9KC4rKSQvKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiggdnBhcnRzIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmluZFRvZ2dsZSggZWxlbWVudCwgcGFydHNbMF0sIHZwYXJ0cyApO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQ291bGQgbm90IHBhcnNlIHRvZ2dsZTogXCIgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG1lbW8gPSB7IF9fc3JjOnZhbHVlLCBfX2huZDowIH07XHJcbiAgICAgICAgICAgIHZhbHVlLnJlcGxhY2UoL1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLCBiaW5kQXR0cmlidXRlLmJpbmQoIG51bGwsIGVsZW1lbnQuYXR0cmlidXRlc1tpXSwgbWVtbyApKTtcclxuICAgICAgICAgICAgdXBkYXRlQXR0cmlidXRlKCBlbGVtZW50LmF0dHJpYnV0ZXNbaV0sIG1lbW8gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCBlbGVtZW50LmRhdGFzZXQuaW5qZWN0ICYmIGVsZW1lbnQgIT0gZG9tLmVsZW1lbnQgKXtcclxuXHJcbiAgICAgICAgICAgIGxldCBjaGlsZERvbSA9IG5ldyBET00oZWxlbWVudCk7XHJcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oIGNoaWxkRG9tLCBjaGlsZERvbS5pbmRleChcImlkXCIpICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgY3RybCA9IGdldEluc3RhbmNlT2YoIGVsZW1lbnQuZGF0YXNldC5pbmplY3QsIGNoaWxkRG9tICk7XHJcbiAgICAgICAgICAgIGRvbVtlbGVtZW50LmRhdGFzZXQuaW5qZWN0XSA9IGN0cmw7XHJcblxyXG4gICAgICAgICAgICBwcmVwYXJlRE9NKCBjaGlsZERvbSwgY3RybCApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBiaW5kVG9nZ2xlKCBlbGVtZW50LCBldmVudCwgY21kICl7XHJcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBldmVudCwgKCk9PntcclxuICAgICAgICAgICAgWy4uLmRvbS5lbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoY21kWzFdKV0uZm9yRWFjaCggdGFyZ2V0ID0+IHRhcmdldC5zZXRBdHRyaWJ1dGUoY21kWzJdLCBjbWRbM10pICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHJlbmRlckxpc3QoIGVsZW1lbnQsIHRlbXBsYXRlLCBhcnIgKXtcclxuXHJcbiAgICAgICAgd2hpbGUoIGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoIClcclxuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVDaGlsZCggZWxlbWVudC5jaGlsZHJlblswXSApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciggdmFyIGtleSBpbiBhcnIgKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBjaGlsZE1vZGVsID0gbmV3IE1vZGVsKCk7XHJcbiAgICAgICAgICAgIGNoaWxkTW9kZWwubG9hZCggX21vZGVsLmRhdGEgKTtcclxuICAgICAgICAgICAgY2hpbGRNb2RlbC5zZXRJdGVtKFwia2V5XCIsIGtleSk7XHJcbiAgICAgICAgICAgIGNoaWxkTW9kZWwuc2V0SXRlbShcInZhbHVlXCIsIGFycltrZXldKTtcclxuICAgICAgICAgICAgY2hpbGRNb2RlbC5yb290ID0gX21vZGVsLnJvb3Q7XHJcblxyXG4gICAgICAgICAgICBbLi4udGVtcGxhdGUuY2xvbmVOb2RlKHRydWUpLmNoaWxkcmVuXS5mb3JFYWNoKGNoaWxkID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBjaGlsZCApO1xyXG4gICAgICAgICAgICAgICAgcHJlcGFyZURPTSggbmV3IERPTShjaGlsZCksIGNvbnRyb2xsZXIsIGNoaWxkTW9kZWwgKTtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGJpbmRBdHRyaWJ1dGUoIGF0dHIsIG1lbW8sIG1hdGNoLCBpbm5lciApe1xyXG5cclxuICAgICAgICBpZiggaW5uZXIgaW4gbWVtbyApIHJldHVybiBcIlwiO1xyXG5cclxuICAgICAgICBfbW9kZWwuYXR0YWNoKCBpbm5lciwgKHZhbHVlKT0+e1xyXG4gICAgICAgICAgICBtZW1vW2lubmVyXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICBpZiggbWVtby5fX2huZCApIHJldHVybjtcclxuICAgICAgICAgICAgbWVtby5fX2huZCA9IHNldFRpbWVvdXQoIHVwZGF0ZUF0dHJpYnV0ZS5iaW5kKCBudWxsLCBhdHRyLCBtZW1vICksIDEgKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbWVtb1tpbm5lcl0gPSBfbW9kZWwuZ2V0SXRlbShpbm5lcik7XHJcblxyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1cGRhdGVBdHRyaWJ1dGUoIGF0dHIsIG1lbW8gKXtcclxuICAgICAgICBtZW1vLl9faG5kID0gMDtcclxuICAgICAgICBhdHRyLnZhbHVlID0gbWVtby5fX3NyYy5yZXBsYWNlKFxyXG5cdFx0L1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLFxyXG5cdCAgICAobWF0Y2gsIHBhdGgpID0+IHR5cGVvZiBtZW1vW3BhdGhdID09IFwib2JqZWN0XCIgP1xyXG5cdFx0SlNPTi5zdHJpbmdpZnkobWVtb1twYXRoXSlcclxuXHRcdDogbWVtb1twYXRoXVxyXG5cdCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG52YXIgZGVmYXVsdE1vZGVsID0gbnVsbDtcclxuXHJcbmNsYXNzIElDb250cm9sbGVyIHtcclxuXHJcbiAgICBzdGF0aWMgXCJAaW5qZWN0XCIgPSB7XHJcbiAgICAgICAgdmlld0ZhY3Rvcnk6SVZpZXcsXHJcbiAgICAgICAgcG9vbDpcInBvb2xcIixcclxuICAgICAgICBtb2RlbDpNb2RlbFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCApe1xyXG5cclxuICAgICAgICB0aGlzLnBvb2wuYWRkKHRoaXMpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBfc2hvdygpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiY3JlYXRlZCB2aWV3XCIpO1xyXG4gICAgICAgIHRoaXMucG9vbC5jYWxsKCBcInNldEFjdGl2ZVZpZXdcIiwgbnVsbCApO1x0XHJcbiAgICAgICAgdmFyIHZpZXcgPSB0aGlzLnZpZXdGYWN0b3J5KCB0aGlzICk7XHJcbiAgICAgICAgcmV0dXJuIHZpZXc7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gYm9vdCggeyBtYWluLCBlbGVtZW50LCBjb21wb25lbnRzLCBlbnRpdGllcyB9ICl7XHJcblxyXG4gICAgYmluZChQb29sKS50bygncG9vbCcpLnNpbmdsZXRvbigpO1xyXG4gICAgYmluZChNb2RlbCkudG8oTW9kZWwpLndpdGhUYWdzKHtzY29wZToncm9vdCd9KS5zaW5nbGV0b24oKTtcclxuXHJcbiAgICBmb3IoIHZhciBrIGluIGNvbXBvbmVudHMgKVxyXG4gICAgICAgIGJpbmQoIGNvbXBvbmVudHNba10gKS50byggayApO1xyXG5cclxuICAgIGZvciggdmFyIGsgaW4gZW50aXRpZXMgKXtcclxuICAgICAgICB2YXIgY3RybCA9IGVudGl0aWVzW2tdO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBcIkFkZGluZyBlbnRpdHkgXCIgKyBrLCBjdHJsICk7XHJcbiAgICAgICAgYmluZChjdHJsKS50byhJQ29udHJvbGxlcik7XHJcbiAgICAgICAgYmluZChJVmlldylcclxuICAgICAgICAgICAgLnRvKElWaWV3KVxyXG4gICAgICAgICAgICAuaW5qZWN0aW5nKFxyXG4gICAgICAgICAgICAgICAgW2RvY3VtZW50LmJvZHksICdQYXJlbnRFbGVtZW50J11cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAud2l0aFRhZ3Moe2NvbnRyb2xsZXI6Y3RybH0pXHJcbiAgICAgICAgICAgIC5mYWN0b3J5KCk7IFxyXG4gICAgfVxyXG5cclxuICAgIGJpbmQobWFpbikudG8obWFpbikuaW5qZWN0aW5nKFtuZXcgRE9NKGVsZW1lbnQpLCBET01dKTtcclxuICAgIGdldEluc3RhbmNlT2YoIG1haW4gKTtcclxuXHJcbn1cclxuXHJcblxyXG5leHBvcnQgeyBNb2RlbCwgSVZpZXcsIElDb250cm9sbGVyLCBib290IH07XHJcblxyXG4iLCJ2YXIgbmV4dFVJRCA9IDA7XHJcblxyXG5mdW5jdGlvbiBnZXRVSUQoKXtcclxuICAgIHJldHVybiArK25leHRVSUQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBvb2woKSB7XHJcbiAgICB2YXIgbWV0aG9kcyA9IHtcclxuICAgICAgICBjb25zdHJ1Y3RvcjogW11cclxuICAgIH07XHJcbiAgICB2YXIgc2lsZW5jZSA9IHtcclxuICAgICAgICBcIm9uVGlja1wiOiAxLFxyXG4gICAgICAgIFwib25Qb3N0VGlja1wiOiAxLFxyXG4gICAgICAgIFwib25SZW5kZXJcIjogMVxyXG4gICAgfTtcclxuICAgIHZhciBkZWJ1ZyA9IG51bGw7XHJcbiAgICB2YXIgcHJveGllcyA9IFtdO1xyXG4gICAgdmFyIGNvbnRlbnRzID0ge307XHJcblxyXG4gICAgZnVuY3Rpb24gb25FdmVudChlKSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHZhciBuYW1lcyA9ICh0YXJnZXQuY2xhc3NOYW1lIHx8IFwiXCIpLnNwbGl0KC9cXHMrLykuZmlsdGVyKGZ1bmN0aW9uKG4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG4ubGVuZ3RoID4gMDtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGV2ZW50ID0gZS50eXBlO1xyXG4gICAgICAgIGV2ZW50ID0gZXZlbnQuc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyBldmVudC5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIHdoaWxlICh0YXJnZXQpIHtcclxuICAgICAgICAgICAgdmFyIGlkID0gdGFyZ2V0LmlkO1xyXG4gICAgICAgICAgICBpZiAodGFyZ2V0Lm9uY2xpY2spIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgICAgICBpZCA9IGlkLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpICsgaWQuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpID0gMCxcclxuICAgICAgICAgICAgICAgICAgICBuYW1lO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5hbWVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChuYW1lID0gbmFtZXNbaSsrXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMCwgMSkudG9VcHBlckNhc2UoKSArIG5hbWUuc3Vic3RyKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkJChcIm9uXCIgKyBldmVudCArIGlkICsgbmFtZSwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICQkKFwib25cIiArIGV2ZW50ICsgaWQsIHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50cyA9IGZ1bmN0aW9uKHRhcmdldCwgYXJncykge1xyXG4gICAgICAgIGlmICghYXJncyAmJiB0YXJnZXQgJiYgRE9DLnR5cGVPZih0YXJnZXQpID09IFwiYXJyYXlcIikge1xyXG4gICAgICAgICAgICBhcmdzID0gdGFyZ2V0O1xyXG4gICAgICAgICAgICB0YXJnZXQgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRhcmdldCkgdGFyZ2V0ID0gZG9jdW1lbnQuYm9keTtcclxuICAgICAgICBpZiAoIWFyZ3MpIHtcclxuICAgICAgICAgICAgYXJncyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrIGluIHRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG0gPSBrLm1hdGNoKC9eb24oLispLyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW0pIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKG1bMV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbihhcmcpIHtcclxuICAgICAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoYXJnLCBvbkV2ZW50KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5kZWJ1ZyA9IGZ1bmN0aW9uKG0pIHtcclxuICAgICAgICBkZWJ1ZyA9IG07XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2lsZW5jZSA9IGZ1bmN0aW9uKG0pIHtcclxuICAgICAgICBzaWxlbmNlW21dID0gMTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5hZGRQcm94eSA9IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIGlmIChvYmogJiYgb2JqLmNhbGwpIHByb3hpZXMucHVzaChvYmopO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlbW92ZVByb3h5ID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgdmFyIGkgPSBwcm94aWVzLmluZGV4T2Yob2JqKTtcclxuICAgICAgICBpZiAoaSA9PSAtMSkgcmV0dXJuO1xyXG4gICAgICAgIHByb3hpZXMuc3BsaWNlKGksIDEpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uKG9iaiwgZW5hYmxlRGlyZWN0TXNnKSB7XHJcbiAgICAgICAgaWYgKCFvYmopIHJldHVybjtcclxuICAgICAgICBpZiAoZGVidWcgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT0gZGVidWcpIGNvbnNvbGUubG9nKFwiYWRkXCIsIG9iaik7XHJcblxyXG4gICAgICAgIGlmICghKFwiX191aWRcIiBpbiBvYmopKSBvYmouX191aWQgPSBnZXRVSUQoKTtcclxuXHJcbiAgICAgICAgaWYgKCEoXCJfX3VpZFwiIGluIG9iaikpIGNvbnNvbGUud2FybihcIkNvdWxkIG5vdCBhZGQgX191aWQgdG8gXCIsIG9iaiwgb2JqLmNvbnN0cnVjdG9yLm5hbWUpO1xyXG5cclxuICAgICAgICBjb250ZW50c1tvYmouX191aWRdID0gb2JqO1xyXG4gICAgICAgIHZhciBjbGF6eiA9IG9iai5jb25zdHJ1Y3RvcjtcclxuICAgICAgICBpZiAob2JqLm1ldGhvZHMgfHwgY2xhenoubWV0aG9kcykge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gb2JqLm1ldGhvZHMgfHwgY2xhenoubWV0aG9kcztcclxuICAgICAgICAgICAgaWYgKCEoYXJyIGluc3RhbmNlb2YgQXJyYXkpKSBhcnIgPSBPYmplY3Qua2V5cyhhcnIpO1xyXG4gICAgICAgICAgICB2YXIgbCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbSA9IGFycltpXTtcclxuICAgICAgICAgICAgICAgIGlmIChtICYmIG1bMF0gIT0gXCJfXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbihvYmosIG0sIGVuYWJsZURpcmVjdE1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNsYXp6Lm1ldGFbbV0gJiYgY2xhenoubWV0YVttXS5zaWxlbmNlKSB0aGlzLnNpbGVuY2UobSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IHt9LCBjb2JqID0gb2JqO1xyXG4gICAgICAgICAgICBkb3tcclxuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oIHByb3BlcnRpZXMsIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKGNvYmopICk7XHJcbiAgICAgICAgICAgIH13aGlsZSggY29iaiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihjb2JqKSApO1xyXG5cclxuICAgICAgICAgICAgZm9yICggdmFyIGsgaW4gcHJvcGVydGllcyApIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqW2tdICE9IFwiZnVuY3Rpb25cIikgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoayAmJiBrWzBdICE9IFwiX1wiKSB0aGlzLmxpc3RlbihvYmosIGspO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIGlmIChvYmouY29uc3RydWN0b3IubmFtZSA9PSBkZWJ1ZykgY29uc29sZS5sb2coXCJyZW1vdmVcIiwgb2JqKTtcclxuXHJcbiAgICAgICAgZGVsZXRlIGNvbnRlbnRzW29iai5fX3VpZF07XHJcblxyXG5cdGlmKCBvYmoubWV0aG9kcyB8fCBvYmouY29uc3RydWN0b3IubWV0aG9kcyApe1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrIGluIChvYmoubWV0aG9kcyB8fCBvYmouY29uc3RydWN0b3IubWV0aG9kcykgKVxyXG5cdFx0dGhpcy5tdXRlKG9iaiwgayk7XHJcblx0fWVsc2V7XHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0ge30sIGNvYmogPSBvYmo7XHJcbiAgICAgICAgICAgIGRve1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiggcHJvcGVydGllcywgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoY29iaikgKTtcclxuICAgICAgICAgICAgfXdoaWxlKCBjb2JqID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGNvYmopICk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCB2YXIgayBpbiBwcm9wZXJ0aWVzIClcclxuXHRcdHRoaXMubXV0ZShvYmosIGspO1xyXG5cdH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5wb2xsID0gZnVuY3Rpb24odCkge1xyXG4gICAgICAgIGlmICghdCkgcmV0dXJuIGNvbnRlbnRzO1xyXG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoY29udGVudHMpO1xyXG4gICAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgICAgIGZvciAoOyBjb3VudCA8IGtleXMubGVuZ3RoOyArK2NvdW50KVxyXG4gICAgICAgIHJldC5wdXNoKHQoY29udGVudHNba2V5c1tjb3VudF1dKSk7XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5saXN0ZW4gPSBmdW5jdGlvbihvYmosIG5hbWUsIGVuYWJsZURpcmVjdE1zZykge1xyXG4gICAgICAgIHZhciBtZXRob2QgPSBvYmpbbmFtZV07XHJcbiAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgIT0gXCJmdW5jdGlvblwiKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBhcnIgPSBtZXRob2RzW25hbWVdO1xyXG4gICAgICAgIGlmICghYXJyKSBhcnIgPSBtZXRob2RzW25hbWVdID0ge307XHJcbiAgICAgICAgYXJyW29iai5fX3VpZF0gPSB7XHJcbiAgICAgICAgICAgIFRISVM6IG9iaixcclxuICAgICAgICAgICAgbWV0aG9kOiBtZXRob2RcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoZW5hYmxlRGlyZWN0TXNnKSB7XHJcbiAgICAgICAgICAgIGFyciA9IG1ldGhvZHNbbmFtZSArIG9iai5fX3VpZF07XHJcbiAgICAgICAgICAgIGlmICghYXJyKSBhcnIgPSBtZXRob2RzW25hbWUgKyBvYmouX191aWRdID0ge307XHJcbiAgICAgICAgICAgIGFycltvYmouX191aWRdID0ge1xyXG4gICAgICAgICAgICAgICAgVEhJUzogb2JqLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBtZXRob2RcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubXV0ZSA9IGZ1bmN0aW9uKG9iaiwgbmFtZSkge1xyXG4gICAgICAgIHZhciBtZXRob2QgPSBvYmpbbmFtZV07XHJcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IG1ldGhvZHNbbmFtZV07XHJcbiAgICAgICAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybjtcclxuICAgICAgICBkZWxldGUgbGlzdGVuZXJzW29iai5fX3VpZF07XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuY2FsbCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xyXG4gICAgICAgIGlmIChtZXRob2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5kZWZpbmVkIGNhbGxcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpLCBsO1xyXG5cclxuICAgICAgICAvKiAqIC9cclxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuICAgIC8qL1xyXG4gICAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcclxuICAgICAgICBmb3IgKGkgPSAxLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgLyogKi9cclxuXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHByb3hpZXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgcHJveGllc1tpXS5jYWxsKG1ldGhvZCwgYXJncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbGlzdGVuZXJzID0gbWV0aG9kc1ttZXRob2RdO1xyXG4gICAgICAgIGlmICghbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIGlmICghKG1ldGhvZCBpbiBzaWxlbmNlKSkgY29uc29sZS5sb2cobWV0aG9kICsgXCI6IDBcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobGlzdGVuZXJzKTtcclxuICAgICAgICB2YXIgcmV0OyAvLz11bmRlZmluZWRcclxuICAgICAgICB2YXIgY291bnQgPSAwLFxyXG4gICAgICAgICAgICBjO1xyXG4gICAgICAgIGZvciAoOyBjb3VudCA8IGtleXMubGVuZ3RoOyArK2NvdW50KSB7XHJcbiAgICAgICAgICAgIGMgPSBsaXN0ZW5lcnNba2V5c1tjb3VudF1dO1xyXG5cclxuICAgICAgICAgICAgLy8gREVCVUdcclxuICAgICAgICAgICAgaWYgKGRlYnVnICYmIChtZXRob2QgPT0gZGVidWcgfHwgYy5USElTLmNvbnN0cnVjdG9yLm5hbWUgPT0gZGVidWcpKSBjb25zb2xlLmxvZyhjLlRISVMsIG1ldGhvZCwgYXJncyk7XHJcbiAgICAgICAgICAgIC8vIEVORC1ERUJVR1xyXG5cclxuICAgICAgICAgICAgdmFyIGxyZXQgPSBjICYmIGMubWV0aG9kLmFwcGx5KGMuVEhJUywgYXJncyk7XHJcbiAgICAgICAgICAgIGlmIChscmV0ICE9PSB1bmRlZmluZWQpIHJldCA9IGxyZXQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghKG1ldGhvZCBpbiBzaWxlbmNlKSkgY29uc29sZS5sb2cobWV0aG9kICsgXCI6IFwiICsgY291bnQpO1xyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvb2w7XHJcbiIsIlxyXG5mdW5jdGlvbiBzdG9yZSggb2JqLCBhc0J1ZmZlciApe1xyXG5cclxuICAgIGlmKCB0eXBlb2Ygb2JqID09IFwiZnVuY3Rpb25cIiApIG9iaiA9IHVuZGVmaW5lZDtcclxuICAgIGlmKCAhb2JqIHx8IHR5cGVvZiBvYmogIT0gXCJvYmplY3RcIiApXHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuXHJcbiAgICB2YXIgaW5zdCA9IFtdLCBzdHJJbmRleCA9IHtcIk9iamVjdFwiOi0yLFwiQXJyYXlcIjotM30sIGFyckluZGV4ID0ge30sIG9iakluZGV4ID0gW107XHJcblxyXG4gICAgYWRkKCBvYmogKTtcclxuXHJcbiAgICBpZiggYXNCdWZmZXIgKVxyXG4gICAgICAgIHJldHVybiB0b0J1ZmZlciggaW5zdCApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gaW5zdDtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGQoIG9iaiApe1xyXG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcclxuICAgICAgICBpZiggdHlwZSA9PSBcImZ1bmN0aW9uXCIgKXtcclxuICAgICAgICAgICAgb2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB0eXBlID0gdHlwZW9mIG9iajtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpbmRleDtcclxuICAgICAgICBpZiggb2JqID09PSB1bmRlZmluZWQgKXtcclxuICAgICAgICAgICAgaW5kZXggPSAtNDtcclxuICAgICAgICB9ZWxzZSBpZiggdHlwZSA9PSBcInN0cmluZ1wiICl7XHJcbiAgICAgICAgICAgIGluZGV4ID0gc3RySW5kZXhbb2JqXTtcclxuICAgICAgICAgICAgaWYoIGluZGV4ID09PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgaW5kZXggPSAtMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpbmRleCA9IGluc3QuaW5kZXhPZihvYmopO1xyXG5cclxuICAgICAgICBpZiggaW5kZXggIT0gLTEgKSByZXR1cm4gaW5kZXg7XHJcblxyXG4gICAgICAgIGlmKCB0eXBlID09IFwib2JqZWN0XCIgKXtcclxuICAgICAgICAgICAgaW5kZXggPSBvYmpJbmRleC5pbmRleE9mKG9iaik7XHJcbiAgICAgICAgICAgIGlmKCBpbmRleCAhPSAtMSApIHJldHVybiBpbmRleDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluZGV4ID0gaW5zdC5sZW5ndGg7XHJcbiAgICAgICAgaW5zdFtpbmRleF0gPSBvYmo7XHJcblxyXG4gICAgICAgIGlmKCB0eXBlID09IFwic3RyaW5nXCIgKVxyXG4gICAgICAgICAgICBzdHJJbmRleFtvYmpdID0gaW5kZXg7XHJcblxyXG4gICAgICAgIGlmKCAhb2JqIHx8IHR5cGUgIT0gXCJvYmplY3RcIiApXHJcbiAgICAgICAgICAgIHJldHVybiBpbmRleDtcclxuICAgICAgICBcclxuICAgICAgICBvYmpJbmRleFsgaW5kZXggXSA9IG9iajtcclxuXHJcbiAgICAgICAgdmFyIGN0b3JJbmRleCA9IGFkZCggb2JqLmNvbnN0cnVjdG9yLmZ1bGxOYW1lIHx8IG9iai5jb25zdHJ1Y3Rvci5uYW1lICk7XHJcblxyXG4gICAgICAgIGlmKCBvYmouYnVmZmVyICYmIG9iai5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciApe1xyXG5cclxuICAgICAgICAgICAgaWYoICFhc0J1ZmZlciApXHJcbiAgICAgICAgICAgICAgICBvYmogPSBBcnJheS5mcm9tKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGluc3RbaW5kZXhdID0gW2N0b3JJbmRleCwgLTMsIG9ial07XHJcbiAgICAgICAgICAgIHJldHVybiBpbmRleDtcclxuICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGtleSwga2V5U2V0ID0gW107XHJcbiAgICAgICAgZm9yKCBrZXkgaW4gb2JqICl7XHJcbiAgICAgICAgICAgIGlmKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpICl7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5SW5kZXggPSBzdHJJbmRleFtrZXldO1xyXG4gICAgICAgICAgICAgICAgaWYoIGtleUluZGV4ID09PSB1bmRlZmluZWQgKXtcclxuICAgICAgICAgICAgICAgICAgICBrZXlJbmRleCA9IGluc3QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIGluc3Rba2V5SW5kZXhdID0ga2V5O1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ckluZGV4W2tleV0gPSBrZXlJbmRleDtcclxuICAgICAgICAgICAgICAgICAgICBrZXlJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAga2V5U2V0W2tleVNldC5sZW5ndGhdID0ga2V5SW5kZXg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzdHJLZXlTZXQgPSBKU09OLnN0cmluZ2lmeShrZXlTZXQpO1xyXG4gICAgICAgIGtleUluZGV4ID0gYXJySW5kZXhbIHN0cktleVNldCBdO1xyXG4gICAgICAgIGlmKCBrZXlJbmRleCA9PT0gdW5kZWZpbmVkICl7XHJcbiAgICAgICAgICAgIGtleUluZGV4ID0gaW5zdC5sZW5ndGg7XHJcbiAgICAgICAgICAgIGluc3Rba2V5SW5kZXhdID0ga2V5U2V0O1xyXG4gICAgICAgICAgICBhcnJJbmRleFtzdHJLZXlTZXRdID0ga2V5SW5kZXg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdmFsdWVTZXQgPSBbIGN0b3JJbmRleCwga2V5SW5kZXggXTtcclxuXHJcbiAgICAgICAgZm9yKCBrZXkgaW4gb2JqICl7XHJcbiAgICAgICAgICAgIGlmKCBvYmouaGFzT3duUHJvcGVydHkoa2V5KSApe1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVJbmRleCA9IGFkZCggdmFsdWUgKTtcclxuICAgICAgICAgICAgICAgIHZhbHVlU2V0W3ZhbHVlU2V0Lmxlbmd0aF0gPSB2YWx1ZUluZGV4OyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RyS2V5U2V0ID0gSlNPTi5zdHJpbmdpZnkodmFsdWVTZXQpO1xyXG4gICAgICAgIGtleUluZGV4ID0gYXJySW5kZXhbIHN0cktleVNldCBdO1xyXG4gICAgICAgIGlmKCBrZXlJbmRleCA9PT0gdW5kZWZpbmVkICl7XHJcbiAgICAgICAgICAgIGFyckluZGV4W3N0cktleVNldF0gPSBpbmRleDtcclxuICAgICAgICAgICAgaW5zdFtpbmRleF0gPSB2YWx1ZVNldDtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaW5zdFtpbmRleF0gPSBba2V5SW5kZXhdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZCggYXJyLCBpc0J1ZmZlciApe1xyXG5cclxuICAgIGlmKCBpc0J1ZmZlciB8fCAoYXJyICYmIGFyci5idWZmZXIpIClcclxuICAgICAgICBhcnIgPSBmcm9tQnVmZmVyKCBhcnIgKTtcclxuXHJcbiAgICB2YXIgU0VMRiA9IG51bGw7XHJcblxyXG4gICAgaWYoICFhcnIgfHwgdHlwZW9mIGFyciAhPT0gXCJvYmplY3RcIiApXHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIFxyXG4gICAgaWYoICFBcnJheS5pc0FycmF5KGFycikgKVxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcblxyXG4gICAgKGZ1bmN0aW9uKCl7IHRyeXtTRUxGPXdpbmRvdzt9Y2F0Y2goZXgpe30gfSkoKTtcclxuICAgIGlmKCAhU0VMRiApXHJcbiAgICAgICAgKGZ1bmN0aW9uKCl7IHRyeXtTRUxGPWdsb2JhbDt9Y2F0Y2goZXgpe30gfSkoKTtcclxuXHJcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xyXG5cclxuICAgIHZhciBjdXJzb3IgPSAwO1xyXG4gICAgcmV0dXJuIHJlYWQoLTEpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlYWQoIHBvcyApe1xyXG5cclxuICAgICAgICBzd2l0Y2goIHBvcyApe1xyXG4gICAgICAgIGNhc2UgLTE6XHJcbiAgICAgICAgICAgIHBvcyA9IGN1cnNvcjtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAtMjpcclxuICAgICAgICAgICAgcmV0dXJuIFwiT2JqZWN0XCI7XHJcbiAgICAgICAgY2FzZSAtMzpcclxuICAgICAgICAgICAgcmV0dXJuIFwiQXJyYXlcIjtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBpZiggb2JqZWN0c1twb3NdIClcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3RzW3Bvc107XHJcblxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCBwb3MgPT0gY3Vyc29yIClcclxuICAgICAgICAgICAgY3Vyc29yKys7XHJcblxyXG4gICAgICAgIHZhciB2YWx1ZSA9IGFycltwb3NdO1xyXG4gICAgICAgIGlmKCAhdmFsdWUgKSByZXR1cm4gdmFsdWU7XHJcblxyXG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG4gICAgICAgIGlmKCB0eXBlICE9IFwib2JqZWN0XCIgKSByZXR1cm4gdmFsdWU7XHJcblxyXG4gICAgICAgIGlmKCB2YWx1ZS5sZW5ndGggPT0gMSApXHJcbiAgICAgICAgICAgIHZhbHVlID0gYXJyWyB2YWx1ZVswXSBdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBjbGFzc05hbWUgPSByZWFkKCB2YWx1ZVswXSApO1xyXG5cclxuICAgICAgICBpZiggIWNsYXNzTmFtZS5zcGxpdCApXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBjbGFzc05hbWUsIHZhbHVlWzBdICk7XHJcblxyXG4gICAgICAgIHZhciBjdG9yID0gU0VMRiwgb2JqO1xyXG4gICAgICAgIGNsYXNzTmFtZS5zcGxpdChcIi5cIikuZm9yRWFjaCggcGFydCA9PiBjdG9yID0gY3RvcltwYXJ0XSApO1xyXG5cclxuICAgICAgICBpZiggdmFsdWVbMV0gIT09IC0zICl7XHJcbiAgICAgICAgICAgIG9iaiA9IG5ldyBjdG9yKCk7XHJcbiAgICAgICAgICAgIG9iamVjdHNbIHBvcyBdID0gb2JqO1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpZWxkUmVmTGlzdCwgbXVzdEFkZCA9IHZhbHVlWzFdID4gcG9zO1xyXG5cclxuICAgICAgICAgICAgZmllbGRSZWZMaXN0ID0gYXJyWyB2YWx1ZVsxXSBdO1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpZWxkTGlzdCA9IGZpZWxkUmVmTGlzdC5tYXAoIHJlZiA9PiByZWFkKHJlZikgKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCBtdXN0QWRkICkgY3Vyc29yKys7XHJcblxyXG5cclxuICAgICAgICAgICAgZm9yKCB2YXIgaT0yOyBpPHZhbHVlLmxlbmd0aDsgKytpICl7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmkgPSB2YWx1ZVtpXTtcclxuICAgICAgICAgICAgICAgIGlmKCB2aSAhPT0gLTQgKVxyXG4gICAgICAgICAgICAgICAgICAgIG9ialsgZmllbGRMaXN0W2ktMl0gXSA9IHJlYWQodmkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBvYmogPSB2YWx1ZVsyXTtcclxuICAgICAgICAgICAgaWYoICFpc0J1ZmZlciApIG9iamVjdHNbIHBvcyBdID0gb2JqID0gY3Rvci5mcm9tKCBvYmogKTtcclxuICAgICAgICAgICAgZWxzZSBvYmplY3RzWyBwb3MgXSA9IG9iaiA9IG5ldyBjdG9yKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGN1cnNvcisrO1xyXG5cclxuICAgICAgICB9XHJcblxyXG5cclxuXHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvQnVmZmVyKCBzcmMgKXtcclxuICAgIGNvbnN0IG91dCA9IFtdO1xyXG5cclxuICAgIGNvbnN0IGRhYiA9IG5ldyBGbG9hdDY0QXJyYXkoMSk7XHJcbiAgICBjb25zdCBiYWIgPSBuZXcgVWludDhBcnJheShkYWIuYnVmZmVyKTtcclxuICAgIGNvbnN0IHNhYiA9IG5ldyBJbnQzMkFycmF5KGRhYi5idWZmZXIpO1xyXG4gICAgY29uc3QgZmFiID0gbmV3IEZsb2F0MzJBcnJheShkYWIuYnVmZmVyKTtcclxuXHJcbiAgICB2YXIgcD0wO1xyXG5cclxuICAgIGZvciggdmFyIGk9MCwgbD1zcmMubGVuZ3RoOyBpPGw7ICsraSApe1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHNyY1tpXSxcclxuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcclxuXHJcbiAgICAgICAgc3dpdGNoKCB0eXBlICl7XHJcbiAgICAgICAgY2FzZSBcImJvb2xlYW5cIjogLy8gMSwgMlxyXG4gICAgICAgICAgICBvdXRbcCsrXSA9IDErKHZhbHVlfDApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxyXG4gICAgICAgICAgICB2YXIgaXNGbG9hdCA9IE1hdGguZmxvb3IoIHZhbHVlICkgIT09IHZhbHVlO1xyXG4gICAgICAgICAgICBpZiggaXNGbG9hdCApe1xyXG5cclxuICAgICAgICAgICAgICAgIGZhYlswXSA9IHZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKCBmYWJbMF0gPT09IHZhbHVlIHx8IGlzTmFOKHZhbHVlKSApe1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFtwKytdID0gMztcclxuICAgICAgICAgICAgICAgICAgICBvdXRbcCsrXSA9IGJhYlswXTsgb3V0W3ArK10gPSBiYWJbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W3ArK10gPSBiYWJbMl07IG91dFtwKytdID0gYmFiWzNdO1xyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgZGFiWzBdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W3ArK10gPSA0O1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFtwKytdID0gYmFiWzBdOyBvdXRbcCsrXSA9IGJhYlsxXTtcclxuICAgICAgICAgICAgICAgICAgICBvdXRbcCsrXSA9IGJhYlsyXTsgb3V0W3ArK10gPSBiYWJbM107XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W3ArK10gPSBiYWJbNF07IG91dFtwKytdID0gYmFiWzVdO1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFtwKytdID0gYmFiWzZdOyBvdXRbcCsrXSA9IGJhYls3XTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgc2F2ZUludCggMCwgdmFsdWUgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgICBjYXNlIFwic3RyaW5nXCI6XHJcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHAsIHJlc3RhcnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgc2F2ZUludCggMSwgdmFsdWUubGVuZ3RoICk7XHJcbiAgICAgICAgICAgIGZvciggdmFyIGJpPTAsIGJsPXZhbHVlLmxlbmd0aDsgYmk8Ymw7ICsrYmkgKXtcclxuICAgICAgICAgICAgICAgIHZhciBieXRlID0gdmFsdWUuY2hhckNvZGVBdChiaSk7XHJcbiAgICAgICAgICAgICAgICBpZiggYnl0ZSA+IDB4RkYgKXtcclxuICAgICAgICAgICAgICAgICAgICByZXN0YXJ0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG91dFtwKytdID0gYnl0ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYoICFyZXN0YXJ0IClcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcCA9IHN0YXJ0O1xyXG4gICAgICAgICAgICBzYXZlSW50KCAyLCB2YWx1ZS5sZW5ndGggKTtcclxuXHJcbiAgICAgICAgICAgIGZvciggdmFyIGJpPTAsIGJsPXZhbHVlLmxlbmd0aDsgYmk8Ymw7ICsrYmkgKXtcclxuICAgICAgICAgICAgICAgIHZhciBieXRlID0gdmFsdWUuY2hhckNvZGVBdChiaSk7XHJcbiAgICAgICAgICAgICAgICBvdXRbcCsrXSA9IGJ5dGUgJiAweEZGO1xyXG4gICAgICAgICAgICAgICAgb3V0W3ArK10gPSAoYnl0ZT4+OCkgJiAweEZGO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgICBjYXNlIFwib2JqZWN0XCI6XHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgdmFsdWVbMl0gPT0gXCJvYmplY3RcIiApe1xyXG4gICAgICAgICAgICAgICAgdmFyIHR5cGVkID0gbmV3IFVpbnQ4QXJyYXkoIHZhbHVlWzJdLmJ1ZmZlciApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNhdmVJbnQoIDMsIC10eXBlZC5sZW5ndGggKTtcclxuICAgICAgICAgICAgICAgIHNhdmVJbnQoIDAsIHZhbHVlWzBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgYmk9MCwgYmw9dHlwZWQubGVuZ3RoOyBiaTxibDsgKytiaSApe1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFtwKytdID0gdHlwZWRbYmldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBzYXZlSW50KCAzLCB2YWx1ZS5sZW5ndGggKTtcclxuICAgICAgICAgICAgICAgIGZvciggdmFyIGJpPTAsIGJsPXZhbHVlLmxlbmd0aDsgYmk8Ymw7ICsrYmkgKXtcclxuICAgICAgICAgICAgICAgICAgICBzYXZlSW50KCAwLCB2YWx1ZVtiaV0gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFVpbnQ4QXJyYXkuZnJvbShvdXQpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHNhdmVJbnQoIHR5cGUsIHZhbHVlICl7XHJcblxyXG4gICAgICAgIHZhciBiaXRDb3VudCA9IE1hdGguY2VpbCggTWF0aC5sb2cyKCBNYXRoLmFicyh2YWx1ZSkgKSApO1xyXG4gICAgICAgIHZhciBieXRlID0gdHlwZSA8PCA2O1xyXG5cclxuICAgICAgICBpZiggYml0Q291bnQgPCAzIHx8IHZhbHVlID09PSAtOCApe1xyXG4gICAgICAgICAgICBieXRlIHw9IDB4MzA7XHJcbiAgICAgICAgICAgIGJ5dGUgfD0gdmFsdWUgJiAweEY7XHJcbiAgICAgICAgICAgIG91dFtwKytdID0gYnl0ZTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIGJpdENvdW50IDw9IDgrMyB8fCB2YWx1ZSA9PT0gLTIwNDggKXtcclxuICAgICAgICAgICAgYnl0ZSB8PSAweDEwO1xyXG4gICAgICAgICAgICBieXRlIHw9ICh2YWx1ZSA+Pj4gOCkgJiAweEY7XHJcbiAgICAgICAgICAgIG91dFtwKytdID0gYnl0ZTtcclxuICAgICAgICAgICAgb3V0W3ArK10gPSB2YWx1ZSAmIDB4RkY7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCBiaXRDb3VudCA8PSAxNiszIHx8IHZhbHVlID09PSAtNTI0Mjg4ICl7XHJcbiAgICAgICAgICAgIGJ5dGUgfD0gMHgyMDtcclxuICAgICAgICAgICAgYnl0ZSB8PSAodmFsdWUgPj4+IDE2KSAmIDB4RjtcclxuICAgICAgICAgICAgb3V0W3ArK10gPSBieXRlO1xyXG4gICAgICAgICAgICBvdXRbcCsrXSA9ICh2YWx1ZT4+PjgpICYgMHhGRjtcclxuICAgICAgICAgICAgb3V0W3ArK10gPSB2YWx1ZSAmIDB4RkY7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNhYlswXSA9IHZhbHVlO1xyXG4gICAgICAgIG91dFtwKytdID0gYnl0ZTtcclxuICAgICAgICBvdXRbcCsrXSA9IGJhYlswXTsgb3V0W3ArK10gPSBiYWJbMV07XHJcbiAgICAgICAgb3V0W3ArK10gPSBiYWJbMl07IG91dFtwKytdID0gYmFiWzNdO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGZyb21CdWZmZXIoIHNyYyApe1xyXG4gICAgY29uc3Qgb3V0ID0gW107XHJcbiAgICBjb25zdCBkYWIgPSBuZXcgRmxvYXQ2NEFycmF5KDEpO1xyXG4gICAgY29uc3QgYmFiID0gbmV3IFVpbnQ4QXJyYXkoZGFiLmJ1ZmZlcik7XHJcbiAgICBjb25zdCBzYWIgPSBuZXcgSW50MzJBcnJheShkYWIuYnVmZmVyKTtcclxuICAgIGNvbnN0IGZhYiA9IG5ldyBGbG9hdDMyQXJyYXkoZGFiLmJ1ZmZlcik7XHJcblxyXG4gICAgdmFyIHBvcyA9IDA7XHJcblxyXG4gICAgZm9yKCB2YXIgbD1zcmMubGVuZ3RoOyBwb3M8bDsgKVxyXG4gICAgICAgIG91dFtvdXQubGVuZ3RoXSA9IHJlYWQoKTtcclxuXHJcbiAgICByZXR1cm4gb3V0O1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlYWQoKXtcclxuICAgICAgICB2YXIgdG1wO1xyXG4gICAgICAgIHZhciBieXRlID0gc3JjW3BvcysrXTtcclxuICAgICAgICBzd2l0Y2goIGJ5dGUgKXtcclxuICAgICAgICBjYXNlIDA6IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMTogcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGNhc2UgMjogcmV0dXJuIHRydWU7XHJcbiAgICAgICAgY2FzZSAzOiByZXR1cm4gZGVjb2RlRmxvYXQzMigpO1xyXG4gICAgICAgIGNhc2UgNDogcmV0dXJuIGRlY29kZUZsb2F0NjQoKTtcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICB2YXIgaGIgPSBieXRlID4+PiA0O1xyXG4gICAgICAgIHZhciBsYiA9IGJ5dGUgJiAweEY7XHJcbiAgICAgICAgc3dpdGNoKCBoYiAmIDMgKXtcclxuICAgICAgICBjYXNlIDA6IC8vIDMyIGJpdCBpbnRcclxuICAgICAgICAgICAgdG1wID0gZGVjb2RlSW50MzIoKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAxOiAvLyAxMiBiaXQgaW50XHJcbiAgICAgICAgICAgIHRtcCA9IHNyY1twb3MrK10gfCAoKGxiPDwyOCk+PjIwKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOiAvLyAxOSBiaXQgaW50XHJcbiAgICAgICAgICAgIHRtcCA9ICgobGI8PDI4KT4+MTIpIHwgc3JjW3Bvc10gfCAoc3JjW3BvcysxXTw8OCk7XHJcbiAgICAgICAgICAgIHBvcyArPSAyO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6IC8vIDQtYml0IGludFxyXG4gICAgICAgICAgICB0bXAgPSAobGI8PDI4KT4+Mjg7IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3dpdGNoKCBoYj4+MiApe1xyXG4gICAgICAgIGNhc2UgMDogcmV0dXJuIHRtcDtcclxuICAgICAgICBjYXNlIDE6IHJldHVybiBkZWNvZGVTdHI4KCB0bXAgKTtcclxuICAgICAgICBjYXNlIDI6IHJldHVybiBkZWNvZGVTdHIxNiggdG1wICk7XHJcbiAgICAgICAgY2FzZSAzOiByZXR1cm4gZGVjb2RlQXJyYXkoIHRtcCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVjb2RlU3RyOCggc2l6ZSApe1xyXG4gICAgICAgIHZhciBhY2MgPSBcIlwiO1xyXG4gICAgICAgIGZvciggdmFyIGk9MDsgaTxzaXplOyArK2kgKVxyXG4gICAgICAgICAgICBhY2MgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSggc3JjW3BvcysrXSApXHJcbiAgICAgICAgcmV0dXJuIGFjYztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWNvZGVTdHIxNiggc2l6ZSApe1xyXG4gICAgICAgIHZhciBhY2MgPSBcIlwiO1xyXG4gICAgICAgIGZvciggdmFyIGk9MDsgaTxzaXplOyArK2kgKXtcclxuICAgICAgICAgICAgdmFyIGggPSBzcmNbcG9zKytdO1xyXG4gICAgICAgICAgICBhY2MgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSggKGg8PDgpIHwgc3JjW3BvcysrXSApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2M7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVjb2RlQXJyYXkoIHNpemUgKXtcclxuXHJcbiAgICAgICAgdmFyIHJldCA9IFtdO1xyXG4gICAgICAgIGlmKCBzaXplIDwgMCApe1xyXG5cclxuICAgICAgICAgICAgcmV0WzBdID0gcmVhZCgpOyAvLyB0eXBlXHJcbiAgICAgICAgICAgIHJldFsxXSA9IC0zO1xyXG5cclxuICAgICAgICAgICAgc2l6ZSA9IC1zaXplO1xyXG5cclxuICAgICAgICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoc2l6ZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IoIHZhciBpPTA7IGk8c2l6ZTsgKytpIClcclxuICAgICAgICAgICAgICAgIGJ5dGVzW2ldID0gc3JjW3BvcysrXVxyXG5cclxuICAgICAgICAgICAgcmV0WzJdID0gYnl0ZXMuYnVmZmVyO1xyXG5cclxuICAgICAgICB9ZWxzZXtcclxuXHJcbiAgICAgICAgICAgIGZvciggdmFyIGk9MDsgaTxzaXplOyArK2kgKVxyXG4gICAgICAgICAgICAgICAgcmV0W2ldID0gcmVhZCgpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlY29kZUludDMyKCl7XHJcbiAgICAgICAgYmFiWzBdID0gc3JjW3BvcysrXTsgYmFiWzFdID0gc3JjW3BvcysrXTtcclxuICAgICAgICBiYWJbMl0gPSBzcmNbcG9zKytdOyBiYWJbM10gPSBzcmNbcG9zKytdO1xyXG4gICAgICAgIHJldHVybiBzYWJbMF07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVjb2RlRmxvYXQzMigpe1xyXG4gICAgICAgIGJhYlswXSA9IHNyY1twb3MrK107IGJhYlsxXSA9IHNyY1twb3MrK107XHJcbiAgICAgICAgYmFiWzJdID0gc3JjW3BvcysrXTsgYmFiWzNdID0gc3JjW3BvcysrXTtcclxuICAgICAgICByZXR1cm4gZmFiWzBdO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlY29kZUZsb2F0NjQoKXtcclxuICAgICAgICBiYWJbMF0gPSBzcmNbcG9zKytdOyBiYWJbMV0gPSBzcmNbcG9zKytdO1xyXG4gICAgICAgIGJhYlsyXSA9IHNyY1twb3MrK107IGJhYlszXSA9IHNyY1twb3MrK107XHJcbiAgICAgICAgYmFiWzRdID0gc3JjW3BvcysrXTsgYmFiWzVdID0gc3JjW3BvcysrXTtcclxuICAgICAgICBiYWJbNl0gPSBzcmNbcG9zKytdOyBiYWJbN10gPSBzcmNbcG9zKytdO1xyXG4gICAgICAgIHJldHVybiBkYWJbMF07XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgc3RvcmUsIGxvYWQgfTtcclxuIiwiLy8gbGV0IHtiaW5kLCBpbmplY3QsIGdldEluc3RhbmNlT2Z9ID0gcmVxdWlyZSgnLi9saWIvZHJ5LWRpLmpzJyk7XHJcbmltcG9ydCB7YmluZCwgaW5qZWN0LCBnZXRJbnN0YW5jZU9mfSBmcm9tICdkcnktZGknO1xyXG5cclxuXHJcbmltcG9ydCBBcHAgZnJvbSAnLi9BcHAuanMnO1xyXG5pbXBvcnQgSVN0b3JlIGZyb20gJy4vc3RvcmUvSVN0b3JlLmpzJztcclxuaW1wb3J0IE5vZGVTdG9yZSBmcm9tICcuL3N0b3JlL05vZGUuanMnO1xyXG5pbXBvcnQgTVQgZnJvbSAnLi9saWIvbXQuanMnO1xyXG5pbXBvcnQgeyBNb2RlbCwgYm9vdCB9IGZyb20gJy4vbGliL212Yy5qcyc7XHJcblxyXG5pbXBvcnQgKiBhcyBlbnRpdGllcyBmcm9tICcuL2VudGl0aWVzLyouanMnO1xyXG5pbXBvcnQgKiBhcyBjb21wb25lbnRzIGZyb20gJy4vY29tcG9uZW50cy8qLmpzJztcclxuaW1wb3J0ICogYXMgc2NlbmVjb21wb25lbnRzIGZyb20gJy4vc2NlbmVjb21wb25lbnRzLyouanMnO1xyXG5pbXBvcnQgKiBhcyBzY2VuZWNvbnRyb2xsZXJzIGZyb20gJy4vc2NlbmVjb250cm9sbGVycy8qLmpzJztcclxuXHJcbmZ1bmN0aW9uIG1ha2VSTkcoIHNlZWQgKXtcclxuICAgIHZhciBybmcgPSBuZXcgTVQoIE1hdGgucm91bmQoIHNlZWR8fDAgKSApO1xyXG4gICAgcmV0dXJuIHJuZy5yYW5kb20uYmluZChybmcpO1xyXG59XHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCBcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT4ge1xyXG5zZXRUaW1lb3V0KCBmdW5jdGlvbigpe1xyXG5cclxuICAgIGJpbmQoTm9kZVN0b3JlKS50byhJU3RvcmUpLnNpbmdsZXRvbigpO1xyXG4gICAgYmluZChtYWtlUk5HKS50byhcIlJOR1wiKS5mYWN0b3J5KCk7XHJcblxyXG4gICAgZm9yKCBsZXQgayBpbiBzY2VuZWNvbXBvbmVudHMgKVxyXG4gICAgICAgIGJpbmQoc2NlbmVjb21wb25lbnRzW2tdKS50byhrKS53aXRoVGFncyh7IHNjZW5lY29tcG9uZW50OnRydWUgfSk7XHJcbiAgICBmb3IoIGxldCBrIGluIHNjZW5lY29udHJvbGxlcnMgKVxyXG4gICAgICAgIGJpbmQoc2NlbmVjb250cm9sbGVyc1trXSkudG8oaykud2l0aFRhZ3MoeyBzY2VuZWNvbnRyb2xsZXI6dHJ1ZSB9KTtcclxuXHJcbiAgICBib290KHtcclxuICAgICAgICBtYWluOkFwcCxcclxuICAgICAgICBlbGVtZW50OmRvY3VtZW50LmJvZHksXHJcbiAgICAgICAgY29tcG9uZW50cyxcclxuICAgICAgICBlbnRpdGllcyxcclxuICAgICAgICBtb2RlbE5hbWU6ICdkZWZhdWx0J1xyXG4gICAgfSk7XHJcblxyXG59LCAyMDAwKTtcclxufSApOyIsImxldCBmcyA9IG51bGw7XHJcblxyXG5mdW5jdGlvbiBta2RpcnAoIGJhc2UsIHBhdGgsIGNhbGxiYWNrKSB7XHJcbiAgICBsZXQgYWNjID0gYmFzZSB8fCBcIlwiO1xyXG4gICAgbGV0IHBhdGhzID0gcGF0aC5zcGxpdCgvW1xcL1xcXFxdKy8pO1xyXG4gICAgcGF0aHMucG9wKCk7IC8vIHJlbW92ZSBsYXN0IGZpbGUvZW1wdHkgZW50cnlcclxuICAgIHdvcmsoKTtcclxuICAgIHJldHVybjtcclxuXHJcbiAgICBmdW5jdGlvbiB3b3JrKCl7XHJcbiAgICAgICAgaWYoICFwYXRocy5sZW5ndGggKVxyXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodHJ1ZSk7XHJcbiAgICAgICAgbGV0IGN1cnJlbnQgPSBwYXRocy5zaGlmdCgpO1xyXG4gICAgICAgIGZzLm1rZGlyKCBhY2MgKyBjdXJyZW50LCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKCBlcnIgJiYgZXJyLmNvZGUgIT0gJ0VFWElTVCcgKXtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlKTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBhY2MgKz0gY3VycmVudCArICcvJztcclxuICAgICAgICAgICAgICAgIHdvcmsoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5sZXQgb25sb2FkID0gW10sIHdhc0luaXQgPSBmYWxzZTtcclxubGV0IGxvY2sgPSB7fTtcclxuXHJcbmNsYXNzIElTdG9yZSB7XHJcblxyXG4gICAgc2V0IG9ubG9hZCggY2IgKXtcclxuICAgICAgICBpZiggd2FzSW5pdCApXHJcbiAgICAgICAgICAgIGNiKCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBvbmxvYWQucHVzaChjYik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IGZzKCBfZnMgKXtcclxuXHJcbiAgICAgICAgaWYoIGZzICkgcmV0dXJuO1xyXG5cclxuICAgICAgICBmcyA9IF9mcztcclxuXHJcbiAgICAgICAgbWtkaXJwKCB0aGlzLnJvb3QsIFwic3RvcmUvXCIsICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucm9vdCArPSBcInN0b3JlL1wiO1xyXG5cclxuICAgICAgICAgICAgd2FzSW5pdCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBmb3IoIHZhciBpPTAsIGNiOyBjYj1vbmxvYWRbaV07ICsraSApXHJcbiAgICAgICAgICAgICAgICBjYigpO1xyXG5cclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldFRleHRJdGVtKCBrLCBjYiApe1xyXG5cclxuICAgICAgICBpZiggbG9ja1trXSApIGNiKGxvY2tba10gKTtcclxuICAgICAgICBlbHNlIGZzLnJlYWRGaWxlKCB0aGlzLnJvb3QgKyBrLCBcInV0Zi04XCIsIChlcnIsIGRhdGEpID0+IGNiKGRhdGEpICk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldEl0ZW1CdWZmZXIoIGssIGNiICl7XHJcblxyXG4gICAgICAgICAgICBpZiggbG9ja1trXSApIGNiKGxvY2tba10gKTtcclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVhZGluZyBcIiwgayk7XHJcbiAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSggdGhpcy5yb290ICsgaywgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVhZCBcIiwgaywgZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICBjYihkYXRhKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXRJdGVtKCBrLCB2LCBjYiApe1xyXG5cclxuICAgICAgICBta2RpcnAoIHRoaXMucm9vdCwgaywgKHN1Y2Nlc3MpPT57XHJcblxyXG4gICAgICAgICAgICBpZiggIXN1Y2Nlc3MgKXtcclxuICAgICAgICAgICAgICAgIGNiKGZhbHNlKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIGxvY2tba10gKXtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoIHRoaXMuc2V0SXRlbS5iaW5kKHRoaXMsIGssIHYsIGNiKSwgMjAwICk7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgbG9ja1trXSA9IHY7XHJcbiAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGUoIHRoaXMucm9vdCArIGssIHYsIChlcnIpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGxvY2tba107XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIGNiIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2IoIWVycik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJU3RvcmU7XHJcbiIsIlxyXG5sZXQgSVN0b3JlID0gcmVxdWlyZSgnLi9JU3RvcmUuanMnKTtcclxuXHJcbmlmKCB3aW5kb3cucmVxdWlyZSApe1xyXG5cclxuICAgIHZhciBmcyA9IHdpbmRvdy5yZXF1aXJlKCdmcycpO1xyXG4gICAgdmFyIHsgcmVtb3RlOnthcHB9IH0gPSB3aW5kb3cucmVxdWlyZSgnZWxlY3Ryb24nKTtcclxuXHJcbiAgICB2YXIge3dlYkZyYW1lfSA9IHdpbmRvdy5yZXF1aXJlKCdlbGVjdHJvbicpO1xyXG4gICAgd2ViRnJhbWUucmVnaXN0ZXJVUkxTY2hlbWVBc1ByaXZpbGVnZWQoJ2ZpbGUnLCB7fSk7XHJcblxyXG59ZWxzZXtcclxuXHJcbiAgICBmcyA9IHtcclxuXHJcbiAgICAgICAgbWtkaXIoIHBhdGgsIGNiICl7IGNiKCk7IH0sXHJcblxyXG4gICAgICAgIHJlYWRGaWxlKCBwYXRoLCBlbmMsIGNiICl7XHJcblxyXG5cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSggcGF0aCApO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgZW5jID09PSBcImZ1bmN0aW9uXCIgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBjYiA9IGVuYztcclxuICAgICAgICAgICAgICAgIGlmKCBkYXRhID09PSBudWxsIClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IoIFwiRU5PRU5UXCIgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBkYXRhID0gZGF0YS5zcGxpdChcIixcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoIGRhdGEubGVuZ3RoICk7XHJcbiAgICAgICAgICAgICAgICBmb3IoIHZhciBpPTAsIGw9ZGF0YS5sZW5ndGg7IGk8bDsgKytpIClcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXJbaV0gPSBkYXRhW2ldIHwgMDtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSBidWZmZXI7XHJcblxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggZGF0YSA9PT0gbnVsbCApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IoIFwiRU5PRU5UXCIgKTtcclxuXHJcbiAgICAgICAgICAgIGNiKCB1bmRlZmluZWQsIGRhdGEgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgd3JpdGVGaWxlKCBwYXRoLCBkYXRhLCBjYiApe1xyXG5cclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oIHBhdGgsIGRhdGEgKTtcclxuICAgICAgICAgICAgY2IodHJ1ZSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE5vZGVTdG9yZSBleHRlbmRzIElTdG9yZSB7XHJcbiAgICBcclxuICAgIGNvbnN0cnVjdG9yKCl7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgaWYoIGFwcCApXHJcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IGFwcC5nZXRQYXRoKFwidXNlckRhdGFcIikgKyBcIi9cIjtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IFwiXCI7XHJcblxyXG4gICAgICAgIHRoaXMuZnMgPSBmcztcclxuXHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOb2RlU3RvcmU7Il19
