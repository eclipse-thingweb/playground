const fs = require('fs');

var storedTdAddress;

process.argv.forEach(function (val, index, array) {
    //console.log(index + ': ' + val);
    if (index == 2) {
        storedTdAddress = val;
        console.log(storedTdAddress);
    }
});

fs.readFile(storedTdAddress, (err, data) => {
    if (err) {
        console.error("Thing Description could not be found")
        throw err
    };
    //console.log("hi");
    var td=JSON.parse(data);
    console.log(td);

    getJSON('td-schema-bundang-simple.json', function (schema) {
        ajv = Ajv();
        $.getJSON('json-schema-draft-06.json', function (draft) {
            ajv.addMetaSchema(draft);
            ajv.addSchema(schema, 'td');
            try {
                tdJson = JSON.parse(e.detail);
                log('JSON validation... OK');
            } catch (err) {
                if (err instanceof SyntaxError) {

                    log('X JSON validation... KO:');
                    log('> ' + err.message);
                }
            }

            // schema validation

            if (tdJson.hasOwnProperty('properties') || tdJson.hasOwnProperty('actions') || tdJson.hasOwnProperty('events')) {
                if (!tdJson.hasOwnProperty('base')) {
                    //no need to do something. Each href should be absolute
                    log(':) Tip: Without base, each href should be an absolute URL');
                } else {
                    //need to check if base finishes with / or not
                    //if it does, hrefs shouldnt start with it, if it doesnt, then hrefs must start with it
                    //QUESTION should there be separate schemas or transformation?
                    try {
                        tdJson = transformHref(tdJson);
                    } catch (err) {
                        log('X JSON Schema validation... KO:');
                        log('> ' + err);
                        return;
                    }
                }

            }
            var valid = ajv.validate('td', tdJson);
            //used to be var valid = ajv.validate('td', e.detail);
            if (valid) {

                log('JSON Schema validation... OK');
                checkEnumConst(tdJson);
                checkPropItems(tdJson);
                checkInteractions(tdJson);

            } else {
                
                log('X JSON Schema validation... KO:');
                //console.log(ajv.errors);
                log('> ' + ajv.errorsText());
            }

            jsonld.toRDF(e.detail, {
                format: 'application/nquads'
            }, function (err, triples) {
                if (!err) {

                    log('JSON-LD validation... OK');

                } else {

                    log('X JSON-LD validation... KO:');
                    log('> ' + err);
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
                    log('! Warning: forms is used instead of form at property' + curPropertyName);
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
                    log('! Warning: forms is used instead of form at action' + curActionName);
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
                    log('! Warning: forms is used instead of form at event' + curEventName);
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
                    log('! Warning: forms is used instead of form at property' + curPropertyName);
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
                    log('! Warning: forms is used instead of form at action' + curActionName);
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
                    log('! Warning: forms is used instead of form at event' + curEventName);
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
                
                log('! In property ' + curPropertyName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');
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
                    log('! In the input of action ' + curActionName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');
                }
            }
            if (curAction.hasOwnProperty("output")) {
                var curOutput = curAction.output;
                if (curOutput.hasOwnProperty("enum") && curOutput.hasOwnProperty("const")) {
                    log('! In the output of action ' + curActionName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');
                    
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
                log('! In event ' + curEventName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');
                
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
                    log('! In property ' + curPropertyName + ', the type is object but its properties are not specified');
                    
                }
                if ((curProperty.type == "array") && !(curProperty.hasOwnProperty("items"))) {
                    log('! In property ' + curPropertyName + ', the type is array but its items are not specified');
                    
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
                        log('! In the input of action ' + curActionName + ', the type is object but its properties are not specified');
                        
                    }
                    if ((curInput.type == "array") && !(curInput.hasOwnProperty("items"))) {
                        log('! In the output of action ' + curActionName + ', the type is array but its items are not specified');
                        
                    }
                }
            }
            if (curAction.hasOwnProperty("output")) {
                var curOutput = curAction.output;
                if (curOutput.hasOwnProperty("type")) {
                    if ((curOutput.type == "object") && !(curOutput.hasOwnProperty("properties"))) {
                        log('! In the output of action ' + curActionName + ', the type is object but its properties are not specified');
                       
                    }
                    if ((curOutput.type == "array") && !(curOutput.hasOwnProperty("items"))) {
                        log('! In the output of action ' + curActionName + ', the type is array but its items are not specified');
                        
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
                    log('! In event ' + curEventName + ', the type is object but its properties are not specified');
                    
                }
                if ((curEvent.type == "array") && !(curEvent.hasOwnProperty("items"))) {
                    log('! In event ' + curEventName + ', the type is array but its items are not specified');
                    
                }
            }

        }
    }
    return;
}

//checking whether the td contains interactions field that is remaining from the previous spec
function checkInteractions(td) {
    if (td.hasOwnProperty("interactions")) {
        log('interactions are from the previous TD Specification, please use properties, actions, events instead');
        
    }
    if (td.hasOwnProperty("interaction")) {
        log('interaction are from the previous TD Specification, please use properties, actions, events instead');
        
    }
    return;
}