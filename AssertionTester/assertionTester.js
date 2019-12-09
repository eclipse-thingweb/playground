// Libraries
// libraries that can run only on a backend/script
const fs = require('fs');

// libraries that can also run in browser

// used to check whether the supplied data is utf8
const isUtf8 = require('is-utf8');
// A special JSON validator that is used only to check whether the given object has duplicate keys. The standard library doesn't detect duplicate keys and overwrites the first one with the second one.
var jsonValidator = require('json-dup-key-validator');
// The usual library used for validation
var Ajv = require('ajv');
const draftLocation = "./json-schema-draft-06.json"; // Used by AJV as the JSON Schema draft to rely on
const tdSchemaLocation = "../WebContent/td-schema.json"
// JSON to CSV and vice versa libraries
const Json2csvParser = require('json2csv').Parser;
const csvjson = require('csvjson');

// Building the CSV and its corresponding JSON structure
const fields = ['ID', 'Status', 'Comment'];
const json2csvParser = new Json2csvParser({
    fields
});

var outputLocation

// This is used to validate if the multi language JSON keys are valid according to the BCP47 spec
const bcp47pattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i; // eslint-disable-line max-len

//main logic

// getting the TDs to validate
var tdsToValidate = processArguments(process.argv);

//filling the assertions array
var assertionSchemas = collectAssertionSchemas("./Assertions/");

//fetching the manual.csv filled by the user
var manualAssertionsJSON = fetchManualAssertions("./manual.csv");

//fetching the JSON Schema Draft
var draftData = fs.readFileSync(draftLocation)
var draft = JSON.parse(draftData);

//fetching the TD Validation Schema
var tdSchemaData = fs.readFileSync(tdSchemaLocation);
var tdSchema = JSON.parse(tdSchemaData);

//validating all the TDs
tdsToValidate.forEach((tdToValidate)=>{
    //running the validation for a single TD
    var curCsvResults = []
    try {
        curCsvResults = validate(tdToValidate, assertionSchemas, manualAssertionsJSON, tdSchema, draft);
        if (!outputLocation) outputLocation = "./Results"
        toOutput(JSON.parse(tdToValidate).id, outputLocation, curCsvResults)
        console.log(curCsvResults);
    } catch (error) {
        //this needs to go to output
        console.log({
            "ID": error,
            "Status": "fail",
            "Comment":"Invalid TD"
        });
    }
});


// based on the given arguments to the string it returns an array, composed of raw buffer TDs
// in the meantime it fills the outputLocation global variable
function processArguments(argumentArray){
    // Takes the second argument as the TD location to validate
    var secondArgument;
    var returnArray =[]; //array of TDs to be returned. They are not parsed before returning

    if (argumentArray[2]) {
        //console.log("there is second arg");
        if (typeof argumentArray[2] === "string") {
            console.log("Taking input ", argumentArray[2]);
            secondArgument = argumentArray[2];
        } else {
            console.error("Second argument should be string");
            throw "Argument error";
        }
    } else {
        console.error("There is NO second argument, put the location of the TD or of the directory with TDs");
        throw "Argument error";
    }

    // in case there is a third argument for the output location of the results, assign it to the global outputLocation variable.
    if (argumentArray[3]) {
        if (typeof argumentArray[3] === "string") {
            console.log("Taking output ", argumentArray[3]);
            outputLocation = argumentArray[3];
        } else {
            console.error("Third argument should be string");
            throw "Argument error";
        }
    } 

    /*
    This try catch handles the case whether the script is run with a directory as a second argument or with a TD file
    In case it is a directory, all the TDs inside it will be added to the list of TDs to be validated
    Otherwise the array will contain only one Thing
    */
    try {
        // check if it is a directory
        var dirLocation = secondArgument;
        var tdLocationList = fs.readdirSync(dirLocation);
        console.log("Validating an Implementation with Multiple TDs")
        tdLocationList.forEach((curTDLocation) => {
            var curTDraw = fs.readFileSync(dirLocation+curTDLocation);
            returnArray.push(curTDraw)
        });
    } catch (error) {
        // not a directory so take the TD, hopefully
        console.log("Validating a single TD")
        var storedTdAddress = secondArgument;
        var curTDraw = fs.readFileSync(storedTdAddress);
        returnArray.push(curTDraw)
    }
    return returnArray;
}

