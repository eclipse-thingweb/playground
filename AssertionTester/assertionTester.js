const fs = require('fs');
const jsonld = require('jsonld');
var Ajv = require('ajv');
const Json2csvParser = require('json2csv').Parser;

// Takes the second argument as the TD to validate

var storedTdAddress;

const draftLocation = "./AssertionTester/json-schema-draft-06.json";

const fields = ['ID', 'Status'];
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

            fs.readFile(schemaLocation, (err, schemaData) => {

                if (err) {
                    console.error("JSON Schema could not be found at ", schemaLocation);
                    throw err;
                };

                console.log("Taking Assertion Schema found at ", schemaLocation);
                var schema = JSON.parse(schemaData);

                // Validation starts here

                var ajv = new Ajv();
                ajv.addMetaSchema(draft);
                ajv.addSchema(schema, 'td');

                var valid = ajv.validate('td', tdJson);
                
                if (valid) {
                    console.log('Assertion '+ schema.title +' passed');
                    results.push({
                        "ID": schema.title,
                        "Status": "pass"
                    });

                } else {
                    
                    console.log('> ' + ajv.errorsText());
                    if (ajv.errorsText().indexOf("required") > -1) {
                        //failed because it doesnt have required key which is a non implemented feature
                        console.log('Assertion ' + schema.title + ' not implemented');
                        results.push({
                            "ID": schema.title,
                            "Status": "not-impl",
                            "additionalInfo": ajv.errorsText()
                        });
                    } else {
                        //failed because of some other reason
                        console.log('Assertion ' + schema.title + ' failed');
                        results.push({
                            "ID": schema.title,
                            "Status": "fail",
                            "additionalInfo": ajv.errorsText()
                        });
                    }
                }

                if (index == assertions.length-1) {
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
                }
            });
        });
    });
});
