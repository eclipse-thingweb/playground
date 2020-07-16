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

const validate = require("./assertionTests")
const checkCoverage = require("./checkCoverage")
const mergeResults = require("./mergeResults")

// JSON to CSV and vice versa libraries
const Json2csvParser = require('json2csv').Parser
const csvjson = require('csvjson')

const path = require("path")


/**
 * asdf
 * @param {string[]|Buffer[]} tdStrings The Thing Description(s) to check as an array of strings or Buffers.
 * @param {Function} fileLoader (string) => string Path to a file as input, should return file content
 * @param {Function} logFunc OPT (string) => void; Callback used to log the validation progress.
 * @param {object} givenManual OPT JSON object of the manual assertions
 * @param {boolean} locally OPT set to true if you don't call the function as a module
 *                          (-> prefixes ./node_modules/playground-assertions)
 */
function tdAssertions(tdStrings, fileLoader, logFunc, givenManual, locally=false) {
    return new Promise( (res, rej) => {

        // parameter handling
        if(typeof tdStrings !== "object") {throw new Error("tdStrings has to be an Array of Strings or Buffers")}
        if(typeof fileLoader !== "function") {throw new Error("jsonLoader has to be a function")}
        if(logFunc === undefined) {logFunc = console.log}
        if(givenManual !== undefined && typeof givenManual !== "object") {
            throw new Error("givenManual have to be a JSON object if given.")
        }
        const pathOffset = locally ? "" : path.join("./node_modules", "playground-assertions")
        // loading files
        const loadProm = []
        loadProm.push(collectAssertionSchemas(path.join(pathOffset, "./assertions"), path.join(pathOffset, "./list.json"), fileLoader))
        loadProm.push(fileLoader(path.join(pathOffset, "./node_modules", "playground-core", "td-schema.json")))
        if (givenManual === undefined) {loadProm.push(fileLoader(path.join(pathOffset, "./manual.csv")))}

        Promise.all(loadProm).then( promResults => {

            const options = {
                delimiter: ',', // optional
                quote: '"' // optional
            }
            const assertionSchemas = promResults.shift()
            const tdSchema = promResults.shift()
            const manualAssertionsJSON = (givenManual === undefined) ?
                                        csvjson.toObject(promResults.shift().toString(), options) :
                                        givenManual

            const jsonResults = {}
            tdStrings.forEach( tdToValidate => {
                const tdId = JSON.parse(tdToValidate).id
                const tdName = tdId.replace(/:/g, "_")
                if (typeof tdToValidate === "string") {tdToValidate = Buffer.from(tdToValidate, "utf8")}

                if (jsonResults[tdName] !== undefined) {throw new Error("TDs have same Ids: " + tdName)}
                jsonResults[tdName] = validate(tdToValidate, assertionSchemas, manualAssertionsJSON, tdSchema, logFunc)
            })

            const tdNames = Object.keys(jsonResults)
            console.log(tdNames)
            if (tdNames.length > 1) {
                console.log(">1 td")
                const resultAr = []
                Object.keys(jsonResults).forEach( id => {
                    resultAr.push(jsonResults[id])
                })
                mergeResults(resultAr).then( merged => {
                    // console.log(merged)
                    checkCoverage(merged)
                    res({jsonResults, merged})
                }, err => {rej("merging failed: " + err)})
            }
            else {
                const merged = jsonResults[tdNames[0]]
                checkCoverage(merged)
                res(merged)
            }


        }, err => {
            rej("collectAssertionSchemas function problem: "+ err)
        })
    })
}

/**
 * Private helper: Loads and generates an Array containing all assertion objects
 * @param {string} assertionsDirectory path to the directory, which contains the assertions
 * @param {string} assertionsList path to the assertion filenames list
 * @param {function} loadFunction (string) => string path string as input should return file content as string
 * @returns {Array<object>} An array containing all assertion objects (already parsed)
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
        }, err => {rej("Could not load assertion list" + err)})
    })
}

/**
 * Building the CSV and its corresponding JSON structure
 *
 * @param {Array<object>} results of one Td as JSON objects array
 * @returns {string} csv formatted results
 */
function resultsToCsv(results) {
    const fields = ['ID', 'Status', 'Comment']
    const json2csvParser = new Json2csvParser({
        fields
    })
    return json2csvParser.parse(results)
}


module.exports = tdAssertions
module.exports.resultsToCsv = resultsToCsv
module.exports.assertionTests = validate
module.exports.checkCoverage = checkCoverage
module.exports.mergeResults = mergeResults