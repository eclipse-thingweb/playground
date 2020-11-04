const fs = require("fs")
const addDefaults = require("../index.js")
const td = require("../examples/td.json")

if (!fs.existsSync("./out")) {fs.mkdirSync("./out")}

const referenceOutput = JSON.parse(fs.readFileSync("./examples/openapi.json", "utf-8"))

test("test the whole openAPI convertion", () => {
    expect.assertions(1)

    return addDefaults(td).then( extendedTd => {
        // write output to be able to compare it to reference
        fs.writeFileSync("./out/1_example.json", JSON.stringify(extendedTd, undefined, 2))

        expect(extendedTd).toEqual(referenceOutput)
    }, err => {
        console.error(err)
    })
})
