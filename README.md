# betajs-dynamodb 1.0.3


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
	var database = new BetaJS.Data.Databases.DynamoDB.DynamoDatabase(
	    {
                region: "us-west-2",
                // The endpoint should point to the local or remote computer where DynamoDB (downloadable) is running.
                endpoint: "http://localhost:8000",
                /*
                    accessKeyId and secretAccessKey defaults can be used while using the downloadable version of DynamoDB.
                    For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
                */
                accessKeyId: "fakeMyKeyId",
                secretAccessKey: "fakeSecretAccessKey"
            }
	);
```
 
The `DynamoDatabase` class inherits from the abstract `Database` class.

Once you have a `database` instance, you can access database tables / collections as follows:

```javascript
	var table = database.getTable('my-table-name');
```

A `table` instance allows you to perform the typical (asynchronous) CRUD operations on the table:

```javascript
	table.insertRow({row data}).success(function (inserted) {...}).error(function (error) {...});
        //In this version, the row data must contain the Key	

	table.removeRow({remove query}).success(function () {...}).error(function (error) {...});
	
	
	table.updateRow({update query}, {row data}).success(function (updated) {...}).error(function (error) {...});
	
	table.find({search query}, {limit, skip, sort}).success(function (rowIterator) {...}).error(function (error) {...});
	table.findOne({search query}, {skip, sort}).success(function (row) {...}).error(function (error) {...});
``` 

In most cases, you would not access database table instances directly but through the abstraction of a store.

Database Stores allow you to access a database table through the abstract of a `Store`, providing all the additional functionality from the `BetaJS-Data` module.

Once you have instantiated your `database` instance, you can create a corresponding `Store` for a table as follows, e.g. for a DynamoDB:

```javascript
	var store = new BetaJS.Data.Stores.DatabaseStore(database, "my-database-table");
```

### Pending
* Better `Key` management in tables. Include ID based functions
* Add DynamoDB Scan method support
* Improve tests
* Move Babel and ESLint to betajs-compile


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







