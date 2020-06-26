/* *******************************************************************************
 * Copyright (c) 2020 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 * Document License (2015-05-13) which is available at
 * https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 * SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 ********************************************************************************/

// used to check whether the supplied data is utf8
const isUtf8 = require('is-utf8')

// A special JSON validator that is used only to check whether the given object has duplicate keys.
// The standard library doesn't detect duplicate keys and overwrites the first one with the second one.
const jsonValidator = require('json-dup-key-validator')

// The usual library used for validation
// const draftLocation = "./json-schema-draft-06.json" // Used by AJV as the JSON Schema draft to rely on
const Ajv = require('ajv')
const draft = require('ajv/lib/refs/json-schema-draft-06.json')

// This is used to validate if the multi language JSON keys are valid according to the BCP47 spec
const bcp47pattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i // eslint-disable-line max-len


/**
 * validates the TD in the first argument according to the assertions given in the second argument
 * manual assertions given in the third argument are pushed to the end of the array after sorting the results array
 * return is a JSON array of result JSON objects
 * if there is a throw, it gives the failed assertion id
 * @param {Buffer} tdData Buffer of the Td data, has to be utf8 encoded (e.g. by fs.readFileSync(file.json) )
 * @param {Array<object>} assertions An array containing all assertion objects (already parsed)
 * @param {Array<object>} manualAssertions An array containing all manual assertions
 * @param {string} tdSchema The JSON Schema used to eval if a Td is valid
 * @param {Function} logFunc Logging function
 */
