QUnit.test("dynamo database store", function(assert) {
	var done = assert.async();
	var db = new BetaJS.Data.Databases.Dynamo.DynamoDatabase({
		region: "us-west-2",
		// The endpoint should point to the local or remote computer where DynamoDB (downloadable) is running.
		endpoint: "http://localhost:8000",
		/*
			accessKeyId and secretAccessKey defaults can be used while using the downloadable version of DynamoDB.
			For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
		*/
		accessKeyId: "fakeMyKeyId",
		secretAccessKey: "fakeSecretAccessKey"
	});
	var params = {
		TableName: "TableTest",
		KeySchema: [
			{AttributeName: "active", KeyType: "HASH"},
			{AttributeName: "name", KeyType: "RANGE"}
		],
		AttributeDefinitions: [
			{AttributeName: "active", AttributeType: "N"},
			{AttributeName: "name", AttributeType: "S"}
		],
		ProvisionedThroughput: {
			ReadCapacityUnits: 5,
			WriteCapacityUnits: 5
		}
	};
	db.createTable(params).success(function(err, data) {
	db.getTable("TableTest").insertRow({"name": "Test Name 1", "active": 1, countTest: 5}).success(function(object) {
		assert.ok(!!object._id);
		assert.equal(typeof object._id, "string");
		assert.equal(object.x, 5);
		db.getTable("TableTest").updateById(object._id, {y: 6}).success(function() {
			db.getTable("TableTest").findById(object._id).success(function(result) {
				assert.equal(result.x, 5);
				assert.equal(result.y, 6);
				db.getTable("TableTest").removeById(object._id).success(function() {
					db.getTable("TableTest").findById(object._id).success(function(result) {
						assert.equal(result, null);
						db.destroy();
						done();
					});
				});
			});
		});
	});
});
});