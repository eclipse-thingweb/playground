/**
 * @file test if all valid TDs (core-package->examples->valid) are converted to valid openAPI instances
 *       (td_to_openAPI) validates against openAPI specification before returning the result.
 *       Finally writeout the resulting OAP instance to "./out".
 */

const fs = require("fs")
const toOAP = require("../index.js")

if (!fs.existsSync("./out")) {fs.mkdirSync("./out")}

const directory = "../playground-core/examples/tds/valid/"
const filenames = fs.readdirSync(directory)
const all = filenames.length

describe("test if all valid TDs are converted to valid openAPI instances", () => {
    filenames.forEach( filename => {
        const td = JSON.parse(fs.readFileSync(directory + filename, "utf-8"))
        test("testAll testing: " + filename, () => {
            return toOAP(td).then( apiSpec => {
                fs.writeFileSync("./out/" + filename.slice(0, -5) + "_openapi.json", JSON.stringify(apiSpec.json, undefined, 2))
                expect(apiSpec).toEqual(expect.any(Object))
            })
        })
    })
})
