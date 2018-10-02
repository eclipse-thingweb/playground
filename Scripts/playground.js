const fs = require('fs');
const jsonld = require('jsonld');
var Ajv = require('ajv');

// Takes the second argument as the TD to validate


var storedTdAddress;
const schemaLocation = "./WebContent/td-schema-lyon.json";
const draftLocation = "./WebContent/json-schema-draft-06.json";

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
            ajv.addMetaSchema(draft);
            ajv.addSchema(schema, 'td');
            // var validate = ajv.compile(schema);
            // var valid = validate(data);
            // if (!valid) console.log(validate.errors);
            // //OR
            // var valid = ajv.validate(schema, data);
            // if (!valid) console.log(ajv.errors);
            // //OR
            // var valid = ajv.addSchema(schema, 'mySchema')
            //     .validate('mySchema', data);
            // if (!valid) console.log(ajv.errorsText());

            // schema validation

            if (tdJson.hasOwnProperty('properties') || tdJson.hasOwnProperty('actions') || tdJson.hasOwnProperty('events')) {
                if (!tdJson.hasOwnProperty('base')) {
                    //no need to do something. Each href should be absolute
                    console.log(':) Tip: Without base, each href should be an absolute URL');
                } else {
                    //need to check if base finishes with / or not
                    //if it does, hrefs shouldnt start with it, if it doesnt, then hrefs must start with it
                    //QUESTION should there be separate schemas or transformation?
                    try {
                        tdJson = transformHref(tdJson);
                    } catch (err) {
                        console.error('X JSON Schema validation... KO:');
                        console.error('> ' + err);
                        throw err;
                    }
                }

            }
            var valid = ajv.validate('td', tdJson);
            //used to be var valid = ajv.validate('td', e.detail);
            if (valid) {

                console.log('JSON Schema validation... OK');
                checkEnumConst(tdJson);
                checkPropItems(tdJson);
                checkInteractions(tdJson);

            } else {

                console.error('X JSON Schema validation... KO:');
                //console.log(ajv.errors);
                console.error('> ' + ajv.errorsText());
            }

            //json ld validation

            jsonld.toRDF(tdJson, {
                format: 'application/nquads'
            }, function (err, triples) {
                if (!err) {

                    console.log('JSON-LD validation... OK');

                } else {

                    console.error('X JSON-LD validation... KO:');
                    console.error('> ' + err);
                }
            });

        });

    });
});

