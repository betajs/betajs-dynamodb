Scoped.define("module:DynamoDatabaseTable", [
    "data:Databases.DatabaseTable",
    "base:Promise",
    "base:Objs",
    "base:Types",
    "base:Iterators.ArrayIterator",
    "base:Iterators.SkipIterator",
    "data:Queries",
    "base:Classes.CacheHash"
], function(DatabaseTable, Promise, Objs, Types, ArrayIterator, SkipIterator, Queries, CacheHash, scoped) {
    return DatabaseTable.extend({
        scoped: scoped
    }, function(inherited) {

        var COND_MAP = {
            "$gte": ">=",
            "$lte": "<=",
            "$gt": ">",
            "$lt": "<"
        };

        return {

            constructor: function() {
                inherited.constructor.apply(this, arguments);
                this._table_options.locals = this._table_options.locals || [];
                this._table_options.globals = this._table_options.globals || [];
            },

            _deleteTable: function(table_name) {
                return this.dynamodb().mapSuccess(function(db) {
                    return Promise.funcCallback(db.database, db.database.deleteTable, {
                        TableName: table_name
                    }).mapSuccess(function(result) {
                        return result;
                    }, this);
                }, this);
            },

            _createTable: function(newName) {
                var keySchema = [{
                    AttributeName: this._table_options.primary.hash,
                    KeyType: 'HASH'
                }];
                if (this._table_options.primary.range) {
                    keySchema.push({
                        AttributeName: this._table_options.primary.range,
                        KeyType: 'RANGE'
                    });
                }
                var config = {
                    TableName: newName,
                    BillingMode: "PAY_PER_REQUEST",
                    AttributeDefinitions: Objs.arrayify(this._table_options.attributes, function(value, key) {
                        return {
                            AttributeName: key,
                            AttributeType: value
                        };
                    }),
                    KeySchema: keySchema
                };
                if (this._table_options.locals.length > 0) {
                    config.LocalSecondaryIndexes = this._table_options.locals.map(function(localRange) {
                        return {
                            IndexName: [this._table_options.primary.hash, localRange].join("_"),
                            KeySchema: [{
                                AttributeName: this._table_options.primary.hash,
                                KeyType: 'HASH'
                            }, {
                                AttributeName: localRange,
                                KeyType: 'RANGE'
                            }]
                        };
                    }, this);
                }
                if (this._table_options.locals.length > 0) {
                    config.GlobalSecondaryIndexes = this._table_options.globals.map(function(global) {
                        return {
                            IndexName: [global.hash, global.range].join("_"),
                            KeySchema: [{
                                AttributeName: global.hash,
                                KeyType: 'HASH'
                            }, {
                                AttributeName: global.range,
                                KeyType: 'RANGE'
                            }]
                        };
                    });
                }
                return this.dynamodb().mapSuccess(function(db) {
                    return Promise.funcCallback(db.database, db.database.createTable, config);
                }, this);
            },

            dynamodb: function() {
                return this._database.dynamodb();
            },

            table: function() {
                if (this.__table)
                    return Promise.create(this.__table);
                return this.dynamodb().mapSuccess(function(db) {
                    this.__table = {
                        params: {
                            TableName: this._table_name
                        },
                        client: db.client
                    };
                    return this.__table;
                }, this);
            },

            _insertRow: function(row) {
                return this.table().mapSuccess(function(table) {
                    return Promise.funcCallback(table.client, table.client.put, Object.assign({}, table.params, {
                        Item: row
                    })).mapSuccess(function(result) {
                        return result;
                    }, this);
                }, this);
            },

            primary_key: function() {
                return this._table_options.primary.hash;
            },

            _removeRow: function(query) {
                // Find by primary
                if (this._table_options.primary.hash in query && (!this._table_options.primary.range || this._table_options.primary.range in query)) {
                    return this.table().mapSuccess(function(table) {
                        var subQuery = {};
                        subQuery[this._table_options.primary.hash] = query[this._table_options.primary.hash];
                        if (this._table_options.primary.range)
                            subQuery[this._table_options.primary.range] = query[this._table_options.primary.range];
                        return Promise.funcCallback(table.client, table.client.delete, Object.assign({}, table.params, {
                            Key: subQuery,
                            ReturnValues: "NONE"
                        }));
                    }, this);
                } else
                    // Find by secondary
                    return this._findOne(query).mapSuccess(this._removeRow, this);
            },

            _updateRow: function(query, data) {
                // Find by primary
                if (this._table_options.primary.hash in query && (!this._table_options.primary.range || (this._table_options.primary.range in query))) {
                    return this.table().mapSuccess(function(table) {
                        var subQuery = {};
                        subQuery[this._table_options.primary.hash] = query[this._table_options.primary.hash];
                        if (this._table_options.primary.range)
                            subQuery[this._table_options.primary.range] = query[this._table_options.primary.range];
                        return Promise.funcCallback(table.client, table.client.update, Object.assign({}, table.params, {
                            Key: subQuery,
                            AttributeUpdates: Objs.map(data, function(value) {
                                return {
                                    "ACTION": "PUT",
                                    "Value": value
                                };
                            }),
                            ReturnValues: "ALL_NEW"
                        })).mapSuccess(function(result) {
                            return result;
                        }, this);
                    }, this);
                } else {
                    // Find by secondary
                    return this._findOne(query).mapSuccess(function(query) {
                        return this._updateRow(query, data);
                    }, this);
                }
            },

            _find: function(query, options) {
                return this.table().mapSuccess(function(table) {
                    var ean = new CacheHash("#n");
                    var eav = new CacheHash(":v");

                    options = options || {};
                    var primary = this._table_options.primary;
                    var remainingQuery = {};

                    /*
                        USE GET and PRIMARY KEY.

                        This can only be done if the query contains the primary key AND range is not part of the primary key
                        or it is part of the primary key and an equal value.
                     */
                    if (Queries.isEqualValueKey(query, primary.hash) && (!primary.range || Queries.isEqualValueKey(query, primary.range))) {
                        // Limit and Sort are irrelevant as number of results is 0..1
                        // If skip is given > 0 just return nothing
                        if (options.skip > 0)
                            return Promise.value([]);
                        var splt = Objs.splitObject(query, function(value, key) {
                            return key === primary.hash || key === primary.range;
                        });
                        query = splt[0];
                        remainingQuery = splt[1];
                        return Promise.funcCallback(table.client, table.client.get, Object.assign({}, table.params, {
                            Key: query
                        })).mapSuccess(function(result) {
                            result = result && result.Item && Queries.evaluate(remainingQuery, result.Item) ? [result.Item] : [];
                            return new ArrayIterator(result);
                        }, this);
                    }
                    var strategies = [];
                    if (primary.range) {
                        strategies.push({
                            index: undefined,
                            hash: primary.hash,
                            range: primary.range
                        });
                    }
                    this._table_options.locals.forEach(function(localRange) {
                        strategies.push({
                            index: [primary.hash, localRange].join("_"),
                            hash: primary.hash,
                            range: localRange
                        });
                    });
                    this._table_options.globals.forEach(function(global) {
                        strategies.push({
                            index: [global.hash, global.range].join("_"),
                            hash: global.hash,
                            range: global.range
                        });
                    });
                    for (var i = 0; i < strategies.length; ++i) {
                        var strategy = strategies[i];
                        if (Queries.isEqualValueKey(query, strategy.hash) && strategy.range in query) {
                            var spl = Objs.splitObject(query, function(value, key) {
                                return key === strategy.hash || key === strategy.range;
                            });
                            query = spl[0];
                            remainingQuery = spl[1];
                            var conditions = [];
                            conditions.push([ean.hashKey(strategy.hash), "=", eav.hashKey(query[strategy.hash])]);
                            if (Queries.isEqualValueKey(query, strategy.range)) {
                                conditions.push([ean.hashKey(strategy.range), "=", eav.hashKey(query[strategy.range])]);
                            } else {
                                var rangeCond = Objs.ithKey(query[strategy.range]);
                                var rangeValue = query[strategy.range][rangeCond];
                                // $gte -> gt
                                var mappedCond = COND_MAP[rangeCond];
                                conditions.push([ean.hashKey(strategy.range), mappedCond, eav.hashKey(rangeValue)]);
                            }
                            return Promise.funcCallback(table.client, table.client.query, Object.assign({}, table.params, {
                                IndexName: strategy.index,
                                KeyConditionExpression: conditions.map(function(a) {
                                    return a.join(" ");
                                }).join(" and "),
                                ExpressionAttributeNames: ean.cache(),
                                ExpressionAttributeValues: eav.cache(),
                                Limit: options.limit ? options.limit + (options.skip || 0) : undefined,
                                ScanIndexForward: !!options.sort
                            })).mapSuccess(function(result) {
                                var items = result && result.Items ? result.Items : [];
                                if (!Types.is_empty(remainingQuery))
                                    items = items.filter(function(row) {
                                        return Queries.evaluate(remainingQuery, row);
                                    });
                                var iterator = new ArrayIterator(items);
                                return options.skip > 0 ? new SkipIterator(iterator, options.skip) : iterator;
                            }, this);
                        }
                    }
                    return Promise.error("Unsupported query");
                }, this);
            }

        };
    });
});