// returns a JSON array containing JSON Objects corresponding to assertion JSON Schemas
function collectAssertionSchemas(assertionsDirectory){
    var assertionSchemas = [];
    var assertionsListLocation = fs.readdirSync(assertionsDirectory);
    assertionsListLocation.forEach((curAssertion, index) => {

        var schemaLocation = assertionsDirectory + curAssertion;
        var schemaRaw = fs.readFileSync(schemaLocation);
        var schemaJSON = JSON.parse(schemaRaw);
        assertionSchemas.push(schemaJSON);
    });
    return assertionSchemas;
}

// validates the TD in the first argument according to the assertions given in the second argument
// manual assertions given in the third argument are pushed to the end of the array after sorting the results array
// return is a JSON array of result JSON objects

//if there is a throw, it gives the failed assertion id
function validate(tdData, assertions, manualAssertions, tdSchema,schemaDraft) {
    // a JSON file that will be returned containing the result for each assertion as a JSON Object
    var results = [];
    console.log("=================================================================");

    // check whether it is a valid UTF-8 string
    if (isUtf8(tdData)) {
        results.push({
            "ID": "td-json-open_utf-8",
            "Status": "pass"
        });
    } else {
        throw "td-json-open_utf-8";
    }

    //check whether it is a valid JSON
    try {
        var tdJson = JSON.parse(tdData);
        results.push({
            "ID": "td-json-open",
            "Status": "pass"
        });
    } catch (error) {
        throw "td-json-open";
    }

    // checking whether two interactions of the same interaction affordance type have the same names
    // This requires to use the string version of the TD that will be passed down to the jsonvalidator library
    var tdDataString = tdData.toString();
    results = checkUniqueness(tdDataString,results);

    // Normal TD Schema validation but this allows us to test multiple assertions at once
    try {
        results = checkVocabulary(tdJson, results, tdSchema, schemaDraft);
    } catch (error) {
        console.log({
            "ID": error,
            "Status": "fail"
        });
        throw "Invalid TD"
    }

    // additional checks
    results = checkSecurity(tdJson,results);
    results = checkMultiLangConsistency(tdJson, results);

    // Iterating through assertions

    for (let index = 0; index < assertions.length; index++) {
        const curAssertion = assertions[index];
        
        var schema = curAssertion

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
    }

    results = mergeIdenticalResults(results);
    results = createParents(results);


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

    results = orderedResults.concat(manualAssertions);
    var csvResults = json2csvParser.parse(results);
    return csvResults;
}

function toOutput(tdId, outputLocation, csvResults) {

    var fileName = tdId.replace(/:/g, "_");

    fs.writeFile(outputLocation+"/result-" + fileName + ".csv", csvResults, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The result-" + fileName + ".csv is saved!");
    });
    
}

