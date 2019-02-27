"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
betajs-dynamodb - v1.0.2 - 2019-02-27
Copyright (c) Oliver Friedmann,Pablo Iglesias
Apache-2.0 Software License.
*/

/** @flow **/

/*!
betajs-scoped - v0.0.19 - 2018-04-07
Copyright (c) Oliver Friedmann
Apache-2.0 Software License.
*/
var Scoped = function () {
  var Globals = function () {
    /** 
     * This helper module provides functions for reading and writing globally accessible namespaces, both in the browser and in NodeJS.
     * 
     * @module Globals
     * @access private
     */
    return {
      /**
       * Returns the value of a global variable.
       * 
       * @param {string} key identifier of a global variable
       * @return value of global variable or undefined if not existing
       */
      get: function get(key
      /* : string */
      ) {
        if (typeof window !== "undefined") return key ? window[key] : window;
        if (typeof global !== "undefined") return key ? global[key] : global;
        if (typeof self !== "undefined") return key ? self[key] : self;
        return undefined;
      },

      /**
       * Sets a global variable.
       * 
       * @param {string} key identifier of a global variable
       * @param value value to be set
       * @return value that has been set
       */
      set: function set(key
      /* : string */
      , value) {
        if (typeof window !== "undefined") window[key] = value;
        if (typeof global !== "undefined") global[key] = value;
        if (typeof self !== "undefined") self[key] = value;
        return value;
      },

      /**
       * Returns the value of a global variable under a namespaced path.
       * 
       * @param {string} path namespaced path identifier of variable
       * @return value of global variable or undefined if not existing
       * 
       * @example
       * // returns window.foo.bar / global.foo.bar 
       * Globals.getPath("foo.bar")
       */
      getPath: function getPath(path
      /* : string */
      ) {
        if (!path) return this.get();
        var args = path.split(".");
        if (args.length == 1) return this.get(path);
        var current = this.get(args[0]);

        for (var i = 1; i < args.length; ++i) {
          if (!current) return current;
          current = current[args[i]];
        }

        return current;
      },

      /**
       * Sets a global variable under a namespaced path.
       * 
       * @param {string} path namespaced path identifier of variable
       * @param value value to be set
       * @return value that has been set
       * 
       * @example
       * // sets window.foo.bar / global.foo.bar 
       * Globals.setPath("foo.bar", 42);
       */
      setPath: function setPath(path
      /* : string */
      , value) {
        var args = path.split(".");
        if (args.length == 1) return this.set(path, value);
        var current = this.get(args[0]) || this.set(args[0], {});

        for (var i = 1; i < args.length - 1; ++i) {
          if (!(args[i] in current)) current[args[i]] = {};
          current = current[args[i]];
        }

        current[args[args.length - 1]] = value;
        return value;
      }
    };
  }.call(this);
  /*::
  declare module Helper {
  	declare function extend<A, B>(a: A, b: B): A & B;
  }
  */


  var Helper = function () {
    /** 
     * This helper module provides auxiliary functions for the Scoped system.
     * 
     * @module Helper
     * @access private
     */
    return {
      /**
       * Attached a context to a function.
       * 
       * @param {object} obj context for the function
       * @param {function} func function
       * 
       * @return function with attached context
       */
      method: function method(obj, func) {
        return function () {
          return func.apply(obj, arguments);
        };
      },

      /**
       * Extend a base object with all attributes of a second object.
       * 
       * @param {object} base base object
       * @param {object} overwrite second object
       * 
       * @return {object} extended base object
       */
      extend: function extend(base, overwrite) {
        base = base || {};
        overwrite = overwrite || {};

        for (var key in overwrite) {
          base[key] = overwrite[key];
        }

        return base;
      },

      /**
       * Returns the type of an object, particulary returning 'array' for arrays.
       * 
       * @param obj object in question
       * 
       * @return {string} type of object
       */
      typeOf: function typeOf(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]' ? "array" : _typeof(obj);
      },

      /**
       * Returns whether an object is null, undefined, an empty array or an empty object.
       * 
       * @param obj object in question
       * 
       * @return true if object is empty
       */
      isEmpty: function isEmpty(obj) {
        if (obj === null || typeof obj === "undefined") return true;
        if (this.typeOf(obj) == "array") return obj.length === 0;
        if (_typeof(obj) !== "object") return false;

        for (var key in obj) {
          return false;
        }

        return true;
      },

      /**
       * Matches function arguments against some pattern.
       * 
       * @param {array} args function arguments
       * @param {object} pattern typed pattern
       * 
       * @return {object} matched arguments as associative array 
       */
      matchArgs: function matchArgs(args, pattern) {
        var i = 0;
        var result = {};

        for (var key in pattern) {
          if (pattern[key] === true || this.typeOf(args[i]) == pattern[key]) {
            result[key] = args[i];
            i++;
          } else if (this.typeOf(args[i]) == "undefined") i++;
        }

        return result;
      },

      /**
       * Stringifies a value as JSON and functions to string representations.
       * 
       * @param value value to be stringified
       * 
       * @return stringified value
       */
      stringify: function stringify(value) {
        if (this.typeOf(value) == "function") return "" + value;
        return JSON.stringify(value);
      }
    };
  }.call(this);

  var Attach = function () {
    /** 
     * This module provides functionality to attach the Scoped system to the environment.
     * 
     * @module Attach
     * @access private
     */
    return {
      __namespace: "Scoped",
      __revert: null,

      /**
       * Upgrades a pre-existing Scoped system to the newest version present. 
       * 
       * @param {string} namespace Optional namespace (default is 'Scoped')
       * @return {object} the attached Scoped system
       */
      upgrade: function upgrade(namespace
      /* : ?string */
      ) {
        var current = Globals.get(namespace || Attach.__namespace);

        if (current && Helper.typeOf(current) == "object" && current.guid == this.guid && Helper.typeOf(current.version) == "string") {
          var my_version = this.version.split(".");
          var current_version = current.version.split(".");
          var newer = false;

          for (var i = 0; i < Math.min(my_version.length, current_version.length); ++i) {
            newer = parseInt(my_version[i], 10) > parseInt(current_version[i], 10);
            if (my_version[i] != current_version[i]) break;
          }

          return newer ? this.attach(namespace) : current;
        } else return this.attach(namespace);
      },

      /**
       * Attaches the Scoped system to the environment. 
       * 
       * @param {string} namespace Optional namespace (default is 'Scoped')
       * @return {object} the attached Scoped system
       */
      attach: function attach(namespace
      /* : ?string */
      ) {
        if (namespace) Attach.__namespace = namespace;
        var current = Globals.get(Attach.__namespace);
        if (current == this) return this;
        Attach.__revert = current;

        if (current) {
          try {
            var exported = current.__exportScoped();

            this.__exportBackup = this.__exportScoped();

            this.__importScoped(exported);
          } catch (e) {// We cannot upgrade the old version.
          }
        }

        Globals.set(Attach.__namespace, this);
        return this;
      },

      /**
       * Detaches the Scoped system from the environment. 
       * 
       * @param {boolean} forceDetach Overwrite any attached scoped system by null.
       * @return {object} the detached Scoped system
       */
      detach: function detach(forceDetach
      /* : ?boolean */
      ) {
        if (forceDetach) Globals.set(Attach.__namespace, null);
        if (typeof Attach.__revert != "undefined") Globals.set(Attach.__namespace, Attach.__revert);
        delete Attach.__revert;
        if (Attach.__exportBackup) this.__importScoped(Attach.__exportBackup);
        return this;
      },

      /**
       * Exports an object as a module if possible. 
       * 
       * @param {object} mod a module object (optional, default is 'module')
       * @param {object} object the object to be exported
       * @param {boolean} forceExport overwrite potentially pre-existing exports
       * @return {object} the Scoped system
       */
      exports: function exports(mod, object, forceExport) {
        mod = mod || (typeof module != "undefined" ? module : null);
        if (_typeof(mod) == "object" && mod && "exports" in mod && (forceExport || mod.exports == this || !mod.exports || Helper.isEmpty(mod.exports))) mod.exports = object || this;
        return this;
      }
    };
  }.call(this);

  function newNamespace(opts
  /* : {tree ?: boolean, global ?: boolean, root ?: Object} */
  ) {
    var options
    /* : {
    tree: boolean,
    global: boolean,
    root: Object
    } */
    = {
      tree: typeof opts.tree === "boolean" ? opts.tree : false,
      global: typeof opts.global === "boolean" ? opts.global : false,
      root: _typeof(opts.root) === "object" ? opts.root : {}
    };
    /*::
    type Node = {
    	route: ?string,
    	parent: ?Node,
    	children: any,
    	watchers: any,
    	data: any,
    	ready: boolean,
    	lazy: any
    };
    */

    function initNode(options)
    /* : Node */
    {
      return {
        route: typeof options.route === "string" ? options.route : null,
        parent: _typeof(options.parent) === "object" ? options.parent : null,
        ready: typeof options.ready === "boolean" ? options.ready : false,
        children: {},
        watchers: [],
        data: {},
        lazy: []
      };
    }

    var nsRoot = initNode({
      ready: true
    });

    if (options.tree) {
      if (options.global) {
        try {
          if (window) nsRoot.data = window;
        } catch (e) {}

        try {
          if (global) nsRoot.data = global;
        } catch (e) {}

        try {
          if (self) nsRoot.data = self;
        } catch (e) {}
      } else nsRoot.data = options.root;
    }

    function nodeDigest(node
    /* : Node */
    ) {
      if (node.ready) return;

      if (node.parent && !node.parent.ready) {
        nodeDigest(node.parent);
        return;
      }

      if (node.route && node.parent && node.route in node.parent.data) {
        node.data = node.parent.data[node.route];
        node.ready = true;

        for (var i = 0; i < node.watchers.length; ++i) {
          node.watchers[i].callback.call(node.watchers[i].context || this, node.data);
        }

        node.watchers = [];

        for (var key in node.children) {
          nodeDigest(node.children[key]);
        }
      }
    }

    function nodeEnforce(node
    /* : Node */
    ) {
      if (node.ready) return;
      if (node.parent && !node.parent.ready) nodeEnforce(node.parent);
      node.ready = true;

      if (node.parent) {
        if (options.tree && _typeof(node.parent.data) == "object") node.parent.data[node.route] = node.data;
      }

      for (var i = 0; i < node.watchers.length; ++i) {
        node.watchers[i].callback.call(node.watchers[i].context || this, node.data);
      }

      node.watchers = [];
    }

    function nodeSetData(node
    /* : Node */
    , value) {
      if (_typeof(value) == "object" && node.ready) {
        for (var key in value) {
          node.data[key] = value[key];
        }
      } else node.data = value;

      if (_typeof(value) == "object") {
        for (var ckey in value) {
          if (node.children[ckey]) node.children[ckey].data = value[ckey];
        }
      }

      nodeEnforce(node);

      for (var k in node.children) {
        nodeDigest(node.children[k]);
      }
    }

    function nodeClearData(node
    /* : Node */
    ) {
      if (node.ready && node.data) {
        for (var key in node.data) {
          delete node.data[key];
        }
      }
    }

    function nodeNavigate(path
    /* : ?String */
    ) {
      if (!path) return nsRoot;
      var routes = path.split(".");
      var current = nsRoot;

      for (var i = 0; i < routes.length; ++i) {
        if (routes[i] in current.children) current = current.children[routes[i]];else {
          current.children[routes[i]] = initNode({
            parent: current,
            route: routes[i]
          });
          current = current.children[routes[i]];
          nodeDigest(current);
        }
      }

      return current;
    }

    function nodeAddWatcher(node
    /* : Node */
    , callback, context) {
      if (node.ready) callback.call(context || this, node.data);else {
        node.watchers.push({
          callback: callback,
          context: context
        });

        if (node.lazy.length > 0) {
          var f = function f(node) {
            if (node.lazy.length > 0) {
              var lazy = node.lazy.shift();
              lazy.callback.call(lazy.context || this, node.data);
              f(node);
            }
          };

          f(node);
        }
      }
    }

    function nodeUnresolvedWatchers(node
    /* : Node */
    , base, result) {
      node = node || nsRoot;
      result = result || [];
      if (!node.ready && node.lazy.length === 0 && node.watchers.length > 0) result.push(base);

      for (var k in node.children) {
        var c = node.children[k];
        var r = (base ? base + "." : "") + c.route;
        result = nodeUnresolvedWatchers(c, r, result);
      }

      return result;
    }
    /** 
     * The namespace module manages a namespace in the Scoped system.
     * 
     * @module Namespace
     * @access public
     */


    return {
      /**
       * Extend a node in the namespace by an object.
       * 
       * @param {string} path path to the node in the namespace
       * @param {object} value object that should be used for extend the namespace node
       */
      extend: function extend(path, value) {
        nodeSetData(nodeNavigate(path), value);
      },

      /**
       * Set the object value of a node in the namespace.
       * 
       * @param {string} path path to the node in the namespace
       * @param {object} value object that should be used as value for the namespace node
       */
      set: function set(path, value) {
        var node = nodeNavigate(path);
        if (node.data) nodeClearData(node);
        nodeSetData(node, value);
      },

      /**
       * Read the object value of a node in the namespace.
       * 
       * @param {string} path path to the node in the namespace
       * @return {object} object value of the node or null if undefined
       */
      get: function get(path) {
        var node = nodeNavigate(path);
        return node.ready ? node.data : null;
      },

      /**
       * Lazily navigate to a node in the namespace.
       * Will asynchronously call the callback as soon as the node is being touched.
       *
       * @param {string} path path to the node in the namespace
       * @param {function} callback callback function accepting the node's object value
       * @param {context} context optional callback context
       */
      lazy: function lazy(path, callback, context) {
        var node = nodeNavigate(path);
        if (node.ready) callback(context || this, node.data);else {
          node.lazy.push({
            callback: callback,
            context: context
          });
        }
      },

      /**
       * Digest a node path, checking whether it has been defined by an external system.
       * 
       * @param {string} path path to the node in the namespace
       */
      digest: function digest(path) {
        nodeDigest(nodeNavigate(path));
      },

      /**
       * Asynchronously access a node in the namespace.
       * Will asynchronously call the callback as soon as the node is being defined.
       *
       * @param {string} path path to the node in the namespace
       * @param {function} callback callback function accepting the node's object value
       * @param {context} context optional callback context
       */
      obtain: function obtain(path, callback, context) {
        nodeAddWatcher(nodeNavigate(path), callback, context);
      },

      /**
       * Returns all unresolved watchers under a certain path.
       * 
       * @param {string} path path to the node in the namespace
       * @return {array} list of all unresolved watchers 
       */
      unresolvedWatchers: function unresolvedWatchers(path) {
        return nodeUnresolvedWatchers(nodeNavigate(path), path);
      },
      __export: function __export() {
        return {
          options: options,
          nsRoot: nsRoot
        };
      },
      __import: function __import(data) {
        options = data.options;
        nsRoot = data.nsRoot;
      }
    };
  }

  function newScope(parent, parentNS, rootNS, globalNS) {
    var self = this;
    var _nextScope = null;
    var childScopes = [];
    var parentNamespace = parentNS;
    var rootNamespace = rootNS;
    var globalNamespace = globalNS;
    var localNamespace = newNamespace({
      tree: true
    });
    var privateNamespace = newNamespace({
      tree: false
    });
    var bindings = {
      "global": {
        namespace: globalNamespace
      },
      "root": {
        namespace: rootNamespace
      },
      "local": {
        namespace: localNamespace
      },
      "default": {
        namespace: privateNamespace
      },
      "parent": {
        namespace: parentNamespace
      },
      "scope": {
        namespace: localNamespace,
        readonly: false
      }
    };

    var custom = function custom(argmts, name, callback) {
      var args = Helper.matchArgs(argmts, {
        options: "object",
        namespaceLocator: true,
        dependencies: "array",
        hiddenDependencies: "array",
        callback: true,
        context: "object"
      });
      var options = Helper.extend({
        lazy: this.options.lazy
      }, args.options || {});
      var ns = this.resolve(args.namespaceLocator);

      var execute = function execute() {
        this.require(args.dependencies, args.hiddenDependencies, function () {
          var _arguments = [];

          for (var a = 0; a < arguments.length; ++a) {
            _arguments.push(arguments[a]);
          }

          _arguments[_arguments.length - 1].ns = ns;

          if (this.options.compile) {
            var params = [];

            for (var i = 0; i < argmts.length; ++i) {
              params.push(Helper.stringify(argmts[i]));
            }

            this.compiled += this.options.ident + "." + name + "(" + params.join(", ") + ");\n\n";
          }

          if (this.options.dependencies) {
            this.dependencies[ns.path] = this.dependencies[ns.path] || {};

            if (args.dependencies) {
              args.dependencies.forEach(function (dep) {
                this.dependencies[ns.path][this.resolve(dep).path] = true;
              }, this);
            }

            if (args.hiddenDependencies) {
              args.hiddenDependencies.forEach(function (dep) {
                this.dependencies[ns.path][this.resolve(dep).path] = true;
              }, this);
            }
          }

          var result = this.options.compile ? {} : args.callback.apply(args.context || this, _arguments);
          callback.call(this, ns, result);
        }, this);
      };

      if (options.lazy) ns.namespace.lazy(ns.path, execute, this);else execute.apply(this);
      return this;
    };
    /** 
     * This module provides all functionality in a scope.
     * 
     * @module Scoped
     * @access public
     */


    return {
      getGlobal: Helper.method(Globals, Globals.getPath),
      setGlobal: Helper.method(Globals, Globals.setPath),
      options: {
        lazy: false,
        ident: "Scoped",
        compile: false,
        dependencies: false
      },
      compiled: "",
      dependencies: {},

      /**
       * Returns a reference to the next scope that will be obtained by a subScope call.
       * 
       * @return {object} next scope
       */
      nextScope: function nextScope() {
        if (!_nextScope) _nextScope = newScope(this, localNamespace, rootNamespace, globalNamespace);
        return _nextScope;
      },

      /**
       * Creates a sub scope of the current scope and returns it.
       * 
       * @return {object} sub scope
       */
      subScope: function subScope() {
        var sub = this.nextScope();
        childScopes.push(sub);
        _nextScope = null;
        return sub;
      },

      /**
       * Creates a binding within in the scope. 
       * 
       * @param {string} alias identifier of the new binding
       * @param {string} namespaceLocator identifier of an existing namespace path
       * @param {object} options options for the binding
       * 
       */
      binding: function binding(alias, namespaceLocator, options) {
        if (!bindings[alias] || !bindings[alias].readonly) {
          var ns;

          if (Helper.typeOf(namespaceLocator) != "string") {
            ns = {
              namespace: newNamespace({
                tree: true,
                root: namespaceLocator
              }),
              path: null
            };
          } else ns = this.resolve(namespaceLocator);

          bindings[alias] = Helper.extend(options, ns);
        }

        return this;
      },

      /**
       * Resolves a name space locator to a name space.
       * 
       * @param {string} namespaceLocator name space locator
       * @return {object} resolved name space
       * 
       */
      resolve: function resolve(namespaceLocator) {
        var parts = namespaceLocator.split(":");

        if (parts.length == 1) {
          throw "The locator '" + parts[0] + "' requires a namespace.";
        } else {
          var binding = bindings[parts[0]];
          if (!binding) throw "The namespace '" + parts[0] + "' has not been defined (yet).";
          return {
            namespace: binding.namespace,
            path: binding.path && parts[1] ? binding.path + "." + parts[1] : binding.path || parts[1]
          };
        }
      },

      /**
       * Defines a new name space once a list of name space locators is available.
       * 
       * @param {string} namespaceLocator the name space that is to be defined
       * @param {array} dependencies a list of name space locator dependencies (optional)
       * @param {array} hiddenDependencies a list of hidden name space locators (optional)
       * @param {function} callback a callback function accepting all dependencies as arguments and returning the new definition
       * @param {object} context a callback context (optional)
       * 
       */
      define: function define() {
        return custom.call(this, arguments, "define", function (ns, result) {
          if (ns.namespace.get(ns.path)) throw "Scoped namespace " + ns.path + " has already been defined. Use extend to extend an existing namespace instead";
          ns.namespace.set(ns.path, result);
        });
      },

      /**
       * Assume a specific version of a module and fail if it is not met.
       * 
       * @param {string} assumption name space locator
       * @param {string} version assumed version
       * 
       */
      assumeVersion: function assumeVersion() {
        var args = Helper.matchArgs(arguments, {
          assumption: true,
          dependencies: "array",
          callback: true,
          context: "object",
          error: "string"
        });
        var dependencies = args.dependencies || [];
        dependencies.unshift(args.assumption);

        this.require(dependencies, function () {
          var argv = arguments;
          var assumptionValue = argv[0].replace(/[^\d\.]/g, "");
          argv[0] = assumptionValue.split(".");

          for (var i = 0; i < argv[0].length; ++i) {
            argv[0][i] = parseInt(argv[0][i], 10);
          }

          if (Helper.typeOf(args.callback) === "function") {
            if (!args.callback.apply(args.context || this, args)) throw "Scoped Assumption '" + args.assumption + "' failed, value is " + assumptionValue + (args.error ? ", but assuming " + args.error : "");
          } else {
            var version = (args.callback + "").replace(/[^\d\.]/g, "").split(".");

            for (var j = 0; j < Math.min(argv[0].length, version.length); ++j) {
              if (parseInt(version[j], 10) > argv[0][j]) throw "Scoped Version Assumption '" + args.assumption + "' failed, value is " + assumptionValue + ", but assuming at least " + args.callback;
            }
          }
        });
      },

      /**
       * Extends a potentiall existing name space once a list of name space locators is available.
       * 
       * @param {string} namespaceLocator the name space that is to be defined
       * @param {array} dependencies a list of name space locator dependencies (optional)
       * @param {array} hiddenDependencies a list of hidden name space locators (optional)
       * @param {function} callback a callback function accepting all dependencies as arguments and returning the new additional definitions.
       * @param {object} context a callback context (optional)
       * 
       */
      extend: function extend() {
        return custom.call(this, arguments, "extend", function (ns, result) {
          ns.namespace.extend(ns.path, result);
        });
      },

      /**
       * Requires a list of name space locators and calls a function once they are present.
       * 
       * @param {array} dependencies a list of name space locator dependencies (optional)
       * @param {array} hiddenDependencies a list of hidden name space locators (optional)
       * @param {function} callback a callback function accepting all dependencies as arguments
       * @param {object} context a callback context (optional)
       * 
       */
      require: function require() {
        var args = Helper.matchArgs(arguments, {
          dependencies: "array",
          hiddenDependencies: "array",
          callback: "function",
          context: "object"
        });

        args.callback = args.callback || function () {};

        var dependencies = args.dependencies || [];
        var allDependencies = dependencies.concat(args.hiddenDependencies || []);
        var count = allDependencies.length;
        var deps = [];
        var environment = {};

        if (count) {
          var f = function f(value) {
            if (this.i < deps.length) deps[this.i] = value;
            count--;

            if (count === 0) {
              deps.push(environment);
              args.callback.apply(args.context || this.ctx, deps);
            }
          };

          for (var i = 0; i < allDependencies.length; ++i) {
            var ns = this.resolve(allDependencies[i]);
            if (i < dependencies.length) deps.push(null);
            ns.namespace.obtain(ns.path, f, {
              ctx: this,
              i: i
            });
          }
        } else {
          deps.push(environment);
          args.callback.apply(args.context || this, deps);
        }

        return this;
      },

      /**
       * Digest a name space locator, checking whether it has been defined by an external system.
       * 
       * @param {string} namespaceLocator name space locator
       */
      digest: function digest(namespaceLocator) {
        var ns = this.resolve(namespaceLocator);
        ns.namespace.digest(ns.path);
        return this;
      },

      /**
       * Returns all unresolved definitions under a namespace locator
       * 
       * @param {string} namespaceLocator name space locator, e.g. "global:"
       * @return {array} list of all unresolved definitions 
       */
      unresolved: function unresolved(namespaceLocator) {
        var ns = this.resolve(namespaceLocator);
        return ns.namespace.unresolvedWatchers(ns.path);
      },

      /**
       * Exports the scope.
       * 
       * @return {object} exported scope
       */
      __export: function __export() {
        return {
          parentNamespace: parentNamespace.__export(),
          rootNamespace: rootNamespace.__export(),
          globalNamespace: globalNamespace.__export(),
          localNamespace: localNamespace.__export(),
          privateNamespace: privateNamespace.__export()
        };
      },

      /**
       * Imports a scope from an exported scope.
       * 
       * @param {object} data exported scope to be imported
       * 
       */
      __import: function __import(data) {
        parentNamespace.__import(data.parentNamespace);

        rootNamespace.__import(data.rootNamespace);

        globalNamespace.__import(data.globalNamespace);

        localNamespace.__import(data.localNamespace);

        privateNamespace.__import(data.privateNamespace);
      }
    };
  }

  var globalNamespace = newNamespace({
    tree: true,
    global: true
  });
  var rootNamespace = newNamespace({
    tree: true
  });
  var rootScope = newScope(null, rootNamespace, rootNamespace, globalNamespace);
  var Public = Helper.extend(rootScope, function () {
    /** 
     * This module includes all public functions of the Scoped system.
     * 
     * It includes all methods of the root scope and the Attach module.
     * 
     * @module Public
     * @access public
     */
    return {
      guid: "4b6878ee-cb6a-46b3-94ac-27d91f58d666",
      version: '0.0.19',
      upgrade: Attach.upgrade,
      attach: Attach.attach,
      detach: Attach.detach,
      exports: Attach.exports,

      /**
       * Exports all data contained in the Scoped system.
       * 
       * @return data of the Scoped system.
       * @access private
       */
      __exportScoped: function __exportScoped() {
        return {
          globalNamespace: globalNamespace.__export(),
          rootNamespace: rootNamespace.__export(),
          rootScope: rootScope.__export()
        };
      },

      /**
       * Import data into the Scoped system.
       * 
       * @param data of the Scoped system.
       * @access private
       */
      __importScoped: function __importScoped(data) {
        globalNamespace.__import(data.globalNamespace);

        rootNamespace.__import(data.rootNamespace);

        rootScope.__import(data.rootScope);
      }
    };
  }.call(this));
  Public = Public.upgrade();
  Public.exports();
  return Public;
}.call(void 0);
/*!
betajs-dynamodb - v1.0.2 - 2019-02-27
Copyright (c) Oliver Friedmann,Pablo Iglesias
Apache-2.0 Software License.
*/


