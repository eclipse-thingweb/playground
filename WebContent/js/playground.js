/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2016 Victor Charpenay
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */
var ajv; /* JSON Schema validator */
var tdJson;

function trigger(name, data) {
    var ev = new CustomEvent(name, {
        detail: data
    });

    document.dispatchEvent(ev);
}

function light(success, id) {
    var circle = $('#' + id);
    circle.css('visibility', 'visible');
    if (success == 'OK') {
        color = 'green'
    } else if (success == 'KO') {
        color = 'red'
    } else if (success == 'WARNING') {
        color = 'orange'
    } else {
        color = 'black'
    }
    //var color = success ? 'green' : 'red';
    circle.attr('fill', color);
}

function reset(id) {
    var circle = $('#' + id);
    circle.css('visibility', 'hidden');
}

function validate() {
    var text = $('#td-text').val();
    reset('spot-json');
    reset('spot-simple-json-schema');
    reset('spot-full-json-schema');
    reset('spot-json-ld');
    reset('spot-add');
    trigger('validate-json', text);
}

function log(message) {
    var pgConsole = $('#console');
    pgConsole.append(message + '&#13;&#10;');
}

function clearLog() {
    var pgConsole = $('#console');
    pgConsole.empty();
    pgConsole.append("Reset! Waiting for validation... " + '&#13;&#10;');
    reset('spot-json');
    reset('spot-simple-json-schema');
    reset('spot-full-json-schema');
    reset('spot-json-ld');
    reset('spot-add');
}

