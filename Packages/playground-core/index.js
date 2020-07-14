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

const jsonld = require("jsonld")
const Ajv = require("ajv")

// A special JSON validator that is used only to check whether the given object has duplicate keys.
// The standard library doesn't detect duplicate keys and overwrites the first one with the second one.
// TODO: replace with jsonlint ??
const jsonValidator = require('json-dup-key-validator')


/**
 * A function that provides the core functionality of the TD Playground.
 * @param {string} tdString The Thing Description to check as a string.
 * @param {string} tdSchema The JSON Schema that defines a correct TD.
 * @param {string} tdFullSchema The JSON Schema that defines a correct TD including default values.
 * @param {function} logFunc (string) => void; Callback used to log the validation progress.
 */
function tdValidator(tdString, tdSchema, tdFullSchema, logFunc, { checkDefaults=true, checkJsonLd=true }) {
    return new Promise( (res, rej) => {

        // check input
        if (typeof tdString !== "string") {rej("Thing Description input should be a String")}
        if (typeof tdSchema !== "string") {rej("TD Schema input value was no String")}
        if (typeof tdFullSchema !== "string") {rej("TD full Schema should be a string")}
        if (checkDefaults === undefined) {
            checkDefaults = true
        }
        if (checkJsonLd === undefined) {
            checkJsonLd = true
        }
        if (typeof logFunc !== "function") {rej("Expected logFunc to be a function")}

        // report that is returned by the function, possible values for every property:
        // null -> not tested, "passed", "failed", "warning"
        // console is an array of strings
        const report = {
            json: null,
            schema: null,
            defaults: null,
            jsonld: null,
            add: null
        }
        const details = {
            enumConst: null,
            propItems: null,
            interactions: null,
            security: null,
            uniqueness: null,
            propUniqueness: null
        }

        let tdJson
        try {
            tdJson = JSON.parse(tdString)
            report.json = "passed"
        }
        catch (err) {
            report.json = "failed"
            logFunc("X JSON validation failed:")
            logFunc(err)

            // if (err instanceof SyntaxError) {
            //     const charNo=err.message.match(/\d+/g)
            //     // console.log("charter ni is "+charNo);
            //     const lineNo=getLineNumber(charNo,$("#td-text").val())
            //     logFunc('> ' + err.message+"  Near Line No:"+ lineNo)
            // }

            res({report, details})
        }

        // JSON Schema check
        if (tdJson.hasOwnProperty('properties') || tdJson.hasOwnProperty('actions') || tdJson.hasOwnProperty('events')) {
            if (!tdJson.hasOwnProperty('base')) {
                // no need to do something. Each href should be absolute
                logFunc(':) Tip: Without base, each href should be an absolute URL')
            }
        }
        const schema = JSON.parse(tdSchema)
        const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
        ajv.addSchema(schema, 'td')
        const valid = ajv.validate('td', tdJson)
        // used to be var valid = ajv.validate('td', e.detail);
        if (valid) {

            report.schema = "passed"

            // check with full schema
            if (checkDefaults) {
                const fullschema = JSON.parse(tdFullSchema)
                ajv.addSchema(fullschema, 'fulltd')
                const fullValid = ajv.validate('fulltd', tdJson)
                if (fullValid) {
                    report.defaults = "passed"
                }
                else {
                    report.defaults = "warning"
                    logFunc("Optional validation failed:")
                    logFunc("> " + ajv.errorsText())
                }
            }

            // do additional checks
            checkEnumConst(tdJson)
            checkPropItems(tdJson)
            checkInteractions(tdJson)
            checkSecurity(tdJson)
            checkInteractionUniqueness(tdJson)
            if(checkPropUniqueness(tdString, true, logFunc)) {
                details.propUniqueness = "passed"
            } else {
                details.propUniqueness = "failed"
            }

            // determine additional check state
            // passed + warning -> warning
            // passed AND OR warning + error -> error
            report.add = "passed"
            Object.keys(details).forEach( prop => {
                if (details[prop] === "warning" && report.add === "passed") {
                    report.add = "warning"
                }
                else if (details[prop] === "failed" && report.add !== "failed") {
                    report.add = "failed"
                }
            })

        } else {

            report.schema = "failed"
            logFunc("X JSON Schema validation failed:")

            logFunc('> ' + ajv.errorsText())

            res({report, details})
        }

        // json ld validation
        if(checkJsonLd) {
            jsonld.toRDF(tdJson, {
                format: 'application/nquads'
            }).then( nquads => {
                report.jsonld = "passed"
                res({report, details})
            }, err => {
                report.jsonld =  "failed"
                logFunc("X JSON-LD validation failed:")
                logFunc("Hint: Make sure you have internet connection available.")
                logFunc('> ' + err)
                res({report, details})
            })
        }
        else {
            res({report, details})
        }


        // ************ functions ***************

        /** checking whether a data schema has enum and const at the same and displaying a warning in case there are */
        function checkEnumConst(td) {
            details.enumConst = "passed"
            if (td.hasOwnProperty("properties")) {
                // checking properties
                tdProperties = Object.keys(td.properties)
                for (let i = 0; i < tdProperties.length; i++) {
                    const curPropertyName = tdProperties[i]
                    const curProperty = td.properties[curPropertyName]
                    if (curProperty.hasOwnProperty("enum") && curProperty.hasOwnProperty("const")) {
                        details.enumConst = "warning"
                        logFunc('! Warning: In property ' + curPropertyName +
                            ' enum and const are used at the same time, the values in enum' +
                            ' can never be valid in the received JSON value')
                    }
                }
            }
            // checking actions
            if (td.hasOwnProperty("actions")) {
                tdActions = Object.keys(td.actions)
                for (let i = 0; i < tdActions.length; i++) {
                    const curActionName = tdActions[i]
                    const curAction = td.actions[curActionName]
                    if (curAction.hasOwnProperty("input")) {
                        const curInput = curAction.input
                        if (curInput.hasOwnProperty("enum") && curInput.hasOwnProperty("const")) {
                            details.enumConst = "warning"
                            logFunc('! Warning: In the input of action ' + curActionName +
                                ' enum and const are used at the same time, the values in enum can' +
                                ' never be valid in the received JSON value')
                        }
                    }
                    if (curAction.hasOwnProperty("output")) {
                        const curOutput = curAction.output
                        if (curOutput.hasOwnProperty("enum") && curOutput.hasOwnProperty("const")) {
                            details.enumConst = "warning"
                            logFunc('! Warning: In the output of action ' + curActionName +
                                ' enum and const are used at the same time, the values in enum can' +
                                ' never be valid in the received JSON value')

                        }
                    }
                }
            }
            // checking events
            if (td.hasOwnProperty("events")) {
                tdEvents = Object.keys(td.events)
                for (let i = 0; i < tdEvents.length; i++) {
                    const curEventName = tdEvents[i]
                    const curEvent = td.events[curEventName]
                    if (curEvent.hasOwnProperty("enum") && curEvent.hasOwnProperty("const")) {
                        details.enumConst = "warning"
                        logFunc('! Warning: In event ' + curEventName +
                            ' enum and const are used at the same time, the' +
                            ' values in enum can never be valid in the received JSON value')
                    }
                }
            }
            return
        }

        /** checking whether a data schema has object but not properties, array but no items */
        function checkPropItems(td) {
            details.propItems = "passed"

            if (td.hasOwnProperty("properties")) {
                // checking properties
                tdProperties = Object.keys(td.properties)
                for (let i = 0; i < tdProperties.length; i++) {
                    const curPropertyName = tdProperties[i]
                    const curProperty = td.properties[curPropertyName]

                    if (curProperty.hasOwnProperty("type")) {
                        if ((curProperty.type === "object") && !(curProperty.hasOwnProperty("properties"))) {
                            details.propItems = "warning"
                            logFunc('! Warning: In property ' + curPropertyName +
                                ', the type is object but its properties are not specified')
                        }
                        if ((curProperty.type === "array") && !(curProperty.hasOwnProperty("items"))) {
                            details.propItems = "warning"
                            logFunc('! Warning: In property ' + curPropertyName +
                                ', the type is array but its items are not specified')
                        }
                    }
                }
            }
            // checking actions
            if (td.hasOwnProperty("actions")) {
                tdActions = Object.keys(td.actions)
                for (let i = 0; i < tdActions.length; i++) {
                    const curActionName = tdActions[i]
                    const curAction = td.actions[curActionName]

                    if (curAction.hasOwnProperty("input")) {
                        const curInput = curAction.input
                        if (curInput.hasOwnProperty("type")) {
                            if ((curInput.type === "object") && !(curInput.hasOwnProperty("properties"))) {
                                details.propItems = "warning"
                                logFunc('! Warning: In the input of action ' + curActionName +
                                    ', the type is object but its properties are not specified')
                            }
                            if ((curInput.type === "array") && !(curInput.hasOwnProperty("items"))) {
                                details.propItems = "warning"
                                logFunc('! Warning: In the output of action ' + curActionName +
                                    ', the type is array but its items are not specified')
                            }
                        }
                    }
                    if (curAction.hasOwnProperty("output")) {
                        const curOutput = curAction.output
                        if (curOutput.hasOwnProperty("type")) {
                            if ((curOutput.type === "object") && !(curOutput.hasOwnProperty("properties"))) {
                                details.propItems = "warning"
                                logFunc('! Warning: In the output of action ' + curActionName +
                                    ', the type is object but its properties are not specified')
                            }
                            if ((curOutput.type === "array") && !(curOutput.hasOwnProperty("items"))) {
                                details.propItems = "warning"
                                logFunc('! Warning: In the output of action ' + curActionName +
                                    ', the type is array but its items are not specified')
                            }
                        }
                    }
                }
            }
            // checking events
            if (td.hasOwnProperty("events")) {
                tdEvents = Object.keys(td.events)
                for (let i = 0; i < tdEvents.length; i++) {
                    const curEventName = tdEvents[i]
                    const curEvent = td.events[curEventName]

                    if (curEvent.hasOwnProperty("type")) {
                        if ((curEvent.type === "object") && !(curEvent.hasOwnProperty("properties"))) {
                            details.propItems = "warning"
                            logFunc('! Warning: In event ' + curEventName +
                                ', the type is object but its properties are not specified')
                        }
                        if ((curEvent.type === "array") && !(curEvent.hasOwnProperty("items"))) {
                            details.propItems = "warning"
                            logFunc('! Warning: In event ' + curEventName +
                                ', the type is array but its items are not specified')

                        }
                    }

                }
            }
            return
        }

        /** checking whether the td contains interactions field that is remaining from the previous spec */
        function checkInteractions(td) {
            details.interactions = "passed"
            if (td.hasOwnProperty("interactions")) {
                details.interactions = "warning"
                logFunc('! Warning: interactions are from the previous TD Specification, ' +
                    'please use properties, actions, events instead')
            }
            if (td.hasOwnProperty("interaction")) {
                details.interactions = "warning"
                logFunc('! Warning: interaction are from the previous TD Specification, ' +
                    'please use properties, actions, events instead')
            }
            return
        }

        /** helper for checkSecurity */
        function securityContains(parent, child) {

            // security anywhere could be a string or array. Convert string to array
            if (typeof child=="string"){
                child=[child]
            }
            return child.every(elem => parent.indexOf(elem) > -1)
        }

        /** check security function */
        function checkSecurity(td) {
            details.security = "passed"

            if (td.hasOwnProperty("securityDefinitions")) {
                const securityDefinitionsObject = td.securityDefinitions
                const securityDefinitions = Object.keys(securityDefinitionsObject)
                const rootSecurity = td.security

                if (securityContains(securityDefinitions, rootSecurity)) {
                    // all good
                } else {
                    details.security = "failed"
                    logFunc('KO Error: Security key in the root of the TD' +
                        'has security schemes not defined by the securityDefinitions')
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
                                    details.security = "failed"
                                    logFunc('KO Error: Security key in form ' + j +
                                        ' in property ' + curPropertyName +
                                        '  has security schemes not defined by the securityDefinitions')
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
                                    details.security = "failed"
                                    logFunc('KO Error: Security key in form ' + j +
                                        ' in action ' + curActionName +
                                        '  has security schemes not defined by the securityDefinitions')
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
                                    details.security = "failed"
                                    logFunc('KO Error: Security key in form ' + j +
                                        ' in event ' + curEventName +
                                        '  has security schemes not defined by the securityDefinitions')
                                }
                            }
                        }

                    }
                }
            } else {
                details.security = "failed"
                logFunc('KO Error: securityDefinitions is mandatory')
            }
            return
        }

        /**
         *  Checks whether two interactions have the same name,
         *  e.g., an action named "status" and a property named "status"
         * @param {object} td The Td under test as object
         */
        function checkInteractionUniqueness(td) {
            // building the interaction name array
            let tdInteractions = []
            if (td.hasOwnProperty("properties")) {
                tdInteractions = tdInteractions.concat(Object.keys(td.properties))
            }
            if (td.hasOwnProperty("actions")) {
                tdInteractions = tdInteractions.concat(Object.keys(td.actions))
            }
            if (td.hasOwnProperty("events")) {
                tdInteractions = tdInteractions.concat(Object.keys(td.events))
            }
            // checking uniqueness

            isDuplicate = (new Set(tdInteractions)).size !== tdInteractions.length
            // console.log(isDuplicate)
            if (isDuplicate) {
                details.uniqueness = "failed"
                logFunc('KO Error: Duplicate names are not allowed in Interactions')
            } else {
                details.uniqueness = "passed"
            }
        }

        /**
         * takes character number and gives out the line number
         * @param {number} characterNo character Number (can be )
         * @param {string} str whole String
         */
        function getLineNumber(characterNo,str)
        {
            const charsPerLine=[]
            const str2lines=str.split("\n")

            // calculate number of characters in each line
            str2lines.forEach( (value, index) => {
                const strVal = String(value)
                charsPerLine.push(strVal.length)
                characterNo++
            })

            // $.each(str2lines,function(index,value){
            //     const strVal = String(value)
            //     charsPerLine.push(strVal.length)
            //     characterNo++
            // })

            // find the line containing that characterNo
            let count=0
            let lineNo=0
            while(characterNo>count)
            {
                count+=charsPerLine[lineNo]
                lineNo++
            }
            return lineNo
        }
    })
}

module.exports = tdValidator



/**
 *  Checking whether in one interaction pattern there are duplicate names, e.g. two properties called temp
 *  However, if there are no properties then it is not-impl
 *
 * @param {string} tdString The Td under test as string
 */
function checkPropUniqueness(tdString, noAssertions=false, logFunc) {

    const results = []
    if (noAssertions && logFunc === undefined) {
        logFunc = console.log
    }
    // jsonvalidator throws an error if there are duplicate names in the interaction level
    try {
        jsonValidator.parse(tdString, false)

        if (noAssertions) {
            return true
        }

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
        if (noAssertions) {
            logFunc("KO Error: Duplicate object properties are not allowed")
            logFunc(error)
            return false
        }
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
                // console.log("at property");
                results.push({
                    "ID": "td-properties_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate property names"
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
                // console.log("at action");
                results.push({
                    "ID": "td-actions_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate action names"
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
                // console.log("at event");
                results.push({
                    "ID": "td-events_uniqueness",
                    "Status": "fail",
                    "Comment": "duplicate event names"
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

module.exports.propUniqueness = checkPropUniqueness