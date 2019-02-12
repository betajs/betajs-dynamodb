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
                    this.__table.params = {
                        TableName: this.__table_name
                    };
                    this.__table.obj = db.__client;
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
                    const params = Objs.extend(table.params, {Item: row});
                    return Promise.funcCallback(null, table.obj.put, params).mapSuccess(function(result) {
                        console.log(result);
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