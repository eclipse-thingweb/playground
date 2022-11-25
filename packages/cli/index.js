/** ================================================================================================
 * ?                                           ABOUT
 * @description    :  CLI interface for the Thing Description Playground
 *================================================================================================**/


/** ================================================================================================
 *                                         Imports
 *================================================================================================**/
const fs = require('fs')
const path = require('path')
const { tdValidator, tmValidator } = require('@thing-description-playground/core')
const { tdAssertions, tmAssertions }= require('@thing-description-playground/assertions')
const assertManualToJson = require('@thing-description-playground/assertions').manualToJson
const assertMergeResults = require('@thing-description-playground/assertions').mergeResults
const assertCheckCoverage = require('@thing-description-playground/assertions').checkCoverage
const assertResultsToCsv = require('@thing-description-playground/assertions').resultsToCsv
const {addDefaults, removeDefaults} = require('@thing-description-playground/defaults')
const tdToOAP = require('@thing-description-playground/td_to_openapi')
const tdToAAP = require('@thing-description-playground/td_to_asyncapi')
const commander = require('commander')
const EventEmitter = require("events")
const cliProgress = require('cli-progress')

/** ================================================================================================
 *                                         CLI Configuration
 *================================================================================================**/
const program = new commander.Command()
program
    .description('For TD Playground core validation you can call the Playground \n' +
                    'validation with no input (example folder will be taken), \n'+
                    'one or multiple Thing Descriptions (.json files), a folder with multiple Thing Descriptions, \n' +
                    'or a Folder with "valid", "invalid" and "warning" subfolder, where all included TDs \n' +
                    'will be checked whether they produce the expected validation result. \n' +
                    'Use the -a parameter for assertions testing.')


    .addOption(new commander.Option('-t, --type <type>',
    'The type of JSON documents that are passed as inputs').choices(['TD', 'TM', 'AUTO']).default('TD'))
    .option('-i, --input <pathToInputs...>',
    'The files or the folders containing the files, which will be processed and/or validated', undefined)
    .option('-j, --no-jsonld', 'Turn off the JSON-LD validation (for example because internet connection is not available)')
    .option('-d, --no-defaults', 'Turn off the Full JSON Schema validation, which checks e.g. for default values being explicitly set')
    .option('-a, --assertions', 'Call the assertion report instead of the core validation, \n' +
                                'if files with .csv ending are given as input merging assertion reports is done')
    .option('-o, --assertion-out <pathToOutput>',
    'Path and filename of the generated assertions report (defaults to ./out/[.]assertionsTest[_$input]) \n' +
                                    'Please notice that the folders you specify as target already have to exist.')
    .option('-n, --assertion-no-merge',
    'If multiple files where given as input, don\'t create a merged report, but create one for each')
    .option('-s, --assertion-to-std', 'Output the report(s) as stdout and don\'t write them to a file')
    .option('-c, --assertion-no-csv', 'Return assertion report(s) in JSON format instead of CSV')
    .option('-m, --assertion-manual <pathToManual>', 'Path and filename to manual.csv file')
    .option('--merge-only <pathToInputs...>', 'Path and filename of the csv files to merge')
    .option('-p, --open-api', 'Call the OpenAPI instance generation instead of validation/assertions')
    .option('-y --oap-yaml', 'Whether OpenAPI should be written as YAML instead of JSON')
    .option('--async-api', 'Call the AsyncAPI instance generation instead of validation/assertions')
    .option('--aap-yaml', 'Whether AsyncAPI should be written as YAML instead of json.')
    .option('--default-add', 'Whether the input TD should be extended by default values')
    .option('--default-rem', 'Whether the input TD should be reduced by default values')

const myArguments = program.parse().opts()

// stop doing anything if all that is needed is merging two files
if(myArguments.mergeOnly){
    const fileArray = []
    const toMergeFilePaths = myArguments.mergeOnly
    myArguments.type = null
    for (let index = 0; index < toMergeFilePaths.length; index++) {
        const element = toMergeFilePaths[index]
        const fileCSV = fs.readFileSync(element).toString()
        const fileJSON = assertManualToJson(fileCSV)
        fileArray.push(fileJSON)
    }
    mergeReports(fileArray).then(element=>{
    })

} else {
    // do nothing
}

// assign / overwrite logging functions used
const logFunc = myArguments.assertionToStd ? () => {} : console.log
if (!myArguments.assertionToStd) {console.info = () => {}}

// handle input argument
let input = myArguments.input
if( input && input.length === 1 ) input = input[0]

/** ================================================================================================
 *                                         Handling TDs
 *================================================================================================**/

