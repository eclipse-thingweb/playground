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

/**
 * CLI interface for the Thing Description Playground
 */
const fs = require('fs')
const path = require('path')
const tdValidator = require('playground-core')
const tdAssertions = require('playground-assertions')
const assertManualToJson = require('playground-assertions').manualToJson
const assertMergeResults = require('playground-assertions').mergeResults
const assertCheckCoverage = require('playground-assertions').checkCoverage
const assertAssertionTests = require('playground-assertions').assertionTests
const assertResultsToCsv = require('playground-assertions').resultsToCsv
const assertCollectAssertionSchemas = require('playground-assertions').collectAssertionSchemas
const argParser = require('argly')
    .createParser({
        '--help': {
            type: 'string',
            description: 'You can call the playground validation with no input (example folder will be taken), \n'+
                        'a Thing Description (.json file), a folder with multiple Thing Descriptions, \n' +
                        'or a Folder with "valid", "invalid" and "warning" subfolder, where all included TDs \n' +
                        'will be checked whether they produce the expected validation result.'
        },
        '--input -i *': {
            type: 'string',
            description: 'The file or the folder containing the files, which will be validated.'
        },
        '--nojsonld -j': {
            type: 'boolean',
            description: 'Turn off the JSON-LD validation (for example because internet connection is not available).'
        },
        '--nodefaults -d': {
            type: 'boolean',
            description: 'Turn off the Full JSON Schema validation, which checks e.g. for default values being explicitly set.'
        },
        '--assertions -a': {
            type: 'boolean',
            description: 'Call the assertion report instead of the core validation, \n' +
                        'if files with .csv ending are given as input merging assertion reports is done.'
        },
        '--assertion-out -o': {
            type: 'string',
            description: 'path and filename of the generated assertions report (defaults to ./out/[$input_][.]assertionsTest)'
        },
        '--assertion-nomerge -n': {
            type: 'boolean',
            description: 'if multiple files where given as input, don\'t create a merged report, but one for each'
        },
        '--assertion-tostd -s': {
            type: 'boolean',
            description: 'output the report(s) as stdout and don\'t write them to a file'
        },
        '--assertion-nocsv -c': {
            type: 'boolean',
            description: 'return assertion report(s) in json format instead of csv'
        },
        '--assertion-manual -m': {
            type: 'string',
            description: 'path and filename to manual.csv file'
        }
    })
    .usage('Usage: $0 [input] [options]')
    .example(
        'Try with Example TDs',
        '$0')
    .example(
        'Validate file',
        '$0 TD.json'
    )
    .example(
        'Validate folder content',
        '$0 myFolder'
    )
    .example(
        'Turn off JSON-LD validation',
        '$0 TD.json -j'
    )
    .validate(function(result) {
        if (result.help) {
            this.printUsage()
            process.exit(0)
        }
    })
    .onError(function(err) {
        this.printUsage()
        console.error(err)
        process.exit(1)
    })
const myArguments = argParser.parse()
let tdToCheck = ""
const tdsToCheck = []
const tdsToMerge = []
let manualAssertions
const logFunc = myArguments.assertionTostd ? () => {} : console.log


const tdSchemaPath = path.join("node_modules", "playground-core", "td-schema.json")
const tdFullSchemaPath = path.join("node_modules", "playground-core", "td-schema-full.json")

const tdSchema = fs.readFileSync(tdSchemaPath,"utf-8")
const tdSchemaFull = fs.readFileSync(tdFullSchemaPath, "utf-8")

// handle input argument
let input = myArguments.input

if (myArguments.assertions === true) {
    assertionReport()
} else {
    coreValidation()
}

/**
 * handle manual & input param
 */
function assertionReport() {

    let assertType
    // handle manual param
    if (myArguments.assertionManual) {
        manualAssertions = assertManualToJson(fs.readFileSync(myArguments.assertionManual, "utf-8"))
    }

    if (input === undefined) {input = path.join("node_modules", "playground-core", "examples", "valid")}

    if (typeof input === "object") {
        assertType = "list"
        // check given TDs
        input.forEach( el => {
            if(el.endsWith(".json") || el.endsWith(".jsonld")) {
                tdsToCheck.push(fs.readFileSync(el))
            }
            else if (el.endsWith(".csv")) {
                tdsToMerge.push(assertManualToJson(fs.readFileSync(el, "utf-8")))
            }
            else {
                console.log("CANNOT HANDLE file of list: ", el)
            }
        })
    }
    else if (fs.lstatSync(input).isDirectory()) {
        assertType = "dir"
        // check TDs contained in the directory
        fs.readdirSync(input).forEach( el => {
            if(el.endsWith(".json") || el.endsWith(".jsonld")) {
                tdsToCheck.push(fs.readFileSync(path.join(input, el)))
            }
            else if (el.endsWith(".csv")) {
                tdsToMerge.push(assertManualToJson(fs.readFileSync(path.join(input, el), "utf-8")))
            }
            else {
                console.log("CANNOT HANDLE file in dir: ", path.join(input, el))
            }
        })
    }
    else {
        // check single TD
        assertType = "file"
        if(input.endsWith(".json") || input.endsWith(".jsonld")) {
            tdsToCheck.push(fs.readFileSync(input))
        }
        else {
            console.log("CANNOT HANDLE file: ", el)
            return
        }
    }
    assertTd(tdsToCheck, assertType)
    .then( () => {
        mergeReports(tdsToMerge)
    })
}


