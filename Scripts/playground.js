const fs = require('fs');
const jsonld = require('jsonld');
var Ajv = require('ajv');
var path = require('path');

// Takes the second argument as the TD to validate


var storedTdAddress;
const schemaLocation = path.join(__dirname, '..', 'WebContent', 'td-schema.json');
const draftLocation = path.join(__dirname, '..', 'WebContent', 'json-schema-draft-07.json');

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


    //console.log(td);

    fs.readFile(schemaLocation, (err, schemaData) => {
        if (err) {
            console.error("JSON Schema could not be found at ", schemaLocation);
            throw err;
        };
        console.log("Taking Schema found at ", schemaLocation);
        var schema = JSON.parse(schemaData);

        fs.readFile(draftLocation, (err, draftData) => {
            if (err) {
                console.error("JSON Schema Draft could not be found at ", draftLocation);
                throw err;
            };
            console.log("Taking Schema Draft found at ", draftLocation);
            var draft = JSON.parse(draftData);

            var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
            // ajv.addMetaSchema(draft);
            ajv.addSchema(schema, 'td');

            // schema validation

            if (tdJson.hasOwnProperty('properties') || tdJson.hasOwnProperty('actions') || tdJson.hasOwnProperty('events')) {
                if (!tdJson.hasOwnProperty('base')) {
                    //no need to do something. Each href should be absolute
                    console.log(':) Tip: Without base, each href should be an absolute URL');
                }
            }
            var valid = ajv.validate('td', tdJson);
            //used to be var valid = ajv.validate('td', e.detail);
            if (valid) {

                console.log('JSON Schema validation... OK');
                checkEnumConst(tdJson);
                checkPropItems(tdJson);
                checkInteractions(tdJson);
                checkSecurity(tdJson);
                // checkUniqueness(tdJson);

            } else {

                console.log('X JSON Schema validation... KO:');
                //console.log(ajv.errors);

                //TODO: Handle long error messages in case of oneOf
                console.log('> ' + ajv.errorsText());
            }

            //json ld validation

            jsonld.toRDF(tdJson, {
                format: 'application/nquads'
            }, function (err, triples) {
                if (!err) {

                    console.log('JSON-LD validation... OK');

                } else {

                    console.log('X JSON-LD validation... KO:');
                    console.log('> ' + err);
                }
            });
        });
    });
});

function ValidURL(str) {
    var localAjv = Ajv();
    localAjv.addSchema({
        "type": "string",
        "format": "uri",
        "pattern": "(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(([^#]*))?(#(.*))?"
    }, 'url');
    return localAjv.validate('url', str);

}

