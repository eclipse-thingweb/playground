const jsonld = require("jsonld")
const Ajv = require("ajv")
const addFormats = require("ajv-formats")
const apply = require('ajv-formats-draft2019');

const coreAssertions = require("./shared")
const tdSchema = require("./td-schema.json")
const fullTdSchema = require("./td-schema-full.json")
const tmSchema = require("./tm-schema.json")

module.exports.tdValidator = tdValidator
module.exports.tmValidator = tmValidator
module.exports.propUniqueness = coreAssertions.checkPropUniqueness
module.exports.multiLangConsistency = coreAssertions.checkMultiLangConsistency
module.exports.checkLinksRelTypeCount = coreAssertions.checkLinksRelTypeCount
module.exports.security = coreAssertions.checkSecurity

const jsonValidator = require('json-dup-key-validator')

/**
 * A function that provides the core functionality of the TD Playground.
 * @param {string} tdString The Thing Description to check as a string.
 * @param {function} logFunc (string) => void; Callback used to log the validation progress.
 * @param {object} options additional options, which checks should be executed
 * @returns {Promise<object>} Results of the validation as {report, details, detailComments} object
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
        const report = {
            json: null,
            schema: null,
            defaults: null,
            jsonld: null,
            additional: null
        }
        // changing the two following objects implies adjusting the tests accordingly
        const details = {
            enumConst: null,
            propItems: null,
            security: null,
            propUniqueness: null,
            multiLangConsistency: null,
            linksRelTypeCount: null,
            readWriteOnly: null
        }

        const detailComments = {
            enumConst: "Checking whether a data schema has enum and const at the same time.",
            propItems: "Checking whether a data schema has an object but not properties or array but no items.",
            security: "Check if used Security definitions are properly defined previously.",
            propUniqueness: "Checking whether in one interaction pattern there are duplicate names, e.g. two properties called temp.",
            multiLangConsistency: "Checks whether all titles and descriptions have the same language fields.",
            linksRelTypeCount: "Checks whether rel:type is used more than once in the links array",
            readWriteOnly: "Warns if a property has readOnly or writeOnly set to true conflicting with another property."
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

            res({report, details, detailComments})
        }

        let ajv = new Ajv({strict: false}) // options can be passed, e.g. {allErrors: true}
        ajv = addFormats(ajv) // ajv does not support formats by default anymore
        ajv = apply(ajv) // new formats that include iri

        ajv.addSchema(tdSchema, 'td')
        const valid = ajv.validate('td', tdJson)
        // used to be var valid = ajv.validate('td', e.detail);
        if (valid) {

            report.schema = "passed"

            // check with full schema
            if (checkDefaults) {
                ajv.addSchema(fullTdSchema, 'fulltd')
                const fullValid = ajv.validate('fulltd', tdJson)
                if (fullValid) {
                    report.defaults = "passed"
                }
                else {
                    report.defaults = "warning"
                    logFunc("Optional validation failed:")
                    logFunc("> " + ajv.errorsText(filterErrorMessages(ajv.errors)))
                }
            }

            // do additional checks
            checkEnumConst(tdJson)
            checkPropItems(tdJson)
            checkReadWriteOnly(tdJson)
            details.security = evalAssertion(coreAssertions.checkSecurity(tdJson))
            details.propUniqueness = evalAssertion(coreAssertions.checkPropUniqueness(tdString))
            if (details.propUniqueness === "passed") {
                details.propUniqueness = checkSecPropUniqueness(tdString, tdJson)
            }
            else {
                checkSecPropUniqueness(tdString, tdJson)
            }
            details.multiLangConsistency = evalAssertion(coreAssertions.checkMultiLangConsistency(tdJson))
            details.linksRelTypeCount = evalAssertion(coreAssertions.checkLinksRelTypeCount(tdJson))

            // determine additional check state
            // passed + warning -> warning
            // passed AND OR warning + error -> error
            report.additional = "passed"
            Object.keys(details).forEach( prop => {
                if (details[prop] === "warning" && report.additional === "passed") {
                    report.additional = "warning"
                }
                else if (details[prop] === "failed" && report.additional !== "failed") {
                    report.additional = "failed"
                }
            })

        } else {

            report.schema = "failed"
            logFunc("X JSON Schema validation failed:")

            logFunc('> ' + ajv.errorsText(filterErrorMessages(ajv.errors)))

            res({report, details, detailComments})
        }

        // json ld validation
        if(checkJsonLd) {
            jsonld.toRDF(tdJson, {
                format: 'application/nquads'
            }).then( nquads => {
                report.jsonld = "passed"
                res({report, details, detailComments})
            }, err => {
                report.jsonld =  "failed"
                logFunc("X JSON-LD validation failed:")
                logFunc("Hint: Make sure you have internet connection available.")
                logFunc('> ' + err)
                res({report, details, detailComments})
            })
        }
        else {
            res({report, details, detailComments})
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

        /**
         * checking whether a data schema has object but not properties, array but no items
         * @param {object} td The TD under test
         */
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

        /**
         * Warns if a property has readOnly or writeOnly set to true conflicting with another property.
         * @param {object} td The TD under test
         */
        function checkReadWriteOnly(td) {
            details.readWriteOnly = "passed"

            if (td.hasOwnProperty("properties")) {
                // checking properties
                tdProperties = Object.keys(td.properties)
                for (let i = 0; i < tdProperties.length; i++) {
                    const curPropertyName = tdProperties[i]
                    const curProperty = td.properties[curPropertyName]

                    // if readOnly is set
                    if (curProperty.hasOwnProperty("readOnly") && curProperty.readOnly === true) {
                        // check if both readOnly and writeOnly are true
                        if (curProperty.hasOwnProperty("writeOnly") && curProperty.writeOnly === true) {
                            details.readWriteOnly = "warning"
                            logFunc('! Warning: In property ' + curPropertyName +
                                ', both readOnly and writeOnly are set to true!')
                        }

                        // check forms if op writeProperty is set
                        if (curProperty.hasOwnProperty("forms")) {
                            for(const formElIndex in curProperty.forms) {
                                if (curProperty.forms.hasOwnProperty(formElIndex)) {
                                    const formEl = curProperty.forms[formElIndex]
                                    if(formEl.hasOwnProperty("op")) {
                                        if ((typeof formEl.op === "string" && formEl.op === "writeproperty") ||
                                            (typeof formEl.op === "object" && formEl.op.some( el => (el === "writeproperty"))))
                                        {
                                            details.readWriteOnly = "warning"
                                            logFunc('! Warning: In property ' + curPropertyName + " in forms[" + formElIndex +
                                            '], readOnly is set but the op property contains "writeproperty"')
                                        }
                                    }
                                    else {
                                        details.readWriteOnly = "warning"
                                        logFunc('! Warning: In property ' + curPropertyName + " in forms[" + formElIndex +
                                        '], readOnly is set but a form op property defaults to ["writeproperty", "readproperty"]')
                                    }
                                }
                            }
                        }
                    }

                    // if writeOnly is set
                    if (curProperty.hasOwnProperty("writeOnly") && curProperty.writeOnly === true) {

                        // check forms if op readProperty is set
                        if (curProperty.hasOwnProperty("forms")) {
                            for(const formElIndex in curProperty.forms) {
                                if (curProperty.forms.hasOwnProperty(formElIndex)) {
                                    const formEl = curProperty.forms[formElIndex]
                                    if(formEl.hasOwnProperty("op")) {
                                        if ((typeof formEl.op === "string" && formEl.op === "readproperty") ||
                                            (typeof formEl.op === "object" && formEl.op.some( el => (el === "readproperty"))))
                                        {
                                            details.readWriteOnly = "warning"
                                            logFunc('! Warning: In property ' + curPropertyName + " in forms[" + formElIndex +
                                            '], writeOnly is set but the op property contains "readproperty"')
                                        }
                                        else if ((typeof formEl.op === "string" && formEl.op === "observeproperty") ||
                                                 (typeof formEl.op === "object" && formEl.op.some( el => (el === "observeproperty"))))
                                                 {
                                                    details.readWriteOnly = "warning"
                                                    logFunc('! Warning: In property ' + curPropertyName + " in forms[" + formElIndex +
                                                    '], writeOnly is set but the op property contains "observeproperty"')
                                                 }
                                    }
                                    else {
                                        details.readWriteOnly = "warning"
                                        logFunc('! Warning: In property ' + curPropertyName + " in forms[" + formElIndex +
                                        '], writeOnly is set but a form op property defaults to ["writeproperty", "readproperty"]')
                                    }
                                }
                            }
                        }

                        // check if observable is also set
                        if (curProperty.hasOwnProperty("observable") && curProperty.observable === true) {
                            details.readWriteOnly = "warning"
                            logFunc('! Warning: In property ' + curPropertyName +
                                ', both writeOnly and observable are set to true!')
                        }
                    }
                }
            }
        }

        /**
         * Warns if security Definitions has no unique keys
         * @param {object} tdStr The TD under test as string
         */
        function checkSecPropUniqueness(tdStr, td) {

            let result = "passed"
            try {
                // checking whether there are securityDefinitions at all
                jsonValidator.parse(tdStr, false)
            }
            catch (error) {
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
                const securitySchemeName = restString.slice(0, endQuote)

                if (td.securityDefinitions.hasOwnProperty(securitySchemeName)) {
                    result = "failed"
                    logFunc("KO Error: The securityDefinitions contain a duplicate")
                }
            }

            return result
        }

        /**
         * Evaluates whether an assertion function contains a failed check
         * Whether assertions are not-implemented or passed does not matter
         * Logs the comment
         * @param {Array} results Array of objects with props "ID", "Status" and optionally "Comment"
         * @returns "passed" if no check failed, "failed" if one or more checks failed
         */
        function evalAssertion(results) {
            let out = "passed"
            results.forEach( resultobj => {
                if (resultobj.Status === "fail") {
                    out = "failed"
                    logFunc("KO Error: Assertion: " + resultobj.ID)
                    logFunc(resultobj.Comment)
                }
            })
            return out
        }

        /**
         * Removes duplicate error messages, as these are produced
         * otherwise, especially for "oneOf" schemes
         * @param {ajv.ErrorObject[]} errors
         */
        function filterErrorMessages(errors) {

            const output = []
            errors.forEach( el => {
                if(!output.some(ce => (ce.dataPath === el.dataPath && ce.message === el.message))) {
                  output.push(el)
                }
            })
            return output
        }
    })
}