function mergeIdenticalResults(results) {
    // first generate a list of results that appear more than once
    // it should be a JSON object, keys are the assertion ids and the value is an array
    // while putting these results, remove them from the results FIRST
    // then for each key, find the resulting result: 
    //if one fail total fail, if one pass and no fail then pass, otherwise not-impl

    var identicalResults = {};
    results.forEach((curResult, index) => {
        var curId = curResult.ID;

        // remove this one, but add it back if there is no duplicate
        results.splice(index, 1);
        // check if there is a second one
        const identicalIndex = results.findIndex(x => x.ID === curId);

        if (identicalIndex > 0) { //there is a second one

            // check if it already exists
            if (identicalResults.hasOwnProperty(curId)) {
                // push if it already exists
                identicalResults[curId].push(curResult.Status)
            } else {
                // create a new array with values if it does not exist
                identicalResults[curId] = [curResult.Status]
            }
            // put it back such that the last identical can find its duplicate that appeared before
            results.unshift(curResult);
            // process.exit();
        } else {
            // if there is no duplicate, put it back into results but at the beginning 
            results.unshift(curResult);
        }
    });

    //get the keys to iterate through
    var identicalKeys = Object.keys(identicalResults)

    // iterate through each duplicate, calculate the new result, set the new result and then remove the duplicates 
    identicalKeys.forEach((curKey) => {
        var curResults = identicalResults[curKey];
        var newResult;

        if (curResults.indexOf("fail") >= 0) {
            newResult = "fail"
        } else if (curResults.indexOf("pass") >= 0) {
            newResult = "pass"
        } else {
            newResult = "not-impl"
        }
        //delete each of the duplicate
        while (results.findIndex(x => x.ID === curKey) >= 0) {
            results.splice(results.findIndex(x => x.ID === curKey), 1);
        }

        // push back the new result
        results.push({
            "ID": curKey,
            "Status": newResult,
            "Comment": "result of a merge"
        });

    });
    return results;
}

function createParents(results) {

    //create a json object with parent name keys and then each of them an array of children results

    var parentsJson = {};
    results.forEach((curResult, index) => {
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
    return results;
}

function checkUniqueness(tdString, results) {

    // Checking whether in one interaction pattern there are duplicate names, e.g. two properties called temp
    // However, if there are no properties then it is not-impl

    // jsonvalidator throws an error if there are duplicate names in the interaction level
    try {
        jsonValidator.parse(tdString, false);

        var td = JSON.parse(tdString);

        // no problem in interaction level
        var tdInteractions = [];

        // checking whether there are properties at all, if not uniqueness is not impl
        if (td.hasOwnProperty("properties")) {
            tdInteractions = tdInteractions.concat(Object.keys(td.properties));
            // then we can add unique properties pass 
            results.push({
                "ID": "td-properties_uniqueness",
                "Status": "pass",
                "Comment": ""
            });
        } else {
            // then we add unique properties as not impl
            results.push({
                "ID": "td-properties_uniqueness",
                "Status": "not-impl",
                "Comment": "no properties"
            });
        }

        // similar to just before, checking whether there are actions at all, if not uniqueness is not impl
        if (td.hasOwnProperty("actions")) {
            tdInteractions = tdInteractions.concat(Object.keys(td.actions));
            results.push({
                "ID": "td-actions_uniqueness",
                "Status": "pass",
                "Comment": ""
            });
        } else {
            // then we add unique actions as not impl
            results.push({
                "ID": "td-actions_uniqueness",
                "Status": "not-impl",
                "Comment": "no actions"
            });
        }

        // similar to just before, checking whether there are events at all, if not uniqueness is not impl
        if (td.hasOwnProperty("events")) {
            tdInteractions = tdInteractions.concat(Object.keys(td.events));
            results.push({
                "ID": "td-events_uniqueness",
                "Status": "pass",
                "Comment": ""
            });
        } else {
            // then we add unique events as not impl
            results.push({
                "ID": "td-events_uniqueness",
                "Status": "not-impl",
                "Comment": "no events"
            });
        }

        return results;

    } catch (error) {
        // there is a duplicate somewhere

        // convert it into string to be able to process it
        // error is of form = Error: Syntax error: duplicated keys "overheating" near ting": {
        var errorString = error.toString();
        // to get the name, we need to remove the quotes around it
        var startQuote = errorString.indexOf('"');
        // slice to remove the part before the quote
        var restString = errorString.slice(startQuote + 1);
        // find where the interaction name ends
        var endQuote = restString.indexOf('"');
        // finally get the interaction name
        var interactionName = restString.slice(0, endQuote);

        //trying to find where this interaction is and put results accordingly
        var td = JSON.parse(tdString);

        if (td.hasOwnProperty("properties")) {
            var tdProperties = td.properties;
            if (tdProperties.hasOwnProperty(interactionName)) {
                //duplicate was at properties but that fails the td-unique identifiers as well
                // console.log("at property");
                results.push({
                    "ID": "td-properties_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate property names"
                });
                // since JSON.parse removes duplicates, we replace the duplicate name with duplicateName
                tdString = tdString.replace(interactionName, "duplicateName");

            } else {
                // there is duplicate but not here, so pass
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
                "Comment": "no properties"
            });
        }

        if (td.hasOwnProperty("actions")) {
            var tdActions = td.actions;
            if (tdActions.hasOwnProperty(interactionName)) {
                //duplicate was at actions but that fails the td-unique identifiers as well
                // console.log("at action");
                results.push({
                    "ID": "td-actions_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate action names"
                });
                // since JSON.parse removes duplicates, we replace the duplicate name with duplicateName
                tdString = tdString.replace(interactionName, "duplicateName");
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
                "Comment": "no actions"
            });
        }

        if (td.hasOwnProperty("events")) {
            var tdEvents = td.events;
            if (tdEvents.hasOwnProperty(interactionName)) {
                //duplicate was at events but that fails the td-unique identifiers as well
                // console.log("at event");
                results.push({
                    "ID": "td-events_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate event names"
                });
                // since JSON.parse removes duplicates, we replace the duplicate name with duplicateName
                tdString = tdString.replace(interactionName, "duplicateName");
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
                "Comment": "no events"
            });
        }

        return results;
    }
}