/**
 * Call assertion testing function and forward results
 * @param {*} tds One or more td to do assertion testing
 * @param {*} type "file", "list" or "dir" are valid types
 */
function assertTd(tds, type) {
    return new Promise( (res, rej) => {
        if (tds.length === 0) {res() }
        tdAssertions(tds, fileLoader, logFunc, manualAssertions).then( results => {
            if (type === "file") {
                outReport(results, "assertionsTest_", input)
                res()
            }
            else if (type === "list" || type === "dir") {
                if (myArguments.assertionNomerge) {
                    Object.keys(results.jsonResults).forEach( id => {
                        outReport(results.jsonResults[id], "assertionsTest_", id)
                    })
                }
                else {
                    outReport(results.merged, ".assertionsTest")
                    if (tdsToMerge.length > 0) {
                        tdsToMerge.push(results.merged)
                    }
                }
                res()
            }
            else {
                rej("unknown assertion type")
            }
        })
    })
}

/**
 * Takes multiple assertion reports as objects
 * and calls the function to merge them and
 * output the merged report
 * @param {Array<object>} tds
 */
function mergeReports(reports) {
    return new Promise( (res, rej) => {
        if (reports.length > 0) {
            console.log(reports)
            console.log(reports.length)
            assertMergeResults(reports).then( merged => {
                assertCheckCoverage(merged, logFunc)
                outReport(merged, ".assertionsMerged")
                res()
            }, err => {
                rej(err)
            })
        }
    })
}

/**
 * Outputs the assertion report to either a file or stdout
 * @param {object} data report object
 * @param {string} pathFragment default name string for output file
 * @param {string} id unique name string
 */
function outReport(data, pathFragment, id) {

    if (id === undefined) {id = ""}
    else {
        id = id.split(path.sep)
                .pop()
                .split(".")
                .slice(0,-1)
                .join(".")
    }

    if (myArguments.assertionNocsv) {
        data = JSON.stringify(data)
    }
    else {
        data = assertResultsToCsv(data)
    }

    if (myArguments.assertionTostd) {
        process.stdout.write(data)
    } else {
        const fileEnd = myArguments.assertionNocsv ? ".json" : ".csv"
        const outpath = myArguments.assertionOut ? myArguments.assertionOut : ("./out/" + pathFragment)
        const wholepath = outpath + id + fileEnd

        fs.writeFileSync(wholepath, data)
    }
}

/**
 * simple promise based function to read a file
 * @param {string} loc path to the file to read
 */
function fileLoader(loc) {
	return new Promise( (res, rej) => {
		fs.readFile(loc, "utf8", (err, data) => {
			if (err) {rej(err)}
			else {res(data)}
		})
	})
}

/**
 * handle arguments to call the playground-core validation
 * and write outputs accordingly
 */
