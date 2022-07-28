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
const checkUniqueness = require('@thing-description-playground/core').propUniqueness
const checkMultiLangConsistency = require("@thing-description-playground/core").multiLangConsistency
const checkSecurity = require("@thing-description-playground/core").security
const checkLinksRelTypeCount = require("@thing-description-playground/core").checkLinksRelTypeCount
const tdSchema = require("@thing-description-playground/core/td-schema.json")

module.exports = validateTD

/**
 * validates the TD in the first argument according to the assertions given in the second argument
 * manual assertions given in the third argument are pushed to the end of the array after sorting the results array
 * return is a JSON array of result JSON objects
 * if there is a throw, it gives the failed assertion id
 * @param {Buffer} tdData Buffer of the TD data, has to be utf8 encoded (e.g. by fs.readFileSync(file.json) )
 * @param {Array<object>} assertions An array containing all assertion objects (already parsed)
 * @param {Array<object>} manualAssertions An array containing all manual assertions
 * @param {Function} logFunc Logging function
 */
function validateTD(tdData, assertions, manualAssertions, logFunc) {

    // a JSON file that will be returned containing the result for each assertion as a JSON Object
    let results = []
    // !!! uses console info on purpose, to be able to deactivate it, without overwriting console.log !!!
    // console.info("=================================================================")
    // it is commented out to make sure that the output to std is also a valid csv file

    // check whether it is a valid JSON
    let tdJson
    try {
        tdJson = JSON.parse(tdData)
        // results.push({
        //     "ID": "td-json-open",
        //     "Status": "pass"
        // })
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
    results.push(checkContentTypeDifference(tdJson))

    // Normal TD Schema validation but this allows us to test multiple assertions at once
    try {
        results.push(...checkVocabulary(tdJson))
    } catch (error) {
        logFunc({
            "ID": error,
            "Status": "fail"
        })
        let logName = "" // this will be id and or title
        if (tdJson.hasOwnProperty("title") && (tdJson.hasOwnProperty("id"))) {
            logName = "title: "+tdJson.title + " id: " +tdJson.id
        } else if (tdJson.hasOwnProperty("title")) {
            logName = "title: " + tdJson.title
        } else if (tdJson.hasOwnProperty("id")) {
            logName = "id: " + tdJson.id
        } else { // if no id or title present, put the whole td as string
            logName = JSON.stringify(tdJson) + "\n"
        }
        throw new Error(logName+" : Invalid TD")
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

        const validPayload = validate(tdJson, schema, logFunc)

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
                    "Status": "not-impl",
                    "Assertion": schema.description
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
                            "Status": result,
                            "Assertion": schema.description
                        })
                    } else {
                        results.push({
                            "ID": schema.title,
                            "Status": result,
                            "Comment": validPayload.ajvObject.errorsText(),
                            "Assertion": schema.description
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
                        "Comment": "Make sure you validate your TD before",
                        "Assertion": schema.description
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
                            "Status": "pass",
                            "Assertion": schema.description
                        })
                    })
                }
            } else {
                // failed because a required is not implemented
                if (validPayload.ajvObject.errorsText().indexOf("required") > -1 ||
                    validPayload.ajvObject.errorsText().indexOf("must be")||
                    validPayload.ajvObject.errorsText().indexOf("must match")) {
                    // failed because it doesnt have required key which is a non implemented feature
                    results.push({
                        "ID": schema.title,
                        "Status": "not-impl",
                        "Comment": validPayload.ajvObject.errorsText(),
                        "Assertion": schema.description
                    })
                    if (schema.hasOwnProperty("also")) {
                        const otherAssertions = schema.also
                        otherAssertions.forEach(function (asser) {
                            results.push({
                                "ID": asser,
                                "Status": "not-impl",
                                "Comment": validPayload.ajvObject.errorsText(),
                                "Assertion": schema.description
                            })
                        })
                    }
                } else {
                    // failed because of some other reason
                    results.push({
                        "ID": schema.title,
                        "Status": "fail",
                        "Comment": validPayload.ajvObject.errorsText(),
                        "Assertion": schema.description
                    })
                    if (schema.hasOwnProperty("also")) {
                        const otherAssertions = schema.also
                        otherAssertions.forEach(function (asser) {
                            results.push({
                                "ID": asser,
                                "Status": "fail",
                                "Comment": validPayload.ajvObject.errorsText(),
                                "Assertion": schema.description
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
    ajv.addVocabulary(['is-complex', 'also'])

    const valid = ajv.validate('td', tdJson)
    const otherAssertions = ["td-objects_securityDefinitions", "td-vocab-security--Thing",
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
        throw new Error(`Invalid TD: ${JSON.stringify(ajv.errors,null,2)}`)
    }
}


/**
 *  Validates the following assertions:
 *    td-expectedResponse-contentType
 *  This means:
 *  If the content type of the expected response differs from the content type of the form, the Form instance MUST
 *  include a name - value pair with the name response.
 "  In other words just checking for response contentType to be different from form contentType
 * @param {object} tdJson The td to validate
 * @returns {{"ID": td-expectedResponse-contentType,"Status": "not-impl OR pass"}}
 */
function checkContentTypeDifference(td){

    // checking inside each interaction
    if (td.hasOwnProperty("properties")) {
        // checking security in property level
        tdProperties = Object.keys(td.properties)
        for (let i = 0; i < tdProperties.length; i++) {
            const curPropertyName = tdProperties[i]
            const curProperty = td.properties[curPropertyName]
            const curFormsArray = curProperty.forms
            for (let j = 0; j < curFormsArray.length; j++) {
                // checking if response exists
                const curForm = curFormsArray[j]
                if (curForm.hasOwnProperty("response")){
                    if (curForm.contentType !== curForm.response.contentType){
                        return {
                            "ID": "td-expectedResponse-contentType",
                            "Status": "pass"
                        }
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
            const curFormsArray = curAction.forms
            for (let j = 0; j < curFormsArray.length; j++) {
                // checking if response exists
                const curForm = curFormsArray[j]
                if (curForm.hasOwnProperty("response")) {
                    if (curForm.contentType !== curForm.response.contentType) {
                        return {
                            "ID": "td-expectedResponse-contentType",
                            "Status": "pass"
                        }
                    }
                }
            }
        }
    }
    if (td.hasOwnProperty("events")) {
        // checking security in event level
        tdEvents = Object.keys(td.events)
        for (let i = 0; i < tdEvents.length; i++) {
            const curEventsName = tdEvents[i]
            const curEvent = td.events[curEventsName]
            const curFormsArray = curEvent.forms
            for (let j = 0; j < curFormsArray.length; j++) {
                // checking if response exists
                const curForm = curFormsArray[j]
                if (curForm.hasOwnProperty("response")) {
                    if (curForm.contentType !== curForm.response.contentType) {
                        return {
                            "ID": "td-expectedResponse-contentType",
                            "Status": "pass"
                        }
                    }
                }
            }
        }
    }

    if (td.hasOwnProperty("forms")){
        const curFormsArray = td.forms
        for (let j = 0; j < curFormsArray.length; j++) {
            // checking if response exists
            const curForm = curFormsArray[j]
            if (curForm.hasOwnProperty("response")) {
                if (curForm.contentType !== curForm.response.contentType) {
                    return {
                        "ID": "td-expectedResponse-contentType",
                        "Status": "pass"
                    }
                }
            }
        }
    }

    // if this contentType difference did not happen anywhere, return not impl
    return {
        "ID": "td-expectedResponse-contentType",
        "Status": "not-impl"
    }
}


