QUnit.test("dynamo database store", function (assert) {
    const done = assert.async();
    const db = new BetaJS.Data.Databases.DynamoDB.DynamoDatabase({
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
    const params = {
        TableName: "TableTest",
        KeySchema: [
            {AttributeName: "id", KeyType: "HASH"}
        ],
        AttributeDefinitions: [
            {AttributeName: "id", AttributeType: "S"}
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };
    const objId = "testid1";
    db.deleteTable("TableTest").callback(function () {
        db.createTable(params).success(function (err, data) {
            db.getTable("TableTest").insertRow({
                "id": objId,
                "name": "Test Name 1",
                "active": 1,
                countTest: 5,
                more_data: {"something": true, "another": true}
            }).success(function (object) {
                db.getTable("TableTest").updateRow({"id": objId}, {"more_data.another": false, "active": 0, countTest: 8}).success(function () {
                    db.getTable("TableTest").findOne({"id": objId}).success(function (result) {
                        assert.ok(result.more_data.something);
                        assert.ok(!result.more_data.another);
                        assert.equal(8, result.countTest);
                        db.getTable("TableTest").removeRow({"id": objId}).success(function () {
                            db.getTable("TableTest").findOne({"id": objId}).success(function (result) {
                                assert.equal(result, null);
                                db.destroy();
                                done();
                            });
                        }).error(function (err) {
                            console.log("ERROR", err);
                        });
                    });
                }).error(function (err) {
                    console.log(err);
                });
            });
        }).error(function (err) {
            console.log(err);
        });
    });
});