if(myArguments.type === 'TD') {
    if (myArguments.assertions === true) {
        tdAssertionReport(input)
    }
    else if (myArguments.openApi === true) {
        openApiGeneration()
    }
    else if (myArguments.asyncApi === true) {
        asyncApiGeneration()
    }
    else if (myArguments.defaultAdd === true || myArguments.defaultRem === true) {
        defaultManipulation()
    }
    else {
        coreValidation()
    }
}

/** ================================================================================================
 *                                         Handle TMs
 *================================================================================================**/

 if(myArguments.type === 'TM') {
     console.log("Checking TMs...")
    if (myArguments.assertions === true) {
        console.log("Checking Assertions...")
        tmAssertionReport(input)
    }
    else if (myArguments.defaultAdd === true || myArguments.defaultRem === true) {
        defaultManipulation()
    }
    else {
        tmCoreValidation()
    }
}

if(myArguments.type === 'AUTO') {
    console.error("Not implemented")
}

/** ================================================================================================
 *                                         TD functions
 *================================================================================================**/
/**
 * handle manual & input param
 */
function tdAssertionReport(inputParam) {
    const tdsToCheck = []
    const tdsToMerge = []
    let manualAssertions

    let numberOfFilesAssertion = 0
    let numberOfFilesMerge = 0

    const bar = new cliProgress.SingleBar({clearOnComplete: true,
        format: 'progress [{bar}] {percentage}% | TD Name: {tdName} | {value}/{total} \n'}, cliProgress.Presets.shades_classic)

    let assertType
    // handle manual param
    if (myArguments.assertionManual) {
        manualAssertions = assertManualToJson(fs.readFileSync(myArguments.assertionManual, "utf-8"))
    }

    if (inputParam === undefined && !myArguments.mergeOnly) {
        inputParam = path.join("node_modules", "@thing-description-playground", "core", "examples", "tds", "valid")
    }

    if (typeof inputParam === "object") {
        assertType = "list"
        // check given TDs
        inputParam.forEach( el => {
            if(el.endsWith(".json") || el.endsWith(".jsonld")) {
                tdsToCheck.push(fs.readFileSync(el))
                numberOfFilesAssertion++
            }
            else if (el.endsWith(".csv")) {
                tdsToMerge.push(assertManualToJson(fs.readFileSync(el, "utf-8")))
                numberOfFilesMerge++
            }
            else {
                console.log("CANNOT HANDLE file of list: ", el)
            }
        })
    }
    else if (fs.lstatSync(inputParam).isDirectory()) {
        assertType = "dir"
        // check TDs contained in the directory
        fs.readdirSync(inputParam).forEach( el => {
            if(el.endsWith(".json") || el.endsWith(".jsonld")) {
                tdsToCheck.push(fs.readFileSync(path.join(inputParam, el)))
                numberOfFilesAssertion++
            }
            else if (el.endsWith(".csv")) {
                tdsToMerge.push(assertManualToJson(fs.readFileSync(path.join(inputParam, el), "utf-8")))
                numberOfFilesMerge++
            }
            else {
                console.log("CANNOT HANDLE file in dir: ", path.join(inputParam, el))
            }
        })
    }
    else {
        // check single TD
        assertType = "file"
        if(inputParam.endsWith(".json") || inputParam.endsWith(".jsonld")) {
            tdsToCheck.push(fs.readFileSync(inputParam))
            numberOfFilesAssertion++
        }
        else if (inputParam.endsWith(".csv")) {
            tdsToMerge.push(assertManualToJson(fs.readFileSync(input,"utf-8")))
            numberOfFilesMerge++
        }
        else {
            console.log("CANNOT HANDLE file: ", el)
            return
        }
    }
    const doneEventEmitter = new EventEmitter()
    doneEventEmitter.on("start", tdName =>  { bar.increment(1, {tdName})})

    bar.start(numberOfFilesAssertion, 0)
    assertTd(tdsToCheck, assertType, tdsToMerge, manualAssertions, doneEventEmitter)
    .then( () => {
        bar.stop()
        mergeReports(tdsToMerge)
    })
}


/**
 * Call assertion testing function and forward results
 * @param {*} tds One or more td to do assertion testing
 * @param {*} type "file", "list" or "dir" are valid types
 */
