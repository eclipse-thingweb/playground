/**
 * CLI interface for the Thing Description Playground
 */
const fs = require('fs')
const path = require('path')
const tdValidator = require('@thing-description-playground/core')
const tdAssertions = require('@thing-description-playground/assertions')
const assertManualToJson = require('@thing-description-playground/assertions').manualToJson
const assertMergeResults = require('@thing-description-playground/assertions').mergeResults
const assertCheckCoverage = require('@thing-description-playground/assertions').checkCoverage
const assertResultsToCsv = require('@thing-description-playground/assertions').resultsToCsv
const tdToOAP = require('@thing-description-playground/td_to_openAPI')
const {addDefaults, removeDefaults} = require('@thing-description-playground/defaults')
const argParser = require('argly')
    .createParser({
        '--help -h': { /* Displays the output specified by this object */
            type: 'string',
            description: 'For TD playground-core validation you can call the playground \n' +
                        'validation with no input (example folder will be taken), \n'+
                        'a Thing Description (.json file), a folder with multiple Thing Descriptions, \n' +
                        'or a Folder with "valid", "invalid" and "warning" subfolder, where all included TDs \n' +
                        'will be checked whether they produce the expected validation result. \n' +
                        'Use the -a parameter for playground-assertions testing.'
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
            description: 'Path and filename of the generated assertions report (defaults to ./out/[.]assertionsTest[_$input]). \n' +
                         'Please notice that the folders you specify as target already have to exist.'
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
        },
        '--open-api -p': {
            type: 'boolean',
            description: 'Call the openAPI instance generation instead of validation/assertions.'
        },
        '--oap-yaml -y': {
            type: 'string',
            description: 'Whether openAPI should be written as YAML instead of json.'
        },
        '--default-add': {
            type: 'boolean',
            description: 'Whether the input TD should be extended by default values.'
        },
        '--default-rem': {
            type: 'boolean',
            description: 'Whether the input TD should be reduced by default values.'
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

// assign / overwrite logging functions used
const logFunc = myArguments.assertionTostd ? () => {} : console.log
if (!myArguments.assertionTostd) {console.info = () => {}}

// handle input argument
let input = myArguments.input

if (myArguments.assertions === true) {
    assertionReport()
}
else if (myArguments.openApi === true) {
    openApiGeneration()
}
else if (myArguments.defaultAdd === true || myArguments.defaultRem === true) {
    defaultManipulation()
}
else {
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

    if (input === undefined) {input = path.join("node_modules", "@thing-description-playground", "core", "examples", "tds", "valid")}

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
        else if (input.endsWith(".csv")) {
            tdsToMerge.push(assertManualToJson(fs.readFileSync(input,"utf-8")))
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
        if (tds.length > 0) {
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
        }
        else {
            res()
        }
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
        if (reports.length > 1) {
            assertMergeResults(reports).then( merged => {
                assertCheckCoverage(merged, logFunc)
                outReport(merged, ".assertionsMerged")
                res()
            }, err => {
                rej(err)
            })
        }
        else if (reports.length === 1) {
            assertCheckCoverage(reports[0], logFunc)
            res()
        }
        else {
            res()
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

    if (id === undefined) {
        id = ""
    }
    else {
        id = extractName(id)
    }

    if (myArguments.assertionNocsv) {
        data = JSON.stringify(data, undefined, 4)
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

        if(!myArguments.assertionOut && !fs.existsSync("./out")) {
            fs.mkdirSync("./out")
        }

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
    if (!input) {input = path.join("node_modules", "@thing-description-playground", "core", "examples", "tds")}
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
                    const thisProm = tdValidator(tdToCheck, console.log, {checkDefaults: false})
                    .then( result => {
                        if (statResult("failed", result.report)) {
                            console.log(el, "was supposed to be valid but gave error")
                        } else if (statResult("warning", result.report)) {
                            console.log(el, "was supposed to be valid but gave warning")
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
                    console.log("\nNo valid TD to check has been found")
                }
                else if (validNames.length === validCount) {
                    console.log("\nValidity test succesful. All TDs that are supposed to be valid are indeed valid")
                }
                else {
                    console.log("\nValidity test NOT successful, ", validCount, "/", validNames.length, "passed the validity test")
                }
            }, err => {console.error("\nValid TD Check broken! " + err)})
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
                    const thisProm = tdValidator(tdToCheck, console.log, {checkDefaults: false})
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
                    console.log("\nNo invalid TD to check has been found")
                }
                else if (invalidNames.length === invalidCount) {
                    console.log("\nInvalidity test succesful. All TDs that are supposed to be invalid are indeed valid")
                }
                else {
                    console.log(
                        "\nInvalidity test NOT successful, ", invalidCount, "/", invalidNames.length, "passed the invalidity test"
                        )
                }
            }, err => {console.error("\nInvalid TD Check broken!" + err)})
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
                    const thisProm = tdValidator(tdToCheck, console.log, {checkDefaults: false})
                    .then( result => {
                        if (statResult("failed", result.report)) {
                            console.log(el, "was supposed to give a warning but gave error")
                            // result.console.forEach( line => {console.log(line)} )
                        } else if (statResult("warning", result.report)) {
                            warnCount++
                        } else {
                            console.log(el, "was supposed to give a warning but passed all the tests")
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
                    console.log("\nNo warning TD to check has been found")
                }
                else if (warnNames.length === warnCount) {
                    console.log("\nWarning test succesful. All TDs that are supposed to give a warning gave a warning")
                }
                else {
                    console.log("\nWarning test NOT successful, ", warnCount, "/", warnNames.length, "passed the warning test")
                }
            }, err => {console.error("\nWarning TD Check broken!" + err)})
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

    tdValidator(td, console.log,{checkDefaults: !myArguments.nodefaults,checkJsonLd: !myArguments.nojsonld})
    .then( result => {
        console.log("OKAY \n")
        console.log("\n")
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
    return Object.keys(report).some( el => (report[el] === keyword))
}

/**
 * generate an openAPI instance from a TD provided as input
 */
function openApiGeneration() {
    // input checks
    if (!input) {input = path.join("node_modules", "@thing-description-playground", "core", "examples", "tds", "valid", "simple.json")}
    if (!fs.lstatSync(input).isFile()) {
        throw new Error("please provide one File as input for the open API instance generation")
    }
    if(!fs.existsSync("./out")) {
        fs.mkdirSync("./out")
    }

    // actual function call
    const tdToConvert = JSON.parse(fs.readFileSync(input, "utf-8"))
    tdToOAP(tdToConvert).then( openApiInstance => {
        const name = extractName(input)
        const outpath = path.join("./out", name + "_openapi")
        if (myArguments.oapYaml) {
            fs.writeFileSync(outpath + ".yaml", openApiInstance.yaml)
        }
        else {
            fs.writeFileSync(outpath + ".json", JSON.stringify(openApiInstance.json, undefined, 4))
        }
    })
}

/**
 * add/remove defaults from 
 */
function defaultManipulation() {
    // input checks
    if (!input) {input = path.join("node_modules", "@thing-description-playground", "core", "examples", "tds", "valid", "simple.json")}
    if (!fs.lstatSync(input).isFile()) {
        throw new Error("please provide one File as input for the open API instance generation")
    }
    if(!fs.existsSync("./out")) {
        fs.mkdirSync("./out")
    }

    // actual function call
    const tdToConvert = JSON.parse(fs.readFileSync(input, "utf-8"))
    const name = extractName(input)
    let outpath = path.join("./out", name)
    if (myArguments.defaultAdd === true) {
        addDefaults(tdToConvert)
        outpath += "_extended.json"
    }
    else if (myArguments.defaultRem === true) {
        removeDefaults(tdToConvert)
        outpath += "_reduced.json"
    }
    else {
        throw new Error("argument problem, defaultManipulation")
    }
    fs.writeFileSync(outpath, JSON.stringify(tdToConvert, undefined, 4))
}

/**
 * Extracts the filename from a path like string
 * @param {string} pathLike The path/filename(+fileending) of a file
 */
function extractName(pathLike) {
    // remove path if existing
    if (pathLike.indexOf(path.sep) !== -1) {
        pathLike = pathLike.split(path.sep)
                            .pop()
    }
    // remove file ending if existing
    if (pathLike.indexOf(".") !== -1) {
        pathLike = pathLike.split(".")
                            .slice(0,-1)
                            .join(".")
    }
    return pathLike
}
