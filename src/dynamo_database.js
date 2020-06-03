Scoped.define("module:DynamoDatabase", [
    "data:Databases.Database",
    "module:DynamoDatabaseTable",
    "base:Promise"
], function(Database, DynamoDatabaseTable, Promise, scoped) {
    return Database.extend({
        scoped: scoped
    }, function(inherited) {
        return {

            constructor: function(db) {
                inherited.constructor.call(this);
                this.__db = db;
            },

            dynamodb: function() {
                if (!this.__objects) {
                    const AWS = require("aws-sdk");
                    this.__dynamodb = new AWS.DynamoDB(this.__db);
                    this.__client = new AWS.DynamoDB.DocumentClient(this.__db);
                    this.__objects = {
                        "database": this.__dynamodb,
                        "client": this.__client
                    };
                }
                return Promise.value(this.__objects);
            },

            _tableClass: function() {
                return DynamoDatabaseTable;
            }

        };

    });
});