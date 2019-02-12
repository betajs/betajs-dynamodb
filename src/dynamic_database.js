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

            _tableClass: function() {
                return DynamoDatabaseTable;
            },

            dynamo_object_id: function(id) {
                //ADD Ids Generators
            },

            generate_object_id: function(id) {
                //ADD Ids Generators
            },

            dynamodb: function() {
                if (this.__dynamodb)
                    return Promise.value(this.__dynamodb);
                this.__dynamodb = new this.dynamo_module.DynamoDB();
                this.__client = new this.dynamo_module.DynamoDB.DocumentClient();
                return Promise.value(this.__client);
            },

            destroy: function() {
                if (this.__dynamodb)
                    this.__dynamodb = null;
                if (this.__client)
                    this.__client = null;
                inherited.destroy.call(this);
            }

        };

    }, {

        uriToObject: function(uri) {
            // Not used so far
        },

        objectToUri: function(object) {
            //Not Used so far
        }

    });
});