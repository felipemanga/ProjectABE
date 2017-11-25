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
                    this.updatePeriferals();
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
									/*
         try{
                    return new ImageData(
         	new Uint8ClampedArray(canvas.width*canvas.height*4),
         	canvas.width,
         	canvas.height
             );
         }catch(e){*/
									return this.ctx.createImageData(canvas.width, canvas.height);
									//}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvZHJ5LWRpL2luZGV4LmpzIiwiLi5cXHNyY1xcQXBwLmpzIiwiLi5cXHNyY1xcYXRjb3JlXFxBdDMyOFAtVEMuanMiLCIuLlxcc3JjXFxhdGNvcmVcXEF0MzI4UC1VU0FSVC5qcyIsIi4uXFxzcmNcXGF0Y29yZVxcQXQzMjhQLXBlcmlmZXJhbHMuanMiLCIuLlxcc3JjXFxhdGNvcmVcXEF0MzJ1NC1TUEkuanMiLCIuLlxcc3JjXFxhdGNvcmVcXEF0MzJ1NC1wZXJpZmVyYWxzLmpzIiwiLi5cXHNyY1xcYXRjb3JlXFxzcmNcXGF0Y29yZVxcQXRjb3JlLmpzIiwiLi5cXHNyY1xcYXRjb3JlXFxIZXguanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxCVE4uanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxMRUQuanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxTQ1JFRU4uanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxhcmR1Ym95LmpzIiwiLi5cXHNyY1xcY29tcG9uZW50c1xcY29uZmlnLmpzIiwiLi5cXHNyY1xcY29tcG9uZW50c1xcZmlsZXMuanMiLCIuLlxcc3JjXFxjb21wb25lbnRzXFxtYXJrZXQuanMiLCIuLlxcc3JjXFxlbnRpdGllc1xcRW52LmpzIiwiLi5cXHNyY1xcZW50aXRpZXNcXFNpbS5qcyIsIi4uXFxzcmNcXGVudGl0aWVzXFxTcGxhc2guanMiLCIuLlxcc3JjXFxsaWJcXGRyeS1kb20uanMiLCIuLlxcc3JjXFxsaWJcXG10LmpzIiwiLi5cXHNyY1xcbGliXFxtdmMuanMiLCIuLlxcc3JjXFxsaWJcXHBvb2wuanMiLCIuLlxcc3JjXFxsaWJcXHNyY1xcbGliXFxzdHJsZHIuanMiLCIuLlxcc3JjXFxwYy5qcyIsIi4uXFxzcmNcXHN0b3JlXFxJU3RvcmUuanMiLCIuLlxcc3JjXFxzdG9yZVxcTm9kZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QixJQUF0QixDQUFYOztBQUdBLGdCQUFJLE9BQU8sR0FBUCxLQUFlLFVBQW5CLEVBQStCOztBQUUzQixxQkFBSyxHQUFMO0FBQ0Esb0JBQUksU0FBUyxJQUFiLEVBQ0ksT0FBTyxHQUFJLFFBQUosQ0FBUDs7QUFFSix1QkFBTyxLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQVA7QUFDQSxvQkFBSSxTQUFTLElBQUksVUFBSixDQUFnQixLQUFLLE1BQXJCLENBQWI7QUFDQSxxQkFBSyxJQUFJLElBQUUsQ0FBTixFQUFTLElBQUUsS0FBSyxNQUFyQixFQUE2QixJQUFFLENBQS9CLEVBQWtDLEVBQUUsQ0FBcEM7QUFDSSwyQkFBTyxDQUFQLElBQVksS0FBSyxDQUFMLElBQVUsQ0FBdEI7QUFESixpQkFFQSxPQUFPLE1BQVA7QUFFSCxhQVpELE1BWU0sSUFBSSxTQUFTLElBQWIsRUFDRixPQUFPLEdBQUksUUFBSixDQUFQOztBQUVKLGVBQUksU0FBSixFQUFlLElBQWY7QUFFSCxTQTNCQTtBQTZCRCxpQkE3QkMscUJBNkJVLElBN0JWLEVBNkJnQixJQTdCaEIsRUE2QnNCLEVBN0J0QixFQTZCMEI7O0FBRXZCLHlCQUFhLE9BQWIsQ0FBc0IsSUFBdEIsRUFBNEIsSUFBNUI7QUFDQSxlQUFHLElBQUg7QUFFSDtBQWxDQSxLQUFMO0FBcUNIOztJQUVLLFM7OztBQUVGLHlCQUFhO0FBQUE7O0FBQUE7O0FBR1QsWUFBSSxHQUFKLEVBQ0ksTUFBSyxJQUFMLEdBQVksSUFBSSxPQUFKLENBQVksVUFBWixJQUEwQixHQUF0QyxDQURKLEtBR0ksTUFBSyxJQUFMLEdBQVksRUFBWjs7QUFFSixjQUFLLEVBQUwsR0FBVSxFQUFWOztBQVJTO0FBVVo7OztFQVptQixNOztBQWlCeEIsT0FBTyxPQUFQLEdBQWlCLFNBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xyXG5cclxudmFyIF9zbGljZWRUb0FycmF5ID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVtcInJldHVyblwiXSkgX2lbXCJyZXR1cm5cIl0oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2VcIik7IH0gfTsgfSgpO1xyXG5cclxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcclxuXHJcbmZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheShhcnIpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyBmb3IgKHZhciBpID0gMCwgYXJyMiA9IEFycmF5KGFyci5sZW5ndGgpOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7IGFycjJbaV0gPSBhcnJbaV07IH0gcmV0dXJuIGFycjI7IH0gZWxzZSB7IHJldHVybiBBcnJheS5mcm9tKGFycik7IH0gfVxyXG5cclxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoIXNlbGYpIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBjYWxsICYmICh0eXBlb2YgY2FsbCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSA/IGNhbGwgOiBzZWxmOyB9XHJcblxyXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cclxuXHJcbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgYmluZDogYmluZCwgaW5qZWN0OiBpbmplY3QsIGdldEluc3RhbmNlT2Y6IGdldEluc3RhbmNlT2YsIGdldFBvbGljeTogZ2V0UG9saWN5IH07XHJcblxyXG4vKlxyXG5cclxuV2VsY29tZSB0byBEUlktREkuXHJcblxyXG4qL1xyXG5cclxudmFyIGtub3duSW50ZXJmYWNlcyA9IFtdO1xyXG52YXIgaW50ZXJmYWNlcyA9IHt9O1xyXG52YXIgY29uY3JldGlvbnMgPSB7fTtcclxuXHJcbnZhciBjb250ZXh0ID0gW3t9XTtcclxuXHJcbnZhciBSZWYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBSZWYocHJvdmlkZXIsIGlmaWQsIHNjb3BlKSB7XHJcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlZik7XHJcblxyXG4gICAgICAgIHRoaXMuaWZpZCA9IGlmaWQ7XHJcbiAgICAgICAgdGhpcy5jb3VudCA9IHByb3ZpZGVyLmRlcGVuZGVuY3lDb3VudDtcclxuICAgICAgICB0aGlzLmRlcGVuZGVuY3lDb3VudCA9IHByb3ZpZGVyLmRlcGVuZGVuY3lDb3VudDtcclxuICAgICAgICB0aGlzLnNjb3BlID0gc2NvcGU7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZHMgPSB7fTtcclxuICAgICAgICB0aGlzLmluamVjdGlvbnMgPSBudWxsO1xyXG4gICAgICAgIHRoaXMucHJvdmlkZXIgPSBwcm92aWRlcjtcclxuXHJcbiAgICAgICAgdmFyIHBzbG90ID0gc2NvcGVbaWZpZF0gfHwgKHNjb3BlW2lmaWRdID0gbmV3IFNsb3QoKSk7XHJcblxyXG4gICAgICAgIGlmIChwcm92aWRlci5pbmplY3Rpb25zKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0aW9ucyA9IHt9O1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMuaW5qZWN0aW9ucywgcHJvdmlkZXIuaW5qZWN0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pbmplY3Rpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX2lmaWQgPSB0aGlzLmluamVjdGlvbnNba2V5XTtcclxuICAgICAgICAgICAgICAgIHZhciBzbG90ID0gc2NvcGVbX2lmaWRdIHx8IChzY29wZVtfaWZpZF0gPSBuZXcgU2xvdCgpKTtcclxuICAgICAgICAgICAgICAgIHNsb3QuYWRkSW5qZWN0b3IodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBzbG90LmFkZFByb3ZpZGVyKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVDbGFzcyhSZWYsIFt7XHJcbiAgICAgICAga2V5OiBcImJpbmRJbmplY3Rpb25zXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRJbmplY3Rpb25zKGluamVjdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIGluamVjdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoX3JlZikge1xyXG4gICAgICAgICAgICAgICAgdmFyIF9yZWYyID0gX3NsaWNlZFRvQXJyYXkoX3JlZiwgMiksXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhenogPSBfcmVmMlswXSxcclxuICAgICAgICAgICAgICAgICAgICBfaW50ZXJmYWNlID0gX3JlZjJbMV07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IGtub3duSW50ZXJmYWNlcy5pbmRleE9mKF9pbnRlcmZhY2UpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGluamVjdGlvbiA9IGluamVjdGlvbnNba2V5XTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gX3RoaXMuYmluZHMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlmaWQgPSBfdGhpcy5pbmplY3Rpb25zW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2NvcGVbX3RoaXMuaWZpZF0ucmVtb3ZlSW5qZWN0b3IoX3RoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNhdGlzZnkoKTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5kZXBlbmRlbmN5Q291bnQtLTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBfdGhpcy5iaW5kc1trZXldID0gY2xheno7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgICBrZXk6IFwic2F0aXNmeVwiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzYXRpc2Z5KCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb3VudC0tO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY291bnQgPT0gMCkgdGhpcy5zY29wZVt0aGlzLmlmaWRdLmFkZFZpYWJsZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1dKTtcclxuXHJcbiAgICByZXR1cm4gUmVmO1xyXG59KCk7XHJcblxyXG52YXIgU2xvdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFNsb3QoKSB7XHJcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFNsb3QpO1xyXG5cclxuICAgICAgICB0aGlzLnZpYWJsZVByb3ZpZGVycyA9IDA7XHJcbiAgICAgICAgdGhpcy5wcm92aWRlcnMgPSBbXTtcclxuICAgICAgICB0aGlzLmluamVjdG9ycyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVDbGFzcyhTbG90LCBbe1xyXG4gICAgICAgIGtleTogXCJhZGRJbmplY3RvclwiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRJbmplY3RvcihyZWYpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0b3JzLnB1c2gocmVmKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMudmlhYmxlUHJvdmlkZXJzID4gMCkgcmVmLnNhdGlzZnkoKTtcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcInJlbW92ZUluamVjdG9yXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZUluamVjdG9yKHJlZikge1xyXG5cclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5pbmplY3RvcnMuaW5kZXhPZihyZWYpO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkgdGhpcy5pbmplY3RvcnMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcImFkZFByb3ZpZGVyXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZFByb3ZpZGVyKHJlZikge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wcm92aWRlcnMucHVzaChyZWYpO1xyXG4gICAgICAgICAgICBpZiAocmVmLmNvdW50ID09IDApIHRoaXMuYWRkVmlhYmxlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJhZGRWaWFibGVcIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYWRkVmlhYmxlKCkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy52aWFibGVQcm92aWRlcnMrKztcclxuICAgICAgICAgICAgaWYgKHRoaXMudmlhYmxlUHJvdmlkZXJzID09IDEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5qZWN0b3JzID0gdGhpcy5pbmplY3RvcnM7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGluamVjdG9ycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmplY3RvcnNbaV0uc2F0aXNmeSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJnZXRWaWFibGVcIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VmlhYmxlKGNsYXp6LCB0YWdzLCBtdWx0aXBsZSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudmlhYmxlUHJvdmlkZXJzID09IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghbXVsdGlwbGUpIHRocm93IG5ldyBFcnJvcihcIk5vIHZpYWJsZSBwcm92aWRlcnMgZm9yIFwiICsgY2xhenogKyBcIi4gIzEyNlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHJldCA9IG11bHRpcGxlID8gW10gOiBudWxsO1xyXG5cclxuICAgICAgICAgICAgdmFyIG1vc3RWaWFibGUgPSBudWxsO1xyXG4gICAgICAgICAgICB2YXIgbWF4UG9pbnRzID0gLTE7XHJcbiAgICAgICAgICAgIG5vdFZpYWJsZTogZm9yICh2YXIgaSA9IDAsIGM7IGMgPSB0aGlzLnByb3ZpZGVyc1tpXTsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYy5jb3VudCkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcG9pbnRzID0gYy5kZXBlbmRlbmN5Q291bnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFncyAmJiBjLnRhZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB0YWcgaW4gdGFncykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYy50YWdzW3RhZ10gIT09IHRhZ3NbdGFnXSkgY29udGludWUgbm90VmlhYmxlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb2ludHMrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobXVsdGlwbGUpIHJldFtyZXQubGVuZ3RoXSA9IGMucHJvdmlkZXIucG9saWN5LmJpbmQoYy5wcm92aWRlciwgYy5iaW5kcyk7ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvaW50cyA+IG1heFBvaW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhQb2ludHMgPSBwb2ludHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vc3RWaWFibGUgPSBjO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFtdWx0aXBsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFtb3N0VmlhYmxlKSB0aHJvdyBuZXcgRXJyb3IoXCJObyB2aWFibGUgcHJvdmlkZXJzIGZvciBcIiArIGNsYXp6ICsgXCIuIFRhZyBtaXNtYXRjaC5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vc3RWaWFibGUucHJvdmlkZXIucG9saWN5LmJpbmQobW9zdFZpYWJsZS5wcm92aWRlciwgbW9zdFZpYWJsZS5iaW5kcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSByZXR1cm4gcmV0O1xyXG4gICAgICAgIH1cclxuICAgIH1dKTtcclxuXHJcbiAgICByZXR1cm4gU2xvdDtcclxufSgpO1xyXG5cclxuZnVuY3Rpb24gcmVnaXN0ZXJJbnRlcmZhY2UoaWZjKSB7XHJcblxyXG4gICAgdmFyIHByb3BzID0ge30sXHJcbiAgICAgICAgY3VycmlmYyA9IHZvaWQgMDtcclxuXHJcbiAgICBpZiAodHlwZW9mIGlmYyA9PSBcImZ1bmN0aW9uXCIpIGN1cnJpZmMgPSBpZmMucHJvdG90eXBlO2Vsc2UgaWYgKCh0eXBlb2YgaWZjID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YoaWZjKSkgPT0gXCJvYmplY3RcIikgY3VycmlmYyA9IGlmYztcclxuXHJcbiAgICB3aGlsZSAoY3VycmlmYyAmJiBjdXJyaWZjICE9PSBPYmplY3QucHJvdG90eXBlKSB7XHJcblxyXG4gICAgICAgIHZhciBuYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGlmYy5wcm90b3R5cGUpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IG5hbWVzW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFwcm9wc1tuYW1lXSkgcHJvcHNbbmFtZV0gPSBfdHlwZW9mKGlmYy5wcm90b3R5cGVbbmFtZV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3VycmlmYyA9IGN1cnJpZmMucHJvdG90eXBlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBsZW4gPSBrbm93bkludGVyZmFjZXMubGVuZ3RoO1xyXG4gICAgaW50ZXJmYWNlc1tsZW5dID0gcHJvcHM7XHJcbiAgICBrbm93bkludGVyZmFjZXNbbGVuXSA9IGlmYztcclxuXHJcbiAgICByZXR1cm4gbGVuO1xyXG59XHJcblxyXG52YXIgUHJvdmlkZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFByb3ZpZGUoKSB7XHJcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFByb3ZpZGUpO1xyXG5cclxuICAgICAgICB0aGlzLmluamVjdGlvbnMgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuZGVwZW5kZW5jeUNvdW50ID0gMDtcclxuICAgICAgICB0aGlzLmNsYXp6ID0gbnVsbDtcclxuICAgICAgICB0aGlzLmN0b3IgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuYmluZHMgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBkZWZhdWx0IHBvbGljeSBpcyB0byBjcmVhdGUgYSBuZXcgaW5zdGFuY2UgZm9yIGVhY2ggaW5qZWN0aW9uXHJcbiAgICAgICAgdGhpcy5wb2xpY3kgPSBmdW5jdGlvbiAoYmluZHMsIGFyZ3MpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLmN0b3IoYmluZHMsIGFyZ3MpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZUNsYXNzKFByb3ZpZGUsIFt7XHJcbiAgICAgICAga2V5OiBcImNsb25lXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsb25lKCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHJldCA9IG5ldyBQcm92aWRlKCk7XHJcblxyXG4gICAgICAgICAgICByZXQuaW5qZWN0aW9ucyA9IHRoaXMuaW5qZWN0aW9ucztcclxuICAgICAgICAgICAgcmV0LmRlcGVuZGVuY3lDb3VudCA9IHRoaXMuZGVwZW5kZW5jeUNvdW50O1xyXG4gICAgICAgICAgICByZXQuY2xhenogPSB0aGlzLmNsYXp6O1xyXG4gICAgICAgICAgICByZXQucG9saWN5ID0gdGhpcy5wb2xpY3k7XHJcbiAgICAgICAgICAgIHJldC5jdG9yID0gdGhpcy5jdG9yO1xyXG4gICAgICAgICAgICByZXQuYmluZHMgPSB0aGlzLmJpbmRzO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcImJpbmRJbmplY3Rpb25zXCIsXHJcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRJbmplY3Rpb25zKGluamVjdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBiaW5kcyA9IHRoaXMuYmluZHMgPSB0aGlzLmJpbmRzIHx8IFtdO1xyXG4gICAgICAgICAgICB2YXIgYmluZENvdW50ID0gdGhpcy5iaW5kcy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICBpbmplY3Rpb25zLmZvckVhY2goZnVuY3Rpb24gKF9yZWYzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3JlZjQgPSBfc2xpY2VkVG9BcnJheShfcmVmMywgMiksXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhenogPSBfcmVmNFswXSxcclxuICAgICAgICAgICAgICAgICAgICBfaW50ZXJmYWNlID0gX3JlZjRbMV07XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaW5kQ291bnQ7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiaW5kc1tpXVswXSA9PSBjbGF6eikgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYmluZHNbYmluZHMubGVuZ3RoXSA9IFtjbGF6eiwgX2ludGVyZmFjZV07XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICAgIGtleTogXCJnZXRSZWZcIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0UmVmKGlmaWQsIF9pbnRlcmZhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBtYXAgPSBpbnRlcmZhY2VzW2lmaWRdLFxyXG4gICAgICAgICAgICAgICAgY2xhenogPSB0aGlzLmNsYXp6O1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKF90eXBlb2YoY2xhenoucHJvdG90eXBlW2tleV0pID09IG1hcFtrZXldKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNsYXNzIFwiICsgY2xhenoubmFtZSArIFwiIGNhbid0IHByb3ZpZGUgdG8gaW50ZXJmYWNlIFwiICsgX2ludGVyZmFjZS5uYW1lICsgXCIgYmVjYXVzZSBcIiArIGtleSArIFwiIGlzIFwiICsgX3R5cGVvZihjbGF6eltrZXldKSArIFwiIGluc3RlYWQgb2YgXCIgKyBtYXBba2V5XSArIFwiLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWYodGhpcywgaWZpZCwgY29udGV4dFtjb250ZXh0Lmxlbmd0aCAtIDFdKTtcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcInNldENvbmNyZXRpb25cIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0Q29uY3JldGlvbihjbGF6eikge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jbGF6eiA9IGNsYXp6O1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNsYXp6ID09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdG9yID0gZnVuY3Rpb24gKF9jbGF6eikge1xyXG4gICAgICAgICAgICAgICAgICAgIF9pbmhlcml0cyhfY2xhc3MsIF9jbGF6eik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIF9jbGFzcyhiaW5kcywgYXJncykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgX3JlZjU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX2NsYXNzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoX3JlZjUgPSBfY2xhc3MuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihfY2xhc3MpKS5jYWxsLmFwcGx5KF9yZWY1LCBbdGhpc10uY29uY2F0KF90b0NvbnN1bWFibGVBcnJheShhcmdzKSkpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfY2xhc3M7XHJcbiAgICAgICAgICAgICAgICB9KGNsYXp6KTtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGNsYXp6LnByb3RvdHlwZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvbGljeSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2xheno7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY2lkID0ga25vd25JbnRlcmZhY2VzLmluZGV4T2YoY2xhenopO1xyXG4gICAgICAgICAgICBpZiAoY2lkID09IC0xKSBjaWQgPSByZWdpc3RlckludGVyZmFjZShjbGF6eik7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNvbmNyZXRpb25zW2NpZF0pIGNvbmNyZXRpb25zW2NpZF0gPSBbdGhpc107ZWxzZSBjb25jcmV0aW9uc1tjaWRdLnB1c2godGhpcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcImZhY3RvcnlcIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZmFjdG9yeSgpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9saWN5ID0gZnVuY3Rpb24gKGJpbmRzLCBhcmdzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgVEhJUyA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJnczIgPSBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczJbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRISVMuY3RvcihiaW5kcywgYXJncy5jb25jYXQoYXJnczIpKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgICAga2V5OiBcInNpbmdsZXRvblwiLFxyXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzaW5nbGV0b24oKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLnBvbGljeSA9IGZ1bmN0aW9uIChiaW5kcywgYXJncykge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZSkgcmV0dXJuIGluc3RhbmNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGluc3RhbmNlID0gT2JqZWN0LmNyZWF0ZSh0aGlzLmN0b3IucHJvdG90eXBlKTtcclxuICAgICAgICAgICAgICAgIGluc3RhbmNlLmNvbnN0cnVjdG9yID0gdGhpcy5jdG9yO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdG9yLmNhbGwoaW5zdGFuY2UsIGJpbmRzLCBhcmdzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBuZXcgKGNsYXNzIGV4dGVuZHMgdGhpcy5jdG9ye1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbnN0cnVjdG9yKCBhcmdzICl7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIGluc3RhbmNlID0gdGhpczsgLy8gY2FudCBkbyB0aGlzIDooXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHN1cGVyKGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2U7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XSk7XHJcblxyXG4gICAgcmV0dXJuIFByb3ZpZGU7XHJcbn0oKTtcclxuXHJcbmZ1bmN0aW9uIGJpbmQoY2xhenopIHtcclxuXHJcbiAgICB2YXIgY2lkID0ga25vd25JbnRlcmZhY2VzLmluZGV4T2YoY2xhenopO1xyXG4gICAgaWYgKGNpZCA9PSAtMSkge1xyXG4gICAgICAgIGNpZCA9IHJlZ2lzdGVySW50ZXJmYWNlKGNsYXp6KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcHJvdmlkZXJzID0gY29uY3JldGlvbnNbY2lkXTtcclxuICAgIHZhciBsb2NhbFByb3ZpZGVycyA9IFtdO1xyXG5cclxuICAgIGlmICghcHJvdmlkZXJzKSB7XHJcblxyXG4gICAgICAgIGlmIChjbGF6eiAmJiBjbGF6eltcIkBpbmplY3RcIl0pIGluamVjdChjbGF6eltcIkBpbmplY3RcIl0pLmludG8oY2xhenopO2Vsc2UgbmV3IFByb3ZpZGUoKS5zZXRDb25jcmV0aW9uKGNsYXp6KTtcclxuXHJcbiAgICAgICAgcHJvdmlkZXJzID0gY29uY3JldGlvbnNbY2lkXTtcclxuICAgIH1cclxuXHJcbiAgICBsb2NhbFByb3ZpZGVycyA9IHByb3ZpZGVycy5tYXAoZnVuY3Rpb24gKHBhcnRpYWwpIHtcclxuICAgICAgICByZXR1cm4gcGFydGlhbC5jbG9uZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHJlZnMgPSBbXTtcclxuICAgIHZhciB0YWdzID0gbnVsbDtcclxuICAgIHZhciBpZmlkID0gdm9pZCAwO1xyXG5cclxuICAgIHZhciBwYXJ0aWFsQmluZCA9IHtcclxuICAgICAgICB0bzogZnVuY3Rpb24gdG8oX2ludGVyZmFjZSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGlmaWQgPSBrbm93bkludGVyZmFjZXMuaW5kZXhPZihfaW50ZXJmYWNlKTtcclxuICAgICAgICAgICAgaWYgKGlmaWQgPT0gLTEpIGlmaWQgPSByZWdpc3RlckludGVyZmFjZShfaW50ZXJmYWNlKTtcclxuXHJcbiAgICAgICAgICAgIGxvY2FsUHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24gKHByb3ZpZGVyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlZiA9IHByb3ZpZGVyLmdldFJlZihpZmlkLCBfaW50ZXJmYWNlKTtcclxuICAgICAgICAgICAgICAgIHJlZi50YWdzID0gdGFncztcclxuICAgICAgICAgICAgICAgIHJlZnMucHVzaChyZWYpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHdpdGhUYWdzOiBmdW5jdGlvbiB3aXRoVGFncyh0YWdzKSB7XHJcbiAgICAgICAgICAgIHJlZnMuZm9yRWFjaChmdW5jdGlvbiAocmVmKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVmLnRhZ3MgPSB0YWdzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2luZ2xldG9uOiBmdW5jdGlvbiBzaW5nbGV0b24oKSB7XHJcbiAgICAgICAgICAgIGxvY2FsUHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24gKHByb3ZpZGVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvdmlkZXIuc2luZ2xldG9uKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZhY3Rvcnk6IGZ1bmN0aW9uIGZhY3RvcnkoKSB7XHJcbiAgICAgICAgICAgIGxvY2FsUHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24gKHByb3ZpZGVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvdmlkZXIuZmFjdG9yeSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbmplY3Q6IGZ1bmN0aW9uIGluamVjdChtYXApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5qZWN0aW5nKG1hcCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbmplY3Rpbmc6IGZ1bmN0aW9uIGluamVjdGluZygpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbjIpLCBfa2V5MiA9IDA7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcclxuICAgICAgICAgICAgICAgIGFyZ3NbX2tleTJdID0gYXJndW1lbnRzW19rZXkyXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVmcy5mb3JFYWNoKGZ1bmN0aW9uIChyZWYpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZWYuYmluZEluamVjdGlvbnMoYXJncyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBsb2NhbFByb3ZpZGVycy5mb3JFYWNoKGZ1bmN0aW9uIChwcm92aWRlcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3ZpZGVyLmJpbmRJbmplY3Rpb25zKGFyZ3MpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHBhcnRpYWxCaW5kO1xyXG59XHJcblxyXG52YXIgSW5qZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gSW5qZWN0KGRlcGVuZGVuY2llcykge1xyXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBJbmplY3QpO1xyXG5cclxuICAgICAgICB0aGlzLmRlcGVuZGVuY2llcyA9IGRlcGVuZGVuY2llcztcclxuICAgICAgICB2YXIgdGFncyA9IHRoaXMudGFncyA9IHt9O1xyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBkZXBlbmRlbmNpZXMpIHtcclxuICAgICAgICAgICAgdGFnc1trZXldID0ge307XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVDbGFzcyhJbmplY3QsIFt7XHJcbiAgICAgICAga2V5OiBcImludG9cIixcclxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW50byhjbGF6eikge1xyXG5cclxuICAgICAgICAgICAgdmFyIGNpZCA9IGtub3duSW50ZXJmYWNlcy5pbmRleE9mKGNsYXp6KTtcclxuICAgICAgICAgICAgaWYgKGNpZCA9PSAtMSkgY2lkID0gcmVnaXN0ZXJJbnRlcmZhY2UoY2xhenopO1xyXG5cclxuICAgICAgICAgICAgdmFyIGluamVjdGlvbnMgPSB7fSxcclxuICAgICAgICAgICAgICAgIG1hcCA9IHRoaXMuZGVwZW5kZW5jaWVzLFxyXG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jeUNvdW50ID0gMCxcclxuICAgICAgICAgICAgICAgIHRhZ3MgPSB0aGlzLnRhZ3MsXHJcbiAgICAgICAgICAgICAgICBtdWx0aXBsZSA9IHt9O1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG1hcCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBfaW50ZXJmYWNlID0gbWFwW2tleV07XHJcbiAgICAgICAgICAgICAgICB2YXIgZGVwZW5kZW5jeSA9IF9pbnRlcmZhY2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkZXBlbmRlbmN5KSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBfaW50ZXJmYWNlID0gX2ludGVyZmFjZVswXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGRlcGVuZGVuY3kubGVuZ3RoOyArK2kpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGVwZW5kZW5jeVtpXSA9PSBcInN0cmluZ1wiKSB0YWdzW2tleV1bZGVwZW5kZW5jeVtpXV0gPSB0cnVlO2Vsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGVwZW5kZW5jeVtpXSkpIG11bHRpcGxlW2tleV0gPSB0cnVlO2Vsc2UgaWYgKGRlcGVuZGVuY3lbaV0pIE9iamVjdC5hc3NpZ24odGFnc1trZXldLCBkZXBlbmRlbmN5W2ldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGlmaWQgPSBrbm93bkludGVyZmFjZXMuaW5kZXhPZihfaW50ZXJmYWNlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaWZpZCA9PSAtMSkgaWZpZCA9IHJlZ2lzdGVySW50ZXJmYWNlKF9pbnRlcmZhY2UpO1xyXG5cclxuICAgICAgICAgICAgICAgIGluamVjdGlvbnNba2V5XSA9IGlmaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jeUNvdW50Kys7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwcm92aWRlciA9IG5ldyBQcm92aWRlKCkuc2V0Q29uY3JldGlvbihjbGF6eiksXHJcbiAgICAgICAgICAgICAgICBwcm90byA9IGNsYXp6LnByb3RvdHlwZTtcclxuICAgICAgICAgICAgdmFyIHByb3ZpZGVycyA9IGNvbmNyZXRpb25zW2NpZF07XHJcblxyXG4gICAgICAgICAgICBwcm92aWRlci5pbmplY3Rpb25zID0gaW5qZWN0aW9ucztcclxuICAgICAgICAgICAgcHJvdmlkZXIuZGVwZW5kZW5jeUNvdW50ID0gZGVwZW5kZW5jeUNvdW50O1xyXG5cclxuICAgICAgICAgICAgcHJvdmlkZXIuY3RvciA9IGZ1bmN0aW9uIChiaW5kcywgYXJncykge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZURlcGVuZGVuY2llcyhiaW5kcywgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICBjbGF6ei5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcHJvdmlkZXIuY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGNsYXp6LnByb3RvdHlwZSk7XHJcbiAgICAgICAgICAgIHByb3ZpZGVyLmN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY2xheno7XHJcblxyXG4gICAgICAgICAgICAvLyBwcm92aWRlci5jdG9yID0gY2xhc3MgZXh0ZW5kcyBjbGF6eiB7XHJcbiAgICAgICAgICAgIC8vICAgICBjb25zdHJ1Y3RvciggYXJncyApe1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIHJlc29sdmVEZXBlbmRlbmNpZXMoIHRoaXMgKTsgLy8gKnNpZ2gqXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgc3VwZXIoLi4uYXJncyk7XHJcbiAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgIC8vIH07XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiByZXNvbHZlRGVwZW5kZW5jaWVzKGJpbmRzLCBvYmopIHtcclxuICAgICAgICAgICAgICAgIHZhciBzbG90c2V0ID0gY29udGV4dFtjb250ZXh0Lmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2tleTMgaW4gaW5qZWN0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiaW5kcyAmJiBpbmplY3Rpb25zW19rZXkzXSBpbiBiaW5kcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmpbX2tleTNdID0gYmluZHNbaW5qZWN0aW9uc1tfa2V5M11dO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzbG90ID0gc2xvdHNldFtpbmplY3Rpb25zW19rZXkzXV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvbGljeSA9IHNsb3QuZ2V0VmlhYmxlKF9rZXkzLCB0YWdzW19rZXkzXSwgbXVsdGlwbGVbX2tleTNdKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW11bHRpcGxlW19rZXkzXSkgb2JqW19rZXkzXSA9IHBvbGljeShbXSk7ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvdXQgPSBvYmpbX2tleTNdID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pMiA9IDA7IF9pMiA8IHBvbGljeS5sZW5ndGg7ICsrX2kyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRbX2kyXSA9IHBvbGljeVtfaTJdKFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1dKTtcclxuXHJcbiAgICByZXR1cm4gSW5qZWN0O1xyXG59KCk7XHJcblxyXG5mdW5jdGlvbiBpbmplY3QoZGVwZW5kZW5jaWVzKSB7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBJbmplY3QoZGVwZW5kZW5jaWVzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0SW5zdGFuY2VPZihfaW50ZXJmYWNlKSB7XHJcbiAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuMyA+IDEgPyBfbGVuMyAtIDEgOiAwKSwgX2tleTQgPSAxOyBfa2V5NCA8IF9sZW4zOyBfa2V5NCsrKSB7XHJcbiAgICAgICAgYXJnc1tfa2V5NCAtIDFdID0gYXJndW1lbnRzW19rZXk0XTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBsZXQgaWZpZCA9IGtub3duSW50ZXJmYWNlcy5pbmRleE9mKCBfaW50ZXJmYWNlICk7XHJcbiAgICAvLyBsZXQgc2xvdCA9IGNvbnRleHRbIGNvbnRleHQubGVuZ3RoLTEgXVsgaWZpZCBdO1xyXG5cclxuICAgIC8vIGlmKCAhc2xvdCApXHJcbiAgICAvLyAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gcHJvdmlkZXJzIGZvciBcIiArIChfaW50ZXJmYWNlLm5hbWUgfHwgX2ludGVyZmFjZSkgKyBcIi4gIzQ2N1wiKTtcclxuXHJcbiAgICAvLyBsZXQgcG9saWN5ID0gc2xvdC5nZXRWaWFibGUoIF9pbnRlcmZhY2UubmFtZSB8fCBfaW50ZXJmYWNlICk7XHJcblxyXG4gICAgLy8gcmV0dXJuIHBvbGljeS5jYWxsKCBudWxsLCBhcmdzICk7XHJcbiAgICByZXR1cm4gZ2V0UG9saWN5KHsgX2ludGVyZmFjZTogX2ludGVyZmFjZSwgYXJnczogYXJncyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0UG9saWN5KGRlc2MpIHtcclxuICAgIGRlc2MgPSBkZXNjIHx8IHt9O1xyXG4gICAgaWYgKCFkZXNjLl9pbnRlcmZhY2UpIHRocm93IG5ldyBFcnJvcihcIlBvbGljeSBkZXNjcmlwdG9yIGhhcyBubyBpbnRlcmZhY2UuXCIpO1xyXG4gICAgdmFyIG5hbWUgPSBkZXNjLl9pbnRlcmZhY2UubmFtZSB8fCBkZXNjLl9pbnRlcmZhY2U7XHJcbiAgICB2YXIgdGFncyA9IGRlc2MudGFncztcclxuICAgIHZhciBtdWx0aXBsZSA9IGRlc2MubXVsdGlwbGU7XHJcbiAgICB2YXIgYXJncyA9IGRlc2MuYXJncztcclxuXHJcbiAgICB2YXIgaWZpZCA9IGtub3duSW50ZXJmYWNlcy5pbmRleE9mKGRlc2MuX2ludGVyZmFjZSk7XHJcbiAgICB2YXIgc2xvdCA9IGNvbnRleHRbY29udGV4dC5sZW5ndGggLSAxXVtpZmlkXTtcclxuXHJcbiAgICBpZiAoIXNsb3QpIHRocm93IG5ldyBFcnJvcihcIk5vIHByb3ZpZGVycyBmb3IgXCIgKyBuYW1lICsgXCIuICM0NjdcIik7XHJcblxyXG4gICAgdmFyIHBvbGljeSA9IHNsb3QuZ2V0VmlhYmxlKG5hbWUsIHRhZ3MsIG11bHRpcGxlKTtcclxuICAgIGlmIChhcmdzKSB7XHJcbiAgICAgICAgaWYgKG11bHRpcGxlKSBwb2xpY3kgPSBwb2xpY3kubWFwKGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwLmNhbGwobnVsbCwgYXJncyk7XHJcbiAgICAgICAgfSk7ZWxzZSBwb2xpY3kgPSBwb2xpY3kuY2FsbChudWxsLCBhcmdzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBwb2xpY3k7XHJcbn1cclxuIiwiaW1wb3J0IHsgTW9kZWwsIElDb250cm9sbGVyIH0gZnJvbSAnLi9saWIvbXZjLmpzJztcclxuaW1wb3J0IElTdG9yZSAgZnJvbSAnLi9zdG9yZS9JU3RvcmUuanMnO1xyXG5pbXBvcnQgRE9NIGZyb20gJy4vbGliL2RyeS1kb20uanMnO1xyXG5cclxud2luZG93LnN0cmxkciA9IHJlcXVpcmUoXCIuL2xpYi9zdHJsZHIuanNcIik7XHJcblxyXG5jbGFzcyBBcHAge1xyXG5cclxuICAgIHN0YXRpYyBcIkBpbmplY3RcIiA9IHtcclxuICAgICAgICBET006RE9NLFxyXG4gICAgICAgIHN0b3JlOklTdG9yZSxcclxuICAgICAgICBwb29sOlwicG9vbFwiLFxyXG4gICAgICAgIGNvbnRyb2xsZXJzOltJQ29udHJvbGxlcixbXV0sXHJcbiAgICAgICAgcm9vdDogW01vZGVsLCB7c2NvcGU6XCJyb290XCJ9XVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG5cclxuICAgICAgICB3aW5kb3cuc3RvcmUgPSB0aGlzLnN0b3JlO1xyXG5cclxuICAgICAgICB0aGlzLnBvb2wuYWRkKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLm1vZGVscyA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLnN0b3JlLm9ubG9hZCA9IHRoaXMuaW5pdC5iaW5kKHRoaXMpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbml0KCl7XHJcblxyXG5cdGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZXZ0ID0+IHtcclxuXHQgICAgdGhpcy5wb29sLmNhbGwoXCJvblByZXNzXCIgKyBldnQuY29kZSk7XHJcblx0ICAgIC8vIGNvbnNvbGUubG9nKGV2dCk7XHJcblx0fSk7XHJcblxyXG5cdGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGV2dCA9PiB7XHJcblx0ICAgIHRoaXMucG9vbC5jYWxsKFwib25SZWxlYXNlXCIgKyBldnQuY29kZSk7XHJcblx0ICAgIC8vIGNvbnNvbGUubG9nKGV2dCk7XHJcblx0fSk7XHJcblxyXG4gICAgICAgIHRoaXMuY29udHJvbGxlcnMuZm9yRWFjaCgoY29udHJvbGxlcikgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnBvb2wuYWRkKCBjb250cm9sbGVyICk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMucG9vbC5jYWxsKFwiZW50ZXJTcGxhc2hcIik7XHJcblxyXG5cclxuICAgICAgICBzZXRJbnRlcnZhbCggdGhpcy5jb21taXQuYmluZCh0aGlzKSwgMzAwMCApO1xyXG5cclxuICAgICAgICB2YXIgcGVuZGluZyA9IDI7XHJcbiAgICAgICAgdGhpcy5vcGVuTW9kZWwoIFwiYXBwXCIsIGRvbmUuYmluZCh0aGlzKSApO1xyXG4gICAgICAgIHNldFRpbWVvdXQoIGRvbmUuYmluZCh0aGlzKSwgMTAwMCApO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBkb25lKCl7XHJcbiAgICAgICAgICAgIHBlbmRpbmctLTtcclxuICAgICAgICAgICAgaWYoICFwZW5kaW5nIClcclxuICAgICAgICAgICAgICAgIHRoaXMucG9vbC5jYWxsKCBcImV4aXRTcGxhc2hcIiApO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9wZW5Nb2RlbCggbmFtZSwgY2IsIG1vZGVsICl7XHJcblxyXG4gICAgICAgIHZhciBvbGRNb2RlbCA9IHRoaXMubW9kZWxzLmZpbmQoKG9iaikgPT4gb2JqLm5hbWUgPT0gbmFtZSApO1xyXG5cclxuICAgICAgICBpZiggb2xkTW9kZWwgKXtcclxuXHJcbiAgICAgICAgICAgIGlmKCBvbGRNb2RlbCA9PSBtb2RlbCApIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZU1vZGVsKCBuYW1lICk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHBhdGggPSBuYW1lO1xyXG5cclxuICAgICAgICBpZiggdHlwZW9mIG1vZGVsID09IFwic3RyaW5nXCIgKXtcclxuICAgICAgICAgICAgcGF0aCA9IG1vZGVsO1xyXG4gICAgICAgICAgICBtb2RlbCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggIW1vZGVsICkgbW9kZWwgPSBuZXcgTW9kZWwoKTtcclxuXHJcbiAgICAgICAgdGhpcy5yb290LnNldEl0ZW0oIG5hbWUsIG1vZGVsLmRhdGEgKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2RlbHNbIHRoaXMubW9kZWxzLmxlbmd0aCBdID0ge1xyXG4gICAgICAgICAgICBtb2RlbCxcclxuICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgcGF0aCxcclxuICAgICAgICAgICAgZGlydHk6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZS5nZXRUZXh0SXRlbSggcGF0aCwgKGRhdGEpPT57XHJcblxyXG4gICAgICAgICAgICBpZiggZGF0YSApe1xyXG5cdFx0bW9kZWwubG9hZCggSlNPTi5wYXJzZShkYXRhKSApO1xyXG5cdFx0aWYoIG1vZGVsLmdldEl0ZW0oXCJleHBpcmVzXCIpID4gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSApe1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLmRpcnR5ID0gZmFsc2U7XHJcblx0XHQgICAgY2IuY2FsbCgpO1xyXG5cdFx0ICAgIHJldHVybjtcclxuXHRcdH1cclxuICAgICAgICAgICAgfVxyXG5cdCAgICBcclxuICAgICAgICAgICAgdGhpcy5wb29sLmNhbGwoIG5hbWUgKyBcIk1vZGVsSW5pdFwiLCBtb2RlbCwgY2IgKTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNsb3NlTW9kZWwoIG5hbWUgKXtcclxuICAgICAgICAvLyB0by1kbzogZmluZCwgY29tbWl0LCByZW1vdmUgZnJvbSB0aGlzLm1vZGVsc1xyXG4gICAgfVxyXG5cclxuICAgIGFwcE1vZGVsSW5pdCggbW9kZWwsIGNiICl7XHJcblxyXG5cdGxldCByZXBvVVJMID0gW1xyXG5cdCAgICBcImh0dHA6Ly93d3cuY3JhaXQubmV0L2FyZHVib3kvcmVwbzIuanNvblwiLFxyXG5cdCAgICBcImh0dHA6Ly9hcmR1Ym95LnJpZWQuY2wvcmVwby5qc29uXCJcclxuXHRdO1xyXG5cclxuXHRpZiggbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiRWxlY3Ryb25cIikgPT0gLTEgJiYgdHlwZW9mIGNvcmRvdmEgPT0gXCJ1bmRlZmluZWRcIiApe1xyXG5cdCAgICAvLyBtb2RlbC5zZXRJdGVtKFwicHJveHlcIiwgXCJodHRwczovL2Nyb3Nzb3JpZ2luLm1lL1wiKTtcclxuXHQgICAgbW9kZWwuc2V0SXRlbShcInByb3h5XCIsIFwiaHR0cHM6Ly9jb3JzLWFueXdoZXJlLmhlcm9rdWFwcC5jb20vXCIpO1xyXG5cdCAgICByZXBvVVJMID0gcmVwb1VSTC5tYXAoIHVybCA9PiBtb2RlbC5nZXRJdGVtKFwicHJveHlcIikgKyB1cmwgKTtcclxuXHR9ZWxzZXtcclxuXHQgICAgbW9kZWwuc2V0SXRlbShcInByb3h5XCIsIFwiXCIpO1xyXG5cdH1cclxuXHJcblx0bGV0IGl0ZW1zID0gW107XHJcblx0bGV0IHBlbmRpbmcgPSAyO1xyXG5cclxuXHRyZXBvVVJMLmZvckVhY2goIHVybCA9Plx0XHJcblx0XHRcdCBmZXRjaCggdXJsIClcclxuXHRcdFx0IC50aGVuKCByc3AgPT4gcnNwLmpzb24oKSApXHJcblx0XHRcdCAudGhlbiggXHJcblx0XHRcdCAgICAganNvbiA9PiBcclxuXHRcdFx0XHQganNvbiAmJiBcclxuXHRcdFx0XHQganNvbi5pdGVtcyAmJiBcclxuXHRcdFx0XHQganNvbi5pdGVtcy5mb3JFYWNoKCBpdGVtID0+IHtcclxuXHRcdFx0XHQgICAgIGl0ZW0uYXV0aG9yID0gaXRlbS5hdXRob3IgfHwgXCI8PHVua25vd24+PlwiO1xyXG5cdFx0XHRcdCAgICAgaWYoXHJcblx0XHRcdFx0XHQgaXRlbS5iYW5uZXIgJiYgKFxyXG5cdFx0XHRcdFx0ICFpdGVtLnNjcmVlbnNob3RzIHx8XHJcblx0XHRcdFx0XHQgIWl0ZW0uc2NyZWVuc2hvdHNbMF0gfHxcclxuXHRcdFx0XHRcdCAhaXRlbS5zY3JlZW5zaG90c1swXS5maWxlbmFtZVxyXG5cdFx0XHRcdFx0ICkpXHJcblx0XHRcdFx0IFx0IGl0ZW0uc2NyZWVuc2hvdHMgPSBbe2ZpbGVuYW1lOml0ZW0uYmFubmVyfV07XHJcblx0XHRcdFx0ICAgICBcclxuXHRcdFx0XHQgICAgIGl0ZW1zLnB1c2goaXRlbSk7XHJcblx0XHRcdFx0IH0pIHx8IFxyXG5cdFx0XHRcdCBkb25lKClcclxuXHRcdFx0IClcclxuXHRcdFx0IC5jYXRjaCggZXJyID0+IHtcclxuXHRcdFx0ICAgICBjb25zb2xlLmxvZyggZXJyICk7XHJcblx0XHRcdCAgICAgZG9uZSgpO1xyXG5cdFx0XHQgfSlcdFxyXG5cdFx0ICAgICAgICk7XHJcblxyXG5cdGZ1bmN0aW9uIGRvbmUoKXtcclxuXHQgICAgcGVuZGluZy0tO1xyXG5cclxuXHQgICAgaWYoICFwZW5kaW5nICl7XHJcblx0XHRpdGVtcyA9IGl0ZW1zLnNvcnQoKGEsIGIpID0+IHtcclxuXHRcdCAgICBpZiggYS50aXRsZSA+IGIudGl0bGUgKSByZXR1cm4gMTtcclxuXHRcdCAgICBpZiggYS50aXRsZSA8IGIudGl0bGUgKSByZXR1cm4gLTE7XHJcblx0XHQgICAgcmV0dXJuIDA7XHJcblx0XHR9KTtcclxuXHRcdG1vZGVsLnJlbW92ZUl0ZW0oXCJyZXBvXCIpO1xyXG5cdFx0bW9kZWwuc2V0SXRlbShcInJlcG9cIiwgaXRlbXMpO1xyXG5cdFx0bW9kZWwuc2V0SXRlbShcImV4cGlyZXNcIiwgKG5ldyBEYXRlKCkpLmdldFRpbWUoKSArIDYwICogNjAgKiAxMDAwICk7XHJcblx0XHRjYigpO1xyXG5cdCAgICB9XHJcblx0fVxyXG4gICAgfVxyXG5cclxuICAgIGNvbW1pdCgpe1xyXG5cclxuICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubW9kZWxzLmxlbmd0aDsgKytpICl7XHJcblxyXG4gICAgICAgICAgICB2YXIgb2JqID0gdGhpcy5tb2RlbHNbaV07XHJcbiAgICAgICAgICAgIGlmKCAhb2JqLmRpcnR5ICYmIG9iai5tb2RlbC5kaXJ0eSApe1xyXG5cclxuICAgICAgICAgICAgICAgIG9iai5kaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBvYmoubW9kZWwuZGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBvYmouZGlydHkgJiYgIW9iai5tb2RlbC5kaXJ0eSApe1xyXG5cclxuICAgICAgICAgICAgICAgIG9iai5kaXJ0eSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9yZS5zZXRJdGVtKCBvYmoucGF0aCwgSlNPTi5zdHJpbmdpZnkob2JqLm1vZGVsLmRhdGEpICk7XHJcblxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggb2JqLmRpcnR5ICYmIG9iai5tb2RlbC5kaXJ0eSApe1xyXG5cclxuICAgICAgICAgICAgICAgIG9iai5tb2RlbC5kaXJ0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldEFjdGl2ZVZpZXcoIHZpZXcgKXtcclxuICAgICAgICBbLi4udGhpcy5ET00uZWxlbWVudC5jaGlsZHJlbl0uZm9yRWFjaCggbm9kZSA9PiBub2RlLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQobm9kZSkgKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBBcHA7XHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICB3cml0ZTp7XHJcblxyXG4gICAgICAgIFsweDE1ICsgMHgyMF06ZnVuY3Rpb24oIHZhbHVlICl7XHJcblxyXG4gICAgICAgICAgICB0aGlzLlRPVjAgPSB2YWx1ZSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuT0NGMEEgPSAodmFsdWU+PjEpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5PQ0YwQiA9ICh2YWx1ZT4+MikgJiAxO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBbMHgyNCArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xyXG5cclxuICAgICAgICAgICAgdGhpcy5XR00wMCAgPSAodmFsdWU+PjApICYgMTtcclxuICAgICAgICAgICAgdGhpcy5XR00wMSAgPSAodmFsdWU+PjEpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5DT00wQjAgPSAodmFsdWU+PjQpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5DT00wQjEgPSAodmFsdWU+PjUpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5DT00wQTAgPSAodmFsdWU+PjYpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5DT00wQTEgPSAodmFsdWU+PjcpICYgMTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdGUoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBUQ0NSMEE6XFxuICBXR00wMDoke3RoaXMuV0dNMDB9XFxuICBXR00wMToke3RoaXMuV0dNMDF9XFxuICBDT00wQjA6JHt0aGlzLkNPTTBCMH1cXG4gIENPTTBCMToke3RoaXMuQ09NMEIxfVxcbiAgQ09NMEEwOiR7dGhpcy5DT00wQTB9XFxuICBDT00wQTE6JHt0aGlzLkNPTTBBMX1gKTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgWzB4MjUgKyAweDIwXTpmdW5jdGlvbiggdmFsdWUgKXtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuRk9DMEEgPSAodmFsdWU+PjcpICYgMTtcclxuICAgICAgICAgICAgdGhpcy5GT0MwQiA9ICh2YWx1ZT4+NikgJiAxO1xyXG4gICAgICAgICAgICB0aGlzLldHTTAyID0gKHZhbHVlPj4zKSAmIDE7XHJcbiAgICAgICAgICAgIHRoaXMuQ1MgPSB2YWx1ZSAmIDc7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgVENDUjBCOlxcbiAgRk9DMEE6JHt0aGlzLkZPQzBBfVxcbiAgRk9DMEI6JHt0aGlzLkZPQzBCfVxcbiAgV0dNMDI6JHt0aGlzLldHTTAyfWApO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coIFwiUEM9XCIgKyAodGhpcy5jb3JlLnBjPDwxKS50b1N0cmluZygxNikgKyBcIiBXUklURSBUQ0NSMEI6ICNcIiArIHZhbHVlLnRvU3RyaW5nKDE2KSArIFwiIDogXCIgKyB2YWx1ZSApO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBbMHgyNyArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xyXG4gICAgICAgICAgICB0aGlzLk9DUjBBID0gdmFsdWU7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCBcIk9DUjBBID0gXCIgKyB2YWx1ZSApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIFsweDI4ICsgMHgyMF06ZnVuY3Rpb24oIHZhbHVlICl7XHJcbiAgICAgICAgICAgIHRoaXMuT0NSMEIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coIFwiT0NSMEIgPSBcIiArIHZhbHVlICk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgWzB4NkVdOmZ1bmN0aW9uKCB2YWx1ZSApe1xyXG4gICAgICAgICAgICB0aGlzLlRPSUUwID0gdmFsdWUgJiAxO1xyXG4gICAgICAgICAgICB0aGlzLk9DSUUwQSA9ICh2YWx1ZT4+MSkgJiAxO1xyXG4gICAgICAgICAgICB0aGlzLk9DSUUwQiA9ICh2YWx1ZT4+MikgJiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgIH0sXHJcblxyXG4gICAgaW5pdDpmdW5jdGlvbigpe1xyXG4gICAgICAgIHRoaXMudGljayA9IDA7XHJcbiAgICAgICAgdGhpcy5XR00wMCAgPSAwO1xyXG4gICAgICAgIHRoaXMuV0dNMDEgID0gMDtcclxuICAgICAgICB0aGlzLkNPTTBCMCA9IDA7XHJcbiAgICAgICAgdGhpcy5DT00wQjEgPSAwO1xyXG4gICAgICAgIHRoaXMuQ09NMEEwID0gMDtcclxuICAgICAgICB0aGlzLkNPTTBBMSA9IDA7XHJcbiAgICAgICAgdGhpcy5GT0MwQSA9IDA7XHJcbiAgICAgICAgdGhpcy5GT0MwQiA9IDA7XHJcbiAgICAgICAgdGhpcy5XR00wMiA9IDA7XHJcbiAgICAgICAgdGhpcy5DUyA9IDA7XHJcbiAgICAgICAgdGhpcy5UT1YwID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5UT0lFMCA9IDA7XHJcbiAgICAgICAgdGhpcy5PQ0lFMEEgPSAwO1xyXG4gICAgICAgIHRoaXMuT0NJRTBCID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy50aW1lID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgTUFYID0gMHhGRiwgQk9UVE9NID0gMCwgV0dNMDAgPSB0aGlzLldHTTAwLCBXR00wMSA9IHRoaXMuV0dNMDEsIFdHTTAyID0gdGhpcy5XR00wMjtcclxuXHJcbiAgICAgICAgICAgIGlmKCAgICAgICBXR00wMiA9PSAwICYmIFdHTTAxID09IDAgJiYgV0dNMDAgPT0gMCApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gMDtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGltZXIgTW9kZTogTm9ybWFsIChcIiArIHRoaXMubW9kZSArIFwiKVwiKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIFdHTTAyID09IDAgJiYgV0dNMDEgPT0gMCAmJiBXR00wMCA9PSAxICl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSAxO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBNb2RlOiBQV00sIHBoYXNlIGNvcnJlY3QgKFwiICsgdGhpcy5tb2RlICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZiggV0dNMDIgPT0gMCAmJiBXR00wMSA9PSAxICYmIFdHTTAwID09IDAgKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IDI7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRpbWVyIE1vZGU6IENUQyAoXCIgKyB0aGlzLm1vZGUgKyBcIilcIik7XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBXR00wMiA9PSAwICYmIFdHTTAxID09IDEgJiYgV0dNMDAgPT0gMSApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gMztcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGltZXIgTW9kZTogRmFzdCBQV00gKFwiICsgdGhpcy5tb2RlICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZiggV0dNMDIgPT0gMSAmJiBXR00wMSA9PSAwICYmIFdHTTAwID09IDAgKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IDQ7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRpbWVyIE1vZGU6IFJlc2VydmVkIChcIiArIHRoaXMubW9kZSArIFwiKVwiKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIFdHTTAyID09IDEgJiYgV0dNMDEgPT0gMCAmJiBXR00wMCA9PSAxICl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSA1O1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBNb2RlOiBQV00sIHBoYXNlIGNvcnJlY3QgKFwiICsgdGhpcy5tb2RlICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZiggV0dNMDIgPT0gMSAmJiBXR00wMSA9PSAxICYmIFdHTTAwID09IDAgKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IDY7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRpbWVyIE1vZGU6IFJlc2VydmVkIChcIiArIHRoaXMubW9kZSArIFwiKVwiKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIFdHTTAyID09IDEgJiYgV0dNMDEgPT0gMSAmJiBXR00wMCA9PSAxICl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSA3O1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBNb2RlOiBGYXN0IFBXTSAoXCIgKyB0aGlzLm1vZGUgKyBcIilcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCggdGhpcy5DUyApe1xyXG4gICAgICAgICAgICBjYXNlIDA6IHRoaXMucHJlc2NhbGUgPSAwOyBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAxOiB0aGlzLnByZXNjYWxlID0gMTsgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMjogdGhpcy5wcmVzY2FsZSA9IDg7IGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDM6IHRoaXMucHJlc2NhbGUgPSA2NDsgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgNDogdGhpcy5wcmVzY2FsZSA9IDI1NjsgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgNTogdGhpcy5wcmVzY2FsZSA9IDEwMjQ7IGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OiB0aGlzLnByZXNjYWxlID0gMTsgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHJlYWQ6e1xyXG5cclxuICAgICAgICBbMHgxNSArIDB4MjBdOmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHJldHVybiAoKCEhdGhpcy5UT1YwKSYxKSB8ICh0aGlzLk9DRjBBPDwxKSB8ICh0aGlzLk9DRjBCPDwyKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBbMHgyNiArIDB4MjBdOmZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGljayA9IHRoaXMuY29yZS50aWNrO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRpY2tzU2luY2VPVkYgPSB0aWNrIC0gdGhpcy50aWNrO1xyXG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWwgPSAodGlja3NTaW5jZU9WRiAvIHRoaXMucHJlc2NhbGUpIHwgMDtcclxuICAgICAgICAgICAgaWYoICFpbnRlcnZhbCApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgVENOVDAgPSAweDI2ICsgMHgyMDtcclxuICAgICAgICAgICAgdmFyIGNudCA9IHRoaXMuY29yZS5tZW1vcnlbIFRDTlQwIF0gKyBpbnRlcnZhbDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5tZW1vcnlbIFRDTlQwIF0gKz0gaW50ZXJ2YWw7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLnRpY2sgKz0gaW50ZXJ2YWwqdGhpcy5wcmVzY2FsZTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuVE9WMCArPSAoY250IC8gMHhGRikgfCAwO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGU6ZnVuY3Rpb24oIHRpY2ssIGllICl7XHJcblxyXG4gICAgICAgIHZhciB0aWNrc1NpbmNlT1ZGID0gdGljayAtIHRoaXMudGljaztcclxuICAgICAgICB2YXIgaW50ZXJ2YWwgPSAodGlja3NTaW5jZU9WRiAvIHRoaXMucHJlc2NhbGUpIHwgMDtcclxuICAgICAgICBcclxuICAgICAgICBpZiggaW50ZXJ2YWwgKXtcclxuICAgICAgICAgICAgdmFyIFRDTlQwID0gMHgyNiArIDB4MjA7XHJcbiAgICAgICAgICAgIHZhciBjbnQgPSB0aGlzLmNvcmUubWVtb3J5WyBUQ05UMCBdICsgaW50ZXJ2YWw7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvcmUubWVtb3J5WyBUQ05UMCBdICs9IGludGVydmFsO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy50aWNrICs9IGludGVydmFsKnRoaXMucHJlc2NhbGU7XHJcblxyXG4gICAgICAgICAgICB0aGlzLlRPVjAgKz0gKGNudCAvIDB4RkYpIHwgMDtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggdGhpcy5UT1YwID4gMCAmJiBpZSApe1xyXG4gICAgICAgICAgICB0aGlzLlRPVjAtLTtcclxuICAgICAgICAgICAgcmV0dXJuIFwiVElNRVIwT1wiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICB3cml0ZTp7XHJcbiAgICAgICAgMHhDMCggdmFsdWUgKXsgcmV0dXJuIHRoaXMuVUNTUjBBID0gKHRoaXMuVUNTUjBBICYgMGIxMDExMTEwMCkgfCAodmFsdWUgJiAwYjAxMDAwMDExKTsgfSxcclxuICAgICAgICAweEMxKCB2YWx1ZSApeyByZXR1cm4gdGhpcy5VQ1NSMEIgPSB2YWx1ZTsgfSxcclxuICAgICAgICAweEMyKCB2YWx1ZSApeyByZXR1cm4gdGhpcy5VQ1NSMEMgPSB2YWx1ZTsgfSxcclxuICAgICAgICAweEM0KCB2YWx1ZSApeyByZXR1cm4gdGhpcy5VQlJSMEwgPSB2YWx1ZTsgfSxcclxuICAgICAgICAweEM1KCB2YWx1ZSApeyByZXR1cm4gdGhpcy5VQlJSMEggPSB2YWx1ZTsgfSxcclxuICAgICAgICAweEM2KCB2YWx1ZSApeyB0aGlzLmNvcmUucGlucy5zZXJpYWwwID0gKHRoaXMuY29yZS5waW5zLnNlcmlhbDB8fFwiXCIpICsgU3RyaW5nLmZyb21DaGFyQ29kZSh2YWx1ZSk7IHJldHVybiB0aGlzLlVEUjAgPSB2YWx1ZTsgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZWFkOntcclxuICAgICAgICAweEMwKCl7IHJldHVybiB0aGlzLlVDU1IwQTsgfSxcclxuICAgICAgICAweEMxKCl7IHJldHVybiB0aGlzLlVDU1IwQjsgfSxcclxuICAgICAgICAweEMyKCl7IHJldHVybiB0aGlzLlVDU1IwQzsgfSxcclxuICAgICAgICAweEM0KCl7IHJldHVybiB0aGlzLlVCUlIwTDsgfSxcclxuICAgICAgICAweEM1KCl7IHJldHVybiB0aGlzLlVCUlIwSCAmIDB4MEY7IH0sXHJcbiAgICAgICAgMHhDNigpeyByZXR1cm4gdGhpcy5VRFIwOyB9XHJcbiAgICB9LFxyXG5cclxuICAgIGluaXQ6ZnVuY3Rpb24oKXtcclxuICAgICAgICB0aGlzLlVDU1IwQSA9IDB4MjA7XHJcbiAgICAgICAgdGhpcy5VQ1NSMEIgPSAwO1xyXG4gICAgICAgIHRoaXMuVUNTUjBDID0gMHgwNjtcclxuICAgICAgICB0aGlzLlVCUlIwTCA9IDA7IC8vIFVTQVJUIEJhdWQgUmF0ZSAwIFJlZ2lzdGVyIExvd1xyXG4gICAgICAgIHRoaXMuVUJSUjBIID0gMDsgLy8gVVNBUlQgQmF1ZCBSYXRlIDAgUmVnaXN0ZXIgSGlnaCAgICAgICAgICAgIFxyXG4gICAgICAgIHRoaXMuVURSMCA9IDA7XHJcbiAgICB9LFxyXG5cclxuICAgIHVwZGF0ZTpmdW5jdGlvbiggdGljaywgaWUgKXtcclxuXHJcbiAgICB9XHJcblxyXG59O1xyXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgUE9SVEI6e1xuICAgICAgICB3cml0ZTp7XG4gICAgICAgICAgICBbMHgwNCArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xuICAgICAgICAgICAgICAgIHRoaXMuY29yZS5waW5zLkREUkIgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbMHgwNSArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSwgb2xkVmFsdWUgKXtcblxuICAgICAgICAgICAgICAgIGlmKCBvbGRWYWx1ZSA9PSB2YWx1ZSApIHJldHVybjtcblxuXHRcdC8qXG4gICAgICAgICAgICAgICAgaWYoIHR5cGVvZiBkb2N1bWVudCAhPSBcInVuZGVmaW5lZFwiICl7XG4gICAgICAgICAgICAgICAgICAgIGlmKCB2YWx1ZSAmIDB4MjAgKSBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiYmxhY2tcIjtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZiggdHlwZW9mIFdvcmtlckdsb2JhbFNjb3BlID09IFwidW5kZWZpbmVkXCIgKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoIHZhbHVlICYgMHgyMCApIGNvbnNvbGUubG9nKCBcIkxFRCBPTiAjXCIsICh0aGlzLmNvcmUucGM8PDEpLnRvU3RyaW5nKDE2KSApO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGNvbnNvbGUubG9nKCBcIkxFRCBPRkYgI1wiLCAodGhpcy5jb3JlLnBjPDwxKS50b1N0cmluZygxNikgKTtcbiAgICAgICAgICAgICAgICB9XG5cdFx0Ki9cblxuICAgICAgICAgICAgICAgIHRoaXMuY29yZS5waW5zLlBPUlRCID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIndvcmtlckBcIiArIHRoaXMuY29yZS5wYy50b1N0cmluZygxNikgKyBcIlt0aWNrIFwiICsgKHRoaXMuY29yZS50aWNrIC8gdGhpcy5jb3JlLmNsb2NrICogMTAwMCkudG9GaXhlZCgzKSArIFwiXVwiLCBcIiBQT1JUQiA9IFwiLCB2YWx1ZS50b1N0cmluZygyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlYWQ6e1xuICAgICAgICAgICAgWzB4MDMgKyAweDIwXTpmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5QSU5CICYgMHhGRikgfCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbml0OmZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0aGlzLlBJTkIgPSAwO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuY29yZS5waW5zLCBcIlBJTkJcIiwge1xuICAgICAgICAgICAgICAgIHNldDooIHYgKT0+dGhpcy5QSU5CID0gKHY+Pj4wKSYweEZGLFxuICAgICAgICAgICAgICAgIGdldDooKT0+dGhpcy5QSU5CXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBQT1JUQzp7XG4gICAgICAgIHdyaXRlOntcbiAgICAgICAgICAgIFsweDA3ICsgMHgyMF06ZnVuY3Rpb24oIHZhbHVlICl7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3JlLnBpbnMuRERSQyA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFsweDA4ICsgMHgyMF06ZnVuY3Rpb24oIHZhbHVlICl7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3JlLnBpbnMuUE9SVEMgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVhZDp7XG4gICAgICAgICAgICBbMHgwNiArIDB4MjBdOmZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29yZS5waW5zLlBJTkMgPSAodGhpcy5jb3JlLnBpbnMuUElOQyAmIDB4RkYpIHx8IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgUE9SVEQ6e1xuICAgICAgICB3cml0ZTp7XG4gICAgICAgICAgICBbMHgwQSArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xuICAgICAgICAgICAgICAgIHRoaXMuY29yZS5waW5zLkREUkQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbMHgwQiArIDB4MjBdOmZ1bmN0aW9uKCB2YWx1ZSApe1xuICAgICAgICAgICAgICAgIHRoaXMuY29yZS5waW5zLlBPUlREID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlYWQ6e1xuICAgICAgICAgICAgWzB4MDkgKyAweDIwXTpmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvcmUucGlucy5QSU5EID0gKHRoaXMuY29yZS5waW5zLlBJTkQgJiAweEZGKSB8fCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIFRDOnJlcXVpcmUoJy4vQXQzMjhQLVRDLmpzJyksXG5cbiAgICBVU0FSVDpyZXF1aXJlKCcuL0F0MzI4UC1VU0FSVC5qcycpXG5cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0OmZ1bmN0aW9uKCl7XG5cdHRoaXMuU1BEUiA9IDA7XG5cdHRoaXMuU1BJRiA9IDA7XG5cdHRoaXMuV0NPTCA9IDA7XG5cdHRoaXMuU1BJMlggPSAwO1xuXHR0aGlzLlNQSUUgPSAwO1xuXHR0aGlzLlNQRSA9IDA7XG5cdHRoaXMuRE9SRCA9IDA7XG5cdHRoaXMuTVNUUiA9IDA7XG5cdHRoaXMuQ1BPTCA9IDA7XG5cdHRoaXMuQ1BIQSA9IDA7XG5cdHRoaXMuU1BSMSA9IDA7XG5cdHRoaXMuU1BSMCA9IDA7XG5cdHRoaXMuY29yZS5waW5zLnNwaU91dCA9IHRoaXMuY29yZS5waW5zLnNwaU91dCB8fCBbXTtcbiAgICB9LFxuICAgIFxuICAgIHdyaXRlOntcblx0MHg0QzpmdW5jdGlvbiggdmFsdWUsIG9sZFZhbHVlICl7XG5cdCAgICB0aGlzLlNQSUUgPSB2YWx1ZSA+PiA3O1xuXHQgICAgdGhpcy5TUEUgID0gdmFsdWUgPj4gNjtcblx0ICAgIHRoaXMuRE9SRCA9IHZhbHVlID4+IDU7XG5cdCAgICB0aGlzLk1TVFIgPSB2YWx1ZSA+PiA0O1xuXHQgICAgdGhpcy5DUE9MID0gdmFsdWUgPj4gMztcblx0ICAgIHRoaXMuQ1BIQSA9IHZhbHVlID4+IDI7XG5cdCAgICB0aGlzLlNQUjEgPSB2YWx1ZSA+PiAxO1xuXHQgICAgdGhpcy5TUFIwID0gdmFsdWUgPj4gMDtcblx0fSxcblx0XG5cdDB4NEQ6ZnVuY3Rpb24oIHZhbHVlLCBvbGRWYWx1ZSApe1xuXHQgICAgdGhpcy5TUEkyWCA9IHZhbHVlICYgMTtcblx0ICAgIHJldHVybiAodGhpcy5TUElGIDw8IDcpIHwgKHRoaXMuV0NPTCA8PCA2KSB8IHRoaXMuU1BJMlg7XG5cdH0sXG5cdDB4NEU6ZnVuY3Rpb24oIHZhbHVlICl7XG5cdCAgICB0aGlzLlNQRFIgPSB2YWx1ZTtcblx0ICAgIHRoaXMuY29yZS5waW5zLnNwaU91dC5wdXNoKCB2YWx1ZSApO1xuXHQgICAgdGhpcy5TUElGID0gMTtcblx0fVxuICAgIH0sXG4gICAgXG4gICAgcmVhZDp7XG5cdDB4NEQ6ZnVuY3Rpb24oKXtcblx0ICAgIHRoaXMuU1BJRiA9ICghIXRoaXMuY29yZS5waW5zLnNwaUluLmxlbmd0aCkgfCAwO1xuXHQgICAgcmV0dXJuICh0aGlzLlNQSUYgPDwgNykgfCAodGhpcy5XQ09MIDw8IDYpIHwgdGhpcy5TUEkyWDtcblx0fSxcblx0MHg0RTpmdW5jdGlvbigpe1xuXHQgICAgbGV0IHNwaUluID0gdGhpcy5jb3JlLnBpbnMuc3BpSW47XG5cdCAgICBpZiggc3BpSW4ubGVuZ3RoIClcblx0XHRyZXR1cm4gdGhpcy5TUERSID0gc3BpSW4uc2hpZnQoKTtcdCBcblx0ICAgIHJldHVybiB0aGlzLlNQRFI7XG5cdH1cbiAgICB9LFxuICAgIFxuICAgIHVwZGF0ZTpmdW5jdGlvbiggdGljaywgaWUgKXtcblx0XG5cdGlmKCB0aGlzLlNQSUYgJiYgdGhpcy5TUElFICYmIGllICl7XG5cdCAgICB0aGlzLlNQSUYgPSAwO1xuXHQgICAgcmV0dXJuIFwiU1BJXCI7XG5cdH1cblx0ICAgIFxuICAgIH1cbn07XG4iLCJcbmZ1bmN0aW9uIHBvcnQoIG9iaiApe1xuICAgIFxuICAgIGxldCBvdXQgPSB7IHdyaXRlOnt9LCByZWFkOnt9LCBpbml0Om51bGwgfTtcblxuICAgIGZvciggbGV0IGsgaW4gb2JqICl7XG5cdFxuXHRsZXQgYWRkciA9IG9ialtrXTtcblx0aWYoIC9ERFIufFBPUlQuLy50ZXN0KGspICl7XG5cdCAgICBcblx0ICAgIG91dC53cml0ZVsgYWRkciBdID0gc2V0dGVyKGspO1xuXHQgICAgXG5cdH1lbHNle1xuXG5cdCAgICBvdXQucmVhZFsgYWRkciBdID0gZ2V0dGVyKGspO1xuXHQgICAgb3V0LmluaXQgPSBpbml0KGspO1xuXHQgICAgXG5cdH1cblx0XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dGVyKCBrICl7XG5cdHJldHVybiBmdW5jdGlvbiggdmFsdWUsIG9sZFZhbHVlICl7XG5cdCAgICBpZiggdmFsdWUgIT0gb2xkVmFsdWUgKVxuXHRcdHRoaXMuY29yZS5waW5zW2tdID0gdmFsdWU7XHQgICAgXG5cdH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0dGVyKCBrICl7XG5cdHJldHVybiBmdW5jdGlvbigpe1xuXHQgICAgcmV0dXJuICh0aGlzW2tdICYgMHhGRikgfCAwO1xuXHR9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluaXQoIGsgKXtcblx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdCAgICB0aGlzW2tdID0gMDtcblx0ICAgIGxldCBfdGhpcyA9IHRoaXM7XG5cdCAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHRoaXMuY29yZS5waW5zLCBrLCB7XG5cdFx0c2V0OmZ1bmN0aW9uKHYpeyByZXR1cm4gX3RoaXNba10gPSAodj4+PjApICYgMHhGRiB9LFxuXHRcdGdldDpmdW5jdGlvbiggKXsgcmV0dXJuIF90aGlzW2tdIH1cblx0ICAgIH0pO1xuXHR9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXQ7XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgUE9SVEI6cG9ydCh7IFBJTkI6MHgyMywgRERSQjoweDI0LCBQT1JUQjoweDI1IH0pLFxuICAgIFBPUlRDOnBvcnQoeyBQSU5DOjB4MjYsIEREUkM6MHgyNywgUE9SVEM6MHgyOCB9KSxcbiAgICBQT1JURDpwb3J0KHsgUElORDoweDI5LCBERFJEOjB4MkEsIFBPUlREOjB4MkIgfSksXG4gICAgUE9SVEU6cG9ydCh7IFBJTkU6MHgyQywgRERSRToweDJELCBQT1JURToweDJFIH0pLFxuICAgIFBPUlRGOnBvcnQoeyBQSU5GOjB4MkYsIEREUkY6MHgzMCwgUE9SVEY6MHgzMSB9KSxcblxuICAgIFRDOnJlcXVpcmUoJy4vQXQzMjhQLVRDLmpzJyksXG5cbiAgICBVU0FSVDpyZXF1aXJlKCcuL0F0MzI4UC1VU0FSVC5qcycpLFxuXG4gICAgUExMOntcblx0cmVhZDp7XG5cdCAgICAweDQ5OmZ1bmN0aW9uKCB2YWx1ZSApe1xuXHRcdHJldHVybiAodGhpcy5QSU5ESVYgPDwgNCkgfCAodGhpcy5QTExFIDw8IDEpIHwgdGhpcy5QTE9DSztcblx0ICAgIH1cblx0fSxcblx0d3JpdGU6e1xuXHQgICAgMHg0OTpmdW5jdGlvbiggdmFsdWUsIG9sZFZhbHVlICl7XG5cdFx0aWYoIHZhbHVlID09PSBvbGRWYWx1ZSApIHJldHVybjtcblx0XHR0aGlzLlBJTkRJViA9ICh2YWx1ZSA+PiA0KSAmIDE7XG5cdFx0dGhpcy5QTExFICAgPSAodmFsdWUgPj4gMSkgJiAxO1xuXHRcdHRoaXMuUExPQ0sgID0gMTtcblx0ICAgIH1cblx0fSxcblx0aW5pdDpmdW5jdGlvbigpe1xuXHQgICAgdGhpcy5QSU5ESVYgPSAwO1xuXHQgICAgdGhpcy5QTExFID0gMDtcblx0ICAgIHRoaXMuUExPQ0sgPSAwO1xuXHR9XG4gICAgfSxcblxuICAgIFNQSTpyZXF1aXJlKCcuL0F0MzJ1NC1TUEkuanMnKSxcblxuICAgIEVFUFJPTTp7XG5cdHdyaXRlOntcblx0ICAgIDB4M0Y6ZnVuY3Rpb24oIHZhbHVlLCBvbGRWYWx1ZSApe1xuXHRcdHZhbHVlICY9IH4yO1xuXHRcdHJldHVybiB2YWx1ZTtcblx0ICAgIH1cblx0fSxcblx0cmVhZDp7fSxcblx0aW5pdDpmdW5jdGlvbigpe1xuXHQgICAgXG5cdH1cbiAgICB9LFxuXG4gICAgQURDU1JBOntcblx0XG5cdHdyaXRlOntcblx0ICAgIDB4N0E6ZnVuY3Rpb24odmFsdWUsIG9sZFZhbHVlKXtcblx0XHR0aGlzLkFERU4gPSB2YWx1ZT4+NyAmIDE7XG5cdFx0dGhpcy5BRFNDID0gdmFsdWU+PjYgJiAxO1xuXHRcdHRoaXMuQURBVEUgPSB2YWx1ZT4+NSAmIDE7XG5cdFx0dGhpcy5BRElGID0gdmFsdWU+PjQgJiAxO1xuXHRcdHRoaXMuQURJRSA9IHZhbHVlPj4zICYgMTtcblx0XHR0aGlzLkFEUFMyID0gdmFsdWU+PjIgJiAxO1xuXHRcdHRoaXMuQURQUzEgPSB2YWx1ZT4+MSAmIDE7XG5cdFx0dGhpcy5BRFBTMCA9IHZhbHVlICYgMTtcblx0XHRpZiggdGhpcy5BREVOICl7XG5cdFx0ICAgIGlmKCB0aGlzLkFEU0MgKXtcblx0XHRcdHRoaXMuQURDSCA9IChNYXRoLnJhbmRvbSgpICogMHhGRikgPj4+IDA7XG5cdFx0XHR0aGlzLkFEQ0wgPSAoTWF0aC5yYW5kb20oKSAqIDB4RkYpID4+PiAwO1xuXHRcdFx0dGhpcy5BRFNDID0gMDtcblx0XHRcdHZhbHVlICY9IH4oMTw8Nik7XG5cdFx0ICAgIH1cblx0XHR9XG5cdFx0cmV0dXJuIHZhbHVlO1xuXHQgICAgfVxuXHR9LFxuXG5cdHJlYWQ6e1xuXHQgICAgMHg3OTpmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLkFEQ0g7XG5cdCAgICB9LFxuXHQgICAgMHg3ODpmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLkFEQ0w7XG5cdCAgICB9XG5cdH0sXG5cdFx0XG5cdGluaXQ6ZnVuY3Rpb24oKXtcblx0ICAgIHRoaXMuQURFTiA9IDA7XG5cdCAgICB0aGlzLkFEU0MgPSAwO1xuXHQgICAgdGhpcy5BREFURSA9IDA7XG5cdCAgICB0aGlzLkFESUYgPSAwO1xuXHQgICAgdGhpcy5BRElFID0gMDtcblx0ICAgIHRoaXMuQURQUzIgPSAwO1xuXHQgICAgdGhpcy5BRFBTMSA9IDA7XG5cdCAgICB0aGlzLkFEUFMwID0gMDtcblx0fSxcblxuXHR1cGRhdGU6ZnVuY3Rpb24oIHRpY2ssIGllICl7XG5cdCAgICBpZiggdGhpcy5BREVOICYmIHRoaXMuQURJRSApe1xuXHRcdHRoaXMuQURJRiA9IDE7XG5cdFx0dGhpcy5BRFNDID0gMDtcblx0XHR0aGlzLkFEQ0ggPSAoTWF0aC5yYW5kb20oKSAqIDB4RkYpID4+PiAwO1xuXHRcdHRoaXMuQURDTCA9IChNYXRoLnJhbmRvbSgpICogMHhGRikgPj4+IDA7XG5cdCAgICB9XG5cblx0ICAgIGlmKCB0aGlzLkFESUYgJiYgdGhpcy5BRElFICYmIGllICl7XG5cdFx0dGhpcy5BRElGID0gMDtcblx0XHRyZXR1cm4gXCJBRENcIjtcblx0ICAgIH1cblx0fVxuXHRcbiAgICB9XG5cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gaHR0cDovL3d3dy5hdG1lbC5jb20vd2ViZG9jL2F2cmFzc2VtYmxlci9hdnJhc3NlbWJsZXIud2JfaW5zdHJ1Y3Rpb25fbGlzdC5odG1sXG5cbmZ1bmN0aW9uIGJpbiggYnl0ZXMsIHNpemUgKXtcblxuICAgIHZhciBzID0gKGJ5dGVzPj4+MCkudG9TdHJpbmcoMik7XG4gICAgd2hpbGUoIHMubGVuZ3RoIDwgc2l6ZSApIHMgPSBcIjBcIitzO1xuICAgIHJldHVybiBzLnJlcGxhY2UoLyhbMDFdezQsNH0pL2csIFwiJDEgXCIpICsgXCIgICNcIiArIChieXRlcz4+PjApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuICAgIFxufVxuXG5pZiggdHlwZW9mIHBlcmZvcm1hbmNlID09PSBcInVuZGVmaW5lZFwiICl7XG4gICAgaWYoIERhdGUubm93ICkgZ2xvYmFsLnBlcmZvcm1hbmNlID0geyBub3c6KCk9PkRhdGUubm93KCkgfTtcbiAgICBlbHNlIGdsb2JhbC5wZXJmb3JtYW5jZSA9IHsgbm93OigpPT4obmV3IERhdGUoKSkuZ2V0VGltZSgpIH07XG59XG5cbmNsYXNzIEF0Y29yZSB7XG5cbiAgICBjb25zdHJ1Y3RvciggZGVzYyApe1xuXG4gICAgICAgIGlmKCAhZGVzYyApXG4gICAgICAgICAgICByZXR1cm47XG5cblx0dGhpcy5zbGVlcGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNyZWcgPSAwO1xuICAgICAgICB0aGlzLnBjID0gMDtcbiAgICAgICAgdGhpcy5zcCA9IDA7XG4gICAgICAgIHRoaXMuY2xvY2sgPSBkZXNjLmNsb2NrO1xuICAgICAgICB0aGlzLmNvZGVjID0gZGVzYy5jb2RlYztcbiAgICAgICAgdGhpcy5pbnRlcnJ1cHRNYXAgPSBkZXNjLmludGVycnVwdDtcbiAgICAgICAgdGhpcy5lcnJvciA9IDA7XG4gICAgICAgIHRoaXMuZmxhZ3MgPSBkZXNjLmZsYWdzO1xuICAgICAgICB0aGlzLnRpY2sgPSAwO1xuICAgICAgICB0aGlzLnN0YXJ0VGljayA9IDA7XG4gICAgICAgIHRoaXMuZW5kVGljayA9IDA7XG4gICAgICAgIHRoaXMuZXhlY1RpbWUgPSAwO1xuICAgICAgICB0aGlzLnRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuXHR0aGlzLmk4YSA9IG5ldyBJbnQ4QXJyYXkoNCk7XG5cbiAgICAgICAgc2VsZi5CUkVBS1BPSU5UUyA9IHsgMDowIH07XG4gICAgICAgIHNlbGYuRFVNUCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgICdQQzogIycrKHRoaXMucGM8PDEpLnRvU3RyaW5nKDE2KStcbiAgICAgICAgICAgICAgICAnXFxuU1I6ICcgKyB0aGlzLm1lbW9yeVsweDVGXS50b1N0cmluZygyKStcbiAgICAgICAgICAgICAgICAnXFxuU1A6ICMnICsgdGhpcy5zcC50b1N0cmluZygxNikgK1xuICAgICAgICAgICAgICAgICdcXG4nICsgXG4gICAgICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKCB0aGlzLnJlZywgXG4gICAgICAgICAgICAgICAgICAgICh2LGkpID0+ICdSJysoaSsnJykrJyAnKyhpPDEwPycgJzonJykrJz1cXHQjJyt2LnRvU3RyaW5nKDE2KSArICdcXHQnICsgdiBcbiAgICAgICAgICAgICAgICApLmpvaW4oJ1xcbicpIFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICBUaGUgSS9PIG1lbW9yeSBzcGFjZSBjb250YWlucyA2NCBhZGRyZXNzZXMgZm9yIENQVSBwZXJpcGhlcmFsIGZ1bmN0aW9ucyBhcyBjb250cm9sIHJlZ2lzdGVycywgU1BJLCBhbmQgb3RoZXIgSS9PIGZ1bmN0aW9ucy5cbiAgICAgICAgVGhlIEkvTyBtZW1vcnkgY2FuIGJlIGFjY2Vzc2VkIGRpcmVjdGx5LCBvciBhcyB0aGUgZGF0YSBzcGFjZSBsb2NhdGlvbnMgZm9sbG93aW5nIHRob3NlIG9mIHRoZSByZWdpc3RlciBmaWxlLCAweDIwIC0gMHg1Ri4gSW5cbiAgICAgICAgYWRkaXRpb24sIHRoZSBBVG1lZ2EzMjhQIGhhcyBleHRlbmRlZCBJL08gc3BhY2UgZnJvbSAweDYwIC0gMHhGRiBpbiBTUkFNIHdoZXJlIG9ubHkgdGhlIFNUL1NUUy9TVEQgYW5kXG4gICAgICAgIExEL0xEUy9MREQgaW5zdHJ1Y3Rpb25zIGNhbiBiZSB1c2VkLiAgICAgICAgXG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWVtb3J5ID0gbmV3IFVpbnQ4QXJyYXkoIFxuICAgICAgICAgICAgMzIgLy8gcmVnaXN0ZXIgZmlsZVxuICAgICAgICAgICAgKyAoMHhGRiAtIDB4MUYpIC8vIGlvXG4gICAgICAgICAgICArIGRlc2Muc3JhbVxuICAgICAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZmxhc2ggPSBuZXcgVWludDhBcnJheSggZGVzYy5mbGFzaCApO1xuICAgICAgICB0aGlzLmVlcHJvbSA9IG5ldyBVaW50OEFycmF5KCBkZXNjLmVlcHJvbSApO1xuXG4gICAgICAgIHRoaXMuaW5pdE1hcHBpbmcoKTtcbiAgICAgICAgdGhpcy5pbnN0cnVjdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMucGVyaWZlcmFscyA9IHt9O1xuICAgICAgICB0aGlzLnBpbnMgPSB7fTtcblxuICAgICAgICBmb3IoIHZhciBwZXJpZmVyYWxOYW1lIGluIGRlc2MucGVyaWZlcmFscyApe1xuXG4gICAgICAgICAgICBsZXQgYWRkciwgcGVyaWZlcmFsID0gZGVzYy5wZXJpZmVyYWxzWyBwZXJpZmVyYWxOYW1lIF07XG4gICAgICAgICAgICBsZXQgb2JqID0gdGhpcy5wZXJpZmVyYWxzWyBwZXJpZmVyYWxOYW1lIF0gPSB7IGNvcmU6dGhpcyB9O1xuXG4gICAgICAgICAgICBmb3IoIGFkZHIgaW4gcGVyaWZlcmFsLndyaXRlIClcbiAgICAgICAgICAgICAgICB0aGlzLndyaXRlTWFwWyBhZGRyIF0gPSBwZXJpZmVyYWwud3JpdGVbIGFkZHIgXS5iaW5kKCBvYmogKTtcblxuICAgICAgICAgICAgZm9yKCBhZGRyIGluIHBlcmlmZXJhbC5yZWFkIClcbiAgICAgICAgICAgICAgICB0aGlzLnJlYWRNYXBbIGFkZHIgXSA9IHBlcmlmZXJhbC5yZWFkWyBhZGRyIF0uYmluZCggb2JqICk7XG5cbiAgICAgICAgICAgIGlmKCBwZXJpZmVyYWwudXBkYXRlIClcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QucHVzaCggcGVyaWZlcmFsLnVwZGF0ZS5iaW5kKCBvYmogKSApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiggcGVyaWZlcmFsLmluaXQgKVxuICAgICAgICAgICAgICAgIHBlcmlmZXJhbC5pbml0LmNhbGwoIG9iaiApO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGluaXRNYXBwaW5nKCl7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCB0aGlzLCB7XG4gICAgICAgICAgICB3cml0ZU1hcDp7IHZhbHVlOnt9LCBlbnVtZXJhYmxlOmZhbHNlLCB3cml0YWJsZTpmYWxzZSB9LFxuICAgICAgICAgICAgcmVhZE1hcDp7IHZhbHVlOnt9LCBlbnVtZXJhYmxlOmZhbHNlLCB3cml0YWJsZTpmYWxzZSB9LFxuICAgICAgICAgICAgdXBkYXRlTGlzdDp7IHZhbHVlOltdLCBlbnVtZXJhYmxlOmZhbHNlLCB3cml0YWJsZTpmYWxzZSB9LFxuICAgICAgICAgICAgcmVnOnsgdmFsdWU6IG5ldyBVaW50OEFycmF5KCB0aGlzLm1lbW9yeS5idWZmZXIsIDAsIDB4MjAgKSwgZW51bWVyYWJsZTpmYWxzZSB9LFxuICAgICAgICAgICAgd3JlZzp7IHZhbHVlOiBuZXcgVWludDE2QXJyYXkoIHRoaXMubWVtb3J5LmJ1ZmZlciwgMHgyMC04LCA0ICksIGVudW1lcmFibGU6IGZhbHNlIH0sXG4gICAgICAgICAgICBzcmFtOnsgdmFsdWU6IG5ldyBVaW50OEFycmF5KCB0aGlzLm1lbW9yeS5idWZmZXIsIDB4MTAwICksIGVudW1lcmFibGU6ZmFsc2UgfSxcbiAgICAgICAgICAgIGlvOnsgdmFsdWU6IG5ldyBVaW50OEFycmF5KCB0aGlzLm1lbW9yeS5idWZmZXIsIDB4MjAsIDB4RkYgLSAweDIwICksIGVudW1lcmFibGU6ZmFsc2UgfSxcbiAgICAgICAgICAgIHByb2c6eyB2YWx1ZTogbmV3IFVpbnQxNkFycmF5KCB0aGlzLmZsYXNoLmJ1ZmZlciApLCBlbnVtZXJhYmxlOmZhbHNlIH0sXG4gICAgICAgICAgICBuYXRpdmU6eyB2YWx1ZTp7fSwgZW51bWVyYWJsZTpmYWxzZSB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuY29kZWMuZm9yRWFjaCggb3AgPT57XG4gICAgICAgICAgICBpZiggb3Auc3RyICkgcGFyc2UoIG9wICk7XG4gICAgICAgICAgICBvcC5hcmd2ID0gT2JqZWN0LmFzc2lnbih7fSwgb3AuYXJncykgXG4gICAgICAgICAgICBvcC5ieXRlcyA9IG9wLmJ5dGVzIHx8IDI7XG4gICAgICAgICAgICBvcC5jeWNsZXMgPSBvcC5jeWNsZXMgfHwgMTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVhZCggYWRkciwgcGMgKXtcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5tZW1vcnlbIGFkZHIgXTtcblxuICAgICAgICB2YXIgcGVyaWZlcmFsID0gdGhpcy5yZWFkTWFwWyBhZGRyIF07XG4gICAgICAgIGlmKCBwZXJpZmVyYWwgKXtcbiAgICAgICAgICAgIHZhciByZXQgPSBwZXJpZmVyYWwoIHZhbHVlICk7XG4gICAgICAgICAgICBpZiggcmV0ICE9PSB1bmRlZmluZWQgKSB2YWx1ZSA9IHJldDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmKCAhKHtcbiAgICAgICAgLy8gICAgIDB4NWQ6MSwgLy8gU3RhY2sgUG9pbnRlciBMb3dcbiAgICAgICAgLy8gICAgIDB4NWU6MSwgLy8gU3RhY2sgUG9pbnRlciBIaWdoXG4gICAgICAgIC8vICAgICAweDVmOjEsIC8vIHN0YXR1cyByZWdpc3RlclxuICAgICAgICAvLyAgICAgMHgyNToxLCAvLyBQT1JUQlxuICAgICAgICAvLyAgICAgMHgzNToxLCAvLyBUT1YwXG4gICAgICAgIC8vICAgICAweDIzOjEsICAvLyBQSU5CXG4gICAgICAgIC8vICAgICAweDE0QjoxIC8vIHZlcmJvc2UgVVNBUlQgc3R1ZmZcbiAgICAgICAgLy8gfSlbYWRkcl0gKVxuICAgICAgICAvLyBjb25zb2xlLmxvZyggXCJSRUFEOiAjXCIsIGFkZHIudG9TdHJpbmcoMTYpICk7XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIHJlYWRCaXQoIGFkZHIsIGJpdCwgcGMgKXtcblxuICAgICAgICAvLyBpZiggISh7XG4gICAgICAgIC8vICAgICAweDVkOjEsIC8vIFN0YWNrIFBvaW50ZXIgTG93XG4gICAgICAgIC8vICAgICAweDVlOjEsIC8vIFN0YWNrIFBvaW50ZXIgSGlnaFxuICAgICAgICAvLyAgICAgMHg1ZjoxLCAvLyBzdGF0dXMgcmVnaXN0ZXJcbiAgICAgICAgLy8gICAgIDB4MjU6MSwgLy8gUE9SVEJcbiAgICAgICAgLy8gICAgIDB4MzU6MSwgLy8gVE9WMFxuICAgICAgICAvLyAgICAgMHgyMzoxICAvLyBQSU5CXG4gICAgICAgIC8vIH0pW2FkZHJdIClcbiAgICAgICAgLy8gY29uc29sZS5sb2coIFwiUEM9XCIgKyAocGM8PDEpLnRvU3RyaW5nKDE2KSArIFwiIFJFQUQgI1wiICsgKGFkZHIgIT09IHVuZGVmaW5lZCA/IGFkZHIudG9TdHJpbmcoMTYpIDogJ3VuZGVmaW5lZCcpICsgXCIgQCBcIiArIGJpdCApO1xuXG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMubWVtb3J5WyBhZGRyIF07XG5cbiAgICAgICAgdmFyIHBlcmlmZXJhbCA9IHRoaXMucmVhZE1hcFsgYWRkciBdO1xuICAgICAgICBpZiggcGVyaWZlcmFsICl7XG4gICAgICAgICAgICB2YXIgcmV0ID0gcGVyaWZlcmFsKCB2YWx1ZSApO1xuICAgICAgICAgICAgaWYoIHJldCAhPT0gdW5kZWZpbmVkICkgdmFsdWUgPSByZXQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKHZhbHVlID4+PiBiaXQpICYgMTtcbiAgICB9XG5cbiAgICB3cml0ZSggYWRkciwgdmFsdWUgKXtcblxuICAgICAgICB2YXIgcGVyaWZlcmFsID0gdGhpcy53cml0ZU1hcFsgYWRkciBdO1xuXG4gICAgICAgIGlmKCBwZXJpZmVyYWwgKXtcbiAgICAgICAgICAgIHZhciByZXQgPSBwZXJpZmVyYWwoIHZhbHVlLCB0aGlzLm1lbW9yeVsgYWRkciBdICk7XG4gICAgICAgICAgICBpZiggcmV0ID09PSBmYWxzZSApIHJldHVybjtcbiAgICAgICAgICAgIGlmKCByZXQgIT09IHVuZGVmaW5lZCApIHZhbHVlID0gcmV0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMubWVtb3J5WyBhZGRyIF0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICB3cml0ZUJpdCggYWRkciwgYml0LCBidmFsdWUgKXtcblx0YnZhbHVlID0gKCEhYnZhbHVlKSB8IDA7XG5cdHZhciB2YWx1ZSA9IHRoaXMubWVtb3J5WyBhZGRyIF07XG5cdHZhbHVlID0gKHZhbHVlICYgfigxPDxiaXQpKSB8IChidmFsdWU8PGJpdCk7XG5cdFxuICAgICAgICB2YXIgcGVyaWZlcmFsID0gdGhpcy53cml0ZU1hcFsgYWRkciBdO1xuXG4gICAgICAgIGlmKCBwZXJpZmVyYWwgKXtcbiAgICAgICAgICAgIHZhciByZXQgPSBwZXJpZmVyYWwoIHZhbHVlLCB0aGlzLm1lbW9yeVsgYWRkciBdICk7XG4gICAgICAgICAgICBpZiggcmV0ID09PSBmYWxzZSApIHJldHVybjtcbiAgICAgICAgICAgIGlmKCByZXQgIT09IHVuZGVmaW5lZCApIHZhbHVlID0gcmV0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMubWVtb3J5WyBhZGRyIF0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBleGVjKCB0aW1lICl7XG4gICAgICAgIHZhciBjeWNsZXMgPSAodGltZSAqIHRoaXMuY2xvY2spfDA7XG4gICAgICAgIFxuICAgICAgICB2YXIgc3RhcnQgPSB0aGlzLnRpY2s7XG4gICAgICAgIHRoaXMuZW5kVGljayA9IHRoaXMuc3RhcnRUaWNrICsgY3ljbGVzO1xuICAgICAgICB0aGlzLmV4ZWNUaW1lID0gdGltZTtcblxuICAgICAgICB0cnl7XG5cblx0ICAgIHdoaWxlKCB0aGlzLnRpY2sgPCB0aGlzLmVuZFRpY2sgKXtcblx0XHRpZiggIXRoaXMuc2xlZXBpbmcgKXtcblxuXHRcdCAgICBpZiggdGhpcy5wYyA+IDB4RkZGRiApIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBmdW5jID0gdGhpcy5uYXRpdmVbIHRoaXMucGMgXTtcblx0XHQgICAgLy8gaWYoICFmdW5jICkgXHRcdCAgICBjb25zb2xlLmxvZyggdGhpcy5wYyApO1xuICAgICAgICAgICAgICAgICAgICBpZiggZnVuYyApIGZ1bmMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiggIXRoaXMuZ2V0QmxvY2soKSApXG5cdFx0XHRicmVhaztcblx0XHR9ZWxzZXtcblx0XHQgICAgdGhpcy50aWNrICs9IDEwMDtcblx0XHR9XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQZXJpZmVyYWxzKCk7XG5cdCAgICB9XG5cblx0XHRcbiAgICAgICAgfWZpbmFsbHl7XG5cblx0ICAgIHRoaXMuc3RhcnRUaWNrID0gdGhpcy5lbmRUaWNrO1xuXG5cdH1cblxuICAgIH1cblxuICAgIHVwZGF0ZVBlcmlmZXJhbHMoKXtcblxuICAgICAgICB2YXIgaW50ZXJydXB0c0VuYWJsZWQgPSB0aGlzLm1lbW9yeVsweDVGXSAmICgxPDw3KTtcblxuICAgICAgICB2YXIgdXBkYXRlTGlzdCA9IHRoaXMudXBkYXRlTGlzdDtcblxuICAgICAgICBmb3IoIHZhciBpPTAsIGw9dXBkYXRlTGlzdC5sZW5ndGg7IGk8bDsgKytpICl7XG5cbiAgICAgICAgICAgIHZhciByZXQgPSB1cGRhdGVMaXN0W2ldKCB0aGlzLnRpY2ssIGludGVycnVwdHNFbmFibGVkICk7XG5cbiAgICAgICAgICAgIGlmKCByZXQgJiYgaW50ZXJydXB0c0VuYWJsZWQgKXtcbiAgICAgICAgICAgICAgICBpbnRlcnJ1cHRzRW5hYmxlZCA9IDA7XG5cdFx0dGhpcy5zbGVlcGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJydXB0KCByZXQgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICB1cGRhdGUoKXtcbiAgICAgICAgdmFyIG5vdyA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICB2YXIgZGVsdGEgPSBub3cgLSB0aGlzLnRpbWU7XG5cbiAgICAgICAgZGVsdGEgPSBNYXRoLm1heCggMCwgTWF0aC5taW4oIDMzLCBkZWx0YSApICk7XG5cbiAgICAgICAgdGhpcy5leGVjKCBkZWx0YS8xMDAwICk7XG5cbiAgICAgICAgdGhpcy50aW1lID0gbm93O1xuICAgIH1cblxuICAgIGdldEJsb2NrKCl7XG5cblxuICAgICAgICB2YXIgc3RhcnRQQyA9IHRoaXMucGM7XG5cbiAgICAgICAgdmFyIHNraXAgPSBmYWxzZSwgcHJldiA9IGZhbHNlO1xuICAgICAgICB2YXIgbm9wID0ge25hbWU6J05PUCcsIGN5Y2xlczoxLCBlbmQ6dHJ1ZSwgYXJndjp7fX07XG4gICAgICAgIHZhciBjYWNoZUxpc3QgPSBbJ3JlZycsICd3cmVnJywgJ2lvJywgJ21lbW9yeScsICdzcmFtJywgJ2ZsYXNoJ11cbiAgICAgICAgdmFyIGNvZGUgPSAnXCJ1c2Ugc3RyaWN0XCI7XFxudmFyIHNwPXRoaXMuc3AsIHIsIHQxLCBpOGE9dGhpcy5pOGEsIFNLSVA9ZmFsc2UsICc7XG4gICAgICAgIGNvZGUgKz0gY2FjaGVMaXN0Lm1hcChjPT4gYCR7Y30gPSB0aGlzLiR7Y31gKS5qb2luKCcsICcpO1xuICAgICAgICBjb2RlICs9ICc7XFxuJztcbiAgICAgICAgY29kZSArPSAndmFyIHNyID0gbWVtb3J5WzB4NUZdJztcbiAgICAgICAgZm9yKCB2YXIgaT0wOyBpPDg7ICsraSApXG4gICAgICAgICAgICBjb2RlICs9IGAsIHNyJHtpfSA9IChzcj4+JHtpfSkmMWA7XG4gICAgICAgIGNvZGUgKz0gJztcXG4nO1xuXG4gICAgICAgIC8vIGNvZGUgKz0gXCJjb25zb2xlLmxvZygnXFxcXG5FTlRFUiBCTE9DSzogXCIgKyAodGhpcy5wYzw8MSkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkgKyBcIiBAICcsICh0aGlzLnBjPDwxKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKSApO1xcblwiO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnQ1JFQVRFIEJMT0NLOiAnLCAodGhpcy5wYzw8MSkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkgKTtcbiAgICAgICAgY29kZSArPSAnc3dpdGNoKCB0aGlzLnBjICl7XFxuJztcblxuICAgICAgICBkb3tcblxuICAgICAgICAgICAgdmFyIGluc3QgPSB0aGlzLmlkZW50aWZ5KCk7XG4gICAgICAgICAgICBpZiggIWluc3QgKXtcbiAgICAgICAgICAgICAgICAvLyBpbnN0ID0gbm9wO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybiggdGhpcy5lcnJvciApO1xuICAgICAgICAgICAgICAgIChmdW5jdGlvbigpe2RlYnVnZ2VyO30pKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb2RlICs9IGBcXG5jYXNlICR7dGhpcy5wY306IC8vICNgICsgKHRoaXMucGM8PDEpLnRvU3RyaW5nKDE2KSArIFwiOiBcIiArIGluc3QubmFtZSArICcgWycgKyBpbnN0LmRlY2J5dGVzLnRvU3RyaW5nKDIpLnBhZFN0YXJ0KDE2LCBcIjBcIikgKyAnXScgKyAnXFxuJztcblxuXG4gICAgICAgICAgICB2YXIgY2h1bmsgPSBgXG4gICAgICAgICAgICAgICAgdGhpcy5wYyA9ICR7dGhpcy5wY307XG4gICAgICAgICAgICAgICAgaWYoICh0aGlzLnRpY2sgKz0gJHtpbnN0LmN5Y2xlc30pID49IHRoaXMuZW5kVGljayApIGJyZWFrO1xuICAgICAgICAgICAgICAgIGA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEJSRUFLUE9JTlRTXG4gICAgICAgICAgICBpZiggKHNlbGYuQlJFQUtQT0lOVFMgJiYgc2VsZi5CUkVBS1BPSU5UU1sgdGhpcy5wYzw8MSBdKSB8fCBpbnN0LmRlYnVnICl7XG4gICAgICAgICAgICAgICAgY2h1bmsgKz0gXCJjb25zb2xlLmxvZygnUEM6ICMnKyh0aGlzLnBjPDwxKS50b1N0cmluZygxNikrJ1xcXFxuU1I6ICcgKyBtZW1vcnlbMHg1Rl0udG9TdHJpbmcoMikgKyAnXFxcXG5TUDogIycgKyBzcC50b1N0cmluZygxNikgKyAnXFxcXG4nICsgQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKCByZWcsICh2LGkpID0+ICdSJysoaSsnJykrJyAnKyhpPDEwPycgJzonJykrJz1cXFxcdCMnK3YudG9TdHJpbmcoMTYpICsgJ1xcXFx0JyArIHYgKS5qb2luKCdcXFxcbicpICk7XFxuXCI7XG4gICAgICAgICAgICAgICAgY2h1bmsgKz0gJyAgZGVidWdnZXI7XFxuJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG9wID0gdGhpcy5nZXRPcGNvZGVJbXBsKCBpbnN0LCBpbnN0LmltcGwgKTtcbiAgICAgICAgICAgIHZhciBzckRpcnR5ID0gb3Auc3JEaXJ0eTtcbiAgICAgICAgICAgIHZhciBsaW5lID0gb3AuYmVnaW4sIGVuZGxpbmUgPSBvcC5lbmQ7XG4gICAgICAgICAgICBpZiggaW5zdC5mbGFncyApe1xuICAgICAgICAgICAgICAgIGZvciggdmFyIGk9MCwgbD1pbnN0LmZsYWdzLmxlbmd0aDsgaTxsOyArK2kgKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZsYWdPcCA9IHRoaXMuZ2V0T3Bjb2RlSW1wbCggaW5zdCwgdGhpcy5mbGFnc1tpbnN0LmZsYWdzW2ldXSApO1xuICAgICAgICAgICAgICAgICAgICBsaW5lICs9IGZsYWdPcC5iZWdpbjtcbiAgICAgICAgICAgICAgICAgICAgZW5kbGluZSArPSBmbGFnT3AuZW5kO1xuICAgICAgICAgICAgICAgICAgICBzckRpcnR5IHw9IGZsYWdPcC5zckRpcnR5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIHNyRGlydHkgKXtcbiAgICAgICAgICAgICAgICB2YXIgcHJlcyA9ICgofnNyRGlydHkpPj4+MCYweEZGKS50b1N0cmluZygyKTtcbiAgICAgICAgICAgICAgICBlbmRsaW5lICs9IGBzciA9IChzciYwYiR7cHJlc30pIGA7XG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgaT0wOyBpPDg7IGkrKyApXG4gICAgICAgICAgICAgICAgICAgIGlmKCBzckRpcnR5JigxPDxpKSApXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRsaW5lICs9IGAgfCAoc3Ike2l9PDwke2l9KWA7XG4gICAgICAgICAgICAgICAgZW5kbGluZSArPSAnO1xcbm1lbW9yeVsweDVGXSA9IHNyO1xcbic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNodW5rICs9IGxpbmUgKyBlbmRsaW5lO1xuXG4gICAgICAgICAgICBpZiggc2tpcCApXG4gICAgICAgICAgICAgICAgY29kZSArPSBcIiAgaWYoICFTS0lQICl7XFxuICAgIFwiICsgY2h1bmsgKyBcIlxcbiAgfVxcblNLSVAgPSBmYWxzZTtcXG5cIjtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb2RlICs9IGNodW5rO1xuXG4gICAgICAgICAgICBwcmV2ID0gc2tpcDtcbiAgICAgICAgICAgIHNraXAgPSBpbnN0LnNraXA7XG5cbiAgICAgICAgICAgIHRoaXMucGMgKz0gaW5zdC5ieXRlcyA+PiAxO1xuXG4gICAgICAgIH13aGlsZSggdGhpcy5wYyA8IHRoaXMucHJvZy5sZW5ndGggJiYgKCFpbnN0LmVuZCB8fCBza2lwIHx8IHByZXYpIClcblxuICAgICAgICBjb2RlICs9IGBcXG50aGlzLnBjID0gJHt0aGlzLnBjfTtcXG5gXG4gICAgICAgIGNvZGUgKz0gYFxcblxcbn1gO1xuICAgICAgICAvLyBjb2RlICs9IGNhY2hlTGlzdC5tYXAoYz0+YHRoaXMuJHtjfSA9ICR7Y307YCkuam9pbignXFxuJyk7XG4gICAgICAgIGNvZGUgKz0gJ3RoaXMuc3AgPSBzcDtcXG4nO1xuXG4gICAgICAgIHZhciBlbmRQQyA9IHRoaXMucGM7XG4gICAgICAgIHRoaXMucGMgPSBzdGFydFBDO1xuXG4gICAgICAgIGNvZGUgPSBcInJldHVybiAoZnVuY3Rpb24gX1wiICsgKHN0YXJ0UEM8PDEpLnRvU3RyaW5nKDE2KSArIFwiKCl7XFxuXCJcbiAgICAgICAgICAgICArIGNvZGVcbiAgICAgICAgICAgICArIFwifSk7XCI7XG5cbiAgICAgICAgdHJ5e1xuICAgICAgICAgICAgdmFyIGZ1bmMgPSAobmV3IEZ1bmN0aW9uKCBjb2RlICkpKCk7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGk9c3RhcnRQQzsgaTxlbmRQQzsgKytpIClcbiAgICAgICAgICAgICAgICB0aGlzLm5hdGl2ZVsgaSBdID0gZnVuYztcblxuICAgICAgICAgICAgZnVuYy5jYWxsKCB0aGlzICk7XG4gICAgICAgIH1jYXRjaChleCl7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCk9PntcbiAgICAgICAgICAgICAgICBkZWJ1Z2dlcjtcbiAgICAgICAgICAgICAgICB2YXIgZnVuYyA9IG5ldyBGdW5jdGlvbiggY29kZSApO1xuICAgICAgICAgICAgICAgIGZ1bmMuY2FsbCggdGhpcyApO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgICB0aHJvdyBleDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgfVxuXG4gICAgaWRlbnRpZnkoKXtcblxuICAgICAgICAvLyBpZiggdGhpcy5wYzw8MSA9PSAweDk2NiApIGRlYnVnZ2VyO1xuXG4gICAgICAgIGxldCBwcm9nID0gdGhpcy5wcm9nLCBcbiAgICAgICAgICAgIGNvZGVjID0gdGhpcy5jb2RlYywgXG4gICAgICAgICAgICBieXRlcyxcbiAgICAgICAgICAgIGgsXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgaT0wLCBcbiAgICAgICAgICAgIGwgPSBjb2RlYy5sZW5ndGgsXG4gICAgICAgICAgICBwYyA9IHRoaXMucGM7XG5cbiAgICAgICAgbGV0IGJ5dGVzMiwgYnl0ZXM0O1xuICAgICAgICBieXRlczIgPSBwcm9nW3BjXSA+Pj4gMDtcbiAgICAgICAgYnl0ZXM0ID0gKChieXRlczIgPDwgMTYpIHwgKHByb2dbcGMrMV0pKSA+Pj4gMDtcblxuICAgICAgICBsZXQgdmVyYm9zZSA9IDE7XG5cbiAgICAgICAgZm9yKCA7IGk8bDsgKytpICl7XG5cbiAgICAgICAgICAgIHZhciBkZXNjID0gY29kZWNbaV07XG4gICAgICAgICAgICB2YXIgb3Bjb2RlID0gZGVzYy5vcGNvZGU+Pj4wO1xuICAgICAgICAgICAgdmFyIG1hc2sgPSBkZXNjLm1hc2s+Pj4wO1xuICAgICAgICAgICAgdmFyIHNpemUgPSBkZXNjLmJ5dGVzO1xuXG4gICAgICAgICAgICBpZiggc2l6ZSA9PT0gNCApe1xuXG4gICAgICAgICAgICAgICAgaWYoIHZlcmJvc2U9PTIgfHwgdmVyYm9zZSA9PSBkZXNjLm5hbWUgKVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggZGVzYy5uYW1lICsgXCJcXG5cIiArIGJpbihieXRlczQgJiBtYXNrLCA4KjQpICsgXCJcXG5cIiArIGJpbihvcGNvZGUsIDgqNCkgKTtcblxuICAgICAgICAgICAgICAgIGlmKCAoYnl0ZXM0ICYgbWFzayk+Pj4wICE9PSBvcGNvZGUgKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBieXRlcyA9IGJ5dGVzNDtcblxuICAgICAgICAgICAgfWVsc2V7XG5cblxuICAgICAgICAgICAgICAgIGlmKCB2ZXJib3NlPT0yIHx8IHZlcmJvc2UgPT0gZGVzYy5uYW1lIClcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGRlc2MubmFtZSArIFwiXFxuXCIgKyBiaW4oYnl0ZXMyICYgbWFzaywgOCoyKSArIFwiXFxuXCIgKyBiaW4ob3Bjb2RlLCA4KjIpICk7XG5cbiAgICAgICAgICAgICAgICBpZiggKGJ5dGVzMiAmIG1hc2spPj4+MCAhPT0gb3Bjb2RlIClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgYnl0ZXMgPSBieXRlczI7XG5cbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICB0aGlzLmluc3RydWN0aW9uID0gZGVzYztcblxuICAgICAgICAgICAgLy8gdmFyIGxvZyA9IGRlc2MubmFtZSArIFwiIFwiO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBrIGluIGRlc2MuYXJncyApe1xuICAgICAgICAgICAgICAgIG1hc2sgPSBkZXNjLmFyZ3Nba107XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICBoID0gMDtcbiAgICAgICAgICAgICAgICBqID0gMDtcbiAgICAgICAgICAgICAgICB3aGlsZSggbWFzayApe1xuICAgICAgICAgICAgICAgICAgICBpZiggbWFzayYxICl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSB8PSAoKGJ5dGVzPj5oKSYxKSA8PCBqO1xuICAgICAgICAgICAgICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1hc2sgPSBtYXNrID4+PiAxO1xuICAgICAgICAgICAgICAgICAgICBoKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlc2MuYXJndltrXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIC8vIGxvZyArPSBrICsgXCI6XCIgKyB2YWx1ZSArIFwiICBcIlxuICAgICAgICAgICAgfVxuXHQgICAgZGVzYy5kZWNieXRlcyA9IGJ5dGVzO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cobG9nKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHJ1Y3Rpb247XG5cbiAgICAgICAgfVxuXG5cbiAgICAgICAgdGhpcy5lcnJvciA9IFwiI1wiICsgKHRoaXMucGM8PDEpLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpICsgYCBvcGNvZGU6IGAgKyBiaW4oYnl0ZXMyLCAxNik7XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICB9XG5cbiAgICBnZXQgc3RhdHVzSSgpeyByZXR1cm4gdGhpcy5zcmVnICYgKDE8PDcpOyB9XG4gICAgZ2V0IHN0YXR1c1QoKXsgcmV0dXJuIHRoaXMuc3JlZyAmICgxPDw2KTsgfVxuICAgIGdldCBzdGF0dXNIKCl7IHJldHVybiB0aGlzLnNyZWcgJiAoMTw8NSk7IH1cbiAgICBnZXQgc3RhdHVzUygpeyByZXR1cm4gdGhpcy5zcmVnICYgKDE8PDQpOyB9XG4gICAgZ2V0IHN0YXR1c1YoKXsgcmV0dXJuIHRoaXMuc3JlZyAmICgxPDwzKTsgfVxuICAgIGdldCBzdGF0dXNOKCl7IHJldHVybiB0aGlzLnNyZWcgJiAoMTw8Mik7IH1cbiAgICBnZXQgc3RhdHVzWigpeyByZXR1cm4gdGhpcy5zcmVnICYgKDE8PDEpOyB9XG4gICAgZ2V0IHN0YXR1c0MoKXsgcmV0dXJuIHRoaXMuc3JlZyAmICgxPDwwKTsgfVxuXG5cbiAgICBpbnRlcnJ1cHQoIHNvdXJjZSApe1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiSU5URVJSVVBUIFwiICsgc291cmNlKTtcblxuICAgICAgICBsZXQgYWRkciA9IHRoaXMuaW50ZXJydXB0TWFwW3NvdXJjZV07XG4gICAgICAgIHZhciBwYyA9IHRoaXMucGM7XG4gICAgICAgIHRoaXMubWVtb3J5W3RoaXMuc3AtLV0gPSBwYz4+ODtcbiAgICAgICAgdGhpcy5tZW1vcnlbdGhpcy5zcC0tXSA9IHBjO1xuICAgICAgICB0aGlzLm1lbW9yeVsweDVGXSAmPSB+KDE8PDcpOyAvLyBkaXNhYmxlIGludGVycnVwdHNcbiAgICAgICAgdGhpcy5wYyA9IGFkZHI7XG5cbiAgICB9XG5cbiAgICBnZXRPcGNvZGVJbXBsKCBpbnN0LCBzdHIgKXtcbiAgICAgICAgdmFyIGksIGwsIG9wID0ge2JlZ2luOlwiXCIsIGVuZDpcIlwiLCBzckRpcnR5OjB9O1xuXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KHN0cikgKXtcbiAgICAgICAgICAgIGZvciggaSA9IDAsIGw9c3RyLmxlbmd0aDsgaTxsOyArK2kgKXtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gdGhpcy5nZXRPcGNvZGVJbXBsKCBpbnN0LCBzdHJbaV0gKTtcbiAgICAgICAgICAgICAgICBvcC5iZWdpbiArPSB0bXAuYmVnaW4gKyBcIlxcblwiO1xuICAgICAgICAgICAgICAgIG9wLmVuZCArPSB0bXAuZW5kICsgXCJcXG5cIjtcbiAgICAgICAgICAgICAgICBvcC5zckRpcnR5IHw9IHRtcC5zckRpcnR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG9wO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNyYyA9IHN0ciwgYXJndiA9IGluc3QuYXJndjtcblxuICAgICAgICBmb3IoIHZhciBrIGluIGFyZ3YgKVxuICAgICAgICAgICAgc3RyID0gc3RyLnNwbGl0KGsudG9Mb3dlckNhc2UoKSkuam9pbihhcmd2W2tdKTtcblxuICAgICAgICB2YXIgU1JTeW5jID0gXCJcIiwgU1JEaXJ0eSA9IDA7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1NSQChbMC05XSspXFxzKuKGkFxccyoxOz9cXHMqJC9nLCAobSwgYml0LCBhc3NpZ24pPT57XG4gICAgICAgICAgICBTUkRpcnR5IHw9IDEgPDwgYml0O1xuICAgICAgICAgICAgcmV0dXJuIGBzciR7Yml0fSA9IDE7XFxuYDtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUkAoWzAtOV0rKVxccyrihpBcXHMqMDs/XFxzKiQvZywgKG0sIGJpdCwgYXNzaWduKT0+e1xuICAgICAgICAgICAgU1JEaXJ0eSB8PSAxIDw8IGJpdDtcbiAgICAgICAgICAgIHJldHVybiBgc3Ike2JpdH0gPSAwO1xcbmA7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvU1IoWzAtOV0rKVxccyo9KC4qKS9nLCAobSwgYml0LCBhc3NpZ24pPT57XG4gICAgICAgICAgICBTUkRpcnR5IHw9IDEgPDwgYml0O1xuICAgICAgICAgICAgcmV0dXJuIGBzciR7Yml0fSA9ICR7YXNzaWdufTtcXG5gO1xuICAgICAgICB9KTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1NSXFxzKuKGkC9nLCAoKSA9PiB7XG4gICAgICAgICAgICBTUlN5bmMgPSAnbWVtb3J5WzB4NUZdID0gc3I7IHNyMD1zciYxOyBzcjE9KHNyPj4xKSYxOyBzcjI9KHNyPj4yKSYxOyBzcjM9KHNyPj4zKSYxOyBzcjQ9KHNyPj40KSYxOyBzcjU9KHNyPj41KSYxOyBzcjY9KHNyPj42KSYxOyBzcjc9KHNyPj43KSYxOyc7XG4gICAgICAgICAgICByZXR1cm4gJ3NyID0nO1xuICAgICAgICB9KTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1NSQChbMC05XSspXFxzKuKGkCguKikkL2csIChtLCBiaXQsIGFzc2lnbik9PntcbiAgICAgICAgICAgIFNSRGlydHkgfD0gMSA8PCBiaXQ7XG4gICAgICAgICAgICByZXR1cm4gYHNyJHtiaXR9ID0gKCEhKCR7YXNzaWdufSkpfDA7YDtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUlxccyrCry9nLCAnKH5zciknKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1NSQChbMC05XSspXFxzKsKvL2csICcofnNyJDEpICcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvU1JAKFswLTldKylcXHMqL2csICcoc3IkMSkgJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9TUi9nLCAnc3InKTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvV1IoWzAtOV0rKVxccyrihpAvZywgJ3IgPSB3cmVnWyQxXSA9Jyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9XUihbMC05XSspQChbMC05XSspXFxzKuKGkCguKikkL2csIChtLCBudW0sIGJpdCwgYXNzaWduKT0+YHIgPSB3cmVnWyR7bnVtfV0gPSAod3JlZ1ske251bX1dICYgfigxPDwke2JpdH0pKSB8ICgoKCEhKCR7YXNzaWdufSkpfDApPDwke2JpdH0pO2ApO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvV1IoWzAtOV0rKVxccyrCry9nLCAnKH53cmVnWyQxXSkgJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9XUihbMC05XSspQChbMC05XSspXFxzKsKvL2csICcofih3cmVnWyQxXT4+PiQyKSYxKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1dSKFswLTldKylAKFswLTldKylcXHMqL2csICcoKHdyZWdbJDFdPj4+JDIpJjEpICcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvV1IoWzAtOV0rKS9nLCAnd3JlZ1skMV0nKTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUihbMC05PF0rKShcXCtbMC05XSspP1xccyrihpAvZywgKG0sIG51bSwgbnVtYWRkKSA9PnsgXG4gICAgICAgICAgICBudW1hZGQgPSBudW1hZGQgfHwgXCJcIjtcbiAgICAgICAgICAgIG9wLmVuZCArPSBgcmVnWygke251bX0pJHtudW1hZGR9XSA9IHI7XFxuYDsgXG4gICAgICAgICAgICByZXR1cm4gJ3IgPSAnOyBcbiAgICAgICAgfSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9SKFswLTk8XSspKFxcK1swLTldKyk/QChbMC05XSspXFxzKuKGkCguKikkL2csIChtLCBudW0sIG51bWFkZCwgYml0LCBhc3NpZ24pPT57XG4gICAgICAgICAgICBudW1hZGQgPSBudW1hZGQgfHwgXCJcIjtcbiAgICAgICAgICAgIG9wLmVuZCArPSBgcmVnWygke251bX0pJHtudW1hZGR9XSA9IHI7XFxuYFxuICAgICAgICAgICAgcmV0dXJuIGByID0gKHJlZ1soJHtudW19KSR7bnVtYWRkfV0gJiB+KDE8PCR7Yml0fSkpIHwgKCgoISEoJHthc3NpZ259KSl8MCk8PCR7Yml0fSk7YDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1IoWzAtOTxdKykoXFwrWzAtOV0rKT9cXHMqPVxccysvZywgKG0sIG51bSwgbnVtYWRkKSA9PnsgXG4gICAgICAgICAgICBudW1hZGQgPSBudW1hZGQgfHwgXCJcIjtcbiAgICAgICAgICAgIHJldHVybiBgciA9IHJlZ1soJHtudW19KSR7bnVtYWRkfV0gPSBgOyBcbiAgICAgICAgfSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9SKFswLTk8XSspKFxcK1swLTldKyk/QChbMC05XSspXFxzKj1cXHMrKC4qKSQvZywgKG0sIG51bSwgbnVtYWRkLCBiaXQsIGFzc2lnbik9PntcbiAgICAgICAgICAgIG51bWFkZCA9IG51bWFkZCB8fCBcIlwiO1xuICAgICAgICAgICAgcmV0dXJuIGByID0gcmVnWygke251bX0pJHtudW1hZGR9XSA9IChyZWdbKCR7bnVtfSkke251bWFkZH1dICYgfigxPDwke2JpdH0pKSB8ICgoKCEhKCR7YXNzaWdufSkpfDApPDwke2JpdH0pO2A7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9SKFswLTk8XSspKFxcK1swLTldKyk/XFxzKsKvL2csICcofnJlZ1soJDEpJDJdKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1IoWzAtOTxdKykoXFwrWzAtOV0rKT9AKFswLTldKylcXHMqwq8vZywgJyh+KHJlZ1soJDEpJDJdPj4+JDMpJjEpICcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUihbMC05PF0rKShcXCtbMC05XSspP0AoWzAtOV0rKVxccyovZywgJygocmVnWygkMSkkMl0+Pj4kMykmMSkgJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9SKFswLTk8XSspKFxcK1swLTldKyk/L2csICcocmVnWygkMSkkMl0+Pj4wKScpO1xuXG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9SQChbMC05XSspXFxzKsKvL2csICcofihyPj4+JDEpJjEpICcpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUkAoWzAtOV0rKVxccyovZywgJygocj4+PiQxKSYxKSAnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL0lcXC9PL2csICdpbycpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvUi9nLCAncicpO1xuXG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9GTEFTSFxcKChbWFlaXSlcXClcXHMq4oaQKC4qKTs/JC9nLCAobSwgbiwgdikgPT4gJ2ZsYXNoWyB3cmVnWycgKyAobi5jaGFyQ29kZUF0KDApLTg3KSArICddIF0gPSAnICsgdiArICc7Jyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9GTEFTSFxcKChbWFlaXSlcXCkvZywgKG0sIG4pID0+ICdmbGFzaFsgd3JlZ1snICsgKG4uY2hhckNvZGVBdCgwKS04NykgKyAnXSBdJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9cXCgoW1hZWl0pKFxcK1swLTldKyk/XFwpXFxzKuKGkCguKik7PyQvZywgKG0sIG4sIG9mZiwgdikgPT4gJ3RoaXMud3JpdGUoIHdyZWdbJyArIChuLmNoYXJDb2RlQXQoMCktODcpICsgJ10nICsgKG9mZnx8JycpICsgJywgJyArIHYgKyAnKTsnKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcKChbWFlaXSkoXFwrWzAtOV0rKT9cXCkvZywgKG0sIG4sIG9mZikgPT4gJ3RoaXMucmVhZCggd3JlZ1snICsgKG4uY2hhckNvZGVBdCgwKS04NykgKyAnXScgKyAob2ZmfHwnJykgKyAnLCB0aGlzLnBjICknKTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvXFwoU1RBQ0tcXClcXHMq4oaQL2csIChtLCBuKSA9PiAnbWVtb3J5W3NwLS1dID0nKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcKChTVEFDSylcXCkvZywgKG0sIG4pID0+ICdtZW1vcnlbKytzcF0nKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcKFNUQUNLMlxcKVxccyrihpAoLiopL2csICd0MSA9ICQxO1xcbm1lbW9yeVtzcC0tXSA9IHQxPj44O1xcbm1lbW9yeVtzcC0tXSA9IHQxO1xcbicpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvXFwoKFNUQUNLMilcXCkvZywgJyhtZW1vcnlbKytzcF0gKyAobWVtb3J5Wysrc3BdPDw4KSknKTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgv4oqVL2csICdeJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC/igKIvZywgJyYnKTtcblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvaW9cXFsoWzAtOV0rKVxcXVxccyrihpAoLio/KTs/JC9nLCAndGhpcy53cml0ZSggMzIrJDEsICQyICknKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL2lvXFxbKFswLTldKylAKFswLTldKylcXF1cXHMq4oaQKC4qPyk7PyQvZywgJ3RoaXMud3JpdGVCaXQoIDMyKyQxLCAkMiwgJDMgKScpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvaW9cXFsoWzAtOSs8XSspQChbMC05XSspXFxdL2csICd0aGlzLnJlYWRCaXQoIDMyKyQxLCAkMiwgdGhpcy5wYyApJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9pb1xcWyhbMC05KzxdKylcXF0vZywgJ3RoaXMucmVhZCggMzIrJDEsIHRoaXMucGMgKScpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvU1AvZywgJ3NwJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9QQ1xccyrihpAoLiopJC9nLCAndDEgPSAkMTtcXG5pZiggIXQxICkgKGZ1bmN0aW9uKCl7ZGVidWdnZXI7fSkoKTsgdGhpcy5wYyA9IHQxOyBicmVhaztcXG4nKTtcbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL1BDL2csICd0aGlzLnBjJyk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC/ihpAvZywgJz0nKTtcblxuXG4gICAgICAgIHN0ciA9ICcvLyAnICsgc3JjLnJlcGxhY2UoL1tcXG5cXHJdK1xccyovZywgJ1xcblxcdC8vICcpICsgXCJcXG5cIiArIHN0ciArIFwiXFxuXCI7XG4gICAgICAgIFxuICAgICAgICBvcC5zckRpcnR5ID0gU1JEaXJ0eTtcblxuICAgICAgICBvcC5iZWdpbiA9IHN0cjtcbiAgICAgICAgb3AuZW5kICs9IFNSU3luYztcblxuICAgICAgICByZXR1cm4gb3A7XG4gICAgfVxuXG4gICAgc3RhdGljIEFUbWVnYTMyOFAoKXtcblxuICAgICAgICBsZXQgY29yZSA9IG5ldyBBdGNvcmUoe1xuICAgICAgICAgICAgZmxhc2g6IDMyICogMTAyNCxcbiAgICAgICAgICAgIGVlcHJvbTogMSAqIDEwMjQsXG4gICAgICAgICAgICBzcmFtOiAyICogMTAyNCxcbiAgICAgICAgICAgIGNvZGVjOiBBdENPREVDLFxuICAgICAgICAgICAgZmxhZ3M6IEF0RmxhZ3MsXG4gICAgICAgICAgICBjbG9jazogMTYgKiAxMDAwICogMTAwMCwgLy8gc3BlZWQgaW4ga0h6XG4gICAgICAgICAgICBwZXJpZmVyYWxzOnJlcXVpcmUoJy4vQXQzMjhQLXBlcmlmZXJhbHMuanMnKSxcbiAgICAgICAgICAgIGludGVycnVwdDp7XG4gICAgICAgICAgICAgICAgUkVTRVQ6IDB4MDAwMCwgIC8vICBFeHRlcm5hbCBwaW4sIHBvd2VyLW9uIHJlc2V0LCBicm93bi1vdXQgcmVzZXQgYW5kIHdhdGNoZG9nIHN5c3RlbSByZXNldFxuICAgICAgICAgICAgICAgIElOVDA6IDB4MDAyICwgIC8vICBFeHRlcm5hbCBpbnRlcnJ1cHQgcmVxdWVzdCAwXG4gICAgICAgICAgICAgICAgSU5UMTogMHgwMDA0LCAgLy8gIEV4dGVybmFsIGludGVycnVwdCByZXF1ZXN0IDFcbiAgICAgICAgICAgICAgICBQQ0lOVDA6IDB4MDAwNiwgIC8vICBQaW4gY2hhbmdlIGludGVycnVwdCByZXF1ZXN0IDBcbiAgICAgICAgICAgICAgICBQQ0lOVDE6IDB4MDAwOCwgIC8vICBQaW4gY2hhbmdlIGludGVycnVwdCByZXF1ZXN0IDFcbiAgICAgICAgICAgICAgICBQQ0lOVDI6IDB4MDAwQSwgIC8vICBQaW4gY2hhbmdlIGludGVycnVwdCByZXF1ZXN0IDJcbiAgICAgICAgICAgICAgICBXRFQ6IDB4MDAwQywgIC8vICBXYXRjaGRvZyB0aW1lLW91dCBpbnRlcnJ1cHRcbiAgICAgICAgICAgICAgICBUSU1FUjJBOiAweDAwMEUsICAvLyAgQ09NUEEgVGltZXIvQ291bnRlcjIgY29tcGFyZSBtYXRjaCBBXG4gICAgICAgICAgICAgICAgVElNRVIyQjogMHgwMDEwLCAgLy8gIENPTVBCIFRpbWVyL0NvdW50ZXIyIGNvbXBhcmUgbWF0Y2ggQlxuICAgICAgICAgICAgICAgIFRJTUVSMk86IDB4MDAxMiwgIC8vICBPVkYgVGltZXIvQ291bnRlcjIgb3ZlcmZsb3dcbiAgICAgICAgICAgICAgICBUSU1FUjFDOiAweDAwMTQsICAvLyAgQ0FQVCBUaW1lci9Db3VudGVyMSBjYXB0dXJlIGV2ZW50XG4gICAgICAgICAgICAgICAgVElNRVIxQTogMHgwMDE2LCAgLy8gIENPTVBBIFRpbWVyL0NvdW50ZXIxIGNvbXBhcmUgbWF0Y2ggQVxuICAgICAgICAgICAgICAgIFRJTUVSMUI6IDB4MDAxOCwgIC8vICBDT01QQiBUaW1lci9Db3VudGVyMSBjb21wYXJlIG1hdGNoIEJcbiAgICAgICAgICAgICAgICBUSU1FUjFPOiAweDAwMUEsICAvLyAgT1ZGIFRpbWVyL0NvdW50ZXIxIG92ZXJmbG93XG4gICAgICAgICAgICAgICAgVElNRVIwQTogMHgwMDFDLCAgLy8gIENPTVBBIFRpbWVyL0NvdW50ZXIwIGNvbXBhcmUgbWF0Y2ggQVxuICAgICAgICAgICAgICAgIFRJTUVSMEI6IDB4MDAxRSwgIC8vICBDT01QQiBUaW1lci9Db3VudGVyMCBjb21wYXJlIG1hdGNoIEJcbiAgICAgICAgICAgICAgICBUSU1FUjBPOiAweDAwMjAsICAvLyAgT1ZGIFRpbWVyL0NvdW50ZXIwIG92ZXJmbG93XG4gICAgICAgICAgICAgICAgU1BJOiAweDAwMjIsICAvLyAsIFNUQyBTUEkgc2VyaWFsIHRyYW5zZmVyIGNvbXBsZXRlXG4gICAgICAgICAgICAgICAgVVNBUlRSWDogMHgwMDI0LCAgLy8gLCBSWCBVU0FSVCBSeCBjb21wbGV0ZVxuICAgICAgICAgICAgICAgIFVTQVJURTogMHgwMDI2LCAgLy8gLCBVRFJFIFVTQVJULCBkYXRhIHJlZ2lzdGVyIGVtcHR5XG4gICAgICAgICAgICAgICAgVVNBUlRUWDogMHgwMDI4LCAgLy8gLCBUWCBVU0FSVCwgVHggY29tcGxldGVcbiAgICAgICAgICAgICAgICBBREM6IDB4MDAyQSwgIC8vICBBREMgY29udmVyc2lvbiBjb21wbGV0ZVxuICAgICAgICAgICAgICAgIEVFUkVBRFk6IDB4MDAyQywgIC8vICBSRUFEWSBFRVBST00gcmVhZHlcbiAgICAgICAgICAgICAgICBBTkFMT0c6IDB4MDAyRSwgIC8vICBDT01QIEFuYWxvZyBjb21wYXJhdG9yXG4gICAgICAgICAgICAgICAgVFdJOiAweDAwMzAsICAvLyAgMi13aXJlIHNlcmlhbCBpbnRlcmZhY2VcbiAgICAgICAgICAgICAgICBTUE06IDB4MDAzMiAgLy8gIFJFQURZIFN0b3JlIHByb2dyYW0gbWVtb3J5IHJlYWR5ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gY29yZTtcblxuICAgIH1cblxuICAgIHN0YXRpYyBBVG1lZ2EzMnU0KCl7XG5cblx0bGV0IGNvcmUgPSBuZXcgQXRjb3JlKHtcbiAgICAgICAgICAgIGZsYXNoOiAzMiAqIDEwMjQsXG4gICAgICAgICAgICBlZXByb206IDEgKiAxMDI0LFxuICAgICAgICAgICAgc3JhbTogMiAqIDEwMjQgKyA1MTIsXG4gICAgICAgICAgICBjb2RlYzogQXRDT0RFQyxcbiAgICAgICAgICAgIGZsYWdzOiBBdEZsYWdzLFxuICAgICAgICAgICAgY2xvY2s6IDE2ICogMTAwMCAqIDEwMDAsIC8vIHNwZWVkIGluIGtIelxuICAgICAgICAgICAgcGVyaWZlcmFsczpyZXF1aXJlKCcuL0F0MzJ1NC1wZXJpZmVyYWxzLmpzJyksXG4gICAgICAgICAgICBpbnRlcnJ1cHQ6e1xuXHRcdFJFU0VUOiAweDAwMDAsICAvLyAgRXh0ZXJuYWwgcGluLCBwb3dlci1vbiByZXNldCwgYnJvd24tb3V0IHJlc2V0IGFuZCB3YXRjaGRvZyBzeXN0ZW0gcmVzZXRcblx0XHRJTlQwOiAweDAwMiAsICAvLyAgRXh0ZXJuYWwgaW50ZXJydXB0IHJlcXVlc3QgMFxuXHRcdElOVDE6IDB4MDAwNCwgIC8vICBFeHRlcm5hbCBpbnRlcnJ1cHQgcmVxdWVzdCAxXG5cdFx0SU5UMjogMHgwMDA2LCAgLy8gIEV4dGVybmFsIGludGVycnVwdCByZXF1ZXN0IDJcblx0XHRJTlQzOiAweDAwMDgsICAvLyAgRXh0ZXJuYWwgaW50ZXJydXB0IHJlcXVlc3QgM1xuXHRcdFJFU0VSVkVEMDogMHgwMDBBLFxuXHRcdFJFU0VSVkVEMTogMHgwMDBDLFxuXHRcdElOVDY6IDB4MDAwRSwgICAgLy8gIEV4dGVybmFsIGludGVycnVwdCByZXF1ZXN0IDZcblx0XHRQQ0lOVDA6IDB4MDAxMiwgIC8vICBQaW4gY2hhbmdlIGludGVycnVwdCByZXF1ZXN0IDBcblx0XHRVU0JHRU46IDB4MDAxNCwgIC8vIFVTQiBHZW5lcmFsIEludGVycnVwdCByZXF1ZXN0XG5cdFx0VVNCRU5EOiAweDAwMTYsICAvLyBVU0IgRW5kcG9pbnQgSW50ZXJydXB0IHJlcXVlc3Rcblx0XHRXRFQ6IDB4MDAxOCwgICAgIC8vICBXYXRjaGRvZyB0aW1lLW91dCBpbnRlcnJ1cHRcblx0XHRcblx0XHRUSU1FUjFDOiAweDAwMjAsICAvLyAgQ0FQVCBUaW1lci9Db3VudGVyMSBjYXB0dXJlIGV2ZW50XG5cdFx0VElNRVIxQTogMHgwMDIyLCAgLy8gIENPTVBBIFRpbWVyL0NvdW50ZXIxIGNvbXBhcmUgbWF0Y2ggQVxuXHRcdFRJTUVSMUI6IDB4MDAyNCwgIC8vICBDT01QQiBUaW1lci9Db3VudGVyMSBjb21wYXJlIG1hdGNoIEJcblx0XHRUSU1FUjFDOiAweDAwMjYsICAvLyAgQ09NUEMgVGltZXIvQ291bnRlcjEgY29tcGFyZSBtYXRjaCBDXG5cdFx0VElNRVIxTzogMHgwMDI4LCAgLy8gIE9WRiBUaW1lci9Db3VudGVyMSBvdmVyZmxvd1xuXHRcdFRJTUVSMEE6IDB4MDAyQSwgIC8vICBDT01QQSBUaW1lci9Db3VudGVyMCBjb21wYXJlIG1hdGNoIEFcblx0XHRUSU1FUjBCOiAweDAwMkMsICAvLyAgQ09NUEIgVGltZXIvQ291bnRlcjAgY29tcGFyZSBtYXRjaCBCXG5cdFx0VElNRVIwTzogMHgwMDJFLCAgLy8gIE9WRiBUaW1lci9Db3VudGVyMCBvdmVyZmxvd1xuXHRcdFxuXHRcdFNQSTogMHgwMDMwLCAgLy8gLCBTVEMgU1BJIHNlcmlhbCB0cmFuc2ZlciBjb21wbGV0ZVxuXHRcdFxuXHRcdFVTQVJUUlg6IDB4MDAzMiwgIC8vICwgUlggVVNBUlQgUnggY29tcGxldGVcblx0XHRVU0FSVEU6IDB4MDAzNCwgIC8vICwgVURSRSBVU0FSVCwgZGF0YSByZWdpc3RlciBlbXB0eVxuXHRcdFVTQVJUVFg6IDB4MDAzNiwgIC8vICwgVFggVVNBUlQsIFR4IGNvbXBsZXRlXG5cblx0XHRBTkFMT0c6IDB4MDAzOCwgLy8gQW5hbG9nIENvbXBhcmF0b3Jcblx0XHRBREM6IDB4MDAzQSwgIC8vICBBREMgY29udmVyc2lvbiBjb21wbGV0ZVxuXHRcdFxuXHRcdEVFUkVBRFk6IDB4MDAzQywgIC8vICBFRVBST00gcmVhZHlcblxuXHRcdFRJTUVSM0M6IDB4MDAzRSwgIC8vICBDQVBUIFRpbWVyL0NvdW50ZXIxIGNhcHR1cmUgZXZlbnRcblx0XHRUSU1FUjNBOiAweDAwNDAsICAvLyAgQ09NUEEgVGltZXIvQ291bnRlcjEgY29tcGFyZSBtYXRjaCBBXG5cdFx0VElNRVIzQjogMHgwMDQyLCAgLy8gIENPTVBCIFRpbWVyL0NvdW50ZXIxIGNvbXBhcmUgbWF0Y2ggQlxuXHRcdFRJTUVSM0M6IDB4MDA0NCwgIC8vICBDT01QQyBUaW1lci9Db3VudGVyMSBjb21wYXJlIG1hdGNoIENcblx0XHRUSU1FUjNPOiAweDAwNDYsICAvLyAgT1ZGIFRpbWVyL0NvdW50ZXIxIG92ZXJmbG93XG5cdFx0XG5cdFx0XG5cdFx0VFdJOiAweDAwNDgsICAvLyAgMi13aXJlIHNlcmlhbCBpbnRlcmZhY2Vcblx0XHRcblx0XHRTUE06IDB4MDA0QSwgIC8vICBSRUFEWSBTdG9yZSBwcm9ncmFtIG1lbW9yeSByZWFkeVxuXHRcdFxuXHRcdFRJTUVSNEE6IDB4MDA0Qyxcblx0XHRUSU1FUjRCOiAweDAwNEUsXG5cdFx0VElNRVI0RDogMHgwMDUwLFxuXHRcdFRJTUVSNE86IDB4MDA1Mixcblx0XHRUSU1FUjRGUEY6IDB4MDA1NFxuICAgICAgICAgICAgfVxuXHR9KTtcblxuXHRyZXR1cm4gY29yZTtcblxuICAgIH1cblxufVxuXG5mdW5jdGlvbiBwYXJzZSggb3V0ICl7XG4gICAgdmFyIG9wY29kZSA9IDA7XG4gICAgdmFyIG1hc2sgPSAwO1xuICAgIHZhciBhcmdzID0ge307XG5cbiAgICB2YXIgc3RyID0gb3V0LnN0ciwgbD1zdHIubGVuZ3RoO1xuICAgIGZvciggdmFyIGk9MDsgaTxsOyArK2kgKXtcbiAgICAgICAgdmFyIGNociA9IHN0cltpXTtcbiAgICAgICAgdmFyIGJpdCA9IChsLWktMSk+Pj4wO1xuICAgICAgICBpZiggY2hyID09ICcwJyApe1xuICAgICAgICAgICAgbWFzayB8PSAxPDxiaXQ7XG4gICAgICAgIH1lbHNlIGlmKCBjaHIgPT0gJzEnICl7XG4gICAgICAgICAgICBtYXNrIHw9IDE8PGJpdDtcbiAgICAgICAgICAgIG9wY29kZSB8PSAxPDxiaXQ7ICAgICAgICAgICAgXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgaWYoICEoY2hyIGluIGFyZ3MpIClcbiAgICAgICAgICAgICAgICBhcmdzW2Nocl0gPSAwO1xuICAgICAgICAgICAgYXJnc1tjaHJdIHw9IDE8PGJpdDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG91dC5vcGNvZGUgPSBvcGNvZGU7XG4gICAgb3V0Lm1hc2sgPSBtYXNrO1xuICAgIG91dC5hcmdzID0gYXJncztcbiAgICBvdXQuYnl0ZXMgPSAobC84KXwwO1xufVxuXG5jb25zdCBBdENPREVDID0gW1xuICAgIHtcbiAgICAgICAgbmFtZTogJ0FEQycsXG4gICAgICAgIHN0cjogJzAwMDExMXJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiAnUmQg4oaQIFJkICsgUnIgKyBTUkAwOycsXG4gICAgICAgIGZsYWdzOidoenZuc2MnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdBREQnLFxuICAgICAgICBzdHI6ICcwMDAwMTFyZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogJ1JkIOKGkCBSZCArIFJyOycsXG4gICAgICAgIGZsYWdzOidoenZuc2MnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdNVUwnLFxuICAgICAgICBzdHI6ICcxMDAxMTFyZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ3QxID0gUmQgKiBScicsXG4gICAgICAgICAgICAnUjAgPSB0MScsXG4gICAgICAgICAgICAnUjEgPSB0MSA+PiA4JyxcbiAgICAgICAgICAgICdTUjEgPSAhdDF8MCcsXG4gICAgICAgICAgICAnU1IwID0gKHQxPj4xNSkmMSdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J2h2bnNjJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQURJVycsXG4gICAgICAgIHN0cjogJzEwMDEwMTEwS0tkZEtLS0snLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnV1JkIOKGkCBXUmQgKyBrOycsXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOidaVk5TQydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0FORCcsXG4gICAgICAgIHN0cjogJzAwMTAwMHJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQg4oaQIFJkIOKAoiBScjsnLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIDAnXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOid6bnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdBTkRJJyxcbiAgICAgICAgc3RyOiAnMDExMUtLS0tkZGRkS0tLSycsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSZCsxNiDihpAgUmQrMTYg4oCiIGs7JyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAwJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQVNSJyxcbiAgICAgICAgc3RyOiAnMTAwMTAxMGRkZGRkMDEwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdTUkAwIOKGkCBSZCDigKIgMScsXG4gICAgICAgICAgICAnUmQg4oaQIFJkID4+IDE7J1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkNMUmknLFxuICAgICAgICBzdHI6ICcxMDAxMDEwMDExMTExMDAwJyxcbiAgICAgICAgaW1wbDogJ1NSQDcg4oaQIDAnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCQ0xSdCcsXG4gICAgICAgIHN0cjogJzEwMDEwMTAwMTExMDEwMDAnLFxuICAgICAgICBpbXBsOiAnU1JANiDihpAgMCdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JDTFJoJyxcbiAgICAgICAgc3RyOiAnMTAwMTAxMDAxMTAxMTAwMCcsXG4gICAgICAgIGltcGw6ICdTUkA1IOKGkCAwJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkNMUnMnLFxuICAgICAgICBzdHI6ICcxMDAxMDEwMDExMDAxMDAwJyxcbiAgICAgICAgaW1wbDogJ1NSQDQg4oaQIDAnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCQ0xSdicsXG4gICAgICAgIHN0cjogJzEwMDEwMTAwMTAxMTEwMDAnLFxuICAgICAgICBpbXBsOiAnU1JAMyDihpAgMCdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JDTFJuJyxcbiAgICAgICAgc3RyOiAnMTAwMTAxMDAxMDEwMTAwMCcsXG4gICAgICAgIGltcGw6ICdTUkAyIOKGkCAwJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkNMUnonLFxuICAgICAgICBzdHI6ICcxMDAxMDEwMDEwMDExMDAwJyxcbiAgICAgICAgaW1wbDogJ1NSQDEg4oaQIDAnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCQ0xSYycsXG4gICAgICAgIHN0cjogJzEwMDEwMTAwMTAwMDEwMDAnLFxuICAgICAgICBpbXBsOiAnU1JAMCDihpAgMCdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSQ0MnLFxuICAgICAgICBzdHI6JzExMTEwMWtra2tra2swMDAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoICFTUkAwICl7JyxcbiAgICAgICAgICAgICcgIFBDIOKGkCBQQyArIChrIDw8IDI1ID4+IDI1KSArIDE7JyxcbiAgICAgICAgICAgICd9J10sXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQlJCUycsXG4gICAgICAgIHN0cjonMTExMTAwa2tra2tra3NzcycsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdpZiggU1JAcyApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSQ1MnLFxuICAgICAgICBzdHI6JzExMTEwMGtra2tra2swMDAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoIFNSQDAgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUkVRJyxcbiAgICAgICAgc3RyOicxMTExMDBra2tra2trMDAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCBTUkAxICl7JyxcbiAgICAgICAgICAgICcgIFBDIOKGkCBQQyArIChrIDw8IDI1ID4+IDI1KSArIDE7JyxcbiAgICAgICAgICAgICd9J10sXG4gICAgICAgIGN5Y2xlczogM1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQlJMVCcsXG4gICAgICAgIHN0cjonMTExMTAwa2tra2trazEwMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdpZiggU1JANCApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDNcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSR0UnLFxuICAgICAgICBzdHI6JzExMTEwMWtra2tra2sxMDAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoICFTUkA0ICl7JyxcbiAgICAgICAgICAgICcgIFBDIOKGkCBQQyArIChrIDw8IDI1ID4+IDI1KSArIDE7JyxcbiAgICAgICAgICAgICd9J10sXG4gICAgICAgIGN5Y2xlczogM1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQlJORScsXG4gICAgICAgIHN0cjonMTExMTAxa2tra2trazAwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdpZiggIVNSQDEgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAzXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUlBMJyxcbiAgICAgICAgc3RyOicxMTExMDFra2tra2trMDEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCAhU1JAMiApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JSTUknLFxuICAgICAgICBzdHI6JzExMTEwMGtra2tra2swMTAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnaWYoIFNSQDIgKXsnLFxuICAgICAgICAgICAgJyAgUEMg4oaQIFBDICsgKGsgPDwgMjUgPj4gMjUpICsgMTsnLFxuICAgICAgICAgICAgJ30nXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdCUlRDJyxcbiAgICAgICAgc3RyOicxMTExMDFra2tra2trMTEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ2lmKCAhU1JANiApeycsXG4gICAgICAgICAgICAnICBQQyDihpAgUEMgKyAoayA8PCAyNSA+PiAyNSkgKyAxOycsXG4gICAgICAgICAgICAnfSddLFxuICAgICAgICBjeWNsZXM6IDNcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0JTVCcsXG4gICAgICAgIHN0cjonMTExMTEwMWRkZGRkMGJiYicsXG4gICAgICAgIGltcGw6ICdTUjYgPSBSZEBiJ1xuICAgICAgICAvLyxkZWJ1ZzogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQkxEJyxcbiAgICAgICAgc3RyOicxMTExMTAwZGRkZGQwYmJiJyxcbiAgICAgICAgaW1wbDogJ1JkQGIg4oaQIFNSQDYnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdDQUxMJyxcbiAgICAgICAgc3RyOicxMDAxMDEwa2tra2sxMTFra2tra2tra2tra2tra2traycsXG4gICAgICAgIGN5Y2xlczo0LFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnKFNUQUNLMikg4oaQIFBDICsgMicsXG4gICAgICAgICAgICAnUEMg4oaQIGsnXG4gICAgICAgICAgICBdXG4gICAgfSxcbiAgICB7XG5cdG5hbWU6ICdDQkknLFxuXHRzdHI6ICcxMDAxMTAwMEFBQUFBYmJiJyxcblx0aW1wbDogJ0kvT1thQGJdIOKGkCAwOydcbiAgICB9LCAgICBcbiAgICB7XG4gICAgICAgIG5hbWU6ICdDT00nLFxuICAgICAgICBzdHI6JzEwMDEwMTBkZGRkZDAwMDAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQg4oaQIH4gUmQ7JyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAwJyxcbiAgICAgICAgICAgICdTUkAwIOKGkCAxJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczogJ3pucydcbiAgICB9LFxuICAgIHtcblx0bmFtZTogJ0ZNVUwnLFxuXHRzdHI6JzAwMDAwMDExMGRkZDFycnInLFxuXHRpbXBsOltcblx0ICAgICd0MSA9IFJkKzE2ICogUnIrMTYgPDwgMScsXG4gICAgICAgICAgICAnUjAgPSB0MScsXG4gICAgICAgICAgICAnUjEgPSB0MSA+PiA4JyxcbiAgICAgICAgICAgICdTUjEgPSAhdDF8MCcsXG4gICAgICAgICAgICAnU1IwID0gKHQxPj4xNSkmMSdcblx0XVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTk9QJyxcbiAgICAgICAgc3RyOicwMDAwMDAwMDAwMDAwMDAwJyxcbiAgICAgICAgaW1wbDonJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTkVHJyxcbiAgICAgICAgc3RyOicxMDAxMDEwZGRkZGQwMDAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCAtIFJkOycsXG4gICAgICAgICAgICAnU1IzID0gUkA3IOKAoiBSQDYgwq8g4oCiIFJANSDCryDigKIgUkA0IMKvIOKAoiBSQDMgwq8g4oCiIFJAMiDCryDigKIgUkAxIMKvIOKAoiBSQDAgwq8nLFxuICAgICAgICAgICAgJ1NSMCA9ICghIVIpfDAnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIFJAMyB8IFJkMyDCrydcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6ICd6bnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdDUCcsXG4gICAgICAgIHN0cjonMDAwMTAxcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSID0gKChSZCAtIFJyKSA+Pj4gMCkgJiAweEZGOycsXG4gICAgICAgICAgICAnU1JANSDihpAgKFJkQDMgwq8g4oCiIFJyQDMpIHwgKFJyQDMg4oCiIFJAMykgfCAoUkAzIOKAoiBSZEAzIMKvKScsXG4gICAgICAgICAgICAnU1JAMCDihpAgKFJkQDcgwq8g4oCiIFJyQDcpIHwgKFJyQDcg4oCiIFJANykgfCAoUkA3IOKAoiBSZEA3IMKvKScsXG4gICAgICAgICAgICAnU1JAMyDihpAgKFJkQDcg4oCiIFJyQDcgwq8g4oCiIFJANyDCrykgKyAoUmRANyDCryDigKIgUnJANyDigKIgUkA3KSdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6ICd6bnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdDUEknLFxuICAgICAgICBzdHI6JzAwMTFLS0tLZGRkZEtLS0snLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUiA9ICgoUmQrMTYgLSBrKSA+Pj4gMCkgJiAweEZGOycsXG4gICAgICAgICAgICAnU1JANSDihpAgKFJkKzE2QDMgwq8g4oCiICgoaz4+MykmMSkpIHwgKCgoaz4+MykmMSkg4oCiIFJAMykgfCAoUkAzIOKAoiBSZCsxNkAzIMKvKScsXG4gICAgICAgICAgICAnU1JAMCDihpAgKFJkKzE2QDcgwq8g4oCiICgoaz4+NykmMSkpIHwgKCgoaz4+NykmMSkg4oCiIFJANykgfCAoUkA3IOKAoiBSZCsxNkA3IMKvKScsXG4gICAgICAgICAgICAnU1JAMyDihpAgKFJkKzE2QDcg4oCiICgoaz4+NykmMV4xKSDigKIgUkA3IMKvKSArIChSZCsxNkA3IMKvIOKAoiAoKGs+PjcpJjEpIOKAoiBSQDcpJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczogJ3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0NQQycsXG4gICAgICAgIHN0cjonMDAwMDAxcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSID0gKFJkIC0gUnIgLSBTUkAwKSAmIDB4RkYnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIChSZEAzIMKvIOKAoiBSckAzKSB8IChSckAzIOKAoiBSQDMpIHwgKFJAMyDigKIgUmRAMyDCryknLFxuICAgICAgICAgICAgJ1NSQDAg4oaQIChSZEA3IMKvIOKAoiBSckA3KSB8IChSckA3IOKAoiBSQDcpIHwgKFJANyDigKIgUmRANyDCryknLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIChSZEA3IOKAoiBSckA3IMKvIOKAoiBSQDcgwq8pIHwgKFJkQDcgwq8g4oCiIFJyQDcg4oCiIFJANyknLFxuICAgICAgICAgICAgJ1NSQDEg4oaQICghUikgJiBTUkAxJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczogJ25zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnQ1BTRScsXG4gICAgICAgIHN0cjogJzAwMDEwMHJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiAnU0tJUCDihpAgUnIgPT0gUmQnLFxuICAgICAgICBza2lwOiB0cnVlXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdERUMnLFxuICAgICAgICBzdHI6JzEwMDEwMTBkZGRkZDEwMTAnLFxuICAgICAgICBpbXBsOltcbiAgICAgICAgICAgICdSZCDihpAgUmQgLSAxJyxcbiAgICAgICAgICAgICdTUkAzIOKGkCBSQDcgwq8g4oCiIFJANiDigKIgUkA1IOKAoiBSQDQg4oCiIFJAMyDigKIgUkAyIOKAoiBSQDEg4oCiIFJAMCdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6ICd6bnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdFT1InLFxuICAgICAgICBzdHI6JzAwMTAwMXJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQg4oaQIFJkIOKKlSBScjsnLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIDAnXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOiAnem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSUNBTEwnLFxuICAgICAgICBzdHI6JzEwMDEwMTAxMDAwMDEwMDEnLFxuICAgICAgICBjeWNsZXM6MyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJyhTVEFDSzIpIOKGkCBQQyArIDInLFxuICAgICAgICAgICAgJ1BDIOKGkCBXUjMnXG4gICAgICAgICAgICBdXG4gICAgICAgIC8vIGVuZDp0cnVlXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdJTlNSJyxcbiAgICAgICAgc3RyOicxMDExMDExZGRkZGQxMTExJyxcbiAgICAgICAgaW1wbDogYFJkIOKGkCBTUmAsXG4gICAgICAgIGN5Y2xlczogMVxuICAgICAgICAvLyBkZWJ1ZzogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSU4nLFxuICAgICAgICBzdHI6JzEwMTEwQUFkZGRkZDExMTAnLFxuICAgICAgICBpbXBsOiBgUmQg4oaQIHNwPj4+OGAsXG4gICAgICAgIGN5Y2xlczogMVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSU4nLFxuICAgICAgICBzdHI6JzEwMTEwQUFkZGRkZDExMDEnLFxuICAgICAgICBpbXBsOiBgUmQg4oaQIHNwJjB4RkZgLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0lOJyxcbiAgICAgICAgc3RyOicxMDExMEFBZGRkZGRBQUFBJyxcbiAgICAgICAgaW1wbDogYFJkIOKGkCBJL09bYV1gLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0lOQycsXG4gICAgICAgIHN0cjogJzEwMDEwMTBkZGRkZDAwMTEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQg4oaQIFJkICsgMTsnLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIFJANyDigKIgUkA2IMKvIOKAoiBSQDUgwq8g4oCiIFJANCDCryDigKIgUkAzIMKvIOKAoiBSQDIgwq8g4oCiIFJAMSDCryDigKIgUkAwIMKvJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSUpNUCcsXG4gICAgICAgIHN0cjonMTAwMTAxMDAwMDAwMTAwMScsXG4gICAgICAgIGltcGw6IGBQQyDihpAgV1IzYCxcbiAgICAgICAgY3ljbGVzOiAyLFxuICAgICAgICBlbmQ6dHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnSk1QJyxcbiAgICAgICAgc3RyOicxMDAxMDEwa2tra2sxMTBra2tra2tra2tra2tra2traycsXG4gICAgICAgIGltcGw6IGBQQyDihpAga2AsXG4gICAgICAgIGN5Y2xlczogMyxcbiAgICAgICAgZW5kOnRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xESScsXG4gICAgICAgIHN0cjonMTExMEtLS0tkZGRkS0tLSycsXG4gICAgICAgIGltcGw6J1JkKzE2IOKGkCBrJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERTJyxcbiAgICAgICAgc3RyOicxMDAxMDAweHh4eHgwMDAwa2tra2tra2tra2tra2traycsXG4gICAgICAgIGltcGw6J1J4IOKGkCB0aGlzLnJlYWQoayknLFxuICAgICAgICBieXRlczogNFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERYJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQxMTAwJyxcbiAgICAgICAgaW1wbDogYFJkIOKGkCAoWCk7YCxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFgrJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQxMTAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYFJkIOKGkCAoWCk7YCxcbiAgICAgICAgICAgIGBXUjEgKys7YFxuICAgICAgICBdLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWC0nLFxuICAgICAgICBzdHI6JzEwMDEwMDBkZGRkZDExMTAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgV1IxIC0tO2AsXG4gICAgICAgICAgICBgUmQg4oaQIChYKTtgXG4gICAgICAgIF0sXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG5cbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFknLFxuICAgICAgICBzdHI6JzEwMDAwMDBkZGRkZDEwMDAnLFxuICAgICAgICBpbXBsOiBgUmQg4oaQIChZKWAsXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERZKycsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMTAwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBSZCDihpAgKFkpO2AsXG4gICAgICAgICAgICBgV1IzICsrO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFktJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQxMDEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYFdSMyAtLTtgLFxuICAgICAgICAgICAgYFJkIOKGkCAoWSk7YFxuICAgICAgICBdLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWVEnLFxuICAgICAgICBzdHI6JzEwcTBxcTBkZGRkZDFxcXEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgUmQg4oaQIChZK3EpO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcblxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWicsXG4gICAgICAgIHN0cjonMTAwMDAwMGRkZGRkMDAwMCcsXG4gICAgICAgIGltcGw6IGBSZCDihpAgKFopO2AsXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTERaKycsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMDAwMScsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBSZCDihpAgKFopO2AsXG4gICAgICAgICAgICBgV1IzICsrO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMRFotJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQwMDEwJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYFdSMyAtLTtgLFxuICAgICAgICAgICAgYFJkIOKGkCAoWik7YFxuICAgICAgICBdLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xEWlEnLFxuICAgICAgICBzdHI6JzEwcTBxcTBkZGRkZDBxcXEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgUmQg4oaQIChaK3EpO2BcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAyXG4gICAgfSxcblxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xQTWknLFxuICAgICAgICBzdHI6JzEwMDEwMTAxMTEwMDEwMDAnLFxuICAgICAgICBpbXBsOidSMCDihpAgRkxBU0goWiknXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdMUE1paScsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMDEwMCcsXG4gICAgICAgIGltcGw6J1JkIOKGkCBGTEFTSChaKSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xQTWlpaScsXG4gICAgICAgIHN0cjonMTAwMTAwMGRkZGRkMDEwMScsXG4gICAgICAgIGltcGw6W1xuICAgICAgICAgICAgJ1JkIOKGkCBGTEFTSChaKTsnLFxuICAgICAgICAgICAgJ1dSMyArKzsnXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ0xTUicsXG4gICAgICAgIHN0cjonMTAwMTAxMGRkZGRkMDExMCcsXG4gICAgICAgIC8vIGRlYnVnOnRydWUsXG4gICAgICAgIGltcGw6W1xuICAgICAgICAgICAgJ1NSMCA9IFJkQDAnLFxuICAgICAgICAgICAgJ1JkIOKGkCBSZCA+Pj4gMScsXG4gICAgICAgICAgICAnU1IyID0gMCcsXG4gICAgICAgICAgICAnU1IzID0gU1JAMiBeIFNSMCdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pzJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnTU9WJyxcbiAgICAgICAgc3RyOiAnMDAxMDExcmRkZGRkcnJycicsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSZCDihpAgUnI7J1xuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdNT1ZXJyxcbiAgICAgICAgc3RyOicwMDAwMDAwMWRkZGRycnJyJyxcbiAgICAgICAgaW1wbDpbXG4gICAgICAgICAgICAnUmQ8PDEgPSBScjw8MScsXG4gICAgICAgICAgICAnUmQ8PDErMSA9IFJyPDwxKzEnXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcblx0bmFtZTogJ01VTFNVJyxcblx0c3RyOicwMDAwMDAxMTBkZGQwcnJyJyxcblx0aW1wbDpbXG5cdCAgICAnaThhWzBdID0gUmQrMTYnLFxuXHQgICAgJ3QxID0gaThhWzBdICogUnIrMTYnLFxuICAgICAgICAgICAgJ1IwID0gdDEnLFxuICAgICAgICAgICAgJ1IxID0gdDEgPj4gOCcsXG4gICAgICAgICAgICAnU1IxID0gIXQxfDAnLFxuICAgICAgICAgICAgJ1NSMCA9ICh0MT4+MTUpJjEnXG5cdF1cbiAgICB9LFxuICAgIHtcblx0bmFtZTogJ01VTFMnLFxuXHRzdHI6JzAwMDAwMDEwZGRkZHJycnInLFxuXHRpbXBsOltcblx0ICAgICdpOGFbMF0gPSBSZCsxNicsXG5cdCAgICAnaThhWzFdID0gUnIrMTYnLFxuXHQgICAgJ3QxID0gaThhWzBdICogaThhWzFdJyxcbiAgICAgICAgICAgICdSMCA9IHQxJyxcbiAgICAgICAgICAgICdSMSA9IHQxID4+IDgnLFxuICAgICAgICAgICAgJ1NSMSA9ICF0MXwwJyxcbiAgICAgICAgICAgICdTUjAgPSAodDE+PjE1KSYxJ1xuXHRdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdPUicsXG4gICAgICAgIHN0cjogJzAwMTAxMHJkZGRkZHJycnInLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnUmQg4oaQIFJkIHwgUnI7JyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAwJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonem5zJ1xuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnT1JJJyxcbiAgICAgICAgc3RyOiAnMDExMEtLS0tkZGRkS0tLSycsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdSZCsxNiDihpAgUmQrMTYgfCBrOycsXG4gICAgICAgICAgICAnU1JAMyDihpAgMCdcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ09VVHNyJyxcbiAgICAgICAgc3RyOicxMDExMTExcnJycnIxMTExJyxcbiAgICAgICAgaW1wbDogJ0kvT1s2M10g4oaQIFNSIOKGkCBScicsXG4gICAgICAgIGN5Y2xlczogMVxuICAgIH0sICAgIFxuICAgIHtcbiAgICAgICAgbmFtZTogJ09VVHNwaCcsXG4gICAgICAgIHN0cjonMTAxMTExMXJycnJyMTExMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgICdJL09bNjJdIOKGkCBScjsnLFxuICAgICAgICAgICAgJ3NwID0gKGlvWzYyXTw8OCkgfCAoc3AmMHhGRik7J1xuICAgICAgICBdLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICB9LCAgICBcbiAgICB7XG4gICAgICAgIG5hbWU6ICdPVVRzcGwnLFxuICAgICAgICBzdHI6JzEwMTExMTFycnJycjExMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICAnSS9PWzYxXSDihpAgUnI7JyxcbiAgICAgICAgICAgICdzcCA9IChzcCYweEZGMDApIHwgaW9bNjFdOydcbiAgICAgICAgXSxcbiAgICAgICAgY3ljbGVzOiAxXG4gICAgfSwgICAgXG4gICAge1xuICAgICAgICBuYW1lOiAnT1VUJyxcbiAgICAgICAgc3RyOicxMDExMUFBcnJycnJBQUFBJyxcbiAgICAgICAgaW1wbDogYEkvT1thXSDihpAgUnJgLFxuICAgICAgICBjeWNsZXM6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1BVU0gnLFxuICAgICAgICBzdHI6JzEwMDEwMDFkZGRkZDExMTEnLFxuICAgICAgICBpbXBsOicoU1RBQ0spIOKGkCBSZCcsXG4gICAgICAgIGN5Y2xlczogMlxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnUE9QJyxcbiAgICAgICAgc3RyOicxMDAxMDAwZGRkZGQxMTExJyxcbiAgICAgICAgaW1wbDonUmQg4oaQIChTVEFDSyknLFxuICAgICAgICBjeWNsZXM6IDJcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1JFVCcsXG4gICAgICAgIHN0cjonMTAwMTAxMDEwMDAwMTAwMCcsXG4gICAgICAgIGN5Y2xlczo0LFxuICAgICAgICBlbmQ6dHJ1ZSxcbiAgICAgICAgaW1wbDogJ1BDIOKGkCAoU1RBQ0syKSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1JFVEknLFxuICAgICAgICBzdHI6JzEwMDEwMTAxMDAwMTEwMDAnLFxuICAgICAgICBjeWNsZXM6NCxcbiAgICAgICAgZW5kOnRydWUsXG4gICAgICAgIGltcGw6W1xuICAgICAgICAgICAgJ21lbW9yeVsweDVGXSA9IChTUiB8PSAxPDw3KTsnLFxuICAgICAgICAgICAgJ1BDIOKGkCAoU1RBQ0syKSdcbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnUk9SJyxcbiAgICAgICAgc3RyOicxMDAxMDEwZGRkZGQwMTExJyxcbiAgICAgICAgaW1wbDpbXG4gICAgICAgICAgICAnU1IwID0gUmRAMCcsXG4gICAgICAgICAgICAnUmQg4oaQIFJkID4+PiAxIHwgKFNSPDw3JjB4ODApJyxcbiAgICAgICAgICAgICdTUjIgPSBSPj43JyxcbiAgICAgICAgICAgICdTUjMgPSBTUkAyIF4gU1IwJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonenMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdIQUxUJyxcbiAgICAgICAgc3RyOicxMTAwMTExMTExMTExMTExJyxcbiAgICAgICAgaW1wbDogYFBDIOKGkCBQQyAtIDFgLFxuICAgICAgICBlbmQ6dHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnUkNBTEwnLFxuICAgICAgICBzdHI6JzExMDFra2tra2tra2tra2snLFxuICAgICAgICBjeWNsZXM6MyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJyhTVEFDSzIpIOKGkCBQQyArIDEnLFxuICAgICAgICAgICAgYFBDIOKGkCBQQyArIChrIDw8IDIwID4+IDIwKSArIDFgXG4gICAgICAgIF0sXG4gICAgICAgIGVuZDpmYWxzZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnUkpNUCcsXG4gICAgICAgIHN0cjonMTEwMGtra2tra2tra2traycsXG4gICAgICAgIGltcGw6IGBQQyDihpAgUEMgKyAoayA8PCAyMCA+PiAyMCkgKyAxYCxcbiAgICAgICAgZW5kOnRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NFQycsXG4gICAgICAgIHN0cjonMTAwMTAxMDAwMDAwMTAwMCcsXG4gICAgICAgIGltcGw6IGBTUkAwIOKGkCAxYFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU0VUJyxcbiAgICAgICAgc3RyOicxMDAxMDEwMDAxMTAxMDAwJyxcbiAgICAgICAgaW1wbDogYFNSQDYg4oaQIDFgXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTRUknLFxuICAgICAgICBzdHI6JzEwMDEwMTAwMDExMTEwMDAnLFxuICAgICAgICBpbXBsOiBgU1JANyDihpAgMWBcbiAgICB9LFxuICAgIHtcblx0bmFtZTogJ1NGTVVMJyxcblx0c3RyOicwMDAwMDAxMTFkZGQwcnJyJyxcblx0aW1wbDpbXG5cdCAgICAnaThhWzBdID0gUmQrMTYnLFxuXHQgICAgJ2k4YVsxXSA9IFJyKzE2Jyxcblx0ICAgICd0MSA9IGk4YVswXSAqIGk4YVsxXSA8PCAxJyxcbiAgICAgICAgICAgICdSMCA9IHQxJyxcbiAgICAgICAgICAgICdSMSA9IHQxID4+IDgnLFxuICAgICAgICAgICAgJ1NSMSA9ICF0MXwwJyxcbiAgICAgICAgICAgICdTUjAgPSAodDE+PjE1KSYxJ1xuXHRdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFMnLFxuICAgICAgICBzdHI6JzEwMDEwMDFkZGRkZDAwMDBra2tra2tra2tra2tra2trJyxcbiAgICAgICAgaW1wbDogYHRoaXMud3JpdGUoIGssIFJkIClgLFxuICAgICAgICBieXRlczogNFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RYJyxcbiAgICAgICAgc3RyOicxMDAxMDAxcnJycnIxMTAwJyxcbiAgICAgICAgaW1wbDogYChYKSDihpAgUnJgXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFgrJyxcbiAgICAgICAgc3RyOicxMDAxMDAxcnJycnIxMTAxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYChYKSDihpAgUnJgLFxuICAgICAgICAgICAgYFdSMSArKztgXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NUWC0nLFxuICAgICAgICBzdHI6JzEwMDEwMDFycnJycjExMTAnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgV1IxIC0tO2AsXG4gICAgICAgICAgICBgKFgpIOKGkCBScmBcbiAgICAgICAgXVxuICAgIH0sXG5cbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFknLFxuICAgICAgICBzdHI6JzEwMDAwMDFycnJycjEwMDAnLFxuICAgICAgICBpbXBsOiBgKFkpIOKGkCBScmBcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NUWSsnLFxuICAgICAgICBzdHI6JzEwMDEwMDFycnJycjEwMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgKFkpIOKGkCBScmAsXG4gICAgICAgICAgICBgV1IxICsrO2BcbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RZLScsXG4gICAgICAgIHN0cjonMTAwMTAwMXJycnJyMTAxMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBXUjEgLS07YCxcbiAgICAgICAgICAgIGAoWSkg4oaQIFJyYFxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFlRJyxcbiAgICAgICAgc3RyOicxMHEwcXExcnJycnIxcXFxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYChZK3EpIOKGkCBScmBcbiAgICAgICAgXVxuICAgIH0sXG5cbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFonLFxuICAgICAgICBzdHI6JzEwMDAwMDFycnJycjAwMDAnLFxuICAgICAgICBpbXBsOiBgKFopIOKGkCBScmBcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NUWisnLFxuICAgICAgICBzdHI6JzEwMDEwMDFycnJycjAwMDEnLFxuICAgICAgICBpbXBsOiBbXG4gICAgICAgICAgICBgKFopIOKGkCBScmAsXG4gICAgICAgICAgICBgV1IzICsrO2BcbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU1RaLScsXG4gICAgICAgIHN0cjonMTAwMTAwMXJycnJyMDAxMCcsXG4gICAgICAgIGltcGw6IFtcbiAgICAgICAgICAgIGBXUjMgLS07YCxcbiAgICAgICAgICAgIGAoWikg4oaQIFJyYFxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVFpRJyxcbiAgICAgICAgc3RyOicxMHEwcXExcnJycnIwcXFxJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgYChaK3EpIOKGkCBScmBcbiAgICAgICAgXVxuICAgIH0sXG5cbiAgICB7XG4gICAgICAgIG5hbWU6ICdTQkMnLFxuICAgICAgICBzdHI6ICcwMDAwMTByZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCAoUmQgLSBSciAtIFNSQDApICYgMHhGRjsnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIChSZEAzIMKvIOKAoiBSckAzKSB8IChSckAzIOKAoiBSQDMpIHwgKFJAMyDigKIgUmRAMyDCryknLFxuICAgICAgICAgICAgJ1NSQDAg4oaQIChSZEA3IMKvIOKAoiBSckA3KSB8IChSckA3IOKAoiBSQDcpIHwgKFJANyDigKIgUmRANyDCryknLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIChSZEA3IOKAoiBSckA3IMKvIOKAoiBSQDcgwq8pIHwgKFJkQDcgwq8g4oCiIFJyQDcg4oCiIFJANyknLFxuICAgICAgICAgICAgJ1NSQDEg4oaQICghUikgJiBTUkAxJ1xuICAgICAgICBdLFxuICAgICAgICBmbGFnczonbnMnXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdTVUInLFxuICAgICAgICBzdHI6ICcwMDAxMTByZGRkZGRycnJyJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkIOKGkCAoUmQgLSBScikmMHhGRjsnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIChSZEAzIMKvIOKAoiBSckAzKSB8IChSckAzIOKAoiBSQDMpIHwgKFJAMyDigKIgUmRAMyDCryknLFxuICAgICAgICAgICAgJ1NSQDAg4oaQIChSZEA3IMKvIOKAoiBSckA3KSB8IChSckA3IOKAoiBSQDcpIHwgKFJANyDigKIgUmRANyDCryknLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIChSZEA3IOKAoiBSckA3IMKvIOKAoiBSQDcgwq8pIHwgKFJkQDcgwq8g4oCiIFJyQDcg4oCiIFJANyknXG5cbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6J3pucydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NCQ0knLFxuICAgICAgICBzdHI6ICcwMTAwS0tLS2RkZGRLS0tLJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkKzE2IOKGkCAoUmQrMTYgLSBrIC0gU1JAMCkmMHhGRjsnLFxuICAgICAgICAgICAgJ1NSQDUg4oaQIChSZCsxNkAzIMKvIOKAoiAoKGs+PjMpJjEpKSB8ICgoKGs+PjMpJjEpIOKAoiBSQDMpIHwgKFJAMyDigKIgUmQrMTZAMyDCryknLFxuICAgICAgICAgICAgJ1NSQDAg4oaQIChSZCsxNkA3IMKvIOKAoiAoKGs+PjcpJjEpKSB8ICgoKGs+PjcpJjEpIOKAoiBSQDcpIHwgKFJANyDigKIgUmQrMTZANyDCryknLFxuICAgICAgICAgICAgJ1NSQDMg4oaQIChSZCsxNkA3IOKAoiAoKGs+PjcpJjFeMSkg4oCiIFJANyDCrykgfCAoUmQrMTZANyDCryDigKIgKChrPj43KSYxKSDigKIgUkA3KScsXG4gICAgICAgICAgICAnU1JAMSDihpAgKCFSKSAmIFNSQDEnXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOiducydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NVQkknLFxuICAgICAgICBzdHI6ICcwMTAxS0tLS2RkZGRLS0tLJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1JkKzE2IOKGkCBSZCsxNiAtIGs7JyxcbiAgICAgICAgICAgICdTUkA1IOKGkCAoUmQrMTZAMyDCryDigKIgKChrPj4zKSYxKSkgfCAoKChrPj4zKSYxKSDigKIgUkAzKSB8IChSQDMg4oCiIFJkKzE2QDMgwq8pJyxcbiAgICAgICAgICAgICdTUkAwIOKGkCAoUmQrMTZANyDCryDigKIgKChrPj43KSYxKSkgfCAoKChrPj43KSYxKSDigKIgUkA3KSB8IChSQDcg4oCiIFJkKzE2QDcgwq8pJyxcbiAgICAgICAgICAgICdTUkAzIOKGkCAoUmQrMTZANyDigKIgKChrPj43KSYxXjEpIOKAoiBSQDcgwq8pIHwgKFJkKzE2QDcgwq8g4oCiICgoaz4+NykmMSkg4oCiIFJANyknXG4gICAgICAgIF0sXG4gICAgICAgIGZsYWdzOid6bnMnXG4gICAgfSxcbiAgICB7XG5cdG5hbWU6ICdTQkknLFxuXHRzdHI6ICcxMDAxMTAxMEFBQUFBYmJiJyxcblx0aW1wbDogJ0kvT1thQGJdIOKGkCAxOydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NCSVcnLFxuICAgICAgICBzdHI6ICcxMDAxMDExMUtLZGRLS0tLJyxcbiAgICAgICAgaW1wbDogW1xuICAgICAgICAgICAgJ1dSZCDihpAgV1JkIC0gazsnLFxuICAgICAgICBdLFxuICAgICAgICBmbGFnczonWlZOUydcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NCSUMnLFxuICAgICAgICBzdHI6ICcxMDAxMTAwMUFBQUFBYmJiJyxcbiAgICAgICAgaW1wbDogJ1NLSVAg4oaQICFJL09bYUBiXScsXG4gICAgICAgIHNraXA6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ1NCSVMnLFxuICAgICAgICBzdHI6ICcxMDAxMTAxMUFBQUFBYmJiJyxcbiAgICAgICAgaW1wbDogJ1NLSVAg4oaQIEkvT1thQGJdJyxcbiAgICAgICAgc2tpcDogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU0JSQycsXG4gICAgICAgIHN0cjogJzExMTExMTBycnJycjBiYmInLFxuICAgICAgICAvLyBkZWJ1ZzogdHJ1ZSxcbiAgICAgICAgaW1wbDogJ1NLSVAg4oaQICEoUnIgJiAoMTw8YikpJyxcbiAgICAgICAgc2tpcDogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnU0JSUycsXG4gICAgICAgIHN0cjogJzExMTExMTFycnJycjBiYmInLFxuICAgICAgICAvLyBkZWJ1ZzogdHJ1ZSxcbiAgICAgICAgaW1wbDogJ1NLSVAg4oaQIFJyICYgKDE8PGIpJyxcbiAgICAgICAgc2tpcDogdHJ1ZVxuICAgIH0sXG4gICAge1xuXHRuYW1lOiAnU0xFRVAnLFxuXHRzdHI6ICcxMDAxMDEwMTEwMDAxMDAwJyxcblx0aW1wbDogW1xuXHQgICAgJ3RoaXMuc2xlZXBpbmcgPSB0cnVlJyxcblx0ICAgICdQQyDihpAgUEMgKyAxJ1xuXHRdLFxuXHQvLyBkZWJ1ZzogdHJ1ZSxcblx0Y3ljbGVzOiAwXG4gICAgfSxcbiAgICB7XG5cdG5hbWU6ICdTV0FQJyxcblx0c3RyOiAnMTAwMTAxMGRkZGRkMDAxMCcsXG5cdGltcGw6W1xuXHQgICAgJ1JkIOKGkCAoUmQgPj4+IDQpIHwgKFJkIDw8IDQpJ1xuXHQgICAgXVxuICAgIH1cbl07XG5cbmNvbnN0IEF0RmxhZ3MgPSB7XG5cbiAgICBoOiAnU1JANSDihpAgKFJkQDMg4oCiIFJyQDMpICsgKFJyQDMg4oCiIFJAMyDCrykgfCAoUkAzIMKvIOKAoiBSZEAzKScsXG4gICAgSDogJycsXG4gICAgejogJ1NSMSA9ICEoUiYweEZGKXwwJyxcbiAgICBaOiAnU1IxID0gIShSJjB4RkYpfDAnLFxuICAgIHY6ICdTUjMgPSAoUmRANyDigKIgUnJANyDigKIgUkA3IMKvKSB8IChSZEA3IMKvIOKAoiBSckA3IMKvIOKAoiBSQDcpJyxcbiAgICBWOiAnU1IzID0gV1JkQDE1IMKvIOKAoiBSQDE1JyxcbiAgICBuOiAnU1IyID0gUkA3JyxcbiAgICBOOiAnU1IyID0gUkAxNScsXG4gICAgczogJ1NSNCA9IFNSQDIg4oqVIFNSQDMnLFxuICAgIFM6ICdTUjQgPSBTUkAyIOKKlSBTUkAzJyxcbiAgICBjOiAnU1IwID0gKFJkQDcg4oCiIFJyQDcpIHwgKFJyQDcg4oCiIFJANyDCrykgfCAoUkA3IMKvIOKAoiBSZEA3KScsXG4gICAgQzogJ1NSMCA9IChSQDE1IMKvIOKAoiBXUmRAMTUpJyxcblxuICAgIC8qXG4gICAgQml0IDcg4oCTIEk6IEdsb2JhbCBJbnRlcnJ1cHQgRW5hYmxlXG4gICAgVGhlIGdsb2JhbCBpbnRlcnJ1cHQgZW5hYmxlIGJpdCBtdXN0IGJlIHNldCBmb3IgdGhlIGludGVycnVwdHMgdG8gYmUgZW5hYmxlZC4gVGhlIGluZGl2aWR1YWwgaW50ZXJydXB0IGVuYWJsZSBjb250cm9sIGlzIHRoZW5cbiAgICBwZXJmb3JtZWQgaW4gc2VwYXJhdGUgY29udHJvbCByZWdpc3RlcnMuIElmIHRoZSBnbG9iYWwgaW50ZXJydXB0IGVuYWJsZSByZWdpc3RlciBpcyBjbGVhcmVkLCBub25lIG9mIHRoZSBpbnRlcnJ1cHRzIGFyZSBlbmFibGVkXG4gICAgaW5kZXBlbmRlbnQgb2YgdGhlIGluZGl2aWR1YWwgaW50ZXJydXB0IGVuYWJsZSBzZXR0aW5ncy4gVGhlIEktYml0IGlzIGNsZWFyZWQgYnkgaGFyZHdhcmUgYWZ0ZXIgYW4gaW50ZXJydXB0IGhhcyBvY2N1cnJlZCwgYW5kIGlzXG4gICAgc2V0IGJ5IHRoZSBSRVRJIGluc3RydWN0aW9uIHRvIGVuYWJsZSBzdWJzZXF1ZW50IGludGVycnVwdHMuIFRoZSBJLWJpdCBjYW4gYWxzbyBiZSBzZXQgYW5kIGNsZWFyZWQgYnkgdGhlIGFwcGxpY2F0aW9uIHdpdGggdGhlXG4gICAgU0VJIGFuZCBDTEkgaW5zdHJ1Y3Rpb25zLCBhcyBkZXNjcmliZWQgaW4gdGhlIGluc3RydWN0aW9uIHNldCByZWZlcmVuY2UgICAgXG4gICAgKi9cbiAgICBTRUkoKXtcbiAgICAgICAgdGhpcy5zcmVnIHw9IDEgPDwgNztcbiAgICB9LFxuXG4gICAgQ0xJKCl7XG4gICAgICAgIHRoaXMuc3JlZyAmPSB+KDE8PDcpO1xuICAgIH0sXG5cblxuXG4gICAgLypcbiAgICBCaXQgNiDigJMgVDogQml0IENvcHkgU3RvcmFnZVxuICAgIFRoZSBiaXQgY29weSBpbnN0cnVjdGlvbnMgQkxEIChiaXQgTG9hRCkgYW5kIEJTVCAoQml0IFNUb3JlKSB1c2UgdGhlIFQtYml0IGFzIHNvdXJjZSBvciBkZXN0aW5hdGlvbiBmb3IgdGhlIG9wZXJhdGVkIGJpdC4gQSBiaXRcbiAgICBmcm9tIGEgcmVnaXN0ZXIgaW4gdGhlIHJlZ2lzdGVyIGZpbGUgY2FuIGJlIGNvcGllZCBpbnRvIFQgYnkgdGhlIEJTVCBpbnN0cnVjdGlvbiwgYW5kIGEgYml0IGluIFQgY2FuIGJlIGNvcGllZCBpbnRvIGEgYml0IGluIGFcbiAgICByZWdpc3RlciBpbiB0aGUgcmVnaXN0ZXIgZmlsZSBieSB0aGUgQkxEIGluc3RydWN0aW9uLlxuICAgICovXG4gICAgQkxEKCBSRUcsIEJJVCApe1xuICAgICAgICBpZiggdGhpcy5yZWcgJiAoMTw8NikgKSB0aGlzLnJlZ1tSRUddIHw9IDE8PEJJVDtcbiAgICAgICAgZWxzZSB0aGlzLnJlZ1tSRUddICY9IH4oMTw8QklUKTtcbiAgICB9LFxuXG4gICAgQlNUKCBSRUcsIEJJVCApe1xuICAgICAgICBsZXQgdiA9ICh0aGlzLnJlZ1tSRUddID4+IEJJVCkgJiAxO1xuICAgICAgICBpZiggdiApIHRoaXMuc3JlZyB8PSAxIDw8IDY7XG4gICAgICAgIGVsc2UgdGhpcy5zcmVnICY9IH4oMTw8Nik7XG4gICAgfVxuXG5cbiAgICBcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEF0Y29yZTtcbiIsImNvbnN0IEhleCA9IHtcblxuICAgIHBhcnNlVVJMKCB1cmwsIGJ1ZmZlciwgY2IgKXtcblxuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiggIHhoci5yZWFkeVN0YXRlID09PSA0ICl7XG4gICAgICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgICAgICBIZXgucGFyc2UoIHhoci5yZXNwb25zZVRleHQsIGJ1ZmZlciApO1xuICAgICAgICAgICAgICAgIH1jYXRjaChleCl7XG4gICAgICAgICAgICAgICAgICAgIGNiKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYiggdHJ1ZSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB4aHIub3BlbihcIkdFVFwiLCB1cmwsIHRydWUpO1xuICAgICAgICB4aHIuc2VuZCgpO1xuICAgICAgICBcbiAgICB9LFxuXG4gICAgcGFyc2UoIHNyYywgYnVmZmVyICl7XG5cbiAgICAgICAgbGV0IHN0YXRlID0gMCwgc2l6ZSA9IDAsIG51bSwgYnl0ZSwgb2Zmc2V0LCBzdW0gPSAwO1xuXG4gICAgICAgIGZvciggbGV0IGk9MCwgbD1zcmMubGVuZ3RoOyBpPGw7ICl7XG5cbiAgICAgICAgICAgIGJ5dGUgPSBzcmMuY2hhckNvZGVBdChpKyspO1xuXG4gICAgICAgICAgICBpZiggYnl0ZSA9PT0gNTggKXtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCBieXRlID49IDY1ICYmIGJ5dGUgPD0gNzAgKXtcbiAgICAgICAgICAgICAgICBudW0gPSAoYnl0ZSAtIDU1KSA8PCA0O1xuICAgICAgICAgICAgfWVsc2UgaWYoIGJ5dGUgPj0gNDggJiYgYnl0ZSA8PSA1NyApe1xuICAgICAgICAgICAgICAgIG51bSA9IChieXRlIC0gNDgpIDw8IDQ7XG4gICAgICAgICAgICB9ZWxzZSBjb250aW51ZTtcblxuICAgICAgICAgICAgd2hpbGUoIGk8bCApe1xuICAgICAgICAgICAgICAgIGJ5dGUgPSBzcmMuY2hhckNvZGVBdChpKyspO1xuICAgICAgICAgICAgICAgIGlmKCBieXRlID49IDY1ICYmIGJ5dGUgPD0gNzAgKXtcbiAgICAgICAgICAgICAgICAgICAgbnVtICs9IGJ5dGUgLSA1NTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoIGJ5dGUgPj0gNDggJiYgYnl0ZSA8PSA1NyApe1xuICAgICAgICAgICAgICAgICAgICBudW0gKz0gYnl0ZSAtIDQ4O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9ZWxzZSBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3dpdGNoKCBzdGF0ZSApe1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIHNpemUgPSBudW07XG4gICAgICAgICAgICAgICAgc3RhdGUrKztcbiAgICAgICAgICAgICAgICBzdW0gPSBudW07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBudW0gPDwgODtcbiAgICAgICAgICAgICAgICBzdGF0ZSsrO1xuICAgICAgICAgICAgICAgIHN1bSArPSBudW07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gbnVtO1xuICAgICAgICAgICAgICAgIHN0YXRlKys7XG4gICAgICAgICAgICAgICAgc3VtICs9IG51bTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIGlmKCBudW0gPT09IDEgKSByZXR1cm47XG5cdFx0aWYoIG51bSA9PT0gMyB8fCBudW0gPT09IDUgKXtcblx0XHQgICAgc3RhdGUrKztcblx0XHR9ZWxzZSBpZiggbnVtICE9PSAwICkgdGhyb3cgJ1Vuc3VwcG9ydGVkIHJlY29yZCB0eXBlOiAnICsgbnVtO1xuICAgICAgICAgICAgICAgIHN0YXRlKys7XG4gICAgICAgICAgICAgICAgc3VtICs9IG51bTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBudW07XG5cdCAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgc3VtICs9IG51bTtcbiAgICAgICAgICAgICAgICBpZiggIS0tc2l6ZSApIHN0YXRlID0gNjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICAgIHN1bSArPSBudW07XG4gICAgICAgICAgICAgICAgc3VtID0gKC1zdW0pICYgMHhGRjtcbiAgICAgICAgICAgICAgICBpZiggIXN1bSApIHN0YXRlKys7XG4gICAgICAgICAgICAgICAgZWxzZSB0aHJvdyAoICdDaGVja3N1bSBtaXNtYXRjaDogJyArIHN1bSApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93ICdJbGxlZ2FsIHN0YXRlICcgKyBzdGF0ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9XG5cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEhleDtcbiIsImNsYXNzIEJUTiB7XG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xuICAgICAgICBwb29sOlwicG9vbFwiXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoIERPTSApe1xuXG5cdERPTS5lbGVtZW50LmNvbnRyb2xsZXIgPSB0aGlzO1xuXHRET00uZWxlbWVudC5kaXNwYXRjaEV2ZW50KCBuZXcgRXZlbnQoXCJhZGRwZXJpZmVyYWxcIiwge2J1YmJsZXM6dHJ1ZX0pICk7XG5cdHRoaXMub24uY29ubmVjdCA9IERPTS5lbGVtZW50LmdldEF0dHJpYnV0ZShcInBpbi1vblwiKTtcblx0dGhpcy5hY3RpdmUgPSBET00uZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJhY3RpdmVcIikgIT0gXCJsb3dcIjtcblx0XG5cdERPTS5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwibW91c2Vkb3duXCIsICBfID0+IHRoaXMub24udmFsdWUgPSAgdGhpcy5hY3RpdmUgKTtcblx0RE9NLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggXCJtb3VzZXVwXCIsICAgIF8gPT4gdGhpcy5vbi52YWx1ZSA9ICF0aGlzLmFjdGl2ZSApO1xuXHRET00uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBcInRvdWNoc3RhcnRcIiwgXyA9PiB0aGlzLm9uLnZhbHVlID0gIHRoaXMuYWN0aXZlICk7XG5cdERPTS5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwidG91Y2hlbmRcIiwgICBfID0+IHRoaXMub24udmFsdWUgPSAhdGhpcy5hY3RpdmUgKTtcblxuXHQoRE9NLmVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiYmluZC1rZXlcIikgfHwgXCJcIikuc3BsaXQoL1xccyosXFxzKi8pLmZvckVhY2goIGsgPT4ge1xuXHQgICAgdGhpc1tcIm9uUHJlc3NcIiArIGtdID0gXyA9PiB0aGlzLm9uLnZhbHVlID0gdGhpcy5hY3RpdmU7XG5cdCAgICB0aGlzW1wib25SZWxlYXNlXCIgKyBrXSA9IF8gPT4gdGhpcy5vbi52YWx1ZSA9ICF0aGlzLmFjdGl2ZTtcblx0fSk7XG5cblx0dGhpcy5wb29sLmFkZCh0aGlzKTtcblx0XG4gICAgfVxuXG4gICAgc2V0QWN0aXZlVmlldygpe1xuXHR0aGlzLnBvb2wucmVtb3ZlKHRoaXMpO1xuICAgIH1cblxuICAgIG9uID0ge1xuXHRjb25uZWN0OiBudWxsLFxuXHRpbml0OmZ1bmN0aW9uKCl7XG5cdCAgICB0aGlzLm9uLnZhbHVlID0gIXRoaXMuYWN0aXZlO1xuXHR9XG4gICAgfVxuICAgIFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJUTjtcbiIsImNsYXNzIExFRCB7XG4gICAgXG4gICAgY29uc3RydWN0b3IoIERPTSApe1xuXHRcblx0dGhpcy5lbCA9IERPTS5lbGVtZW50O1xuXHRET00uZWxlbWVudC5jb250cm9sbGVyID0gdGhpcztcblx0RE9NLmVsZW1lbnQuZGlzcGF0Y2hFdmVudCggbmV3IEV2ZW50KFwiYWRkcGVyaWZlcmFsXCIsIHtidWJibGVzOnRydWV9KSApO1xuXHR0aGlzLm9uLmNvbm5lY3QgPSBET00uZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJwaW4tb25cIik7XG5cdHRoaXMuZWwuc3R5bGUub3BhY2l0eSA9IDA7XG5cdFxuICAgIH1cblxuICAgIG9uID0ge1xuXHRcblx0Y29ubmVjdDpudWxsLFxuXHRcblx0b25Mb3dUb0hpZ2goKXtcblx0ICAgIHRoaXMuZWwuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xuXHR9LFxuXHRcblx0b25IaWdoVG9Mb3coKXtcblx0ICAgIHRoaXMuZWwuc3R5bGUub3BhY2l0eSA9IFwiMVwiO1xuXHR9XG5cdFxuICAgIH1cbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMRUQ7XG4iLCJjbGFzcyBTQ1JFRU4ge1xuICAgIHN0YXRpYyBcIkBpbmplY3RcIiA9IHtcblx0cG9vbDpcInBvb2xcIlxuICAgIH1cbiAgICBcbiAgICBjb25zdHJ1Y3RvciggRE9NICl7XG5cdFxuXHRsZXQgY2FudmFzID0gdGhpcy5jYW52YXMgPSBET00uc2NyZWVuO1xuXHRpZiggIWNhbnZhcyApIHRocm93IFwiTm8gY2FudmFzIGluIEFyZHVib3kgZWxlbWVudFwiO1xuXG5cdHRoaXMucG9vbC5hZGQodGhpcyk7XG5cdFxuXHRjYW52YXMud2lkdGggPSAxMjg7XG5cdGNhbnZhcy5oZWlnaHQgPSA2NDtcblxuXHR0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIHRoaXMuY3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXHR0aGlzLmN0eC5tc0ltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG5cdHRoaXMuZmIgPSB0aGlzLmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLmZiT04gPSB0aGlzLmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLmZiT0ZGID0gdGhpcy5jcmVhdGVCdWZmZXIoKTtcblx0dGhpcy5hY3RpdmVCdWZmZXIgPSB0aGlzLmZiT047XG5cdHRoaXMuZGlydHkgPSB0cnVlO1xuXG5cdHRoaXMuZmJPTi5kYXRhLmZpbGwoMHhGRik7XG5cblx0RE9NLmVsZW1lbnQuY29udHJvbGxlciA9IHRoaXM7XG5cdERPTS5lbGVtZW50LmRpc3BhdGNoRXZlbnQoIG5ldyBFdmVudChcImFkZHBlcmlmZXJhbFwiLCB7YnViYmxlczp0cnVlfSkgKTtcblx0XG5cdHRoaXMuc2NrLmNvbm5lY3QgPSBET00uZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJwaW4tc2NrXCIpO1xuXHR0aGlzLnNkYS5jb25uZWN0ID0gRE9NLmVsZW1lbnQuZ2V0QXR0cmlidXRlKFwicGluLXNkYVwiKTtcblx0dGhpcy5yZXMuY29ubmVjdCA9IERPTS5lbGVtZW50LmdldEF0dHJpYnV0ZShcInBpbi1yZXNcIik7XG5cdHRoaXMuZGMuY29ubmVjdCA9IERPTS5lbGVtZW50LmdldEF0dHJpYnV0ZShcInBpbi1kY1wiKTtcblxuXG5cdHRoaXMucmVzZXQoKTtcblx0XG4gICAgfVxuXG4gICAgc2V0QWN0aXZlVmlldygpe1xuXHR0aGlzLnBvb2wucmVtb3ZlKHRoaXMpO1xuICAgIH1cblxuICAgIG9uUHJlc3NLZXlGKCl7XG5cdHZhciBkb2NFbCA9IHRoaXMuY2FudmFzOyAvLyBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXHRcblx0dG9nZ2xlRnVsbFNjcmVlbigpO1xuXG5cdHJldHVybjtcblxuXHRmdW5jdGlvbiBpc0Z1bGxTY3JlZW4oKXtcblx0XHR2YXIgZG9jID0gd2luZG93LmRvY3VtZW50O1xuXHRcdHJldHVybiBkb2MuZnVsbHNjcmVlbkVsZW1lbnQgfHwgZG9jLm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8IGRvYy53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCB8fCBkb2MubXNGdWxsc2NyZWVuRWxlbWVudCB8fCBmYWxzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRvZ2dsZUZ1bGxTY3JlZW4odG9nZ2xlKSB7XG5cdFx0dmFyIGRvYyA9IHdpbmRvdy5kb2N1bWVudDtcblx0ICAgICAgICBcblxuXHRcdHZhciByZXF1ZXN0RnVsbFNjcmVlbiA9IGRvY0VsLnJlcXVlc3RGdWxsc2NyZWVuIHx8IGRvY0VsLm1velJlcXVlc3RGdWxsU2NyZWVuIHx8IGRvY0VsLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuIHx8IGRvY0VsLm1zUmVxdWVzdEZ1bGxzY3JlZW47XG5cdFx0dmFyIGNhbmNlbEZ1bGxTY3JlZW4gPSBkb2MuZXhpdEZ1bGxzY3JlZW4gfHwgZG9jLm1vekNhbmNlbEZ1bGxTY3JlZW4gfHwgZG9jLndlYmtpdEV4aXRGdWxsc2NyZWVuIHx8IGRvYy5tc0V4aXRGdWxsc2NyZWVuO1xuXHRcdHZhciBzdGF0ZSA9IGlzRnVsbFNjcmVlbigpO1xuXG5cdFx0aWYoIHRvZ2dsZSA9PSB1bmRlZmluZWQgKSB0b2dnbGUgPSAhc3RhdGU7XG5cdFx0ZWxzZSBpZiggdG9nZ2xlID09IHN0YXRlICkgcmV0dXJuO1xuXG5cdFx0aWYoIHRvZ2dsZSApIHJlcXVlc3RGdWxsU2NyZWVuLmNhbGwoZG9jRWwpO1xuXHRcdGVsc2UgY2FuY2VsRnVsbFNjcmVlbi5jYWxsKGRvYyk7XG5cdH1cbiAgICB9XG4gICAgXG4gICAgXG4gICAgdGljaygpe1xuXHRpZiggdGhpcy5kaXJ0eSApe1xuXHQgICAgdGhpcy5jdHgucHV0SW1hZ2VEYXRhKCB0aGlzLmFjdGl2ZUJ1ZmZlciwgMCwgMCApO1xuXHQgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuXHR9XG4gICAgfVxuXG4gICAgY3JlYXRlQnVmZmVyKCl7XG5cdGxldCBjYW52YXMgPSB0aGlzLmNhbnZhcztcblx0Lypcblx0dHJ5e1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBJbWFnZURhdGEoXG5cdFx0bmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGNhbnZhcy53aWR0aCpjYW52YXMuaGVpZ2h0KjQpLFxuXHRcdGNhbnZhcy53aWR0aCxcblx0XHRjYW52YXMuaGVpZ2h0XG5cdCAgICApO1xuXHR9Y2F0Y2goZSl7Ki9cblx0ICAgIHJldHVybiB0aGlzLmN0eC5jcmVhdGVJbWFnZURhdGEoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0Ly99XG5cdFxuICAgIH1cblxuICAgIHJlc2V0KCl7XG5cdHRoaXMubW9kZSA9IDA7XG5cdHRoaXMuY2xvY2tEaXZpc29yID0gMHg4MDtcblx0dGhpcy5jbWQgPSBbXTtcblx0dGhpcy5wb3MgPSAwO1xuXHR0aGlzLmZiLmRhdGEuZmlsbCgwKTtcbiAgICB9XG5cbiAgICBzdGF0ZSA9IGZ1bmN0aW9uKCBkYXRhICl7XG5cdC8vIGNvbnNvbGUubG9nKCBcIkRBVEE6IFwiICsgZGF0YS50b1N0cmluZygxNikgKTtcblx0bGV0IHAgPSB0aGlzLnBvcysrO1xuXHRsZXQgeCA9IHAgJSAxMjg7XG5cdGxldCB5ID0gKChwIC8gMTI4KXwwKSAqIDg7XG5cdGZvciggbGV0IGk9MDsgaTw4OyArK2kgKXtcblx0ICAgIGxldCBvZmZzZXQgPSAoKHkraSkqMTI4ICsgeCkgKiA0O1xuXHQgICAgbGV0IGJpdCA9ICgoZGF0YSA+Pj4gaSkgJiAxKSAqIDB4RTA7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdCAgICB0aGlzLmZiLmRhdGFbIG9mZnNldCsrIF0gPSBiaXQ7XG5cdH1cblxuXHRpZiggdGhpcy5wb3MgPj0gMTI4KjY0LzggKVxuXHQgICAgdGhpcy5wb3MgPSAwO1xuXG5cdHRoaXMuZGlydHkgPSB0cnVlO1xuXHRcdCBcbiAgICB9XG5cbiAgICBzY2sgPSB7XG5cdGNvbm5lY3Q6bnVsbFxuICAgIH1cblxuICAgIHNkYSA9IHtcblx0Y29ubmVjdDpudWxsLFxuXHRNT1NJOmZ1bmN0aW9uKCBkYXRhICl7XG5cblx0ICAgIGlmKCB0aGlzLm1vZGUgPT0gMCApeyAvLyBkYXRhIGlzIGEgY29tbWFuZFxuXHRcdGxldCBjbWQgPSBcImNtZFwiICsgZGF0YS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcblx0XHRpZiggdGhpcy5jbWQubGVuZ3RoICl7XG5cdFx0ICAgIHRoaXMuY21kLnB1c2goIGRhdGEgKTtcblx0XHQgICAgY21kID0gdGhpcy5jbWRbMF07XG5cdFx0fWVsc2UgdGhpcy5jbWQucHVzaCggY21kICk7XG5cblx0XHRsZXQgZm5jID0gdGhpc1tjbWRdO1xuXHRcdFxuXHRcdGlmKCAhZm5jIClcblx0XHQgICAgcmV0dXJuIGNvbnNvbGUud2FybihcIlVua25vd24gU1NEMTMwNiBjb21tYW5kOiBcIiArIGNtZC50b1N0cmluZygxNikpO1xuXHRcdFxuXHRcdGlmKCBmbmMubGVuZ3RoID09IHRoaXMuY21kLmxlbmd0aC0xICl7XG5cdFx0ICAgIHRoaXMuY21kLnNoaWZ0KCk7XG5cdFx0ICAgIHRoaXNbY21kXS5hcHBseSggdGhpcywgdGhpcy5jbWQgKTtcblx0XHQgICAgdGhpcy5jbWQubGVuZ3RoID0gMDtcblx0XHR9XG5cblx0ICAgIH1lbHNle1xuXHRcdHRoaXMuc3RhdGUoIGRhdGEgKTtcblx0ICAgIH1cblx0fVxuICAgIH1cblxuICAgIHJlcyA9IHtcblx0Y29ubmVjdDpudWxsLFxuXHRvbkxvd1RvSGlnaDpmdW5jdGlvbigpe1xuXHQgICAgdGhpcy5yZXNldCgpO1xuXHR9XG4gICAgfVxuXG4gICAgZGMgPSB7XG5cdGNvbm5lY3Q6bnVsbCxcblx0b25Mb3dUb0hpZ2g6ZnVuY3Rpb24oKXtcblx0ICAgIHRoaXMubW9kZSA9IDE7IC8vIGRhdGFcblx0fSxcblx0b25IaWdoVG9Mb3c6ZnVuY3Rpb24oKXtcblx0ICAgIHRoaXMubW9kZSA9IDA7IC8vIGNvbW1hbmRcblx0fSBcbiAgICB9XG5cbiAgICAvLyBTZXQgTG93ZXIgQ29sdW1uIFN0YXJ0IEFkZHJlc3MgZm9yXG4gICAgLy8gUGFnZSBBZGRyZXNzaW5nIE1vZGUgXG4gICAgY21kMCgpe1xuICAgIH1cbiAgICBjbWQxKCl7XG4gICAgfVxuICAgIGNtZDIoKXtcbiAgICB9Ly8gZXRjXG4gICAgY21kRigpe1xuICAgIH1cblxuXG5cbiAgICAvLyBEaXNwbGF5IE9mZlxuICAgIGNtZEFFKCl7XG5cdHRoaXMuYWN0aXZlQnVmZmVyID0gdGhpcy5mYk9GRjtcbiAgICB9XG5cbiAgICAvLyBTZXQgRGlzcGxheSBDbG9jayBEaXZpc29yIHYgPSAweEYwXG4gICAgY21kRDUoIHYgKXtcblx0dGhpcy5jbG9ja0Rpdmlzb3IgPSB2O1xuICAgIH1cblxuICAgIC8vIENoYXJnZSBQdW1wIFNldHRpbmcgdiA9IGVuYWJsZSAoMHgxNClcbiAgICBjbWQ4RCggdiApe1xuXHR0aGlzLmNoYXJnZVB1bXBFbmFibGVkID0gdjtcbiAgICB9XG5cbiAgICAvLyBTZXQgU2VnbWVudCBSZS1tYXAgKEEwKSB8IChiMDAwMSlcbiAgICBjbWRBMCgpeyB0aGlzLnNlZ21lbnRSZW1hcCA9IDAgfTtcbiAgICBjbWRBMSgpeyB0aGlzLnNlZ21lbnRSZW1hcCA9IDEgfTtcblxuICAgIGNtZEE1KCl7ICB9OyAvLyBtdWx0aXBsZXggc29tZXRoaW5nIG9yIG90aGVyXG5cbiAgICAvLyBTZXQgQ09NIE91dHB1dCBTY2FuIERpcmVjdGlvblxuICAgIGNtZEM4KCl7XG4gICAgfVxuXG4gIC8vIFNldCBDT00gUGlucyB2XG4gICAgY21kREEoIHYgKXtcbiAgICB9XG5cbiAgLy8gU2V0IENvbnRyYXN0IHYgPSAweENGXG4gICAgY21kODEoIHYgKXtcbiAgICB9XG5cbiAgLy8gU2V0IFByZWNoYXJnZSA9IDB4RjFcbiAgICBjbWREOSggdiApe1xuICAgIH1cblxuICAvLyBTZXQgVkNvbSBEZXRlY3RcbiAgICBjbWREQiggdiApe1xuICAgIH1cblxuICAvLyBFbnRpcmUgRGlzcGxheSBPTlxuICAgIGNtZEE0KCB2ICl7XG5cdHRoaXMuYWN0aXZlQnVmZmVyID0gdiA/IHRoaXMuZmJPTiA6IHRoaXMuZmI7XG4gICAgfVxuICAgIFxuICAvLyBTZXQgbm9ybWFsL2ludmVyc2UgZGlzcGxheVxuICAgIGNtZEE2KCB2ICl7XG4gICAgfVxuICAgIFxuICAvLyBEaXNwbGF5IE9uXG4gICAgY21kQUYoIHYgKXtcblx0dGhpcy5hY3RpdmVCdWZmZXIgPSB0aGlzLmZiO1xuICAgIH1cblxuICAvLyBzZXQgZGlzcGxheSBtb2RlID0gaG9yaXpvbnRhbCBhZGRyZXNzaW5nIG1vZGUgKDB4MDApXG4gICAgY21kMjAoIHYgKXtcbiAgICB9XG5cbiAgLy8gc2V0IGNvbCBhZGRyZXNzIHJhbmdlXG4gICAgY21kMjEoIHYsIGUgKXtcbiAgICB9XG5cbiAgLy8gc2V0IHBhZ2UgYWRkcmVzcyByYW5nZVxuICAgIGNtZDIyKCB2LCBlICl7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNDUkVFTjtcbiIsImltcG9ydCB7IElDb250cm9sbGVyLCBNb2RlbCwgSVZpZXcgfSBmcm9tICcuLi9saWIvbXZjLmpzJztcbmltcG9ydCB7IGdldFBvbGljeSB9IGZyb20gJ2RyeS1kaSc7XG5pbXBvcnQgQXRjb3JlIGZyb20gJy4uL2F0Y29yZS9BdGNvcmUuanMnO1xuaW1wb3J0IEhleCBmcm9tICcuLi9hdGNvcmUvSGV4LmpzJztcblxuY2xhc3MgQXJkdWJveSB7XG5cbiAgICBzdGF0aWMgXCJAaW5qZWN0XCIgPSB7XG4gICAgICAgIHJvb3Q6IFtNb2RlbCwge3Njb3BlOlwicm9vdFwifV0sXG5cdHBvb2w6XCJwb29sXCJcbiAgICB9XG5cbiAgICB0aWNrID0gW11cblxuICAgIGNvbnN0cnVjdG9yKCBET00gKXtcblxuXHR0aGlzLnBvb2wuYWRkKHRoaXMpO1xuXG5cdHRoaXMuRE9NID0gRE9NO1xuXHR0aGlzLnBhcmVudCA9IERPTS5lbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cdHRoaXMud2lkdGggPSAwO1xuXHR0aGlzLmhlaWdodCA9IDA7XG5cdHRoaXMuZGVhZCA9IGZhbHNlO1xuXG5cdERPTS5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIFwiYWRkcGVyaWZlcmFsXCIsIGV2dCA9PiB0aGlzLmFkZFBlcmlmZXJhbCggZXZ0LnRhcmdldC5jb250cm9sbGVyICkgKTtcblxuXG5cdHRoaXMucGVyaWZlcmFscyA9IFtdO1xuXG5cdHRoaXMudXBkYXRlID0gdGhpcy5fdXBkYXRlLmJpbmQoIHRoaXMgKTtcblx0dGhpcy5yZXNpemUoKTtcblx0XG5cdGxldCB1cmwgPSB0aGlzLnJvb3QuZ2V0SXRlbShcImFwcC5BVDMyOFAudXJsXCIsIG51bGwpO1xuXHRpZiggdXJsICl7XG5cdCAgICBcblx0ICAgIHRoaXMuY29yZSA9IEF0Y29yZS5BVG1lZ2EzMjhQKCk7XG5cdCAgICBcblx0ICAgIEhleC5wYXJzZVVSTCggdXJsLCB0aGlzLmNvcmUuZmxhc2gsIChzdWNjZXNzKSA9PiB7XG5cdFx0aWYoIHN1Y2Nlc3MgKVxuXHRcdCAgICB0aGlzLmluaXRDb3JlKCk7XG5cdCAgICB9KTtcblx0ICAgIHJldHVybjtcblx0ICAgIFxuXHR9XG5cblx0bGV0IGhleCA9IHRoaXMucm9vdC5nZXRJdGVtKFwiYXBwLkFUMzI4UC5oZXhcIiwgbnVsbCk7XG5cdGlmKCBoZXggKXtcblx0XHRcblx0ICAgIHRoaXMuY29yZSA9IEF0Y29yZS5BVG1lZ2EzMjhQKCk7XG5cdCAgICBIZXgucGFyc2UoIGhleCwgdGhpcy5jb3JlLmZsYXNoICk7XG5cdCAgICB0aGlzLmluaXRDb3JlKCk7XG5cdCAgICByZXR1cm47XG5cdCAgICBcblx0fVxuXHQgICAgXG5cdHVybCA9IHRoaXMucm9vdC5nZXRJdGVtKFwiYXBwLkFUMzJ1NC51cmxcIiwgbnVsbCk7XG5cdGlmKCB1cmwgKXtcblxuXHQgICAgdGhpcy5jb3JlID0gQXRjb3JlLkFUbWVnYTMydTQoKTtcblx0ICAgIEhleC5wYXJzZVVSTCggdXJsLCB0aGlzLmNvcmUuZmxhc2gsIHN1Y2Nlc3MgPT4ge1xuXHRcdGlmKCBzdWNjZXNzICkgdGhpcy5pbml0Q29yZSgpO1xuXHQgICAgfSk7XG5cdCAgICByZXR1cm47XG5cdCAgICBcblx0fVxuXG5cdGhleCA9IHRoaXMucm9vdC5nZXRJdGVtKFwiYXBwLkFUMzJ1NC5oZXhcIiwgbnVsbCk7XG5cdGlmKCBoZXggKXtcblx0ICAgIFxuXHQgICAgdGhpcy5jb3JlID0gQXRjb3JlLkFUbWVnYTMydTQoKTtcblx0ICAgIEhleC5wYXJzZSggaGV4LCB0aGlzLmNvcmUuZmxhc2ggKTtcblx0ICAgIHRoaXMuaW5pdENvcmUoKTtcblx0ICAgIHJldHVybjtcblx0ICAgIFxuXHR9XG5cblx0Y29uc29sZS5lcnJvcihcIk5vdGhpbmcgdG8gbG9hZFwiKTtcbiAgICB9XG5cbiAgICBvblByZXNzRXNjYXBlKCl7XG5cdHRoaXMucG93ZXJPZmYoKTtcbiAgICB9XG5cbiAgICBzZXRBY3RpdmVWaWV3KCl7XG5cdHRoaXMucG9vbC5yZW1vdmUodGhpcyk7XG4gICAgfVxuXG4gICAgcG93ZXJPZmYoKXtcblx0dGhpcy5wb29sLnJlbW92ZSh0aGlzKTtcblx0dGhpcy5kZWFkID0gdHJ1ZTtcblx0dGhpcy5ET00uZWxlbWVudC5kaXNwYXRjaEV2ZW50KCBuZXcgRXZlbnQoXCJwb3dlcm9mZlwiLCB7YnViYmxlczp0cnVlfSkgKTtcbiAgICB9XG5cbiAgICBpbml0Q29yZSgpe1xuXHRsZXQgY29yZSA9IHRoaXMuY29yZSwgb2xkVmFsdWVzID0ge30sIEREUkIsIHNlcmlhbDBCdWZmZXIgPSBcIlwiLCBjYWxsYmFja3MgPSB7XG4gICAgICAgICAgICBERFJCOnt9LFxuICAgICAgICAgICAgRERSQzp7fSxcbiAgICAgICAgICAgIEREUkQ6e30sXG4gICAgICAgICAgICBQT1JUQjp7fSxcbiAgICAgICAgICAgIFBPUlRDOnt9LFxuICAgICAgICAgICAgUE9SVEQ6e30sXG4gICAgICAgICAgICBQT1JURTp7fSxcbiAgICAgICAgICAgIFBPUlRGOnt9XG5cdH07XG5cblx0T2JqZWN0LmtleXMoY2FsbGJhY2tzKS5mb3JFYWNoKCBrID0+XG5cdFx0XHRcdFx0T2JqZWN0LmFzc2lnbihjYWxsYmFja3Nba10se1xuXHRcdFx0XHRcdCAgICBvbkhpZ2hUb0xvdzpbXSwgXG5cdFx0XHRcdFx0ICAgIG9uTG93VG9IaWdoOltdXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0ICAgICAgKTtcblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydGllcyggY29yZS5waW5zLCB7XG5cbiAgICAgICAgICAgIG9uSGlnaFRvTG93Ont2YWx1ZTpmdW5jdGlvbiggcG9ydCwgYml0LCBjYiApe1xuXHRcdChjYWxsYmFja3NbIHBvcnQgXS5vbkhpZ2hUb0xvd1sgYml0IF0gPSBjYWxsYmFja3NbIHBvcnQgXVsgYml0IF0gfHwgW10pLnB1c2goIGNiICk7XG4gICAgICAgICAgICB9fSxcblxuICAgICAgICAgICAgb25Mb3dUb0hpZ2g6e3ZhbHVlOmZ1bmN0aW9uKCBwb3J0LCBiaXQsIGNiICl7XG5cdFx0KGNhbGxiYWNrc1sgcG9ydCBdLm9uTG93VG9IaWdoWyBiaXQgXSA9IGNhbGxiYWNrc1sgcG9ydCBdWyBiaXQgXSB8fCBbXSkucHVzaCggY2IgKTtcbiAgICAgICAgICAgIH19LFxuXG4gICAgICAgICAgICAwOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlREXCIsIGJpdDoyIH0sIGluOntwb3J0OlwiUElORFwiLCBiaXQ6Mn0gfSB9LFxuICAgICAgICAgICAgMTp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURFwiLCBiaXQ6MyB9LCBpbjp7cG9ydDpcIlBJTkRcIiwgYml0OjN9IH0gfSxcbiAgICAgICAgICAgIDI6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVERcIiwgYml0OjEgfSwgaW46e3BvcnQ6XCJQSU5EXCIsIGJpdDoxfSB9IH0sXG4gICAgICAgICAgICAzOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlREXCIsIGJpdDowIH0sIGluOntwb3J0OlwiUElORFwiLCBiaXQ6MH0gfSB9LFxuICAgICAgICAgICAgNDp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURFwiLCBiaXQ6NCB9LCBpbjp7cG9ydDpcIlBJTkRcIiwgYml0OjR9IH0gfSxcbiAgICAgICAgICAgIDU6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVENcIiwgYml0OjYgfSwgaW46e3BvcnQ6XCJQSU5DXCIsIGJpdDo2fSB9IH0sXG4gICAgICAgICAgICA2Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlREXCIsIGJpdDo3IH0sIGluOntwb3J0OlwiUElORFwiLCBiaXQ6N30gfSB9LFxuICAgICAgICAgICAgNzp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURVwiLCBiaXQ6NiB9LCBpbjp7cG9ydDpcIlBJTkVcIiwgYml0OjZ9IH0gfSxcbiAgICAgICAgICAgIDg6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEJcIiwgYml0OjQgfSwgaW46e3BvcnQ6XCJQSU5CXCIsIGJpdDo0fSB9IH0sXG4gICAgICAgICAgICA5Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRCXCIsIGJpdDo1IH0sIGluOntwb3J0OlwiUElOQlwiLCBiaXQ6NX0gfSB9LFxuICAgICAgICAgICAgMTA6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEJcIiwgYml0OjYgfSwgaW46e3BvcnQ6XCJQSU5CXCIsIGJpdDo2fSB9IH0sXG4gICAgICAgICAgICAxMTp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JUQlwiLCBiaXQ6NyB9LCBpbjp7cG9ydDpcIlBJTkJcIiwgYml0Ojd9IH0gfSxcblxuXHQgICAgMTY6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEJcIiwgYml0OjIgfSwgaW46e3BvcnQ6XCJQSU5CXCIsIGJpdDoyfSB9IH0sXG4gICAgICAgICAgICAxNDp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JUQlwiLCBiaXQ6MyB9LCBpbjp7cG9ydDpcIlBJTkJcIiwgYml0OjN9IH0gfSxcbiAgICAgICAgICAgIDE1Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRCXCIsIGJpdDoxIH0sIGluOntwb3J0OlwiUElOQlwiLCBiaXQ6MX0gfSB9LFxuICAgICAgICAgICAgMTc6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEJcIiwgYml0OjAgfSwgaW46e3BvcnQ6XCJQSU5CXCIsIGJpdDowfSB9IH0sXG5cbiAgICAgICAgICAgIDE4Ont2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRGXCIsIGJpdDo3IH0sIGluOntwb3J0OlwiUElORlwiLCBiaXQ6N30gfSB9LFxuICAgICAgICAgICAgQTA6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEZcIiwgYml0OjcgfSwgaW46e3BvcnQ6XCJQSU5GXCIsIGJpdDo3fSB9IH0sXG4gICAgICAgICAgICAxOTp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURlwiLCBiaXQ6NiB9LCBpbjp7cG9ydDpcIlBJTkZcIiwgYml0OjZ9IH0gfSxcbiAgICAgICAgICAgIEExOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRGXCIsIGJpdDo2IH0sIGluOntwb3J0OlwiUElORlwiLCBiaXQ6Nn0gfSB9LFxuICAgICAgICAgICAgMjA6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEZcIiwgYml0OjUgfSwgaW46e3BvcnQ6XCJQSU5GXCIsIGJpdDo1fSB9IH0sXG4gICAgICAgICAgICBBMjp7dmFsdWU6eyBvdXQ6e3BvcnQ6XCJQT1JURlwiLCBiaXQ6NSB9LCBpbjp7cG9ydDpcIlBJTkZcIiwgYml0OjV9IH0gfSxcbiAgICAgICAgICAgIDIxOnt2YWx1ZTp7IG91dDp7cG9ydDpcIlBPUlRGXCIsIGJpdDo0IH0sIGluOntwb3J0OlwiUElORlwiLCBiaXQ6NH0gfSB9LFxuICAgICAgICAgICAgQTM6e3ZhbHVlOnsgb3V0Ontwb3J0OlwiUE9SVEZcIiwgYml0OjQgfSwgaW46e3BvcnQ6XCJQSU5GXCIsIGJpdDo0fSB9IH0sXG5cdCAgICBcblx0ICAgIE1PU0k6e3ZhbHVlOnt9fSxcblx0ICAgIE1JU086e3ZhbHVlOnt9fSxcblxuXHQgICAgc3BpSW46e1xuXHRcdHZhbHVlOltdXG5cdCAgICB9LFxuXHQgICAgXG5cdCAgICBzcGlPdXQ6e1xuXHRcdHZhbHVlOntcblx0XHQgICAgbGlzdGVuZXJzOltdLFxuXHRcdCAgICBwdXNoKCBkYXRhICl7XG5cdFx0XHRsZXQgaT0wLCBsaXN0ZW5lcnM9dGhpcy5saXN0ZW5lcnMsIGw9bGlzdGVuZXJzLmxlbmd0aDtcblx0XHRcdGZvcig7aTxsOysraSlcblx0XHRcdCAgICBsaXN0ZW5lcnNbaV0oIGRhdGEgKTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH0sXG5cdCAgICBcbiAgICAgICAgICAgIHNlcmlhbDA6e1xuXHRcdHNldDpmdW5jdGlvbiggc3RyICl7XG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IChzdHIgfHwgXCJcIikucmVwbGFjZSgvXFxyXFxuPy8sJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICBzZXJpYWwwQnVmZmVyICs9IHN0cjtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgYnIgPSBzZXJpYWwwQnVmZmVyLmluZGV4T2YoXCJcXG5cIik7XG4gICAgICAgICAgICAgICAgICAgIGlmKCBiciAhPSAtMSApe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFydHMgPSBzZXJpYWwwQnVmZmVyLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUoIHBhcnRzLmxlbmd0aD4xIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggJ1NFUklBTDogJywgcGFydHMuc2hpZnQoKSApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpYWwwQnVmZmVyID0gcGFydHNbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcblx0XHR9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBERFJCOiB7XG5cdFx0c2V0OiBzZXRERFIuYmluZChudWxsLCBcIkREUkJcIiksXG5cdFx0Z2V0OmZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvbGRWYWx1ZXMuRERSQnwwO1xuXHRcdH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBERFJDOiB7XG5cdFx0c2V0OiBzZXRERFIuYmluZChudWxsLCBcIkREUkNcIiksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRERSRDoge1xuXHRcdHNldDogc2V0RERSLmJpbmQobnVsbCwgXCJERFJEXCIpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEREUkU6IHtcblx0XHRzZXQ6IHNldEREUi5iaW5kKG51bGwsIFwiRERSRFwiKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBERFJGOiB7XG5cdFx0c2V0OiBzZXRERFIuYmluZChudWxsLCBcIkREUkRcIiksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUE9SVEI6IHtcblx0XHRzZXQ6IHNldFBvcnQuYmluZChudWxsLCBcIlBPUlRCXCIpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUE9SVEM6IHtcblx0XHRzZXQ6IHNldFBvcnQuYmluZChudWxsLCBcIlBPUlRDXCIpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUE9SVEQ6IHtcblx0XHRzZXQ6IHNldFBvcnQuYmluZChudWxsLCBcIlBPUlREXCIpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUE9SVEU6IHtcblx0XHRzZXQ6IHNldFBvcnQuYmluZChudWxsLCBcIlBPUlRFXCIpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUE9SVEY6IHtcblx0XHRzZXQ6IHNldFBvcnQuYmluZChudWxsLCBcIlBPUlRGXCIpXG4gICAgICAgICAgICB9XG5cblx0fSk7XG5cblx0c2V0VGltZW91dCggXyA9PiB7XG5cdCAgICB0aGlzLnNldHVwUGVyaWZlcmFscygpO1xuXHQgICAgdGhpcy5fdXBkYXRlKCk7XG5cdH0sIDUpO1xuXG5cdGZ1bmN0aW9uIHNldEREUiggbmFtZSwgY3VyICl7ICAgXG4gICAgICAgICAgICB2YXIgb2xkID0gb2xkVmFsdWVzW25hbWVdOyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiggb2xkID09PSBjdXIgKSByZXR1cm47XG4gICAgICAgICAgICBvbGRWYWx1ZXNbbmFtZV0gPSBjdXI7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRQb3J0KCBuYW1lLCBjdXIgKXtcbiAgICAgICAgICAgIHZhciBvbGQgPSBvbGRWYWx1ZXNbbmFtZV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKCBvbGQgPT09IGN1ciApIHJldHVybjtcbiAgICAgICAgICAgIHZhciBzLCBqLCBsLCBsdGggPSBjYWxsYmFja3NbbmFtZV0ub25Mb3dUb0hpZ2gsIGh0bCA9IGNhbGxiYWNrc1tuYW1lXS5vbkhpZ2hUb0xvdywgdGljayA9IGNvcmUudGljaztcblxuICAgICAgICAgICAgZm9yKCB2YXIgaT0wOyBpPDg7ICsraSApe1xuXG5cdFx0dmFyIG9iID0gb2xkPj4+aSYxLCBuYiA9IGN1cj4+PmkmMTtcblx0XHRpZiggbHRoW2ldICYmICFvYiAmJiBuYiApe1xuICAgICAgICAgICAgICAgICAgICBmb3IoIGo9MCwgcz1sdGhbaV0sIGw9cy5sZW5ndGg7IGo8bDsgKytqIClcblx0XHRcdHNbal0oIHRpY2sgKTtcblx0XHR9XG5cdFx0aWYoIGh0bFtpXSAmJiBvYiAmJiAhbmIgKXtcbiAgICAgICAgICAgICAgICAgICAgZm9yKCBqPTAsIHM9aHRsW2ldLCBsPXMubGVuZ3RoOyBqPGw7ICsraiApXG5cdFx0XHRzW2pdKCB0aWNrICk7XG5cdFx0fVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9sZFZhbHVlc1tuYW1lXSA9IGN1cjtcblxuXHR9XG4gICAgfVxuXG4gICAgXG5cbiAgICBhZGRQZXJpZmVyYWwoIGN0cmwgKXtcblx0XG5cdHRoaXMucGVyaWZlcmFscy5wdXNoKCBjdHJsICk7XG5cdFxuICAgIH1cblxuICAgIHNldHVwUGVyaWZlcmFscygpe1xuXHRsZXQgcGlucyA9IHRoaXMuY29yZS5waW5zO1xuXHRsZXQgbWFwID0geyBjcHU6dGhpcy5jb3JlLnBpbnMgfTtcblx0XG5cdHRoaXMucGVyaWZlcmFscy5mb3JFYWNoKCBjdHJsID0+IHtcblxuXHQgICAgaWYoIGN0cmwudGljayApXG5cdFx0dGhpcy50aWNrLnB1c2goIGN0cmwgKTtcblx0ICAgIFxuXHQgICAgZm9yKCBsZXQgayBpbiBjdHJsICl7XG5cblx0XHRsZXQgdiA9IGN0cmxba107XG5cdFx0aWYoICF2IHx8ICF2LmNvbm5lY3QgKSBjb250aW51ZTtcblxuXHRcdGxldCB0YXJnZXQgPSB2LmNvbm5lY3Q7XG5cdFx0aWYodHlwZW9mIHRhcmdldCA9PSBcIm51bWJlclwiIClcblx0XHQgICAgdGFyZ2V0ID0gXCJjcHUuXCIgKyB0YXJnZXQ7XG5cblx0XHRsZXQgdG9iaiA9IG1hcDtcblx0XHRsZXQgdHBhcnRzID0gdGFyZ2V0LnNwbGl0KFwiLlwiKTtcblx0XHR3aGlsZSggdHBhcnRzLmxlbmd0aCAmJiB0b2JqIClcblx0XHQgICAgdG9iaiA9IHRvYmpbIHRwYXJ0cy5zaGlmdCgpIF07XG5cblx0XHRpZiggdi5NT1NJIClcblx0XHQgICAgcGlucy5zcGlPdXQubGlzdGVuZXJzLnB1c2goIHYuTU9TSS5iaW5kKCBjdHJsICkgKTtcblxuXHRcdGlmKCAhdG9iaiApe1xuXHRcdCAgICBjb25zb2xlLndhcm4oXCJDb3VsZCBub3QgYXR0YWNoIHdpcmUgZnJvbSBcIiwgaywgXCIgdG8gXCIsIHRhcmdldCk7XG5cdFx0ICAgIGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGlmKCB2Lm9uTG93VG9IaWdoIClcblx0XHQgICAgcGlucy5vbkxvd1RvSGlnaCggdG9iai5vdXQucG9ydCwgdG9iai5vdXQuYml0LCB2Lm9uTG93VG9IaWdoLmJpbmQoIGN0cmwgKSApO1xuXHRcdFxuXHRcdGlmKCB2Lm9uSGlnaFRvTG93IClcblx0XHQgICAgcGlucy5vbkhpZ2hUb0xvdyggdG9iai5vdXQucG9ydCwgdG9iai5vdXQuYml0LCB2Lm9uSGlnaFRvTG93LmJpbmQoIGN0cmwgKSApO1xuXG5cblx0XHRsZXQgc2V0dGVyID0gKGZ1bmN0aW9uKCB0b2JqLCBudiApe1xuXHRcdCAgICBcblx0XHQgICAgaWYoIG52ICkgcGluc1sgdG9iai5pbi5wb3J0IF0gfD0gMSA8PCB0b2JqLmluLmJpdDtcblx0XHQgICAgZWxzZSBwaW5zWyB0b2JqLmluLnBvcnQgXSAmPSB+KDEgPDwgdG9iai5pbi5iaXQpO1xuXHRcdCAgICBcblx0XHR9KS5iaW5kKHRoaXMsIHRvYmopO1xuXG5cdFx0bGV0IGdldHRlciA9IChmdW5jdGlvbiggdG9iaiApe1xuXHRcdCAgICByZXR1cm4gKHBpbnNbIHRvYmoub3V0LnBvcnQgXSA+Pj4gdG9iai5vdXQuYml0KSAmIDE7XG5cdFx0fSkuYmluZCh0aGlzLCB0b2JqKTtcblxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2LCBcInZhbHVlXCIsIHtcblx0XHQgICAgc2V0OnNldHRlcixcblx0XHQgICAgZ2V0OmdldHRlclxuXHRcdH0pO1xuXG5cdFx0aWYoIHYuaW5pdCApXG5cdFx0ICAgIHYuaW5pdC5jYWxsKCBjdHJsICk7XG5cblx0ICAgIH1cblx0ICAgIFxuXHR9KTtcblx0XG4gICAgfVxuXG4gICAgX3VwZGF0ZSgpe1xuXHRpZiggdGhpcy5kZWFkICkgcmV0dXJuO1xuXHRcblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCB0aGlzLnVwZGF0ZSApO1xuXHR0aGlzLmNvcmUudXBkYXRlKCk7XG5cdHRoaXMucmVzaXplKCk7XG5cdGZvciggbGV0IGk9MCwgbD10aGlzLnRpY2subGVuZ3RoOyBpPGw7ICsraSApXG5cdCAgICB0aGlzLnRpY2tbaV0udGljaygpO1xuICAgIH1cblxuICAgIHJlc2l6ZSgpe1xuXHRcblx0bGV0IG1heEhlaWdodCA9IHRoaXMucGFyZW50LmNsaWVudEhlaWdodDtcblx0bGV0IG1heFdpZHRoICA9IHRoaXMucGFyZW50LmNsaWVudFdpZHRoO1xuXG5cdGlmKCB0aGlzLndpZHRoID09IG1heFdpZHRoICYmIHRoaXMuaGVpZ2h0ID09IG1heEhlaWdodCApXG5cdCAgICByZXR1cm47XG5cdFxuXHR0aGlzLndpZHRoID0gbWF4V2lkdGg7XG5cdHRoaXMuaGVpZ2h0ID0gbWF4SGVpZ2h0O1xuXG5cdGxldCByYXRpbyA9IDM5MyAvIDYyNDtcblxuXHRpZiggdGhpcy5oZWlnaHQgKiByYXRpbyA+IHRoaXMud2lkdGggKXtcblx0ICAgIHRoaXMuRE9NLmVsZW1lbnQuc3R5bGUud2lkdGggPSB0aGlzLndpZHRoICsgXCJweFwiO1xuXHQgICAgdGhpcy5ET00uZWxlbWVudC5zdHlsZS5oZWlnaHQgPSAodGhpcy53aWR0aCAvIHJhdGlvKSArIFwicHhcIjtcblx0fWVsc2V7XG5cdCAgICB0aGlzLkRPTS5lbGVtZW50LnN0eWxlLndpZHRoID0gKHRoaXMuaGVpZ2h0ICogcmF0aW8pICsgXCJweFwiO1xuXHQgICAgdGhpcy5ET00uZWxlbWVudC5zdHlsZS5oZWlnaHQgPSB0aGlzLmhlaWdodCArIFwicHhcIjtcblx0fVxuXHRcbiAgICB9XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXJkdWJveTtcbiIsImNsYXNzIENvbmZpZ3tcclxuXHJcbiAgICBjb25zdHJ1Y3RvciggRE9NICl7XHJcbiAgICAgICAgRE9NLmVsZW1lbnQuaW5uZXJIVE1MID0gXCJDIE8gTiBGIEkgR1wiO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb25maWc7IiwiY2xhc3MgRmlsZXN7XHJcblxyXG4gICAgY29uc3RydWN0b3IoIERPTSApe1xyXG4gICAgICAgIERPTS5lbGVtZW50LmlubmVySFRNTCA9IFwiQyBPIE4gRiBJIEdcIjtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmlsZXM7IiwiaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuLi9saWIvbXZjLmpzJztcblxuY2xhc3MgTWFya2V0e1xuXG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xuICAgICAgICByb290OiBbTW9kZWwsIHtzY29wZTpcInJvb3RcIn1dXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoIERPTSApe1xuICAgIH1cblxuICAgIHJ1bigpe1xuICAgICAgICB0aGlzLnBvb2wuY2FsbChcInJ1blNpbVwiKTtcbiAgICB9XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFya2V0O1xuIiwiaW1wb3J0IElTdG9yZSBmcm9tICcuLi9zdG9yZS9JU3RvcmUuanMnO1xyXG5pbXBvcnQgeyBJQ29udHJvbGxlciwgTW9kZWwsIElWaWV3IH0gZnJvbSAnLi4vbGliL212Yy5qcyc7XHJcblxyXG5jbGFzcyBFbnYgZXh0ZW5kcyBJQ29udHJvbGxlciB7XHJcblxyXG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xyXG4gICAgICAgIHN0b3JlOklTdG9yZSxcclxuICAgICAgICBwb29sOlwicG9vbFwiLFxyXG4gICAgICAgIHZpZXdGYWN0b3J5OltJVmlldywge2NvbnRyb2xsZXI6RW52fV0sXHJcbiAgICAgICAgbW9kZWw6IFtNb2RlbCwge3Njb3BlOlwicm9vdFwifV1cclxuICAgIH1cclxuXHJcbiAgICBleGl0U3BsYXNoKCl7XHJcblx0LyogKi9cclxuICAgICAgICB0aGlzLl9zaG93KCk7XHJcblx0LyovXHJcblx0dGhpcy5tb2RlbC5zZXRJdGVtKFwiYXBwLkFUMzJ1NC51cmxcIiwgXCJIZWxsb1dvcmxkMzJ1NC5oZXhcIik7XHJcblx0dGhpcy5wb29sLmNhbGwoXCJydW5TaW1cIik7XHJcblx0LyogKi9cdFxyXG4gICAgfVxyXG5cclxuICAgIGV4aXRTaW0oKXtcclxuXHR0aGlzLl9zaG93KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheSggb3B0ICl7XHJcblx0dGhpcy5tb2RlbC5zZXRJdGVtKFwiYXBwLkFUMzJ1NC51cmxcIiwgdGhpcy5tb2RlbC5nZXRJdGVtKFwiYXBwLnByb3h5XCIpICsgb3B0LmVsZW1lbnQuZGF0YXNldC51cmwpO1xyXG5cdHRoaXMucG9vbC5jYWxsKFwicnVuU2ltXCIpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEVudjtcclxuIiwiaW1wb3J0IHsgSUNvbnRyb2xsZXIsIE1vZGVsLCBJVmlldyB9IGZyb20gJy4uL2xpYi9tdmMuanMnO1xuXG5jbGFzcyBTaW0gZXh0ZW5kcyBJQ29udHJvbGxlciB7XG5cbiAgICBzdGF0aWMgXCJAaW5qZWN0XCIgPSB7XG4gICAgICAgIHBvb2w6XCJwb29sXCIsXG4gICAgICAgIHZpZXdGYWN0b3J5OltJVmlldywge2NvbnRyb2xsZXI6U2ltfV0sXG4gICAgICAgIG1vZGVsOiBbTW9kZWwsIHtzY29wZTpcInJvb3RcIn1dXG4gICAgfVxuXG4gICAgcnVuU2ltKCl7XG4gICAgICAgIHRoaXMuX3Nob3coKTtcbiAgICB9XG5cbiAgICBvbkVuZFNpbSgpe1xuXHR0aGlzLnBvb2wuY2FsbChcImV4aXRTaW1cIik7XG4gICAgfVxuXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgU2ltO1xuIiwiLy8gaW1wb3J0IElTdG9yZSBmcm9tICcuLi9zdG9yZS9JU3RvcmUuanMnO1xyXG5pbXBvcnQgeyBJQ29udHJvbGxlciwgSVZpZXcgfSBmcm9tICcuLi9saWIvbXZjLmpzJztcclxuXHJcblxyXG5jbGFzcyBTcGxhc2ggZXh0ZW5kcyBJQ29udHJvbGxlciB7XHJcblxyXG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xyXG4gICAgICAgIHBvb2w6XCJwb29sXCIsXHJcbiAgICAgICAgdmlld0ZhY3Rvcnk6W0lWaWV3LCB7Y29udHJvbGxlcjpTcGxhc2h9XVxyXG4gICAgfTtcclxuXHJcbiAgICBlbnRlclNwbGFzaCgpe1xyXG4gICAgICAgIHRoaXMuX3Nob3coKTtcclxuICAgIH1cclxuXHJcbiAgICBCT0RZID0ge1xyXG4gICAgICAgIGJvdW5kOmZ1bmN0aW9uKCBldnQgKXtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IGV2dC50YXJnZXQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufVxyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFNwbGFzaDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBET007XHJcblxyXG5mdW5jdGlvbiBET00oIGVsZW1lbnQgKXtcclxuXHJcbiAgICBpZiggIWVsZW1lbnQgJiYgZG9jdW1lbnQgJiYgZG9jdW1lbnQuYm9keSApXHJcbiAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XHJcblxyXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuXHJcbn1cclxuXHJcbnZhciBzcGFyZSA9IG51bGw7XHJcbmZ1bmN0aW9uIGdldFRoaXMoIHRoYXQgKXtcclxuXHJcbiAgICBpZiggIXRoYXQgfHwgdHlwZW9mIHRoYXQgPT0gXCJmdW5jdGlvblwiIClcclxuICAgICAgICByZXR1cm4gc3BhcmUgPSBzcGFyZSB8fCBuZXcgRE9NKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoYXQ7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBwcm90b3R5cGUoIG9iaiApe1xyXG4gICAgXHJcbiAgICB2YXIgZGVzYyA9IHt9O1xyXG4gICAgZm9yKCB2YXIgayBpbiBvYmogKXtcclxuICAgICAgICBkZXNjW2tdID0ge1xyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOmZhbHNlLFxyXG4gICAgICAgICAgICB2YWx1ZTogb2JqW2tdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciByZXQgPSB7fTtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHJldCwgZGVzYyk7XHJcblxyXG4gICAgcmV0dXJuIHJldDtcclxuXHJcbn1cclxuXHJcbnZhciBpbXBsID0ge1xyXG5cclxuICAgIGNyZWF0ZTpmdW5jdGlvbiggc3RyVGFnTmFtZSwgb2JqUHJvcGVydGllcywgYXJyQ2hpbGRyZW4sIGVsUGFyZW50ICl7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgc3RyVGFnTmFtZSA9IG9ialByb3BlcnRpZXMgPSBhcnJDaGlsZHJlbiA9IGVsUGFyZW50ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBmb3IoIHZhciBpPTAsIGw9YXJncy5sZW5ndGg7IGk8bDsgKytpICl7XHJcbiAgICAgICAgICAgIHZhciBhcmcgPSBhcmdzW2ldO1xyXG4gICAgICAgICAgICBpZiggdHlwZW9mIGFyZyA9PSBcInN0cmluZ1wiIClcclxuICAgICAgICAgICAgICAgIHN0clRhZ05hbWUgPSBhcmc7XHJcbiAgICAgICAgICAgIGVsc2UgaWYoIHR5cGVvZiBhcmcgPT0gXCJvYmplY3RcIiApe1xyXG4gICAgICAgICAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoYXJnKSApXHJcbiAgICAgICAgICAgICAgICAgICAgYXJyQ2hpbGRyZW4gPSBhcmc7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBhcmcgaW5zdGFuY2VvZiBFbGVtZW50IClcclxuICAgICAgICAgICAgICAgICAgICBlbFBhcmVudCA9IGFyZztcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBvYmpQcm9wZXJ0aWVzID0gYXJnO1xyXG4gICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoICFlbFBhcmVudCAmJiB0aGlzLmVsZW1lbnQgKVxyXG4gICAgICAgICAgICBlbFBhcmVudCA9IHRoaXMuZWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYoICFzdHJUYWdOYW1lICl7XHJcbiAgICAgICAgICAgIGlmKCAhZWxQYXJlbnQgKVxyXG4gICAgICAgICAgICAgICAgc3RyVGFnTmFtZSA9IFwic3BhblwiO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBzdHJUYWdOYW1lID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhYmxlOlwidHJcIixcclxuICAgICAgICAgICAgICAgICAgICB0cjpcInRkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0Olwib3B0aW9uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdWw6XCJsaVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG9sOlwibGlcIixcclxuICAgICAgICAgICAgICAgICAgICBkbDpcImR0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0Z3JvdXA6XCJvcHRpb25cIixcclxuICAgICAgICAgICAgICAgICAgICBkYXRhbGlzdDpcIm9wdGlvblwiXHJcbiAgICAgICAgICAgICAgICB9W2VsUGFyZW50LnRhZ05hbWVdIHx8IGVsUGFyZW50LnRhZ05hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIHN0clRhZ05hbWUgKTtcclxuICAgICAgICBpZiggZWxQYXJlbnQgKVxyXG4gICAgICAgICAgICBlbFBhcmVudC5hcHBlbmRDaGlsZCggZWxlbWVudCApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBsaXN0ZW5lcjtcclxuXHJcbiAgICAgICAgZm9yKCB2YXIga2V5IGluIG9ialByb3BlcnRpZXMgKXtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gb2JqUHJvcGVydGllc1trZXldO1xyXG4gICAgICAgICAgICBpZigga2V5ID09IFwidGV4dFwiIClcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKSApO1xyXG4gICAgICAgICAgICBlbHNlIGlmKCBrZXkgPT0gXCJsaXN0ZW5lclwiIClcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGVsc2UgaWYoIGtleSA9PSBcImF0dHJcIiApe1xyXG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgYXR0ciBpbiB2YWx1ZSApXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoIGF0dHIsIHZhbHVlW2F0dHJdICk7XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBlbGVtZW50W2tleV0gJiYgdHlwZW9mIGVsZW1lbnRba2V5XSA9PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiIClcclxuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oIGVsZW1lbnRba2V5XSwgdmFsdWUgKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgZWxlbWVudFtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggdGhpcy5lbGVtZW50ICYmIGVsZW1lbnQuaWQgKVxyXG4gICAgICAgICAgICB0aGlzW2VsZW1lbnQuaWRdID0gZWxlbWVudDtcclxuXHJcbiAgICAgICAgZm9yKCBpPTAsIGw9YXJyQ2hpbGRyZW4gJiYgYXJyQ2hpbGRyZW4ubGVuZ3RoOyBpPGw7ICsraSApe1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZS5hcHBseSggdGhpcywgYXJyQ2hpbGRyZW5baV0uY29uY2F0KGVsZW1lbnQpICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggbGlzdGVuZXIgKVxyXG4gICAgICAgICAgICAobmV3IERPTShlbGVtZW50KSkubGlzdGVuKCBsaXN0ZW5lciApO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgIH0sXHJcblxyXG4gICAgbGlzdGVuOmZ1bmN0aW9uKCBsaXN0ZW5lcnMsIHRoYXQsIHByZWZpeCApe1xyXG4gICAgICAgIHByZWZpeCA9IHByZWZpeCB8fCBcIlwiO1xyXG4gICAgICAgIGlmKCB0aGF0ID09PSB1bmRlZmluZWQgKSB0aGF0ID0gbGlzdGVuZXJzO1xyXG5cclxuICAgICAgICB2YXIgVEhJUyA9IGdldFRoaXMoIHRoaXMgKTtcclxuXHJcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyggbGlzdGVuZXJzICk7XHJcblxyXG4gICAgICAgIFRISVMuZm9yRWFjaCggZWxlbWVudCA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiggbGlzdGVuZXJzW3ByZWZpeCArIGVsZW1lbnQudGFnTmFtZV0gKSBcclxuICAgICAgICAgICAgICAgIGJpbmQoIGxpc3RlbmVyc1twcmVmaXggKyBlbGVtZW50LnRhZ05hbWVdLCBlbGVtZW50ICk7XHJcblxyXG4gICAgICAgICAgICBpZiggbGlzdGVuZXJzW3ByZWZpeCArIGVsZW1lbnQuaWRdICkgXHJcbiAgICAgICAgICAgICAgICBiaW5kKCBsaXN0ZW5lcnNbcHJlZml4ICsgZWxlbWVudC5pZF0sIGVsZW1lbnQgKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCBsaXN0ZW5lcnNbcHJlZml4ICsgZWxlbWVudC5jbGFzc05hbWVdICkgXHJcbiAgICAgICAgICAgICAgICBiaW5kKCBsaXN0ZW5lcnNbcHJlZml4ICsgZWxlbWVudC5jbGFzc05hbWVdLCBlbGVtZW50ICk7XHJcblxyXG4gICAgICAgICAgICBpZiggbGlzdGVuZXJzW3ByZWZpeCArIGVsZW1lbnQubmFtZV0gKSBcclxuICAgICAgICAgICAgICAgIGJpbmQoIGxpc3RlbmVyc1twcmVmaXggKyBlbGVtZW50Lm5hbWVdLCBlbGVtZW50ICk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gVEhJUztcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYmluZCggb2JqLCBlbGVtZW50ICl7XHJcblxyXG4gICAgICAgICAgICBmb3IoIHZhciBldmVudCBpbiBvYmogKXtcclxuICAgICAgICAgICAgICAgIHZhciBmdW5jID0gb2JqW2V2ZW50XTtcclxuICAgICAgICAgICAgICAgIGlmKCAhZnVuYy5jYWxsICkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50LCB0aGF0ID8gZnVuYy5iaW5kKHRoYXQpIDogZnVuYyApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGluZGV4OmZ1bmN0aW9uKCBrZXlzLCBtdWx0aXBsZSwgcHJvcGVydHkgKXtcclxuICAgICAgICB2YXIgVEhJUyA9IGdldFRoaXModGhpcyk7XHJcblxyXG4gICAgICAgIHZhciBpbmRleCA9IE9iamVjdC5jcmVhdGUoRE9NLnByb3RvdHlwZSk7XHJcblxyXG4gICAgICAgIGlmKCB0eXBlb2Yga2V5cyA9PSBcInN0cmluZ1wiICkga2V5cyA9IFtrZXlzXTtcclxuXHJcbiAgICAgICAgZm9yKCB2YXIgaT0wLCBsPWtleXMubGVuZ3RoOyBpPGw7ICsraSApe1xyXG5cclxuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2Yga2V5ICE9IFwic3RyaW5nXCIgKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBpZiggIXByb3BlcnR5ICYmICFtdWx0aXBsZSApe1xyXG5cclxuICAgICAgICAgICAgICAgIFRISVMuZm9yRWFjaCggY2hpbGQgPT4gY2hpbGRba2V5XSAhPT0gdW5kZWZpbmVkICYmIChpbmRleFsgY2hpbGRba2V5XSBdID0gY2hpbGQpICk7XHJcblxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggcHJvcGVydHkgJiYgIW11bHRpcGxlICl7XHJcblxyXG4gICAgICAgICAgICAgICAgVEhJUy5mb3JFYWNoKCBjaGlsZCA9PntcclxuICAgICAgICAgICAgICAgICAgICBpZiggY2hpbGRbcHJvcGVydHldICYmIHR5cGVvZiBjaGlsZFtwcm9wZXJ0eV0gPT0gXCJvYmplY3RcIiAmJiBjaGlsZFtwcm9wZXJ0eV1ba2V5XSAhPT0gdW5kZWZpbmVkICkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4WyBjaGlsZFtwcm9wZXJ0eV1ba2V5XSBdID0gY2hpbGQ7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCAhcHJvcGVydHkgJiYgdHlwZW9mIG11bHRpcGxlID09IFwiZnVuY3Rpb25cIiApe1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBUSElTLmZvckVhY2goIGNoaWxkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiggY2hpbGRba2V5XSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGUoIGNoaWxkW2tleV0sIGNoaWxkICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKCBwcm9wZXJ0eSAmJiB0eXBlb2YgbXVsdGlwbGUgPT0gXCJmdW5jdGlvblwiICl7XHJcblxyXG4gICAgICAgICAgICAgICAgVEhJUy5mb3JFYWNoKCBjaGlsZCA9PntcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoICFjaGlsZFtwcm9wZXJ0eV0gfHwgdHlwZW9mIGNoaWxkW3Byb3BlcnR5XSAhPSBcIm9iamVjdFwiICkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHYgPSBjaGlsZFtwcm9wZXJ0eV1ba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiggdiAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGUoIHYsIGNoaWxkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggIXByb3BlcnR5ICYmIG11bHRpcGxlICl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIFRISVMuZm9yRWFjaCggY2hpbGQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCBjaGlsZFtrZXldICE9PSB1bmRlZmluZWQgKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoICFpbmRleFsgY2hpbGRba2V5XSBdIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4WyBjaGlsZFtrZXldIF0gPSBbY2hpbGRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFsgY2hpbGRba2V5XSBdLnB1c2goIGNoaWxkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggcHJvcGVydHkgJiYgbXVsdGlwbGUgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBUSElTLmZvckVhY2goIGNoaWxkID0+e1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiggIWNoaWxkW3Byb3BlcnR5XSB8fCB0eXBlb2YgY2hpbGRbcHJvcGVydHldICE9IFwib2JqZWN0XCIgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IGNoaWxkW3Byb3BlcnR5XVtrZXldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCB2ICE9PSB1bmRlZmluZWQgKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoICFpbmRleFsgdiBdIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4WyB2IF0gPSBbY2hpbGRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFsgdiBdLnB1c2goIGNoaWxkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbmRleDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZvckVhY2g6ZnVuY3Rpb24oIGNiLCBlbGVtZW50ICl7XHJcbiAgICAgICAgdmFyIFRISVMgPSBnZXRUaGlzKHRoaXMpO1xyXG5cclxuICAgICAgICBlbGVtZW50ID0gZWxlbWVudCB8fCBUSElTLmVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGlmKCAhZWxlbWVudCApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYoIGNiKGVsZW1lbnQpID09PSBmYWxzZSApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYoICFlbGVtZW50LmNoaWxkcmVuIClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBmb3IoIHZhciBpPTAsIGw9ZWxlbWVudC5jaGlsZHJlbi5sZW5ndGg7IGk8bDsgKytpICl7XHJcbiAgICAgICAgICAgIFRISVMuZm9yRWFjaCggY2IsIGVsZW1lbnQuY2hpbGRyZW5baV0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbk9iamVjdC5hc3NpZ24oRE9NLCBpbXBsKTtcclxuRE9NLnByb3RvdHlwZSA9IHByb3RvdHlwZShpbXBsKTtcclxuIiwiLypcclxuICBJJ3ZlIHdyYXBwZWQgTWFrb3RvIE1hdHN1bW90byBhbmQgVGFrdWppIE5pc2hpbXVyYSdzIGNvZGUgaW4gYSBuYW1lc3BhY2VcclxuICBzbyBpdCdzIGJldHRlciBlbmNhcHN1bGF0ZWQuIE5vdyB5b3UgY2FuIGhhdmUgbXVsdGlwbGUgcmFuZG9tIG51bWJlciBnZW5lcmF0b3JzXHJcbiAgYW5kIHRoZXkgd29uJ3Qgc3RvbXAgYWxsIG92ZXIgZWFjaG90aGVyJ3Mgc3RhdGUuXHJcbiAgXHJcbiAgSWYgeW91IHdhbnQgdG8gdXNlIHRoaXMgYXMgYSBzdWJzdGl0dXRlIGZvciBNYXRoLnJhbmRvbSgpLCB1c2UgdGhlIHJhbmRvbSgpXHJcbiAgbWV0aG9kIGxpa2Ugc286XHJcbiAgXHJcbiAgdmFyIG0gPSBuZXcgTWVyc2VubmVUd2lzdGVyKCk7XHJcbiAgdmFyIHJhbmRvbU51bWJlciA9IG0ucmFuZG9tKCk7XHJcbiAgXHJcbiAgWW91IGNhbiBhbHNvIGNhbGwgdGhlIG90aGVyIGdlbnJhbmRfe2Zvb30oKSBtZXRob2RzIG9uIHRoZSBpbnN0YW5jZS5cclxuICBJZiB5b3Ugd2FudCB0byB1c2UgYSBzcGVjaWZpYyBzZWVkIGluIG9yZGVyIHRvIGdldCBhIHJlcGVhdGFibGUgcmFuZG9tXHJcbiAgc2VxdWVuY2UsIHBhc3MgYW4gaW50ZWdlciBpbnRvIHRoZSBjb25zdHJ1Y3RvcjpcclxuICB2YXIgbSA9IG5ldyBNZXJzZW5uZVR3aXN0ZXIoMTIzKTtcclxuICBhbmQgdGhhdCB3aWxsIGFsd2F5cyBwcm9kdWNlIHRoZSBzYW1lIHJhbmRvbSBzZXF1ZW5jZS5cclxuICBTZWFuIE1jQ3VsbG91Z2ggKGJhbmtzZWFuQGdtYWlsLmNvbSlcclxuKi9cclxuXHJcbi8qIFxyXG4gICBBIEMtcHJvZ3JhbSBmb3IgTVQxOTkzNywgd2l0aCBpbml0aWFsaXphdGlvbiBpbXByb3ZlZCAyMDAyLzEvMjYuXHJcbiAgIENvZGVkIGJ5IFRha3VqaSBOaXNoaW11cmEgYW5kIE1ha290byBNYXRzdW1vdG8uXHJcbiBcclxuICAgQmVmb3JlIHVzaW5nLCBpbml0aWFsaXplIHRoZSBzdGF0ZSBieSB1c2luZyBpbml0X2dlbnJhbmQoc2VlZCkgIFxyXG4gICBvciBpbml0X2J5X2FycmF5KGluaXRfa2V5LCBrZXlfbGVuZ3RoKS5cclxuIFxyXG4gICBDb3B5cmlnaHQgKEMpIDE5OTcgLSAyMDAyLCBNYWtvdG8gTWF0c3Vtb3RvIGFuZCBUYWt1amkgTmlzaGltdXJhLFxyXG4gICBBbGwgcmlnaHRzIHJlc2VydmVkLiAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiBcclxuICAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XHJcbiAgIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uc1xyXG4gICBhcmUgbWV0OlxyXG4gXHJcbiAgICAgMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcclxuICAgICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXHJcbiBcclxuICAgICAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxyXG4gICAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcclxuICAgICAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxyXG4gXHJcbiAgICAgMy4gVGhlIG5hbWVzIG9mIGl0cyBjb250cmlidXRvcnMgbWF5IG5vdCBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBcclxuICAgICAgICBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZSB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gXHJcbiAgICAgICAgcGVybWlzc2lvbi5cclxuIFxyXG4gICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTXHJcbiAgIFwiQVMgSVNcIiBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1RcclxuICAgTElNSVRFRCBUTywgVEhFIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SXHJcbiAgIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELiAgSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBPV05FUiBPUlxyXG4gICBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCxcclxuICAgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLFxyXG4gICBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1JcclxuICAgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRlxyXG4gICBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElOR1xyXG4gICBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVNcclxuICAgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXHJcbiBcclxuIFxyXG4gICBBbnkgZmVlZGJhY2sgaXMgdmVyeSB3ZWxjb21lLlxyXG4gICBodHRwOi8vd3d3Lm1hdGguc2NpLmhpcm9zaGltYS11LmFjLmpwL35tLW1hdC9NVC9lbXQuaHRtbFxyXG4gICBlbWFpbDogbS1tYXQgQCBtYXRoLnNjaS5oaXJvc2hpbWEtdS5hYy5qcCAocmVtb3ZlIHNwYWNlKVxyXG4qL1xyXG5cclxudmFyIE1lcnNlbm5lVHdpc3RlciA9IGZ1bmN0aW9uKHNlZWQpIHtcclxuICBpZiAoc2VlZCA9PSB1bmRlZmluZWQpIHtcclxuICAgIHNlZWQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICB9IFxyXG4gIC8qIFBlcmlvZCBwYXJhbWV0ZXJzICovICBcclxuICB0aGlzLk4gPSA2MjQ7XHJcbiAgdGhpcy5NID0gMzk3O1xyXG4gIHRoaXMuTUFUUklYX0EgPSAweDk5MDhiMGRmOyAgIC8qIGNvbnN0YW50IHZlY3RvciBhICovXHJcbiAgdGhpcy5VUFBFUl9NQVNLID0gMHg4MDAwMDAwMDsgLyogbW9zdCBzaWduaWZpY2FudCB3LXIgYml0cyAqL1xyXG4gIHRoaXMuTE9XRVJfTUFTSyA9IDB4N2ZmZmZmZmY7IC8qIGxlYXN0IHNpZ25pZmljYW50IHIgYml0cyAqL1xyXG4gXHJcbiAgdGhpcy5tdCA9IG5ldyBBcnJheSh0aGlzLk4pOyAvKiB0aGUgYXJyYXkgZm9yIHRoZSBzdGF0ZSB2ZWN0b3IgKi9cclxuICB0aGlzLm10aT10aGlzLk4rMTsgLyogbXRpPT1OKzEgbWVhbnMgbXRbTl0gaXMgbm90IGluaXRpYWxpemVkICovXHJcblxyXG4gIHRoaXMuaW5pdF9nZW5yYW5kKHNlZWQpO1xyXG59ICBcclxuIFxyXG4vKiBpbml0aWFsaXplcyBtdFtOXSB3aXRoIGEgc2VlZCAqL1xyXG5NZXJzZW5uZVR3aXN0ZXIucHJvdG90eXBlLmluaXRfZ2VucmFuZCA9IGZ1bmN0aW9uKHMpIHtcclxuICB0aGlzLm10WzBdID0gcyA+Pj4gMDtcclxuICBmb3IgKHRoaXMubXRpPTE7IHRoaXMubXRpPHRoaXMuTjsgdGhpcy5tdGkrKykge1xyXG4gICAgICB2YXIgcyA9IHRoaXMubXRbdGhpcy5tdGktMV0gXiAodGhpcy5tdFt0aGlzLm10aS0xXSA+Pj4gMzApO1xyXG4gICB0aGlzLm10W3RoaXMubXRpXSA9ICgoKCgocyAmIDB4ZmZmZjAwMDApID4+PiAxNikgKiAxODEyNDMzMjUzKSA8PCAxNikgKyAocyAmIDB4MDAwMGZmZmYpICogMTgxMjQzMzI1MylcclxuICArIHRoaXMubXRpO1xyXG4gICAgICAvKiBTZWUgS251dGggVEFPQ1AgVm9sMi4gM3JkIEVkLiBQLjEwNiBmb3IgbXVsdGlwbGllci4gKi9cclxuICAgICAgLyogSW4gdGhlIHByZXZpb3VzIHZlcnNpb25zLCBNU0JzIG9mIHRoZSBzZWVkIGFmZmVjdCAgICovXHJcbiAgICAgIC8qIG9ubHkgTVNCcyBvZiB0aGUgYXJyYXkgbXRbXS4gICAgICAgICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAvKiAyMDAyLzAxLzA5IG1vZGlmaWVkIGJ5IE1ha290byBNYXRzdW1vdG8gICAgICAgICAgICAgKi9cclxuICAgICAgdGhpcy5tdFt0aGlzLm10aV0gPj4+PSAwO1xyXG4gICAgICAvKiBmb3IgPjMyIGJpdCBtYWNoaW5lcyAqL1xyXG4gIH1cclxufVxyXG4gXHJcbi8qIGluaXRpYWxpemUgYnkgYW4gYXJyYXkgd2l0aCBhcnJheS1sZW5ndGggKi9cclxuLyogaW5pdF9rZXkgaXMgdGhlIGFycmF5IGZvciBpbml0aWFsaXppbmcga2V5cyAqL1xyXG4vKiBrZXlfbGVuZ3RoIGlzIGl0cyBsZW5ndGggKi9cclxuLyogc2xpZ2h0IGNoYW5nZSBmb3IgQysrLCAyMDA0LzIvMjYgKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5pbml0X2J5X2FycmF5ID0gZnVuY3Rpb24oaW5pdF9rZXksIGtleV9sZW5ndGgpIHtcclxuICB2YXIgaSwgaiwgaztcclxuICB0aGlzLmluaXRfZ2VucmFuZCgxOTY1MDIxOCk7XHJcbiAgaT0xOyBqPTA7XHJcbiAgayA9ICh0aGlzLk4+a2V5X2xlbmd0aCA/IHRoaXMuTiA6IGtleV9sZW5ndGgpO1xyXG4gIGZvciAoOyBrOyBrLS0pIHtcclxuICAgIHZhciBzID0gdGhpcy5tdFtpLTFdIF4gKHRoaXMubXRbaS0xXSA+Pj4gMzApXHJcbiAgICB0aGlzLm10W2ldID0gKHRoaXMubXRbaV0gXiAoKCgoKHMgJiAweGZmZmYwMDAwKSA+Pj4gMTYpICogMTY2NDUyNSkgPDwgMTYpICsgKChzICYgMHgwMDAwZmZmZikgKiAxNjY0NTI1KSkpXHJcbiAgICAgICsgaW5pdF9rZXlbal0gKyBqOyAvKiBub24gbGluZWFyICovXHJcbiAgICB0aGlzLm10W2ldID4+Pj0gMDsgLyogZm9yIFdPUkRTSVpFID4gMzIgbWFjaGluZXMgKi9cclxuICAgIGkrKzsgaisrO1xyXG4gICAgaWYgKGk+PXRoaXMuTikgeyB0aGlzLm10WzBdID0gdGhpcy5tdFt0aGlzLk4tMV07IGk9MTsgfVxyXG4gICAgaWYgKGo+PWtleV9sZW5ndGgpIGo9MDtcclxuICB9XHJcbiAgZm9yIChrPXRoaXMuTi0xOyBrOyBrLS0pIHtcclxuICAgIHZhciBzID0gdGhpcy5tdFtpLTFdIF4gKHRoaXMubXRbaS0xXSA+Pj4gMzApO1xyXG4gICAgdGhpcy5tdFtpXSA9ICh0aGlzLm10W2ldIF4gKCgoKChzICYgMHhmZmZmMDAwMCkgPj4+IDE2KSAqIDE1NjYwODM5NDEpIDw8IDE2KSArIChzICYgMHgwMDAwZmZmZikgKiAxNTY2MDgzOTQxKSlcclxuICAgICAgLSBpOyAvKiBub24gbGluZWFyICovXHJcbiAgICB0aGlzLm10W2ldID4+Pj0gMDsgLyogZm9yIFdPUkRTSVpFID4gMzIgbWFjaGluZXMgKi9cclxuICAgIGkrKztcclxuICAgIGlmIChpPj10aGlzLk4pIHsgdGhpcy5tdFswXSA9IHRoaXMubXRbdGhpcy5OLTFdOyBpPTE7IH1cclxuICB9XHJcblxyXG4gIHRoaXMubXRbMF0gPSAweDgwMDAwMDAwOyAvKiBNU0IgaXMgMTsgYXNzdXJpbmcgbm9uLXplcm8gaW5pdGlhbCBhcnJheSAqLyBcclxufVxyXG4gXHJcbi8qIGdlbmVyYXRlcyBhIHJhbmRvbSBudW1iZXIgb24gWzAsMHhmZmZmZmZmZl0taW50ZXJ2YWwgKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5nZW5yYW5kX2ludDMyID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHk7XHJcbiAgdmFyIG1hZzAxID0gbmV3IEFycmF5KDB4MCwgdGhpcy5NQVRSSVhfQSk7XHJcbiAgLyogbWFnMDFbeF0gPSB4ICogTUFUUklYX0EgIGZvciB4PTAsMSAqL1xyXG5cclxuICBpZiAodGhpcy5tdGkgPj0gdGhpcy5OKSB7IC8qIGdlbmVyYXRlIE4gd29yZHMgYXQgb25lIHRpbWUgKi9cclxuICAgIHZhciBraztcclxuXHJcbiAgICBpZiAodGhpcy5tdGkgPT0gdGhpcy5OKzEpICAgLyogaWYgaW5pdF9nZW5yYW5kKCkgaGFzIG5vdCBiZWVuIGNhbGxlZCwgKi9cclxuICAgICAgdGhpcy5pbml0X2dlbnJhbmQoNTQ4OSk7IC8qIGEgZGVmYXVsdCBpbml0aWFsIHNlZWQgaXMgdXNlZCAqL1xyXG5cclxuICAgIGZvciAoa2s9MDtrazx0aGlzLk4tdGhpcy5NO2trKyspIHtcclxuICAgICAgeSA9ICh0aGlzLm10W2trXSZ0aGlzLlVQUEVSX01BU0spfCh0aGlzLm10W2trKzFdJnRoaXMuTE9XRVJfTUFTSyk7XHJcbiAgICAgIHRoaXMubXRba2tdID0gdGhpcy5tdFtrayt0aGlzLk1dIF4gKHkgPj4+IDEpIF4gbWFnMDFbeSAmIDB4MV07XHJcbiAgICB9XHJcbiAgICBmb3IgKDtrazx0aGlzLk4tMTtraysrKSB7XHJcbiAgICAgIHkgPSAodGhpcy5tdFtra10mdGhpcy5VUFBFUl9NQVNLKXwodGhpcy5tdFtraysxXSZ0aGlzLkxPV0VSX01BU0spO1xyXG4gICAgICB0aGlzLm10W2trXSA9IHRoaXMubXRba2srKHRoaXMuTS10aGlzLk4pXSBeICh5ID4+PiAxKSBeIG1hZzAxW3kgJiAweDFdO1xyXG4gICAgfVxyXG4gICAgeSA9ICh0aGlzLm10W3RoaXMuTi0xXSZ0aGlzLlVQUEVSX01BU0spfCh0aGlzLm10WzBdJnRoaXMuTE9XRVJfTUFTSyk7XHJcbiAgICB0aGlzLm10W3RoaXMuTi0xXSA9IHRoaXMubXRbdGhpcy5NLTFdIF4gKHkgPj4+IDEpIF4gbWFnMDFbeSAmIDB4MV07XHJcblxyXG4gICAgdGhpcy5tdGkgPSAwO1xyXG4gIH1cclxuXHJcbiAgeSA9IHRoaXMubXRbdGhpcy5tdGkrK107XHJcblxyXG4gIC8qIFRlbXBlcmluZyAqL1xyXG4gIHkgXj0gKHkgPj4+IDExKTtcclxuICB5IF49ICh5IDw8IDcpICYgMHg5ZDJjNTY4MDtcclxuICB5IF49ICh5IDw8IDE1KSAmIDB4ZWZjNjAwMDA7XHJcbiAgeSBePSAoeSA+Pj4gMTgpO1xyXG5cclxuICByZXR1cm4geSA+Pj4gMDtcclxufVxyXG4gXHJcbi8qIGdlbmVyYXRlcyBhIHJhbmRvbSBudW1iZXIgb24gWzAsMHg3ZmZmZmZmZl0taW50ZXJ2YWwgKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5nZW5yYW5kX2ludDMxID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuICh0aGlzLmdlbnJhbmRfaW50MzIoKT4+PjEpO1xyXG59XHJcbiBcclxuLyogZ2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBvbiBbMCwxXS1yZWFsLWludGVydmFsICovXHJcbk1lcnNlbm5lVHdpc3Rlci5wcm90b3R5cGUuZ2VucmFuZF9yZWFsMSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmdlbnJhbmRfaW50MzIoKSooMS4wLzQyOTQ5NjcyOTUuMCk7IFxyXG4gIC8qIGRpdmlkZWQgYnkgMl4zMi0xICovIFxyXG59XHJcblxyXG4vKiBnZW5lcmF0ZXMgYSByYW5kb20gbnVtYmVyIG9uIFswLDEpLXJlYWwtaW50ZXJ2YWwgKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5yYW5kb20gPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5nZW5yYW5kX2ludDMyKCkqKDEuMC80Mjk0OTY3Mjk2LjApOyBcclxuICAvKiBkaXZpZGVkIGJ5IDJeMzIgKi9cclxufVxyXG4gXHJcbi8qIGdlbmVyYXRlcyBhIHJhbmRvbSBudW1iZXIgb24gKDAsMSktcmVhbC1pbnRlcnZhbCAqL1xyXG5NZXJzZW5uZVR3aXN0ZXIucHJvdG90eXBlLmdlbnJhbmRfcmVhbDMgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gKHRoaXMuZ2VucmFuZF9pbnQzMigpICsgMC41KSooMS4wLzQyOTQ5NjcyOTYuMCk7IFxyXG4gIC8qIGRpdmlkZWQgYnkgMl4zMiAqL1xyXG59XHJcbiBcclxuLyogZ2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBvbiBbMCwxKSB3aXRoIDUzLWJpdCByZXNvbHV0aW9uKi9cclxuTWVyc2VubmVUd2lzdGVyLnByb3RvdHlwZS5nZW5yYW5kX3JlczUzID0gZnVuY3Rpb24oKSB7IFxyXG4gIHZhciBhPXRoaXMuZ2VucmFuZF9pbnQzMigpPj4+NSwgYj10aGlzLmdlbnJhbmRfaW50MzIoKT4+PjY7IFxyXG4gIHJldHVybihhKjY3MTA4ODY0LjArYikqKDEuMC85MDA3MTk5MjU0NzQwOTkyLjApOyBcclxufSBcclxuXHJcbi8qIFRoZXNlIHJlYWwgdmVyc2lvbnMgYXJlIGR1ZSB0byBJc2FrdSBXYWRhLCAyMDAyLzAxLzA5IGFkZGVkICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lcnNlbm5lVHdpc3RlcjsiLCJpbXBvcnQgeyBpbmplY3QsIGJpbmQsIGdldEluc3RhbmNlT2YgfSBmcm9tICdkcnktZGknO1xyXG5pbXBvcnQgU3RyTGRyIGZyb20gJy4vc3RybGRyLmpzJztcclxuaW1wb3J0IElTdG9yZSBmcm9tICcuLi9zdG9yZS9JU3RvcmUuanMnO1xyXG5pbXBvcnQgRE9NIGZyb20gXCIuL2RyeS1kb20uanNcIjtcclxuaW1wb3J0IFBvb2wgZnJvbSAnLi9wb29sLmpzJztcclxuXHJcblxyXG5mdW5jdGlvbiByZWFkKCBzdHIsIGN0eCApe1xyXG5cclxuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdChcIi5cIiksIGk9MDtcclxuXHJcbiAgICB3aGlsZSggaTxwYXJ0cy5sZW5ndGggJiYgY3R4IClcclxuICAgICAgICBjdHggPSBjdHhbIHBhcnRzW2krK10gXTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGN0eDtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRNZXRob2QoIHN0ciwgY3R4LCAuLi5hcmdzICl7XHJcblxyXG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KFwiLlwiKSwgaT0wO1xyXG5cclxuICAgIHZhciBwY3R4ID0gY3R4O1xyXG5cclxuICAgIHdoaWxlKCBpPHBhcnRzLmxlbmd0aCAmJiBjdHggKXtcclxuICAgICAgICBwY3R4ID0gY3R4O1xyXG4gICAgICAgIGN0eCA9IGN0eFsgcGFydHNbaSsrXSBdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCBjdHggJiYgdHlwZW9mIGN0eCA9PT0gXCJmdW5jdGlvblwiIClcclxuICAgICAgICByZXR1cm4gY3R4LmJpbmQoIHBjdHgsIC4uLmFyZ3MgKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIG51bGw7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZSggc3RyLCB2YWx1ZSwgY3R4ICl7XHJcblxyXG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KFwiLlwiKSwgaT0wO1xyXG5cclxuICAgIHdoaWxlKHBhcnRzLmxlbmd0aC0xICYmIGN0eCl7XHJcbiAgICAgICAgaWYoICEocGFydHNbaV0gaW4gY3R4KSApXHJcbiAgICAgICAgICAgIGN0eFtwYXJ0c1tpXV0gPSB7fTtcclxuICAgICAgICBjdHggPSBjdHhbIHBhcnRzW2krK10gXTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYoIGN0eCApXHJcbiAgICAgICAgY3R4WyBwYXJ0c1tpXSBdID0gdmFsdWU7XHJcbiAgICBcclxuICAgIHJldHVybiAhIWN0eDtcclxuICAgIFxyXG59XHJcblxyXG5jb25zdCBwZW5kaW5nID0gW107XHJcbmxldCBuZXh0TW9kZWxJZCA9IDA7XHJcblxyXG5jbGFzcyBNb2RlbCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgbGlzdGVuZXJzID0ge307XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcclxuICAgICAgICB2YXIgY2hpbGRyZW4gPSB7fTtcclxuICAgICAgICB2YXIgcmV2Q2hpbGRyZW4gPSB7fTtcclxuICAgICAgICB2YXIgcGFyZW50cyA9IHt9O1xyXG5cclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIGRhdGEsIFwiX19tb2RlbF9fXCIsIHsgdmFsdWU6dGhpcywgd3JpdGFibGU6IGZhbHNlLCBlbnVtZXJhYmxlOiBmYWxzZSB9KTtcclxuICAgICAgICBcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyggdGhpcywge1xyXG4gICAgICAgICAgICByb290OnsgdmFsdWU6dGhpcywgZW51bWVyYWJsZTpmYWxzZSwgd3JpdGFibGU6dHJ1ZSB9LFxyXG4gICAgICAgICAgICBsaXN0ZW5lcnM6eyB2YWx1ZTpsaXN0ZW5lcnMsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UgfSxcclxuICAgICAgICAgICAgZGF0YTp7IHZhbHVlOmRhdGEsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICBjaGlsZHJlbjp7IHZhbHVlOmNoaWxkcmVuLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IGZhbHNlIH0sXHJcbiAgICAgICAgICAgIHJldkNoaWxkcmVuOnsgdmFsdWU6cmV2Q2hpbGRyZW4sIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UgfSxcclxuICAgICAgICAgICAgcGFyZW50czp7IHZhbHVlOnBhcmVudHMsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UgfSxcclxuICAgICAgICAgICAgaWQ6eyB2YWx1ZTogKytuZXh0TW9kZWxJZCwgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZSB9LFxyXG4gICAgICAgICAgICBkaXJ0eTp7XHJcbiAgICAgICAgICAgICAgICBnZXQ6KCkgPT4gdGhpcy5yb290Ll9fZGlydHksXHJcbiAgICAgICAgICAgICAgICBzZXQ6KCB2ICkgPT4gdGhpcy5yb290Ll9fZGlydHkgPSB2XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RvcmUoIGJpbmFyeT10cnVlICl7XHJcbiAgICAgICAgcmV0dXJuIFN0ckxkci5zdG9yZSggdGhpcy5kYXRhLCBiaW5hcnkgKTtcclxuICAgIH1cclxuXHJcbiAgICBsb2FkKCBkYXRhLCBkb1JhaXNlID0gdHJ1ZSApe1xyXG5cclxuICAgICAgICBpZiggdHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgKXtcclxuICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0gU3RyTGRyLmxvYWQoZGF0YSk7XHJcbiAgICAgICAgICAgIH1jYXRjaChleCl7fVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIGRhdGEgJiYgZGF0YS5idWZmZXIgJiYgZGF0YS5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciApe1xyXG4gICAgICAgICAgICBpZiggIShkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkgKVxyXG4gICAgICAgICAgICAgICAgZGF0YSA9IG5ldyBVaW50OEFycmF5KGRhdGEuYnVmZmVyKTtcclxuICAgICAgICAgICAgZGF0YSA9IFN0ckxkci5sb2FkKCBkYXRhLCB0cnVlICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IoIHZhciBrIGluIGRhdGEgKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRJdGVtKCBrLCBkYXRhW2tdLCBkb1JhaXNlICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0SXRlbSggaywgdiwgZG9SYWlzZSA9IHRydWUgKXtcclxuXHJcbiAgICAgICAgaWYoIGsuY2hhckNvZGVBdCApIGsgPSBrLnNwbGl0KFwiLlwiKTtcclxuICAgICAgICB2YXIgcHJvcCA9IGsuc2hpZnQoKSwgY2hpbGQ7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLmRhdGEsIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbiwgcmV2Q2hpbGRyZW4gPSB0aGlzLnJldkNoaWxkcmVuO1xyXG5cclxuICAgICAgICBpZiggay5sZW5ndGggKXtcclxuXHJcbiAgICAgICAgICAgIGNoaWxkID0gY2hpbGRyZW5bcHJvcF07XHJcbiAgICAgICAgICAgIGlmKCAhY2hpbGQgKXtcclxuICAgICAgICAgICAgICAgIGNoaWxkID0gY2hpbGRyZW5bcHJvcF0gPSBuZXcgTW9kZWwoKTtcclxuICAgICAgICAgICAgICAgIGNoaWxkLnJvb3QgPSB0aGlzLnJvb3Q7XHJcbiAgICAgICAgICAgICAgICBjaGlsZC5wYXJlbnRzWyB0aGlzLmlkIF0gPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgZGF0YVtwcm9wXSA9IGNoaWxkLmRhdGE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldkNoaWxkcmVuWyBjaGlsZC5pZCBdID0gW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yYWlzZSggcHJvcCwgZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuW3Byb3BdLnNldEl0ZW0oIGssIHYsIGRvUmFpc2UgKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiggY2hpbGRyZW5bcHJvcF0gKXtcclxuXHJcbiAgICAgICAgICAgIGlmKCBjaGlsZHJlbltwcm9wXS5kYXRhICE9PSB2IClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGNoaWxkID0gY2hpbGRyZW5bcHJvcF07XHJcblxyXG4gICAgICAgICAgICBsZXQgaW5kZXggPSByZXZDaGlsZHJlblsgY2hpbGQuaWQgXS5pbmRleE9mKHByb3ApO1xyXG4gICAgICAgICAgICBpZiggaW5kZXggPT09IC0xIClcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludGVncml0eSBjb21wcm9taXNlZFwiKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldkNoaWxkcmVuWyBjaGlsZC5pZCBdLnNwbGljZSggaW5kZXgsIDEgKTtcclxuXHJcbiAgICAgICAgICAgIGRlbGV0ZSBjaGlsZC5wYXJlbnRzWyB0aGlzLmlkIF07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIHYgJiYgdHlwZW9mIHYgPT0gXCJvYmplY3RcIiApe1xyXG5cclxuICAgICAgICAgICAgdmFyIGRvTG9hZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiggIXYuX19tb2RlbF9fICl7XHJcbiAgICAgICAgICAgICAgICBjaGlsZCA9IG5ldyBNb2RlbCgpO1xyXG4gICAgICAgICAgICAgICAgY2hpbGQucm9vdCA9IHRoaXMucm9vdDtcclxuICAgICAgICAgICAgICAgIGRvTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgY2hpbGQgPSB2Ll9fbW9kZWxfXztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYoICFyZXZDaGlsZHJlblsgY2hpbGQuaWQgXSApIHJldkNoaWxkcmVuWyBjaGlsZC5pZCBdID0gWyBwcm9wIF07XHJcbiAgICAgICAgICAgIGVsc2UgcmV2Q2hpbGRyZW5bIGNoaWxkLmlkIF0ucHVzaCggcHJvcCApO1xyXG4gICAgICAgICAgICBjaGlsZHJlblsgcHJvcCBdID0gY2hpbGQ7XHJcbiAgICAgICAgICAgIGNoaWxkLnBhcmVudHNbIHRoaXMuaWQgXSA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICBpZiggZG9Mb2FkICl7XHJcbiAgICAgICAgICAgICAgICBjaGlsZC5sb2FkKCB2LCBmYWxzZSApO1xyXG4gICAgICAgICAgICAgICAgY2hpbGQuZGF0YSA9IHY7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHYsIFwiX19tb2RlbF9fXCIsIHsgdmFsdWU6Y2hpbGQsIHdyaXRhYmxlOiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGF0YVsgcHJvcCBdID0gdjtcclxuXHJcbiAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5yYWlzZSggcHJvcCwgZG9SYWlzZSApO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TW9kZWwoIGssIGNyZWF0ZSApe1xyXG5cclxuICAgICAgICBpZiggay5jaGFyQ29kZUF0IClcclxuICAgICAgICAgICAgayA9IGsuc3BsaXQoXCIuXCIpO1xyXG5cclxuICAgICAgICB2YXIgY3R4ID0gdGhpcywgaSA9IDA7XHJcbiAgICAgICAgaWYoIGNyZWF0ZSApe1xyXG4gICAgICAgICAgICB3aGlsZSggY3R4ICYmIGk8ay5sZW5ndGggKXtcclxuICAgICAgICAgICAgICAgIGlmKCAhY3R4LmNoaWxkcmVuW2tbaV1dIClcclxuICAgICAgICAgICAgICAgICAgICBjdHguc2V0SXRlbShrW2ldLCB7fSk7XHJcbiAgICAgICAgICAgICAgICBjdHggPSBjdHguY2hpbGRyZW5bIGtbaSsrXSBdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHdoaWxlKCBjdHggJiYgaTxrLmxlbmd0aCApXHJcbiAgICAgICAgICAgICAgICBjdHggPSBjdHguY2hpbGRyZW5bIGtbaSsrXSBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGN0eDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0SXRlbSggaywgZGVmYXVsdFZhbHVlICl7XHJcbiAgICAgICAgdmFyIHYgPSByZWFkKCBrLCB0aGlzLmRhdGEgKTtcclxuICAgICAgICBpZiggdiA9PT0gdW5kZWZpbmVkICkgdiA9IGRlZmF1bHRWYWx1ZTtcclxuICAgICAgICByZXR1cm4gdjtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVJdGVtKGssIGNiKXtcclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IGsuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIHZhciBrZXkgPSBwYXJlbnQucG9wKCk7XHJcblxyXG4gICAgICAgIHZhciBtb2RlbCA9IHRoaXMuZ2V0TW9kZWwoIHBhcmVudCApO1xyXG4gICAgICAgIHZhciBkYXRhID0gbW9kZWwuZGF0YSwgY2hpbGRyZW4gPSBtb2RlbC5jaGlsZHJlbjtcclxuXHJcbiAgICAgICAgaWYoICEoa2V5IGluIGRhdGEpICkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiggY2hpbGRyZW5ba2V5XSApe1xyXG5cclxuICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5ba2V5XSwgXHJcbiAgICAgICAgICAgICAgICByZXZDaGlsZHJlbiA9IG1vZGVsLnJldkNoaWxkcmVuW2NoaWxkLmlkXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHJldkNoaWxkcmVuLmluZGV4T2YoIGtleSApO1xyXG4gICAgICAgICAgICBpZiggaW5kZXggPT0gLTEgKSB0aHJvdyBcIkludGVncml0eSBjb21wcm9taXNlZFwiO1xyXG5cclxuICAgICAgICAgICAgcmV2Q2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCByZXZDaGlsZHJlbi5sZW5ndGggPT0gMCApe1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNoaWxkLnBhcmVudHNbIG1vZGVsLmlkIF07XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgbW9kZWwucmV2Q2hpbGRyZW5bY2hpbGQuaWRdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkZWxldGUgY2hpbGRyZW5ba2V5XTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkZWxldGUgZGF0YVtrZXldO1xyXG5cclxuICAgICAgICBtb2RlbC5yYWlzZSgga2V5LCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmFpc2UoaywgZG9SYWlzZSl7XHJcblxyXG4gICAgICAgIHBlbmRpbmdbcGVuZGluZy5sZW5ndGgrK10gPSB7bW9kZWw6dGhpcywga2V5Omt9O1xyXG5cclxuICAgICAgICBpZiggIWRvUmFpc2UgKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGZvciggdmFyIGkgPSAwLCBsPXBlbmRpbmcubGVuZ3RoOyBpPGw7ICsraSApe1xyXG5cclxuICAgICAgICAgICAgayA9IHBlbmRpbmdbaV0ua2V5O1xyXG4gICAgICAgICAgICB2YXIgbW9kZWwgPSBwZW5kaW5nW2ldLm1vZGVsO1xyXG5cclxuICAgICAgICAgICAgaWYoIGsgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBkaXNwYXRjaCggbW9kZWwubGlzdGVuZXJzW2tdLCBtb2RlbC5kYXRhW2tdLCBrICk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciggdmFyIHBpZCBpbiBtb2RlbC5wYXJlbnRzICl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBtb2RlbC5wYXJlbnRzWyBwaWQgXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmV2Q2hpbGRyZW4gPSBwYXJlbnQucmV2Q2hpbGRyZW5bIG1vZGVsLmlkIF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoICFyZXZDaGlsZHJlbiApIHRocm93IFwiSW50ZWdyaXR5IGNvbXByb21pc2VkXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciggdmFyIGogPSAwLCByY2wgPSByZXZDaGlsZHJlbi5sZW5ndGg7IGo8cmNsOyArK2ogKXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKCBwYXJlbnQubGlzdGVuZXJzWyByZXZDaGlsZHJlbltqXSBdLCBwYXJlbnQuZGF0YSwgcmV2Q2hpbGRyZW5bal0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBlbmRpbmcubGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZGlzcGF0Y2goIGxpc3RlbmVycywgdmFsdWUsIGtleSApe1xyXG5cclxuICAgICAgICAgICAgaWYoICFsaXN0ZW5lcnMgKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgZm9yKCB2YXIgaT0wLCBsPWxpc3RlbmVycy5sZW5ndGg7IGk8bDsgKytpIClcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tpXSggdmFsdWUsIGtleSApO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBhdHRhY2goIGs6U3RyaW5nLCBjYjpGdW5jdGlvbiApXHJcbiAgICAvLyBsaXN0ZW4gdG8gbm90aWZpY2F0aW9ucyBmcm9tIGEgcGFydGljdWxhciBrZXlcclxuICAgIC8vIGF0dGFjaCggY2I6RnVuY3Rpb24gKVxyXG4gICAgLy8gbGlzdGVuIHRvIGtleSBhZGRpdGlvbnMvcmVtb3ZhbHNcclxuICAgIGF0dGFjaChrLCBjYil7XHJcbiAgICAgICAgdmFyIGtleSA9IGsuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIHZhciBtb2RlbDtcclxuICAgICAgICBpZigga2V5Lmxlbmd0aCA9PSAxICl7XHJcbiAgICAgICAgICAgIGtleSA9IGs7XHJcbiAgICAgICAgICAgIG1vZGVsID0gdGhpcztcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgayA9IGtleS5wb3AoKTtcclxuICAgICAgICAgICAgbW9kZWwgPSB0aGlzLmdldE1vZGVsKCBrZXksIHRydWUgKTtcclxuICAgICAgICAgICAga2V5ID0gaztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoICFtb2RlbC5saXN0ZW5lcnNba2V5XSApXHJcbiAgICAgICAgICAgIG1vZGVsLmxpc3RlbmVyc1trZXldID0gWyBjYiBdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgbW9kZWwubGlzdGVuZXJzW2tleV0ucHVzaChjYik7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIHN0b3AgbGlzdGVuaW5nXHJcbiAgICBkZXRhY2goaywgY2Ipe1xyXG5cclxuICAgICAgICB2YXIgaW5kZXgsIGxpc3RlbmVycztcclxuXHJcbiAgICAgICAgaWYoIHR5cGVvZiBrID09IFwiZnVuY3Rpb25cIiApe1xyXG4gICAgICAgICAgICBjYiA9IGs7XHJcbiAgICAgICAgICAgIGsgPSBcIlwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnNba107XHJcbiAgICAgICAgaWYoICFsaXN0ZW5lcnNba10gKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2IpO1xyXG4gICAgICAgIGlmKCBpbmRleCA9PSAtMSApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBcclxuICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKCBpbmRleCwgMSApO1xyXG5cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmNvbnN0IGNhY2hlID0ge307XHJcblxyXG5jbGFzcyBJVmlldyB7XHJcblxyXG4gICAgc3RhdGljIFwiQGluamVjdFwiID0ge1xyXG4gICAgICAgIHBhcmVudEVsZW1lbnQ6XCJQYXJlbnRFbGVtZW50XCIsXHJcbiAgICAgICAgbW9kZWw6W01vZGVsLHtzY29wZToncm9vdCd9XVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCBjb250cm9sbGVyICl7XHJcblxyXG4gICAgICAgIHZhciBsYXlvdXQgPSBcImxheW91dHMvXCIgKyBjb250cm9sbGVyLmNvbnN0cnVjdG9yLm5hbWUgKyBcIi5odG1sXCI7XHJcbiAgICAgICAgdGhpcy5jb250cm9sbGVyID0gY29udHJvbGxlcjtcclxuICAgICAgICB0aGlzLmRvbSA9IG51bGw7XHJcblxyXG4gICAgICAgIGlmKCAhY2FjaGVbbGF5b3V0XSApe1xyXG5cclxuICAgICAgICAgICAgZmV0Y2goIGxheW91dCApXHJcbiAgICAgICAgICAgIC50aGVuKCAocnNwKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoICFyc3Aub2sgJiYgcnNwLnN0YXR1cyAhPT0gMCApIHRocm93IG5ldyBFcnJvcihcIk5vdCBPSyFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcnNwLnRleHQoKTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKCB0ZXh0ID0+IChuZXcgd2luZG93LkRPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcodGV4dCwgXCJ0ZXh0L2h0bWxcIikpXHJcbiAgICAgICAgICAgIC50aGVuKChodG1sKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZVsgbGF5b3V0IF0gPSBodG1sO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkTGF5b3V0KCBodG1sICk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKCAoZXgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQuaW5uZXJIVE1MID0gYDxkaXY+YCArIChleC5tZXNzYWdlIHx8IGV4KSArIGA6ICR7bGF5b3V0fSE8L2Rpdj5gO1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH1lbHNlIFxyXG4gICAgICAgICAgICB0aGlzLmxvYWRMYXlvdXQoIGNhY2hlW2xheW91dF0gKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbG9hZExheW91dCggZG9jICl7XHJcbiAgICAgICAgZG9jID0gZG9jLmNsb25lTm9kZSh0cnVlKTtcclxuICAgICAgICBbLi4uZG9jLmJvZHkuY2hpbGRyZW5dLmZvckVhY2goIGNoaWxkID0+IHRoaXMucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZChjaGlsZCkgKTtcclxuXHJcbiAgICAgICAgdmFyIGRvbSA9IG5ldyBET00oIHRoaXMucGFyZW50RWxlbWVudCApO1xyXG4gICAgICAgIHRoaXMuZG9tID0gZG9tO1xyXG5cclxuICAgICAgICBwcmVwYXJlRE9NKCBkb20sIHRoaXMuY29udHJvbGxlciwgdGhpcy5tb2RlbCApO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZURPTSggZG9tLCBjb250cm9sbGVyLCBfbW9kZWwgKXtcclxuXHJcbiAgICBkb20uZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xyXG5cclxuICAgICAgICBpZiggZWxlbWVudC5kYXRhc2V0LnNyYyAmJiAhZWxlbWVudC5kYXRhc2V0LmluamVjdCApe1xyXG4gICAgICAgICAgICBzd2l0Y2goIGVsZW1lbnQudGFnTmFtZSApe1xyXG4gICAgICAgICAgICBjYXNlICdVTCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ09MJzpcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IGVsZW1lbnQuY2xvbmVOb2RlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgX21vZGVsLmF0dGFjaCggZWxlbWVudC5kYXRhc2V0LnNyYywgcmVuZGVyTGlzdC5iaW5kKCBlbGVtZW50LCB0ZW1wbGF0ZSApICk7XHJcbiAgICAgICAgICAgICAgICByZW5kZXJMaXN0KCBlbGVtZW50LCB0ZW1wbGF0ZSwgX21vZGVsLmdldEl0ZW0oIGVsZW1lbnQuZGF0YXNldC5zcmMgKSApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yKCB2YXIgaT0wOyBpPGVsZW1lbnQuYXR0cmlidXRlcy5sZW5ndGg7ICsraSApe1xyXG4gICAgICAgICAgICB2YXIga2V5ID0gZWxlbWVudC5hdHRyaWJ1dGVzW2ldLm5hbWU7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVsZW1lbnQuYXR0cmlidXRlc1tpXS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IGtleS5zcGxpdChcIi1cIik7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiggcGFydHMubGVuZ3RoID09IDIgKVxyXG4gICAgICAgICAgICAgICAgc3dpdGNoKCBwYXJ0c1sxXSApe1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNhbGxcIjpcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gcmVhZE1ldGhvZCggdmFsdWUsIGNvbnRyb2xsZXIsIGRvbSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCB0YXJnZXQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIHBhcnRzWzBdLCB0YXJnZXQgKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkNvdWxkIG5vdCBiaW5kIGV2ZW50IHRvIFwiICsgY29udHJvbGxlci5jb25zdHJ1Y3Rvci5uYW1lICsgXCIuXCIgKyBuYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInRvZ2dsZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2cGFydHMgPSB2YWx1ZS5tYXRjaCgvXihbXkBdKylcXEAoW149XSspXFw9KC4rKSQvKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiggdnBhcnRzIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmluZFRvZ2dsZSggZWxlbWVudCwgcGFydHNbMF0sIHZwYXJ0cyApO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQ291bGQgbm90IHBhcnNlIHRvZ2dsZTogXCIgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG1lbW8gPSB7IF9fc3JjOnZhbHVlLCBfX2huZDowIH07XHJcbiAgICAgICAgICAgIHZhbHVlLnJlcGxhY2UoL1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLCBiaW5kQXR0cmlidXRlLmJpbmQoIG51bGwsIGVsZW1lbnQuYXR0cmlidXRlc1tpXSwgbWVtbyApKTtcclxuICAgICAgICAgICAgdXBkYXRlQXR0cmlidXRlKCBlbGVtZW50LmF0dHJpYnV0ZXNbaV0sIG1lbW8gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCBlbGVtZW50LmRhdGFzZXQuaW5qZWN0ICYmIGVsZW1lbnQgIT0gZG9tLmVsZW1lbnQgKXtcclxuXHJcbiAgICAgICAgICAgIGxldCBjaGlsZERvbSA9IG5ldyBET00oZWxlbWVudCk7XHJcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oIGNoaWxkRG9tLCBjaGlsZERvbS5pbmRleChcImlkXCIpICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgY3RybCA9IGdldEluc3RhbmNlT2YoIGVsZW1lbnQuZGF0YXNldC5pbmplY3QsIGNoaWxkRG9tICk7XHJcbiAgICAgICAgICAgIGRvbVtlbGVtZW50LmRhdGFzZXQuaW5qZWN0XSA9IGN0cmw7XHJcblxyXG4gICAgICAgICAgICBwcmVwYXJlRE9NKCBjaGlsZERvbSwgY3RybCApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBiaW5kVG9nZ2xlKCBlbGVtZW50LCBldmVudCwgY21kICl7XHJcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBldmVudCwgKCk9PntcclxuICAgICAgICAgICAgWy4uLmRvbS5lbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoY21kWzFdKV0uZm9yRWFjaCggdGFyZ2V0ID0+IHRhcmdldC5zZXRBdHRyaWJ1dGUoY21kWzJdLCBjbWRbM10pICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHJlbmRlckxpc3QoIGVsZW1lbnQsIHRlbXBsYXRlLCBhcnIgKXtcclxuXHJcbiAgICAgICAgd2hpbGUoIGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoIClcclxuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVDaGlsZCggZWxlbWVudC5jaGlsZHJlblswXSApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciggdmFyIGtleSBpbiBhcnIgKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBjaGlsZE1vZGVsID0gbmV3IE1vZGVsKCk7XHJcbiAgICAgICAgICAgIGNoaWxkTW9kZWwubG9hZCggX21vZGVsLmRhdGEgKTtcclxuICAgICAgICAgICAgY2hpbGRNb2RlbC5zZXRJdGVtKFwia2V5XCIsIGtleSk7XHJcbiAgICAgICAgICAgIGNoaWxkTW9kZWwuc2V0SXRlbShcInZhbHVlXCIsIGFycltrZXldKTtcclxuICAgICAgICAgICAgY2hpbGRNb2RlbC5yb290ID0gX21vZGVsLnJvb3Q7XHJcblxyXG4gICAgICAgICAgICBbLi4udGVtcGxhdGUuY2xvbmVOb2RlKHRydWUpLmNoaWxkcmVuXS5mb3JFYWNoKGNoaWxkID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBjaGlsZCApO1xyXG4gICAgICAgICAgICAgICAgcHJlcGFyZURPTSggbmV3IERPTShjaGlsZCksIGNvbnRyb2xsZXIsIGNoaWxkTW9kZWwgKTtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGJpbmRBdHRyaWJ1dGUoIGF0dHIsIG1lbW8sIG1hdGNoLCBpbm5lciApe1xyXG5cclxuICAgICAgICBpZiggaW5uZXIgaW4gbWVtbyApIHJldHVybiBcIlwiO1xyXG5cclxuICAgICAgICBfbW9kZWwuYXR0YWNoKCBpbm5lciwgKHZhbHVlKT0+e1xyXG4gICAgICAgICAgICBtZW1vW2lubmVyXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICBpZiggbWVtby5fX2huZCApIHJldHVybjtcclxuICAgICAgICAgICAgbWVtby5fX2huZCA9IHNldFRpbWVvdXQoIHVwZGF0ZUF0dHJpYnV0ZS5iaW5kKCBudWxsLCBhdHRyLCBtZW1vICksIDEgKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbWVtb1tpbm5lcl0gPSBfbW9kZWwuZ2V0SXRlbShpbm5lcik7XHJcblxyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1cGRhdGVBdHRyaWJ1dGUoIGF0dHIsIG1lbW8gKXtcclxuICAgICAgICBtZW1vLl9faG5kID0gMDtcclxuICAgICAgICBhdHRyLnZhbHVlID0gbWVtby5fX3NyYy5yZXBsYWNlKFxyXG5cdFx0L1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLFxyXG5cdCAgICAobWF0Y2gsIHBhdGgpID0+IHR5cGVvZiBtZW1vW3BhdGhdID09IFwib2JqZWN0XCIgP1xyXG5cdFx0SlNPTi5zdHJpbmdpZnkobWVtb1twYXRoXSlcclxuXHRcdDogbWVtb1twYXRoXVxyXG5cdCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG52YXIgZGVmYXVsdE1vZGVsID0gbnVsbDtcclxuXHJcbmNsYXNzIElDb250cm9sbGVyIHtcclxuXHJcbiAgICBzdGF0aWMgXCJAaW5qZWN0XCIgPSB7XHJcbiAgICAgICAgdmlld0ZhY3Rvcnk6SVZpZXcsXHJcbiAgICAgICAgcG9vbDpcInBvb2xcIixcclxuICAgICAgICBtb2RlbDpNb2RlbFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCApe1xyXG5cclxuICAgICAgICB0aGlzLnBvb2wuYWRkKHRoaXMpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBfc2hvdygpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiY3JlYXRlZCB2aWV3XCIpO1xyXG4gICAgICAgIHRoaXMucG9vbC5jYWxsKCBcInNldEFjdGl2ZVZpZXdcIiwgbnVsbCApO1x0XHJcbiAgICAgICAgdmFyIHZpZXcgPSB0aGlzLnZpZXdGYWN0b3J5KCB0aGlzICk7XHJcbiAgICAgICAgcmV0dXJuIHZpZXc7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gYm9vdCggeyBtYWluLCBlbGVtZW50LCBjb21wb25lbnRzLCBlbnRpdGllcyB9ICl7XHJcblxyXG4gICAgYmluZChQb29sKS50bygncG9vbCcpLnNpbmdsZXRvbigpO1xyXG4gICAgYmluZChNb2RlbCkudG8oTW9kZWwpLndpdGhUYWdzKHtzY29wZToncm9vdCd9KS5zaW5nbGV0b24oKTtcclxuXHJcbiAgICBmb3IoIHZhciBrIGluIGNvbXBvbmVudHMgKVxyXG4gICAgICAgIGJpbmQoIGNvbXBvbmVudHNba10gKS50byggayApO1xyXG5cclxuICAgIGZvciggdmFyIGsgaW4gZW50aXRpZXMgKXtcclxuICAgICAgICB2YXIgY3RybCA9IGVudGl0aWVzW2tdO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBcIkFkZGluZyBlbnRpdHkgXCIgKyBrLCBjdHJsICk7XHJcbiAgICAgICAgYmluZChjdHJsKS50byhJQ29udHJvbGxlcik7XHJcbiAgICAgICAgYmluZChJVmlldylcclxuICAgICAgICAgICAgLnRvKElWaWV3KVxyXG4gICAgICAgICAgICAuaW5qZWN0aW5nKFxyXG4gICAgICAgICAgICAgICAgW2RvY3VtZW50LmJvZHksICdQYXJlbnRFbGVtZW50J11cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAud2l0aFRhZ3Moe2NvbnRyb2xsZXI6Y3RybH0pXHJcbiAgICAgICAgICAgIC5mYWN0b3J5KCk7IFxyXG4gICAgfVxyXG5cclxuICAgIGJpbmQobWFpbikudG8obWFpbikuaW5qZWN0aW5nKFtuZXcgRE9NKGVsZW1lbnQpLCBET01dKTtcclxuICAgIGdldEluc3RhbmNlT2YoIG1haW4gKTtcclxuXHJcbn1cclxuXHJcblxyXG5leHBvcnQgeyBNb2RlbCwgSVZpZXcsIElDb250cm9sbGVyLCBib290IH07XHJcblxyXG4iLCJ2YXIgbmV4dFVJRCA9IDA7XHJcblxyXG5mdW5jdGlvbiBnZXRVSUQoKXtcclxuICAgIHJldHVybiArK25leHRVSUQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBvb2woKSB7XHJcbiAgICB2YXIgbWV0aG9kcyA9IHtcclxuICAgICAgICBjb25zdHJ1Y3RvcjogW11cclxuICAgIH07XHJcbiAgICB2YXIgc2lsZW5jZSA9IHtcclxuICAgICAgICBcIm9uVGlja1wiOiAxLFxyXG4gICAgICAgIFwib25Qb3N0VGlja1wiOiAxLFxyXG4gICAgICAgIFwib25SZW5kZXJcIjogMVxyXG4gICAgfTtcclxuICAgIHZhciBkZWJ1ZyA9IG51bGw7XHJcbiAgICB2YXIgcHJveGllcyA9IFtdO1xyXG4gICAgdmFyIGNvbnRlbnRzID0ge307XHJcblxyXG4gICAgZnVuY3Rpb24gb25FdmVudChlKSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHZhciBuYW1lcyA9ICh0YXJnZXQuY2xhc3NOYW1lIHx8IFwiXCIpLnNwbGl0KC9cXHMrLykuZmlsdGVyKGZ1bmN0aW9uKG4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG4ubGVuZ3RoID4gMDtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGV2ZW50ID0gZS50eXBlO1xyXG4gICAgICAgIGV2ZW50ID0gZXZlbnQuc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyBldmVudC5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIHdoaWxlICh0YXJnZXQpIHtcclxuICAgICAgICAgICAgdmFyIGlkID0gdGFyZ2V0LmlkO1xyXG4gICAgICAgICAgICBpZiAodGFyZ2V0Lm9uY2xpY2spIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgICAgICBpZCA9IGlkLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpICsgaWQuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpID0gMCxcclxuICAgICAgICAgICAgICAgICAgICBuYW1lO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5hbWVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChuYW1lID0gbmFtZXNbaSsrXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMCwgMSkudG9VcHBlckNhc2UoKSArIG5hbWUuc3Vic3RyKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkJChcIm9uXCIgKyBldmVudCArIGlkICsgbmFtZSwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICQkKFwib25cIiArIGV2ZW50ICsgaWQsIHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50cyA9IGZ1bmN0aW9uKHRhcmdldCwgYXJncykge1xyXG4gICAgICAgIGlmICghYXJncyAmJiB0YXJnZXQgJiYgRE9DLnR5cGVPZih0YXJnZXQpID09IFwiYXJyYXlcIikge1xyXG4gICAgICAgICAgICBhcmdzID0gdGFyZ2V0O1xyXG4gICAgICAgICAgICB0YXJnZXQgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRhcmdldCkgdGFyZ2V0ID0gZG9jdW1lbnQuYm9keTtcclxuICAgICAgICBpZiAoIWFyZ3MpIHtcclxuICAgICAgICAgICAgYXJncyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrIGluIHRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG0gPSBrLm1hdGNoKC9eb24oLispLyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW0pIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKG1bMV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbihhcmcpIHtcclxuICAgICAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoYXJnLCBvbkV2ZW50KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5kZWJ1ZyA9IGZ1bmN0aW9uKG0pIHtcclxuICAgICAgICBkZWJ1ZyA9IG07XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2lsZW5jZSA9IGZ1bmN0aW9uKG0pIHtcclxuICAgICAgICBzaWxlbmNlW21dID0gMTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5hZGRQcm94eSA9IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIGlmIChvYmogJiYgb2JqLmNhbGwpIHByb3hpZXMucHVzaChvYmopO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlbW92ZVByb3h5ID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgdmFyIGkgPSBwcm94aWVzLmluZGV4T2Yob2JqKTtcclxuICAgICAgICBpZiAoaSA9PSAtMSkgcmV0dXJuO1xyXG4gICAgICAgIHByb3hpZXMuc3BsaWNlKGksIDEpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uKG9iaiwgZW5hYmxlRGlyZWN0TXNnKSB7XHJcbiAgICAgICAgaWYgKCFvYmopIHJldHVybjtcclxuICAgICAgICBpZiAoZGVidWcgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT0gZGVidWcpIGNvbnNvbGUubG9nKFwiYWRkXCIsIG9iaik7XHJcblxyXG4gICAgICAgIGlmICghKFwiX191aWRcIiBpbiBvYmopKSBvYmouX191aWQgPSBnZXRVSUQoKTtcclxuXHJcbiAgICAgICAgaWYgKCEoXCJfX3VpZFwiIGluIG9iaikpIGNvbnNvbGUud2FybihcIkNvdWxkIG5vdCBhZGQgX191aWQgdG8gXCIsIG9iaiwgb2JqLmNvbnN0cnVjdG9yLm5hbWUpO1xyXG5cclxuICAgICAgICBjb250ZW50c1tvYmouX191aWRdID0gb2JqO1xyXG4gICAgICAgIHZhciBjbGF6eiA9IG9iai5jb25zdHJ1Y3RvcjtcclxuICAgICAgICBpZiAob2JqLm1ldGhvZHMgfHwgY2xhenoubWV0aG9kcykge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gb2JqLm1ldGhvZHMgfHwgY2xhenoubWV0aG9kcztcclxuICAgICAgICAgICAgaWYgKCEoYXJyIGluc3RhbmNlb2YgQXJyYXkpKSBhcnIgPSBPYmplY3Qua2V5cyhhcnIpO1xyXG4gICAgICAgICAgICB2YXIgbCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbSA9IGFycltpXTtcclxuICAgICAgICAgICAgICAgIGlmIChtICYmIG1bMF0gIT0gXCJfXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbihvYmosIG0sIGVuYWJsZURpcmVjdE1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNsYXp6Lm1ldGFbbV0gJiYgY2xhenoubWV0YVttXS5zaWxlbmNlKSB0aGlzLnNpbGVuY2UobSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IHt9LCBjb2JqID0gb2JqO1xyXG4gICAgICAgICAgICBkb3tcclxuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oIHByb3BlcnRpZXMsIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKGNvYmopICk7XHJcbiAgICAgICAgICAgIH13aGlsZSggY29iaiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihjb2JqKSApO1xyXG5cclxuICAgICAgICAgICAgZm9yICggdmFyIGsgaW4gcHJvcGVydGllcyApIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqW2tdICE9IFwiZnVuY3Rpb25cIikgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoayAmJiBrWzBdICE9IFwiX1wiKSB0aGlzLmxpc3RlbihvYmosIGspO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIGlmIChvYmouY29uc3RydWN0b3IubmFtZSA9PSBkZWJ1ZykgY29uc29sZS5sb2coXCJyZW1vdmVcIiwgb2JqKTtcclxuXHJcbiAgICAgICAgZGVsZXRlIGNvbnRlbnRzW29iai5fX3VpZF07XHJcblxyXG5cdGlmKCBvYmoubWV0aG9kcyB8fCBvYmouY29uc3RydWN0b3IubWV0aG9kcyApe1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrIGluIChvYmoubWV0aG9kcyB8fCBvYmouY29uc3RydWN0b3IubWV0aG9kcykgKVxyXG5cdFx0dGhpcy5tdXRlKG9iaiwgayk7XHJcblx0fWVsc2V7XHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0ge30sIGNvYmogPSBvYmo7XHJcbiAgICAgICAgICAgIGRve1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiggcHJvcGVydGllcywgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoY29iaikgKTtcclxuICAgICAgICAgICAgfXdoaWxlKCBjb2JqID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGNvYmopICk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCB2YXIgayBpbiBwcm9wZXJ0aWVzIClcclxuXHRcdHRoaXMubXV0ZShvYmosIGspO1xyXG5cdH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5wb2xsID0gZnVuY3Rpb24odCkge1xyXG4gICAgICAgIGlmICghdCkgcmV0dXJuIGNvbnRlbnRzO1xyXG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoY29udGVudHMpO1xyXG4gICAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgICAgIGZvciAoOyBjb3VudCA8IGtleXMubGVuZ3RoOyArK2NvdW50KVxyXG4gICAgICAgIHJldC5wdXNoKHQoY29udGVudHNba2V5c1tjb3VudF1dKSk7XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5saXN0ZW4gPSBmdW5jdGlvbihvYmosIG5hbWUsIGVuYWJsZURpcmVjdE1zZykge1xyXG4gICAgICAgIHZhciBtZXRob2QgPSBvYmpbbmFtZV07XHJcbiAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgIT0gXCJmdW5jdGlvblwiKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBhcnIgPSBtZXRob2RzW25hbWVdO1xyXG4gICAgICAgIGlmICghYXJyKSBhcnIgPSBtZXRob2RzW25hbWVdID0ge307XHJcbiAgICAgICAgYXJyW29iai5fX3VpZF0gPSB7XHJcbiAgICAgICAgICAgIFRISVM6IG9iaixcclxuICAgICAgICAgICAgbWV0aG9kOiBtZXRob2RcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoZW5hYmxlRGlyZWN0TXNnKSB7XHJcbiAgICAgICAgICAgIGFyciA9IG1ldGhvZHNbbmFtZSArIG9iai5fX3VpZF07XHJcbiAgICAgICAgICAgIGlmICghYXJyKSBhcnIgPSBtZXRob2RzW25hbWUgKyBvYmouX191aWRdID0ge307XHJcbiAgICAgICAgICAgIGFycltvYmouX191aWRdID0ge1xyXG4gICAgICAgICAgICAgICAgVEhJUzogb2JqLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBtZXRob2RcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubXV0ZSA9IGZ1bmN0aW9uKG9iaiwgbmFtZSkge1xyXG4gICAgICAgIHZhciBtZXRob2QgPSBvYmpbbmFtZV07XHJcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IG1ldGhvZHNbbmFtZV07XHJcbiAgICAgICAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybjtcclxuICAgICAgICBkZWxldGUgbGlzdGVuZXJzW29iai5fX3VpZF07XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuY2FsbCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xyXG4gICAgICAgIGlmIChtZXRob2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5kZWZpbmVkIGNhbGxcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpLCBsO1xyXG5cclxuICAgICAgICAvKiAqIC9cclxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuICAgIC8qL1xyXG4gICAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcclxuICAgICAgICBmb3IgKGkgPSAxLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgLyogKi9cclxuXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHByb3hpZXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgcHJveGllc1tpXS5jYWxsKG1ldGhvZCwgYXJncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbGlzdGVuZXJzID0gbWV0aG9kc1ttZXRob2RdO1xyXG4gICAgICAgIGlmICghbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIGlmICghKG1ldGhvZCBpbiBzaWxlbmNlKSkgY29uc29sZS5sb2cobWV0aG9kICsgXCI6IDBcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobGlzdGVuZXJzKTtcclxuICAgICAgICB2YXIgcmV0OyAvLz11bmRlZmluZWRcclxuICAgICAgICB2YXIgY291bnQgPSAwLFxyXG4gICAgICAgICAgICBjO1xyXG4gICAgICAgIGZvciAoOyBjb3VudCA8IGtleXMubGVuZ3RoOyArK2NvdW50KSB7XHJcbiAgICAgICAgICAgIGMgPSBsaXN0ZW5lcnNba2V5c1tjb3VudF1dO1xyXG5cclxuICAgICAgICAgICAgLy8gREVCVUdcclxuICAgICAgICAgICAgaWYgKGRlYnVnICYmIChtZXRob2QgPT0gZGVidWcgfHwgYy5USElTLmNvbnN0cnVjdG9yLm5hbWUgPT0gZGVidWcpKSBjb25zb2xlLmxvZyhjLlRISVMsIG1ldGhvZCwgYXJncyk7XHJcbiAgICAgICAgICAgIC8vIEVORC1ERUJVR1xyXG5cclxuICAgICAgICAgICAgdmFyIGxyZXQgPSBjICYmIGMubWV0aG9kLmFwcGx5KGMuVEhJUywgYXJncyk7XHJcbiAgICAgICAgICAgIGlmIChscmV0ICE9PSB1bmRlZmluZWQpIHJldCA9IGxyZXQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghKG1ldGhvZCBpbiBzaWxlbmNlKSkgY29uc29sZS5sb2cobWV0aG9kICsgXCI6IFwiICsgY291bnQpO1xyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvb2w7XHJcbiIsIlxyXG5mdW5jdGlvbiBzdG9yZSggb2JqLCBhc0J1ZmZlciApe1xyXG5cclxuICAgIGlmKCB0eXBlb2Ygb2JqID09IFwiZnVuY3Rpb25cIiApIG9iaiA9IHVuZGVmaW5lZDtcclxuICAgIGlmKCAhb2JqIHx8IHR5cGVvZiBvYmogIT0gXCJvYmplY3RcIiApXHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuXHJcbiAgICB2YXIgaW5zdCA9IFtdLCBzdHJJbmRleCA9IHtcIk9iamVjdFwiOi0yLFwiQXJyYXlcIjotM30sIGFyckluZGV4ID0ge30sIG9iakluZGV4ID0gW107XHJcblxyXG4gICAgYWRkKCBvYmogKTtcclxuXHJcbiAgICBpZiggYXNCdWZmZXIgKVxyXG4gICAgICAgIHJldHVybiB0b0J1ZmZlciggaW5zdCApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gaW5zdDtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGQoIG9iaiApe1xyXG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcclxuICAgICAgICBpZiggdHlwZSA9PSBcImZ1bmN0aW9uXCIgKXtcclxuICAgICAgICAgICAgb2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB0eXBlID0gdHlwZW9mIG9iajtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpbmRleDtcclxuICAgICAgICBpZiggb2JqID09PSB1bmRlZmluZWQgKXtcclxuICAgICAgICAgICAgaW5kZXggPSAtNDtcclxuICAgICAgICB9ZWxzZSBpZiggdHlwZSA9PSBcInN0cmluZ1wiICl7XHJcbiAgICAgICAgICAgIGluZGV4ID0gc3RySW5kZXhbb2JqXTtcclxuICAgICAgICAgICAgaWYoIGluZGV4ID09PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgaW5kZXggPSAtMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpbmRleCA9IGluc3QuaW5kZXhPZihvYmopO1xyXG5cclxuICAgICAgICBpZiggaW5kZXggIT0gLTEgKSByZXR1cm4gaW5kZXg7XHJcblxyXG4gICAgICAgIGlmKCB0eXBlID09IFwib2JqZWN0XCIgKXtcclxuICAgICAgICAgICAgaW5kZXggPSBvYmpJbmRleC5pbmRleE9mKG9iaik7XHJcbiAgICAgICAgICAgIGlmKCBpbmRleCAhPSAtMSApIHJldHVybiBpbmRleDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluZGV4ID0gaW5zdC5sZW5ndGg7XHJcbiAgICAgICAgaW5zdFtpbmRleF0gPSBvYmo7XHJcblxyXG4gICAgICAgIGlmKCB0eXBlID09IFwic3RyaW5nXCIgKVxyXG4gICAgICAgICAgICBzdHJJbmRleFtvYmpdID0gaW5kZXg7XHJcblxyXG4gICAgICAgIGlmKCAhb2JqIHx8IHR5cGUgIT0gXCJvYmplY3RcIiApXHJcbiAgICAgICAgICAgIHJldHVybiBpbmRleDtcclxuICAgICAgICBcclxuICAgICAgICBvYmpJbmRleFsgaW5kZXggXSA9IG9iajtcclxuXHJcbiAgICAgICAgdmFyIGN0b3JJbmRleCA9IGFkZCggb2JqLmNvbnN0cnVjdG9yLmZ1bGxOYW1lIHx8IG9iai5jb25zdHJ1Y3Rvci5uYW1lICk7XHJcblxyXG4gICAgICAgIGlmKCBvYmouYnVmZmVyICYmIG9iai5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciApe1xyXG5cclxuICAgICAgICAgICAgaWYoICFhc0J1ZmZlciApXHJcbiAgICAgICAgICAgICAgICBvYmogPSBBcnJheS5mcm9tKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGluc3RbaW5kZXhdID0gW2N0b3JJbmRleCwgLTMsIG9ial07XHJcbiAgICAgICAgICAgIHJldHVybiBpbmRleDtcclxuICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGtleSwga2V5U2V0ID0gW107XHJcbiAgICAgICAgZm9yKCBrZXkgaW4gb2JqICl7XHJcbiAgICAgICAgICAgIGlmKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpICl7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5SW5kZXggPSBzdHJJbmRleFtrZXldO1xyXG4gICAgICAgICAgICAgICAgaWYoIGtleUluZGV4ID09PSB1bmRlZmluZWQgKXtcclxuICAgICAgICAgICAgICAgICAgICBrZXlJbmRleCA9IGluc3QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIGluc3Rba2V5SW5kZXhdID0ga2V5O1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ckluZGV4W2tleV0gPSBrZXlJbmRleDtcclxuICAgICAgICAgICAgICAgICAgICBrZXlJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAga2V5U2V0W2tleVNldC5sZW5ndGhdID0ga2V5SW5kZXg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzdHJLZXlTZXQgPSBKU09OLnN0cmluZ2lmeShrZXlTZXQpO1xyXG4gICAgICAgIGtleUluZGV4ID0gYXJySW5kZXhbIHN0cktleVNldCBdO1xyXG4gICAgICAgIGlmKCBrZXlJbmRleCA9PT0gdW5kZWZpbmVkICl7XHJcbiAgICAgICAgICAgIGtleUluZGV4ID0gaW5zdC5sZW5ndGg7XHJcbiAgICAgICAgICAgIGluc3Rba2V5SW5kZXhdID0ga2V5U2V0O1xyXG4gICAgICAgICAgICBhcnJJbmRleFtzdHJLZXlTZXRdID0ga2V5SW5kZXg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdmFsdWVTZXQgPSBbIGN0b3JJbmRleCwga2V5SW5kZXggXTtcclxuXHJcbiAgICAgICAgZm9yKCBrZXkgaW4gb2JqICl7XHJcbiAgICAgICAgICAgIGlmKCBvYmouaGFzT3duUHJvcGVydHkoa2V5KSApe1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVJbmRleCA9IGFkZCggdmFsdWUgKTtcclxuICAgICAgICAgICAgICAgIHZhbHVlU2V0W3ZhbHVlU2V0Lmxlbmd0aF0gPSB2YWx1ZUluZGV4OyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RyS2V5U2V0ID0gSlNPTi5zdHJpbmdpZnkodmFsdWVTZXQpO1xyXG4gICAgICAgIGtleUluZGV4ID0gYXJySW5kZXhbIHN0cktleVNldCBdO1xyXG4gICAgICAgIGlmKCBrZXlJbmRleCA9PT0gdW5kZWZpbmVkICl7XHJcbiAgICAgICAgICAgIGFyckluZGV4W3N0cktleVNldF0gPSBpbmRleDtcclxuICAgICAgICAgICAgaW5zdFtpbmRleF0gPSB2YWx1ZVNldDtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaW5zdFtpbmRleF0gPSBba2V5SW5kZXhdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZCggYXJyLCBpc0J1ZmZlciApe1xyXG5cclxuICAgIGlmKCBpc0J1ZmZlciB8fCAoYXJyICYmIGFyci5idWZmZXIpIClcclxuICAgICAgICBhcnIgPSBmcm9tQnVmZmVyKCBhcnIgKTtcclxuXHJcbiAgICB2YXIgU0VMRiA9IG51bGw7XHJcblxyXG4gICAgaWYoICFhcnIgfHwgdHlwZW9mIGFyciAhPT0gXCJvYmplY3RcIiApXHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIFxyXG4gICAgaWYoICFBcnJheS5pc0FycmF5KGFycikgKVxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcblxyXG4gICAgKGZ1bmN0aW9uKCl7IHRyeXtTRUxGPXdpbmRvdzt9Y2F0Y2goZXgpe30gfSkoKTtcclxuICAgIGlmKCAhU0VMRiApXHJcbiAgICAgICAgKGZ1bmN0aW9uKCl7IHRyeXtTRUxGPWdsb2JhbDt9Y2F0Y2goZXgpe30gfSkoKTtcclxuXHJcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xyXG5cclxuICAgIHZhciBjdXJzb3IgPSAwO1xyXG4gICAgcmV0dXJuIHJlYWQoLTEpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlYWQoIHBvcyApe1xyXG5cclxuICAgICAgICBzd2l0Y2goIHBvcyApe1xyXG4gICAgICAgIGNhc2UgLTE6XHJcbiAgICAgICAgICAgIHBvcyA9IGN1cnNvcjtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAtMjpcclxuICAgICAgICAgICAgcmV0dXJuIFwiT2JqZWN0XCI7XHJcbiAgICAgICAgY2FzZSAtMzpcclxuICAgICAgICAgICAgcmV0dXJuIFwiQXJyYXlcIjtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBpZiggb2JqZWN0c1twb3NdIClcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3RzW3Bvc107XHJcblxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCBwb3MgPT0gY3Vyc29yIClcclxuICAgICAgICAgICAgY3Vyc29yKys7XHJcblxyXG4gICAgICAgIHZhciB2YWx1ZSA9IGFycltwb3NdO1xyXG4gICAgICAgIGlmKCAhdmFsdWUgKSByZXR1cm4gdmFsdWU7XHJcblxyXG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG4gICAgICAgIGlmKCB0eXBlICE9IFwib2JqZWN0XCIgKSByZXR1cm4gdmFsdWU7XHJcblxyXG4gICAgICAgIGlmKCB2YWx1ZS5sZW5ndGggPT0gMSApXHJcbiAgICAgICAgICAgIHZhbHVlID0gYXJyWyB2YWx1ZVswXSBdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBjbGFzc05hbWUgPSByZWFkKCB2YWx1ZVswXSApO1xyXG5cclxuICAgICAgICBpZiggIWNsYXNzTmFtZS5zcGxpdCApXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBjbGFzc05hbWUsIHZhbHVlWzBdICk7XHJcblxyXG4gICAgICAgIHZhciBjdG9yID0gU0VMRiwgb2JqO1xyXG4gICAgICAgIGNsYXNzTmFtZS5zcGxpdChcIi5cIikuZm9yRWFjaCggcGFydCA9PiBjdG9yID0gY3RvcltwYXJ0XSApO1xyXG5cclxuICAgICAgICBpZiggdmFsdWVbMV0gIT09IC0zICl7XHJcbiAgICAgICAgICAgIG9iaiA9IG5ldyBjdG9yKCk7XHJcbiAgICAgICAgICAgIG9iamVjdHNbIHBvcyBdID0gb2JqO1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpZWxkUmVmTGlzdCwgbXVzdEFkZCA9IHZhbHVlWzFdID4gcG9zO1xyXG5cclxuICAgICAgICAgICAgZmllbGRSZWZMaXN0ID0gYXJyWyB2YWx1ZVsxXSBdO1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpZWxkTGlzdCA9IGZpZWxkUmVmTGlzdC5tYXAoIHJlZiA9PiByZWFkKHJlZikgKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCBtdXN0QWRkICkgY3Vyc29yKys7XHJcblxyXG5cclxuICAgICAgICAgICAgZm9yKCB2YXIgaT0yOyBpPHZhbHVlLmxlbmd0aDsgKytpICl7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmkgPSB2YWx1ZVtpXTtcclxuICAgICAgICAgICAgICAgIGlmKCB2aSAhPT0gLTQgKVxyXG4gICAgICAgICAgICAgICAgICAgIG9ialsgZmllbGRMaXN0W2ktMl0gXSA9IHJlYWQodmkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBvYmogPSB2YWx1ZVsyXTtcclxuICAgICAgICAgICAgaWYoICFpc0J1ZmZlciApIG9iamVjdHNbIHBvcyBdID0gb2JqID0gY3Rvci5mcm9tKCBvYmogKTtcclxuICAgICAgICAgICAgZWxzZSBvYmplY3RzWyBwb3MgXSA9IG9iaiA9IG5ldyBjdG9yKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGN1cnNvcisrO1xyXG5cclxuICAgICAgICB9XHJcblxyXG5cclxuXHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvQnVmZmVyKCBzcmMgKXtcclxuICAgIGNvbnN0IG91dCA9IFtdO1xyXG5cclxuICAgIGNvbnN0IGRhYiA9IG5ldyBGbG9hdDY0QXJyYXkoMSk7XHJcbiAgICBjb25zdCBiYWIgPSBuZXcgVWludDhBcnJheShkYWIuYnVmZmVyKTtcclxuICAgIGNvbnN0IHNhYiA9IG5ldyBJbnQzMkFycmF5KGRhYi5idWZmZXIpO1xyXG4gICAgY29uc3QgZmFiID0gbmV3IEZsb2F0MzJBcnJheShkYWIuYnVmZmVyKTtcclxuXHJcbiAgICB2YXIgcD0wO1xyXG5cclxuICAgIGZvciggdmFyIGk9MCwgbD1zcmMubGVuZ3RoOyBpPGw7ICsraSApe1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHNyY1tpXSxcclxuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcclxuXHJcbiAgICAgICAgc3dpdGNoKCB0eXBlICl7XHJcbiAgICAgICAgY2FzZSBcImJvb2xlYW5cIjogLy8gMSwgMlxyXG4gICAgICAgICAgICBvdXRbcCsrXSA9IDErKHZhbHVlfDApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxyXG4gICAgICAgICAgICB2YXIgaXNGbG9hdCA9IE1hdGguZmxvb3IoIHZhbHVlICkgIT09IHZhbHVlO1xyXG4gICAgICAgICAgICBpZiggaXNGbG9hdCApe1xyXG5cclxuICAgICAgICAgICAgICAgIGZhYlswXSA9IHZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKCBmYWJbMF0gPT09IHZhbHVlIHx8IGlzTmFOKHZhbHVlKSApe1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFtwKytdID0gMztcclxuICAgICAgICAgICAgICAgICAgICBvdXRbcCsrXSA9IGJhYlswXTsgb3V0W3ArK10gPSBiYWJbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W3ArK10gPSBiYWJbMl07IG91dFtwKytdID0gYmFiWzNdO1xyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgZGFiWzBdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W3ArK10gPSA0O1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFtwKytdID0gYmFiWzBdOyBvdXRbcCsrXSA9IGJhYlsxXTtcclxuICAgICAgICAgICAgICAgICAgICBvdXRbcCsrXSA9IGJhYlsyXTsgb3V0W3ArK10gPSBiYWJbM107XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0W3ArK10gPSBiYWJbNF07IG91dFtwKytdID0gYmFiWzVdO1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFtwKytdID0gYmFiWzZdOyBvdXRbcCsrXSA9IGJhYls3XTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgc2F2ZUludCggMCwgdmFsdWUgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgICBjYXNlIFwic3RyaW5nXCI6XHJcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHAsIHJlc3RhcnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgc2F2ZUludCggMSwgdmFsdWUubGVuZ3RoICk7XHJcbiAgICAgICAgICAgIGZvciggdmFyIGJpPTAsIGJsPXZhbHVlLmxlbmd0aDsgYmk8Ymw7ICsrYmkgKXtcclxuICAgICAgICAgICAgICAgIHZhciBieXRlID0gdmFsdWUuY2hhckNvZGVBdChiaSk7XHJcbiAgICAgICAgICAgICAgICBpZiggYnl0ZSA+IDB4RkYgKXtcclxuICAgICAgICAgICAgICAgICAgICByZXN0YXJ0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG91dFtwKytdID0gYnl0ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYoICFyZXN0YXJ0IClcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcCA9IHN0YXJ0O1xyXG4gICAgICAgICAgICBzYXZlSW50KCAyLCB2YWx1ZS5sZW5ndGggKTtcclxuXHJcbiAgICAgICAgICAgIGZvciggdmFyIGJpPTAsIGJsPXZhbHVlLmxlbmd0aDsgYmk8Ymw7ICsrYmkgKXtcclxuICAgICAgICAgICAgICAgIHZhciBieXRlID0gdmFsdWUuY2hhckNvZGVBdChiaSk7XHJcbiAgICAgICAgICAgICAgICBvdXRbcCsrXSA9IGJ5dGUgJiAweEZGO1xyXG4gICAgICAgICAgICAgICAgb3V0W3ArK10gPSAoYnl0ZT4+OCkgJiAweEZGO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgICBjYXNlIFwib2JqZWN0XCI6XHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgdmFsdWVbMl0gPT0gXCJvYmplY3RcIiApe1xyXG4gICAgICAgICAgICAgICAgdmFyIHR5cGVkID0gbmV3IFVpbnQ4QXJyYXkoIHZhbHVlWzJdLmJ1ZmZlciApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNhdmVJbnQoIDMsIC10eXBlZC5sZW5ndGggKTtcclxuICAgICAgICAgICAgICAgIHNhdmVJbnQoIDAsIHZhbHVlWzBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgYmk9MCwgYmw9dHlwZWQubGVuZ3RoOyBiaTxibDsgKytiaSApe1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFtwKytdID0gdHlwZWRbYmldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBzYXZlSW50KCAzLCB2YWx1ZS5sZW5ndGggKTtcclxuICAgICAgICAgICAgICAgIGZvciggdmFyIGJpPTAsIGJsPXZhbHVlLmxlbmd0aDsgYmk8Ymw7ICsrYmkgKXtcclxuICAgICAgICAgICAgICAgICAgICBzYXZlSW50KCAwLCB2YWx1ZVtiaV0gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFVpbnQ4QXJyYXkuZnJvbShvdXQpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHNhdmVJbnQoIHR5cGUsIHZhbHVlICl7XHJcblxyXG4gICAgICAgIHZhciBiaXRDb3VudCA9IE1hdGguY2VpbCggTWF0aC5sb2cyKCBNYXRoLmFicyh2YWx1ZSkgKSApO1xyXG4gICAgICAgIHZhciBieXRlID0gdHlwZSA8PCA2O1xyXG5cclxuICAgICAgICBpZiggYml0Q291bnQgPCAzIHx8IHZhbHVlID09PSAtOCApe1xyXG4gICAgICAgICAgICBieXRlIHw9IDB4MzA7XHJcbiAgICAgICAgICAgIGJ5dGUgfD0gdmFsdWUgJiAweEY7XHJcbiAgICAgICAgICAgIG91dFtwKytdID0gYnl0ZTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIGJpdENvdW50IDw9IDgrMyB8fCB2YWx1ZSA9PT0gLTIwNDggKXtcclxuICAgICAgICAgICAgYnl0ZSB8PSAweDEwO1xyXG4gICAgICAgICAgICBieXRlIHw9ICh2YWx1ZSA+Pj4gOCkgJiAweEY7XHJcbiAgICAgICAgICAgIG91dFtwKytdID0gYnl0ZTtcclxuICAgICAgICAgICAgb3V0W3ArK10gPSB2YWx1ZSAmIDB4RkY7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCBiaXRDb3VudCA8PSAxNiszIHx8IHZhbHVlID09PSAtNTI0Mjg4ICl7XHJcbiAgICAgICAgICAgIGJ5dGUgfD0gMHgyMDtcclxuICAgICAgICAgICAgYnl0ZSB8PSAodmFsdWUgPj4+IDE2KSAmIDB4RjtcclxuICAgICAgICAgICAgb3V0W3ArK10gPSBieXRlO1xyXG4gICAgICAgICAgICBvdXRbcCsrXSA9ICh2YWx1ZT4+PjgpICYgMHhGRjtcclxuICAgICAgICAgICAgb3V0W3ArK10gPSB2YWx1ZSAmIDB4RkY7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNhYlswXSA9IHZhbHVlO1xyXG4gICAgICAgIG91dFtwKytdID0gYnl0ZTtcclxuICAgICAgICBvdXRbcCsrXSA9IGJhYlswXTsgb3V0W3ArK10gPSBiYWJbMV07XHJcbiAgICAgICAgb3V0W3ArK10gPSBiYWJbMl07IG91dFtwKytdID0gYmFiWzNdO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGZyb21CdWZmZXIoIHNyYyApe1xyXG4gICAgY29uc3Qgb3V0ID0gW107XHJcbiAgICBjb25zdCBkYWIgPSBuZXcgRmxvYXQ2NEFycmF5KDEpO1xyXG4gICAgY29uc3QgYmFiID0gbmV3IFVpbnQ4QXJyYXkoZGFiLmJ1ZmZlcik7XHJcbiAgICBjb25zdCBzYWIgPSBuZXcgSW50MzJBcnJheShkYWIuYnVmZmVyKTtcclxuICAgIGNvbnN0IGZhYiA9IG5ldyBGbG9hdDMyQXJyYXkoZGFiLmJ1ZmZlcik7XHJcblxyXG4gICAgdmFyIHBvcyA9IDA7XHJcblxyXG4gICAgZm9yKCB2YXIgbD1zcmMubGVuZ3RoOyBwb3M8bDsgKVxyXG4gICAgICAgIG91dFtvdXQubGVuZ3RoXSA9IHJlYWQoKTtcclxuXHJcbiAgICByZXR1cm4gb3V0O1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlYWQoKXtcclxuICAgICAgICB2YXIgdG1wO1xyXG4gICAgICAgIHZhciBieXRlID0gc3JjW3BvcysrXTtcclxuICAgICAgICBzd2l0Y2goIGJ5dGUgKXtcclxuICAgICAgICBjYXNlIDA6IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMTogcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGNhc2UgMjogcmV0dXJuIHRydWU7XHJcbiAgICAgICAgY2FzZSAzOiByZXR1cm4gZGVjb2RlRmxvYXQzMigpO1xyXG4gICAgICAgIGNhc2UgNDogcmV0dXJuIGRlY29kZUZsb2F0NjQoKTtcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICB2YXIgaGIgPSBieXRlID4+PiA0O1xyXG4gICAgICAgIHZhciBsYiA9IGJ5dGUgJiAweEY7XHJcbiAgICAgICAgc3dpdGNoKCBoYiAmIDMgKXtcclxuICAgICAgICBjYXNlIDA6IC8vIDMyIGJpdCBpbnRcclxuICAgICAgICAgICAgdG1wID0gZGVjb2RlSW50MzIoKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAxOiAvLyAxMiBiaXQgaW50XHJcbiAgICAgICAgICAgIHRtcCA9IHNyY1twb3MrK10gfCAoKGxiPDwyOCk+PjIwKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOiAvLyAxOSBiaXQgaW50XHJcbiAgICAgICAgICAgIHRtcCA9ICgobGI8PDI4KT4+MTIpIHwgc3JjW3Bvc10gfCAoc3JjW3BvcysxXTw8OCk7XHJcbiAgICAgICAgICAgIHBvcyArPSAyO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6IC8vIDQtYml0IGludFxyXG4gICAgICAgICAgICB0bXAgPSAobGI8PDI4KT4+Mjg7IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3dpdGNoKCBoYj4+MiApe1xyXG4gICAgICAgIGNhc2UgMDogcmV0dXJuIHRtcDtcclxuICAgICAgICBjYXNlIDE6IHJldHVybiBkZWNvZGVTdHI4KCB0bXAgKTtcclxuICAgICAgICBjYXNlIDI6IHJldHVybiBkZWNvZGVTdHIxNiggdG1wICk7XHJcbiAgICAgICAgY2FzZSAzOiByZXR1cm4gZGVjb2RlQXJyYXkoIHRtcCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVjb2RlU3RyOCggc2l6ZSApe1xyXG4gICAgICAgIHZhciBhY2MgPSBcIlwiO1xyXG4gICAgICAgIGZvciggdmFyIGk9MDsgaTxzaXplOyArK2kgKVxyXG4gICAgICAgICAgICBhY2MgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSggc3JjW3BvcysrXSApXHJcbiAgICAgICAgcmV0dXJuIGFjYztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWNvZGVTdHIxNiggc2l6ZSApe1xyXG4gICAgICAgIHZhciBhY2MgPSBcIlwiO1xyXG4gICAgICAgIGZvciggdmFyIGk9MDsgaTxzaXplOyArK2kgKXtcclxuICAgICAgICAgICAgdmFyIGggPSBzcmNbcG9zKytdO1xyXG4gICAgICAgICAgICBhY2MgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSggKGg8PDgpIHwgc3JjW3BvcysrXSApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2M7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVjb2RlQXJyYXkoIHNpemUgKXtcclxuXHJcbiAgICAgICAgdmFyIHJldCA9IFtdO1xyXG4gICAgICAgIGlmKCBzaXplIDwgMCApe1xyXG5cclxuICAgICAgICAgICAgcmV0WzBdID0gcmVhZCgpOyAvLyB0eXBlXHJcbiAgICAgICAgICAgIHJldFsxXSA9IC0zO1xyXG5cclxuICAgICAgICAgICAgc2l6ZSA9IC1zaXplO1xyXG5cclxuICAgICAgICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoc2l6ZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IoIHZhciBpPTA7IGk8c2l6ZTsgKytpIClcclxuICAgICAgICAgICAgICAgIGJ5dGVzW2ldID0gc3JjW3BvcysrXVxyXG5cclxuICAgICAgICAgICAgcmV0WzJdID0gYnl0ZXMuYnVmZmVyO1xyXG5cclxuICAgICAgICB9ZWxzZXtcclxuXHJcbiAgICAgICAgICAgIGZvciggdmFyIGk9MDsgaTxzaXplOyArK2kgKVxyXG4gICAgICAgICAgICAgICAgcmV0W2ldID0gcmVhZCgpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlY29kZUludDMyKCl7XHJcbiAgICAgICAgYmFiWzBdID0gc3JjW3BvcysrXTsgYmFiWzFdID0gc3JjW3BvcysrXTtcclxuICAgICAgICBiYWJbMl0gPSBzcmNbcG9zKytdOyBiYWJbM10gPSBzcmNbcG9zKytdO1xyXG4gICAgICAgIHJldHVybiBzYWJbMF07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVjb2RlRmxvYXQzMigpe1xyXG4gICAgICAgIGJhYlswXSA9IHNyY1twb3MrK107IGJhYlsxXSA9IHNyY1twb3MrK107XHJcbiAgICAgICAgYmFiWzJdID0gc3JjW3BvcysrXTsgYmFiWzNdID0gc3JjW3BvcysrXTtcclxuICAgICAgICByZXR1cm4gZmFiWzBdO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlY29kZUZsb2F0NjQoKXtcclxuICAgICAgICBiYWJbMF0gPSBzcmNbcG9zKytdOyBiYWJbMV0gPSBzcmNbcG9zKytdO1xyXG4gICAgICAgIGJhYlsyXSA9IHNyY1twb3MrK107IGJhYlszXSA9IHNyY1twb3MrK107XHJcbiAgICAgICAgYmFiWzRdID0gc3JjW3BvcysrXTsgYmFiWzVdID0gc3JjW3BvcysrXTtcclxuICAgICAgICBiYWJbNl0gPSBzcmNbcG9zKytdOyBiYWJbN10gPSBzcmNbcG9zKytdO1xyXG4gICAgICAgIHJldHVybiBkYWJbMF07XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgc3RvcmUsIGxvYWQgfTtcclxuIiwiLy8gbGV0IHtiaW5kLCBpbmplY3QsIGdldEluc3RhbmNlT2Z9ID0gcmVxdWlyZSgnLi9saWIvZHJ5LWRpLmpzJyk7XHJcbmltcG9ydCB7YmluZCwgaW5qZWN0LCBnZXRJbnN0YW5jZU9mfSBmcm9tICdkcnktZGknO1xyXG5cclxuXHJcbmltcG9ydCBBcHAgZnJvbSAnLi9BcHAuanMnO1xyXG5pbXBvcnQgSVN0b3JlIGZyb20gJy4vc3RvcmUvSVN0b3JlLmpzJztcclxuaW1wb3J0IE5vZGVTdG9yZSBmcm9tICcuL3N0b3JlL05vZGUuanMnO1xyXG5pbXBvcnQgTVQgZnJvbSAnLi9saWIvbXQuanMnO1xyXG5pbXBvcnQgeyBNb2RlbCwgYm9vdCB9IGZyb20gJy4vbGliL212Yy5qcyc7XHJcblxyXG5pbXBvcnQgKiBhcyBlbnRpdGllcyBmcm9tICcuL2VudGl0aWVzLyouanMnO1xyXG5pbXBvcnQgKiBhcyBjb21wb25lbnRzIGZyb20gJy4vY29tcG9uZW50cy8qLmpzJztcclxuaW1wb3J0ICogYXMgc2NlbmVjb21wb25lbnRzIGZyb20gJy4vc2NlbmVjb21wb25lbnRzLyouanMnO1xyXG5pbXBvcnQgKiBhcyBzY2VuZWNvbnRyb2xsZXJzIGZyb20gJy4vc2NlbmVjb250cm9sbGVycy8qLmpzJztcclxuXHJcbmZ1bmN0aW9uIG1ha2VSTkcoIHNlZWQgKXtcclxuICAgIHZhciBybmcgPSBuZXcgTVQoIE1hdGgucm91bmQoIHNlZWR8fDAgKSApO1xyXG4gICAgcmV0dXJuIHJuZy5yYW5kb20uYmluZChybmcpO1xyXG59XHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCBcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT4ge1xyXG5zZXRUaW1lb3V0KCBmdW5jdGlvbigpe1xyXG5cclxuICAgIGJpbmQoTm9kZVN0b3JlKS50byhJU3RvcmUpLnNpbmdsZXRvbigpO1xyXG4gICAgYmluZChtYWtlUk5HKS50byhcIlJOR1wiKS5mYWN0b3J5KCk7XHJcblxyXG4gICAgZm9yKCBsZXQgayBpbiBzY2VuZWNvbXBvbmVudHMgKVxyXG4gICAgICAgIGJpbmQoc2NlbmVjb21wb25lbnRzW2tdKS50byhrKS53aXRoVGFncyh7IHNjZW5lY29tcG9uZW50OnRydWUgfSk7XHJcbiAgICBmb3IoIGxldCBrIGluIHNjZW5lY29udHJvbGxlcnMgKVxyXG4gICAgICAgIGJpbmQoc2NlbmVjb250cm9sbGVyc1trXSkudG8oaykud2l0aFRhZ3MoeyBzY2VuZWNvbnRyb2xsZXI6dHJ1ZSB9KTtcclxuXHJcbiAgICBib290KHtcclxuICAgICAgICBtYWluOkFwcCxcclxuICAgICAgICBlbGVtZW50OmRvY3VtZW50LmJvZHksXHJcbiAgICAgICAgY29tcG9uZW50cyxcclxuICAgICAgICBlbnRpdGllcyxcclxuICAgICAgICBtb2RlbE5hbWU6ICdkZWZhdWx0J1xyXG4gICAgfSk7XHJcblxyXG59LCAyMDAwKTtcclxufSApOyIsImxldCBmcyA9IG51bGw7XHJcblxyXG5mdW5jdGlvbiBta2RpcnAoIGJhc2UsIHBhdGgsIGNhbGxiYWNrKSB7XHJcbiAgICBsZXQgYWNjID0gYmFzZSB8fCBcIlwiO1xyXG4gICAgbGV0IHBhdGhzID0gcGF0aC5zcGxpdCgvW1xcL1xcXFxdKy8pO1xyXG4gICAgcGF0aHMucG9wKCk7IC8vIHJlbW92ZSBsYXN0IGZpbGUvZW1wdHkgZW50cnlcclxuICAgIHdvcmsoKTtcclxuICAgIHJldHVybjtcclxuXHJcbiAgICBmdW5jdGlvbiB3b3JrKCl7XHJcbiAgICAgICAgaWYoICFwYXRocy5sZW5ndGggKVxyXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodHJ1ZSk7XHJcbiAgICAgICAgbGV0IGN1cnJlbnQgPSBwYXRocy5zaGlmdCgpO1xyXG4gICAgICAgIGZzLm1rZGlyKCBhY2MgKyBjdXJyZW50LCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKCBlcnIgJiYgZXJyLmNvZGUgIT0gJ0VFWElTVCcgKXtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlKTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBhY2MgKz0gY3VycmVudCArICcvJztcclxuICAgICAgICAgICAgICAgIHdvcmsoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5sZXQgb25sb2FkID0gW10sIHdhc0luaXQgPSBmYWxzZTtcclxubGV0IGxvY2sgPSB7fTtcclxuXHJcbmNsYXNzIElTdG9yZSB7XHJcblxyXG4gICAgc2V0IG9ubG9hZCggY2IgKXtcclxuICAgICAgICBpZiggd2FzSW5pdCApXHJcbiAgICAgICAgICAgIGNiKCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBvbmxvYWQucHVzaChjYik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IGZzKCBfZnMgKXtcclxuXHJcbiAgICAgICAgaWYoIGZzICkgcmV0dXJuO1xyXG5cclxuICAgICAgICBmcyA9IF9mcztcclxuXHJcbiAgICAgICAgbWtkaXJwKCB0aGlzLnJvb3QsIFwic3RvcmUvXCIsICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucm9vdCArPSBcInN0b3JlL1wiO1xyXG5cclxuICAgICAgICAgICAgd2FzSW5pdCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBmb3IoIHZhciBpPTAsIGNiOyBjYj1vbmxvYWRbaV07ICsraSApXHJcbiAgICAgICAgICAgICAgICBjYigpO1xyXG5cclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldFRleHRJdGVtKCBrLCBjYiApe1xyXG5cclxuICAgICAgICBpZiggbG9ja1trXSApIGNiKGxvY2tba10gKTtcclxuICAgICAgICBlbHNlIGZzLnJlYWRGaWxlKCB0aGlzLnJvb3QgKyBrLCBcInV0Zi04XCIsIChlcnIsIGRhdGEpID0+IGNiKGRhdGEpICk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldEl0ZW1CdWZmZXIoIGssIGNiICl7XHJcblxyXG4gICAgICAgICAgICBpZiggbG9ja1trXSApIGNiKGxvY2tba10gKTtcclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVhZGluZyBcIiwgayk7XHJcbiAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSggdGhpcy5yb290ICsgaywgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVhZCBcIiwgaywgZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICBjYihkYXRhKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXRJdGVtKCBrLCB2LCBjYiApe1xyXG5cclxuICAgICAgICBta2RpcnAoIHRoaXMucm9vdCwgaywgKHN1Y2Nlc3MpPT57XHJcblxyXG4gICAgICAgICAgICBpZiggIXN1Y2Nlc3MgKXtcclxuICAgICAgICAgICAgICAgIGNiKGZhbHNlKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoIGxvY2tba10gKXtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoIHRoaXMuc2V0SXRlbS5iaW5kKHRoaXMsIGssIHYsIGNiKSwgMjAwICk7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgbG9ja1trXSA9IHY7XHJcbiAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGUoIHRoaXMucm9vdCArIGssIHYsIChlcnIpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGxvY2tba107XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIGNiIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2IoIWVycik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJU3RvcmU7XHJcbiIsIlxyXG5sZXQgSVN0b3JlID0gcmVxdWlyZSgnLi9JU3RvcmUuanMnKTtcclxuXHJcbmlmKCB3aW5kb3cucmVxdWlyZSApe1xyXG5cclxuICAgIHZhciBmcyA9IHdpbmRvdy5yZXF1aXJlKCdmcycpO1xyXG4gICAgdmFyIHsgcmVtb3RlOnthcHB9IH0gPSB3aW5kb3cucmVxdWlyZSgnZWxlY3Ryb24nKTtcclxuXHJcbiAgICB2YXIge3dlYkZyYW1lfSA9IHdpbmRvdy5yZXF1aXJlKCdlbGVjdHJvbicpO1xyXG4gICAgd2ViRnJhbWUucmVnaXN0ZXJVUkxTY2hlbWVBc1ByaXZpbGVnZWQoJ2ZpbGUnLCB7fSk7XHJcblxyXG59ZWxzZXtcclxuXHJcbiAgICBmcyA9IHtcclxuXHJcbiAgICAgICAgbWtkaXIoIHBhdGgsIGNiICl7IGNiKCk7IH0sXHJcblxyXG4gICAgICAgIHJlYWRGaWxlKCBwYXRoLCBlbmMsIGNiICl7XHJcblxyXG5cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSggcGF0aCApO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgZW5jID09PSBcImZ1bmN0aW9uXCIgKXtcclxuXHJcbiAgICAgICAgICAgICAgICBjYiA9IGVuYztcclxuICAgICAgICAgICAgICAgIGlmKCBkYXRhID09PSBudWxsIClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IoIFwiRU5PRU5UXCIgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBkYXRhID0gZGF0YS5zcGxpdChcIixcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoIGRhdGEubGVuZ3RoICk7XHJcbiAgICAgICAgICAgICAgICBmb3IoIHZhciBpPTAsIGw9ZGF0YS5sZW5ndGg7IGk8bDsgKytpIClcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXJbaV0gPSBkYXRhW2ldIHwgMDtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSBidWZmZXI7XHJcblxyXG4gICAgICAgICAgICB9ZWxzZSBpZiggZGF0YSA9PT0gbnVsbCApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IoIFwiRU5PRU5UXCIgKTtcclxuXHJcbiAgICAgICAgICAgIGNiKCB1bmRlZmluZWQsIGRhdGEgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgd3JpdGVGaWxlKCBwYXRoLCBkYXRhLCBjYiApe1xyXG5cclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oIHBhdGgsIGRhdGEgKTtcclxuICAgICAgICAgICAgY2IodHJ1ZSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE5vZGVTdG9yZSBleHRlbmRzIElTdG9yZSB7XHJcbiAgICBcclxuICAgIGNvbnN0cnVjdG9yKCl7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgaWYoIGFwcCApXHJcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IGFwcC5nZXRQYXRoKFwidXNlckRhdGFcIikgKyBcIi9cIjtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IFwiXCI7XHJcblxyXG4gICAgICAgIHRoaXMuZnMgPSBmcztcclxuXHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOb2RlU3RvcmU7Il19
