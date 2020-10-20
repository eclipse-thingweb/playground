const fs = require("fs")
const toOAP = require("../index.js")
const td = require("../examples/td.json")

if (!fs.existsSync("./out")) {fs.mkdirSync("./out")}
const removeExample = (key, value) => ((key === "example") ? undefined : value)

// remove examples for testing, since they are random generated
let oapJson = fs.readFileSync("./examples/openapi.json", "utf-8")
oapJson = JSON.parse(oapJson)
oapJson = JSON.stringify(oapJson, removeExample, 2)

test("test the whole openAPI convertion", () => {
    expect.assertions(1)

    return toOAP(td).then( apiSpec => {
        // write output
        fs.writeFileSync("./out/1.json", JSON.stringify(apiSpec.json, undefined, 2))
        fs.writeFileSync("./out/1.yaml", apiSpec.yaml)

        // test equality without examples
        const jsonString = JSON.stringify(apiSpec.json, removeExample, 2)
        expect(jsonString).toBe(oapJson)
    }, err => {
        console.error(err)
    })
})
