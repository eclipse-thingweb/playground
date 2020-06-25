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
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))

// %%const tdSchemaLocation = "../WebContent/td-schema.json"
// JSON to CSV and vice versa libraries
// %% const Json2csvParser = require('json2csv').Parser

const csvjson = require('csvjson')

const path = require("path")

// Building the CSV and its corresponding JSON structure
const fields = ['ID', 'Status', 'Comment']
// %% const json2csvParser = new Json2csvParser({
//     fields
// })

// This is used to validate if the multi language JSON keys are valid according to the BCP47 spec
const bcp47pattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i // eslint-disable-line max-len


/**
 * asdf
 * @param {string | string[]} tdStrings The Thing Description(s) to check as a string.
 * @param {function} fileLoader (string) => string Path to a file as input, should return file content
 * @param {function} logFunc OPT (string) => void; Callback used to log the validation progress.
 */
function tdAssertions(tdStrings, fileLoader, logFunc) {
    return new Promise( (res, rej) => {

        // parameter handling
        if(typeof tdStrings === "string") {tdStrings = [tdStrings]}
        if(typeof tdStrings !== "object") {throw new Error("tdStrings has to a String or Array of Strings")}
        if(typeof fileLoader !== "function") {throw new Error("jsonLoader has to be a function")}
        if(logFunc === undefined) {logFunc = console.log}

        // getting an array of assertion objects
        collectAssertionSchemas("./assertions", "./list.json", fileLoader)
        .then( obj =>{
            logFunc("!!!-_-!!!")
        }, err => {
            console.error("collectAssertionSchemas function problem: "+ err)
        })
    })
}

// Private helpers
/**
 * Loads and generates an Array containing all assertion objects
 * @param {string} assertionsDirectory path to the directory, which contains the assertions
 * @param {string} assertionsList path to the assertion filenames list
 * @param {function} loadFunction (string) => string path string as input should return file content as string
 * @returns {Array} An array containing all assertion objects (already parsed)
 */
function collectAssertionSchemas(assertionsDirectory, assertionsList, loadFunction){
    return new Promise( (res, rej) => {

        const assertionSchemas = []
        const assertionProms = []

        loadFunction(assertionsList).then( assertionNames => {

            assertionsListLocation = JSON.parse(assertionNames)
            assertionsListLocation.forEach( curAssertion => {

                assertionProms.push(new Promise( (resolve, reject) => {
                    const schemaLocation = path.join(assertionsDirectory, curAssertion)
                    loadFunction(schemaLocation).then( schemaRaw => {
                        const schemaJSON = JSON.parse(schemaRaw)
                        assertionSchemas.push(schemaJSON)
                        resolve()
                    })
                }))
            })

            Promise.all(assertionProms).then( () => {
                res(assertionSchemas)
            })
        }, err => {console.log("Could not load assertion list" + err)})
    })
}

/**
 * validates the TD in the first argument according to the assertions given in the second argument
 * manual assertions given in the third argument are pushed to the end of the array after sorting the results array
 * return is a JSON array of result JSON objects
 * if there is a throw, it gives the failed assertion id
 * @param {*} tdData
 * @param {*} assertions
 * @param {*} manualAssertions
 * @param {*} tdSchema
 * @param {*} schemaDraft
 */
function validate(tdData, assertions, manualAssertions, tdSchema,schemaDraft) {
    // a JSON file that will be returned containing the result for each assertion as a JSON Object
    let results = []
    console.log("=================================================================")

    // check whether it is a valid UTF-8 string
    if (isUtf8(tdData)) {
        results.push({
            "ID": "td-json-open_utf-8",
            "Status": "pass"
        })
    } else {
        throw "td-json-open_utf-8"
    }

    // check whether it is a valid JSON
    try {
        var tdJson = JSON.parse(tdData)
        results.push({
            "ID": "td-json-open",
            "Status": "pass"
        })
    } catch (error) {
        throw "td-json-open"
    }

    // checking whether two interactions of the same interaction affordance type have the same names
    // This requires to use the string version of the TD that will be passed down to the jsonvalidator library
    const tdDataString = tdData.toString()
    results = checkUniqueness(tdDataString,results)

    // Normal TD Schema validation but this allows us to test multiple assertions at once
    try {
        results = checkVocabulary(tdJson, results, tdSchema, schemaDraft)
    } catch (error) {
        console.log({
            "ID": error,
            "Status": "fail"
        })
        throw "Invalid TD"
    }

    // additional checks
    results = checkSecurity(tdJson,results)
    results = checkMultiLangConsistency(tdJson, results)

    // Iterating through assertions

    for (let index = 0; index < assertions.length; index++) {
        const curAssertion = assertions[index]

        const schema = curAssertion

        // Validation starts here

        const avj_options = {
            "$comment" (v) {
                console.log("\n!!!! COMMENT", v)
            },
            "allErrors": true
        }
        var ajv = new Ajv(avj_options)
        ajv.addMetaSchema(draft)
        ajv.addSchema(schema, 'td')


        const valid = ajv.validate('td', tdJson)

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
                })
                if (schema.hasOwnProperty("also")) {
                    var otherAssertions = schema.also
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
                    var result = output.slice(resultStart + 1)

                    if (result == "pass") {
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
                        var otherAssertions = schema.also
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
                        var otherAssertions = schema.also
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
                    var otherAssertions = schema.also
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
                        var otherAssertions = schema.also
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
                        var otherAssertions = schema.also
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
    const csvResults = json2csvParser.parse(results)
    return csvResults
}

module.exports = tdAssertions