(function () {
  var Scoped = this.subScope();
  Scoped.binding('module', 'global:BetaJS.Data.Databases.DynamoDB');
  Scoped.binding('base', 'global:BetaJS');
  Scoped.binding('data', 'global:BetaJS.Data');
  Scoped.define("module:", function () {
    return {
      "guid": "1f507e0c-602b-4372-b067-4e19442f28f4",
      "version": "1.0.2",
      "datetime": 1551300756188
    };
  });
  Scoped.assumeVersion('base:version', '~1.0.96');
  Scoped.assumeVersion('data:version', '~1.0.41');
  Scoped.define("module:DynamoDatabaseTable", ["data:Databases.DatabaseTable", "base:Promise", "base:Objs", "base:Types", "base:Iterators.ArrayIterator"], function (DatabaseTable, Promise, Objs, Types, ArrayIterator, scoped) {
    return DatabaseTable.extend({
      scoped: scoped
    }, function (inherited) {
      return {
        constructor: function constructor() {
          inherited.constructor.apply(this, arguments);
          this._table_options = this._table_options || [];
          this._table_options.idkeys = this._table_options.idkeys || [];

          this._table_options.idkeys.unshift("_id");

          this._table_options.datekeys = this._table_options.datekeys || [];
        },
        table: function table() {
          if (this.__table) return Promise.create(this.__table);
          return this._database.dynamodb().mapSuccess(function (db) {
            this.__table = {
              params: {
                TableName: this._table_name
              },
              client: db.client
            };
            return this.__table;
          }, this);
        },
        primary_key: function primary_key() {
          //TODO Better handling of key
          return "_id";
        },
        _encode: function _encode(data, valueType) {
          return data;
        },
        _decode: function _decode(data) {
          return data;
        },
        _find: function _find(query, options) {
          return this.table().mapSuccess(function (table) {
            var queryParams = this.__queryParams(query, options);

            var params = Object.assign({}, table.params, queryParams);
            return Promise.funcCallback(table.client, table.client.query, params).mapSuccess(function (data) {
              return new ArrayIterator(data.Items);
            }, this);
          }, this);
        },
        _findOne: function _findOne(query) {
          return this.table().mapSuccess(function (table) {
            var params = Object.assign({}, table.params, {
              Key: query
            });
            return Promise.funcCallback(table.client, table.client.get, params).mapSuccess(function (data) {
              return data.Item;
            }, this);
          }, this);
        },
        _count: function _count(query) {
          return this.table().mapSuccess(function (table) {
            var queryParams = this.__queryParams(query, options);

            var params = Object.assign({}, table.params, queryParams);
            return Promise.funcCallback(table.client, table.client.query, params).mapSuccess(function (data) {
              return new ArrayIterator(data.Count);
            }, this);
          }, this);
        },
        _insertRow: function _insertRow(row) {
          return this.table().mapSuccess(function (table) {
            var params = Object.assign({}, table.params, {
              Item: row
            });
            return Promise.funcCallback(table.client, table.client.put, params).mapSuccess(function (result) {
              return result;
            }, this);
          }, this);
        },
        _removeRow: function _removeRow(query) {
          return this.table().mapSuccess(function (table) {
            var params = Object.assign({}, table.params, {
              Key: query,
              ReturnValues: "NONE"
            });
            return Promise.funcCallback(table.client, table.client.delete, params).mapSuccess(function (succ) {
              return succ;
            });
          }, this);
        },
        _updateRow: function _updateRow(key, data) {
          return this.table().mapSuccess(function (table) {
            var updateParams = this.__updateParams(data);

            var params = Object.assign({}, table.params, {
              Key: key,
              ReturnValues: "ALL_NEW"
            });
            params = Object.assign({}, params, updateParams);
            return Promise.funcCallback(table.client, table.client.update, params).mapSuccess(function (result) {
              return result;
            }, this);
          }, this);
        },
        ensureIndex: function ensureIndex(key) {
          var obj = {};
          obj[key] = 1;
          this.table().success(function (table) {
            table.ensureIndex(Objs.objectBy(key, 1));
          });
        },
        __updateParams: function __updateParams(query) {
          var workQuery = Object.assign({}, query);
          var updateExpressions = [];
          var expressionAttributesValues = [];
          Objs.iter(workQuery, function (item, index) {
            var indexValue = Math.floor(Math.random() * 10 + 1);
            updateExpressions.push("".concat(index, " = :").concat(indexValue));
            expressionAttributesValues[":".concat(indexValue)] = item;
          });
          return {
            "UpdateExpression": "set " + updateExpressions.join(",  "),
            "ExpressionAttributeValues": expressionAttributesValues
          };
        },
        __queryParams: function __queryParams(query, options) {
          var workQuery = Object.assign({}, query);
          var keyConditionExpresion = [];
          var filterConditionExpresion = [];
          var expressionAttributesNames = [];
          var expressionAttributesValues = [];
          Objs.iter(workQuery.keyConditions, function (item, index) {
            if (Types.is_object(item)) {
              var operator = Objs.keys(item).join();

              if (operator !== "begins_with") {
                var op = "";

                switch (operator) {
                  case "ne":
                    op = "!=";
                    break;

                  default:
                    op = "=";
                }

                keyConditionExpresion.push("#".concat(index, " ").concat(op, " :").concat(index));
              } else {
                keyConditionExpresion.push("begins_with(#".concat(index, ", :").concat(index, ")"));
              }

              expressionAttributesNames["#".concat(index)] = index;
              expressionAttributesValues[":".concat(index)] = Objs.values(item)[0];
            } else {
              keyConditionExpresion.push("#".concat(index, " = :").concat(index));
              expressionAttributesNames["#".concat(index)] = index;
              expressionAttributesValues[":".concat(index)] = item;
            }
          });
          Objs.iter(workQuery.filterExpression, function (item, index) {
            if (Types.is_object(item)) {
              var operator = Objs.keys(item).join();

              if (operator !== "begins_with") {
                filterConditionExpresion.push("#".concat(index, " ").concat(operator, " :").concat(index));
              } else {
                filterConditionExpresion.push("begins_with(#".concat(index, ", :").concat(index, ")"));
              }

              expressionAttributesNames["#".concat(index)] = index;
              expressionAttributesValues[":".concat(index)] = Objs.values(item)[0];
            } else {
              filterConditionExpresion.push("#".concat(index, " = :").concat(index));
              expressionAttributesNames["#".concat(index)] = index;
              expressionAttributesValues[":".concat(index)] = item;
            }
          });
          return {
            "KeyConditionExpression": keyConditionExpresion.join(" and "),
            "FilterExpression": filterConditionExpresion.join(" and "),
            "ExpressionAttributeNames": expressionAttributesNames,
            "ExpressionAttributeValues": expressionAttributesValues
          };
        }
      };
    });
  });
  Scoped.define("module:DynamoDatabase", ["data:Databases.Database", "module:DynamoDatabaseTable", "base:Strings", "base:Types", "base:Objs", "base:Promise", "base:Net.Uri"], function (Database, DynamoDatabaseTable, Strings, Types, Objs, Promise, Uri, scoped) {
    return Database.extend({
      scoped: scoped
    }, function (inherited) {
      return {
        constructor: function constructor(db) {
          inherited.constructor.call(this);

          var AWS = require("aws-sdk");

          AWS.config.update(db);
          this.dynamo_module = AWS;
        },
        dynamodb: function dynamodb() {
          if (this.__objects) return Promise.value(this.__objects);
          this.__dynamodb = new this.dynamo_module.DynamoDB();
          this.__client = new this.dynamo_module.DynamoDB.DocumentClient();
          this.__objects = {
            "database": this.__dynamodb,
            "client": this.__client
          };
          return Promise.value(this.__objects);
        },
        createTable: function createTable(params) {
          return this.dynamodb().mapSuccess(function (db) {
            return Promise.funcCallback(db.database, db.database.createTable, params).mapSuccess(function (result) {
              return result;
            }, this);
          }, this);
        },
        deleteTable: function deleteTable(table_name) {
          var params = {
            TableName: table_name
          };
          return this.dynamodb().mapSuccess(function (db) {
            return Promise.funcCallback(db.database, db.database.deleteTable, params).mapSuccess(function (result) {
              return result;
            }, this);
          }, this);
        },
        _tableClass: function _tableClass() {
          return DynamoDatabaseTable;
        },
        dynamo_object_id: function dynamo_object_id(id) {//ADD Ids Generators
        },
        generate_object_id: function generate_object_id(id) {//ADD Ids Generators
        },
        destroy: function destroy() {
          if (this.__dynamodb) this.__dynamodb = null;
          if (this.__client) this.__client = null;
          inherited.destroy.call(this);
        }
      };
    }, {});
  });
}).call(Scoped);