function checkVocabulary(tdJson, results, tdSchema, schemaDraft) {
    /*
    Validates the following assertions:
    td - processor
    td-objects:securityDefinitions
    td-arrays:security
    td:security
    td-security-mandatory
    */


    var ajv = new Ajv();
    ajv.addMetaSchema(draft);
    ajv.addSchema(tdSchema, 'td');

    var valid = ajv.validate('td', tdJson);
    var otherAssertions = ["td-objects_securityDefinitions", "td-arrays_security", "td-vocab-security--Thing", "td-security-mandatory", "td-vocab-securityDefinitions--Thing", "td-context-toplevel", "td-vocab-title--Thing", "td-vocab-security--Thing", "td-vocab-id--Thing", "td-security", "td-security-activation", "td-context-ns-thing-mandatory", "td-map-type", "td-array-type", "td-class-type", "td-string-type", "td-security-schemes"];

    if (valid) {
        results.push({
            "ID": "td-processor",
            "Status": "pass",
        });

        otherAssertions.forEach(function (asser) {
            results.push({
                "ID": asser,
                "Status": "pass"
            });
        });
        return results;

    } else {
        // console.log("VALIDATION ERROR!!! : ", ajv.errorsText());
        // results.push({
        //     "ID": "td-processor",
        //     "Status": "fail",
        //     "Comment": "invalid TD"
        // });
        // otherAssertions.forEach(function (asser) {
        //     results.push({
        //         "ID": asser,
        //         "Status": "fail"
        //     });
        // });
        throw "invalid TD";
    }
}

function fetchManualAssertions(manualCsvLocation) {
    var manualCsv = fs.readFileSync(manualCsvLocation).toString();

    var options = {
        delimiter: ',', // optional
        quote: '"' // optional
    };

    var manualJSON = csvjson.toObject(manualCsv, options);
    return manualJSON;
}

function securityContains(parent, child) {

    //security anywhere could be a string or array. Convert string to array
    if (typeof child == "string") {
        child = [child];
    }
    return child.every(elem => parent.indexOf(elem) > -1);
}