$(function () {

    $('#td-text').linedtextarea();
    $.getJSON('td-schema.json', function (schema) {


        $.getJSON('td-schema-full.json', function (schemaFull) {

            ajv = Ajv();
            $.getJSON('json-schema-draft-06.json', function (draft) {

                ajv.addMetaSchema(draft);
                ajv.addSchema(schema, 'td');
                ajv.addSchema(schemaFull, 'td-full');

                document.addEventListener('validate-json', function (e) {
                    try {
                        log('------- New Validation Started -------');
                        tdJson = JSON.parse(e.detail);
                        light('OK', 'spot-json');
                        log('JSON validation... OK');
                        trigger('validate-simple-json-schema', tdJson);
                    } catch (err) {
                        console.log(err);
                        if (err instanceof SyntaxError) {
                            light('KO', 'spot-json');
                            log('X JSON validation... KO:');
                            log('> ' + err.message);
                        }
                    }
                }, false);

                document.addEventListener('validate-simple-json-schema', function (e) {
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
                                light('KO', 'spot-simple-json-schema');
                                log('X JSON Schema validation... KO:');
                                log('> ' + err);
                                return;
                            }
                        }

                    }

                    var valid = ajv.validate('td', tdJson);
                    //used to be var valid = ajv.validate('td', e.detail);
                    if (valid) {
                        light('OK', 'spot-simple-json-schema');
                        log('JSON Schema validation... OK');
                        trigger('validate-full-json-schema', tdJson);
                    } else {
                        light('KO', 'spot-simple-json-schema');
                        log('X JSON Schema validation... KO:');
                        //console.log(ajv.errors);
                        log('> ' + ajv.errorsText());
                        console.log(JSON.stringify(ajv.errors));
                    }


                }, false);

                document.addEventListener('validate-full-json-schema', function (e) {
                    var tdJson = e.detail;
                    var valid = ajv.validate('td-full', tdJson);
                    //used to be var valid = ajv.validate('td', e.detail);
                    if (valid) {
                        light('OK', 'spot-full-json-schema');
                        log('Optional validation... OK');
                        trigger('validate-json-ld', tdJson);
                    } else {
                        light('WARNING', 'spot-full-json-schema');
                        log('Optional validation... KO:');
                        //console.log(ajv.errors);
                        log('> ' + ajv.errorsText());
                        console.log(JSON.stringify(ajv.errors));
                        trigger('validate-json-ld', tdJson);
                    }


                }, false);

                document.addEventListener('validate-json-ld', function (e) {
                    jsonld.toRDF(e.detail, {
                        format: 'application/nquads'
                    }, function (err, triples) {
                        if (!err) {
                            light('OK', 'spot-json-ld');
                            log('JSON-LD validation... OK');
                            trigger('validate-add', triples);
                        } else {
                            light('KO', 'spot-json-ld');
                            log('X JSON-LD validation... KO:');
                            log('> ' + err);
                            trigger('validate-add', triples);
                        }
                    });
                }, false);

                document.addEventListener('validate-add', function (e) {

                    log('Additional checks...');

                    light('OK', 'spot-add');

                    //can produce only warning
                    checkEnumConst(tdJson);
                    checkPropItems(tdJson);
                    checkInteractions(tdJson);

                    //can produce error
                    checkSecurity(tdJson);
                    checkUniqueness(tdJson);

                    var pattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i; // eslint-disable-line max-len
                    console.log(pattern.test(tdJson.title))

                }, false);

                $('#td-validate').removeAttr('disabled');
            });
        });
    });
});
/*
This function checks whether hrefs are combinable with the base uri and then combines them
*/
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
                light('WARNING', 'spot-add');
                log('! In property ' + curPropertyName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');
                return false;
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
                    light('WARNING', 'spot-add');
                }
            }
            if (curAction.hasOwnProperty("output")) {
                var curOutput = curAction.output;
                if (curOutput.hasOwnProperty("enum") && curOutput.hasOwnProperty("const")) {
                    log('! In the output of action ' + curActionName + ' enum and const are used at the same time, the values in enum can never be valid in the received JSON value');
                    light('WARNING', 'spot-add');
                    return false;
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
                light('WARNING', 'spot-add');
                return false;
            }
        }
    }
    return true;
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
                    light('WARNING', 'spot-add');
                    return false;
                }
                if ((curProperty.type == "array") && !(curProperty.hasOwnProperty("items"))) {
                    log('! In property ' + curPropertyName + ', the type is array but its items are not specified');
                    light('WARNING', 'spot-add');
                    return false;
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
                        light('WARNING', 'spot-add');
                        return false;
                    }
                    if ((curInput.type == "array") && !(curInput.hasOwnProperty("items"))) {
                        log('! In the output of action ' + curActionName + ', the type is array but its items are not specified');
                        light('WARNING', 'spot-add');
                        return false;
                    }
                }
            }
            if (curAction.hasOwnProperty("output")) {
                var curOutput = curAction.output;
                if (curOutput.hasOwnProperty("type")) {
                    if ((curOutput.type == "object") && !(curOutput.hasOwnProperty("properties"))) {
                        log('! In the output of action ' + curActionName + ', the type is object but its properties are not specified');
                        light('WARNING', 'spot-add');
                        return false;
                    }
                    if ((curOutput.type == "array") && !(curOutput.hasOwnProperty("items"))) {
                        log('! In the output of action ' + curActionName + ', the type is array but its items are not specified');
                        light('WARNING', 'spot-add');
                        return false;
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
                    light('WARNING', 'spot-add');
                    return false;
                }
                if ((curEvent.type == "array") && !(curEvent.hasOwnProperty("items"))) {
                    log('! In event ' + curEventName + ', the type is array but its items are not specified');
                    light('WARNING', 'spot-add');
                    return false;
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
        light('WARNING', 'spot-add');
        return false;
    }
    if (td.hasOwnProperty("interaction")) {
        log('interaction are from the previous TD Specification, please use properties, actions, events instead');
        light('WARNING', 'spot-add');
        return false;
    }
    return;
}

function arrayContainsOtherArray(parent, child) {

    return child.every(elem => parent.indexOf(elem) > -1);
}

function checkSecurity(td) {
    if (td.hasOwnProperty("securityDefinitions")) {
        var securityDefinitionsObject = td.securityDefinitions;
        var securityDefinitions = Object.keys(securityDefinitionsObject);


        var rootSecurity = td.security;

        if (arrayContainsOtherArray(securityDefinitions, rootSecurity)) {
            // all good
        } else {
            log('KO Error: Security key in the root of the TD has security schemes not defined by the securityDefinitions');
            light('KO', 'spot-add');
            return false;
        }

        if (td.hasOwnProperty("properties")) {
            //checking security in property level
            tdProperties = Object.keys(td.properties);
            for (var i = 0; i < tdProperties.length; i++) {
                var curPropertyName = tdProperties[i];
                var curProperty = td.properties[curPropertyName];
                if (curProperty.hasOwnProperty("security")) {
                    var curSecurity = curProperty.security;
                    if (arrayContainsOtherArray(securityDefinitions, curSecurity)) {
                        // all good
                    } else {
                        log('KO Error: Security key in property ' + curPropertyName + '  has security schemes not defined by the securityDefinitions');
                        light('KO', 'spot-add');
                        return false;
                    }
                }

                // checking security in forms level
                var curForms = curProperty.forms;
                for (var j = 0; j < curForms.length; j++) {
                    var curForm = curForms[j];
                    if (curForm.hasOwnProperty("security")) {
                        var curSecurity = curForm.security;
                        if (arrayContainsOtherArray(securityDefinitions, curSecurity)) {
                            // all good
                        } else {
                            log('KO Error: Security key in form ' + j + ' in property ' + curPropertyName + '  has security schemes not defined by the securityDefinitions');
                            light('KO', 'spot-add');
                            return false;
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
                if (curAction.hasOwnProperty("security")) {
                    var curSecurity = curAction.security;
                    if (arrayContainsOtherArray(securityDefinitions, curSecurity)) {
                        // all good
                    } else {
                        log('KO Error: Security key in action ' + curActionName + '  has security schemes not defined by the securityDefinitions');
                        light('KO', 'spot-add');
                        return false;
                    }
                }
                // checking security in forms level 
                var curForms = curAction.forms;
                for (var j = 0; j < curForms.length; j++) {
                    var curForm = curForms[j];
                    if (curForm.hasOwnProperty("security")) {
                        var curSecurity = curForm.security;
                        if (arrayContainsOtherArray(securityDefinitions, curSecurity)) {
                            // all good
                        } else {
                            log('KO Error: Security key in form ' + j + ' in action ' + curActionName + '  has security schemes not defined by the securityDefinitions');
                            light('KO', 'spot-add');
                            return false;
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
                if (curEvent.hasOwnProperty("security")) {
                    var curSecurity = curEvent.security;
                    if (arrayContainsOtherArray(securityDefinitions, curSecurity)) {
                        // all good
                    } else {
                        log('KO Error: Security key in event ' + curEventName + '  has security schemes not defined by the securityDefinitions');
                        light('KO', 'spot-add');
                        return false;
                    }
                }
                // checking security in forms level
                var curForms = curEvent.forms;
                for (var j = 0; j < curForms.length; j++) {
                    var curForm = curForms[j];
                    if (curForm.hasOwnProperty("security")) {
                        var curSecurity = curForm.security;
                        if (arrayContainsOtherArray(securityDefinitions, curSecurity)) {
                            // all good
                        } else {
                            log('KO Error: Security key in form ' + j + ' in event ' + curEventName + '  has security schemes not defined by the securityDefinitions');
                            light('KO', 'spot-add');
                            return false;
                        }
                    }
                }

            }
        }
    } else {
        log('KO Error: securityDefinitions is mandatory');
        light('KO', 'spot-add');
        return false;
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

    if (isDuplicate) {
        log('KO Error: Duplicate names are not allowed in Interactions');
        light('KO', 'spot-add');
        return false;
    }
}