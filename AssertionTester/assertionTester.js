const fs = require('fs');
var Ajv = require('ajv');
const Json2csvParser = require('json2csv').Parser;
var jsonValidator = require('json-dup-key-validator');
var secondArgument;

const draftLocation = "./json-schema-draft-06.json";

const fields = ['ID', 'Status', 'Comment'];
const json2csvParser = new Json2csvParser({
    fields
});
var results = [];

const nonImplementedAssertions = ["td-form-protocolbindings", "td-security-binding", "td-security-no-extras", "td-data-schema-objects", "td-media-type", "td-readOnly-observable-writeOnly-default", "td-readOnly-observable-default", "td-content-type-default", "client-data-schema", "client-uri-template", "server-data-schema", "server-data-schema-extras", "client-data-schema-accept-extras", "client-data-schema-no-extras", "server-uri-template", "td-default-readOnly", "td-default-writeOnly", "td-default-observable", "td-default-contentType", "td-default-safe", "td-default-idempotent", "td-default-in-1", "td-default-in-2", "td-default-qop", "td-default-alg", "td-default-format", "td-default-flow"];
// Takes the second argument as the TD to validate

if (process.argv[2]) {
    //console.log("there is second arg");
    if (typeof process.argv[2] === "string") {
        console.log("Taking input ", process.argv[2]);
        secondArgument = process.argv[2];
    } else {
        console.error("Second argument should be string");
        throw "Argument error";
    }
} else {
    console.error("There is NO second argument, put the location of the TD or of the directory with TDs");
    throw "Argument error";
}

if (process.argv[3]) {
    //console.log("there is second arg");
    if (typeof process.argv[3] === "string") {
        console.log("Taking output ", process.argv[3]);
        var outputLocation = process.argv[3];
        console.log("Validating a single TD and outputting result to ", outputLocation)
        var storedTdAddress = secondArgument;
        validate(storedTdAddress, outputLocation);
    } else {
        console.error("Second argument should be string");
        throw "Argument error";
    }
} else {

    try {
        // check if it is a directory
        var dirLocation = secondArgument;
        var tdList = fs.readdirSync(dirLocation);
        console.log("Validating an Implementation with Multiple TDs")
        tdList.forEach((curTD) => {
            // console.log(dirLocation + curTD)
            // console.log(tdList);
            validate(dirLocation + curTD);
        });
    } catch (error) {
        // not a directory so take the TD, hopefully
        console.log("Validating a single TD")
        var storedTdAddress = secondArgument;
        validate(storedTdAddress);
    }
}