function coreValidation() {
    if (!input) {input = path.join("node_modules", "playground-core", "examples")}
    if(fs.lstatSync(input).isDirectory()) {

        // check Valid, Invalid and Warning Subfolders
        const validPath = path.join(input, "valid")
        if (fs.existsSync(validPath) && fs.lstatSync(validPath).isDirectory()) {
            console.log("Starting Valid folder test")
            const validNames = fs.readdirSync(validPath)
            let validCount = 0
            const checkPromises = []
            validNames.forEach( el => {
                if (el.endsWith(".json") || el.endsWith(".jsonld")) {
                    tdToCheck = fs.readFileSync(path.join(validPath, el), "utf-8")
                    const thisProm = tdValidator(tdToCheck, tdSchema, tdSchemaFull, console.log, {checkDefaults: false})
                    .then( result => {
                        if (statResult("failed", result.report)) {
                            console.log(el, "was supposed to be valid but gave error")
                            // result.console.forEach( line => {console.log(line)} )
                        } else if (statResult("warning", result.report)) {
                            console.log(el, "was supposed to be valid but gave warning")
                            // result.console.forEach( line => {console.log(line)} )
                        } else {
                            validCount++
                        }
                    }, err => {
                        console.error("ERROR", err)
                    })
                    checkPromises.push(thisProm)
                }
            })
            Promise.all(checkPromises).then( () => {
                if (validNames.length === 0) {
                    console.log("No valid TD to check has been found")
                }
                else if (validNames.length === validCount) {
                    console.log("Validity test succesful. All TDs that are supposed to be valid are indeed valid")
                }
                else {
                    console.log("Validity test NOT successful, ", validCount, "/", validNames.length, "passed the validity test")
                }
            }, err => {console.error("Valid TD Check broken! " + err)})
        }

        const invalidPath = path.join(input, "invalid")
        if (fs.existsSync(invalidPath) && fs.lstatSync(invalidPath).isDirectory()) {
            console.log("Starting invalid folder test")
            const invalidNames = fs.readdirSync(invalidPath)
            let invalidCount = 0
            const checkPromises = []
            invalidNames.forEach( el => {
                if (el.endsWith(".json") || el.endsWith(".jsonld")) {
                    tdToCheck = fs.readFileSync(path.join(invalidPath, el), "utf-8")
                    const thisProm = tdValidator(tdToCheck, tdSchema, tdSchemaFull, console.log, {checkDefaults: false})
                    .then( result => {
                        if (statResult("failed", result.report)) {
                            invalidCount++
                        } else {
                            console.log(el, "was supposed to be invalid but was not")
                        }
                    }, err => {
                        console.error("ERROR", err)
                    })
                    checkPromises.push(thisProm)
                }
            })
            Promise.all(checkPromises).then( () => {
                if (invalidNames.length === 0) {
                    console.log("No invalid TD to check has been found")
                }
                else if (invalidNames.length === invalidCount) {
                    console.log("Invalidity test succesful. All TDs that are supposed to be invalid are indeed valid")
                }
                else {
                    console.log(
                        "Invalidity test NOT successful, ", invalidCount, "/", invalidNames.length, "passed the invalidity test"
                        )
                }
            }, err => {console.error("Invalid TD Check broken!" + err)})
        }

        const warnPath = path.join(input, "warning")
        if (fs.existsSync(warnPath) && fs.lstatSync(warnPath).isDirectory()) {
            console.log("Starting Warning folder test")
            const warnNames = fs.readdirSync(warnPath)
            let warnCount = 0
            const checkPromises = []
            warnNames.forEach( el => {
                if (el.endsWith(".json") || el.endsWith(".jsonld")) {
                    tdToCheck = fs.readFileSync(path.join(warnPath, el), "utf-8")
                    const thisProm = tdValidator(tdToCheck, tdSchema, tdSchemaFull, console.log, {checkDefaults: false})
                    .then( result => {
                        if (statResult("failed", result.report)) {
                            console.log(el, "was supposed to give a warning but gave error")
                            // result.console.forEach( line => {console.log(line)} )
                        } else if (statResult("warning", result.report)) {
                            warnCount++
                        } else {
                            console.log(el, "was supposed to be valid but passed all the tests")
                            // result.console.forEach( line => {console.log(line)} )
                        }
                    }, err => {
                        console.error("ERROR", err)
                    })
                    checkPromises.push(thisProm)
                }
            })
            Promise.all(checkPromises).then( () => {
                if (warnNames.length === 0) {
                    console.log("No warning TD to check has been found")
                }
                else if (warnNames.length === warnCount) {
                    console.log("Warning test succesful. All TDs that are supposed to give a warning gave a warning")
                }
                else {
                    console.log("Warning test NOT successful, ", warnCount, "/", warnNames.length, "passed the validity test")
                }
            }, err => {console.error("Warning TD Check broken!" + err)})
        }

        // check TDs contained in the directory
        fs.readdirSync(input).forEach( el => {
            if (el.endsWith(".json") || el.endsWith(".jsonld")) {
                tdToCheck = fs.readFileSync(path.join(input, el), "utf-8")
                checkTd(tdToCheck)
            }
        })

    }
    else {
        tdToCheck = fs.readFileSync(input, "utf-8")
        checkTd(tdToCheck)
    }
}

/**
 * subfunction of coreValidation
 * @param {*} td
 */
function checkTd(td) {

    tdValidator(td, tdSchema, tdSchemaFull, console.log,{checkDefaults: !myArguments.nodefaults,checkJsonLd: !myArguments.nojsonld})
    .then( result => {
        console.log("OKAY \n")
        // result.console.forEach(el => {
        //    console.log(el)
        // })
        console.log("\n")
        // delete result.console
        console.log("--- Report ---\n", result, "\n--------------")
    }, err => {
        console.log("ERROR")
        console.error(err)
    })
}

/**
 * subfunction of coreValidation
 * @param {string} keyword Can be "passed", "failed" or "warning"
 * @param {object} report Report object that will be inspected
 */
function statResult(keyword, report) {
    return (report.json === keyword
    || report.schema === keyword
    || report.defaults === keyword
    || report.jsonld === keyword
    || report.add === keyword)
}