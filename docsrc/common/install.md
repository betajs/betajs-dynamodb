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


#### DynamoDB

```
docker run -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb
```

#### Dynamo Viewer

```
npm install dynamodb-admin -g
export DYNAMO_ENDPOINT=http://localhost:8000
dynamodb-admin
```
