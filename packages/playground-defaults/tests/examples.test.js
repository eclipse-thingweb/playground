/**
 * @file Uses all valid TD examples from the core package to test this package.
 *       Call the add defaults function with every TD and check if defaults-schema passes.
 *       Call the remove defaults function with every TD and check if defaults-schema throws warning.
 *       Make sure for both functions that the TD output is still valid JSON and valid TD-schema-without-default-checking
 */

const fs = require("fs")
const {addDefaults, removeDefaults} = require("../index.js")
const tdValidator = require("@thing-description-playground/core")

if (!fs.existsSync("./out")) {fs.mkdirSync("./out")}

const directory = "../playground-core/examples/tds/valid/"
const filenames = fs.readdirSync(directory)

describe("test if all valid TDs are properly EXTENDED by default values", () => {
    filenames.forEach( filename => {
        const td = JSON.parse(fs.readFileSync(directory + filename, "utf-8"))
        test("testAll testing: " + filename, () => {
            expect.assertions(3)
            addDefaults(td)
            const extendedTdString = JSON.stringify(td, undefined, 2)
            fs.writeFileSync("./out/" + filename.slice(0, -5) + "_extended.json", extendedTdString)

            return tdValidator(extendedTdString, ()=>{}, {checkJsonLd: false, checkDefaults: true}).then( result => {
                const report = result.report
                expect(report.json).toBe("passed")
                expect(report.schema).toBe("passed")
                expect(report.defaults).toBe("passed")
            })
        })
    })
})

describe("test if all valid TDs are properly REDUCED by set default values", () => {
    filenames.forEach( filename => {
        const td = JSON.parse(fs.readFileSync(directory + filename, "utf-8"))
        test("testAll testing: " + filename, () => {
            expect.assertions(3)
            removeDefaults(td)
            const reducedTdString = JSON.stringify(td, undefined, 2)
            fs.writeFileSync("./out/" + filename.slice(0, -5) + "_reduced.json", reducedTdString)

            return tdValidator(reducedTdString, ()=>{}, {checkJsonLd: false, checkDefaults: true}).then( result => {
                const report = result.report
                expect(report.json).toBe("passed")
                expect(report.schema).toBe("passed")
                expect(report.defaults).toBe("warning")
            })
        })
    })
})