function assertTd(tds, type, tdsToMerge, manualAssertions, doneEventEmitter) {
    return new Promise( (res, rej) => {
        if (tds.length > 0) {
            tdAssertions(tds, fileLoader, logFunc, manualAssertions, doneEventEmitter).then( results => {
                if (type === "file") {
                    outReport(results, "assertionsTest_", input)
                    res()
                }
                else if (type === "list" || type === "dir") {
                    if (myArguments.assertionNoMerge) {
                        Object.keys(results.jsonResults).forEach( id => {
                            outReport(results.jsonResults[id], "assertionsTest_", id)
                        })
                    }
                    else {
                        // Needed for batch assertions for folders with one file
                        if(!results.merged) results = {"merged": results}

                        outReport(results.merged, "assertionsTest")
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
                outReport(merged, "assertionsMerged")
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

    if (myArguments.assertionNoCsv) {
        data = JSON.stringify(data, undefined, 4)
    }
    else {
        data = assertResultsToCsv(data)
    }

    if (myArguments.assertionToStd) {
        process.stdout.write(data)
    } else {
        const fileEnd = myArguments.assertionNoCsv ? ".json" : ".csv"
        const outpath = myArguments.assertionOut ? myArguments.assertionOut : path.join('.', 'out', pathFragment)
        const wholepath = outpath + id + fileEnd

        console.log(wholepath)

        if(!myArguments.assertionOut && !fs.existsSync(path.join('.', 'out'))) {
            fs.mkdirSync(path.join('.', 'out'))
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
 * handle arguments to call the core validation
 * and write outputs accordingly
 */
function coreValidation() {
    let tdToCheck = ""

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
                    console.log("\nValidity test successful. All TDs that are supposed to be valid are indeed valid")
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
                    console.log("\nInvalidity test successful. All TDs that are supposed to be invalid are indeed invalid")
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
                    const thisProm = tdValidator(tdToCheck, console.log, {checkDefaults: true})
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
                    console.log("\nWarning test successful. All TDs that are supposed to give a warning gave a warning")
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

    tdValidator(td, console.log,{checkDefaults: myArguments.defaults, checkJsonLd: myArguments.jsonld})
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
        throw new Error("please provide one File as input for the OpenAPI instance generation")
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

function asyncApiGeneration() {
    // input checks
    if (!input) {input = path.join("node_modules", "@thing-description-playground", "core", "examples", "tds", "valid", "simple.json")}
    if (!fs.lstatSync(input).isFile()) {
        throw new Error("please provide one File as input for the AsyncAPI instance generation")
    }
    if(!fs.existsSync("./out")) {
        fs.mkdirSync("./out")
    }

    // actual function call
    const tdToConvert = JSON.parse(fs.readFileSync(input, "utf-8"))
    tdToAAP(tdToConvert).then( asyncApiInstance => {
        const name = extractName(input)
        const outpath = path.join("./out", name + "_asyncapi")
        if (myArguments.aapYaml) {
            fs.writeFileSync(outpath + ".yaml", asyncApiInstance.yaml)
        }
        else {
            fs.writeFileSync(outpath + ".json", JSON.stringify(asyncApiInstance.json, undefined, 4))
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
        throw new Error("please provide one File as input for the OpenAPI instance generation")
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
    // console.log("Before: "+pathLike)
    pathLike = path.basename(pathLike)
    // console.log("After: "+pathLike)
    // remove file ending if existing
    if (pathLike.indexOf(".") !== -1) {
        pathLike = pathLike.split(".")
                            .slice(0,-1)
                            .join(".")
    }
    return pathLike
}

/** ================================================================================================
 *                                         TM functions
 *================================================================================================**/

//* This

/**
 *
 * @param {*} input
 * @returns
 */
function tmAssertionReport(inputParam) {
    const tmsToCheck = []
    const tmsToMerge = []
    let manualAssertions

    let assertType
    // handle manual param
    if (myArguments.assertionManual) {
        manualAssertions = assertManualToJson(fs.readFileSync(myArguments.assertionManual, "utf-8"))
    }

    if (inputParam === undefined) {inputParam = path.join("node_modules", "@thing-description-playground", "core",
    "examples", "tms", "valid")}

    let numberOfFilesAssertion = 0
    let numberOfFilesMerge = 0

    const bar = new cliProgress.SingleBar({format: 'progress [{bar}] {percentage}% | TM Name: {tmName} | {value}/{total} \n'},
    cliProgress.Presets.shades_classic)

    if (typeof inputParam === "object") {
        assertType = "list"
        // check given TMs
        inputParam.forEach( el => {
            if(el.endsWith(".json") || el.endsWith(".jsonld")) {
                tmsToCheck.push(fs.readFileSync(el))
                numberOfFilesAssertion++
            }
            else if (el.endsWith(".csv")) {
                tmsToMerge.push(assertManualToJson(fs.readFileSync(el, "utf-8")))
                numberOfFilesMerge++
            }
            else {
                console.log("CANNOT HANDLE file of list: ", el)
            }
        })
    }
    else if (fs.lstatSync(inputParam).isDirectory()) {
        assertType = "dir"
        // check TMs contained in the directory
        fs.readdirSync(inputParam).forEach( el => {
            if(el.endsWith(".json") || el.endsWith(".jsonld")) {
                tmsToCheck.push(fs.readFileSync(path.join(inputParam, el)))
                numberOfFilesAssertion++
            }
            else if (el.endsWith(".csv")) {
                tmsToMerge.push(assertManualToJson(fs.readFileSync(path.join(input, el), "utf-8")))
                numberOfFilesMerge++
            }
            else {
                console.log("CANNOT HANDLE file in dir: ", path.join(input, el))
            }
        })
    }
    else {
        // check single TM
        assertType = "file"
        if(inputParam.endsWith(".json") || inputParam.endsWith(".jsonld")) {
            tmsToCheck.push(fs.readFileSync(inputParam))
            numberOfFilesAssertion++
        }
        else if (inputParam.endsWith(".csv")) {
            tmsToMerge.push(assertManualToJson(fs.readFileSync(inputParam,"utf-8")))
            numberOfFilesMerge++
        }
        else {
            console.log("CANNOT HANDLE file: ", el)
            return
        }
    }
    const doneEventEmitter = new EventEmitter()
    doneEventEmitter.on("start", tmName =>  { bar.increment(1, {tmName})})

    bar.start(numberOfFilesAssertion, 0)
    assertTm(tmsToCheck, assertType, tmsToMerge, manualAssertions, doneEventEmitter)
    .then( () => {
        setTimeout(() => {bar.stop()}, 100)
        mergeReports(tmsToMerge)
    })
}


/**
 * handle arguments to call the core validation
 * and write outputs accordingly
 */
 function tmCoreValidation() {
    let tmToCheck = ""

    if (!input) {input = path.join("node_modules", "@thing-description-playground", "core", "examples", "tms")}
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
                    tmToCheck = fs.readFileSync(path.join(validPath, el), "utf-8")
                    const thisProm = tmValidator(tmToCheck, console.log, {checkDefaults: false})
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
                    console.log("\nValidity test successful. All TDs that are supposed to be valid are indeed valid")
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
                    tmToCheck = fs.readFileSync(path.join(invalidPath, el), "utf-8")
                    const thisProm = tmValidator(tmToCheck, console.log, {checkDefaults: false})
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
                    console.log("\nInvalidity test successful. All TDs that are supposed to be invalid are indeed invalid")
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
                    tmToCheck = fs.readFileSync(path.join(warnPath, el), "utf-8")
                    const thisProm = tmValidator(tmToCheck, console.log, {checkDefaults: true})
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
                    console.log("\nWarning test successful. All TDs that are supposed to give a warning gave a warning")
                }
                else {
                    console.log("\nWarning test NOT successful, ", warnCount, "/", warnNames.length, "passed the warning test")
                }
            }, err => {console.error("\nWarning TD Check broken!" + err)})
        }

        // check TDs contained in the directory
        fs.readdirSync(input).forEach( el => {
            if (el.endsWith(".json") || el.endsWith(".jsonld")) {
                tmToCheck = fs.readFileSync(path.join(input, el), "utf-8")
                checkTm(tmToCheck)
            }
        })

    }
    else {
        tmToCheck = fs.readFileSync(input, "utf-8")
        checkTm(tmToCheck)
    }
}

/**
 * Call assertion testing function and forward results
 * @param {*} tms One or more td to do assertion testing
 * @param {*} type "file", "list" or "dir" are valid types
 */
 function assertTm(tms, type, tmsToMerge, manualAssertions, doneEventEmitter) {
    return new Promise( (res, rej) => {
        if (tms.length > 0) {
            tmAssertions(tms, fileLoader, logFunc, manualAssertions, doneEventEmitter).then( results => {
                if (type === "file") {
                    outReport(results, "tmAssertionsTest_", input)
                    res()
                }
                else if (type === "list" || type === "dir") {
                    if (myArguments.assertionNoMerge) {
                        Object.keys(results.jsonResults).forEach( id => {
                            outReport(results.jsonResults[id], "tmAssertionsTest_", id)
                        })
                    }
                    else {
                        // Needed for batch assertions for folders with one file
                        if(!results.merged) results = {"merged": results}

                        outReport(results.merged, "tmAssertionsTest")
                        if (tmsToMerge.length > 0) {
                            tmsToMerge.push(results.merged)
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
 * subfunction of coreValidation
 * @param {*} tm
 */
 function checkTm(tm) {

    tmValidator(tm, console.log,{checkDefaults: myArguments.defaults, checkJsonLd: myArguments.jsonld})
    .then( result => {
        console.log("OKAY \n")
        console.log("\n")
        console.log("--- Report ---\n", result, "\n--------------")
    }, err => {
        console.log("ERROR")
        console.error(err)
    })
}