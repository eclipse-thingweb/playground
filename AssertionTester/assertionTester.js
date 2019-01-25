const fs = require('fs');
const jsonld = require('jsonld');
var Ajv = require('ajv');
const Json2csvParser = require('json2csv').Parser;

// Takes the second argument as the TD to validate

var storedTdAddress;

const draftLocation = "./AssertionTester/json-schema-draft-06.json";

const fields = ['ID', 'Status', 'additionalInfo'];
const json2csvParser = new Json2csvParser({
    fields
});
var results = [];

//console.log("argv is ", process.argv);
if (process.argv[2]) {
    //console.log("there is second arg");
    if (typeof process.argv[2] === "string") {
        console.log("Taking TD found at ", process.argv[2], " for validation");
        storedTdAddress = process.argv[2];
    } else {
        console.error("Second argument should be string");
        throw "Argument error";
    }
} else {
    console.error("There is NO second argument, put the location of the TD after the script call");
    throw "Argument error";
}

validate(storedTdAddress)

function validate(storedTdAddress) {

    fs.readFile(storedTdAddress, (err, tdData) => {
        if (err) {
            console.error("Thing Description could not be found at ", storedTdAddress);
            throw err;
        };
        try {
            var tdJson = JSON.parse(tdData);
            console.log('JSON validation... OK');
        } catch (err) {
            console.error('X JSON validation... KO:');
            console.error('> ' + err.message);
            throw err;
        }

        doLeftOutChecks(tdJson);

        fs.readFile(draftLocation, (err, draftData) => {
            if (err) {
                console.error("JSON Schema Draft could not be found at ", draftLocation);
                throw err;
            };
            console.log("Taking Schema Draft found at ", draftLocation);
            var draft = JSON.parse(draftData);

            // Iterating through assertions

            var assertions = fs.readdirSync("./AssertionTester/Assertions/");

            assertions.forEach((curAssertion, index) => {

                var schemaLocation = "./AssertionTester/Assertions/" + curAssertion;

                var schemaData = fs.readFileSync(schemaLocation);

                console.log("Taking Assertion Schema found at ", schemaLocation);
                var schema = JSON.parse(schemaData);

                // Validation starts here

                const avj_options = {
                    "$comment": function (v) {
                        console.log("\n!!!! COMMENT", v)
                    },
                    "allErrors": true
                };
                var ajv = new Ajv(avj_options);
                ajv.addMetaSchema(draft);
                ajv.addSchema(schema, 'td');

                
                var valid = ajv.validate('td', tdJson);

                /*
                    If valid then it is not implemented
                    if error says not-impl then it is not implemented
                    If somehow error says fail then it is failed

                    Output is structured as follows:
                    [main assertion]:[sub assertion if exists]=[result]
                */
                if (schema["is-complex"]) {
                    if (valid) {
                        console.log('Assertion ' + schema.title + ' not implemented');
                        results.push({
                            "ID": schema.title,
                            "Status": "not-impl"
                        });
                        if (schema.hasOwnProperty("also")) {
                            var otherAssertions = schema.also;
                            otherAssertions.forEach(function (asser) {
                                results.push({
                                    "ID": asser,
                                    "Status": "not-impl"
                                });
                            });
                        }

                    } else {
                        console.log(ajv.errors);
                        var output = ajv.errors[0].params.allowedValue;

                        var resultStart = output.indexOf("=");
                        var result = output.slice(resultStart + 1);
                        console.log(result)
                        if(result == "pass"){
                            results.push({
                                "ID": schema.title,
                                "Status": result
                            });
                        } else {
                            results.push({
                                "ID": schema.title,
                                "Status": result,
                                "additionalInfo": ajv.errorsText()
                            });
                        }
                        if (schema.hasOwnProperty("also")) {
                            var otherAssertions = schema.also;
                            otherAssertions.forEach(function (asser) {
                                results.push({
                                    "ID": asser,
                                    "Status": result
                                });
                            });
                        }
                    }

                } else {
                    if (valid) {
                        console.log('Assertion ' + schema.title + ' implemented');
                        results.push({
                            "ID": schema.title,
                            "Status": "pass"
                        });
                        if (schema.hasOwnProperty("also")) {
                            var otherAssertions = schema.also;
                            otherAssertions.forEach(function (asser) {
                                results.push({
                                    "ID": asser,
                                    "Status": "pass"
                                });
                            });
                        }
                    } else {
                        // failed because a required is not implemented
                        console.log('> ' + ajv.errorsText());
                        if (ajv.errorsText().indexOf("required") > -1) {
                            //failed because it doesnt have required key which is a non implemented feature
                            console.log('Assertion ' + schema.title + ' not implemented');
                            results.push({
                                "ID": schema.title,
                                "Status": "not-impl",
                                "additionalInfo": ajv.errorsText()
                            });
                            if (schema.hasOwnProperty("also")) {
                                var otherAssertions = schema.also;
                                otherAssertions.forEach(function (asser) {
                                    results.push({
                                        "ID": asser,
                                        "Status": "not-impl",
                                        "additionalInfo": ajv.errorsText()
                                    });
                                });
                            }
                        } else {
                            //failed because of some other reason
                            console.log('Assertion ' + schema.title + ' failed');
                            results.push({
                                "ID": schema.title,
                                "Status": "fail",
                                "additionalInfo": ajv.errorsText()
                            });
                            if (schema.hasOwnProperty("also")) {
                                var otherAssertions = schema.also;
                                otherAssertions.forEach(function (asser) {
                                    results.push({
                                        "ID": asser,
                                        "Status": "fail",
                                        "additionalInfo": ajv.errorsText()
                                    });
                                });
                            }
                        }
                    }
                }


                // If reached the end
                if (index == assertions.length - 1) {
                    console.log(results);

                    var orderedResults = {};

                    Object.keys(results).sort().forEach(function (key) {
                        orderedResults[key] = results[key];
                    });

                    var csvResults = json2csvParser.parse(results);

                    // csvResults.sort();

                    console.log(csvResults);

                    fs.writeFile("./AssertionTester/Results/result" + tdJson.id + ".json", JSON.stringify(results), function (err) {
                        if (err) {
                            return console.log(err);
                        }

                        console.log("The result json was saved!");
                    });

                    fs.writeFile("./AssertionTester/Results/result" + tdJson.id + ".csv", csvResults, function (err) {
                        if (err) {
                            return console.log(err);
                        }

                        console.log("The result csv was saved!");
                    });
                }

            });
        });
    });
}