function validate(storedTdAddress, outputLocation) {
    console.log("=================================================================")
    console.log("Taking TD found at ", storedTdAddress, " for validation");
    var tdData = fs.readFileSync(storedTdAddress);
    var tdDataString = tdData.toString();

    var tdJson = checkUniqueness(tdDataString);

    var test = checkVocabulary(tdJson);
    
    console.log("test result is ", test);
    if (!test) {
        console.log("INVALID TD STOPPING");
        toOutput(tdJson.id);
        results = [];
        return;
    } else {

        var draftData = fs.readFileSync(draftLocation);

        // console.log("Taking Schema Draft found at ", draftLocation);
        var draft = JSON.parse(draftData);

        // Iterating through assertions

        var assertions = fs.readdirSync("./Assertions/");

        assertions.forEach((curAssertion, index) => {

            var schemaLocation = "./Assertions/" + curAssertion;

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
                    // console.log('Assertion ' + schema.title + ' not implemented');
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
                    try {
                        var output = ajv.errors[0].params.allowedValue;

                        var resultStart = output.indexOf("=");
                        var result = output.slice(resultStart + 1);

                        if (result == "pass") {
                            results.push({
                                "ID": schema.title,
                                "Status": result
                            });
                        } else {
                            results.push({
                                "ID": schema.title,
                                "Status": result,
                                "Comment": ajv.errorsText()
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
                        //there was some other error, so it is fail
                    } catch (error1) {
                        results.push({
                            "ID": schema.title,
                            "Status": "fail",
                            "Comment": "Make sure you validate your TD before"
                        });

                        if (schema.hasOwnProperty("also")) {
                            var otherAssertions = schema.also;
                            otherAssertions.forEach(function (asser) {
                                results.push({
                                    "ID": asser,
                                    "Status": "fail",
                                    "Comment": "Make sure you validate your TD before"
                                });
                            });
                        }
                    }
                }

            } else {
                if (valid) {
                    // console.log('Assertion ' + schema.title + ' implemented');
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
                    // console.log('> ' + ajv.errorsText());
                    if (ajv.errorsText().indexOf("required") > -1) {
                        //failed because it doesnt have required key which is a non implemented feature
                        // console.log('Assertion ' + schema.title + ' not implemented');
                        results.push({
                            "ID": schema.title,
                            "Status": "not-impl",
                            "Comment": ajv.errorsText()
                        });
                        if (schema.hasOwnProperty("also")) {
                            var otherAssertions = schema.also;
                            otherAssertions.forEach(function (asser) {
                                results.push({
                                    "ID": asser,
                                    "Status": "not-impl",
                                    "Comment": ajv.errorsText()
                                });
                            });
                        }
                    } else {
                        //failed because of some other reason
                        // console.log('Assertion ' + schema.title + ' failed');
                        results.push({
                            "ID": schema.title,
                            "Status": "fail",
                            "Comment": ajv.errorsText()
                        });
                        if (schema.hasOwnProperty("also")) {
                            var otherAssertions = schema.also;
                            otherAssertions.forEach(function (asser) {
                                results.push({
                                    "ID": asser,
                                    "Status": "fail",
                                    "Comment": ajv.errorsText()
                                });
                            });
                        }
                    }
                }
            }


            // If reached the end
            if (index == assertions.length - 1) {
                // create parent assertions
                toOutput(tdJson.id);
            }
        });
    }
}

function toOutput(tdId) {
    createParents(results);

    // Push the non implemented assertions
    nonImplementedAssertions.forEach((curNonImpl) => {
        results.push({
            "ID": curNonImpl,
            "Status": "null",
            "Comment": "not testable with Assertion Tester"
        });
    });

    // sort according to the ID in each item
    orderedResults = results.sort(function (a, b) {
        var idA = a.ID;
        var idB = b.ID;
        if (idA < idB) {
            return -1;
        }
        if (idA > idB) {
            return 1;
        }

        // if ids are equal
        return 0;
    });

    var csvResults = json2csvParser.parse(orderedResults);
    results = [];

    //if output is specified output there
    if (outputLocation) {

        fs.writeFile(outputLocation, csvResults, function (err) {
            if (err) {
                return console.log(err);
            }

            console.log("The csv was saved!");
        });

    } else {
        //otherwise to console and save to default directories
        console.log(csvResults);

        var fileName = tdId.replace(/:/g, "_");
        fs.writeFile("./Results/result-" + fileName + ".json", JSON.stringify(orderedResults),
            function (err) {
                if (err) {
                    return console.log(err);
                }

                console.log("The result-" + fileName + " json was saved!");
            });

        fs.writeFile("./Results/result-" + fileName + ".csv", csvResults, function (err) {
            if (err) {
                return console.log(err);
            }

            console.log("The result-" + fileName + "csv was saved!");
        });
    }

}

function createParents(resultsJSON) {

    //create a json object with parent name keys and then each of them an array of children results

    var parentsJson = {};
    resultsJSON.forEach((curResult, index) => {
        var curId = curResult.ID;
        var underScoreLoc = curId.indexOf('_');
        if (underScoreLoc === -1) {
            // this assertion is not a child assertion
        } else {
            var parentResultID = curId.slice(0, underScoreLoc);
            // if it already exists push otherwise create an array and push
            if (parentsJson.hasOwnProperty(parentResultID)) {
                parentsJson[parentResultID].push(curResult);
            } else {
                parentsJson[parentResultID] = [];
                parentsJson[parentResultID].push(curResult);
            }
            // console.log(parentsJson);
        }
    });

    //Go through the object and push a result that is an OR of each children
    // if one children is fail, result is fail
    // if one children is not-impl, result is not-impl
    // if none of these happen, then it implies it is pass, so result is pass
    // "ID": schema.title,
    // "Status": "not-impl" 

    parentsJsonArray = Object.getOwnPropertyNames(parentsJson);
    parentsJsonArray.forEach((curParentName, indexParent) => {

        var curParent = parentsJson[curParentName];

        for (let index = 0; index < curParent.length; index++) {
            const curChild = curParent[index];
            if (curChild.Status == "fail") {
                //push fail and break, i.e stop going through children, we are done here!
                results.push({
                    "ID": curParentName,
                    "Status": "fail",
                    "Comment": "Error message can be seen in the children assertions"
                });
                break;
            } else if (curChild.Status == "not-impl") {
                //push not-impl and break, i.e stop going through children, we are done here!
                results.push({
                    "ID": curParentName,
                    "Status": "not-impl",
                    "Comment": "Error message can be seen in the children assertions"
                });
                break;
            } else {
                // if reached the end without break, push pass
                if (index == curParent.length - 1) {
                    results.push({
                        "ID": curParentName,
                        "Status": "pass",
                    });
                }
            }
        }
    });

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

    // console.log("Taking Schema Draft found at ", draftLocation);
    var draft = JSON.parse(draftData);

    var schemaData = fs.readFileSync("../WebContent/td-schema.json");

    // console.log("Taking td-schema")

    var schema = JSON.parse(schemaData);

    var ajv = new Ajv();
    ajv.addMetaSchema(draft);
    ajv.addSchema(schema, 'td');

    var valid = ajv.validate('td', tdJson);
    var otherAssertions = ["td-objects_securityDefinitions", "td-arrays_security", "td-vocab-security-1", "td-security-mandatory", "td-vocab-securityDefinitions", "td-vocab-scheme", "td-context-toplevel", "td-vocab-name-1"];

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
        return true;

    } else {
        console.log("VALIDATION ERROR!!! : ", ajv.errorsText());
        results.push({
            "ID": "td-vocabulary",
            "Status": "fail",
            "Comment": "invalid TD"
        });
        otherAssertions.forEach(function (asser) {
            results.push({
                "ID": asser,
                "Status": "fail"
            });
        });
        return false;
    }
}

