/*!
betajs-dynamodb - v1.0.12 - 2018-11-06
Copyright (c) Oliver Friedmann
Apache-2.0 Software License.
*/

(function () {
var Scoped = this.subScope();
Scoped.binding('module', 'global:BetaJS.Data.Databases.Dynamo');
Scoped.binding('base', 'global:BetaJS');
Scoped.binding('data', 'global:BetaJS.Data');
Scoped.define("module:", function () {
	return {
    "guid": "1f507e0c-602b-4372-b067-4e19442f28f4",
    "version": "1.0.12"
};
});
Scoped.assumeVersion('base:version', '~1.0.96');
Scoped.assumeVersion('data:version', '~1.0.41');
Scoped.define("module:DynamoDatabaseTable", [
    "data:Databases.DatabaseTable",
    "base:Promise",
    "base:Objs",
    "base:Types",
    "base:Iterators.ArrayIterator"
], function(DatabaseTable, Promise, Objs, Types, ArrayIterator, scoped) {
    return DatabaseTable.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function() {
                inherited.constructor.apply(this, arguments);
                this._table_options = this._table_options || [];
                this._table_options.idkeys = this._table_options.idkeys || [];
                this._table_options.idkeys.unshift("_id");
                this._table_options.datekeys = this._table_options.datekeys || [];
            },

            table: function() {
                if (this.__table)
                    return Promise.create(this.__table);
                return this._database.dynamodb().mapSuccess(function(db) {
                    this.__table = db.collection(this._table_name);
                    return this.__table;
                }, this);
            },

            primary_key: function() {
                return "_id";
            },

            _encode: function(data, valueType) {
                if (!data)
                    return data;
                data = Objs.map(data, function(value, k) {
                    if (value && Types.is_object(value) && !value._bsontype) {
                        this._table_options.datekeys.forEach(function(key) {
                            if (key === k)
                                valueType = "date";
                        });
                        return this._encode(value, valueType);
                    }
                    if (valueType === "date")
                        return new Date(value);
                    return value;
                }, this);
                var objid = this._database.dynamo_object_id();
                this._table_options.idkeys.forEach(function(key) {
                    if (key in data && !Types.is_object(data[key]))
                        data[key] = new objid(data[key] + "");
                }, this);
                this._table_options.datekeys.forEach(function(key) {
                    if (key in data && !Types.is_object(data[key]))
                        data[key] = new Date(data[key]);
                }, this);
                return data;
            },

            _decode: function(data) {
                data = Objs.clone(data, 1);
                this._table_options.idkeys.forEach(function(key) {
                    if (key in data && Types.is_object(data[key]))
                        data[key] = data[key] + "";
                }, this);
                this._table_options.datekeys.forEach(function(key) {
                    if (key in data && Types.is_object(data[key]))
                        data[key] = data[key].getTime();
                }, this);
                return data;
            },

            _find: function(query, options) {
                return this.table().mapSuccess(function(table) {
                    return Promise.funcCallback(table, table.find, query).mapSuccess(function(result) {
                        options = options || {};
                        if ("sort" in options)
                            result = result.sort(options.sort);
                        if ("skip" in options)
                            result = result.skip(options.skip);
                        if ("limit" in options)
                            result = result.limit(options.limit);
                        return Promise.funcCallback(result, result.toArray).mapSuccess(function(cols) {
                            return new ArrayIterator(cols);
                        }, this);
                    }, this);
                }, this);
            },

            _count: function(query) {
                return this.table().mapSuccess(function(table) {
                    return Promise.funcCallback(table, table.find, query).mapSuccess(function(result) {
                        return Promise.funcCallback(result, result.count);
                    });
                });
            },

            _insertRow: function(row) {
                return this.table().mapSuccess(function(table) {
                    return Promise.funcCallback(table, table.insertOne, row).mapSuccess(function(result) {
                        return row;
                    }, this);
                }, this);
            },

            _insertRows: function(rows) {
                return this.table().mapSuccess(function(table) {
                    return Promise.funcCallback(table, table.insertMany, rows).mapSuccess(function(result) {
                        return row;
                    }, this);
                }, this);
            },

            _removeRow: function(query) {
                return this.table().mapSuccess(function(table) {
                    return Promise.funcCallback(table, table.deleteOne, query);
                }, this);
            },

            _removeRows: function(query) {
                return this.table().mapSuccess(function(table) {
                    return Promise.funcCallback(table, table.deleteMany, query);
                }, this);
            },

            _updateRow: function(query, row) {
                return this.table().mapSuccess(function(table) {
                    return Promise.funcCallback(table, table.updateOne, query, {
                        "$set": row
                    }).mapSuccess(function() {
                        return row;
                    });
                }, this);
            },

            ensureIndex: function(key) {
                var obj = {};
                obj[key] = 1;
                this.table().success(function(table) {
                    table.ensureIndex(Objs.objectBy(key, 1));
                });
            },

            _renameTable: function(newName) {
                return this.table().mapSuccess(function(table) {
                    return Promise.funcCallback(table, table.rename, newName);
                });
            }

        };
    });
});
Scoped.define("module:DynamoDatabase", [
    "data:Databases.Database",
    "module:DynamoDatabaseTable",
    "base:Strings",
    "base:Types",
    "base:Objs",
    "base:Promise",
    "base:Net.Uri"
], function(Database, DynamoDatabaseTable, Strings, Types, Objs, Promise, Uri, scoped) {
    return Database.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(db) {
                if (Types.is_string(db)) {
                    this.__dbUri = Strings.strip_start(db, "dynamodb://");
                    this.__dbObject = this.cls.uriToObject(db);
                } else {
                    db = Objs.extend({
                        database: "database",
                        server: "localhost",
                        port: 27017
                    }, db);
                    this.__dbObject = db;
                    this.__dbUri = this.cls.objectToUri(db);
                }
                inherited.constructor.call(this);
                this.dynamo_module = require("dynamodb");
            },

            _tableClass: function() {
                return DynamoDatabaseTable;
            },

            dynamo_object_id: function(id) {
                return this.dynamo_module.ObjectID;
            },

            generate_object_id: function(id) {
                return new this.dynamo_module.ObjectID();
            },

            dynamodb: function() {
                if (this.__dynamodb)
                    return Promise.value(this.__dynamodb);
                var promise = Promise.create();
                this.dynamo_module.DynamoClient.connect('dynamodb://' + this.__dbUri, {
                    autoReconnect: true,
                    useNewUrlParser: true
                }, promise.asyncCallbackFunc());
                return promise.mapSuccess(function(client) {
                    this.__dynamodb = client.db(this.__dbObject.database);
                    this.__client = client;
                    return this.__dynamodb;
                }, this);
            },

            destroy: function() {
                if (this.__client)
                    this.__client.close();
                inherited.destroy.call(this);
            }

        };

    }, {

        uriToObject: function(uri) {
            // Do not confuse URI parsing when multiple hosts are giving
            uri = uri.replace(/,[^\/]+/, "");
            var parsed = Uri.parse(uri);
            return {
                database: Strings.strip_start(parsed.path, "/"),
                server: parsed.host,
                port: parsed.port,
                username: parsed.user,
                password: parsed.password
            };
        },

        objectToUri: function(object) {
            object.path = object.database;
            return Uri.build(object);
        }

    });
});
}).call(Scoped);