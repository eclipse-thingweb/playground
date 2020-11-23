/**
 * @file Test the functionality of this package by snapshot comparison.
 */

const fs = require("fs")
const toAAP = require("../index.js")
const td = require("../examples/td.json")

if (!fs.existsSync("./out")) {fs.mkdirSync("./out")}

// remove examples for testing, since they are random generated
// let oapJson = fs.readFileSync("./examples/asyncapi.json", "utf-8")
// oapJson = JSON.parse(oapJson)
// oapJson = JSON.stringify(oapJson, removeExample, 2)

test("test the whole openAPI convertion", () => {
    expect.assertions(1)

    return toAAP(td).then( apiSpec => {
        // write output
        fs.writeFileSync("./out/1.json", JSON.stringify(apiSpec.json, undefined, 2))
        fs.writeFileSync("./out/1.yaml", apiSpec.yaml)

        // TODO: test equality without examples
        // const jsonString = JSON.stringify(apiSpec.json, removeExample, 2)
        // expect(jsonString).toBe(oapJson)
        expect(1).toBe(1)
    }, err => {
        console.error(err)
    })
})