function checkUniqueness(tdString) {

    // We check whether an interaction pattern exists and if it does, whether its terms are unique
    // then we put them together and check whether they are unique

    var x = jsonValidator.parse(tdString, false);

    // building the interaction name array for each interaction
    var tdInteractions = [];
    var tdProperties = [];
    var tdActions = [];
    var tdEvents = [];

    //check whether the propety exists before adding it to the tdProperties array

    

    if (td.hasOwnProperty("properties")) {
        //delete td.properties.status;
        tdProperties = Object.keys(td.properties);
        console.log(JSON.stringify(td));
        console.log(tdProperties);
        process.exit();
        var isDuplicate = (new Set(tdProperties)).size !== tdProperties.length;
        if (isDuplicate) {
            // console.log('Assertion td-unique-identifiers failed');
            results.push({
                "ID": "td-properties_uniqueness",
                "Status": "fail",
                "Comment": "duplicate property names"
            });
        } else {
            results.push({
                "ID": "td-properties_uniqueness",
                "Status": "pass",
                "Comment": ""
            });
        }
    } else {
        results.push({
            "ID": "td-properties_uniqueness",
            "Status": "not-impl",
            "Comment": "There are no properties so no need to talk about uniqueness"
        });
    }

    //same as above
    if (td.hasOwnProperty("actions")) {
        tdActions = Object.keys(td.actions);
        var isDuplicate = (new Set(tdActions)).size !== tdActions.length;
        if (isDuplicate) {
            // console.log('Assertion td-unique-identifiers failed');
            results.push({
                "ID": "td-actions_uniqueness",
                "Status": "fail",
                "Comment": "duplicate action names"
            });
        } else {
            results.push({
                "ID": "td-actions_uniqueness",
                "Status": "pass",
                "Comment": ""
            });
        }
    } else {
        results.push({
            "ID": "td-actions_uniqueness",
            "Status": "not-impl",
            "Comment": "There are no actions so no need to talk about uniqueness"
        });
    }

    //same as properties
    if (td.hasOwnProperty("events")) {
        tdEvents = Object.keys(td.events);
        var isDuplicate = (new Set(tdActions)).size !== tdActions.length;
        if (isDuplicate) {
            // console.log('Assertion td-unique-identifiers failed');
            results.push({
                "ID": "td-events_uniqueness",
                "Status": "fail",
                "Comment": "duplicate event names"
            });
        } else {
            results.push({
                "ID": "td-events_uniqueness",
                "Status": "pass",
                "Comment": ""
            });
        }
    } else {
        results.push({
            "ID": "td-events_uniqueness",
            "Status": "not-impl",
            "Comment": "There are no events so no need to talk about uniqueness"
        });
    }
    //put them together
    tdInteractions=tdInteractions.concat(tdProperties, tdActions, tdEvents);
    if (tdInteractions.length > 0) {
        // checking uniqueness of all the patterns
        var isDuplicate = (new Set(tdInteractions)).size !== tdInteractions.length;

        if (isDuplicate) {
            results.push({
                "ID": "td-unique-identifiers",
                "Status": "fail",
                "Comment": "duplicate interaction names"
            });
        } else {
            results.push({
                "ID": "td-unique-identifiers",
                "Status": "pass"
            });
        }
    } else {
        // no interactions so not impl
            results.push({
                "ID": "td-unique-identifiers",
                "Status": "not-impl",
                "Comment":"there are no interactions so we cannot talk about uniqueness"
            });
    }
    /*
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
        // console.log('Assertion td-unique-identifiers failed');
        results.push({
            "ID": "td-unique-identifiers",
            "Status": "fail",
            "Comment": "duplicate interaction names"
        });
    } else {
        // console.log('Assertion td-unique-identifiers passed');
        results.push({
            "ID": "td-unique-identifiers",
            "Status": "pass"
        });
    }*/
}