QUnit.test("dynamo hash", function (assert) {
    const done = assert.async();
    const db = new BetaJS.Data.Databases.DynamoDB.DynamoDatabase({ endpoint: "http://localhost:8000",  region: "eu-west-1" });
    const table = db.getTable("TableTest", { primary: { hash: "id" }, attributes: { id: "S" } });
    table.deleteTable().callback(function () {
        table.createTable().success(function (result) {
            table.insertRow({
                "id": "foobar",
                "bar": "baz"
            }).success(function () {
                table.updateRow({"id": "foobar"}, {"bar": "foo"}).success(function () {
                    table.findOne({"id": "foobar"}).success(function (result) {
                        assert.equal(result.bar, "foo");
                        table.removeRow({"id": "foobar"}).success(function () {
                            table.findOne({"id": "foobar"}).success(function (result) {
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
});


QUnit.test("dynamo hash range", function (assert) {
    const done = assert.async();
    const db = new BetaJS.Data.Databases.DynamoDB.DynamoDatabase({ endpoint: "http://localhost:8000",  region: "eu-west-1" });
    const table = db.getTable("TableTest", { primary: { hash: "id", range: "date" }, attributes: { id: "S", date: "S" } });
    table.deleteTable().callback(function () {
        table.createTable().success(function (result) {
            table.insertRow({
                "id": "foobar",
                "date": "1",
                "bar": "baz"
            }).success(function () {
                table.insertRow({
                    "id": "foobar",
                    "date": "2",
                    "bar": "bazinga"
                }).success(function () {
                    table.find({"id": "foobar", "date": {"$gte": "1"}}).success(function (items) {
                        table.updateRow({"id": "foobar", "date": "1"}, {"bar": "foo"}).success(function () {
                            table.findOne({"id": "foobar", "date": "1"}).success(function (result) {
                                assert.equal(result.bar, "foo");
                                table.removeRow({"id": "foobar", "date": "1"}).success(function () {
                                    table.findOne({"id": "foobar", "date": "1"}).success(function (result) {
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
        });
    });
});


QUnit.test("dynamo hash range local index", function (assert) {
    const done = assert.async();
    const db = new BetaJS.Data.Databases.DynamoDB.DynamoDatabase({ endpoint: "http://localhost:8000",  region: "eu-west-1" });
    const table = db.getTable("TableTest", { primary: { hash: "id", range: "date" }, locals: ["priority"], attributes: { id: "S", date: "S", priority: "S" } });
    table.deleteTable().callback(function () {
        table.createTable().success(function (result) {
            console.log("asdf");
            table.insertRow({
                "id": "foobar",
                "date": "1",
                "bar": "baz",
                "priority": "B"
            }).success(function () {
                table.insertRow({
                    "id": "foobar",
                    "date": "2",
                    "bar": "bazinga",
                    "priority": "A"
                }).success(function () {
                    table.find({"id": "foobar", "priority": {"$gte": "A"}}).success(function (items) {
                        table.updateRow({"id": "foobar", "date": "1"}, {"bar": "foo"}).success(function () {
                            table.findOne({"id": "foobar", "priority": "B"}).success(function (result) {
                                assert.equal(result.bar, "foo");
                                table.removeRow({"id": "foobar", "date": "1"}).success(function () {
                                    table.findOne({"id": "foobar", "date": "1"}).success(function (result) {
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
        });
    });
});