//checking whether a data schema has enum and const at the same and displaying a warning in case there are
function checkEnumConst(td) {
    if (td.hasOwnProperty("properties")) {
        //checking properties
        tdProperties = Object.keys(td.properties);
        for (var i = 0; i < tdProperties.length; i++) {
            var curPropertyName = tdProperties[i];
            var curProperty = td.properties[curPropertyName];
            if (curProperty.hasOwnProperty("enum") && curProperty.hasOwnProperty("const")) {
                console.log('! Warning: In property ' + curPropertyName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');
            }
        }
    }
    //checking actions
    if (td.hasOwnProperty("actions")) {
        tdActions = Object.keys(td.actions);
        for (var i = 0; i < tdActions.length; i++) {
            var curActionName = tdActions[i];
            var curAction = td.actions[curActionName];
            if (curAction.hasOwnProperty("input")) {
                var curInput = curAction.input;
                if (curInput.hasOwnProperty("enum") && curInput.hasOwnProperty("const")) {
                    console.log('! Warning: In the input of action ' + curActionName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');
                }
            }
            if (curAction.hasOwnProperty("output")) {
                var curOutput = curAction.output;
                if (curOutput.hasOwnProperty("enum") && curOutput.hasOwnProperty("const")) {
                    console.warn('! Warning: In the output of action ' + curActionName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');

                }
            }
        }
    }
    //checking events
    if (td.hasOwnProperty("events")) {
        tdEvents = Object.keys(td.events);
        for (var i = 0; i < tdEvents.length; i++) {
            var curEventName = tdEvents[i];
            var curEvent = td.events[curEventName];
            if (curEvent.hasOwnProperty("enum") && curEvent.hasOwnProperty("const")) {
                console.log('! Warning: In event ' + curEventName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');

            }
        }
    }
    return;
}

//checking whether a data schema has object but not properties, array but no items
function checkPropItems(td) {
    if (td.hasOwnProperty("properties")) {
        //checking properties
        tdProperties = Object.keys(td.properties);
        for (var i = 0; i < tdProperties.length; i++) {
            var curPropertyName = tdProperties[i];
            var curProperty = td.properties[curPropertyName];

            if (curProperty.hasOwnProperty("type")) {
                if ((curProperty.type == "object") && !(curProperty.hasOwnProperty("properties"))) {
                    console.log('! Warning: In property ' + curPropertyName + ', the type is object but its properties are not specified');

                }
                if ((curProperty.type == "array") && !(curProperty.hasOwnProperty("items"))) {
                    console.log('! Warning: In property ' + curPropertyName + ', the type is array but its items are not specified');

                }
            }
        }
    }
    //checking actions
    if (td.hasOwnProperty("actions")) {
        tdActions = Object.keys(td.actions);
        for (var i = 0; i < tdActions.length; i++) {
            var curActionName = tdActions[i];
            var curAction = td.actions[curActionName];

            if (curAction.hasOwnProperty("input")) {
                var curInput = curAction.input;
                if (curInput.hasOwnProperty("type")) {
                    if ((curInput.type == "object") && !(curInput.hasOwnProperty("properties"))) {
                        console.log('! Warning: In the input of action ' + curActionName + ', the type is object but its properties are not specified');

                    }
                    if ((curInput.type == "array") && !(curInput.hasOwnProperty("items"))) {
                        console.log('! Warning: In the output of action ' + curActionName + ', the type is array but its items are not specified');

                    }
                }
            }
            if (curAction.hasOwnProperty("output")) {
                var curOutput = curAction.output;
                if (curOutput.hasOwnProperty("type")) {
                    if ((curOutput.type == "object") && !(curOutput.hasOwnProperty("properties"))) {
                        console.log('! Warning: In the output of action ' + curActionName + ', the type is object but its properties are not specified');

                    }
                    if ((curOutput.type == "array") && !(curOutput.hasOwnProperty("items"))) {
                        console.log('! Warning: In the output of action ' + curActionName + ', the type is array but its items are not specified');

                    }
                }
            }
        }
    }
    //checking events
    if (td.hasOwnProperty("events")) {
        tdEvents = Object.keys(td.events);
        for (var i = 0; i < tdEvents.length; i++) {
            var curEventName = tdEvents[i];
            var curEvent = td.events[curEventName];

            if (curEvent.hasOwnProperty("type")) {
                if ((curEvent.type == "object") && !(curEvent.hasOwnProperty("properties"))) {
                    console.log('! In event ' + curEventName + ', the type is object but its properties are not specified');

                }
                if ((curEvent.type == "array") && !(curEvent.hasOwnProperty("items"))) {
                    console.log('! In event ' + curEventName + ', the type is array but its items are not specified');

                }
            }

        }
    }
    return;
}

//checking whether the td contains interactions field that is remaining from the previous spec
function checkInteractions(td) {
    if (td.hasOwnProperty("interactions")) {
        console.log('! Warning: interactions are from the previous TD Specification, please use properties, actions, events instead');
    }
    if (td.hasOwnProperty("interaction")) {
        console.log('! Warning: interaction are from the previous TD Specification, please use properties, actions, events instead');

    }
    return;
}

function securityContains(parent, child) {

    //security anywhere could be a string or array. Convert string to array
    if (typeof child=="string"){
        child=[child];
    }
    return child.every(elem => parent.indexOf(elem) > -1);
}

function checkSecurity(td) {
    if (td.hasOwnProperty("securityDefinitions")) {
        var securityDefinitionsObject = td.securityDefinitions;
        var securityDefinitions = Object.keys(securityDefinitionsObject);
        var rootSecurity = td.security;

        if (securityContains(securityDefinitions, rootSecurity)) {
            // all good
        } else {
            console.log('KO Error: Security key in the root of the TD has security schemes not defined by the securityDefinitions');
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
                            console.log('KO Error: Security key in form ' + j + ' in property ' + curPropertyName + '  has security schemes not defined by the securityDefinitions');
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
                            console.log('KO Error: Security key in form ' + j + ' in action ' + curActionName + '  has security schemes not defined by the securityDefinitions');
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
                            console.log('KO Error: Security key in form ' + j + ' in event ' + curEventName + '  has security schemes not defined by the securityDefinitions');
                        }
                    }
                }

            }
        }
    } else {
        console.log('KO Error: securityDefinitions is mandatory');
    }
    return;
}

function checkUniqueness(td) {

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
    console.log(isDuplicate);
    if (isDuplicate) {
        console.log('KO Error: Duplicate names are not allowed in Interactions');
    }
    return;
}