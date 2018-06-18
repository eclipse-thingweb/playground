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
    var color = success ? 'green' : 'red';
    circle.attr('fill', color);
}

function reset(id) {
    var circle = $('#' + id);
    circle.css('visibility', 'hidden');
}

function validate() {
    var text = $('#td-text').val();
    reset('spot-json');
    reset('spot-json-schema');
    reset('spot-json-ld');
    reset('spot-owl');
    trigger('validate-json', text);
}

function log(message) {
    var pgConsole = $('#console');
    pgConsole.append(message + '&#13;&#10;');
}

$(function() {
    $('#td-text').linedtextarea();
    $.getJSON('td-schema-bundang-simple.json', function(schema) {
        ajv = Ajv();
        $.getJSON('json-schema-draft-06.json', function(draft) {
            ajv.addMetaSchema(draft);
            ajv.addSchema(schema, 'td');
            document.addEventListener('validate-json', function(e) {
                try {
                    tdJson = JSON.parse(e.detail);
                    light(true, 'spot-json');
                    log('JSON validation... OK');
                    trigger('validate-json-schema', tdJson);
                } catch (err) {
                    if (err instanceof SyntaxError) {
                        light(false, 'spot-json');
                        log('JSON validation... KO:');
                        log('> ' + err.message);
                    }
                }
            }, false);

            document.addEventListener('validate-json-schema', function(e) {
                if (tdJson.hasOwnProperty('properties')||tdJson.hasOwnProperty('actions')||tdJson.hasOwnProperty('events')) {
                    if (!tdJson.hasOwnProperty('base')) {
                        //no need to do something. Each href should be absolute
                        log('> Warning: Without base, each href should be an url');
                    } else {
                        //need to check if base finishes with / or not
                        //if it does, hrefs shouldnt start with it, if it doesnt, then hrefs must start with it
                        //QUESTION should there be separate schemas or transformation?
                        try {
                            tdJson=transformHref(tdJson);
                        } catch (err) {
                            light(false, 'spot-json-schema');
                            log('JSON Schema validation... KO:');
                            log('> ' + err);
                            return;
                        }

                    }
                }

                var valid = ajv.validate('td', tdJson);
                //used to be var valid = ajv.validate('td', e.detail);
                if (valid) {
                    light(true, 'spot-json-schema');
                    log('JSON Schema validation... OK');
                    trigger('validate-json-ld', e.detail);
                } else {
                    light(false, 'spot-json-schema');
                    log('JSON Schema validation... KO:');
                    //console.log(ajv.errors);
                    log('> ' + ajv.errorsText());
                }
            }, false);

            document.addEventListener('validate-json-ld', function(e) {
                jsonld.toRDF(e.detail, {
                    format: 'application/nquads'
                }, function(err, triples) {
                    if (!err) {
                        light(true, 'spot-json-ld');
                        log('JSON-LD validation... OK');
                        trigger('validate-owl', triples);
                    } else {
                        light(false, 'spot-json-ld');
                        log('JSON-LD validation... KO:');
                        log('> ' + err);
                    }
                });
            }, false);

            // document.addEventListener('validate-owl', function(e) {
            //     $.post({
            //         url: 'sem',
            //         data: e.detail,
            //         contentType: 'application/nquads',
            //         success: function(diagnosis) {
            //             if (diagnosis.valid) {
            //                 light(true, 'spot-owl');
            //                 log('TD/OWL validation... OK');
            //             } else {
            //                 light(false, 'spot-owl');
            //                 log('TD/OWL validation... KO!');
            //             }
            //         }
            //     });
            // }, false);
            document.addEventListener('validate-owl', function(e) {
                light(true, 'spot-owl');
                log('TD/OWL validation... OK');

            }, false);

            $('#td-validate').removeAttr('disabled');
        });
    });
});
/*
This function checks whether hrefs are combinable with the base uri and then combines them
*/
function transformHref(td) {
    if (td.base.slice(-1) == '/') { //getting the last element
        //hrefs should not start with /
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
            } else if(curProperty.hasOwnProperty("form")){
                log('> Warning: forms is used instead of form at property' + curPropertyName);
            } else {
                //form is not mandatory
            }
        }
        //for actions
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
            } else if(curAction.hasOwnProperty("form")){
                log('> Warning: forms is used instead of form at action' + curActionName);
            } else {
                //form is not mandatory
            }
        }
        //for events
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
            } else if(curEvent.hasOwnProperty("form")){
                log('> Warning: forms is used instead of form at event' + curEventName);
            } else {
                //form is not mandatory
            }
        }
    } else {
        //hrefs should start with /
        //for properties
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
            } else if(curProperty.hasOwnProperty("form")){
                log('> Warning: forms is used instead of form at property' + curPropertyName);
            } else {
                //form is not mandatory
            }
        }
        //for actions
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
            } else if(curAction.hasOwnProperty("form")){
                log('> Warning: forms is used instead of form at action' + curActionName);
            } else {
                //form is not mandatory
            }
        }
        //for events
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
            } else if(curEvent.hasOwnProperty("form")){
                log('> Warning: forms is used instead of form at event' + curEventName);
            } else {
                //form is not mandatory
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

function checkEnumConst(td){
    
}