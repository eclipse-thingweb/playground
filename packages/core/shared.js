 /**
  * This file contains functions, which are required by the core package as
  * well as by the assertions package
  */

// A special JSON validator that is used only to check whether the given object has duplicate keys.
// The standard library doesn't detect duplicate keys and overwrites the first one with the second one.
// TODO: replace with jsonlint ??
const jsonValidator = require('json-dup-key-validator')

// This is used to validate if the multi language JSON keys are valid according to the BCP47 spec
const bcp47pattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i // eslint-disable-line max-len

const fetch = require('node-fetch');
const fs = require('fs');
const jsonDiff = require('json-diff');

module.exports =  {
    checkPropUniqueness,
    checkSecurity,
    checkMultiLangConsistency,
    checkLinksRelTypeCount,
    checkUriSecurity,
    checkTmOptionalPointer,
    checkLinkedAffordances,
    checkLinkedStructure
}

/**
 * This function returns part of the object given in param with the value found when resolving the path. Similar to JSON Pointers.
 * In case no path is found, the param defaultValue is echoed back
 * Taken from
 * https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-and-arrays-by-string-path/6491621#6491621
 * @param {object} object
 * @param {string} path
 * @param {any} defaultValue
 * @return {object}
 **/
const resolvePath = (object, path, defaultValue) => path
    .split(/[\.\[\]\'\"]/)
    .filter(p => p)
    .reduce((o, p) => o ? o[p] : defaultValue, object)

// -------------------------------------------------- checkPropUniqueness

/**
 *  Checking whether in one interaction pattern there are duplicate names, e.g. two properties called temp
 *  However, if there are no properties then it is not-impl
 *
 * @param {string} tdString The Td under test as string
 */
function checkPropUniqueness(tdString) {

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
                results.push({
                    "ID": "td-properties_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate property names at "+td.title
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
                results.push({
                    "ID": "td-actions_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate action names at "+td.title
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
                results.push({
                    "ID": "td-events_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate event names at "+td.title
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


// -------------------------------------------------- checkSecurity

/**
 * check if used Security definitions are properly defined previously
 * @param {object} td The TD to do assertion tests
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
                "Comment": "used a non defined security scheme in root level at "+td.title
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
                                "Comment": "used a non defined security scheme in a property form at "+td.title
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
                                "Comment": "used a non defined security scheme in an action form at "+td.title
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
                                "Comment": "used a non defined security scheme in an event form at "+td.title
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
 * subfunction of checkSecurity
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


// -------------------------------------------------- checkMultiLangConsistency

/**
 *  this checks whether all titles and descriptions have the same language fields
 *  so the object keys of a titles and of a descriptions should be the same already,
 *  then everywhere else they should also be the same
 *
 *  first collect them all, and then compare them
 *
 * @param {object} td The TD to do assertion tests
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
            "Comment": "not all multilang objects have same language tags at "+td.title
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
            "Comment":isBCP47+" is not a BCP47 tag at "+td.title
        })
    }

    // // checking td-context-default-language-direction-script assertion
    // results.push({
    //     "ID": "td-context-default-language-direction-script",
    //     "Status": checkAzeri(flatArray)
    // })

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
                "Comment": elementName+" is not on the multilang object at the same level at "+td.title
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
 * subfunction of checkMultiLangConsistency
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
 * subfunction of checkMultiLangConsistency
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
 * subfunction of checkMultiLangConsistency
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
 * subfunction of checkMultiLangConsistency
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

// --------------------------------------------------

// -------------------------------------------------- checkLinksRelTypeCount

/**
 *  this checks whether rel:type appears only once in the links array
 *
 * @param {object} td The TD to do assertion tests
 */
function checkLinksRelTypeCount(td){

    const results = []

    if (td.hasOwnProperty("links")){
        // links exist, check if there is rel type
        let typeCount = 0
        for (let i = 0; i < td.links.length; i++) {
            const element = td.links[i]
            if(element.hasOwnProperty("rel")){
                if (element.rel === "type"){
                    typeCount++
                }
            }
        }
        if (typeCount === 0){
            results.push({
                "ID": "tm-rel-type-maximum",
                "Status": "not-impl",
                "Comment": "no rel:type in any link"
            })
        } else if (typeCount === 1){
            results.push({
                "ID": "tm-rel-type-maximum",
                "Status": "pass",
                "Comment": ""
            })
        } else {
            results.push({
                "ID": "tm-rel-type-maximum",
                "Status": "fail",
                "Comment": "too many rel:type in links array at "+td.title
            })
        }
    } else {
        results.push({
            "ID": "tm-rel-type-maximum",
            "Status": "not-impl",
            "Comment": "no links array in the td"
        })
    }
    return results
}

/**
 * When you have apikey security with the key in uri, you put the name of the urivariable in the name field in
 * securityDefinitions. Ideally, that name appears in href as a uriVariable. See uriSecurity example
 * td-security-in-uri-variable: The URIs provided in interactions where a security scheme using uri as the value for
 * in MUST be a URI template including the defined variable.
 * Additionally, this also checks that the uriVariable used in the security does not conflict with ones for the TD
 * td-security-uri-variables-distinct: The names of URI variables declared in a SecurityScheme MUST be distinct from
 * all other URI variables declared in the TD.
 * @param {object} td The TD to do assertion tests
 */
function checkUriSecurity(td) {

    const results = []
    if (td.hasOwnProperty("securityDefinitions")) {
        const securityDefinitionsObject = td.securityDefinitions
        const securityDefinitionsNames = Object.keys(securityDefinitionsObject)

        const securityUriVariables = []
        for (let index = 0; index < securityDefinitionsNames.length; index++) {
            const curSecurityDefinition = securityDefinitionsObject[securityDefinitionsNames[index]]
            if (curSecurityDefinition.scheme === "apikey"){
                if (curSecurityDefinition.hasOwnProperty("in")){
                    if (curSecurityDefinition.in === "uri"){
                        if (curSecurityDefinition.hasOwnProperty("name")){
                            securityUriVariables.push(curSecurityDefinition.name)
                        }
                    }
                }
            }
        }
        if (securityUriVariables.length === 0){ // we could not find any
            results.push({
                "ID": "td-security-in-uri-variable",
                "Status": "not-impl",
                "Comment": "no use of name in a uri apikey scheme"
            })
            results.push({
                "ID": "td-security-uri-variables-distinct",
                "Status": "not-impl",
                "Comment": "no use of name in a uri apikey scheme"
            })
            return results
        } else {
            let uriVariablesResult = "not-impl"
            let uriVariablesDistinctResult = "not-impl"
            let rootUriVariables = []
            if (td.hasOwnProperty("uriVariables")) {
                rootUriVariables = Object.keys(td.uriVariables)
            }
            if (td.hasOwnProperty("properties")) {
                // checking security in property level
                tdProperties = Object.keys(td.properties)
                for (let i = 0; i < tdProperties.length; i++) {
                    const curPropertyName = tdProperties[i]
                    const curProperty = td.properties[curPropertyName]
                    // checking href with uriVariable in forms level
                    const curForms = curProperty.forms
                    for (let j = 0; j < curForms.length; j++) {
                        const curForm = curForms[j]
                        if (curForm.hasOwnProperty("href")){
                            const curHref = curForm.href
                            // bottom thing is taken from https://stackoverflow.com/a/5582621/3806426
                            if (securityUriVariables.some(v => curHref.includes(v))) {
                                // There's at least one
                                if(uriVariablesResult !== "fail"){
                                    uriVariablesResult = "pass"
                                }
                            }
                        }
                    }
                    // part for the check of td-security-uri-variables-distinct
                    if (curProperty.hasOwnProperty("uriVariables")){
                        curPropertyUriVariables = Object.keys(curProperty.uriVariables)
                        curPropertyUriVariables.push(...rootUriVariables)
                        if (curPropertyUriVariables.length>0){ // there are urivariables somewhere at least
                            // below is from https://stackoverflow.com/a/1885569/3806426
                            const filteredArray = curPropertyUriVariables.filter(value => securityUriVariables.includes(value))
                            // console.log(curPropertyUriVariables,"\n",securityUriVariables,"\n",filteredArray)
                            if(filteredArray.length>0){
                                uriVariablesDistinctResult = "fail"
                            } else {
                                if (uriVariablesDistinctResult !== "fail"){
                                    uriVariablesDistinctResult = "pass"
                                }
                            }
                        } // otherwise not-impl stays
                    } else {
                        // even if there are no urivariables in affordances, the security urivariables is distinct
                        // fixes https://github.com/thingweb/thingweb-playground/issues/422
                        if (uriVariablesDistinctResult !== "fail"){
                            uriVariablesDistinctResult = "pass"
                        }
                    }
                }
            }

            if (td.hasOwnProperty("actions")) {
                // checking security in property level
                tdActions = Object.keys(td.actions)
                for (let i = 0; i < tdActions.length; i++) {
                    const curActionName = tdActions[i]
                    const curAction = td.actions[curActionName]
                    // checking href with uriVariable in forms level
                    const curForms = curAction.forms
                    for (let j = 0; j < curForms.length; j++) {
                        const curForm = curForms[j]
                        if (curForm.hasOwnProperty("href")){
                            const curHref = curForm.href
                            // bottom thing is taken from https://stackoverflow.com/a/5582621/3806426
                            if (securityUriVariables.some(v => curHref.includes(v))) {
                                // There's at least one
                                if(uriVariablesResult !== "fail"){
                                    uriVariablesResult = "pass"
                                }
                            }
                        }
                    }
                    // part for the check of td-security-uri-variables-distinct
                    if (curAction.hasOwnProperty("uriVariables")){
                        curActionUriVariables = Object.keys(curAction.uriVariables)
                        curActionUriVariables.push(...rootUriVariables)
                        if (curActionUriVariables.length>0){ // there are urivariables somewhere at least
                            // below is from https://stackoverflow.com/a/1885569/3806426
                            const filteredArray = curActionUriVariables.filter(value => securityUriVariables.includes(value))
                            // console.log(curActionUriVariables,"\n",securityUriVariables,"\n",filteredArray)
                            if(filteredArray.length>0){
                                uriVariablesDistinctResult = "fail"
                            } else {
                                if (uriVariablesDistinctResult !== "fail"){
                                    uriVariablesDistinctResult = "pass"
                                }
                            }
                        }  else {
                            // even if there are no urivariables in affordances, the security urivariables is distinct
                            // fixes https://github.com/thingweb/thingweb-playground/issues/422
                            if (uriVariablesDistinctResult !== "fail"){
                                uriVariablesDistinctResult = "pass"
                            }
                        }
                    }
                }
            }

            if (td.hasOwnProperty("events")) {
                // checking security in property level
                tdEvents = Object.keys(td.events)
                for (let i = 0; i < tdEvents.length; i++) {
                    const curEventName = tdEvents[i]
                    const curEvent = td.events[curEventName]
                    // checking href with uriVariable in forms level
                    const curForms = curEvent.forms
                    for (let j = 0; j < curForms.length; j++) {
                        const curForm = curForms[j]
                        if (curForm.hasOwnProperty("href")){
                            const curHref = curForm.href
                            // bottom thing is taken from https://stackoverflow.com/a/5582621/3806426
                            if (securityUriVariables.some(v => curHref.includes(v))) {
                                // There's at least one
                                if(uriVariablesResult !== "fail"){
                                    uriVariablesResult = "pass"
                                }
                            }
                        }
                    }
                    // part for the check of td-security-uri-variables-distinct
                    if (curEvent.hasOwnProperty("uriVariables")){
                        curEventUriVariables = Object.keys(curEvent.uriVariables)
                        curEventUriVariables.push(...rootUriVariables)
                        if (curEventUriVariables.length>0){ // there are urivariables somewhere at least
                            // below is from https://stackoverflow.com/a/1885569/3806426
                            const filteredArray = curEventUriVariables.filter(value => securityUriVariables.includes(value))
                            // console.log(curEventUriVariables,"\n",securityUriVariables,"\n",filteredArray)
                            if(filteredArray.length>0){
                                uriVariablesDistinctResult = "fail"
                            } else {
                                if (uriVariablesDistinctResult !== "fail"){
                                    uriVariablesDistinctResult = "pass"
                                }
                            }
                        }  else {
                            // even if there are no urivariables in affordances, the security urivariables is distinct
                            // fixes https://github.com/thingweb/thingweb-playground/issues/422
                            if (uriVariablesDistinctResult !== "fail"){
                                uriVariablesDistinctResult = "pass"
                            }
                        }
                    }
                }
            }

            results.push({
                "ID": "td-security-in-uri-variable",
                "Status": uriVariablesResult
            })
            results.push({
                "ID": "td-security-in-uri-variable-distinct",
                "Status": uriVariablesDistinctResult
            })
            return results

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
 * When tm:optional uses a pointer, it should point to an actual affordance and only to an affordance, as said by
 * tm-tmOptional-resolver: The JSON Pointers of tm:optional MUST resolve to an entire interaction affordance Map definition.
 * JSON Schema checks for the syntax but cannot know if the pointed affordance exists.
 * This function checks that programmatically
 * @param {object} td The TD to do assertion tests
 */
function checkTmOptionalPointer(td){
    const results = []
    if(td.hasOwnProperty("tm:optional")){
        td["tm:optional"].forEach(element => {
            // However, tm: optional values start with / so it should be removed first
            element = element.substring(1)
            element = element.replace("/",".") // since the resolvePath uses . instead of /
            const pathTarget = resolvePath(td,element,"noTarget")
            if (pathTarget === "noTarget" || pathTarget === undefined) {
                results.push({
                    "ID": "tm-tmOptional-resolver",
                    "Status": "fail",
                    "Comment": "tm:optional does not resolve to an affordance at "+td.title
                })
            } else {
                results.push({
                    "ID": "tm-tmOptional-resolver",
                    "Status": "pass",
                    "Comment": ""
                })
            }
        })
    } else {
        results.push({
            "ID": "tm-tmOptional-resolver",
            "Status": "not-impl",
            "Comment": "no use of tm:optional"
        })
    }

    return results
 }


 // ---------- Advanced TM Validation ----------

async function fetchLinkedTm(td) {
    if (!td.links) {
        return {
            success: false,
            status: 'not-impl',
            comment: 'td does not link to tm'
        };
    }

    let typeLink = td.links.filter(e => e.rel === 'type');
    if (typeLink.length !== 1) {
        return (typeLink.length < 1) ? {
            success: false,
            status: 'not-impl',
            comment: 'td does not link to tm'
        } : {
            success: false,
            status: 'fail',
            comment: 'td links to more than one tm at ' + td.title
        };
    }
    typeLink = typeLink[0];

    const fileFetcher = async (url) => {
        try {
            return {
                success: true,
                data: JSON.parse(fs.readFileSync(url.split('file://')[1]))
            };
        } catch {
            return {
                success: false,
                error: 'make sure you are not using file:// links inside non-browser environment'
            };
        }
    }

    const httpFetcher = async (url) => {
        try {
            return {
                success: true,
                data: await (await fetch(url)).json()
            };
        } catch {
            return {
                success: false,
                error: 'make sure related tm is valid JSON and is not under CORS'
            };
        }
    }

    // TODO: Add support for other network protocols, e.g., MQTT
    const fetcher = (typeLink.href.startsWith('file://')) ? fileFetcher : httpFetcher;
    const result = await fetcher(typeLink.href);

    if (!result.success) {
        return {
            success: false,
            status: 'warning',
            comment: result.error
        };
    }

    return {
        success: true,
        tm: result.data
    };
}


/**
 * Given a TD check it has all affrodances specified in the related TM
 * except for those in the tm:optional field.
 *
 * @param {object} td - TD to check
 */
async function checkLinkedAffordances(td) {
    const ASSERTION_REQUIRED = 'thing-model-td-generation-processor-type';
    const ASSERTION_OPTIONAL = 'thing-model-td-generation-processor-optional';

    const tmResult = await fetchLinkedTm(td);
    if (!tmResult.success) {
        return [
            {
                ID: ASSERTION_REQUIRED,
                Status: tmResult.status,
                Comment: tmResult.comment
            },
            {
                ID: ASSERTION_OPTIONAL,
                Status: tmResult.status,
                Comment: tmResult.comment
            }
        ];
    }

    const tm = tmResult.tm;
    const tmAffordances = {};
    for (const affordanceType of ['properties', 'actions', 'events']) {
        tmAffordances[affordanceType] = {
            all: Object.keys(tm[affordanceType] || {}),
            optional: (tm['tm:optional'] || []).map(e => {
                const x = e.split('/');
                if (x[1] === affordanceType) return x[2];
                return null;
            }).filter(e => e),
        };
    }

    // Check if arr2 is subset of arr1,
    // i.e., all elements of arr2 are contained in arr1
    const isSubset = (arr1, arr2) => arr2.every(e => arr1.includes(e));

    // Check if arr1 and arr2 have any intersection
    const haveIntersection = (arr1, arr2) => arr1.some(e => arr2.includes(e));

    const results = [];
    let requiredAssertion = false;
    let optionalAssertion = false;
    for (const affordanceType of ['properties', 'actions', 'events']) {
        // Combine all and optional into one => required
        const required = tmAffordances[affordanceType].all.filter(
            e => !tmAffordances[affordanceType].optional.includes(e));

        if (!isSubset(Object.keys(td[affordanceType] || {}), required) && !requiredAssertion) {
            requiredAssertion = true;
            results.push({
                ID: ASSERTION_REQUIRED,
                Status: 'fail',
                Comment: 'some required affordances are missing at '+td.title
            });
        }

        const optional = tmAffordances[affordanceType].optional;
        if (haveIntersection(Object.keys(td[affordanceType] || {}), optional) && !optionalAssertion) {
            optionalAssertion = true;
            results.push({
                ID: ASSERTION_OPTIONAL,
                Status: 'pass',
                Comment: ''
            });
        }

        if (requiredAssertion && optionalAssertion) break;
    }

    if (!requiredAssertion && !optionalAssertion) {
        return [
            {
                ID: ASSERTION_REQUIRED,
                Status: 'pass',
                Comment: ''
            },
            {
                ID: ASSERTION_OPTIONAL,
                Status: 'not-impl',
                Comment: ''
            }
        ];
    }

    if (requiredAssertion) {
        results.push({
            ID: ASSERTION_OPTIONAL,
            Status: 'not-impl',
            Comment: ''
        });
    } else {
        results.unshift({
            ID: ASSERTION_REQUIRED,
            Status: 'pass',
            Comment: ''
        });
    }

    return results;
}

/**
 * Given a TD check that its structure corresponds to the one imposed by the linked TM.
 *
 * @param {object} td - TD to check
 */
async function checkLinkedStructure(td) {
    const ASSERTION_NAME = 'thing-model-td-generation-processor-imports';

    const tmResult = await fetchLinkedTm(td);
    if (!tmResult.success) {
        return [
            {
                ID: ASSERTION_NAME,
                Status: tmResult.status,
                Comment: tmResult.comment
            }
        ];
    }

    const tm = tmResult.tm;
    const diff = jsonDiff.diff(tm, td);

    // We first check that keys imposed by tm are contained in td
    // Then we check if values of tm keys diverge in td

    const missingKeys = [];
    const checkKeys = (obj, path = '') => {
        for (const key of Object.keys(obj)) {
            const newPath = `${path}/${key.split('__deleted')[0]}`;

            // TODO: @type case is not that trivial since tm:ThingModel should be removed but other items of the array should NOT be removed
            if (key.endsWith('__deleted') && !key.startsWith('tm:') && !key.startsWith('@type')) {
                if (tm['tm:optional'] && tm['tm:optional'].includes(newPath)) {
                    continue;
                }

                missingKeys.push(newPath);
            }
            if (typeof obj[key] === 'object') checkKeys(obj[key], newPath);
        }
    };

    const diffValues = [];
    let skipNext = false;
    const checkValues = (obj, path = '') => {
        for (const key of Object.keys(obj)) {
            if (!key.endsWith('__added') && !key.endsWith('__deleted') &&
                !key.startsWith('tm:') && key !== '@type' && key !== '$comment' &&
                key !== 'id' && key !== 'version') {
// Currently, keys that start with `tm:`, `@type`, `$comment`, `id` and `version` are ignored in the value checks.
                if (skipNext) {
                    skipNext = false;
                    continue;
                }

                if (key == '__new' || key == '__old') {
                    if (/{{2}[ -~]+}{2}/.test(obj['__old'].toString())) {
                        continue;
                    }

                    diffValues.push(path);
                    skipNext = true;
                    continue;
                }

                const newPath = `${path}/${key.split('__')[0]}`;
                if (typeof obj[key] === 'object') checkValues(obj[key], newPath);
            }
        }
    };

    checkKeys(diff);
    checkValues(diff);

    if (missingKeys.length > 0 || diffValues.length > 0) {
        let comment;
        if (missingKeys.length > 0 && diffValues.length > 0) {
            comment = `${missingKeys.join(', ')} - imposed by tm but missing at ${td.title}\n`;
            comment += 'In addition, '
            comment += `values of TM keys diverge: ${diffValues.join(', ')}`;
        } else if (missingKeys.length > 0) {
            comment = `${missingKeys.join(', ')} - imposed by tm but missing at ${td.title}`;
        } else {
            comment = `Values of TM keys diverge at ${td.title}: ${diffValues.join(', ')}`;
        }

        return [
            {
                ID: ASSERTION_NAME,
                Status: 'fail',
                Comment: comment
            }
        ];
    }

    return [
        {
            ID: ASSERTION_NAME,
            Status: 'pass',
            Comment: ''
        }
    ];
}
