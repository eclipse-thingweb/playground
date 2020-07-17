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

const coreAssertions = require("./core-assertions")
const schema = require("./td-schema.json")
const fullschema = require("./td-schema-full.json")

module.exports = tdValidator
module.exports.propUniqueness = coreAssertions.checkPropUniqueness
module.exports.multiLangConsistency = coreAssertions.checkMultiLangConsistency
module.exports.security = coreAssertions.checkSecurity


/**
 * A function that provides the core functionality of the TD Playground.
 * @param {string} tdString The Thing Description to check as a string.
 * @param {function} logFunc (string) => void; Callback used to log the validation progress.
 * @param {object} options additional options, which checks should be executed
 */
function tdValidator(tdString, logFunc, { checkDefaults=true, checkJsonLd=true }) {
    return new Promise( (res, rej) => {

        // check input
        if (typeof tdString !== "string") {rej("Thing Description input should be a String")}

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
            propUniqueness: null,
            multiLangConsistency: null
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

        const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
        ajv.addSchema(schema, 'td')
        const valid = ajv.validate('td', tdJson)
        // used to be var valid = ajv.validate('td', e.detail);
        if (valid) {

            report.schema = "passed"

            // check with full schema
            if (checkDefaults) {
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
            checkInteractionUniqueness(tdJson)
            details.security = evalAssertion(coreAssertions.checkSecurity(tdJson))
            details.propUniqueness = evalAssertion(coreAssertions.checkPropUniqueness(tdString))
            details.multiLangConsistency = evalAssertion(coreAssertions.checkMultiLangConsistency(tdJson))

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
         * TODO: check whether still needed, since
         * takes character number and gives out the line number
         * @param {number} characterNo character Number (can be )
         * @param {string} str whole String
         */
        // function getLineNumber(characterNo,str)
        // {
        //     const charsPerLine=[]
        //     const str2lines=str.split("\n")

        //     // calculate number of characters in each line
        //     str2lines.forEach( (value, index) => {
        //         const strVal = String(value)
        //         charsPerLine.push(strVal.length)
        //         characterNo++
        //     })

        //     // $.each(str2lines,function(index,value){
        //     //     const strVal = String(value)
        //     //     charsPerLine.push(strVal.length)
        //     //     characterNo++
        //     // })

        //     // find the line containing that characterNo
        //     let count=0
        //     let lineNo=0
        //     while(characterNo>count)
        //     {
        //         count+=charsPerLine[lineNo]
        //         lineNo++
        //     }
        //     return lineNo
        // }

        /**
         * Evaluates whether an assertion function contains a failed check
         * Whether assertions are not-implemented or passed does not matter
         * Logs the comment
         * @param {Array} results Array of objects with props "ID", "Status" and optionally "Comment"
         * @returns "passed" if no check failed, "failed" if one or more checks failed
         */
        function evalAssertion(results) {
            let eval = "passed"
            results.forEach( resultobj => {
                if (resultobj.Status === "fail") {
                    eval = "failed"
                    logFunc("KO Error: Assertion: " + resultobj.ID)
                    logFunc(resultobj.Comment)
                }
            })
            return eval
        }
    })
}



