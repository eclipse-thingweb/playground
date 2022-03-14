const { validate, validateTD, validateTM } = require("./assertionTests")
const checkCoverage = require("./checkCoverage")
const mergeResults = require("./mergeResults")

// JSON to CSV and vice versa libraries
const Json2csvParser = require('json2csv').Parser
const csvjson = require('csvjson')

const path = require("path")

module.exports.tdAssertions = tdAssertions
module.exports.tmAssertions = tmAssertions
module.exports.resultsToCsv = resultsToCsv
module.exports.tdAssertionTests = validateTD
module.exports.tmAssertionTests = validateTM
module.exports.checkCoverage = checkCoverage
module.exports.mergeResults = mergeResults
module.exports.manualToJson = manualToJson
module.exports.collectAssertionSchemas = collectAssertionSchemas


/**
 * Assertion testing function, does assertion testing with one/several TDs and
 * returns either a single report or one merged report and all single reports.
 * @param {string[]|Buffer[]} tdStrings The Thing Description(s) to check as an array of strings or Buffers.
 * @param {Function} fileLoader (string) => string Path to a file as input, should return file content
 * @param {Function} logFunc OPT (string) => void; Callback used to log the validation progress.
 * @param {object} givenManual OPT JSON object of the manual assertions
 */
function tdAssertions(tdStrings, fileLoader, logFunc, givenManual) {
    return new Promise( (res, rej) => {

        // parameter handling
        if(typeof tdStrings !== "object") {throw new Error("tdStrings has to be an Array of Strings or Buffers")}
        if(typeof fileLoader !== "function") {throw new Error("jsonLoader has to be a function")}
        if(logFunc === undefined) {logFunc = console.log}
        if(givenManual !== undefined && typeof givenManual !== "object") {
            throw new Error("givenManual has to be a JSON object if given.")
        }

        // set directory for node.js and browser environment
        let pathOffset
        if (process !== undefined && process.release !== undefined && process.release.name === "node") {
            pathOffset = __dirname
        } else {
            pathOffset = path.join("./node_modules", "@thing-description-playground", "assertions")
        }

        // loading files
        const loadProm = []
        loadProm.push(collectAssertionSchemas(path.join(pathOffset, "./assertions-td"), path.join(pathOffset, "./assertions-td", "./tdAssertionList.json"), fileLoader))
        loadProm.push(fileLoader(path.join(pathOffset, "./node_modules", "@thing-description-playground", "core", "td-schema.json")))
        if (givenManual === undefined) {loadProm.push(fileLoader(path.join(pathOffset, "./assertions-td", "./manual.csv")))}

        Promise.all(loadProm).then( promResults => {

            const assertionSchemas = promResults.shift()
            const tdSchema = promResults.shift()
            const manualAssertionsJSON = (givenManual === undefined) ?
                                        manualToJson(promResults.shift().toString()) :
                                        givenManual

            const jsonResults = {}
            tdStrings.forEach( tdToValidate => {
                // check if id exists, use it for name if it does, title + some rand number otherwise
                let tdName = ""
                if ("id" in JSON.parse(tdToValidate)){
                    const tdId = JSON.parse(tdToValidate).id
                    tdName = tdId.replace(/:/g, "_")
                } else {
                    const tdTitle = JSON.parse(tdToValidate).title
                    tdName = tdTitle + Math.floor(Math.random() * 1000)
                }

                if (typeof tdToValidate === "string") {tdToValidate = Buffer.from(tdToValidate, "utf8")}

                if (jsonResults[tdName] !== undefined) {throw new Error("TDs have same Ids or titles: " + tdName)}
                jsonResults[tdName] = validateTD(tdToValidate, assertionSchemas, manualAssertionsJSON, logFunc)
            })

            const tdNames = Object.keys(jsonResults)

            if (tdNames.length > 1) {
                const resultAr = []
                Object.keys(jsonResults).forEach( id => {
                    resultAr.push(jsonResults[id])
                })
                mergeResults(resultAr).then( merged => {
                    checkCoverage(merged, logFunc)
                    res({jsonResults, merged})
                }, err => {rej("merging failed: " + err)})
            }
            else {
                const merged = jsonResults[tdNames[0]]
                checkCoverage(merged, logFunc)
                res(merged)
            }


        }, err => {
            rej("collectAssertionSchemas function problem: "+ err)
        })
    })
}

