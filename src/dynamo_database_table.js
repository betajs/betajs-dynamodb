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
                    this.__table = {
                        params: {
                            TableName: this._table_name
                        },
                        client: db.client
                    };
                    return this.__table;
                }, this);
            },

            primary_key: function() {
                return "_id";
            },

            _encode: function(data, valueType) {
                return data;
            },

            _decode: function(data) {
                return data;
            },

            _find: function(query, options) {
                return this.table().mapSuccess(function(table) {
                    const queryParams = this.__queryParams(query, options);
                    const params = Object.assign(table.params, queryParams);
                    return Promise.funcCallback(table.client, table.client.query, params).mapSuccess(function(data) {
                        return new ArrayIterator(data.Items);
                    }, this);
                }, this);
            },

            _findOne: function(query) {
                return this.table().mapSuccess(function(table) {
                    const params = Object.assign(table.params, {
                        Key: query
                    });
                    return Promise.funcCallback(table.client, table.client.get, params).mapSuccess(function(data) {
                        return new ArrayIterator(data.Item);
                    }, this);
                }, this);
            },

            _count: function(query) {
                return this.table().mapSuccess(function(table) {
                    const queryParams = this.__queryParams(query, options);
                    const params = Object.assign(table.params, queryParams);
                    return Promise.funcCallback(table.client, table.client.query, params).mapSuccess(function(data) {
                        return new ArrayIterator(data.Count);
                    }, this);
                }, this);
            },

            _insertRow: function(row) {
                return this.table().mapSuccess(function(table) {
                    const params = Object.assign(table.params, {
                        Item: row
                    });
                    return Promise.funcCallback(table.client, table.client.put, params).mapSuccess(function(result) {
                        return result;
                    }, this);
                }, this);
            },

            _removeRow: function(query) {
                return this.table().mapSuccess(function(table) {
                    const params = Object.assign(table.params, {
                        Key: query
                    });
                    return Promise.funcCallback(table.client, table.client.delete, params);
                }, this);
            },

            _updateRow: function(key, data) {
                return this.table().mapSuccess(function(table) {
                    const updateParams = this.__updateParams(data);
                    let params = Object.assign(table.params, {
                        Key: key,
                        ReturnValues: "UPDATED_NEW"
                    });
                    params = Object.assign(params, updateParams);
                    return Promise.funcCallback(table.client, table.client.update, params).mapSuccess(function(result) {
                        return result;
                    }, this);
                }, this);
            },

            ensureIndex: function(key) {
                var obj = {};
                obj[key] = 1;
                this.table().success(function(table) {
                    table.ensureIndex(Objs.objectBy(key, 1));
                });
            },

            __updateParams(query) {
                const workQuery = Object.assign(query);
                let updateExpressions = [];
                let expressionAttributesValues = [];
                Objs.iter(workQuery, function(item, index) {
                    const indexValue = Math.floor((Math.random() * 10) + 1);
                    updateExpressions.push(`${index} = :${indexValue}`);
                    expressionAttributesValues[`:${indexValue}`] = item;
                });

                return {
                    "UpdateExpression": "set " + updateExpressions.join(",  "),
                    "ExpressionAttributeValues": expressionAttributesValues
                };
            },

            __queryParams(query, options) {
                const workQuery = Object.assign(query);
                let keyConditionExpresion = [];
                let filterConditionExpresion = [];
                let expressionAttributesNames = [];
                let expressionAttributesValues = [];
                Objs.iter(workQuery.keyConditions, function(item, index) {
                    if (Types.is_object(item)) {
                        const operator = Objs.keys(item).join();
                        if (operator !== "begins_with") {
                            let op = "";
                            switch (operator) {
                                case "ne":
                                    op = "!=";
                                    break;
                                default:
                                    op = "=";
                            }
                            keyConditionExpresion.push(`#${index} ${op} :${index}`);
                        } else {
                            keyConditionExpresion.push(`begins_with(#${index}, :${index})`);
                        }
                        expressionAttributesNames[`#${index}`] = index;
                        expressionAttributesValues[`:${index}`] = Objs.values(item)[0];
                    } else {
                        keyConditionExpresion.push(`#${index} = :${index}`);
                        expressionAttributesNames[`#${index}`] = index;
                        expressionAttributesValues[`:${index}`] = item;
                    }
                });

                Objs.iter(workQuery.filterExpression, function(item, index) {
                    if (Types.is_object(item)) {
                        const operator = Objs.keys(item).join();
                        if (operator !== "begins_with") {
                            filterConditionExpresion.push(`#${index} ${operator} :${index}`);
                        } else {
                            filterConditionExpresion.push(`begins_with(#${index}, :${index})`);
                        }
                        expressionAttributesNames[`#${index}`] = index;
                        expressionAttributesValues[`:${index}`] = Objs.values(item)[0];
                    } else {
                        filterConditionExpresion.push(`#${index} = :${index}`);
                        expressionAttributesNames[`#${index}`] = index;
                        expressionAttributesValues[`:${index}`] = item;
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