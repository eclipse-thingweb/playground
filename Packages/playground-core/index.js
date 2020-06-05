/**
 * Core functionality of the Thing Description Playground
 */

const jsonld = require("jsonld")
const Ajv = require("ajv")


/**
 * A function that provides the core functionality of the TD Playground.
 * @param {string} tdString The Thing Description to check as a string.
 * @param {string} tdSchema The JSON Schema that defines a correct TD.
 */
function tdValidator(tdString, tdSchema, tdFullSchema, checkJsonLd = true) {
    return new Promise( (res, rej) => {

        // check input
        if (typeof tdString !== "string") {rej("Thing Description input should be a String")}
        if (typeof tdSchema !== "string") {rej("TD Schema input value was no String")}
        if (typeof tdFullSchema !== "string") {rej("TD full Schema should be a string")}

        // report that is returned by the function, possible values for every property:
        // null -> not tested, "passed", "failed", "warning"
        // console is an array of strings
        const report = {
            json: null,
            schema: null,
            defaults: null,
            jsonld: null,
            additional: {
                state: null,
                detail: {
                    enumConst: null,
                    propItems: null,
                    interactions: null,
                    security: null
                }
            },
            console: []
        }

        let tdJson
        try {
            tdJson = JSON.parse(tdString)
            report.json = "passed"
        }
        catch (err) {
            report.json = "failed"
            report.console.push("X JSON validation failed:")
            report.console.push(err)
            res(report)
        }

        // JSON Schema check
        if (tdJson.hasOwnProperty('properties') || tdJson.hasOwnProperty('actions') || tdJson.hasOwnProperty('events')) {
            if (!tdJson.hasOwnProperty('base')) {
                // no need to do something. Each href should be absolute
                report.console.push(':) Tip: Without base, each href should be an absolute URL')
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
            const fullschema = JSON.parse(tdFullSchema)
            ajv.addSchema(fullschema, 'fulltd')
            const fullValid = ajv.validate('fulltd', tdJson)
            if (fullValid) {
                report.defaults = "passed"
            }
            else {
                report.defaults = "warning"
                report.console.push("Optional validation failed:")
                report.console.push("> " + ajv.errorsText())
            }

            // do additional checks
            checkEnumConst(tdJson)
            checkPropItems(tdJson)
            checkInteractions(tdJson)
            checkSecurity(tdJson)

            // determine additional check state
            // passed + warning -> warning
            // passed AND OR warning + error -> error
            report.additional.state = "passed"
            Object.keys(report.additional.detail).forEach( prop => {
                if (report.additional.detail[prop] === "warning" && report.additional.state === "passed") {
                    report.additional.state = "warning"
                }
                else if (report.additional.detail[prop] === "failed" && report.additional.state !== "failed") {
                    report.additional.state = "failed"
                }
            })

        } else {

            report.schema = "failed"
            report.console.push = "X JSON Schema validation failed:"
            // TODO: Handle long error messages in case of oneOf
            report.console.push('> ' + ajv.errorsText())
        }

        // json ld validation
        if(checkJsonLd) {
            jsonld.toRDF(tdJson, {
                format: 'application/nquads'
            }).then( nquads => {
                report.jsonld = "passed"
                res(report)
            }, err => {
                report.jsonld =  "failed"
                report.console.push("X JSON-LD validation failed:")
                report.console.push("Hint: Make sure you have internet connection available.")
                report.console.push('> ' + err)
                res(report)
            })
        }
        else {
            res(report)
        }


        // ************ functions ***************

        /** checking whether a data schema has enum and const at the same and displaying a warning in case there are */
        function checkEnumConst(td) {
            report.additional.detail.enumConst = "passed"
            if (td.hasOwnProperty("properties")) {
                // checking properties
                tdProperties = Object.keys(td.properties)
                for (let i = 0; i < tdProperties.length; i++) {
                    const curPropertyName = tdProperties[i]
                    const curProperty = td.properties[curPropertyName]
                    if (curProperty.hasOwnProperty("enum") && curProperty.hasOwnProperty("const")) {
                        report.additional.detail.enumConst = "warning"
                        report.console.push('! Warning: In property ' + curPropertyName +
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
                            report.additional.detail.enumConst = "warning"
                            report.console.push('! Warning: In the input of action ' + curActionName +
                                ' enum and const are used at the same time, the values in enum can' +
                                ' never be valid in the received JSON value')
                        }
                    }
                    if (curAction.hasOwnProperty("output")) {
                        const curOutput = curAction.output
                        if (curOutput.hasOwnProperty("enum") && curOutput.hasOwnProperty("const")) {
                            report.additional.detail.enumConst = "warning"
                            report.console.push('! Warning: In the output of action ' + curActionName +
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
                        report.additional.detail.enumConst = "warning"
                        report.console.push('! Warning: In event ' + curEventName +
                            ' enum and const are used at the same time, the' +
                            ' values in enum can never be valid in the received JSON value')
                    }
                }
            }
            return
        }

        /** checking whether a data schema has object but not properties, array but no items */
        function checkPropItems(td) {
            report.additional.detail.propItems = "passed"

            if (td.hasOwnProperty("properties")) {
                // checking properties
                tdProperties = Object.keys(td.properties)
                for (let i = 0; i < tdProperties.length; i++) {
                    const curPropertyName = tdProperties[i]
                    const curProperty = td.properties[curPropertyName]

                    if (curProperty.hasOwnProperty("type")) {
                        if ((curProperty.type === "object") && !(curProperty.hasOwnProperty("properties"))) {
                            report.additional.detail.propItems = "warning"
                            report.console.push('! Warning: In property ' + curPropertyName +
                                ', the type is object but its properties are not specified')
                        }
                        if ((curProperty.type === "array") && !(curProperty.hasOwnProperty("items"))) {
                            report.additional.detail.propItems = "warning"
                            report.console.push('! Warning: In property ' + curPropertyName +
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
                                report.additional.detail.propItems = "warning"
                                report.console.push('! Warning: In the input of action ' + curActionName +
                                    ', the type is object but its properties are not specified')
                            }
                            if ((curInput.type === "array") && !(curInput.hasOwnProperty("items"))) {
                                report.additional.detail.propItems = "warning"
                                report.console.push('! Warning: In the output of action ' + curActionName +
                                    ', the type is array but its items are not specified')
                            }
                        }
                    }
                    if (curAction.hasOwnProperty("output")) {
                        const curOutput = curAction.output
                        if (curOutput.hasOwnProperty("type")) {
                            if ((curOutput.type === "object") && !(curOutput.hasOwnProperty("properties"))) {
                                report.additional.detail.propItems = "warning"
                                report.console.push('! Warning: In the output of action ' + curActionName +
                                    ', the type is object but its properties are not specified')
                            }
                            if ((curOutput.type === "array") && !(curOutput.hasOwnProperty("items"))) {
                                report.additional.detail.propItems = "warning"
                                report.console.push('! Warning: In the output of action ' + curActionName +
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
                            report.additional.detail.propItems = "warning"
                            report.console.push('! Warning: In event ' + curEventName +
                                ', the type is object but its properties are not specified')
                        }
                        if ((curEvent.type === "array") && !(curEvent.hasOwnProperty("items"))) {
                            report.additional.detail.propItems = "warning"
                            report.console.push('! Warning: In event ' + curEventName +
                                ', the type is array but its items are not specified')

                        }
                    }

                }
            }
            return
        }

        /** checking whether the td contains interactions field that is remaining from the previous spec */
        function checkInteractions(td) {
            report.additional.detail.interactions = "passed"
            if (td.hasOwnProperty("interactions")) {
                report.additional.detail.interactions = "warning"
                report.console.push('! Warning: interactions are from the previous TD Specification, ' +
                    'please use properties, actions, events instead')
            }
            if (td.hasOwnProperty("interaction")) {
                report.additional.detail.interactions = "warning"
                report.console.push('! Warning: interaction are from the previous TD Specification, ' +
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
            report.additional.detail.security = "passed"

            if (td.hasOwnProperty("securityDefinitions")) {
                const securityDefinitionsObject = td.securityDefinitions
                const securityDefinitions = Object.keys(securityDefinitionsObject)
                const rootSecurity = td.security

                if (securityContains(securityDefinitions, rootSecurity)) {
                    // all good
                } else {
                    report.additional.detail.security = "failed"
                    report.console.push('KO Error: Security key in the root of the TD' +
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
                                    report.additional.detail.security = "failed"
                                    report.console.push('KO Error: Security key in form ' + j +
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
                                    report.additional.detail.security = "failed"
                                    report.console.push('KO Error: Security key in form ' + j +
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
                                    report.additional.detail.security = "failed"
                                    report.console.push('KO Error: Security key in form ' + j +
                                        ' in event ' + curEventName +
                                        '  has security schemes not defined by the securityDefinitions')
                                }
                            }
                        }

                    }
                }
            } else {
                report.additional.detail.security = "failed"
                report.console.push('KO Error: securityDefinitions is mandatory')
            }
            return
        }
    })
}

module.exports = tdValidator