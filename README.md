# betajs-dynamodb 1.0.1
[![Code Climate](https://codeclimate.com/github/betajs/betajs-dynamodb/badges/gpa.svg)](https://codeclimate.com/github/betajs/betajs-dynamodb)
[![NPM](https://img.shields.io/npm/v/betajs-dynamodb.svg?style=flat)](https://www.npmjs.com/package/betajs-dynamodb)


BetaJS-DynamoDB is a DynamoDB wrapper for BetaJS.



## Getting Started


You can use the library in your NodeJS project and compile it as well.

#### NodeJS

```javascript
	var BetaJS = require('betajs');
	require('betajs-data');
	require('betajs-dynamodb');
```


#### Compile

```javascript
	git clone https://github.com/betajs/betajs-dynamodb.git
	npm install
	grunt
```



## Basic Usage


We provide a simple abstraction for databases and tables, with a concrete implementation for DynamoDB.

First, you instantiate a database, e.g. a DynamoDB:

```javascript
	var database = new BetaJS.Data.Databases.Dynamo.DynamoDatabase("dynamodb://localhost/database");
```
 
The `DynamoDatabase` class inherits from the abstract `Database` class.

Once you have a `database` instance, you can access database tables / collections as follows:

```javascript
	var table = database.getTable('my-table-name');
```

A `table` instance allows you to perform the typical (asynchronous) CRUD operations on the table:

```javascript
	table.insertRow({row data}).success(function (inserted) {...}).error(function (error) {...});
	
	table.removeRow({remove query}).success(function () {...}).error(function (error) {...});
	table.removeById(id).success(function () {...}).error(function (error) {...});
	
	table.updateRow({update query}, {row data}).success(function (updated) {...}).error(function (error) {...});
	table.updateById(id, {row data}).success(function (updated) {...}).error(function (error) {...});
	
	table.find({search query}, {limit, skip, sort}).success(function (rowIterator) {...}).error(function (error) {...});
	table.findOne({search query}, {skip, sort}).success(function (row) {...}).error(function (error) {...});
	table.findById(id).success(function (row) {...}).error(function (error) {...});
``` 

In most cases, you would not access database table instances directly but through the abstraction of a store.

Database Stores allow you to access a database table through the abstract of a `Store`, providing all the additional functionality from the `BetaJS-Data` module.

Once you have instantiated your `database` instance, you can create a corresponding `Store` for a table as follows, e.g. for a DynamoDB:

```javascript
	var store = new BetaJS.Data.Stores.DatabaseStore(database, "my-database-table");
```


## Links
| Resource   | URL |
| :--------- | --: |
| Homepage   | [https://betajs.com](https://betajs.com) |
| Git        | [git://github.com/betajs/betajs-dynamodb.git](git://github.com/betajs/betajs-dynamodb.git) |
| Repository | [https://github.com/betajs/betajs-dynamodb](https://github.com/betajs/betajs-dynamodb) |
| Blog       | [https://blog.betajs.com](https://blog.betajs.com) | 
| Twitter    | [https://twitter.com/thebetajs](https://twitter.com/thebetajs) | 
 



## Compatability
| Target | Versions |
| :----- | -------: |
| NodeJS | 4.0 - Latest |


## CDN
| Resource | URL |
| :----- | -------: |
| betajs-dynamodb.js | [http://cdn.rawgit.com/betajs/betajs-dynamodb/master/dist/betajs-dynamodb.js](http://cdn.rawgit.com/betajs/betajs-dynamodb/master/dist/betajs-dynamodb.js) |
| betajs-dynamodb.min.js | [http://cdn.rawgit.com/betajs/betajs-dynamodb/master/dist/betajs-dynamodb.min.js](http://cdn.rawgit.com/betajs/betajs-dynamodb/master/dist/betajs-dynamodb.min.js) |
| betajs-dynamodb-noscoped.js | [http://cdn.rawgit.com/betajs/betajs-dynamodb/master/dist/betajs-dynamodb-noscoped.js](http://cdn.rawgit.com/betajs/betajs-dynamodb/master/dist/betajs-dynamodb-noscoped.js) |
| betajs-dynamodb-noscoped.min.js | [http://cdn.rawgit.com/betajs/betajs-dynamodb/master/dist/betajs-dynamodb-noscoped.min.js](http://cdn.rawgit.com/betajs/betajs-dynamodb/master/dist/betajs-dynamodb-noscoped.min.js) |



## Dependencies
| Name | URL |
| :----- | -------: |
| betajs | [Open](https://github.com/betajs/betajs) |
| betajs-data | [Open](https://github.com/betajs/betajs-data) |


## Weak Dependencies
| Name | URL |
| :----- | -------: |
| betajs-scoped | [Open](https://github.com/betajs/betajs-scoped) |


## Main Contributors

- Oliver Friedmann
- Pablo Iglesias

## License

Apache-2.0







