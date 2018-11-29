const fs = require('fs');
const jsonld = require('jsonld');
var Ajv = require('ajv');
const Json2csvParser = require('json2csv').Parser;

// Takes the second argument as the TD to validate


var storedTdAddress;

const draftLocation = "./AssertionTester/json-schema-draft-06.json";

const fields = ['assertion-id', 'result'];
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

    var schemaLocation = "./AssertionTester/Assertions/td-additional-contexts.json";
    //console.log(td);

    fs.readFile(draftLocation, (err, draftData) => {
        if (err) {
            console.error("JSON Schema Draft could not be found at ", draftLocation);
            throw err;
        };
        console.log("Taking Schema Draft found at ", draftLocation);
        var draft = JSON.parse(draftData);

        fs.readFile(schemaLocation, (err, schemaData) => {
                    
            if (err) {
                console.error("JSON Schema could not be found at ", schemaLocation);
                throw err;
            };
            console.log("Taking Assertion Schema found at ", schemaLocation);
            var schema = JSON.parse(schemaData);

            // Validation starts here

            var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
            ajv.addMetaSchema(draft);
            ajv.addSchema(schema, 'td');

            var valid = ajv.validate('td', tdJson);
            //used to be var valid = ajv.validate('td', e.detail);
            if (valid) {
                console.log('JSON Schema validation... OK');
                results.push({
                    "assertion-id": schema.title,
                    "result": "pass"
                });

            } else {
                console.log('X JSON Schema validation... KO:');
                //console.log(ajv.errors);
                console.log('> ' + ajv.errorsText());
                if (ajv.errorsText().indexOf("required") > -1) {
                    //failed because it doesnt have required thingy
                    results.push({
                        "assertion-id": schema.title,
                        "result": "not-impl",
                        "additionalInfo": ajv.errorsText()
                    });
                } else {
                    //failed because of some other reason
                    results.push({
                        "assertion-id": schema.title,
                        "result": "fail",
                        "additionalInfo": ajv.errorsText()
                    });
                }
            }

            console.log(results);
            var csv = json2csvParser.parse(results);

            console.log(csv);

            fs.writeFile("./AssertionTester/Results/result.json", JSON.stringify(results), function (err) {
                if (err) {
                    return console.log(err);
                }

                console.log("The result json was saved!");
            });

            fs.writeFile("./AssertionTester/Results/result.csv", csv, function (err) {
                if (err) {
                    return console.log(err);
                }

                console.log("The result csv was saved!");
            });
        });

    });
});