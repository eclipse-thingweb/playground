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
            security: null
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
            // TODO: Handle long error messages in case of oneOf
            logFunc('> ' + ajv.errorsText())
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
    })
}

module.exports = tdValidator