/**
 * A function that provides the core functionality of the TD Playground.
 * @param {string} tmString The Thing Model to check as a string.
 * @param {function} logFunc (string) => void; Callback used to log the validation progress.
 * @param {object} options additional options, which checks should be executed
 * @returns {Promise<object>} Results of the validation as {report, details, detailComments} object
 */
 function tmValidator(tmString, logFunc, { checkDefaults=true, checkJsonLd=true }) {
    return new Promise( (res, rej) => {

        // check input
        if (typeof tmString !== "string") {rej("Thing Model input should be a String")}

        if (checkDefaults === undefined) {
            checkDefaults = true
        }
        if (checkJsonLd === undefined) {
            checkJsonLd = true
        }
        if (typeof logFunc !== "function") {rej("Expected logFunc to be a function")}

        // report that is returned by the function, possible values for every property:
        // null -> not tested, "passed", "failed", "warning"
        const report = {
            json: null,
            schema: null,
            defaults: null,
            jsonld: null,
            additional: null
        }
        // changing the two following objects implies adjusting the tests accordingly
        const details = {
            enumConst: null,
            propItems: null,
            propUniqueness: null,
            multiLangConsistency: null,
            linksRelTypeCount: null,
            readWriteOnly: null
        }

        const detailComments = {
            enumConst: "Checking whether a data schema has enum and const at the same time.",
            propItems: "Checking whether a data schema has an object but not properties or array but no items.",
            propUniqueness: "Checking whether in one interaction pattern there are duplicate names, e.g. two properties called temp.",
            multiLangConsistency: "Checks whether all titles and descriptions have the same language fields.",
            linksRelTypeCount: "Checks whether rel:type is used more than once in the links array",
            readWriteOnly: "Warns if a property has readOnly or writeOnly set to true conflicting with another property."
        }

        let tmJson
        try {
            tmJson = JSON.parse(tmString)
            report.json = "passed"
        }
        catch (err) {
            report.json = "failed"
            logFunc("X JSON validation failed:")
            logFunc(err)

            res({report, details, detailComments})
        }

        let ajv = new Ajv({strict: false}) // options can be passed, e.g. {allErrors: true}
        ajv = addFormats(ajv) // ajv does not support formats by default anymore
        ajv = apply(ajv) // new formats that include iri

        ajv.addSchema(tmSchema, 'tm')
        const valid = ajv.validate('tm', tmJson)
        // used to be var valid = ajv.validate('td', e.detail);
        if (valid) {

            report.schema = "passed"

            //! No need to do defaults checking 
            // check with full schema
            // if (checkDefaults) {
            //     ajv.addSchema(fullTdSchema, 'fulltd')
            //     const fullValid = ajv.validate('fulltd', tmJson)
            //     if (fullValid) {
            //         report.defaults = "passed"
            //     }
            //     else {
            //         report.defaults = "warning"
            //         logFunc("Optional validation failed:")
            //         logFunc("> " + ajv.errorsText(filterErrorMessages(ajv.errors)))
            //     }
            // }

            // do additional checks
            checkEnumConst(tmJson)
            checkPropItems(tmJson)
            checkReadWriteOnly(tmJson)
            //! no need to do security checking
            // details.security = evalAssertion(coreAssertions.checkSecurity(tmJson))
            details.propUniqueness = evalAssertion(coreAssertions.checkPropUniqueness(tmString))
            if (details.propUniqueness === "passed") {
                details.propUniqueness = checkSecPropUniqueness(tmString, tmJson)
            }
            else {
                checkSecPropUniqueness(tmString, tmJson)
            }
            details.multiLangConsistency = evalAssertion(coreAssertions.checkMultiLangConsistency(tmJson))
            details.linksRelTypeCount = evalAssertion(coreAssertions.checkLinksRelTypeCount(tmJson))

            // determine additional check state
            // passed + warning -> warning
            // passed AND OR warning + error -> error
            report.additional = "passed"
            Object.keys(details).forEach( prop => {
                if (details[prop] === "warning" && report.additional === "passed") {
                    report.additional = "warning"
                }
                else if (details[prop] === "failed" && report.additional !== "failed") {
                    report.additional = "failed"
                }
            })

        } else {

            report.schema = "failed"
            logFunc("X JSON Schema validation failed:")

            logFunc('> ' + ajv.errorsText(filterErrorMessages(ajv.errors)))

            res({report, details, detailComments})
        }

        // json ld validation
        if(checkJsonLd) {
            jsonld.toRDF(tmJson, {
                format: 'application/nquads'
            }).then( nquads => {
                report.jsonld = "passed"
                res({report, details, detailComments})
            }, err => {
                report.jsonld =  "failed"
                logFunc("X JSON-LD validation failed:")
                logFunc("Hint: Make sure you have internet connection available.")
                logFunc('> ' + err)
                res({report, details, detailComments})
            })
        }
        else {
            res({report, details, detailComments})
        }


        // ************ functions ***************

        /** checking whether a data schema has enum and const at the same and displaying a warning in case there are */
        function checkEnumConst(tm) {
            details.enumConst = "passed"
            if (tm.hasOwnProperty("properties")) {
                // checking properties
                tmProperties = Object.keys(tm.properties)
                for (let i = 0; i < tmProperties.length; i++) {
                    const curPropertyName = tmProperties[i]
                    const curProperty = tm.properties[curPropertyName]
                    if (curProperty.hasOwnProperty("enum") && curProperty.hasOwnProperty("const")) {
                        details.enumConst = "warning"
                        logFunc('! Warning: In property ' + curPropertyName +
                            ' enum and const are used at the same time, the values in enum' +
                            ' can never be valid in the received JSON value')
                    }
                }
            }
            // checking actions
            if (tm.hasOwnProperty("actions")) {
                tmActions = Object.keys(tm.actions)
                for (let i = 0; i < tmActions.length; i++) {
                    const curActionName = tmActions[i]
                    const curAction = tm.actions[curActionName]
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
            if (tm.hasOwnProperty("events")) {
                tmEvents = Object.keys(tm.events)
                for (let i = 0; i < tmEvents.length; i++) {
                    const curEventName = tmEvents[i]
                    const curEvent = tm.events[curEventName]
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

        /**
         * checking whether a data schema has object but not properties, array but no items
         * @param {object} tm The TD under test
         */
        function checkPropItems(tm) {
            details.propItems = "passed"

            if (tm.hasOwnProperty("properties")) {
                // checking properties
                tmProperties = Object.keys(tm.properties)
                for (let i = 0; i < tmProperties.length; i++) {
                    const curPropertyName = tmProperties[i]
                    const curProperty = tm.properties[curPropertyName]

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
            if (tm.hasOwnProperty("actions")) {
                tmActions = Object.keys(tm.actions)
                for (let i = 0; i < tmActions.length; i++) {
                    const curActionName = tmActions[i]
                    const curAction = tm.actions[curActionName]

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
            if (tm.hasOwnProperty("events")) {
                tmEvents = Object.keys(tm.events)
                for (let i = 0; i < tmEvents.length; i++) {
                    const curEventName = tmEvents[i]
                    const curEvent = tm.events[curEventName]

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

        /**
         * Warns if a property has readOnly or writeOnly set to true conflicting with another property.
         * @param {object} tm The TD under test
         */
        function checkReadWriteOnly(tm) {
            details.readWriteOnly = "passed"

            if (tm.hasOwnProperty("properties")) {
                // checking properties
                tmProperties = Object.keys(tm.properties)
                for (let i = 0; i < tmProperties.length; i++) {
                    const curPropertyName = tmProperties[i]
                    const curProperty = tm.properties[curPropertyName]

                    // if readOnly is set
                    if (curProperty.hasOwnProperty("readOnly") && curProperty.readOnly === true) {
                        // check if both readOnly and writeOnly are true
                        if (curProperty.hasOwnProperty("writeOnly") && curProperty.writeOnly === true) {
                            details.readWriteOnly = "warning"
                            logFunc('! Warning: In property ' + curPropertyName +
                                ', both readOnly and writeOnly are set to true!')
                        }

                        // check forms if op writeProperty is set
                        if (curProperty.hasOwnProperty("forms")) {
                            for(const formElIndex in curProperty.forms) {
                                if (curProperty.forms.hasOwnProperty(formElIndex)) {
                                    const formEl = curProperty.forms[formElIndex]
                                    if(formEl.hasOwnProperty("op")) {
                                        if ((typeof formEl.op === "string" && formEl.op === "writeproperty") ||
                                            (typeof formEl.op === "object" && formEl.op.some( el => (el === "writeproperty"))))
                                        {
                                            details.readWriteOnly = "warning"
                                            logFunc('! Warning: In property ' + curPropertyName + " in forms[" + formElIndex +
                                            '], readOnly is set but the op property contains "writeproperty"')
                                        }
                                    }
                                    else {
                                        details.readWriteOnly = "warning"
                                        logFunc('! Warning: In property ' + curPropertyName + " in forms[" + formElIndex +
                                        '], readOnly is set but a form op property defaults to ["writeproperty", "readproperty"]')
                                    }
                                }
                            }
                        }
                    }

                    // if writeOnly is set
                    if (curProperty.hasOwnProperty("writeOnly") && curProperty.writeOnly === true) {

                        // check forms if op readProperty is set
                        if (curProperty.hasOwnProperty("forms")) {
                            for(const formElIndex in curProperty.forms) {
                                if (curProperty.forms.hasOwnProperty(formElIndex)) {
                                    const formEl = curProperty.forms[formElIndex]
                                    if(formEl.hasOwnProperty("op")) {
                                        if ((typeof formEl.op === "string" && formEl.op === "readproperty") ||
                                            (typeof formEl.op === "object" && formEl.op.some( el => (el === "readproperty"))))
                                        {
                                            details.readWriteOnly = "warning"
                                            logFunc('! Warning: In property ' + curPropertyName + " in forms[" + formElIndex +
                                            '], writeOnly is set but the op property contains "readproperty"')
                                        }
                                        else if ((typeof formEl.op === "string" && formEl.op === "observeproperty") ||
                                                 (typeof formEl.op === "object" && formEl.op.some( el => (el === "observeproperty"))))
                                                 {
                                                    details.readWriteOnly = "warning"
                                                    logFunc('! Warning: In property ' + curPropertyName + " in forms[" + formElIndex +
                                                    '], writeOnly is set but the op property contains "observeproperty"')
                                                 }
                                    }
                                    else {
                                        details.readWriteOnly = "warning"
                                        logFunc('! Warning: In property ' + curPropertyName + " in forms[" + formElIndex +
                                        '], writeOnly is set but a form op property defaults to ["writeproperty", "readproperty"]')
                                    }
                                }
                            }
                        }

                        // check if observable is also set
                        if (curProperty.hasOwnProperty("observable") && curProperty.observable === true) {
                            details.readWriteOnly = "warning"
                            logFunc('! Warning: In property ' + curPropertyName +
                                ', both writeOnly and observable are set to true!')
                        }
                    }
                }
            }
        }

        /**
         * Warns if security Definitions has no unique keys
         * @param {object} tmStr The TD under test as string
         */
        function checkSecPropUniqueness(tmStr, tm) {

            let result = "passed"
            try {
                // checking whether there are securityDefinitions at all
                jsonValidator.parse(tmStr, false)
            }
            catch (error) {
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
                const securitySchemeName = restString.slice(0, endQuote)

                if (td.securityDefinitions.hasOwnProperty(securitySchemeName)) {
                    result = "failed"
                    logFunc("KO Error: The securityDefinitions contain a duplicate")
                }
            }

            return result
        }

        /**
         * Evaluates whether an assertion function contains a failed check
         * Whether assertions are not-implemented or passed does not matter
         * Logs the comment
         * @param {Array} results Array of objects with props "ID", "Status" and optionally "Comment"
         * @returns "passed" if no check failed, "failed" if one or more checks failed
         */
        function evalAssertion(results) {
            let out = "passed"
            results.forEach( resultobj => {
                if (resultobj.Status === "fail") {
                    out = "failed"
                    logFunc("KO Error: Assertion: " + resultobj.ID)
                    logFunc(resultobj.Comment)
                }
            })
            return out
        }

        /**
         * Removes duplicate error messages, as these are produced
         * otherwise, especially for "oneOf" schemes
         * @param {ajv.ErrorObject[]} errors
         */
        function filterErrorMessages(errors) {

            const output = []
            errors.forEach( el => {
                if(!output.some(ce => (ce.dataPath === el.dataPath && ce.message === el.message))) {
                  output.push(el)
                }
            })
            return output
        }
    })
}