function checkSecurity(td,results) {
    if (td.hasOwnProperty("securityDefinitions")) {
        var securityDefinitionsObject = td.securityDefinitions;
        var securityDefinitions = Object.keys(securityDefinitionsObject);


        var rootSecurity = td.security;

        if (securityContains(securityDefinitions, rootSecurity)) {
            // all good
        } else {
            results.push({
                "ID": "td-security-scheme-name",
                "Status": "fail",
                "Comment": "used a non defined security scheme in root level"
            });
            return results;
        }

        if (td.hasOwnProperty("properties")) {
            //checking security in property level
            tdProperties = Object.keys(td.properties);
            for (var i = 0; i < tdProperties.length; i++) {
                var curPropertyName = tdProperties[i];
                var curProperty = td.properties[curPropertyName];

                // checking security in forms level
                var curForms = curProperty.forms;
                for (var j = 0; j < curForms.length; j++) {
                    var curForm = curForms[j];
                    if (curForm.hasOwnProperty("security")) {
                        var curSecurity = curForm.security;
                        if (securityContains(securityDefinitions, curSecurity)) {
                            // all good
                        } else {
                            results.push({
                                "ID": "td-security-scheme-name",
                                "Status": "fail",
                                "Comment": "used a non defined security scheme in a property form"
                            });
                            return results;
                        }
                    }
                }
            }
        }

        if (td.hasOwnProperty("actions")) {
            //checking security in action level
            tdActions = Object.keys(td.actions);
            for (var i = 0; i < tdActions.length; i++) {
                var curActionName = tdActions[i];
                var curAction = td.actions[curActionName];

                // checking security in forms level 
                var curForms = curAction.forms;
                for (var j = 0; j < curForms.length; j++) {
                    var curForm = curForms[j];
                    if (curForm.hasOwnProperty("security")) {
                        var curSecurity = curForm.security;
                        if (securityContains(securityDefinitions, curSecurity)) {
                            // all good
                        } else {
                            results.push({
                                "ID": "td-security-scheme-name",
                                "Status": "fail",
                                "Comment": "used a non defined security scheme in an action form"
                            });
                            return results;
                        }
                    }
                }

            }
        }

        if (td.hasOwnProperty("events")) {
            //checking security in event level
            tdEvents = Object.keys(td.events);
            for (var i = 0; i < tdEvents.length; i++) {
                var curEventName = tdEvents[i];
                var curEvent = td.events[curEventName];

                // checking security in forms level
                var curForms = curEvent.forms;
                for (var j = 0; j < curForms.length; j++) {
                    var curForm = curForms[j];
                    if (curForm.hasOwnProperty("security")) {
                        var curSecurity = curForm.security;
                        if (securityContains(securityDefinitions, curSecurity)) {
                            // all good
                        } else {
                            results.push({
                                "ID": "td-security-scheme-name",
                                "Status": "fail",
                                "Comment": "used a non defined security scheme in an event form"
                            });
                            return results;
                        }
                    }
                }

            }
        }

        //no security used non defined scheme, passed test
        results.push({
            "ID": "td-security-scheme-name",
            "Status": "pass"
        });
        return results;

    } else {}
    return results;
}

