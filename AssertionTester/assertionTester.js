const fs = require('fs');
var Ajv = require('ajv');
const Json2csvParser = require('json2csv').Parser;

var secondArgument;

const draftLocation = "./json-schema-draft-06.json";

const fields = ['ID', 'Status', 'additionalInfo'];
const json2csvParser = new Json2csvParser({
    fields
});
var results = [];

const nonImplementedAssertions = ["td-form-protocolbindings", "td-security-binding", "td-security-no-extras", "td-data-schema-objects", "td-media-type", "td-readOnly-observable-writeOnly-default", "td-readOnly-observable-default", "td-content-type-default", "client-data-schema", "client-uri-template","server-data-schema","server-data-schema-extras","client-data-schema-accept-extras","client-data-schema-no-extras","server-uri-template"];
// Takes the second argument as the TD to validate

if (process.argv[2]) {
    //console.log("there is second arg");
    if (typeof process.argv[2] === "string") {
        console.log("Taking argument ", process.argv[2]);
        secondArgument = process.argv[2];
    } else {
        console.error("Second argument should be string");
        throw "Argument error";
    }
} else {
    console.error("There is NO second argument, put the location of the TD or of the directory with TDs");
    throw "Argument error";
}

try {
    // check if it is a directory
    var dirLocation = secondArgument;
    var tdList = fs.readdirSync(dirLocation);
    console.log("Validating an Implementation with Multiple TDs")
    tdList.forEach((curTD, index) => {
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

function validate(storedTdAddress) {
    console.log("=================================================================")
    console.log("Taking TD found at ", storedTdAddress, " for validation");
    var tdData = fs.readFileSync(storedTdAddress);
    try {
        var tdJson = JSON.parse(tdData);
        console.log('JSON validation... OK');
    } catch (err) {
        console.error('X JSON validation... KO:');
        console.error('> ' + err.message);
        throw err;
    }

    var test = doLeftOutChecks(tdJson);
    console.log("test result is ", test);
    if (!test){
        console.log("INVALID TD STOPPING")
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
                    // console.log('Assertion ' + schema.title + ' failed');
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
            // create parent assertions
            createParents(results);
            //sort the results

            // Push the non implemented assertions
            nonImplementedAssertions.forEach((curNonImpl)=>{
                results.push({
                    "ID": curNonImpl,
                    "Status": "null",
                    "additionalInfo": "not testable with Assertion Tester"
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

            console.log(csvResults);
            results = [];

            var fileName = tdJson.id.replace(/:/g, "_");
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
                    "additionalInfo": "Error message can be seen in the children assertions"
                });
                break;
            } else if (curChild.Status == "not-impl") {
                //push not-impl and break, i.e stop going through children, we are done here!
                results.push({
                    "ID": curParentName,
                    "Status": "not-impl",
                    "additionalInfo": "Error message can be seen in the children assertions"
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


function doLeftOutChecks(td) {

    checkUniqueness(td);
    return checkVocabulary(td);
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
            "additionalInfo": "invalid TD"
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

function checkUniqueness(td) {

    var otherAssertions = ["td-properties_uniqueness", "td-actions_uniqueness", "td-events_uniqueness"];

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
        // console.log('Assertion td-unique-identifiers failed');
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
        // console.log('Assertion td-unique-identifiers passed');
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