/**
 * Assertion testing function, does assertion testing with one/several TMs and
 * returns either a single report or one merged report and all single reports.
 * @param {string[]|Buffer[]} tmStrings The Thing Description(s) to check as an array of strings or Buffers.
 * @param {Function} fileLoader (string) => string Path to a file as input, should return file content
 * @param {Function} logFunc OPT (string) => void; Callback used to log the validation progress.
 * @param {object} givenManual OPT JSON object of the manual assertions
 */
 function tmAssertions(tmStrings, fileLoader, logFunc, givenManual) {
    return new Promise( (res, rej) => {

        // parameter handling
        if(typeof tmStrings !== "object") {throw new Error("tmStrings has to be an Array of Strings or Buffers")}
        if(typeof fileLoader !== "function") {throw new Error("jsonLoader has to be a function")}
        if(logFunc === undefined) {logFunc = console.log}
        if(givenManual !== undefined && typeof givenManual !== "object") {
            throw new Error("givenManual has to be a JSON object if given.")
        }

        // set directory for node.js and browser environment
        let pathOffset
        if (process !== undefined && process.release !== undefined && process.release.name === "node") {
            pathOffset = __dirname
        } else {
            pathOffset = path.join("./node_modules", "@thing-description-playground", "assertions")
        }

        // loading files
        const loadProm = []
        loadProm.push(collectAssertionSchemas(path.join(pathOffset, "./assertions-tm"), path.join(pathOffset, "./assertions-tm", "./tmAssertionList.json"), fileLoader))
        loadProm.push(fileLoader(path.join(pathOffset, "./node_modules", "@thing-description-playground", "core", "tm-schema.json")))
        if (givenManual === undefined) {loadProm.push(fileLoader(path.join(pathOffset, "./assertions-tm", "./manual.csv")))}

        Promise.all(loadProm).then( promResults => {


            const assertionSchemas = promResults.shift()
            //! Is needed, do not remove! 
            const tmSchema = promResults.shift()
            const manualAssertionsJSON = (givenManual === undefined) ?
                                        manualToJson(promResults.shift().toString()) :
                                        givenManual
            
            const jsonResults = {}
            tmStrings.forEach( tmToValidate => {
                // check if id exists, use it for name if it does, title + some rand number otherwise
                let tmName = ""
                if ("id" in JSON.parse(tmToValidate)){
                    const tmId = JSON.parse(tmToValidate).id
                    tmName = tmId.replace(/:/g, "_")
                } else {
                    const tmTitle = JSON.parse(tmToValidate).title
                    tmName = tmTitle + Math.floor(Math.random() * 1000)
                }

                if (typeof tmToValidate === "string") {tmToValidate = Buffer.from(tmToValidate, "utf8")}

                if (jsonResults[tmName] !== undefined) {throw new Error("TDs have same Ids or titles: " + tmName)}
                jsonResults[tmName] = validateTM(tmToValidate, assertionSchemas, manualAssertionsJSON, logFunc)
            })
            
            const tmNames = Object.keys(jsonResults)

            if (tmNames.length > 1) {
                const resultAr = []
                Object.keys(jsonResults).forEach( id => {
                    resultAr.push(jsonResults[id])
                })
                mergeResults(resultAr).then( merged => {
                    checkCoverage(merged, logFunc)
                    res({jsonResults, merged})
                }, err => {rej("merging failed: " + err)})
            }
            else {
                const merged = jsonResults[tmNames[0]]
                checkCoverage(merged, logFunc)
                res(merged)
            }


        }, err => {
            rej("collectAssertionSchemas function problem: "+ err)
        })
    })
}

/**
 * Helper: Loads and generates an Array containing all assertion objects
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

function manualToJson(csv) {
    const options = {
        delimiter: ',', // optional
        quote: '"' // optional
    }
    return csvjson.toObject(csv, options)
}