function doLeftOutChecks(td) {

    checkUniqueness(td);
    checkVocabulary(td);
}

function checkVocabulary(tdJson) {
    /*
    Validates the following assertions:
    td-vocabulary
    td-objects:securityDefinitions
    td-arrays:security
    td:security
    td-security-mandatory
    */
    var draftData = fs.readFileSync(draftLocation)

    console.log("Taking Schema Draft found at ", draftLocation);
    var draft = JSON.parse(draftData);

    var schemaData = fs.readFileSync("./WebContent/td-schema.json");

    console.log("Taking td-schema")

    var schema = JSON.parse(schemaData);

    var ajv = new Ajv();
    ajv.addMetaSchema(draft);
    ajv.addSchema(schema, 'td');

    var valid = ajv.validate('td', tdJson);
    var otherAssertions = ["td-objects:securityDefinitions", "td-arrays:security", "td-vocab-security-1", "td-security-mandatory", "td-vocab-securityDefinitions", "td-vocab-scheme", "td-context-toplevel", "td-vocab-name-1"];

    if (valid) {
        results.push({
            "ID": "td-vocabulary",
            "Status": "pass",
        });

        otherAssertions.forEach(function (asser) {
            results.push({
                "ID": asser,
                "Status": "pass"
            });
        });

    } else {
        results.push({
            "ID": "td-vocabulary",
            "Status": "fail",
            "additionalInfo": "invalid TD"
        });
        otherAssertions.forEach(function (asser) {
            results.push({
                "ID": asser,
                "Status": "fail"
            });
        });
    }
}

function checkUniqueness(td) {

    var otherAssertions = ["td-properties:uniqueness", "td-actions:uniqueness", "td-events:uniqueness"];

    // building the interaction name array
    var tdInteractions = [];
    if (td.hasOwnProperty("properties")) {
        tdInteractions = tdInteractions.concat(Object.keys(td.properties));
    }
    if (td.hasOwnProperty("actions")) {
        tdInteractions = tdInteractions.concat(Object.keys(td.actions));
    }
    if (td.hasOwnProperty("events")) {
        tdInteractions = tdInteractions.concat(Object.keys(td.events));
    }

    // checking uniqueness
    isDuplicate = (new Set(tdInteractions)).size !== tdInteractions.length;

    if (isDuplicate) {
        console.log('Assertion td-unique-identifiers failed');
        results.push({
            "ID": "td-unique-identifiers",
            "Status": "fail",
            "additionalInfo": "duplicate interaction names"
        });
        otherAssertions.forEach(function (asser) {
            results.push({
                "ID": asser,
                "Status": "fail"
            });
        });
    } else {
        console.log('Assertion td-unique-identifiers passed');
        results.push({
            "ID": "td-unique-identifiers",
            "Status": "pass",
        });

        otherAssertions.forEach(function (asser) {
            results.push({
                "ID": asser,
                "Status": "pass"
            }); 
        }); 
    }
}