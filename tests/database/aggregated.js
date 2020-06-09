

QUnit.test("dynamo aggregated", function (assert) {
    const done = assert.async();
    const rawDB = new BetaJS.Data.Databases.DynamoDB.DynamoDatabase({ endpoint: "http://localhost:8000",  region: "eu-west-1" });
    const db = new BetaJS.Data.Databases.AggregatedKeysDatabaseWrapper(rawDB);
    const table = db.getTable("TableTest", {
        primary: { hash: "id", range: "state_date" },
        attributes: { id: "S", state_date: "S" },
        aggregates: [["state", "date"]]
    });
    table.deleteTable().callback(function () {
        table.createTable().success(function (result) {
            table.insertRow({
                "id": "foobar",
                "state": "A",
                "date": "X"
            }).success(function () {
                table.findOne({
                    "id": "foobar",
                    "state": "A",
                    "date": "X"
                }).success(function (result) {
                    assert.equal(result.date, "X");
                    table.removeRow({
                        "id": "foobar",
                        "state": "A",
                        "date": "X"
                    }).success(function () {
                        table.findOne({
                            "id": "foobar",
                            "state": "A",
                            "date": "X"
                        }).success(function (result) {
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