function checkMultiLangConsistency(td, results) {

    // this checks whether all titles and descriptions have the same language fields 
    // so the object keys of a titles and of a descriptions should be the same already, then everywhere else they should also be the same

    // first collect them all, and then compare them

    var multiLang = []; //an array of arrays where each small array has the multilang keys
    var is_td_titles_descriptions = []; // an array of boolean values to check td-titles-descriptions assertion

    // checking root
    if (td.hasOwnProperty("titles")) {
        var rootTitlesObject = td.titles;
        var rootTitles = Object.keys(rootTitlesObject);
        multiLang.push(rootTitles);
        //checking for td-titles-descriptions
        is_td_titles_descriptions.push({["root_title"]: isStringObjectKeyValue(td.title, rootTitlesObject)});
    }

    if (td.hasOwnProperty("descriptions")) {
        var rootDescriptionsObject = td.descriptions;
        var rootDescriptions = Object.keys(rootDescriptionsObject);
        multiLang.push(rootDescriptions);
        // check whether description exists in descriptions
        if (td.hasOwnProperty("description")) is_td_titles_descriptions.push({["root_description"]: isStringObjectKeyValue(td.description, rootDescriptionsObject)})
    }

    // checking inside each interaction
    if (td.hasOwnProperty("properties")) {
        //checking security in property level
        tdProperties = Object.keys(td.properties);
        for (var i = 0; i < tdProperties.length; i++) {
            var curPropertyName = tdProperties[i];
            var curProperty = td.properties[curPropertyName];

            if (curProperty.hasOwnProperty("titles")) {
                var titlesKeys = Object.keys(curProperty.titles);
                multiLang.push(titlesKeys);
                //checking if title exists in titles
                if (curProperty.hasOwnProperty("title")) is_td_titles_descriptions.push({["property_"+curPropertyName + "_title"]: isStringObjectKeyValue(curProperty.title, curProperty.titles)})
            }

            if (curProperty.hasOwnProperty("descriptions")) {
                var descriptionsKeys = Object.keys(curProperty.descriptions);
                multiLang.push(descriptionsKeys);
                // checking if description exists in descriptions
                if (curProperty.hasOwnProperty("description")) is_td_titles_descriptions.push({["property_" + curPropertyName + "_desc"]: isStringObjectKeyValue(curProperty.description, curProperty.descriptions)
                })
            }
        }
    }

    if (td.hasOwnProperty("actions")) {
        //checking security in action level
        tdActions = Object.keys(td.actions);
        for (var i = 0; i < tdActions.length; i++) {
            var curActionName = tdActions[i];
            var curAction = td.actions[curActionName];

            if (curAction.hasOwnProperty("titles")) {
                var titlesKeys = Object.keys(curAction.titles);
                multiLang.push(titlesKeys);
                //checking if title exists in titles
                if (curAction.hasOwnProperty("title")) is_td_titles_descriptions.push({["action_" + curActionName + "_title"]: isStringObjectKeyValue(curAction.title, curAction.titles)
                })
            }

            if (curAction.hasOwnProperty("descriptions")) {
                var descriptionsKeys = Object.keys(curAction.descriptions);
                multiLang.push(descriptionsKeys);
                // checking if description exists in descriptions
                if (curAction.hasOwnProperty("description")) is_td_titles_descriptions.push({["action_" + curActionName + "_desc"]: isStringObjectKeyValue(curAction.description, curAction.descriptions)
                            })
            }

        }
    }

    if (td.hasOwnProperty("events")) {
        //checking security in event level
        tdEvents = Object.keys(td.events);
        for (var i = 0; i < tdEvents.length; i++) {
            var curEventName = tdEvents[i];
            var curEvent = td.events[curEventName];

            if (curEvent.hasOwnProperty("titles")) {
                var titlesKeys = Object.keys(curEvent.titles);
                multiLang.push(titlesKeys);
                //checking if title exists in titles
                if (curEvent.hasOwnProperty("title")) is_td_titles_descriptions.push({["event_" + curEventName + "_title"]: isStringObjectKeyValue(curEvent.title, curEvent.titles)
                            })
            }

            if (curEvent.hasOwnProperty("descriptions")) {
                var descriptionsKeys = Object.keys(curEvent.descriptions);
                multiLang.push(descriptionsKeys);
                // checking if description exists in descriptions
                if (curEvent.hasOwnProperty("description")) is_td_titles_descriptions.push({["event_" + curEventName + "_desc"]: isStringObjectKeyValue(curEvent.description, curEvent.descriptions)
                })
            }

        }
    }
    if(arrayArraysItemsEqual(multiLang)){
        results.push({
            "ID": "td-multi-languages-consistent",
            "Status": "pass"
        });
    } else {
        results.push({
            "ID": "td-multi-languages-consistent",
            "Status": "fail",
            "Comment": "not all multilang objects have same language tags"
        });
    }

    var flatArray = []; //this is multiLang but flat, so just a single array. This way we can have scan the whole thing at once and then find the element that is not bcp47
    for (let index = 0; index < multiLang.length; index++) {
        var arrayElement = multiLang[index];
        arrayElement=JSON.parse(arrayElement);
        for (let index = 0; index < arrayElement.length; index++) {
            const stringElement = arrayElement[index];
            flatArray.push(stringElement);
        }
    }
    var isBCP47 = checkBCP47array(flatArray);
    if(isBCP47=="ok"){
        results.push({
            "ID": "td-multilanguage-language-tag",
            "Status": "pass"
        });
    } else {
        results.push({
            "ID": "td-multilanguage-language-tag",
            "Status": "fail",
            "Comment":isBCP47+" is not a BCP47 tag"
        });
    }

    //checking td-context-default-language-direction-script assertion
    results.push({
        "ID": "td-context-default-language-direction-script",
        "Status": checkAzeri(flatArray)
    });

    // checking td-titles-descriptions assertion
    // if there are no multilang, then it is not impl
    if(is_td_titles_descriptions.length==0){
        results.push({
            "ID": "td-titles-descriptions",
            "Status": "not-impl",
            "Comment": "no multilang objects in the td"
        });
        return results;
    }

    // if at some point there was a false result, it is a fail
    for (let index = 0; index < is_td_titles_descriptions.length; index++) {
        const element = is_td_titles_descriptions[index];
        var elementName = Object.keys(element);

        if(element[elementName]){
            // do nothing it is correct
        } else {
            results.push({
                "ID": "td-titles-descriptions",
                "Status": "fail",
                "Comment": elementName+" is not on the multilang object at the same level"
            });
            return results;
        }
    }
    //there was no problem, so just put pass
    results.push({
        "ID": "td-titles-descriptions",
        "Status": "pass"
    });
    
    // ? nothing after this, there is return above
    return results;
}