function transformHref(td) {
    if (td.base.slice(-1) == '/') { //getting the last element
        //hrefs should not start with /
        if (td.hasOwnProperty("properties")) {
            tdProperties = Object.keys(td.properties);
            for (var i = 0; i < tdProperties.length; i++) {
                var curPropertyName = tdProperties[i];
                var curProperty = td.properties[curPropertyName];
                if (curProperty.hasOwnProperty("forms")) {
                    var curFormArray = curProperty.forms;
                    for (var j = 0; j < curFormArray.length; j++) {
                        var curForm = curFormArray[j];
                        if (curForm.hasOwnProperty("href")) {
                            var curHref = curForm.href;
                            //check if it is already absolute
                            if (ValidURL(curHref)) {
                                //valid url no need to do anything
                            } else {
                                if (curHref.charAt(0) == '/') {
                                    throw "href at property " + curPropertyName + ", form " + j + " should NOT start with /";
                                } else {
                                    //no problem, transforming href into an absolute url
                                    td.properties[curPropertyName].forms[j].href = td.base + curHref;
                                }
                            }
                        } else { //href is mandatory
                            throw "missing href at property " + curPropertyName + ", form " + j;
                        }
                    }
                } else if (curProperty.hasOwnProperty("form")) {
                    console.warn('! Warning: forms is used instead of form at property' + curPropertyName);
                } else {
                    //form is not mandatory
                }
            }
        }
        //for actions
        if (td.hasOwnProperty("actions")) {
            tdActions = Object.keys(td.actions);
            for (var i = 0; i < tdActions.length; i++) {
                var curActionName = tdActions[i];
                var curAction = td.actions[curActionName];
                if (curAction.hasOwnProperty("forms")) {
                    var curFormArray = curAction.forms;
                    for (var j = 0; j < curFormArray.length; j++) {
                        var curForm = curFormArray[j];
                        if (curForm.hasOwnProperty("href")) {
                            var curHref = curForm.href;
                            //check if it is already absolute
                            if (ValidURL(curHref)) {
                                //valid url no need to do anything
                            } else {
                                if (curHref.charAt(0) == '/') {
                                    throw "href at action " + curActionName + ", form " + j + " should NOT start with /";
                                } else {
                                    //no problem, transforming href into an absolute url
                                    td.actions[curActionName].forms[j].href = td.base + curHref;
                                }
                            }
                        } else { //href is mandatory
                            throw "missing href at action " + curActionName + ", form " + j;
                        }
                    }
                } else if (curAction.hasOwnProperty("form")) {
                    console.warn('! Warning: forms is used instead of form at action' + curActionName);
                } else {
                    //form is not mandatory
                }
            }
        }
        //for events
        if (td.hasOwnProperty("events")) {
            tdEvents = Object.keys(td.events);
            for (var i = 0; i < tdEvents.length; i++) {
                var curEventName = tdEvents[i];
                var curEvent = td.events[curEventName];
                if (curEvent.hasOwnProperty("forms")) {
                    var curFormArray = curEvent.forms;
                    for (var j = 0; j < curFormArray.length; j++) {
                        var curForm = curFormArray[j];
                        if (curForm.hasOwnProperty("href")) {
                            var curHref = curForm.href;
                            //check if it is already absolute
                            if (ValidURL(curHref)) {
                                //valid url no need to do anything
                            } else {
                                if (curHref.charAt(0) == '/') {
                                    throw "href at event " + curEventName + ", form " + j + " should NOT start with /";
                                } else {
                                    //no problem, transforming href into an absolute url
                                    td.events[curEventName].forms[j].href = td.base + curHref;
                                }
                            }
                        } else { //href is mandatory
                            throw "missing href at event " + curEventName + ", form " + j;
                        }
                    }
                } else if (curEvent.hasOwnProperty("form")) {
                    console.warn('! Warning: forms is used instead of form at event' + curEventName);
                } else {
                    //form is not mandatory
                }
            }
        }
    } else {
        //hrefs should start with /
        //for properties
        if (td.hasOwnProperty("properties")) {
            tdProperties = Object.keys(td.properties);
            for (var i = 0; i < tdProperties.length; i++) {
                var curPropertyName = tdProperties[i];
                var curProperty = td.properties[curPropertyName];
                if (curProperty.hasOwnProperty("forms")) {
                    var curFormArray = curProperty.forms;
                    for (var j = 0; j < curFormArray.length; j++) {
                        var curForm = curFormArray[j];
                        if (curForm.hasOwnProperty("href")) {
                            var curHref = curForm.href;
                            //check if it is already absolute
                            if (ValidURL(curHref)) {
                                //valid url no need to do anything
                            } else {
                                if (curHref.charAt(0) == '/') {
                                    //no problem, transforming href into an absolute url
                                    td.properties[curPropertyName].forms[j].href = td.base + curHref;
                                } else {
                                    throw "href at property " + curPropertyName + ", form " + j + " should start with /";
                                }
                            }
                        } else { //href is mandatory
                            throw "missing href at property " + curPropertyName + ", form " + j;
                        }
                    }
                } else if (curProperty.hasOwnProperty("form")) {
                    console.warn('! Warning: forms is used instead of form at property' + curPropertyName);
                } else {
                    //form is not mandatory
                }
            }
        }
        //for actions
        if (td.hasOwnProperty("actions")) {
            tdActions = Object.keys(td.actions);
            for (var i = 0; i < tdActions.length; i++) {
                var curActionName = tdActions[i];
                var curAction = td.actions[curActionName];
                if (curAction.hasOwnProperty("forms")) {
                    var curFormArray = curAction.forms;
                    for (var j = 0; j < curFormArray.length; j++) {
                        var curForm = curFormArray[j];
                        if (curForm.hasOwnProperty("href")) {
                            var curHref = curForm.href;
                            //check if it is already absolute
                            if (ValidURL(curHref)) {
                                //valid url no need to do anything
                            } else {
                                if (curHref.charAt(0) == '/') {
                                    //no problem, transforming href into an absolute url
                                    td.actions[curActionName].forms[j].href = td.base + curHref;
                                } else {
                                    throw "href at action " + curActionName + ", form " + j + " should start with /";
                                }
                            }
                        } else { //href is mandatory
                            throw "missing href at action " + curActionName + ", form " + j;
                        }
                    }
                } else if (curAction.hasOwnProperty("form")) {
                    console.warn('! Warning: forms is used instead of form at action' + curActionName);
                } else {
                    //form is not mandatory
                }
            }
        }
        //for events
        if (td.hasOwnProperty("events")) {
            tdEvents = Object.keys(td.events);
            for (var i = 0; i < tdEvents.length; i++) {
                var curEventName = tdEvents[i];
                var curEvent = td.events[curEventName];
                if (curEvent.hasOwnProperty("forms")) {
                    var curFormArray = curEvent.forms;
                    for (var j = 0; j < curFormArray.length; j++) {
                        var curForm = curFormArray[j];
                        if (curForm.hasOwnProperty("href")) {
                            var curHref = curForm.href;
                            //check if it is already absolute
                            if (ValidURL(curHref)) {
                                //valid url no need to do anything
                            } else {
                                if (curHref.charAt(0) == '/') {
                                    //no problem, transforming href into an absolute url
                                    td.events[curEventName].forms[j].href = td.base + curHref;
                                } else {
                                    throw "href at event " + curEventName + ", form " + j + " should start with /";
                                }
                            }
                        } else { //href is mandatory
                            throw "missing href at event " + curEventName + ", form " + j;
                        }
                    }
                } else if (curEvent.hasOwnProperty("form")) {
                    console.warn('! Warning: forms is used instead of form at event' + curEventName);
                } else {
                    //form is not mandatory
                }
            }
        }
    }
    return td;
}

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
                console.warn('! Warning: In property ' + curPropertyName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');
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
                    console.warn('! Warning: In the input of action ' + curActionName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');
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
                console.warn('! Warning: In event ' + curEventName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');

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
                    console.warn('! Warning: In property ' + curPropertyName + ', the type is object but its properties are not specified');

                }
                if ((curProperty.type == "array") && !(curProperty.hasOwnProperty("items"))) {
                    console.warn('! Warning: In property ' + curPropertyName + ', the type is array but its items are not specified');

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
                        console.warn('! Warning: In the input of action ' + curActionName + ', the type is object but its properties are not specified');

                    }
                    if ((curInput.type == "array") && !(curInput.hasOwnProperty("items"))) {
                        console.warn('! Warning: In the output of action ' + curActionName + ', the type is array but its items are not specified');

                    }
                }
            }
            if (curAction.hasOwnProperty("output")) {
                var curOutput = curAction.output;
                if (curOutput.hasOwnProperty("type")) {
                    if ((curOutput.type == "object") && !(curOutput.hasOwnProperty("properties"))) {
                        console.warn('! Warning: In the output of action ' + curActionName + ', the type is object but its properties are not specified');

                    }
                    if ((curOutput.type == "array") && !(curOutput.hasOwnProperty("items"))) {
                        console.warn('! Warning: In the output of action ' + curActionName + ', the type is array but its items are not specified');

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
                    console.warn('! In event ' + curEventName + ', the type is object but its properties are not specified');

                }
                if ((curEvent.type == "array") && !(curEvent.hasOwnProperty("items"))) {
                    console.warn('! In event ' + curEventName + ', the type is array but its items are not specified');

                }
            }

        }
    }
    return;
}

//checking whether the td contains interactions field that is remaining from the previous spec
function checkInteractions(td) {
    if (td.hasOwnProperty("interactions")) {
        console.warn('interactions are from the previous TD Specification, please use properties, actions, events instead');

    }
    if (td.hasOwnProperty("interaction")) {
        console.warn('interaction are from the previous TD Specification, please use properties, actions, events instead');

    }
    return;
}