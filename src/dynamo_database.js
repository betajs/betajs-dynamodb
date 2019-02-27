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
                inherited.constructor.call(this);
                const AWS = require("aws-sdk");
                AWS.config.update(db);
                this.dynamo_module = AWS;
            },

            dynamodb: function() {
                if (this.__objects)
                    return Promise.value(this.__objects);
                this.__dynamodb = new this.dynamo_module.DynamoDB();
                this.__client = new this.dynamo_module.DynamoDB.DocumentClient();
                this.__objects = {
                    "database": this.__dynamodb,
                    "client": this.__client
                };
                return Promise.value(this.__objects);
            },

            createTable(params) {
                return this.dynamodb().mapSuccess(function(db) {
                    return Promise.funcCallback(db.database, db.database.createTable, params).mapSuccess(function(result) {
                        return result;
                    }, this);
                }, this);
            },

            deleteTable(table_name) {
                const params = {
                    TableName: table_name
                };
                return this.dynamodb().mapSuccess(function(db) {
                    return Promise.funcCallback(db.database, db.database.deleteTable, params).mapSuccess(function(result) {
                        return result;
                    }, this);
                }, this);
            },

            _tableClass: function() {
                return DynamoDatabaseTable;
            },

            dynamo_object_id: function(id) {
                //ADD Ids Generators
            },

            generate_object_id: function(id) {
                //ADD Ids Generators
            },

            destroy: function() {
                if (this.__dynamodb)
                    this.__dynamodb = null;
                if (this.__client)
                    this.__client = null;
                inherited.destroy.call(this);
            }

        };

    }, {});
});