// checks if an array that contains only arrays as items is composed of same items
function arrayArraysItemsEqual(myArray) {
    if(myArray.length==0) return true;
    //first stringify each array item
    for (var i = myArray.length; i--;) {
        myArray[i] = JSON.stringify(myArray[i])
    }

    for (var i = myArray.length; i--;) {
        if (i == 0) {
            return true;
        }
        if (myArray[i] !== myArray[i - 1]){
            return false;
        }
    }
}

// checks whether the items of an array, which must be strings, are valid language tags
function checkBCP47array(myArray){
    // return tag name if one is not valid during the check

    for (let index = 0; index < myArray.length; index++) {
        const element = myArray[index];
        if (bcp47pattern.test(element)) {
            //keep going
        } else {
            return element;
        }
    } 
    
    // return true if reached the end
    return "ok";
}

function isStringObjectKeyValue(searchedString, searchedObject){
    // checks whether a given string exist as the value of key in an object
    var objKeys = Object.keys(searchedObject);
    if(objKeys.length==0) return false; // if the object is empty, then the string cannot exist here
    for (let index = 0; index < objKeys.length; index++) {
        const element = objKeys[index];
        if (searchedObject[element] == searchedString) {
            return true; // found where the string is in the object
        } else {
            //nothing keep going, maybe in another key
        }
    }
    return false;
}

// checks whether an azeri language tag also specifies the version (Latn or Arab).
// basically if the language is called "az", it is invalid, if it is az-Latn or az-Arab it is valid.
function checkAzeri(myMultiLangArray){
    for (let index = 0; index < myMultiLangArray.length; index++) {
        const element = myMultiLangArray[index];
        if (element =="az"){
            return "fail"
        } else if ((element == "az-Latn") || (element == "az-Arab")){
            return "pass"
        }
    }
    // no azeri, so it is not implemented
    return "not-impl"
}