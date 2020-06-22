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

/**
 * CLI interface for the Thing Description Playground
 */
const fs = require('fs')
const path = require('path')
const tdValidator = require('playground-core')
let tdToCheck = ""

const tdSchemaPath = path.join("node_modules", "playground-core", "td-schema.json")
const tdFullSchemaPath = path.join("node_modules", "playground-core", "td-schema-full.json")

const tdSchema = fs.readFileSync(tdSchemaPath,"utf-8")
const tdSchemaFull = fs.readFileSync(tdFullSchemaPath, "utf-8")

// handle input argument
let input = process.argv[2]
if (!input) {input = path.join("node_modules", "playground-core", "examples")}
if(fs.lstatSync(input).isDirectory()) {

    // check Valid, Invalid and Warning Subfolders
    const validPath = path.join(input, "valid")
    if (fs.existsSync(validPath) && fs.lstatSync(validPath).isDirectory()) {
        console.log("Starting Valid folder test")
        const validNames = fs.readdirSync(validPath)
        let validCount = 0
        const checkPromises = []
        validNames.forEach( el => {
            if (el.endsWith(".json") || el.endsWith(".jsonld")) {
                tdToCheck = fs.readFileSync(path.join(validPath, el), "utf-8")
                const thisProm = tdValidator(tdToCheck, tdSchema, tdSchemaFull, console.log, {checkDefaults: false})
                .then( result => {
                    if (statResult("failed", result.report)) {
                        console.log(el, "was supposed to be valid but gave error")
                        // result.console.forEach( line => {console.log(line)} )
                    } else if (statResult("warning", result.report)) {
                        console.log(el, "was supposed to be valid but gave warning")
                        // result.console.forEach( line => {console.log(line)} )
                    } else {
                        validCount++
                    }
                }, err => {
                    console.error("ERROR", err)
                })
                checkPromises.push(thisProm)
            }
        })
        Promise.all(checkPromises).then( () => {
            if (validNames.length === 0) {
                console.log("No valid TD to check has been found")
            }
            else if (validNames.length === validCount) {
                console.log("Validity test succesful. All TDs that are supposed to be valid are indeed valid")
            }
            else {
                console.log("Validity test NOT successful, ", validCount, "/", validNames.length, "passed the validity test")
            }
        }, err => {console.error("Valid TD Check broken!")})
    }

    const invalidPath = path.join(input, "invalid")
    if (fs.existsSync(invalidPath) && fs.lstatSync(invalidPath).isDirectory()) {
        console.log("Starting invalid folder test")
        const invalidNames = fs.readdirSync(invalidPath)
        let invalidCount = 0
        const checkPromises = []
        invalidNames.forEach( el => {
            if (el.endsWith(".json") || el.endsWith(".jsonld")) {
                tdToCheck = fs.readFileSync(path.join(invalidPath, el), "utf-8")
                const thisProm = tdValidator(tdToCheck, tdSchema, tdSchemaFull, console.log, {checkDefaults: false})
                .then( result => {
                    if (statResult("failed", result.report)) {
                        invalidCount++
                    } else {
                        console.log(el, "was supposed to be invalid but was not")
                    }
                }, err => {
                    console.error("ERROR", err)
                })
                checkPromises.push(thisProm)
            }
        })
        Promise.all(checkPromises).then( () => {
            if (invalidNames.length === 0) {
                console.log("No invalid TD to check has been found")
            }
            else if (invalidNames.length === invalidCount) {
                console.log("Invalidity test succesful. All TDs that are supposed to be invalid are indeed valid")
            }
            else {
                console.log("Invalidity test NOT successful, ", invalidCount, "/", invalidNames.length, "passed the invalidity test")
            }
        }, err => {console.error("Invalid TD Check broken!")})
    }

    const warnPath = path.join(input, "warning")
    if (fs.existsSync(warnPath) && fs.lstatSync(warnPath).isDirectory()) {
        console.log("Starting Warning folder test")
        const warnNames = fs.readdirSync(warnPath)
        let warnCount = 0
        const checkPromises = []
        warnNames.forEach( el => {
            if (el.endsWith(".json") || el.endsWith(".jsonld")) {
                tdToCheck = fs.readFileSync(path.join(warnPath, el), "utf-8")
                const thisProm = tdValidator(tdToCheck, tdSchema, tdSchemaFull, console.log, {checkDefaults: false})
                .then( result => {
                    if (statResult("failed", result.report)) {
                        console.log(el, "was supposed to give a warning but gave error")
                        // result.console.forEach( line => {console.log(line)} )
                    } else if (statResult("warning", result.report)) {
                        warnCount++
                    } else {
                        console.log(el, "was supposed to be valid but passed all the tests")
                        // result.console.forEach( line => {console.log(line)} )
                    }
                }, err => {
                    console.error("ERROR", err)
                })
                checkPromises.push(thisProm)
            }
        })
        Promise.all(checkPromises).then( () => {
            if (warnNames.length === 0) {
                console.log("No warning TD to check has been found")
            }
            else if (warnNames.length === warnCount) {
                console.log("Warning test succesful. All TDs that are supposed to give a warning gave a warning")
            }
            else {
                console.log("Warning test NOT successful, ", warnCount, "/", warnNames.length, "passed the validity test")
            }
        }, err => {console.error("Warning TD Check broken!")})
    }

    // check TDs contained in the directory
    fs.readdirSync(input).forEach( el => {
        if (el.endsWith(".json") || el.endsWith(".jsonld")) {
            tdToCheck = fs.readFileSync(path.join(input, el), "utf-8")
            checkTd(tdToCheck)
        }
    })

}
else {
    tdToCheck = fs.readFileSync(input, "utf-8")
    checkTd(tdToCheck)
}

function checkTd(td) {
    tdValidator(td, tdSchema, tdSchemaFull, console.log,{})
    .then( result => {
        console.log("OKAY \n")
        // result.console.forEach(el => {
        //    console.log(el)
        // })
        console.log("\n")
        // delete result.console
        console.log("--- Report ---\n", result, "\n--------------")
    }, err => {
        console.log("ERROR")
        console.error(err)
    })
}

function statResult(keyword, report) {
    return (report.json === keyword
    || report.schema === keyword
    || report.defaults === keyword
    || report.jsonld === keyword
    || report.additional.state === keyword)
}