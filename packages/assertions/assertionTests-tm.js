// used to check whether the supplied data is utf8
const isUtf8 = require('is-utf8')

// The usual library used for validation

const Ajv = require("ajv")
const addFormats = require("ajv-formats")
const apply = require('ajv-formats-draft2019')


// Imports from utils
const validate = require("./util").validate
const createParents = require("./util").createParents
const mergeIdenticalResults = require("./util").mergeIdenticalResults


// Imports from playground core
const checkTmOptionalPointer = require("@thing-description-playground/core").checkTmOptionalPointer
const tmSchema = require("@thing-description-playground/core/tm-schema.json")
const tmPlaceholderSchema = require("./assertions-tm/tm-placeholder.json")
const tmRefSchema =  require("./assertions-tm/tm-tmRef1.json")

module.exports = validateTM

/**
 * validates the TM in the first argument according to the assertions given in the second argument
 * manual assertions given in the third argument are pushed to the end of the array after sorting the results array
 * return is a JSON array of result JSON objects
 * if there is a throw, it gives the failed assertion id
 * @param {Buffer} tmData Buffer of the TM data, has to be utf8 encoded (e.g. by fs.readFileSync(file.json) )
 * @param {Array<object>} assertions An array containing all assertion objects (already parsed)
 * @param {Array<object>} manualAssertions An array containing all manual assertions
 * @param {Function} logFunc Logging function
 */
 function validateTM(tmData, assertions, manualAssertions, loggingFunction) {

    // a JSON file that will be returned containing the result for each assertion as a JSON Object
    let results = []
    // !!! uses console info on purpose, to be able to deactivate it, without overwriting console.log !!!
    // console.info("=================================================================")
    // it is commented out to make sure that the output to std is also a valid csv file

    // todo Not sure what to do in this case
    // check whether it is a valid JSON
    let tmJson
    try {
        tmJson = JSON.parse(tmData)
        // results.push({
        //     "ID": "td-json-open",
        //     "Status": "pass"
        // })
    } catch (error) {
        throw new Error("td-json-open")
    }

    // check whether it is a valid UTF-8
    if (isUtf8(tmData)) {
        // results.push({
        //     "ID": "td-json-open_utf-8",
        //     "Status": "pass"
        // })
    } else {
        throw new Error("td-json-open_utf-8")
    }

    // // checking whether two interactions of the same interaction affordance type have the same names
    // // This requires to use the string version of the TM that will be passed down to the jsonvalidator library
    // const tmDataString = tmData.toString()
    // results.push(...checkUniqueness(tmDataString))

    // Normal TM Schema validation but this allows us to test multiple assertions at once
    try {
        results.push(...checkTMVocabulary(tmJson))
    } catch (error) {
        loggingFunction({
            "ID": error,
            "Status": "fail"
        })
        let logName = "" // this will be id and or title
        if (tmJson.hasOwnProperty("title") && (tmJson.hasOwnProperty("id"))) {
            logName = "title: " + tmJson.title + " id: " + tmJson.id
        } else if (tmJson.hasOwnProperty("title")) {
            logName = "title: " + tmJson.title
        } else if (tmJson.hasOwnProperty("id")) {
            logName = "id: " + tmJson.id
        } else { // if no id or title present, put the whole td as string
            logName = JSON.stringify(tmJson) + "\n"
        }
        throw new Error(logName, " : Invalid TM")
    }

    // additional checks
    results.push(...checkTmOptionalPointer(tmJson))

    // Iterating through assertions
    for (let index = 0; index < assertions.length; index++) {
        const curAssertion = assertions[index]

        const schema = curAssertion
        if(schema.title === "tm-placeholder") {
            validateTmPlaceholder(tmJson, loggingFunction, results)
            continue
        }

        if(schema.title === "tm-tmRef1") {
            validateTmRef(tmJson, loggingFunction, results)
            continue
        }

        // Validation starts here

        const validPayload = validate(tmJson, schema, loggingFunction)

        /*
            TODO: when is implemented?
            If valid then it is not implemented
            if error says not-impl then it is not implemented
            If somehow error says fail then it is failed

            Output is structured as follows:
            [main assertion]:[sub assertion if exists]=[result]
        */
        if (schema["is-complex"]) {
            if (validPayload.valid) {
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
                    const output = validPayload.ajvObject.errors[0].params.allowedValue

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
                            "Comment": validPayload.ajvObject.errorsText()
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
                        "Comment": "Make sure you validate your TM before"
                    })

                    if (schema.hasOwnProperty("also")) {
                        const otherAssertions = schema.also
                        otherAssertions.forEach(function (asser) {
                            results.push({
                                "ID": asser,
                                "Status": "fail",
                                "Comment": "Make sure you validate your TM before"
                            })
                        })
                    }
                }
            }

        } else {
            if (validPayload.valid) {
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
                if (validPayload.ajvObject.errorsText().indexOf("required") > -1) {
                    // failed because it doesnt have required key which is a non implemented feature
                    results.push({
                        "ID": schema.title,
                        "Status": "not-impl",
                        "Comment": validPayload.ajvObject.errorsText()
                    })
                    if (schema.hasOwnProperty("also")) {
                        const otherAssertions = schema.also
                        otherAssertions.forEach(function (asser) {
                            results.push({
                                "ID": asser,
                                "Status": "not-impl",
                                "Comment": validPayload.ajvObject.errorsText()
                            })
                        })
                    }
                } else {
                    // failed because of some other reason
                    results.push({
                        "ID": schema.title,
                        "Status": "fail",
                        "Comment": validPayload.ajvObject.errorsText()
                    })
                    if (schema.hasOwnProperty("also")) {
                        const otherAssertions = schema.also
                        otherAssertions.forEach(function (asser) {
                            results.push({
                                "ID": asser,
                                "Status": "fail",
                                "Comment": validPayload.ajvObject.errorsText()
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
}

/**
 *  Validates the following assertions:
 *  todo TBD
 * @param {object} tmJson The tm to validate
 */
function checkTMVocabulary(tmJson) {

    const results = []
    let ajv = new Ajv({strict: false})
    ajv = addFormats(ajv) // ajv does not support formats by default anymore
    ajv = apply(ajv) // new formats that include iri
    ajv.addSchema(tmSchema, 'tm')
    ajv.addVocabulary(['is-complex', 'also'])

    const valid = ajv.validate('tm', tmJson)
    const otherAssertions =  ["tm-placeholder-value", "tm-td-generation-inconsistencies","tm-context-requirement"]

    if (valid) {
        // results.push({
        //     "ID": "td-processor",
        //     "Status": "pass"
        // })

        otherAssertions.forEach(function (asser) {
            results.push({
                "ID": asser,
                "Status": "pass"
            })
        })
        return results

    } else {
        console.log(ajv.errorsText())
        throw new Error("Invalid TM")
    }
}


/**
 * A script for validating tm-placeholder
 * @param {object} obj
 * @param {function} logFunc
 * @param {Array<{"ID": string, "Status": string}>} results
 */

function validateTmPlaceholder(tmObj, logFunc, results) {

    let FOUND_TM_PLACEHOLDER = false

    const tmpResults = []
    let validPayload = null
    checkObjContainsTmPlaceholder(tmObj, logFunc)
    let otherAssertion = []
    if(tmPlaceholderSchema.also && tmPlaceholderSchema.also.length >= 1) otherAssertion = tmPlaceholderSchema.also

    if(FOUND_TM_PLACEHOLDER) {
        // Return a fail result if found
        for(const result of tmpResults) {
            if(result && !result.valid) return result
        }
        // if no fail was found, return a valid result
        validPayload = tmpResults[0]
    }

    if(FOUND_TM_PLACEHOLDER) {
        if(validPayload && validPayload.valid) {
            results.push({
                "ID": "tm-placeholder",
                "Status": "pass"
            })

            for(const asser of otherAssertion) {
                results.push({
                    "ID": asser,
                    "Status": "pass"
                })
            }
        } else if (validPayload && validPayload.valid === false) {
            results.push({
                "ID": "tm-placeholder",
                "Status": "fail",
                "Comment": validPayload.ajvObject.errorsText()
            })

            for(const asser of otherAssertion) {
                results.push({
                    "ID": asser,
                    "Status": "fail",
                    "Comment": validPayload.ajvObject.errorsText()
                })
            }
        }
    } else {
        results.push({
            "ID": "tm-placeholder",
            "Status": "not-impl"
        })

        for(const asser of otherAssertion) {
            results.push({
                "ID": asser,
                "Status": "not-impl"
            })
        }
    }

    /**
     *
     * @param {object} obj
     * @param {function} logFunc
     * @returns {{valid: boolean, ajvObject: object} | null} true if validation passes, else false
     */
     function checkObjContainsTmPlaceholder(obj) {

        for(const key in obj) {
            if(Object.prototype.hasOwnProperty.call(obj, key)){
                const value = obj[key]
                if(typeof value === "string") {
                    const regex = /^.*[{]{2}[ -~]+[}]{2}.*$/
                    if(value.match(regex)) {
                        FOUND_TM_PLACEHOLDER = true
                        const result = {valid: true, ajvObject: {}}
                        tmpResults.push(result)
                    }
                }
                if(typeof obj[key] === "object") {
                    checkObjContainsTmPlaceholder(obj[key])
                }
            }
        }
        return null
    }

}


/**
 * A script for validating tm-tmRef-1
 * @param {object} obj
 * @param {function} logFunc
 * @param {Array<{"ID": string, "Status": string}>} results
 */
function validateTmRef(tmObj, logFunc, results) {

    const tmpResults = []
    let FOUND_TM_REF = false

    let validPayload = checkObjContainsTmRef(tmObj, logFunc)
    let otherAssertion = []
    if(tmRefSchema.also && tmRefSchema.also.length >= 1) otherAssertion = tmRefSchema.also

    if(FOUND_TM_REF) {
        // Return a fail result if found
        for(const result of tmpResults) {
            if(result && !result.valid) return result
        }
        // if no fail was found, return a valid result
        validPayload = tmpResults[0]
    }

    if(FOUND_TM_REF) {
        if(validPayload && validPayload.valid) {
            results.push({
                "ID": "tm-tmRef1",
                "Status": "pass"
            })

            for(const asser of otherAssertion) {
                results.push({
                    "ID": asser,
                    "Status": "pass"
                })
            }
        } else if (validPayload && !validPayload.valid) {
            results.push({
                "ID": "tm-tmRef1",
                "Status": "fail",
                "Comment": validPayload.ajvObject.errorsText()
            })

            for(const asser of otherAssertion) {
                results.push({
                    "ID": asser,
                    "Status": "fail",
                    "Comment": validPayload.ajvObject.errorsText()
                })
            }
        }
    } else {
        results.push({
            "ID": "tm-tmRef1",
            "Status": "not-impl"
        })

        for(const asser of otherAssertion) {
            results.push({
                "ID": asser,
                "Status": "not-impl"
            })
        }
    }

    /**
     *
     * @param {object} obj
     * @param {function} logFunc
     * @returns {{valid: boolean, ajvObject: object} | null} true if validation passes, else false
     */
     // eslint-disable-next-line no-shadow
     function checkObjContainsTmRef(obj, logFunc) {

        for(const key in obj) {
            if(Object.prototype.hasOwnProperty.call(obj, key)) {
                if(key === "tm:ref") {
                    FOUND_TM_REF = true
                    const result = validate(obj, tmRefSchema, logFunc)
                    tmpResults.push(result)
                }
                if(typeof obj[key] == "object") {
                    checkObjContainsTmRef(obj[key])
                }
            }
        }
        if(FOUND_TM_REF) {
            // Return a fail result if found
            for(const result of tmpResults) {
                if(result && !result.valid) return result
            }
            // if no fail was found, return a valid result
            return results[0]
        }
        return null
    }

}


