"use strict";

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
