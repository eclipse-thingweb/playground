// used to check whether the supplied data is utf8
const isUtf8 = require('is-utf8')

// The usual library used for validation
const Ajv = require("ajv")
const addFormats = require("ajv-formats")
const apply = require('ajv-formats-draft2019');

let ajv = new Ajv({strict: false})
ajv = addFormats(ajv)
ajv = apply(ajv)

// Imports from playground core
const checkUniqueness = require('@thing-description-playground/core').propUniqueness
const checkMultiLangConsistency = require("@thing-description-playground/core").multiLangConsistency
const checkSecurity = require("@thing-description-playground/core").security
const checkLinksRelTypeCount = require("@thing-description-playground/core").checkLinksRelTypeCount
const tdSchema = require("@thing-description-playground/core/td-schema.json")

/**
 * validates the TD in the first argument according to the assertions given in the second argument
 * manual assertions given in the third argument are pushed to the end of the array after sorting the results array
 * return is a JSON array of result JSON objects
 * if there is a throw, it gives the failed assertion id
 * @param {Buffer} tdData Buffer of the TD data, has to be utf8 encoded (e.g. by fs.readFileSync(file.json) )
 * @param {Array<object>} assertions An array containing all assertion objects (already parsed)
 * @param {Array<object>} manualAssertions An array containing all manual assertions
 * @param {string} tdSchema The JSON Schema used to eval if a TD is valid
 * @param {Function} logFunc Logging function
 */
function validate(tdData, assertions, manualAssertions, logFunc) {

    // a JSON file that will be returned containing the result for each assertion as a JSON Object
    let results = []
    // !!! uses console info on purpose, to be able to deactivate it, without overwriting console.log !!!
    // console.info("=================================================================")
    // it is commented out to make sure that the output to std is also a valid csv file

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

    // check whether it is a valid UTF-8
    if (isUtf8(tdData)) {
        results.push({
            "ID": "td-json-open_utf-8",
            "Status": "pass"
        })
    } else {
        throw new Error("td-json-open_utf-8")
    }

    // checking whether two interactions of the same interaction affordance type have the same names
    // This requires to use the string version of the TD that will be passed down to the jsonvalidator library
    const tdDataString = tdData.toString()
    results.push(...checkUniqueness(tdDataString))

    // Normal TD Schema validation but this allows us to test multiple assertions at once
    try {
        results.push(...checkVocabulary(tdJson))
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
    results.push(...checkLinksRelTypeCount(tdJson))

    // Iterating through assertions
    for (let index = 0; index < assertions.length; index++) {
        const curAssertion = assertions[index]

        const schema = curAssertion

        // Validation starts here

        const ajvOptions = {
            "$comment" (v) {
                logFunc("\n!!!! COMMENT", v)
            },
            "allErrors": true,
            "strict":false
        }
        let ajv = new Ajv(ajvOptions)
        ajv = addFormats(ajv) // ajv does not support formats by default anymore
        ajv = apply(ajv) // new formats that include iri
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
                if (ajv.errorsText().indexOf("required") > -1) {
                    // failed because it doesnt have required key which is a non implemented feature
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
}

module.exports = validate


/**
 *  Validates the following assertions:
 *    td - processor
 *    td-objects:securityDefinitions
 *    td-arrays:security
 *    td:security
 *    td-security-mandatory
 * @param {object} tdJson The td to validate
 * @param {*} tdSchema The JSON Schema used for td validation
 */
function checkVocabulary(tdJson) {

    const results = []
    let ajv = new Ajv({strict: false})
    ajv = addFormats(ajv) // ajv does not support formats by default anymore
    ajv = apply(ajv) // new formats that include iri
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
        throw new Error("invalid TD")
    }
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