function validate(tdData, assertions, manualAssertions, tdSchema, logFunc) {

    tdSchema = JSON.parse(tdSchema)
    // a JSON file that will be returned containing the result for each assertion as a JSON Object
    let results = []
    logFunc("=================================================================")

    // check whether it is a valid UTF-8
    if (isUtf8(tdData)) {
        results.push({
            "ID": "td-json-open_utf-8",
            "Status": "pass"
        })
    } else {
        throw new Error("td-json-open_utf-8")
    }

    // check whether it is a valid JSON
    let tdJson
    try {
        tdJson = JSON.parse(tdData)
        results.push({
            "ID": "td-json-open",
            "Status": "pass"
        })
    } catch (error) {
        throw new Error("td-json-open")
    }

    // checking whether two interactions of the same interaction affordance type have the same names
    // This requires to use the string version of the TD that will be passed down to the jsonvalidator library
    const tdDataString = tdData.toString()
    results.push(...checkUniqueness(tdDataString))

    // Normal TD Schema validation but this allows us to test multiple assertions at once
    try {
        results.push(...checkVocabulary(tdJson, tdSchema, draft))
    } catch (error) {
        logFunc({
            "ID": error,
            "Status": "fail"
        })
        throw new Error("Invalid TD")
    }

    // additional checks
    results.push(...checkSecurity(tdJson))
    results.push(...checkMultiLangConsistency(tdJson))

    // Iterating through assertions
    for (let index = 0; index < assertions.length; index++) {
        const curAssertion = assertions[index]

        const schema = curAssertion

        // Validation starts here

        const avjOptions = {
            "$comment" (v) {
                logFunc("\n!!!! COMMENT", v)
            },
            "allErrors": true
        }
        const ajv = new Ajv(avjOptions)
        ajv.addMetaSchema(draft)
        ajv.addSchema(schema, 'td')


        const valid = ajv.validate('td', tdJson)

        /*
            TODO: when is implemented?
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
                })
                if (schema.hasOwnProperty("also")) {
                    const otherAssertions = schema.also
                    otherAssertions.forEach(function (asser) {
                        results.push({
                            "ID": asser,
                            "Status": "not-impl"
                        })
                    })
                }

            } else {
                try {
                    const output = ajv.errors[0].params.allowedValue

                    const resultStart = output.indexOf("=")
                    const result = output.slice(resultStart + 1)

                    if (result === "pass") {
                        results.push({
                            "ID": schema.title,
                            "Status": result
                        })
                    } else {
                        results.push({
                            "ID": schema.title,
                            "Status": result,
                            "Comment": ajv.errorsText()
                        })
                    }
                    if (schema.hasOwnProperty("also")) {
                        const otherAssertions = schema.also
                        otherAssertions.forEach(function (asser) {
                            results.push({
                                "ID": asser,
                                "Status": result
                            })
                        })
                    }
                    // there was some other error, so it is fail
                } catch (error1) {
                    results.push({
                        "ID": schema.title,
                        "Status": "fail",
                        "Comment": "Make sure you validate your TD before"
                    })

                    if (schema.hasOwnProperty("also")) {
                        const otherAssertions = schema.also
                        otherAssertions.forEach(function (asser) {
                            results.push({
                                "ID": asser,
                                "Status": "fail",
                                "Comment": "Make sure you validate your TD before"
                            })
                        })
                    }
                }
            }

        } else {
            if (valid) {
                // console.log('Assertion ' + schema.title + ' implemented');
                results.push({
                    "ID": schema.title,
                    "Status": "pass"
                })
                if (schema.hasOwnProperty("also")) {
                    const otherAssertions = schema.also
                    otherAssertions.forEach(function (asser) {
                        results.push({
                            "ID": asser,
                            "Status": "pass"
                        })
                    })
                }
            } else {
                // failed because a required is not implemented
                // console.log('> ' + ajv.errorsText());
                if (ajv.errorsText().indexOf("required") > -1) {
                    // failed because it doesnt have required key which is a non implemented feature
                    // console.log('Assertion ' + schema.title + ' not implemented');
                    results.push({
                        "ID": schema.title,
                        "Status": "not-impl",
                        "Comment": ajv.errorsText()
                    })
                    if (schema.hasOwnProperty("also")) {
                        const otherAssertions = schema.also
                        otherAssertions.forEach(function (asser) {
                            results.push({
                                "ID": asser,
                                "Status": "not-impl",
                                "Comment": ajv.errorsText()
                            })
                        })
                    }
                } else {
                    // failed because of some other reason
                    // console.log('Assertion ' + schema.title + ' failed');
                    results.push({
                        "ID": schema.title,
                        "Status": "fail",
                        "Comment": ajv.errorsText()
                    })
                    if (schema.hasOwnProperty("also")) {
                        const otherAssertions = schema.also
                        otherAssertions.forEach(function (asser) {
                            results.push({
                                "ID": asser,
                                "Status": "fail",
                                "Comment": ajv.errorsText()
                            })
                        })
                    }
                }
            }
        }
    }

    results = mergeIdenticalResults(results)
    results = createParents(results)


    // sort according to the ID in each item
    orderedResults = results.sort(function (a, b) {
        const idA = a.ID
        const idB = b.ID
        if (idA < idB) {
            return -1
        }
        if (idA > idB) {
            return 1
        }

        // if ids are equal
        return 0
    })

    results = orderedResults.concat(manualAssertions)
    return results
    // const csvResults = json2csvParser.parse(results)
    // return csvResults
}

module.exports = validate


/**
 *  Checking whether in one interaction pattern there are duplicate names, e.g. two properties called temp
 *  However, if there are no properties then it is not-impl
 *
 * @param {string} tdString The Td under test as string
 */
function checkUniqueness(tdString) {



    const results = []
    // jsonvalidator throws an error if there are duplicate names in the interaction level
    try {
        jsonValidator.parse(tdString, false)

        const td = JSON.parse(tdString)

        // no problem in interaction level
        let tdInteractions = []

        // checking whether there are properties at all, if not uniqueness is not impl
        if (td.hasOwnProperty("properties")) {
            tdInteractions = tdInteractions.concat(Object.keys(td.properties))
            // then we can add unique properties pass
            results.push({
                "ID": "td-properties_uniqueness",
                "Status": "pass",
                "Comment": ""
            })
        } else {
            // then we add unique properties as not impl
            results.push({
                "ID": "td-properties_uniqueness",
                "Status": "not-impl",
                "Comment": "no properties"
            })
        }

        // similar to just before, checking whether there are actions at all, if not uniqueness is not impl
        if (td.hasOwnProperty("actions")) {
            tdInteractions = tdInteractions.concat(Object.keys(td.actions))
            results.push({
                "ID": "td-actions_uniqueness",
                "Status": "pass",
                "Comment": ""
            })
        } else {
            // then we add unique actions as not impl
            results.push({
                "ID": "td-actions_uniqueness",
                "Status": "not-impl",
                "Comment": "no actions"
            })
        }

        // similar to just before, checking whether there are events at all, if not uniqueness is not impl
        if (td.hasOwnProperty("events")) {
            tdInteractions = tdInteractions.concat(Object.keys(td.events))
            results.push({
                "ID": "td-events_uniqueness",
                "Status": "pass",
                "Comment": ""
            })
        } else {
            // then we add unique events as not impl
            results.push({
                "ID": "td-events_uniqueness",
                "Status": "not-impl",
                "Comment": "no events"
            })
        }

        return results

    } catch (error) {
        // there is a duplicate somewhere

        // convert it into string to be able to process it
        // error is of form = Error: Syntax error: duplicated keys "overheating" near ting": {
        const errorString = error.toString()
        // to get the name, we need to remove the quotes around it
        const startQuote = errorString.indexOf('"')
        // slice to remove the part before the quote
        const restString = errorString.slice(startQuote + 1)
        // find where the interaction name ends
        const endQuote = restString.indexOf('"')
        // finally get the interaction name
        const interactionName = restString.slice(0, endQuote)

        // trying to find where this interaction is and put results accordingly
        const td = JSON.parse(tdString)

        if (td.hasOwnProperty("properties")) {
            const tdProperties = td.properties
            if (tdProperties.hasOwnProperty(interactionName)) {
                // duplicate was at properties but that fails the td-unique identifiers as well
                // console.log("at property");
                results.push({
                    "ID": "td-properties_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate property names"
                })
                // since JSON.parse removes duplicates, we replace the duplicate name with duplicateName
                tdString = tdString.replace(interactionName, "duplicateName")

            } else {
                // there is duplicate but not here, so pass
                results.push({
                    "ID": "td-properties_uniqueness",
                    "Status": "pass",
                    "Comment": ""
                })
            }
        } else {
            results.push({
                "ID": "td-properties_uniqueness",
                "Status": "not-impl",
                "Comment": "no properties"
            })
        }

        if (td.hasOwnProperty("actions")) {
            const tdActions = td.actions
            if (tdActions.hasOwnProperty(interactionName)) {
                // duplicate was at actions but that fails the td-unique identifiers as well
                // console.log("at action");
                results.push({
                    "ID": "td-actions_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate action names"
                })
                // since JSON.parse removes duplicates, we replace the duplicate name with duplicateName
                tdString = tdString.replace(interactionName, "duplicateName")
            } else {
                results.push({
                    "ID": "td-actions_uniqueness",
                    "Status": "pass",
                    "Comment": ""
                })
            }
        } else {
            results.push({
                "ID": "td-actions_uniqueness",
                "Status": "not-impl",
                "Comment": "no actions"
            })
        }

        if (td.hasOwnProperty("events")) {
            const tdEvents = td.events
            if (tdEvents.hasOwnProperty(interactionName)) {
                // duplicate was at events but that fails the td-unique identifiers as well
                // console.log("at event");
                results.push({
                    "ID": "td-events_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate event names"
                })
                // since JSON.parse removes duplicates, we replace the duplicate name with duplicateName
                tdString = tdString.replace(interactionName, "duplicateName")
            } else {
                results.push({
                    "ID": "td-events_uniqueness",
                    "Status": "pass",
                    "Comment": ""
                })
            }
        } else {
            results.push({
                "ID": "td-events_uniqueness",
                "Status": "not-impl",
                "Comment": "no events"
            })
        }

        return results
    }
}

/**
 *  Validates the following assertions:
 *    td - processor
 *    td-objects:securityDefinitions
 *    td-arrays:security
 *    td:security
 *    td-security-mandatory
 * @param {object} tdJson The td to validate
 * @param {*} tdSchema The JSON Schema used for td validation
 * @param {*} schemaDraft The JSON Schema draft to be used
 */
function checkVocabulary(tdJson, tdSchema, schemaDraft) {

    const results = []
    const ajv = new Ajv()
    ajv.addMetaSchema(draft)
    ajv.addSchema(tdSchema, 'td')

    const valid = ajv.validate('td', tdJson)
    const otherAssertions = ["td-objects_securityDefinitions", "td-arrays_security", "td-vocab-security--Thing",
                             "td-security-mandatory", "td-vocab-securityDefinitions--Thing", "td-context-toplevel",
                             "td-vocab-title--Thing", "td-vocab-security--Thing", "td-vocab-id--Thing",
                             "td-security", "td-security-activation", "td-context-ns-thing-mandatory",
                             "td-map-type", "td-array-type", "td-class-type", "td-string-type", "td-security-schemes"]

    if (valid) {
        results.push({
            "ID": "td-processor",
            "Status": "pass"
        })

        otherAssertions.forEach(function (asser) {
            results.push({
                "ID": asser,
                "Status": "pass"
            })
        })
        return results

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
        throw new Error("invalid TD")
    }
}

/**
 * security anywhere could be a string or array. Convert string to array
 *
 * @param {*} parent
 * @param {string|Array<string>} child
 */
function securityContains(parent, child) {

    if (typeof child === "string") {
        child = [child]
    }
    return child.every(elem => parent.indexOf(elem) > -1)
}

/**
 * check Security and security Definitions
 * @param {object} td The Td to do assertion tests
 */
function checkSecurity(td) {

    const results = []
    if (td.hasOwnProperty("securityDefinitions")) {
        const securityDefinitionsObject = td.securityDefinitions
        const securityDefinitions = Object.keys(securityDefinitionsObject)


        const rootSecurity = td.security

        if (securityContains(securityDefinitions, rootSecurity)) {
            // all good
        } else {
            results.push({
                "ID": "td-security-scheme-name",
                "Status": "fail",
                "Comment": "used a non defined security scheme in root level"
            })
            return results
        }

        if (td.hasOwnProperty("properties")) {
            // checking security in property level
            tdProperties = Object.keys(td.properties)
            for (let i = 0; i < tdProperties.length; i++) {
                const curPropertyName = tdProperties[i]
                const curProperty = td.properties[curPropertyName]

                // checking security in forms level
                const curForms = curProperty.forms
                for (let j = 0; j < curForms.length; j++) {
                    const curForm = curForms[j]
                    if (curForm.hasOwnProperty("security")) {
                        const curSecurity = curForm.security
                        if (securityContains(securityDefinitions, curSecurity)) {
                            // all good
                        } else {
                            results.push({
                                "ID": "td-security-scheme-name",
                                "Status": "fail",
                                "Comment": "used a non defined security scheme in a property form"
                            })
                            return results
                        }
                    }
                }
            }
        }

        if (td.hasOwnProperty("actions")) {
            // checking security in action level
            tdActions = Object.keys(td.actions)
            for (let i = 0; i < tdActions.length; i++) {
                const curActionName = tdActions[i]
                const curAction = td.actions[curActionName]

                // checking security in forms level
                const curForms = curAction.forms
                for (let j = 0; j < curForms.length; j++) {
                    const curForm = curForms[j]
                    if (curForm.hasOwnProperty("security")) {
                        const curSecurity = curForm.security
                        if (securityContains(securityDefinitions, curSecurity)) {
                            // all good
                        } else {
                            results.push({
                                "ID": "td-security-scheme-name",
                                "Status": "fail",
                                "Comment": "used a non defined security scheme in an action form"
                            })
                            return results
                        }
                    }
                }

            }
        }

        if (td.hasOwnProperty("events")) {
            // checking security in event level
            tdEvents = Object.keys(td.events)
            for (let i = 0; i < tdEvents.length; i++) {
                const curEventName = tdEvents[i]
                const curEvent = td.events[curEventName]

                // checking security in forms level
                const curForms = curEvent.forms
                for (let j = 0; j < curForms.length; j++) {
                    const curForm = curForms[j]
                    if (curForm.hasOwnProperty("security")) {
                        const curSecurity = curForm.security
                        if (securityContains(securityDefinitions, curSecurity)) {
                            // all good
                        } else {
                            results.push({
                                "ID": "td-security-scheme-name",
                                "Status": "fail",
                                "Comment": "used a non defined security scheme in an event form"
                            })
                            return results
                        }
                    }
                }

            }
        }

        // no security used non defined scheme, passed test
        results.push({
            "ID": "td-security-scheme-name",
            "Status": "pass"
        })
        return results

    }
    return results
}

/**
 *  this checks whether all titles and descriptions have the same language fields
 *  so the object keys of a titles and of a descriptions should be the same already,
 *  then everywhere else they should also be the same
 *
 *  first collect them all, and then compare them
 *
 * @param {object} td The Td to do assertion tests
 */
function checkMultiLangConsistency(td) {

    const results = []
    const multiLang = [] // an array of arrays where each small array has the multilang keys
    const isTdTitlesDescriptions = [] // an array of boolean values to check td-titles-descriptions assertion

    // checking root
    if (td.hasOwnProperty("titles")) {
        const rootTitlesObject = td.titles
        const rootTitles = Object.keys(rootTitlesObject)
        multiLang.push(rootTitles)
        // checking for td-titles-descriptions
        isTdTitlesDescriptions.push({["root_title"]: isStringObjectKeyValue(td.title, rootTitlesObject)})
    }

    if (td.hasOwnProperty("descriptions")) {
        const rootDescriptionsObject = td.descriptions
        const rootDescriptions = Object.keys(rootDescriptionsObject)
        multiLang.push(rootDescriptions)
        // check whether description exists in descriptions
        if (td.hasOwnProperty("description")) {
            isTdTitlesDescriptions.push({["root_description"]: isStringObjectKeyValue(td.description, rootDescriptionsObject)})
        }
    }

    // checking inside each interaction
    if (td.hasOwnProperty("properties")) {
        // checking security in property level
        tdProperties = Object.keys(td.properties)
        for (let i = 0; i < tdProperties.length; i++) {
            const curPropertyName = tdProperties[i]
            const curProperty = td.properties[curPropertyName]

            if (curProperty.hasOwnProperty("titles")) {
                const titlesKeys = Object.keys(curProperty.titles)
                multiLang.push(titlesKeys)
                // checking if title exists in titles
                if (curProperty.hasOwnProperty("title")) {
                    isTdTitlesDescriptions.push({
                        ["property_"+curPropertyName + "_title"]: isStringObjectKeyValue(curProperty.title, curProperty.titles)
                    })
                }
            }

            if (curProperty.hasOwnProperty("descriptions")) {
                const descriptionsKeys = Object.keys(curProperty.descriptions)
                multiLang.push(descriptionsKeys)
                // checking if description exists in descriptions
                if (curProperty.hasOwnProperty("description")) {
                    isTdTitlesDescriptions.push({
                    ["property_" + curPropertyName + "_desc"]: isStringObjectKeyValue(curProperty.description,curProperty.descriptions)
                    })
                }
            }
        }
    }

    if (td.hasOwnProperty("actions")) {
        // checking security in action level
        tdActions = Object.keys(td.actions)
        for (let i = 0; i < tdActions.length; i++) {
            const curActionName = tdActions[i]
            const curAction = td.actions[curActionName]

            if (curAction.hasOwnProperty("titles")) {
                const titlesKeys = Object.keys(curAction.titles)
                multiLang.push(titlesKeys)
                // checking if title exists in titles
                if (curAction.hasOwnProperty("title")) {
                    isTdTitlesDescriptions.push({
                        ["action_" + curActionName + "_title"]: isStringObjectKeyValue(curAction.title, curAction.titles)
                    })
                }
            }

            if (curAction.hasOwnProperty("descriptions")) {
                const descriptionsKeys = Object.keys(curAction.descriptions)
                multiLang.push(descriptionsKeys)
                // checking if description exists in descriptions
                if (curAction.hasOwnProperty("description")) {
                    isTdTitlesDescriptions.push({
                         ["action_" + curActionName + "_desc"]: isStringObjectKeyValue(curAction.description, curAction.descriptions)
                    })
                }
            }

        }
    }

    if (td.hasOwnProperty("events")) {
        // checking security in event level
        tdEvents = Object.keys(td.events)
        for (let i = 0; i < tdEvents.length; i++) {
            const curEventName = tdEvents[i]
            const curEvent = td.events[curEventName]

            if (curEvent.hasOwnProperty("titles")) {
                const titlesKeys = Object.keys(curEvent.titles)
                multiLang.push(titlesKeys)
                // checking if title exists in titles
                if (curEvent.hasOwnProperty("title")) {
                    isTdTitlesDescriptions.push({
                        ["event_" + curEventName + "_title"]: isStringObjectKeyValue(curEvent.title, curEvent.titles)
                    })
                }
            }

            if (curEvent.hasOwnProperty("descriptions")) {
                const descriptionsKeys = Object.keys(curEvent.descriptions)
                multiLang.push(descriptionsKeys)
                // checking if description exists in descriptions
                if (curEvent.hasOwnProperty("description")) {
                    isTdTitlesDescriptions.push({
                        ["event_" + curEventName + "_desc"]: isStringObjectKeyValue(curEvent.description, curEvent.descriptions)
                    })
                }
            }

        }
    }
    if(arrayArraysItemsEqual(multiLang)){
        results.push({
            "ID": "td-multi-languages-consistent",
            "Status": "pass"
        })
    } else {
        results.push({
            "ID": "td-multi-languages-consistent",
            "Status": "fail",
            "Comment": "not all multilang objects have same language tags"
        })
    }

    const flatArray = [] // this is multiLang but flat, so just a single array.
    // This way we can have scan the whole thing at once and then find the element that is not bcp47

    for (let index = 0; index < multiLang.length; index++) {
        let arrayElement = multiLang[index]
        arrayElement=JSON.parse(arrayElement)
        for (let e = 0; e < arrayElement.length; e++) {
            const stringElement = arrayElement[e]
            flatArray.push(stringElement)
        }
    }
    const isBCP47 = checkBCP47array(flatArray)
    if(isBCP47 === "ok"){
        results.push({
            "ID": "td-multilanguage-language-tag",
            "Status": "pass"
        })
    } else {
        results.push({
            "ID": "td-multilanguage-language-tag",
            "Status": "fail",
            "Comment":isBCP47+" is not a BCP47 tag"
        })
    }

    // checking td-context-default-language-direction-script assertion
    results.push({
        "ID": "td-context-default-language-direction-script",
        "Status": checkAzeri(flatArray)
    })

    // checking td-titles-descriptions assertion
    // if there are no multilang, then it is not impl
    if(isTdTitlesDescriptions.length === 0){
        results.push({
            "ID": "td-titles-descriptions",
            "Status": "not-impl",
            "Comment": "no multilang objects in the td"
        })
        return results
    }

    // if at some point there was a false result, it is a fail
    for (let index = 0; index < isTdTitlesDescriptions.length; index++) {
        const element = isTdTitlesDescriptions[index]
        const elementName = Object.keys(element)

        if(element[elementName]){
            // do nothing it is correct
        } else {
            results.push({
                "ID": "td-titles-descriptions",
                "Status": "fail",
                "Comment": elementName+" is not on the multilang object at the same level"
            })
            return results
        }
    }
    // there was no problem, so just put pass
    results.push({
        "ID": "td-titles-descriptions",
        "Status": "pass"
    })

    // ? nothing after this, there is return above
    return results
}

/**
 * checks if an array that contains only arrays as items is composed of same items
 *
 * @param {Array<object>} myArray The array to check
 */
function arrayArraysItemsEqual(myArray) {
    if(myArray.length === 0) return true
    // first stringify each array item
    for (let i = myArray.length; i--;) {
        myArray[i] = JSON.stringify(myArray[i])
    }

    for (let i = myArray.length; i--;) {
        if (i === 0) {
            return true
        }
        if (myArray[i] !== myArray[i - 1]){
            return false
        }
    }
}

/**
 * checks whether the items of an array, which must be strings, are valid language tags
 *
 * @param {Array<string>} myArray The array, which items are to be checked
 */
function checkBCP47array(myArray){
    // return tag name if one is not valid during the check

    for (let index = 0; index < myArray.length; index++) {
        const element = myArray[index]
        if (bcp47pattern.test(element)) {
            // keep going
        } else {
            return element
        }
    }

    // return true if reached the end
    return "ok"
}

/**
 * checks whether a given string exist as the value of key in an object
 *
 * @param {string} searchedString
 * @param {object} searchedObject
 */
function isStringObjectKeyValue(searchedString, searchedObject){
    const objKeys = Object.keys(searchedObject)
    if(objKeys.length === 0) return false // if the object is empty, then the string cannot exist here
    for (let index = 0; index < objKeys.length; index++) {
        const element = objKeys[index]
        if (searchedObject[element] === searchedString) {
            return true // found where the string is in the object
        } else {
            // nothing keep going, maybe in another key
        }
    }
    return false
}


/**
 * checks whether an azeri language tag also specifies the version (Latn or Arab).
 * basically if the language is called "az", it is invalid, if it is az-Latn or az-Arab it is valid.
 *
 * @param {Array<string>} myMultiLangArray The language array to check
 */
function checkAzeri(myMultiLangArray){
    for (let index = 0; index < myMultiLangArray.length; index++) {
        const element = myMultiLangArray[index]
        if (element ==="az"){
            return "fail"
        } else if ((element === "az-Latn") || (element === "az-Arab")){
            return "pass"
        }
    }
    // no azeri, so it is not implemented
    return "not-impl"
}

/**
 * first generate a list of results that appear more than once
 * it should be a JSON object, keys are the assertion ids and the value is an array
 * while putting these results, remove them from the results FIRST
 * then for each key, find the resulting result:
 * if one fail total fail, if one pass and no fail then pass, otherwise not-impl
 *
 * @param {Array<object>} results Current results array
 */
function mergeIdenticalResults(results) {


    const identicalResults = {}
    results.forEach((curResult, index) => {
        const curId = curResult.ID

        // remove this one, but add it back if there is no duplicate
        results.splice(index, 1)
        // check if there is a second one
        const identicalIndex = results.findIndex(x => x.ID === curId)

        if (identicalIndex > 0) { // there is a second one

            // check if it already exists
            if (identicalResults.hasOwnProperty(curId)) {
                // push if it already exists
                identicalResults[curId].push(curResult.Status)
            } else {
                // create a new array with values if it does not exist
                identicalResults[curId] = [curResult.Status]
            }
            // put it back such that the last identical can find its duplicate that appeared before
            results.unshift(curResult)
            // process.exit();
        } else {
            // if there is no duplicate, put it back into results but at the beginning
            results.unshift(curResult)
        }
    })

    // get the keys to iterate through
    const identicalKeys = Object.keys(identicalResults)

    // iterate through each duplicate, calculate the new result, set the new result and then remove the duplicates
    identicalKeys.forEach(curKey => {
        const curResults = identicalResults[curKey]
        let newResult

        if (curResults.indexOf("fail") >= 0) {
            newResult = "fail"
        } else if (curResults.indexOf("pass") >= 0) {
            newResult = "pass"
        } else {
            newResult = "not-impl"
        }
        // delete each of the duplicate
        while (results.findIndex(x => x.ID === curKey) >= 0) {
            results.splice(results.findIndex(x => x.ID === curKey), 1)
        }

        // push back the new result
        results.push({
            "ID": curKey,
            "Status": newResult,
            "Comment": "result of a merge"
        })

    })
    return results
}

/**
 * create a json object with parent name keys and then each of them an array of children results
 *
 * @param {Array<object>} results Current results array
 */
function createParents(results) {

    const parentsJson = {}
    results.forEach((curResult, index) => {
        const curId = curResult.ID
        const underScoreLoc = curId.indexOf('_')
        if (underScoreLoc === -1) {
            // this assertion is not a child assertion
        } else {
            const parentResultID = curId.slice(0, underScoreLoc)
            // if it already exists push otherwise create an array and push
            if (parentsJson.hasOwnProperty(parentResultID)) {
                parentsJson[parentResultID].push(curResult)
            } else {
                parentsJson[parentResultID] = []
                parentsJson[parentResultID].push(curResult)
            }
        }
    })

    /*
        Go through the object and push a result that is an OR of each children
        if one children is fail, result is fail
        if one children is not-impl, result is not-impl
        if none of these happen, then it implies it is pass, so result is pass
        "ID": schema.title,
        "Status": "not-impl"
    */

    parentsJsonArray = Object.getOwnPropertyNames(parentsJson)
    parentsJsonArray.forEach((curParentName, indexParent) => {

        const curParent = parentsJson[curParentName]

        for (let index = 0; index < curParent.length; index++) {
            const curChild = curParent[index]
            if (curChild.Status === "fail") {
                // push fail and break, i.e stop going through children, we are done here!
                results.push({
                    "ID": curParentName,
                    "Status": "fail",
                    "Comment": "Error message can be seen in the children assertions"
                })
                break
            } else if (curChild.Status === "not-impl") {
                // push not-impl and break, i.e stop going through children, we are done here!
                results.push({
                    "ID": curParentName,
                    "Status": "not-impl",
                    "Comment": "Error message can be seen in the children assertions"
                })
                break
            } else {
                // if reached the end without break, push pass
                if (index === curParent.length - 1) {
                    results.push({
                        "ID": curParentName,
                        "Status": "pass"
                    })
                }
            }
        }
    })
    return results
}